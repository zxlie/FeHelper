import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import toolMap from '../apps/background/tools.js';

const MENU_TOOL_NAMES = Object.keys(toolMap);

function createStorageSeed(toolNames = MENU_TOOL_NAMES) {
    const seed = {
        'DYNAMIC_MENU:download-crx': '0',
        'DYNAMIC_MENU:fehelper-setting': '0'
    };

    toolNames.forEach((toolName, index) => {
        seed[`DYNAMIC_TOOL:${toolName}`] = String(index + 1);
        seed[`DYNAMIC_MENU:${toolName}`] = '1';
    });

    return seed;
}

function createChromeMock(storageSeed = createStorageSeed()) {
    const createdMenus = [];
    const clickListeners = [];
    const scriptCalls = [];
    const storageData = { ...storageSeed };

    const getStorage = (keys, callback) => {
        if (keys === null) {
            callback({ ...storageData });
            return;
        }

        if (Array.isArray(keys)) {
            const result = {};
            keys.forEach(key => {
                if (Object.prototype.hasOwnProperty.call(storageData, key)) {
                    result[key] = storageData[key];
                }
            });
            callback(result);
            return;
        }

        if (typeof keys === 'string') {
            callback({ [keys]: storageData[keys] });
            return;
        }

        callback({});
    };

    const chromeMock = {
        runtime: {
            lastError: null,
            getManifest: () => ({ homepage_url: 'https://fehelper.com/' }),
            openOptionsPage: vi.fn()
        },
        contextMenus: {
            create: vi.fn((item, callback) => {
                createdMenus.push({ ...item });
                callback && callback();
            }),
            removeAll: vi.fn(callback => {
                createdMenus.length = 0;
                callback && callback();
            }),
            onClicked: {
                addListener: vi.fn(listener => clickListeners.push(listener))
            }
        },
        scripting: {
            executeScript: vi.fn((opts, callback) => {
                scriptCalls.push(opts);
                const result = [{ result: opts.args ? opts.args[0] : undefined }];
                callback && callback(result);
                return Promise.resolve(result);
            })
        },
        storage: {
            local: {
                get: vi.fn(getStorage),
                set: vi.fn((items, callback) => {
                    Object.assign(storageData, items);
                    callback && callback();
                }),
                remove: vi.fn((keys, callback) => {
                    [].concat(keys).forEach(key => delete storageData[key]);
                    callback && callback();
                })
            }
        }
    };

    return { chromeMock, createdMenus, clickListeners, scriptCalls };
}

async function flushPromises(times = 5) {
    for (let i = 0; i < times; i++) {
        await Promise.resolve();
    }
}

async function loadAndRebuildMenu() {
    vi.resetModules();
    const menuModule = await import('../apps/background/menu.js');
    menuModule.default.rebuild();
    await vi.advanceTimersByTimeAsync(100);
    await flushPromises();
    return menuModule.default;
}

function getChildMenus(createdMenus) {
    return createdMenus.filter(item => item.parentId === 'fhm_main' && item.type !== 'separator');
}

function getToolMenus(createdMenus) {
    return createdMenus.filter(item => item.type !== 'separator' && String(item.id || '').startsWith('fhm_c'));
}

function clickMenuByText(createdMenus, clickListeners, text, info = {}, tab = { id: 7, url: 'https://example.com/' }) {
    const item = getToolMenus(createdMenus).find(menu => menu.title === text);
    expect(item, `missing menu item: ${text}`).toBeTruthy();
    clickListeners.forEach(listener => listener({ menuItemId: item.id, ...info }, tab));
}

