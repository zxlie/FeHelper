import fs from 'node:fs';
import vm from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EncodeUtils from '../apps/en-decode/endecode-lib.js';
import toolMap from '../apps/background/tools.js';

// Supplemental page harness: real conversion code, stubbed extension messaging.
function createPage(content = '') {
    let options;
    const sendMessage = vi.fn(request => request.thing === 'request-page-content'
        ? Promise.resolve({content}) : undefined);
    const source = fs.readFileSync('apps/en-decode/index.js', 'utf8')
        .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '');
    vm.runInNewContext(source, {
        Vue: function(config) { options = config; },
        EncodeUtils, setTimeout, clearTimeout,
        createInlineAiState: () => ({}), getInlineAiTaskFromUrl: () => null,
        location: {protocol: 'chrome-extension:'},
        chrome: {
            tabs: {query: (_query, callback) => callback([{id: 7, active: true}])},
            runtime: {sendMessage}
        }
    });
    const app = {...options.data,
        $refs: {srcText: {focus: vi.fn()}},
        $nextTick: callback => Promise.resolve().then(callback),
        $forceUpdate: vi.fn()
    };
    for (const [name, method] of Object.entries(options.methods)) app[name] = method.bind(app);
    return {app, options, sendMessage};
}

async function settle() {
    for (let i = 0; i < 6; i++) await Promise.resolve();
}

