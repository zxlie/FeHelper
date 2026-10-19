import fs from 'node:fs';
import vm from 'node:vm';
import {describe, expect, it} from 'vitest';

const source = fs.readFileSync(new URL('../apps/json-format/format-lib.js', import.meta.url), 'utf8');

describe('JSON result downloads after editing nodes', () => {
    it('downloads the current data and filename, not the snapshot when the toolbar was built', async () => {
        let click;
        let saved;
        let savedName;
        let filename = 'before';
        const original = '{"keep":1,"remove":2}';
        const window = {};
        window.top = window.parent = window;
        const context = vm.createContext({
            window, Blob,
            cachedJsonString: original,
            _canRenderFormattedResult: () => true,
            getJsonDownloadBasename: () => filename,
            $: () => ({appendTo() {return this;}, click(fn) {click = fn;}}),
            URL: {createObjectURL(blob) {saved = blob; return 'blob:test';}, revokeObjectURL() {}},
            document: {
                createElement: () => ({style: {}, click() {savedName = this.download;}}),
                body: {appendChild() {}, contains: () => false}
            },
            setTimeout: fn => fn(), console
        });
        const start = source.indexOf('    let _downloadSupport = function');
        const end = source.indexOf('    let _copyToClipboard', start);
        vm.runInContext(source.slice(start, end) + '\n_downloadSupport(cachedJsonString);', context);
        context.cachedJsonString = '{"keep":1}';
        filename = 'after';
        click({preventDefault() {}});
        expect(await saved.text()).toBe('{"keep":1}');
        expect(savedName).toBe('after.json');
    });
});

it('downloads a selected node without asking for extension-wide download permission', async () => {
    let saved;
    const action = {closest: () => ({length: 1}), hasClass: name => name === 'opt-download'};
    const context = vm.createContext({
        Blob,
        window: {FHJsonAutoUtils: {downloadJsonBlobWithAnchor(blob, filename) {saved = {blob, filename}; return true;}}},
        $: () => action,
        _stringifyJsonNodeValue: () => '{"id":222789022864622592}',
        getJsonDownloadBasename: () => '节点',
        chrome: {permissions: {request() {throw Error('Unnecessary permission prompt');}}}
    });
    const start = source.indexOf('    let _handleNodeOptionClick = function');
    const end = source.indexOf('    // 显示当前节点的Key', start);
    vm.runInContext(source.slice(start, end) + '\n_handleNodeOptionClick({preventDefault(){},stopPropagation(){},target:{}});', context);
    expect(saved.filename).toBe('节点.json');
    expect(await saved.blob.text()).toBe('{"id":222789022864622592}');
});
