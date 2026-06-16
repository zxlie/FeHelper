import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
    getPopupWakeupTarget,
    isInjectableTabUrl
} from '../apps/background/url-policy.js';

describe('background URL injection policy', () => {
    it('allows regular web and file pages', () => {
        expect(isInjectableTabUrl('https://example.com/a')).toBe(true);
        expect(isInjectableTabUrl('http://localhost:3000/')).toBe(true);
        expect(isInjectableTabUrl('file:///Users/test/page.html')).toBe(true);
    });

    it('rejects browser, extension, and web store pages', () => {
        [
            'chrome://newtab/',
            'chrome-search://local-ntp/local-ntp.html',
            'chrome://extensions/',
            'edge://newtab/',
            'about:blank',
            'chrome-extension://abc/popup/index.html',
            'https://chrome.google.com/webstore/detail/foo',
            'https://chromewebstore.google.com/detail/foo'
        ].forEach(url => {
            expect(isInjectableTabUrl(url), url).toBe(false);
        });
    });

    it('returns a silent no-op target for popup wakeup on unsupported pages', () => {
        expect(getPopupWakeupTarget({
            id: 1,
            url: 'chrome://newtab/'
        })).toEqual({
            ok: false,
            reason: 'not_injectable',
            url: 'chrome://newtab/'
        });
    });

    it('keeps popup wakeup injectable for regular pages', () => {
        expect(getPopupWakeupTarget({
            id: 2,
            url: 'https://example.com/'
        })).toEqual({
            ok: true,
            tabId: 2,
            url: 'https://example.com/'
        });
    });

    it('does not show an unsupported-page notification from popup wakeup', () => {
        const backgroundSource = fs.readFileSync(path.resolve('apps/background/background.js'), 'utf8');
        const marker = "else if (request.type === 'fh-popup-opened')";
        const start = backgroundSource.indexOf(marker);
        const end = backgroundSource.indexOf('// 截屏', start);
        const popupWakeupBranch = backgroundSource.slice(start, end);

        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
        expect(popupWakeupBranch).not.toMatch(/notifyText\s*\(/);
        expect(popupWakeupBranch).not.toContain('当前页面不支持注入脚本');
    });
});
