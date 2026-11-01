import fs from 'node:fs';
import vm from 'node:vm';

export const readSource = file => fs.readFileSync(new URL('../../' + file, import.meta.url), 'utf8');

export function createFormatPage() {
    const nodes = new Map();
    const formats = [];
    let config;
    const node = id => {
        if (!nodes.has(id)) nodes.set(id, {innerHTML: '', textContent: '', style: {}});
        return nodes.get(id);
    };
    function $(selector) {
        const el = typeof selector === 'string' && /^#[\w-]+$/.test(selector)
            ? node(selector.slice(1)) : {innerHTML: '', textContent: '', style: {}};
        const wrapper = new Proxy({0: el, length: 1}, {
            get(target, name) {
                if (name in target) return target[name];
                if (name === 'html' || name === 'text') return value => {
                    const key = name === 'html' ? 'innerHTML' : 'textContent';
                    if (value === undefined) return el[key];
                    el[key] = typeof value === 'string' ? value : value[0].innerHTML;
                    return wrapper;
                };
                if (name === 'show' || name === 'hide') return () => {
                    el.style.display = name === 'hide' ? 'none' : '';
                    return wrapper;
                };
                if (name === 'empty') return () => { el.innerHTML = ''; el.textContent = ''; return wrapper; };
                return () => wrapper;
            }
        });
        return wrapper;
    }
    const context = vm.createContext({
        console, $, Blob, setTimeout, clearTimeout,
        location: {protocol: 'https:'},
        localStorage: {getItem: () => null},
        document: {
            querySelector: selector => /^#[\w-]+$/.test(selector) ? node(selector.slice(1)) : null,
            addEventListener() {}
        },
        Vue: function(options) { config = options; },
        createInlineAiState: () => ({}),
        canBuildTableViewData: () => false
    });
    context.window = context;
    for (const file of ['json-auto-utils.js', 'json-decode.js', 'format-lib.js']) {
        vm.runInContext(readSource('apps/json-format/' + file), context);
    }
    vm.runInContext(readSource('apps/json-format/index.js').replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, ''), context);
    const app = {...config.data, $nextTick: callback => callback()};
    for (const [name, method] of Object.entries(config.methods)) app[name] = method.bind(app);
    node('pageContainer').__vue__ = app;
    context.JsonEnDecode.urlDecodeByFetch = async source => source;
    const format = context.Formatter.format;
    context.Formatter.format = (...args) => { const pending = format(...args); formats.push(pending); return pending; };
    vm.runInContext('editor = {getValue: () => window.source};', context);
    return {app, node, context, formats, async format(source) {
        context.source = source;
        formats.length = 0;
        const ok = app.format();
        await Promise.resolve();
        await Promise.all(formats);
        return ok;
    }};
}

export async function flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
