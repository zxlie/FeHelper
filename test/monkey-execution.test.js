import vm from 'node:vm';
import { describe, it, expect, vi } from 'vitest';
vi.mock('../apps/background/inject-tools.js', () => ({ default: {} }));
import Monkey, { executeUserScript, claimUserStyle } from '../apps/background/monkey.js';

function runtime(allowEval = true) {
    const logs = [];
    const window = { location: { href: 'https://example.com/start' }, postMessage: data => logs.push(data.payload) };
    const context = vm.createContext({ window }, { codeGeneration: { strings: allowEval, wasm: false } });
    const run = vm.runInContext('(' + executeUserScript.toString() + ')', context);
    return { window, logs, run };
}

describe('userscript automatic route execution', () => {
    it('runs once for repeated SPA triggers and permits explicit reruns', () => {
        const p = runtime();
        const code = 'window.runs = (window.runs || 0) + 1';
        p.run(code, 'one', 'One', 'MAIN', false);
        p.run(code, 'one', 'One', 'MAIN', true);
        p.run(code, 'one', 'One', 'MAIN', true);
        expect(p.window.runs).toBe(1);
        p.run(code, 'one', 'One', 'MAIN', false);
        expect(p.window.runs).toBe(2);
    });
    it('allows a newly matching script and initializes anew on full navigation', () => {
        const code = 'window.runs = (window.runs || 0) + 1';
        const p = runtime();
        p.run(code, 'one', 'One', 'MAIN', true);
        p.run(code, 'two', 'Two', 'MAIN', true);
        expect(p.window.runs).toBe(2);
        const next = runtime();
        next.run(code, 'one', 'One', 'MAIN', false);
        expect(next.window.runs).toBe(1);
    });
    it('keeps failed evaluations retryable and reports script identity and a useful recovery action', () => {
        const p = runtime(false);
        p.run('window.ran = true', 'blocked', 'Blocked script', 'ISOLATED', false);
        expect(p.window.ran).toBeUndefined();
        expect(p.window.__fhMonkeyExecuted.blocked).toBeUndefined();
        expect(p.logs[0]).toMatchObject({ id: 'blocked', name: 'Blocked script', level: 'error', url: 'https://example.com/start' });
        expect(p.logs[0].msg).toContain('MAIN');
        expect(p.logs[0].msg).toContain('刷新页面');
    });
});

describe('userscript error log persistence', () => {
    it('retains simultaneous errors from multiple scripts', async () => {
        let value = '[]';
        vi.stubGlobal('chrome', { storage: { local: {
            get: async () => ({ 'PAGE-MODIFIER-LOG-KEY': value }),
            set: async data => { value = data['PAGE-MODIFIER-LOG-KEY']; }
        } } });
        try {
            await Promise.all(['one', 'two', 'three'].map(id => Monkey.log({ id, level: 'error', msg: id })));
            expect(JSON.parse(value).map(entry => entry.id)).toEqual(['one', 'two', 'three']);
        } finally { vi.unstubAllGlobals(); }
    });
});

describe('userscript CSS automatic navigation', () => {
    it('claims each script once per document and permits explicit reruns', () => {
        const context = vm.createContext({ window: {} });
        const claim = vm.runInContext('(' + claimUserStyle.toString() + ')', context);
        expect(claim('one', false)).toBe(true);
        expect(claim('one', true)).toBe(false);
        expect(claim('newly-matched', true)).toBe(true);
        expect(claim('one', false)).toBe(true);
    });
});
