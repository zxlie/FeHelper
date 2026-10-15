import fs from 'node:fs';
import vm from 'node:vm';
import { describe, it, expect } from 'vitest';

function loadGenerator() {
    const elements = new Map();
    const getElement = id => {
        if (!elements.has(id)) elements.set(id, { value: id.endsWith('Count') ? '3' : '', events: {}, addEventListener(type, handler) { this.events[type] = handler; } });
        return elements.get(id);
    };
    const results = ['uuidResult', 'ulidResult', 'snowflakeResult', 'nanoIdResult'].map(getElement);
    const context = {
        document: { getElementById: getElement, querySelectorAll: () => results },
        crypto: { randomUUID: () => 'a-b-c-d-e' },
        window: { FHUlid: { generateULID: () => '0123456789' } },
        chrome: { runtime: { sendMessage() {} } }
    };
    vm.runInNewContext(fs.readFileSync('apps/uuid-gen/index.js', 'utf8'), context);
    return results;
}

describe('Issue #665: generated ID selection', () => {
    it('keeps native single-click selection and selects only the double-clicked row', () => {
        for (const el of loadGenerator()) {
            expect(el.events.click).toBeUndefined();
            el.value = 'first-id\nsecond-id\nthird-id';
            el.setSelectionRange = (start, end) => { el.selectionStart = start; el.selectionEnd = end; };
            for (const [caret, selected] of [[2, 'first-id'], [10, 'second-id'], [23, 'third-id']]) {
                el.selectionStart = caret;
                el.events.dblclick({ target: el, preventDefault() {} });
                expect(el.value.slice(el.selectionStart, el.selectionEnd)).toBe(selected);
            }
        }
    });
});
