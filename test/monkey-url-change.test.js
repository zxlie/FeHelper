import vm from 'node:vm';
import { describe, it, expect } from 'vitest';
import { installUrlChangeHook, installUrlChangeListener } from '../apps/background/monkey-url-change.js';

function page() {
    const events = new EventTarget();
    const location = { href: 'https://example.com/start' };
    const calls = [];
    const history = {};
    for (const name of ['pushState', 'replaceState']) {
        history[name] = function (state, title, url) {
            if (this !== history) throw new TypeError('Illegal invocation');
            if (url === 'bad') throw new Error('Invalid URL');
            calls.push({ name, state, title, url });
            if (url != null) location.href = new URL(url, location.href).href;
            return 42;
        };
    }
    function world() {
        const window = {
            location, history,
            addEventListener: events.addEventListener.bind(events),
            dispatchEvent: events.dispatchEvent.bind(events)
        };
        const context = vm.createContext({ window, CustomEvent });
        return { window, run: fn => vm.runInContext('(' + fn.toString() + ')()', context) };
    }
    return { ...world(), world, location, history, calls };
}

describe('userscript URL change compatibility', () => {
    it('supports Tampermonkey feature detection and reports push/replace URLs', () => {
        const p = page();
        p.run(installUrlChangeHook);
        p.run(installUrlChangeListener);
        expect(p.window.onurlchange).toBe(null);
        const urls = [];
        p.window.addEventListener('urlchange', event => urls.push(event.url));
        expect(p.history.pushState({ a: 1 }, '', '/next')).toBe(42);
        p.history.replaceState(null, '', '#hash');
        expect(urls).toEqual(['https://example.com/next', 'https://example.com/next#hash']);
        expect(p.calls[0].state).toEqual({ a: 1 });
    });

    it('deduplicates unchanged URLs and popstate/hashchange for the same navigation', () => {
        const p = page();
        p.run(installUrlChangeHook);
        p.run(installUrlChangeListener);
        const urls = [];
        p.window.onurlchange = event => urls.push(event.url);
        p.history.pushState(null, '', '/start');
        p.history.replaceState({ changed: true }, '');
        p.location.href += '#back';
        p.window.dispatchEvent(new Event('popstate'));
        p.window.dispatchEvent(new Event('hashchange'));
        expect(urls).toEqual(['https://example.com/start#back']);
    });

    it('preserves history errors and does not emit changes after a failed call', () => {
        const p = page();
        p.run(installUrlChangeHook);
        let count = 0;
        p.window.addEventListener('urlchange', () => count++);
        expect(() => p.history.pushState(null, '', 'bad')).toThrow('Invalid URL');
        expect(() => p.history.pushState.call({}, null, '', '/next')).toThrow('Illegal invocation');
        expect(count).toBe(0);
    });

    it('installs one history hook and delivers one event to both execution worlds', () => {
        const p = page();
        const isolated = p.world();
        p.run(installUrlChangeHook);
        const push = p.history.pushState;
        p.run(installUrlChangeHook);
        p.run(installUrlChangeListener);
        p.run(installUrlChangeListener);
        isolated.run(installUrlChangeListener);
        const mainUrls = [], isolatedUrls = [];
        p.window.addEventListener('urlchange', event => mainUrls.push(event.url));
        isolated.window.addEventListener('urlchange', event => isolatedUrls.push(event.url));
        p.history.pushState(null, '', '/next');
        expect(p.history.pushState).toBe(push);
        expect(mainUrls).toEqual(['https://example.com/next']);
        expect(isolatedUrls).toEqual(mainUrls);
    });

    it('keeps each event URL stable when a callback navigates again', () => {
        const p = page();
        p.run(installUrlChangeHook);
        p.run(installUrlChangeListener);
        const seen = [];
        p.window.onurlchange = event => {
            seen.push(event.url);
            if (event.url.endsWith('/first')) p.history.replaceState(null, '', '/second');
        };
        p.history.pushState(null, '', '/first');
        expect(seen).toEqual(['https://example.com/first', 'https://example.com/second']);
    });

    it('does not overwrite an existing onurlchange provider', () => {
        const p = page();
        const handler = () => {};
        p.window.onurlchange = handler;
        const originalPush = p.history.pushState;
        expect(p.run(installUrlChangeHook)).toBe(false);
        p.run(installUrlChangeListener);
        expect(p.history.pushState).toBe(originalPush);
        expect(p.window.onurlchange).toBe(handler);
    });
});
