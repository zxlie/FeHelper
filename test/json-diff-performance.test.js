import fs from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { compareTextByLine } from '../apps/json-diff/diff-utils.js';

function loadPage(editors = {}) {
    const sandbox = {
        window: {}, console,
        Vue: function(options) {
            Object.assign(this, options.data);
            for (const [key, method] of Object.entries(options.methods)) this[key] = method.bind(this);
            for (const [key, getter] of Object.entries(options.computed)) {
                Object.defineProperty(this, key, { get: getter.bind(this) });
            }
        }
    };
    vm.runInNewContext(fs.readFileSync('apps/json-diff/index.js', 'utf8') +
        '\nwindow.setEditors = editors => { jsonBox = editors; };', sandbox);
    sandbox.window.setEditors(editors);
    return sandbox.window.vueApp;
}

describe('Issue #663: bounded diff rendering work', () => {
    it('isolates one insertion in 60,000 lines instead of highlighting the unchanged suffix', () => {
        const lines = Array.from({ length: 60000 }, (_, i) => 'log entry ' + i);
        const edited = [...lines];
        edited.splice(30000, 0, 'inserted');
        const result = compareTextByLine(lines.join('\n'), edited.join('\n'));
        expect(result.changedLeftLines).toEqual([]);
        expect(result.changedRightLines).toEqual([30000]);
        expect(result.changeCount).toBe(1);
    });

    it('batches all 20,000 line additions and removals into two editor operations', () => {
        let depth = 0;
        let flushes = 0;
        const marked = new Map();
        const editor = {
            operation(fn) { depth++; try { fn(); } finally { if (--depth === 0) flushes++; } },
            addLineClass(line, where, css) { marked.set(line, css); if (!depth) flushes++; },
            removeLineClass(line) { marked.delete(line); if (!depth) flushes++; }
        };
        const page = loadPage({ left: editor });
        page.applyLineHighlights('left', Array.from({ length: 20000 }, (_, i) => i), 'changed');
        expect(marked.size).toBe(20000);
        page.clearLineHighlights('left');
        expect(marked.size).toBe(0);
        expect(page.lineHighlights.left).toEqual([]);
        expect(flushes).toBe(2);
    });

    it('formats at most 100 summary values per page and keeps all 10,001 changes reachable', () => {
        const page = loadPage();
        let valueReads = 0;
        const diffs = Array.from({ length: 10001 }, (_, i) => ({
            op: 'replace', path: '/item/' + i,
            get value() { valueReads++; return i; }
        }));
        page.diffSummary = diffs;
        expect(page.visibleDiffSummary).toHaveLength(100);
        expect(valueReads).toBe(100);
        expect(page.summaryPageCount).toBe(101);
        const paths = [];
        for (let index = 0; index < page.summaryPageCount; index++) {
            page.summaryPage = index;
            paths.push(...page.visibleDiffSummary.map(item => item.path));
        }
        expect(new Set(paths).size).toBe(10001);
        expect(paths.at(-1)).toBe('/item/10000');
        page.clearDiffSummary();
        expect(page.summaryPage).toBe(0);
        expect(page.visibleDiffSummary).toEqual([]);
    });

    it('keeps exact insertion/deletion indices around unchanged edges', () => {
        const cases = [
            ['a\nb', 'x\na\nb', [], [0]],
            ['a\nb', 'a\nb\nx', [], [2]],
            ['a\nx\nb', 'a\nb', [1], []],
            ['a\nb\nc\nd', 'a\nx\ny\nd', [1, 2], [1, 2]],
            ['same\nsame', 'same\nx\nsame', [], [1]],
            ['', '', [], []]
        ];
        for (const [left, right, removed, added] of cases) {
            const result = compareTextByLine(left, right);
            expect(result.changedLeftLines).toEqual(removed);
            expect(result.changedRightLines).toEqual(added);
        }
    });

    it('clamps pagination, resets its scroll, and resets the page when results clear', () => {
        const page = loadPage();
        page.$nextTick = fn => fn();
        page.$refs = { summaryList: { scrollTop: 300 } };
        page.diffSummary = Array.from({ length: 101 }, (_, i) => ({ op: 'add', path: '/' + i, value: i }));
        page.changeSummaryPage(-1);
        expect(page.summaryPage).toBe(0);
        page.changeSummaryPage(1);
        expect(page.visibleDiffSummary.map(item => item.path)).toEqual(['/100']);
        expect(page.$refs.summaryList.scrollTop).toBe(0);
        page.changeSummaryPage(1);
        expect(page.summaryPage).toBe(1);
        page.clearDiffSummary();
        page.changeSummaryPage(1);
        expect(page.summaryPage).toBe(0);
    });

    it('retains linear fallback for a large unrelated middle', () => {
        const left = ['header', ...Array.from({ length: 600 }, (_, i) => 'left-' + i), 'footer'];
        const right = ['header', ...Array.from({ length: 600 }, (_, i) => 'right-' + i), 'footer'];
        const result = compareTextByLine(left.join('\n'), right.join('\n'));
        expect(result.algorithm).toBe('position');
        expect(result.changedLeftLines).toHaveLength(600);
        expect(result.changedLeftLines[0]).toBe(1);
        expect(result.changedLeftLines.at(-1)).toBe(600);
    });
});
