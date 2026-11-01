import { describe, expect, it } from 'vitest';
import { encodeToon, decodeToon, jsonToToon } from '../apps/json-toon/toon-utils.js';

describe('#681 JSON / TOON', () => {
    it('compresses the official uniform-row example and reverses it', () => {
        const data = { users: [{ id: 1, name: 'Ada', role: 'admin' }, { id: 2, name: 'Bob', role: 'user' }] };
        const toon = 'users[2]{id,name,role}:\n  1,Ada,admin\n  2,Bob,user';
        expect(encodeToon(data)).toBe(toon);
        expect(decodeToon(toon)).toEqual(data);
    });
    it.each([{}, [], null, true, 42, 'hello', { a: {}, b: [], c: ['true', '05', 'a,b', '中文', '😀', '\n', '\b', '#tag'] },
        { mixed: [1, { a: { nested: true }, b: [1, 2] }, {}, [[], [{ x: 1 }]]] },
        { 'a:b': [{ 'x,y': 'a:b', '__test': null }], 'user.name': 3 }])('round trips JSON shapes: %j', value => {
        expect(decodeToon(encodeToon(value))).toEqual(value);
    });
    it('handles pipe / tab delimiters, quoted fields, comments and CRLF', () => {
        expect(decodeToon('# comment\r\nrows[2|]{"a|b"|v}:\r\n  1|"a|b"\r\n  # between rows\r\n  2|false')).toEqual({ rows: [{ 'a|b': 1, v: 'a|b' }, { 'a|b': 2, v: false }] });
        expect(decodeToon('[2\t]: a\tb')).toEqual(['a', 'b']);
    });
    it('preserves prototype-named keys as own data', () => {
        const value = JSON.parse('{"__proto__":{"polluted":true},"constructor":1}');
        const result = decodeToon(encodeToon(value));
        expect(Object.hasOwn(result, '__proto__')).toBe(true);
        expect(result).toEqual(value);
        expect({}.polluted).toBeUndefined();
    });
    it.each(['a[2]: 1', 'a[1]{x,y}:\n  1', 'a[1]:\n  - 1\n  - 2', 'a: 1\na: 2',
        'a:\n    b: 1', 'a: "unterminated', 'a: "ok" trailing', 'a[1]{x,x}:\n  1,2',
        'a[1:]{x}:\n  k: 1', 'a[1]{x{y}}:\n  1', 'a[01]: x', 'a: 1\n  b: 2',
        '[]\nx: 1', 'a: "\\q"', 'a: "\\ud800"', '[2]: 1,,2'])('rejects malformed or unsupported input: %s', text => {
        expect(() => decodeToon(text)).toThrow();
    });
    it('rejects unsafe integers before JSON.parse can round them', () => {
        expect(() => jsonToToon('{"id":9007199254740993}')).toThrow(/安全|precision/i);
        expect(() => decodeToon('id: 9007199254740993')).toThrow(/安全|precision/i);
        expect(jsonToToon('{"id":"9007199254740993"}')).toContain('"9007199254740993"');
    });
});

describe('TOON lossless and bounded parsing regressions', () => {
    it('preserves escaped backslashes adjacent to b/f/n and all ASCII controls', () => {
        const value = { text: ['\\b', '\\f', '\\n', '\\\\b', ...Array.from({ length: 32 }, (_, i) => String.fromCharCode(i))] };
        expect(decodeToon(encodeToon(value))).toEqual(value);
    });
    it('round trips deterministic combinations of heterogeneous arrays', () => {
        const leaves = [null, 1.25, -1e-7, false, '', '"quoted"', 'comma,pipe|tab\t', ' a ', '\u00a0', 'é', '😀', '\\b'];
        for (let i = 0; i < 180; i++) {
            const leaf = leaves[i % leaves.length];
            const data = { ['a:' + i]: [leaf, { nested: [{ x: leaf, y: true }, { y: false, x: '1' }] }, [leaf, { list: [leaf] }], {}] };
            expect(decodeToon(encodeToon(data))).toEqual(data);
        }
    });
    it('keeps dots literal and handles non-encoder-style keys', () => {
        expect(decodeToon('user.name: 1\nfoo-bar: false\n: 3')).toEqual({ 'user.name': 1, 'foo-bar': false, '': 3 });
    });
    it.each(['a: 1e999', 'a[1]{x}:\n  1\n  2', '[1]{x}: 1', 'a[999999999999999999999999]:',
        'a[1]:\n  - b: 1\n      c: 2', 'a: "\\/"', 'a: "\\b"', 'a:\n\tb: 1'])('rejects invalid / out-of-domain data %s', text => {
        expect(() => decodeToon(text)).toThrow();
    });
    it('fails at documented limits instead of consuming declared array storage', () => {
        expect(() => decodeToon('x'.repeat(2 * 1024 * 1024 + 1))).toThrow(/2 Mi/);
        let data = {};
        for (let i = 0; i < 101; i++) data = { child: data };
        expect(() => encodeToon(data)).toThrow(/100/);
        expect(() => encodeToon('\ud800')).toThrow(/Unicode/);
    });
});
