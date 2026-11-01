import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import { makePopup, nodes } from './harness.js';

afterEach(() => vi.useRealTimers());

describe('Issue #664: popup startup survives unavailable optional services', () => {
    it('refreshes installed tools even if optional metadata callbacks never arrive', async () => {
        vi.useFakeTimers();
        const { popup } = makePopup({
            awesome: { getInstalledTools: async () => ({
                'json-format': { installed: true, name: 'JSON' },
                timestamp: { installed: true, name: 'Time' }
            }) }, storage: { get: vi.fn() }
        });
        popup.applyCachedTools();
        const loading = popup.loadTools();
        await vi.advanceTimersByTimeAsync(2000);
        expect(popup.installedToolsCount).toBe(2);
        await loading;
        expect(nodes(popup._render(), 'fh-tool-row')).toHaveLength(2);
    });

    it('keeps the cached menu usable when installed-tool loading rejects', async () => {
        const { popup } = makePopup({
            awesome: { getInstalledTools: async () => { throw new Error('storage unavailable'); } },
            storage: { get: (_keys, callback) => callback({}) }
        });
        popup.applyCachedTools();
        await popup.loadTools();
        expect(popup.isLoading).toBe(false);
        expect(nodes(popup._render(), 'fh-tool-row')).toHaveLength(1);
    });

    it('observes rejected promises returned by deferred startup work', () => {
        const { popup, context } = makePopup();
        let run;
        context.window.requestIdleCallback = callback => { run = callback; };
        const caught = vi.fn();
        popup.deferTask(() => ({ catch: caught }));
        run();
        expect(caught).toHaveBeenCalledWith(expect.any(Function));
    });

    it('returns the statistics message promise so the deferred runner can catch failure', () => {
        const { popup, context } = makePopup();
        const result = Promise.resolve();
        context.chrome.runtime.sendMessage.mockReturnValue(result);
        expect(popup.recordUsage()).toBe(result);
    });

    it('contains actual async rejection from non-critical startup work', async () => {
        vi.useFakeTimers();
        const { popup, context } = makePopup();
        context.chrome.runtime.sendMessage.mockRejectedValue(new Error('worker stopped'));
        popup.deferTask(() => popup.recordUsage(), 10);
        await vi.advanceTimersByTimeAsync(20);
        expect(context.chrome.runtime.sendMessage).toHaveBeenCalledOnce();
    });
});

function bootTheme(get) {
    const attrs = {};
    const context = {
        document: { documentElement: {
            setAttribute: (key, value) => { attrs[key] = value; },
            removeAttribute: key => { delete attrs[key]; }
        } },
        localStorage: { getItem: () => null, setItem: vi.fn() },
        chrome: { storage: { local: { get } } },
        window: { setTimeout, matchMedia: () => ({ matches: false }) }
    };
    vm.runInNewContext(fs.readFileSync('apps/popup/theme-boot.js', 'utf8'), context);
    return attrs;
}

describe('Issue #664: theme lookup must not hide the entire menu', () => {
    it('paints a usable default while cold storage is pending, then applies the setting', () => {
        vi.useFakeTimers();
        let resolve;
        const attrs = bootTheme((_keys, callback) => { resolve = callback; });
        expect(attrs['data-fh-theme-pending']).toBeUndefined();
        expect(attrs['dark-mode']).toBe('off');
        resolve({ ALWAYS_DARK_MODE: true });
        expect(attrs['dark-mode']).toBe('on');
    });

    it('handles a rejected promise from the storage API', async () => {
        vi.useFakeTimers();
        const attrs = bootTheme(() => Promise.reject(new Error('storage unavailable')));
        await vi.advanceTimersByTimeAsync(1);
        expect(attrs['data-fh-theme-pending']).toBeUndefined();
        expect(attrs['dark-mode']).toBe('off');
    });
});
