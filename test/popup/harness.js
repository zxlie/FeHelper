import fs from 'node:fs';
import vm from 'node:vm';
import { vi } from 'vitest';

export const builtins = {
    'json-format': { name: 'JSON格式化', systemInstalled: true },
    timestamp: { name: '时间戳转换' }
};

export function makePopup({ cache = null, awesome = {}, storage = {} } = {}) {
    const localStorage = { getItem: vi.fn(() => cache), setItem: vi.fn() };
    const context = vm.createContext({
        console: { error: vi.fn(), warn: vi.fn(), log: vi.fn() },
        setTimeout, clearTimeout, localStorage,

        document: {
            documentElement: { classList: { toggle: vi.fn() } },
            body: { classList: { toggle: vi.fn() } }
        },
        chrome: { storage: { local: storage }, runtime: { sendMessage: vi.fn() } },
        Awesome: { getInstalledTools: vi.fn(async () => ({})), ...awesome },
        toolMap: structuredClone(builtins), MSG_TYPE: {},
    }, { codeGeneration: { strings: false, wasm: false } });
    vm.runInContext(fs.readFileSync('apps/static/vendor/vue/vue.js', 'utf8'), context);
    context.window = { localStorage, setTimeout };
    vm.runInContext(fs.readFileSync('apps/popup/render.js', 'utf8').replace('export default ', ''), context);
    vm.runInContext(fs.readFileSync('apps/popup/index.js', 'utf8')
        .replace(/^import .*$/gm, '')
        .replace('new Vue({', 'globalThis.popupOptions = ({'), context);
    vm.runInContext(`
        delete popupOptions.el;
        delete popupOptions.created;
        delete popupOptions.mounted;
        globalThis.popup = new Vue(popupOptions);
    `, context);
    return { popup: context.popup, context, localStorage };
}

export function nodes(root, className) {
    if (!root) return [];
    const classes = [].concat(root.data?.class || []).flatMap(value =>
        typeof value === 'string' ? value.split(' ') : Object.keys(value || {}).filter(key => value[key]));
    return (classes.includes(className) ? [root] : []).concat(
        ...(root.children || []).map(child => nodes(child, className)));
}
