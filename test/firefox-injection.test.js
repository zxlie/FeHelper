import fs from 'node:fs';
import vm from 'node:vm';
import {afterEach, describe, expect, it, vi} from 'vitest';
import MSG_TYPE from '../apps/static/js/common.js';
import * as openMode from '../apps/background/open-mode.js';
import * as urlPolicy from '../apps/background/url-policy.js';
import {makePopup} from './popup/harness.js';

const firefox = {userAgent: 'Mozilla/5.0 Firefox/160.0'};
const restrictedHosts = [
    'accounts-static.cdn.mozilla.net', 'accounts.firefox.com',
    'addons.cdn.mozilla.net', 'addons.mozilla.org', 'api.accounts.firefox.com',
    'content.cdn.mozilla.net', 'discovery.addons.mozilla.org', 'install.mozilla.org',
    'oauth.accounts.firefox.com', 'profile.accounts.firefox.com',
    'support.mozilla.org', 'sync.services.mozilla.com'
];
const read = file => fs.readFileSync(file, 'utf8');
const withoutImports = source => source.replace(/^import[\s\S]*?;\s*$/gm, '');

// Supplemental local harness: real popup, background startup, injection helper
// and packaged QR content script; only browser APIs and unrelated services are
// stubbed. Model Firefox's protected-origin rejection even with host permission.
function boot(url, {permissionDenied = false} = {}) {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', firefox);
    const {popup, context} = makePopup();
    const chrome = context.chrome;
    const messages = [];
    let updated;
    const tab = {id: 7, index: 0, windowId: 1, active: true, url};
    context.MSG_TYPE.OPEN_DYNAMIC_TOOL = MSG_TYPE.OPEN_DYNAMIC_TOOL;
    popup.fhTools = {'qr-code': {installed: true, contentScriptJs: true}};
    chrome.runtime = {
        onMessage: {addListener: listener => messages.push(listener)},
        onInstalled: {addListener: vi.fn()}, onStartup: {addListener: vi.fn()},
        getManifest: () => ({}), getURL: file => `moz-extension://sample/${file}`,
        setUninstallURL: vi.fn(),
        sendMessage: request => new Promise(resolve => {
            messages.forEach(listener => listener(request, {}, resolve));
        })
    };
    chrome.action = {onClicked: {addListener: vi.fn()}, setPopup: vi.fn()};
    chrome.alarms = {onAlarm: {addListener: vi.fn()}, create: vi.fn()};
    chrome.notifications = {create: vi.fn(), clear: vi.fn()};
    chrome.tabs = {
        onUpdated: {addListener: listener => { updated = listener; }},
        query: (_query, callback) => callback([tab]),
        create: vi.fn(async () => ({id: 42}))
    };
    chrome.storage.session = {set: vi.fn(async () => {})};
    const page = vm.createContext({});
    page.window = page;
    chrome.scripting = {
        executeScript: vi.fn((options, callback) => {
            // lastError exists only inside the asynchronous API callback.
            Promise.resolve().then(() => {
                if (permissionDenied || restrictedHosts.includes(new URL(url).hostname)) {
                    chrome.runtime.lastError = {message: 'Missing host permission for the tab'};
                    try { callback(); } finally { delete chrome.runtime.lastError; }
                    return;
                }
                let result;
                if (options.files) {
                    for (const file of options.files) result = vm.runInContext(read(`apps/${file}`), page);
                } else {
                    page.args = options.args;
                    result = vm.runInContext(`(${options.func.toString()})(...args)`, page);
                }
                // Firefox reports non-cloneable script results per frame.
                let frame;
                try { frame = {frameId: 0, result: structuredClone(result)}; }
                catch (error) { frame = {frameId: 0, error}; }
                callback([frame]);
            });
        })
    };
    const sandbox = vm.createContext({
        chrome, MSG_TYPE, ...openMode, ...urlPolicy,
        navigator: firefox, console: context.console, setTimeout, clearTimeout,
        Settings: {getOptions: callback => callback({})},
        Awesome: {getInstalledTools: async () => popup.fhTools, gcLocalFiles: vi.fn()},
        Statistics: {init: vi.fn(), recordToolUsage: vi.fn()},
        Menu: {rebuild: vi.fn()}
    });
    vm.runInContext(withoutImports(read('apps/background/inject-tools.js'))
        .replace('export default', 'globalThis.InjectTools ='), sandbox);
    vm.runInContext(withoutImports(read('apps/background/background.js')), sandbox);
    return {popup, chrome, page, loaded: () => updated(tab.id, {status: 'complete'}, tab)};
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('Issue #686: Firefox protected pages and popup injection', () => {
    it.each(restrictedHosts)('skips Firefox-protected %s despite all-sites permission', host => {
        vi.stubGlobal('navigator', firefox);
        expect(urlPolicy.isInjectableTabUrl(`https://${host}/sample`)).toBe(false);
    });

    it('compares parsed hostnames without blocking unrelated sites or other browsers', () => {
        vi.stubGlobal('navigator', firefox);
        expect(urlPolicy.isInjectableTabUrl('https://ADDONS.MOZILLA.ORG:443/sample')).toBe(false);
        for (const url of ['https://addons.mozilla.org.example.com/',
            'https://example.com/addons.mozilla.org', 'https://developer.mozilla.org/',
            'http://localhost:3000/sample.html', 'file:///tmp/sample.html']) {
            expect(urlPolicy.isInjectableTabUrl(url), url).toBe(true);
        }
        vi.stubGlobal('navigator', {userAgent: 'Mozilla/5.0 Chrome/140.0.0.0'});
        expect(urlPolicy.isInjectableTabUrl('https://addons.mozilla.org/')).toBe(true);
    });

    it('opens a tool from a protected page without the misleading permission notification', async () => {
        const {popup, chrome} = boot('https://addons.mozilla.org/firefox/addon/fehelper/');
        popup.notifyPopupOpened();
        await vi.advanceTimersByTimeAsync(0);
        expect(chrome.notifications.create).not.toHaveBeenCalled();
        expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
        await popup.runHelper('qr-code');
        expect(chrome.tabs.create).toHaveBeenCalledExactlyOnceWith({
            url: '/qr-code/index.html', active: true, index: 1, windowId: 1
        });
    });

    it('also skips protected tabs during automatic content-script startup', async () => {
        const {chrome, loaded} = boot('https://support.mozilla.org/');
        loaded();
        await vi.advanceTimersByTimeAsync(0);
        expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('still injects and initializes a real content script on a normal page', async () => {
        const {popup, chrome, page} = boot('http://localhost:3000/sample.html');
        popup.notifyPopupOpened();
        await vi.advanceTimersByTimeAsync(0);
        expect(chrome.notifications.create).not.toHaveBeenCalled();
        expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(3);
        expect(page.__FH_TAB_ID__).toBe(7);
        expect(vm.runInContext('typeof qrcodeContentScript().decode', page)).toBe('function');
    });

    it('preserves genuine permission-failure feedback on ordinary websites', async () => {
        const {popup, chrome} = boot('http://localhost:3000/sample.html', {permissionDenied: true});
        popup.notifyPopupOpened();
        await vi.advanceTimersByTimeAsync(0);
        expect(chrome.notifications.create).toHaveBeenCalledWith('FeJson-notify-id',
            expect.objectContaining({message: expect.stringContaining('内容脚本注入失败')}));
    });
});
