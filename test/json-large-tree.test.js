import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {describe, expect, it} from 'vitest';

const require = createRequire(import.meta.url);
const utils = require('../apps/json-format/json-auto-utils.js');
const source = fs.readFileSync(new URL('../apps/json-format/format-lib.js', import.meta.url), 'utf8');

function largeView(value) {
    const buttons = [];
    const calls = [];
    const wrap = () => {
        const result = {html() { return result; }, empty() {}, text() {}};
        return result;
    };
    const context = vm.createContext({
        window: {FHJsonAutoUtils: utils},
        cachedJsonValue: value, cachedJsonString: utils.safeStringify(value, 4),
        largeJsonPlainViewEnabled: true, largeJsonNodeViewEnabled: false, escapeJsonStringEnabled: true,
        formattingMsg: {hide() {}}, jfPre: wrap(), jfContent: wrap(),
        _canRenderFormattedResult: () => true,
        _clearOptionBar() {}, _buildOptionBar() { calls.push('toolbar'); },
        _addEvents() { calls.push('events'); }, _downloadSupport() { calls.push('download'); },
        _clearJsonSearch() { calls.push('search'); }, _emitFormatReady() { calls.push('ready'); },
        _setPlainJsonView(enabled) { calls.push(enabled ? 'plain' : 'tree'); },
        formatJsonToHtml(value) { calls.push('render'); return utils.safeStringify(value); },
        toast(message) { calls.push(message); },
        $(html) {
            const el = {html() {}, hide() {}, prependTo() {return el;}, appendTo() {return el;}, bind(event, handler) {el.click = handler;}};
            if (html.includes('fh-json-large-tree')) buttons.push(el);
            return el;
        }
    });
    const start = source.indexOf('    let _canRenderLargeJsonTree = function');
    const end = source.indexOf('    /**', start);
    vm.runInContext(source.slice(start, end), context);
    return {context, calls, buttons, run(code) {return vm.runInContext(code, context);}};
}

describe('#658: opt into a bounded node view for large JSON', () => {
    it('offers node actions after a large but bounded result, without dropping data', () => {
        const value = {payload: 'x'.repeat(640000), tail: {id: 1234567890123456789n}};
        const view = largeView(value);
        view.run('_renderLargeJsonPlainView()');
        expect(view.buttons).toHaveLength(1);
        view.buttons[0].click({preventDefault() {}, stopPropagation() {}});
        expect(view.calls).toContain('render');
        expect(view.calls.slice(-5)).toEqual(['toolbar', 'events', 'download', 'search', 'ready']);
        expect(view.context.largeJsonPlainViewEnabled).toBe(false);
        expect(view.context.largeJsonNodeViewEnabled).toBe(true);
        expect(view.context.escapeJsonStringEnabled).toBe(true);
        expect(view.context.cachedJsonString).toContain('1234567890123456789');
        expect(view.context.cachedJsonValue).toBe(value);
    });

    it.each([
        {payload: 'x'.repeat(2000001)},
        Array(20001).fill(1),
        Array.from({length: 102}).reduce(value => ({child: value}), {})
    ])('does not bypass size, node, or depth protection', value => {
        const view = largeView(value);
        view.run('_renderLargeJsonPlainView()');
        expect(view.buttons).toHaveLength(0);
        expect(view.run('_renderLargeJsonTree()')).toBe(false);
        expect(view.calls).not.toContain('render');
        expect(view.context.largeJsonPlainViewEnabled).toBe(true);
    });

    it('retains complete plaintext if tree construction fails', () => {
        const view = largeView({payload: 'x'.repeat(640000)});
        const original = view.context.cachedJsonString;
        view.context.formatJsonToHtml = () => {throw new Error('render failed');};
        expect(view.run('_renderLargeJsonTree()')).toBe(false);
        expect(view.context.largeJsonPlainViewEnabled).toBe(true);
        expect(view.context.cachedJsonString).toBe(original);
        expect(view.context.escapeJsonStringEnabled).toBe(true);
    });

    it('keeps automatic rendering conservative while allowing a bounded explicit switch', () => {
        const value = {payload: 'x'.repeat(640000)};
        expect(utils.shouldUsePlainJsonView(value, 640000, {characterLimit: 600000})).toBe(true);
        expect(largeView(value).run('_canRenderLargeJsonTree()')).toBe(true);
    });
});

it('enables node actions for an explicitly opened large tree without changing the saved status-bar setting', () => {
    let visible = false;
    const menu = {length: 1, show() {visible = true;}};
    const context = vm.createContext({
        statusBarEnabled: false, largeJsonNodeViewEnabled: false,
        el: {children: () => menu},
        $: () => ({hide() {visible = false;}})
    });
    const start = source.indexOf('    let _addOptForItem = function');
    const end = source.indexOf('    let _handleNodeOptionClick', start);
    vm.runInContext(source.slice(start, end) + '\n_addOptForItem(el, true);', context);
    expect(visible).toBe(false);
    context.largeJsonNodeViewEnabled = true;
    vm.runInContext('_addOptForItem(el, true)', context);
    expect(visible).toBe(true);
    expect(context.statusBarEnabled).toBe(false);
});