describe('background context menu wiring', () => {
    let chromeState;

    beforeEach(() => {
        vi.useFakeTimers();
        chromeState = createChromeMock();
        globalThis.chrome = chromeState.chromeMock;
        globalThis.FeHelperBg = {
            DynamicToolRunner: vi.fn()
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete globalThis.chrome;
        delete globalThis.FeHelperBg;
    });

    it('creates a child menu for every configured built-in menu item', async () => {
        await loadAndRebuildMenu();

        const toolTitles = getToolMenus(chromeState.createdMenus).map(item => item.title);
        const expectedTitles = MENU_TOOL_NAMES.flatMap(toolName => {
            return toolMap[toolName].menuConfig.map(menu => menu.text);
        });

        expectedTitles.forEach(title => {
            expect(toolTitles).toContain(title);
        });
        expect(toolTitles).toHaveLength(expectedTitles.length);
        expect(toolTitles).not.toContain('J  JSON格式化');
        expect(toolTitles).not.toContain('FMT  代码美化工具');
        expect(toolTitles).not.toContain('SET  FeHelper设置');
    });

    it('groups large menu sets by task family instead of flooding the root menu', async () => {
        await loadAndRebuildMenu();

        const rootTitles = getChildMenus(chromeState.createdMenus).map(item => item.title);
        expect(rootTitles).toEqual([
            '文本与代码',
            '编解码转换',
            '页面与调试',
            '二维码与图像',
            '效率与生成'
        ]);

        const jsonMenu = getToolMenus(chromeState.createdMenus).find(menu => menu.title === 'JSON格式化');
        const screenshotMenu = getToolMenus(chromeState.createdMenus).find(menu => menu.title === '网页截屏工具');

        expect(jsonMenu.parentId).toBe('fhm_g_text-code');
        expect(screenshotMenu.parentId).toBe('fhm_g_page-debug');
    });

    it('keeps small menu sets flat for direct access', async () => {
        chromeState = createChromeMock(createStorageSeed(['json-format', 'qr-code']));
        globalThis.chrome = chromeState.chromeMock;

        await loadAndRebuildMenu();

        const rootTitles = getChildMenus(chromeState.createdMenus).map(item => item.title);
        expect(rootTitles).toContain('JSON格式化');
        expect(rootTitles).toContain('二维码生成器');
        expect(rootTitles).not.toContain('文本与代码');
    });

    it('maps every menu tool to an existing page or noPage content script', () => {
        MENU_TOOL_NAMES.forEach(toolName => {
            const tool = toolMap[toolName];
            if (tool.noPage) {
                expect(
                    fs.existsSync(path.resolve(`apps/${toolName}/content-script.js`)),
                    `${toolName} noPage content script should exist`
                ).toBe(true);
                return;
            }

            expect(
                fs.existsSync(path.resolve(`apps/${toolName}/index.html`)),
                `${toolName} menu page should exist`
            ).toBe(true);
        });
    });

    it('dispatches noPage tools through the page-injection runner path', async () => {
        await loadAndRebuildMenu();

        ['screenshot', 'color-picker', 'grid-ruler', 'page-timing'].forEach(toolName => {
            clickMenuByText(
                chromeState.createdMenus,
                chromeState.clickListeners,
                toolMap[toolName].menuConfig[0].text
            );
            expect(globalThis.FeHelperBg.DynamicToolRunner).toHaveBeenLastCalledWith(expect.objectContaining({
                tool: toolName,
                noPage: true
            }));
        });
    });

    it('forwards right-click content into tools that consume page context', async () => {
        await loadAndRebuildMenu();

        clickMenuByText(
            chromeState.createdMenus,
            chromeState.clickListeners,
            'JSON格式化',
            { selectionText: '{"a":1}' }
        );
        expect(globalThis.FeHelperBg.DynamicToolRunner).toHaveBeenLastCalledWith({
            tool: 'json-format',
            withContent: '{"a":1}'
        });

        clickMenuByText(
            chromeState.createdMenus,
            chromeState.clickListeners,
            '字符串编解码',
            { linkUrl: 'https://example.com/a?b=1', selectionText: 'ignored' }
        );
        expect(globalThis.FeHelperBg.DynamicToolRunner).toHaveBeenLastCalledWith({
            tool: 'en-decode',
            withContent: 'https://example.com/a?b=1'
        });

        clickMenuByText(
            chromeState.createdMenus,
            chromeState.clickListeners,
            '二维码生成器',
            { srcUrl: 'https://example.com/image.png', pageUrl: 'https://example.com/' }
        );
        expect(globalThis.FeHelperBg.DynamicToolRunner).toHaveBeenLastCalledWith({
            tool: 'qr-code',
            withContent: 'https://example.com/image.png'
        });

        clickMenuByText(
            chromeState.createdMenus,
            chromeState.clickListeners,
            '图片与base64',
            { srcUrl: 'https://example.com/image.png' }
        );
        expect(globalThis.FeHelperBg.DynamicToolRunner).toHaveBeenLastCalledWith(expect.objectContaining({
            tool: 'image-base64',
            withContent: 'https://example.com/image.png'
        }));

        clickMenuByText(
            chromeState.createdMenus,
            chromeState.clickListeners,
            '时间戳计算器',
            { selectionText: '1699999999' }
        );
        expect(globalThis.FeHelperBg.DynamicToolRunner).toHaveBeenLastCalledWith({
            tool: 'datetime-calc',
            withContent: '1699999999'
        });
    });

    it('injects the qr-code decoder content script from the image context menu', async () => {
        await loadAndRebuildMenu();

        clickMenuByText(
            chromeState.createdMenus,
            chromeState.clickListeners,
            '二维码解码器',
            { srcUrl: 'https://example.com/qr.png' }
        );

        expect(chromeState.chromeMock.scripting.executeScript).toHaveBeenCalledWith(
            expect.objectContaining({
                target: { tabId: 7, allFrames: false },
                files: ['qr-code/content-script.js'],
                injectImmediately: true
            })
        );
    });

    it('keeps noPage execution resilient by injecting content scripts before invoking page functions', () => {
        const backgroundSource = fs.readFileSync(path.resolve('apps/background/background.js'), 'utf8');
        const start = backgroundSource.indexOf('if (configs.noPage)');
        const end = backgroundSource.indexOf('chrome.tabs.query({currentWindow: true}', start);
        const noPageBranch = backgroundSource.slice(start, end);

        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
        expect(noPageBranch).toContain('contentScriptJs');
        expect(noPageBranch).toContain('toolInfo._devTool');
        expect(noPageBranch).toContain('Awesome.getContentScript(tool)');
        expect(noPageBranch).toContain('_getContentScriptFiles(tool)');
        expect(noPageBranch).toContain("tool.replace(/[-_]/g, '')");
        expect(noPageBranch).toContain("toolFunc + 'ContentScript'");
        expect(noPageBranch).toContain("toolFunc + 'NoPage'");
    });

    it('lets datetime-calc consume selected text passed from the menu', () => {
        const source = fs.readFileSync(path.resolve('apps/datetime-calc/index.js'), 'utf8');

        expect(source).toContain('loadContextMenuContent');
        expect(source).toContain("thing: 'request-page-content'");
        expect(source).toContain('applySmartParserInput');
        expect(source).toContain("this.setActiveTab('smart-parser')");
    });
});
