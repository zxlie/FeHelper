import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { loadSourceMap, parseSourceMap } from '../apps/source-map/parser.js';
import toolMap from '../apps/background/tools.js';
import { buildToolUrl } from '../apps/background/open-mode.js';

const sample = {
    version: 3,
    sources: ['a.js', 'b.js'],
    sourceRoot: 'src',
    sourcesContent: ['const sum = 1;', null],
    names: ['sum'],
    mappings: 'EAAAA,G,CCCE;;ADDD'
};

function parse(overrides = {}) {
    return parseSourceMap(JSON.stringify({ ...sample, ...overrides }));
}

describe('Source Map 解析', () => {
    it('opens a packaged tool page without injecting scripts into visited pages', () => {
        expect(toolMap['source-map']?.name).toContain('Source Map');
        expect(toolMap['source-map'].contentScriptJs).toBeFalsy();
        expect(existsSync(new URL('../apps' + buildToolUrl('source-map'), import.meta.url))).toBe(true);
    });

    it('resolves deltas, names and boundaries of mapped and unmapped ranges', () => {
        const map = parse();
        expect(map.sources).toEqual(['src/a.js', 'src/b.js']);
        expect(map.lookup(1, 2)).toBeNull();
        expect(map.lookup(1, 3)).toEqual({ sourceIndex: 0, line: 1, column: 1, name: 'sum' });
        expect(map.lookup(1, 5)).toEqual(map.lookup(1, 3));
        expect(map.lookup(1, 6)).toBeNull();
        expect(map.lookup(1, 7)).toEqual({ sourceIndex: 1, line: 2, column: 3, name: null });
        expect(map.lookup(2, 50)).toBeNull();
        expect(map.lookup(3, 1)).toEqual({ sourceIndex: 0, line: 1, column: 2, name: null });
        expect(map.lookup(4, 1)).toBeNull();
    });

    it('preserves empty source content and accepts maps without embedded sources or names', () => {
        const map = parse({ names: undefined, sourcesContent: ['', null], mappings: 'AAAA' });
        expect(map.sourcesContent).toEqual(['', null]);
        expect(map.lookup(1, 1).name).toBeNull();
        expect(parse({ sourcesContent: undefined }).sourcesContent).toEqual([null, null]);
        expect(parse({ mappings: '' }).lookup(1, 1)).toBeNull();
    });

    it('resolves relative source names against the fetched map URL', () => {
        const map = parseSourceMap(JSON.stringify(sample), 'https://example.test/bundle/app.js.map');
        expect(map.sources[0]).toBe('https://example.test/bundle/src/a.js');
    });

    it('decodes multi-digit VLQs and out-of-order generated columns', () => {
        const map = parse({ mappings: 'gCAAA,xBAAE' });
        expect(map.lookup(1, 8)).toBeNull();
        expect(map.lookup(1, 9).column).toBe(3);
        expect(map.lookup(1, 33).column).toBe(1);
    });

    it('reports malformed JSON', () => {
        expect(() => parseSourceMap('{')).toThrow(/JSON/);
    });

    it.each([
        { version: 2 }, { sections: [] }, { sources: {} }, { mappings: 'AA' },
        { mappings: 'g' }, { mappings: 'AA?A' }, { mappings: 'AEAA' },
        { mappings: 'AADA' }, { mappings: 'AAAAC' }, { mappings: 'D' }
    ])('reports an invalid or unsupported map %j', overrides => {
        expect(() => parse(overrides)).toThrow();
    });

    it('rejects invalid generated positions', () => {
        const map = parse();
        for (const [line, column] of [[0, 1], [1, 0], [1.5, 1], [1, NaN]]) {
            expect(() => map.lookup(line, column)).toThrow();
        }
    });
});

describe('Source Map inputs', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('reads pasted JSON and local files without a network request', async () => {
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        const signal = new AbortController().signal;
        const text = JSON.stringify(sample);
        const pasted = await loadSourceMap(text, null, signal);
        const local = await loadSourceMap('', new File([text], 'app.map'), signal);
        expect(local.lookup(1, 3)).toEqual(pasted.lookup(1, 3));
        expect(fetch).not.toHaveBeenCalled();
    });

    it('uses the final map URL as the base and only requests the specified map', async () => {
        const fetch = vi.fn().mockResolvedValue({
            ok: true, url: 'https://example.test/dist/bundle.map', text: async () => JSON.stringify(sample)
        });
        vi.stubGlobal('fetch', fetch);
        const signal = new AbortController().signal;
        const url = 'https://example.test/latest.map';
        const result = await loadSourceMap(url, null, signal);
        expect(result.sources[0]).toBe('https://example.test/dist/src/a.js');
        expect(fetch).toHaveBeenCalledExactlyOnceWith(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal });
    });

    it('reports HTTP failures and discards cancelled file reads', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
        const request = new AbortController();
        await expect(loadSourceMap('https://example.test/missing.map', null, request.signal)).rejects.toThrow(/404/);
        const reading = loadSourceMap('', new File([JSON.stringify(sample)], 'app.map'), request.signal);
        request.abort();
        await expect(reading).rejects.toMatchObject({ name: 'AbortError' });
    });
});