describe('Issue #685: automatic information conversion', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

    it('converts pasted and edited text after a short debounce', async () => {
        const {app} = createPage();
        expect(app.autoConvert).toBe(true);
        app.selectedType = 'utf8Encode';
        app.sourceContent = '你';
        app.scheduleAutoConvert();
        await vi.advanceTimersByTimeAsync(100);
        app.sourceContent = '你好😀';
        app.scheduleAutoConvert();
        await vi.advanceTimersByTimeAsync(199);
        expect(app.resultContent).toBe('');
        await vi.advanceTimersByTimeAsync(1);
        expect(app.resultContent).toBe('%E4%BD%A0%E5%A5%BD%F0%9F%98%80');
    });

    it('switches methods immediately and keeps manual conversion available when disabled', async () => {
        const {app} = createPage();
        app.sourceContent = 'a b';
        app.selectedType = 'utf8Encode';
        app.scheduleAutoConvert(0);
        await settle();
        expect(app.resultContent).toBe('a%20b');
        app.autoConvert = false;
        app.scheduleAutoConvert(0);
        app.selectedType = 'base64Encode';
        app.sourceContent = 'hello';
        app.scheduleAutoConvert();
        await vi.runAllTimersAsync();
        expect(app.resultContent).toBe('a%20b');
        await app.convert();
        await settle();
        expect(app.resultContent).toBe('aGVsbG8=');
        app.autoConvert = true;
        app.selectedType = 'hexEncode';
        app.scheduleAutoConvert(0);
        await settle();
        expect(app.resultContent).toBe('68656c6c6f');
    });

    it('cancels a pending automatic conversion when disabled', async () => {
        const {app} = createPage();
        app.sourceContent = 'hello';
        app.scheduleAutoConvert();
        app.autoConvert = false;
        app.scheduleAutoConvert(0);
        await vi.runAllTimersAsync();
        expect(app.resultContent).toBe('');
    });

    it('clears structured URL output on empty input and recovers from invalid input', async () => {
        const {app} = createPage();
        app.sourceContent = 'https://example.test/?q=%E4%BD%A0';
        app.selectedType = 'urlParamsDecode';
        app.scheduleAutoConvert(0);
        await settle();
        expect(app.urlResult.params).toEqual([['q', '你']]);
        app.sourceContent = '';
        app.scheduleAutoConvert();
        expect(app.urlResult).toBeNull();
        expect(app.resultContent).toBe('');
        app.selectedType = 'hexDecode';
        app.sourceContent = 'zz';
        app.scheduleAutoConvert(0);
        await settle();
        expect(app.resultContent).toContain('操作失败:');
        app.sourceContent = '6869';
        app.scheduleAutoConvert();
        await vi.runAllTimersAsync();
        expect(app.resultContent).toBe('hi');
    });

    it.each(['gzipEncode', 'gzipDecode'])('ignores late %s output after switching methods', async method => {
        let resolve;
        vi.spyOn(EncodeUtils, method).mockImplementation(() => new Promise(done => { resolve = done; }));
        const {app} = createPage();
        app.sourceContent = 'old';
        app.selectedType = method;
        app.convert();
        await settle();
        app.sourceContent = 'new';
        app.selectedType = 'base64Encode';
        app.scheduleAutoConvert(0);
        await settle();
        resolve('stale output');
        await settle();
        expect(app.resultContent).toBe('bmV3');
    });

    it.each(['resolve', 'reject'])('ignores late gzip %s after clearing', async outcome => {
        let finish;
        vi.spyOn(EncodeUtils, 'gzipEncode').mockImplementation(() => new Promise((resolve, reject) => {
            finish = outcome === 'resolve' ? resolve : reject;
        }));
        const {app} = createPage();
        app.sourceContent = 'old';
        app.selectedType = 'gzipEncode';
        app.convert();
        await settle();
        app.clear();
        finish(outcome === 'resolve' ? 'old output' : new Error('old failure'));
        await settle();
        expect(app.sourceContent).toBe('');
        expect(app.resultContent).toBe('');
        expect(app.urlResult).toBeNull();
    });

    it('does not leave a loading message when automatic conversion is turned off mid-gzip', async () => {
        let resolve;
        vi.spyOn(EncodeUtils, 'gzipEncode').mockImplementation(() => new Promise(done => { resolve = done; }));
        const {app} = createPage();
        app.sourceContent = 'old';
        app.selectedType = 'gzipEncode';
        app.scheduleAutoConvert(0);
        await settle();
        expect(app.resultContent).toBe('正在压缩...');
        app.autoConvert = false;
        app.scheduleAutoConvert(0);
        expect(app.resultContent).toBe('');
        resolve('old result');
        await settle();
        expect(app.resultContent).toBe('');
        expect(app.converting).toBe(false);
    });

    it('cancels queued work on clear, destruction and application of an AI result', async () => {
        for (const action of ['clear', 'destroy', 'apply']) {
            const {app, options} = createPage();
            app.sourceContent = 'hello';
            app.scheduleAutoConvert();
            if (action === 'clear') app.clear();
            if (action === 'destroy') options.beforeDestroy.call(app);
            if (action === 'apply') {
                app.aiBestCandidate = {selectedType: 'base64Decode', output: 'multi-step result'};
                app.applyAiPanelResult();
            }
            await vi.runAllTimersAsync();
            expect(app.resultContent).toBe(action === 'apply' ? 'multi-step result' : '');
        }
    });

    it('still converts content delivered by the extension launch chain', async () => {
        let launch;
        const executeScript = vi.fn((config, callback) => {
            // Execute the actual injected function used by the context-menu entry.
            callback([{result: config.func(...config.args)}]);
        });
        const tools = structuredClone(toolMap);
        vm.runInNewContext(fs.readFileSync('apps/background/menu.js', 'utf8')
            .replace(/^import .*$/gm, '').replace('export default ', ''), {
            toolMap: tools,
            chrome: {scripting: {executeScript}, runtime: {}, contextMenus: {onClicked: {addListener() {}}}},
            FeHelperBg: {DynamicToolRunner: config => { launch = config; }}
        });
        tools['en-decode'].menuConfig[0].onClick({selectionText: '11111'}, {id: 3});
        expect(executeScript).toHaveBeenCalledOnce();
        expect(launch).toEqual({tool: 'en-decode', withContent: '11111'});
        const {app, options, sendMessage} = createPage(launch.withContent);
        options.mounted.call(app);
        await settle();
        expect(sendMessage).toHaveBeenCalledWith({
            type: 'fh-dynamic-any-thing', thing: 'request-page-content', tabId: 7
        });
        expect(app.sourceContent).toBe('11111');
        expect(app.resultContent).toBe(EncodeUtils.uniEncode('11111'));
    });

    it('runs the shipped Vue model handlers before automatic conversion, including IME input', async () => {
        const {options} = createPage();
        const context = vm.createContext({setTimeout, clearTimeout});
        vm.runInContext(fs.readFileSync('apps/static/vendor/vue/vue.js', 'utf8'), context);
        const app = new context.Vue({...options, el: undefined, mounted: undefined});
        const html = fs.readFileSync('apps/en-decode/index.html', 'utf8');
        const field = html.match(/<textarea[^>]+id="srcText"[^>]*>/)[0] + '</textarea>';
        function dispatch(template, event, target) {
            const compiled = context.Vue.compile(template);
            const vnode = compiled.render.call(app);
            for (const handler of [].concat(vnode.data.on[event])) handler({target});
        }
        const radio = html.match(/<input[^>]+value="utf8Encode"[^>]*>/)[0];
        dispatch(radio, 'change', {checked: true});
        dispatch(field, 'input', {value: '你', composing: true});
        await vi.runAllTimersAsync();
        expect(app.sourceContent).toBe('');
        expect(app.resultContent).toBe('');
        dispatch(field, 'input', {value: '你好😀', composing: false});
        await vi.runAllTimersAsync();
        expect(app.selectedType).toBe('utf8Encode');
        expect(app.resultContent).toBe('%E4%BD%A0%E5%A5%BD%F0%9F%98%80');
        const toggle = html.match(/<input[^>]+id="autoConvert"[^>]*>/)[0];
        dispatch(toggle, 'change', {checked: false});
        dispatch(field, 'input', {value: 'hello', composing: false});
        await vi.runAllTimersAsync();
        expect(app.autoConvert).toBe(false);
        expect(app.resultContent).toBe('%E4%BD%A0%E5%A5%BD%F0%9F%98%80');
        dispatch(toggle, 'change', {checked: true});
        await settle();
        expect(app.resultContent).toBe('hello');
        app.$destroy();
    });

    it('wires keyboard-friendly option changes, input and the labelled toggle to auto conversion', () => {
        const html = fs.readFileSync('apps/en-decode/index.html', 'utf8');
        const radios = html.match(/<input[^>]+type="radio"[^>]*>/g);
        expect(radios).toHaveLength(24);
        for (const radio of radios) expect(radio).toContain('@change="scheduleAutoConvert(0)"');
        expect(html).toMatch(/<textarea[^>]+v-model="sourceContent"[^>]+@input="!\$event.target.composing && scheduleAutoConvert\(\)"/);
        expect(html).toMatch(/<label[^>]*>\s*<input[^>]+type="checkbox"[^>]+v-model="autoConvert"[^>]+@change="scheduleAutoConvert\(0\)"[^>]*>\s*自动转换/);
    });
});
