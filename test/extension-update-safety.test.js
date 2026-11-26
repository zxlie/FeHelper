import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Menu from '../apps/background/menu.js';
import Statistics from '../apps/background/statistics.js';

vi.mock('../apps/background/menu.js', () => ({ default: { rebuild: vi.fn() } }));
vi.mock('../apps/background/statistics.js', () => ({
    default: { init: vi.fn(), recordUpdate: vi.fn(), recordInstallation: vi.fn() }
}));
vi.mock('../apps/background/awesome.js', () => ({
    default: { getInstalledTools: async () => ({}), gcLocalFiles: vi.fn() }
}));

function event() {
    const listeners = [];
    return {
        addListener: fn => listeners.push(fn),
        fire: (...args) => listeners.forEach(fn => fn(...args))
    };
}

// Boot the manifest's worker with local events and persisted settings, without a store connection.
async function boot(settings = {}, requestUpdateCheck = callback => callback('no_update')) {
    vi.useFakeTimers();
    vi.resetModules();
    const chrome = {
        runtime: {
            onMessage: event(), onInstalled: event(), onStartup: event(),
            getManifest: () => ({}), getURL: path => path, setUninstallURL: vi.fn(),
            requestUpdateCheck: vi.fn(requestUpdateCheck), reload: vi.fn(), openOptionsPage: vi.fn()
        },
        action: { onClicked: event(), setPopup: vi.fn(), setBadgeText: vi.fn() },
        alarms: { create: vi.fn(), onAlarm: event() },
        notifications: { create: vi.fn(), clear: vi.fn() },
        storage: { local: { get: (_keys, callback) => callback(settings) } },
        tabs: { onUpdated: event(), create: vi.fn() },
        webNavigation: {
            onCommitted: event(), onDOMContentLoaded: event(), onCompleted: event(), onHistoryStateUpdated: event()
        }
    };
    vi.stubGlobal('chrome', chrome);
    vi.stubGlobal('navigator', { userAgent: 'Chrome' });
    await import('../apps/background/background.js');
    return chrome;
}

function expectSilent(chrome) {
    expect(chrome.notifications.create).not.toHaveBeenCalled();
    expect(chrome.action.setBadgeText).not.toHaveBeenCalled();
    expect(chrome.runtime.openOptionsPage).not.toHaveBeenCalled();
    expect(chrome.tabs.create).not.toHaveBeenCalled();
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    delete globalThis.FeHelperBg;
});

describe('extension update safety', () => {
    it.each([{}, { AUTO_APPLY_EXTENSION_UPDATE: 'false' }])(
        'Issue #631/#691: startup and daily checks defer silently with options %j', async settings => {
            const chrome = await boot(settings, callback => callback('update_available'));
            chrome.alarms.onAlarm.fire({ name: 'fehelper-check-update' });
            await vi.runAllTimersAsync();
            expect(chrome.runtime.requestUpdateCheck).toHaveBeenCalledTimes(2);
            expect(chrome.runtime.reload).not.toHaveBeenCalled();
            expectSilent(chrome);
        }
    );

    it('applies an available update silently when the user opted in', async () => {
        const chrome = await boot({ AUTO_APPLY_EXTENSION_UPDATE: 'true' }, async () => ({ status: 'update_available' }));
        await vi.runAllTimersAsync();
        expect(chrome.runtime.reload).toHaveBeenCalledTimes(1);
        expectSilent(chrome);
    });

    it.each(['no_update', 'throttled'])('keeps tool pages open on %s even with automatic reload enabled', async status => {
        const chrome = await boot({ AUTO_APPLY_EXTENSION_UPDATE: true }, callback => callback(status));
        await vi.runAllTimersAsync();
        expect(chrome.runtime.reload).not.toHaveBeenCalled();
        expectSilent(chrome);
    });

    it.each(['2019.12.2415', '2026.11.20'])('finishes an upgrade from %s silently', async previousVersion => {
        const chrome = await boot();
        Menu.rebuild.mockClear();
        chrome.runtime.onInstalled.fire({ reason: 'update', previousVersion });
        await vi.runAllTimersAsync();
        expect(Menu.rebuild).toHaveBeenCalledTimes(1);
        expect(Statistics.recordUpdate).toHaveBeenCalledWith(previousVersion);
        expectSilent(chrome);
    });

    it('still opens onboarding on first install', async () => {
        const chrome = await boot();
        chrome.runtime.onInstalled.fire({ reason: 'install' });
        expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
        expect(Statistics.recordInstallation).toHaveBeenCalledTimes(1);
    });

    it('shows the installed version and retains the reload preference without advertising releases', () => {
        const html = fs.readFileSync('apps/options/index.html', 'utf8');
        const source = fs.readFileSync('apps/options/index.js', 'utf8');
        expect(html).toContain('v{{manifest.version}}');
        expect(html).toContain('value="AUTO_APPLY_EXTENSION_UPDATE"');
        expect(source).toContain("'AUTO_APPLY_EXTENSION_UPDATE'");
        expect(html).not.toMatch(/正在检查版本|已是最新版|立即更新|只提醒有新版本/);
        expect(source).not.toContain('fehelper_latest_version_data');
    });
});
