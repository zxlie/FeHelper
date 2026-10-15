import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { describe, expect, it } from 'vitest';
import {
    buildPopupWindowOptions,
    buildToolTabOptions,
    buildToolUrl,
    buildToolUrlPattern,
    resolveCreatedWindowTab,
    shouldOpenToolInPopup,
    shouldReuseExistingToolTab
} from '../apps/background/open-mode.js';

function readSource(file) {
    return fs.readFileSync(path.resolve(file), 'utf8');
}

function loadUlid(overrides = {}) {
    const sandbox = {
        console,
        Date,
        Math,
        Uint8Array,
        ...overrides
    };
    sandbox.globalThis = sandbox;
    sandbox.window = sandbox;
    vm.runInNewContext(readSource('apps/uuid-gen/ulid-core.js'), sandbox, { filename: 'ulid-core.js' });
    return sandbox.FHUlid;
}

describe('Issue #633 popup-window opening mode', () => {
    it('Issue #668: creates tool tabs immediately after the active tab in its window', () => {
        expect(buildToolTabOptions('/json-format/index.html', {index: 3, windowId: 7}))
            .toEqual({url: '/json-format/index.html', active: true, index: 4, windowId: 7});
        expect(buildToolTabOptions('/json-format/index.html', {index: 0, windowId: 0}))
            .toEqual({url: '/json-format/index.html', active: true, index: 1, windowId: 0});
        expect(buildToolTabOptions('/json-format/index.html', null))
            .toEqual({url: '/json-format/index.html', active: true});
    });
    it('keeps noPage tools in page injection mode and opens normal tools in popup windows when configured', () => {
        expect(shouldOpenToolInPopup({ noPage: true }, { OPEN_TOOL_IN_POPUP_WINDOW: 'true' })).toBe(false);
        expect(shouldOpenToolInPopup({ tool: 'json-format' }, { OPEN_TOOL_IN_POPUP_WINDOW: 'true' })).toBe(true);
        expect(shouldOpenToolInPopup({ tool: 'json-format', openMode: 'popup' }, {})).toBe(true);
        expect(shouldOpenToolInPopup({ tool: 'json-format' }, { OPEN_TOOL_IN_POPUP_WINDOW: 'false' })).toBe(false);
        expect(shouldReuseExistingToolTab({ FORBID_OPEN_IN_NEW_TAB: 'true' })).toBe(true);
    });

    it('builds extension tool URLs and Chrome popup-window options without changing tool pages', () => {
        expect(buildToolUrl('json-format', 'a=1')).toBe('/json-format/index.html?a=1');
        expect(buildPopupWindowOptions('/uuid-gen/index.html')).toEqual({
            url: '/uuid-gen/index.html',
            type: 'popup',
            focused: true,
            width: 1120,
            height: 760
        });
    });

    it('matches literal tool URLs when query strings contain regexp metacharacters', () => {
        const pattern = buildToolUrlPattern('code-beautify', 'fileType=c++&name=a.b');

        expect(pattern.test('chrome-extension://abc/code-beautify/index.html?fileType=c++&name=a.b')).toBe(true);
        expect(pattern.test('chrome-extension://abc/code-beautify/index.html?fileType=cccc&name=aXb')).toBe(false);
    });

    it('resolves the active tab after windows.create omits the optional tabs field', async () => {
        const queries = [];
        const tab = await resolveCreatedWindowTab({ id: 42 }, async query => {
            queries.push(query);
            return [{ id: 7, active: false }, { id: 8, active: true }];
        });

        expect(queries).toEqual([{ windowId: 42 }]);
        expect(tab).toEqual({ id: 8, active: true });
        expect(await resolveCreatedWindowTab({ id: 42, tabs: [{ id: 9 }] }, async () => {
            throw new Error('should not query');
        })).toEqual({ id: 9 });
    });

    it('wires DynamicToolRunner through windows.create while preserving withContent and noPage branches', () => {
        const source = readSource('apps/background/background.js');
        const noPageStart = source.indexOf('if (configs.noPage)');
        const openStart = source.indexOf('let tabs = await _queryTabs({currentWindow: true});');
        const noPageBranch = source.slice(noPageStart, openStart);
        const openBranch = source.slice(openStart, source.indexOf('} catch (e) {', openStart));

        expect(noPageBranch).not.toContain('chrome.windows.create');
        expect(openBranch).toContain('shouldOpenToolInPopup(configs, opts)');
        expect(openBranch).toContain('await _queryTabs(openAsPopupWindow ? {} : {currentWindow: true})');
        expect(openBranch).toContain("chrome.runtime.getURL(url.replace(/^\\//, ''))");
        expect(openBranch).toContain('chrome.windows.create(buildPopupWindowOptions(popupUrl))');
        expect(openBranch).toContain('await resolveCreatedWindowTab(win, _queryTabs)');
        expect(openBranch).toContain('_saveContentForTab(tab.id, withContent)');
        expect(openBranch).toContain("return {ok: true, action: 'create-window'");
        expect(openBranch).toContain('chrome.windows.update(windowId, {focused: true})');
    });

    it('exposes a user setting for popup-window mode', () => {
        expect(readSource('apps/options/settings.js')).toContain("'OPEN_TOOL_IN_POPUP_WINDOW': false");
        expect(readSource('apps/options/index.js')).toContain("'OPEN_TOOL_IN_POPUP_WINDOW'");
        expect(readSource('apps/options/index.html')).toContain('id="OPEN_TOOL_IN_POPUP_WINDOW"');
        expect(readSource('apps/options/index.html')).toContain('工具以弹出窗口打开');
    });
});

