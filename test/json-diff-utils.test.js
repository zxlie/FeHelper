import { describe, expect, it } from 'vitest';
import { compareTextByLine, splitLines } from '../apps/json-diff/diff-utils.js';

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
});
