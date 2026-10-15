import fs from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const read = file => fs.readFileSync(file, 'utf8');

// Use the shipped Vue, with string compilation disabled like MV3. No DOM or
// chrome API stubs are used as evidence of extension integration (browser QA
// covers that); this checks actual Vue VNodes and their event handlers.
function makePopup(data = {}) {
    const context = vm.createContext({ console, setTimeout, clearTimeout }, {
        codeGeneration: { strings: false, wasm: false }
    });
    vm.runInContext(read('apps/static/vendor/vue/vue.js'), context);
    vm.runInContext(read('apps/popup/render.js').replace('export default ', ''), context);
    const source = read('apps/popup/index.js')
        .replace(/^import .*$/gm, '')
        .replace('new Vue({', 'globalThis.popupOptions = ({');
    vm.runInContext(source, context);
    context.seed = data;
    vm.runInContext(`
        delete popupOptions.el;
        delete popupOptions.created;
        delete popupOptions.mounted;
        popupOptions.data = Object.assign({}, popupOptions.data, seed);
        globalThis.popup = new Vue(popupOptions);
    `, context);
    return { popup: context.popup, context };
}

function nodes(root, predicate) {
    return (predicate(root) ? [root] : []).concat(
        ...(root.children || []).map(child => nodes(child, predicate))
    );
}
function classNames(value) {
    if (Array.isArray(value)) return value.flatMap(classNames);
    if (typeof value === 'string') return value.split(' ');
    return Object.keys(value || {}).filter(key => value[key]);
}
const byClass = name => node => classNames(node.data?.staticClass).concat(classNames(node.data?.class)).includes(name);
const tools = {
    'json-format': { installed: true, name: 'JSON格式化' },
    timestamp: { installed: true, name: '时间戳转换' }
};

describe('popup rendering under MV3 CSP', () => {
    it('mount path supplies a render function without dynamic compilation', () => {
        const { popup, context } = makePopup({ isLoading: false, fhTools: tools });
        expect(() => vm.runInContext('new Function("return 1")', context)).toThrow();
        const tree = popup._render();
        expect(tree.tag).toBe('div');
        expect(tree.data.attrs.id).toBe('pageContainer');
        expect(nodes(tree, byClass('fh-tool-row'))).toHaveLength(2);
        expect(nodes(tree, n => n.tag === 'footer')).toHaveLength(1);
    });

    it('keeps tool click and mode switch handlers functional', () => {
        const { popup } = makePopup({ isLoading: false, fhTools: tools });
        const opened = [];
        popup.runHelper = key => opened.push(key);
        popup.setUiMode = mode => { popup.uiMode = mode; };
        const tree = popup._render();
        nodes(tree, byClass('fh-tool-row'))[1].data.on.click({});
        expect(opened).toEqual(['timestamp']);
        nodes(tree, byClass('fh-mode-pill'))[1].data.on.click({});
        expect(popup.uiMode).toBe('omni');
        expect(nodes(popup._render(), n => n.tag === 'input')).toHaveLength(1);
    });

    it('preserves search input, unmatched results, loading, and empty states', () => {
        const { popup } = makePopup({ isLoading: false, fhTools: tools, uiMode: 'omni' });
        const input = nodes(popup._render(), n => n.tag === 'input')[0];
        input.data.on.input({ target: { value: '  timestamp  ', composing: false } });
        expect(popup.searchKey).toBe('timestamp');
        expect(nodes(popup._render(), byClass('fh-tool-row'))).toHaveLength(1);
        popup.searchKey = 'no-such-tool';
        expect(nodes(popup._render(), byClass('fh-tool-row'))).toHaveLength(0);
        expect(nodes(popup._render(), byClass('fh-empty'))).toHaveLength(1);
        popup.isLoading = true;
        expect(nodes(popup._render(), byClass('fh-loading'))).toHaveLength(1);
        popup.isLoading = false;
        popup.fhTools = {};
        expect(nodes(popup._render(), byClass('fh-primary-button'))).toHaveLength(1);
    });
});
