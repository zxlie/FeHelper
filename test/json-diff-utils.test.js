import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compareTextByLine, compareTextByPosition, splitLines } from '../apps/json-diff/diff-utils.js';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

describe('json-diff text mode helpers', () => {
    it('normalizes CRLF before splitting lines', () => {
        expect(splitLines('a\r\nb\rc')).toEqual(['a', 'b', 'c']);
    });

    it('reports no diff for identical text', () => {
        const result = compareTextByLine('alpha\nbeta', 'alpha\nbeta');
        expect(result.isDifferent).toBe(false);
        expect(result.changeCount).toBe(0);
        expect(result.changedLeftLines).toEqual([]);
        expect(result.changedRightLines).toEqual([]);
    });

    it('highlights replacements on both sides', () => {
        const result = compareTextByLine('line-1\nline-2\nline-3', 'line-1\nLINE-2\nline-3');
        expect(result.isDifferent).toBe(true);
        expect(result.changedLeftLines).toEqual([1]);
        expect(result.changedRightLines).toEqual([1]);
        expect(result.changeCount).toBe(1);
    });

    it('highlights inserted lines on the right side', () => {
        const result = compareTextByLine('header\nfooter', 'header\nbody\nfooter');
        expect(result.changedLeftLines).toEqual([]);
        expect(result.changedRightLines).toEqual([1]);
        expect(result.changeCount).toBe(1);
    });

    it('Issue #654: falls back to linear text diff for large inputs', () => {
        const left = Array.from({ length: 600 }, (_, index) => 'line-' + index).join('\n');
        const right = Array.from({ length: 600 }, (_, index) => index === 401 ? 'LINE-401' : 'line-' + index).join('\n');
        const result = compareTextByLine(left, right);

        expect(result.algorithm).toBe('position');
        expect(result.changedLeftLines).toEqual([401]);
        expect(result.changedRightLines).toEqual([401]);
        expect(compareTextByPosition(['a'], ['b']).algorithm).toBe('position');
    });

    it('Issue #651/#654: JSON diff uses reusable source maps and dark-mode-safe mark classes', () => {
        const source = readSource('apps/json-diff/index.js');
        const css = readSource('apps/json-diff/index.css');

        expect(source).toContain('parseEditorPointers: function(editor)');
        expect(source).toContain('const leftPointers = diffs.length ? this.parseEditorPointers(jsonBox.left) : {};');
        expect(source).toContain("className: 'fh-json-diff-mark ' + className");
        expect(source).not.toContain("this._highlight(editor, diff, '#DD4444')");
        expect(css).toContain('body.fh-modern.theme-dark .CodeMirror-linebackground.fh-diff-line-left');
        expect(css).toContain('body.fh-modern.theme-dark .fh-json-diff-remove');
        expect(css).toContain('body.fh-modern.theme-dark .fh-json-diff-add');
        expect(css).toContain('body.fh-modern.theme-dark .fh-json-diff-change');
    });
});

describe('JSON diff precision and JSON value boundaries', () => {
    it('Issue #662: compares nested added BigInt values without serializing them', async () => {
        const { compareJsonValues } = await import('../apps/json-diff/diff-utils.js');
        const value = { id: 222789022864622592n };
        expect(compareJsonValues({}, { record: value })).toEqual([{ op: 'add', path: '/record', value }]);
        expect(compareJsonValues({ record: value }, { record: { id: 222789022864622593n } }))
            .toEqual([{ op: 'replace', path: '/record/id', value: 222789022864622593n }]);
        expect(compareJsonValues({ record: value }, { record: { ...value } })).toEqual([]);
    });

    it('keeps a BigInt distinct from the same digits in a string', async () => {
        const { compareJsonValues } = await import('../apps/json-diff/diff-utils.js');
        expect(compareJsonValues({ id: 222789022864622592n }, { id: '222789022864622592' }))
            .toEqual([{ op: 'replace', path: '/id', value: '222789022864622592' }]);
    });

    it('preserves the array path and exact BigInt value for an addition', async () => {
        const { compareJsonValues } = await import('../apps/json-diff/diff-utils.js');
        expect(compareJsonValues({ ids: [1] }, { ids: [1, 222789022864622592n] }))
            .toEqual([{ op: 'add', path: '/ids/1', value: 222789022864622592n }]);
    });

    it('distinguishes types, root values, arrays and escaped keys', async () => {
        const { compareJsonValues } = await import('../apps/json-diff/diff-utils.js');
        expect(compareJsonValues({ id: 1 }, { id: '1' })).toEqual([{ op: 'replace', path: '/id', value: '1' }]);
        expect(compareJsonValues(1, 2)).toEqual([{ op: 'replace', path: '', value: 2 }]);
        expect(compareJsonValues([], {})).toEqual([{ op: 'replace', path: '', value: {} }]);
        expect(compareJsonValues({ 'a/~': 1 }, { 'a/~': 2 })).toEqual([{ op: 'replace', path: '/a~1~0', value: 2 }]);
        expect(compareJsonValues([1, 2, 3], [1])).toEqual([{ op: 'remove', path: '/2' }, { op: 'remove', path: '/1' }]);
        expect(compareJsonValues({ hasOwnProperty: 1 }, { hasOwnProperty: 2 })).toEqual([{ op: 'replace', path: '/hasOwnProperty', value: 2 }]);
    });
});
