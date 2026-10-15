import fs from 'fs';
import vm from 'vm';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Execute the shipped addon. Only the editor/DOM boundary is supplied here;
// real CodeMirror layout and timing are verified in the browser fixture.
function loadGutter() {
    const handlers = new Map();
    const lines = new Map();
    const scanned = [];
    const folded = new Set([0, 2]);
    const ranges = { 0: { from: { line: 0 }, to: { line: 10000 } }, 2: { from: { line: 2 }, to: { line: 9999 } } };
    let option;
    const CodeMirror = {
        Init: {},
        Pos: (line, ch) => ({ line, ch }),
        defineOption(_name, _value, callback) { option = callback; }
    };
    const lineAt = number => {
        if (!lines.has(number)) lines.set(number, { number, gutterMarkers: {} });
        return lines.get(number);
    };
    const cm = {
        state: {},
        on(name, callback) { handlers.set(name, callback); },
        off(name) { handlers.delete(name); },
        clearGutter() { for (const line of lines.values()) line.gutterMarkers = {}; },
        getViewport: () => ({ from: 0, to: 10002 }),
        operation: callback => callback(),
        foldOption: (_options, name) => name === 'rangeFinder' ? (_cm, pos) => ranges[pos.line] : 0,
        getLineHandle: lineAt,
        eachLine(from, to, callback) { for (let i = from; i < to; i++) callback(lineAt(i)); },
        findMarks(from) {
            scanned.push(from.line);
            return folded.has(from.line) ? [{ __isFold: true, find: side => side === -1 ? ranges[from.line].from : ranges[from.line].to }] : [];
        },
        setGutterMarker(line, gutter, mark) { line.gutterMarkers[gutter] = mark; }
    };
    vm.runInNewContext(fs.readFileSync(new URL('../apps/static/vendor/codemirror/foldgutter.js', import.meta.url), 'utf8'), {
        CodeMirror, setTimeout, clearTimeout,
        document: { createElement: () => ({ className: '' }) }
    });
    option(cm, true, CodeMirror.Init);
    return { cm, scanned, folded, lineAt, handlers, disable: () => option(cm, false, true) };
}

afterEach(() => vi.useRealTimers());

describe('fold gutter on collapsed large documents', () => {
    it('visits the visible boundary lines instead of scanning the hidden subtree', () => {
        const page = loadGutter();
        expect(page.scanned).toHaveLength(2);
        expect(page.scanned).toEqual([0, 10001]);
        expect(page.lineAt(0).gutterMarkers['CodeMirror-foldgutter'].className).toContain('folded');
        expect(page.lineAt(2).gutterMarkers['CodeMirror-foldgutter']).toBeUndefined();
    });

    it('rebuilds newly exposed child gutter markers after unfolding a parent', () => {
        vi.useFakeTimers();
        const page = loadGutter();
        page.cm.clearGutter();
        page.folded.delete(0);
        page.handlers.get('unfold')(page.cm, { line: 0 });
        vi.runAllTimers();
        expect(page.lineAt(0).gutterMarkers['CodeMirror-foldgutter'].className).toContain('open');
        expect(page.lineAt(2).gutterMarkers['CodeMirror-foldgutter']?.className).toContain('folded');
    });

    it('cancels a pending viewport update when the gutter is disabled', () => {
        vi.useFakeTimers();
        const page = loadGutter();
        page.handlers.get('viewportChange')(page.cm);
        expect(vi.getTimerCount()).toBe(1);
        page.disable();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('restores child markers when viewportChange follows unfold with a smaller viewport', () => {
        vi.useFakeTimers();
        const page = loadGutter();
        page.folded.delete(0);
        page.handlers.get('unfold')(page.cm, { line: 0 });
        page.cm.getViewport = () => ({ from: 0, to: 10000 });
        page.handlers.get('viewportChange')(page.cm);
        vi.advanceTimersByTime(0);
        expect(page.lineAt(2).gutterMarkers['CodeMirror-foldgutter']?.className).toContain('folded');
    });
});
