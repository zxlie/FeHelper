import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import MSG_TYPE from '../../apps/static/js/common.js';
import * as openMode from '../../apps/background/open-mode.js';
import * as urlPolicy from '../../apps/background/url-policy.js';
import { makePopup, nodes } from './harness.js';

function setup() {
    vi.useFakeTimers();
    // Leave recent-tool storage pending: it must not delay launching or closing.
    const harness = makePopup({ storage: { set: vi.fn() } });
    harness.context.window.close = vi.fn();
    harness.context.MSG_TYPE.OPEN_DYNAMIC_TOOL = 'open-dynamic-tool';
    harness.popup.applyCachedTools();
    return harness;
}

async function finishLaunch() {
    await vi.advanceTimersByTimeAsync(200);
}

// Execute the real background startup, message listener and tool runner. Only
// browser APIs and unrelated services are stubbed; no tab-focus auto-close is
// simulated, matching the Firefox behavior reported in the issue.
function connectBackground({ popup, context }) {
    const listeners = [];
    const tab = { id: 7, index: 0, windowId: 1, active: true, url: 'http://localhost/sample.html' };
    const chrome = context.chrome;
    chrome.runtime.onMessage = { addListener: listener => listeners.push(listener) };
    chrome.runtime.onInstalled = chrome.runtime.onStartup = { addListener: vi.fn() };
    chrome.runtime.getManifest = () => ({});
    chrome.runtime.setUninstallURL = vi.fn();
    chrome.runtime.getURL = file => `moz-extension://sample/${file}`;
    chrome.runtime.sendMessage.mockImplementation(request => new Promise(resolve => {
        listeners.forEach(listener => listener(request, {}, resolve));
    }));
    chrome.action = { onClicked: { addListener: vi.fn() }, setPopup: vi.fn() };
    chrome.alarms = { onAlarm: { addListener: vi.fn() }, create: vi.fn() };
    chrome.tabs = {
        onUpdated: { addListener: vi.fn() },
        query: vi.fn((_query, callback) => callback([tab])),
        create: vi.fn(async () => ({ id: 42 }))
    };
    chrome.notifications = { create: vi.fn(), clear: vi.fn() };
    const inject = vi.fn();
    const sandbox = {
        chrome, MSG_TYPE, ...openMode, ...urlPolicy,
        console: context.console, setTimeout, clearTimeout,
        Settings: { getOptions: callback => callback({}) },
        Awesome: { getInstalledTools: async () => popup.fhTools, gcLocalFiles: vi.fn() },
        Statistics: { init: vi.fn(), recordToolUsage: vi.fn() },
        Menu: { rebuild: vi.fn() }, InjectTools: { inject }
    };
    vm.runInNewContext(fs.readFileSync('apps/background/background.js', 'utf8')
        .replace(/^import[\s\S]*?;\s*$/gm, ''), sandbox);
    return { chrome, inject };
}

afterEach(() => vi.useRealTimers());

describe('Issue #683: close the extension popup after launching a tool', () => {
    it.each(['lite', 'omni'])('closes after a rendered %s tool row opens a tab', async mode => {
        const { popup, context } = setup();
        popup.uiMode = mode;
        let acknowledge;
        context.chrome.runtime.sendMessage.mockImplementation(() => new Promise(resolve => {
            acknowledge = resolve;
        }));
        const launch = nodes(popup._render(), 'fh-tool-row')[0].data.on.click();
        expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: 'open-dynamic-tool', page: 'json-format', noPage: false
        });
        await finishLaunch();
        expect(context.window.close).not.toHaveBeenCalled();
        acknowledge({ ok: true, action: 'create', tabId: 42 });
        await launch;
        await finishLaunch();
        expect(context.window.close).toHaveBeenCalledTimes(1);
    });

    it.each(['Enter', 'Digit1'])('closes when launched using %s', async key => {
        const { popup, context } = setup();
        popup.activeToolKey = 'json-format';
        context.chrome.runtime.sendMessage.mockResolvedValue({ ok: true, action: 'reuse', tabId: 42 });
        popup.handlePanelKeydown({
            key: key === 'Digit1' ? '1' : key, code: key,
            altKey: key === 'Digit1', target: { tagName: 'INPUT' }, preventDefault: vi.fn()
        });
        await finishLaunch();
        expect(context.chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
        expect(context.window.close).toHaveBeenCalledTimes(1);
    });

    it('preserves custom-tool parameters when opening a separate tool window', async () => {
        const { popup, context } = setup();
        popup.fhTools.custom = { installed: true, _devTool: true };
        context.chrome.runtime.sendMessage.mockResolvedValue({ ok: true, action: 'create-window', tabId: 42 });
        await popup.runHelper('custom', { query: 'mode=test', withContent: 'sample' });
        await finishLaunch();
        expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: 'open-dynamic-tool', page: 'dynamic', noPage: false,
            query: 'tool=custom&mode=test', withContent: 'sample'
        });
        expect(context.window.close).toHaveBeenCalledTimes(1);
    });

    it('still closes after handing a noPage tool to the background content-script runner', async () => {
        const { popup, context } = setup();
        popup.fhTools['grid-ruler'] = { installed: true, noPage: true };
        context.chrome.runtime.sendMessage.mockResolvedValue({ ok: true, noPage: true });
        await popup.runHelper('grid-ruler');
        await finishLaunch();
        expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: 'open-dynamic-tool', page: 'grid-ruler', noPage: true
        });
        expect(context.window.close).toHaveBeenCalledTimes(1);
    });

    it.each(['response', 'rejection', 'throw'])('keeps the popup open on a %s failure', async failure => {
        const { popup, context } = setup();
        const error = new Error('Launch failed');
        context.chrome.runtime.sendMessage.mockImplementation(() => {
            if (failure === 'throw') throw error;
            if (failure === 'rejection') return Promise.reject(error);
            return Promise.resolve({ ok: false, error: error.message });
        });
        await popup.runHelper('json-format');
        await finishLaunch();
        expect(context.window.close).not.toHaveBeenCalled();
        expect(context.console.error).toHaveBeenCalledTimes(1);
    });

    it('does not launch or close for an unknown tool', async () => {
        const { popup, context } = setup();
        await popup.runHelper('missing');
        await finishLaunch();
        expect(context.chrome.runtime.sendMessage).not.toHaveBeenCalled();
        expect(context.window.close).not.toHaveBeenCalled();
    });

    it('closes through the real background startup/message/tab creation chain', async () => {
        const harness = setup();
        const { chrome } = connectBackground(harness);
        await nodes(harness.popup._render(), 'fh-tool-row')[0].data.on.click();
        await finishLaunch();
        expect(chrome.tabs.create).toHaveBeenCalledExactlyOnceWith({
            url: '/json-format/index.html', active: true, index: 1, windowId: 1
        });
        expect(harness.context.window.close).toHaveBeenCalledTimes(1);
    });

    it('preserves the background content-script handoff before closing noPage tools', async () => {
        const harness = setup();
        harness.popup.fhTools['grid-ruler'] = { installed: true, noPage: true, contentScriptJs: true };
        const { chrome, inject } = connectBackground(harness);
        await harness.popup.runHelper('grid-ruler');
        await finishLaunch();
        expect(chrome.tabs.create).not.toHaveBeenCalled();
        expect(inject).toHaveBeenCalledExactlyOnceWith(7, {
            files: ['grid-ruler/content-script.js'], func: expect.any(Function),
            args: ['gridrulerContentScript', 'gridrulerNoPage', expect.objectContaining({ id: 7 })]
        });
        expect(harness.context.window.close).toHaveBeenCalledTimes(1);
    });
});