describe('Issue #633 ULID generator', () => {
    it('generates 26-char Crockford Base32 ULIDs and increments within the same millisecond', () => {
        const ulid = loadUlid({
            crypto: {
                getRandomValues(bytes) {
                    bytes.fill(0);
                    return bytes;
                }
            }
        });

        const first = ulid.generateULID(0);
        const second = ulid.generateULID(0);

        expect(first).toBe('00000000000000000000000000');
        expect(second).toBe('00000000000000000000000001');
        expect(first).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
        expect(second > first).toBe(true);
    });

    it('keeps ULIDs monotonic if the system clock moves backward briefly', () => {
        const ulid = loadUlid({
            crypto: {
                getRandomValues(bytes) {
                    bytes.fill(0);
                    return bytes;
                }
            }
        });

        const first = ulid.generateULID(2000);
        const second = ulid.generateULID(1999);

        expect(second.slice(0, 10)).toBe(first.slice(0, 10));
        expect(second > first).toBe(true);
    });

    it('adds the ULID UI and loads the core before the page controller', () => {
        const html = readSource('apps/uuid-gen/index.html');
        const js = readSource('apps/uuid-gen/index.js');
        const tools = readSource('apps/background/tools.js');

        expect(html).toContain('ULID 生成器');
        expect(html.indexOf('src="ulid-core.js"')).toBeLessThan(html.indexOf('src="index.js"'));
        expect(js).toContain('function generateULIDs()');
        expect(js).toContain('window.FHUlid.generateULID()');
        expect(tools).toContain('NanoID、ULID');
    });
});

describe('Issue #643 popup startup performance', () => {
    it('renders from cached or built-in tool metadata before async storage refresh and records startup marks', () => {
        const source = readSource('apps/popup/index.js');
        const createdBlock = source.slice(source.indexOf('created: function ()'), source.indexOf('mounted: function ()'));

        expect(source).toContain("const POPUP_TOOL_CACHE_KEY = 'fh-popup-installed-tools-cache';");
        expect(createdBlock).toContain("this.markStartup('created');");
        expect(createdBlock.indexOf('this.applyCachedTools();')).toBeLessThan(createdBlock.indexOf('this.loadTools();'));
        expect(source).toContain('buildSystemInstalledToolsSnapshot()');
        expect(source).toContain("performance.mark(`fh-popup-${name}`)");
        expect(source).toContain("this.markStartup('first-tools-ready');");
        expect(source).toContain("this.markStartup('tools-refreshed');");
        expect(source).toContain('this.cacheInstalledTools(this.fhTools);');
    });
});
