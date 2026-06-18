/**
 * FeHelper 右键菜单管理
 * @type {{manage}}
 * @author zhaoxianlie
 */

import CrxDownloader from './crx-download.js';
import Awesome from './awesome.js';
import toolMap from './tools.js';
import Settings from '../options/settings.js';

const ROOT_MENU_CONTEXTS = ['page', 'selection', 'editable', 'link', 'image'];
const ROOT_DOCUMENT_PATTERNS = ['http://*/*', 'https://*/*', 'file://*/*'];
const MENU_GROUP_THRESHOLD = 8;
const TOOL_MENU_GROUPS = [
    {
        id: 'text-code',
        title: '文本与代码',
        tools: ['json-format', 'json-diff', 'code-beautify', 'code-compress', 'regexp', 'html2markdown']
    },
    {
        id: 'encode-convert',
        title: '编解码转换',
        tools: ['en-decode', 'timestamp', 'datetime-calc', 'trans-radix', 'trans-color', 'byte-unit', 'uuid-gen']
    },
    {
        id: 'page-debug',
        title: '页面与调试',
        tools: ['screenshot', 'color-picker', 'grid-ruler', 'page-timing', 'postman', 'websocket', 'page-monkey', 'devtools']
    },
    {
        id: 'image-qr',
        title: '二维码与图像',
        tools: ['qr-code', 'image-base64', 'svg-converter', 'chart-maker', 'poster-maker']
    },
    {
        id: 'efficiency-generate',
        title: '效率与生成',
        tools: ['aiagent', 'sticky-notes', 'mock-data', 'password', 'crontab', 'loan-rate', 'naotu', 'excel2json']
    }
];

export default (function () {

    let FeJson = {
        contextMenuId:"fhm_main",
        menuClickHandlers: {}
    };

    // 邮件菜单配置项
    let defaultMenuOptions = {
        'download-crx': {
            icon: 'DL',
            text: '插件下载分享',
            onClick: function (info, tab) {
                CrxDownloader.downloadCrx(tab);
            }
        },
        'fehelper-setting': {
            icon: 'SET',
            text: 'FeHelper设置',
            onClick: function (info, tab) {
                chrome.runtime.openOptionsPage();
            }
        }
    };

    // 初始化菜单配置
    let _initMenuOptions = (() => {

        Object.keys(toolMap).forEach(tool => {
            // context-menu
            switch (tool) {
                case 'json-format':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.selectionText || ''],
                            func: (text) => text
                        }, resp => {
                            if (chrome.runtime.lastError || !resp || !resp[0]) return;
                            globalThis.FeHelperBg.DynamicToolRunner({
                                tool, withContent: resp[0].result
                            });
                        });
                    };
                    break;

                case 'code-beautify':
                case 'en-decode':
                case 'datetime-calc':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.linkUrl || info.srcUrl || info.selectionText || info.pageUrl || ''],
                            func: (text) => text
                        }, resp => {
                            if (chrome.runtime.lastError || !resp || !resp[0]) return;
                            globalThis.FeHelperBg.DynamicToolRunner({
                                tool, withContent: resp[0].result
                            });
                        });
                    };
                    break;

                case 'qr-code':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.linkUrl || info.srcUrl || info.selectionText || info.pageUrl || tab.url || ''],
                            func: (text) => text
                        }, resp => {
                            if (chrome.runtime.lastError || !resp || !resp[0]) return;
                            globalThis.FeHelperBg.DynamicToolRunner({
                                tool, withContent: resp[0].result
                            });
                        });
                    };
                    toolMap[tool].menuConfig[1].onClick = function (info, tab) {
                        // 先确保 qr-code 的 content-script.js 已注入到当前页面（ISOLATED world，
                        // 因为它需要 chrome.runtime.sendMessage 上报解码结果），再触发解码逻辑，
                        // 避免 SW 重启或新标签页里 window.qrcodeContentScript 未就绪。
                        chrome.scripting.executeScript({
                            target: {tabId: tab.id, allFrames: false},
                            files: ['qr-code/content-script.js'],
                            injectImmediately: true
                        }).then(() => {
                            chrome.scripting.executeScript({
                                target: {tabId: tab.id, allFrames: false},
                                args: [info.srcUrl || ''],
                                func: (text) => {
                                    try {
                                        if (typeof window.qrcodeContentScript === 'function') {
                                            let qrcode = window.qrcodeContentScript();
                                            if (typeof qrcode.decode === 'function') {
                                                qrcode.decode(text);
                                                return 1;
                                            }
                                        }
                                        return 0;
                                    } catch (e) {
                                        return 0;
                                    }
                                }
                            }).catch(() => {});
                        }).catch(() => {});
                    };
                    break;

                default:
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        let runnerConfig = {
                            tool, withContent: tool === 'image-base64' ? info.srcUrl : ''
                        };
                        if (toolMap[tool].noPage) {
                            runnerConfig.noPage = true;
                        }
                        globalThis.FeHelperBg.DynamicToolRunner(runnerConfig);
                    };
                    break;
            }
        });
    })();

    // MV3: 单一全局监听器，通过 handler map 分发点击事件（避免 SW 重启后监听器丢失）
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        let handler = FeJson.menuClickHandlers[info.menuItemId];
        if (handler) {
            handler(info, tab);
        }
    });

    /**
     * 创建一个menu 菜单
     * @param toolName
     * @param menuList
     * @param parentId
     * @returns {boolean}
     * @private
     */
    let _createItem = (toolName, menuList, parentId) => {
        menuList && menuList.forEach && menuList.forEach(menu => {

            let menuItemId = 'fhm_c' + escape(menu.text).replace(/\W/g,'') + Date.now() + Math.floor(Math.random() * 1000);

            chrome.contextMenus.create({
                id: menuItemId,
                title: menu.text,
                contexts: menu.contexts || ['all'],
                parentId: parentId || FeJson.contextMenuId
            }, () => {
                if (chrome.runtime.lastError) return;
                FeJson.menuClickHandlers[menuItemId] = menu.onClick || (() => {
                    globalThis.FeHelperBg.DynamicToolRunner({ tool: toolName });
                });
            });
        });
    };

    let _ensureToolMenuConfig = (tool, toolInfo) => {
        if(!toolInfo.menuConfig) {
            toolInfo.menuConfig = [{
                icon: toolInfo.icon,
                text: toolInfo.name,
                onClick: (info, tab) => {
                    globalThis.FeHelperBg.DynamicToolRunner({
                        page: 'dynamic',
                        noPage: !!toolInfo.noPage,
                        query: `tool=${tool}`
                    });
                    if (toolInfo.noPage && typeof self !== 'undefined' && typeof self.close === 'function') {
                        setTimeout(() => self.close(), 200);
                    }
                }
            }];
        }
        return toolInfo.menuConfig;
    };

    let _createGroup = (groupId, title) => {
        chrome.contextMenus.create({
            id: groupId,
            title: title,
            contexts: ROOT_MENU_CONTEXTS,
            parentId: FeJson.contextMenuId
        }, () => { chrome.runtime.lastError; });
    };

    /**
     * 绘制一条分割线
     * @param parentId
     * @private
     */
    let _createSeparator = function (parentId) {
        chrome.contextMenus.create({
            id: 'fhm_s' + Math.ceil(Math.random()*10e9),
            type: 'separator',
            parentId: parentId || FeJson.contextMenuId
        }, () => { chrome.runtime.lastError; });
    };

    /**
     * 创建扩展专属的右键菜单（debounce 防并发）
     */
    let _initMenusTimer = null;
    let _initMenus = function () {
        clearTimeout(_initMenusTimer);
        _initMenusTimer = setTimeout(_doInitMenus, 80);
    };

    let _doInitMenus = function () {
        FeJson.menuClickHandlers = {};
        _removeContextMenu(() => {
            chrome.contextMenus.create({
                id: FeJson.contextMenuId,
                title: "FeHelper",
                contexts: ROOT_MENU_CONTEXTS,
                documentUrlPatterns: ROOT_DOCUMENT_PATTERNS
            }, () => {
                if (chrome.runtime.lastError) return;
                _buildChildMenus();
            });
        });
    };

    let _buildChildMenus = function () {
        let sysMenu = ['download-crx', 'fehelper-setting'];
        let arrPromises = [Awesome.getInstalledTools()].concat(sysMenu.map(menu => Awesome.menuMgr(menu, 'get')));

        Promise.all(arrPromises).then(values => {
            let tools = values[0] || {};
            let createdToolItems = _buildToolMenus(tools);
            _buildSystemMenus(values.slice(1), createdToolItems > 0);
        });
    };

    let _buildToolMenus = function (tools) {
        let allMenus = Object.keys(tools).filter(tool => tools[tool].installed && tools[tool].menu);
        allMenus.forEach(tool => _ensureToolMenuConfig(tool, tools[tool]));

        if (_getMenuItemCount(tools, allMenus) > MENU_GROUP_THRESHOLD) {
            return _buildGroupedToolMenus(tools, allMenus);
        }

        let onlineTools = allMenus.filter(tool => tool !== 'devtools' && !tools[tool].hasOwnProperty('_devTool'));
        let devTools = allMenus.filter(tool => tool === 'devtools' || tools[tool].hasOwnProperty('_devTool'));
        let itemCount = 0;

        onlineTools.forEach(tool => {
            itemCount += tools[tool].menuConfig.length;
            _createItem(tool, tools[tool].menuConfig);
        });

        devTools.length && onlineTools.length && _createSeparator();
        devTools.forEach(tool => {
            itemCount += tools[tool].menuConfig.length;
            _createItem(tool, tools[tool].menuConfig);
        });

        return itemCount;
    };

    let _getMenuItemCount = function (tools, toolNames) {
        return toolNames.reduce((count, tool) => count + (tools[tool].menuConfig ? tools[tool].menuConfig.length : 0), 0);
    };

    let _buildGroupedToolMenus = function (tools, allMenus) {
        let groupedTools = new Set();
        let itemCount = 0;

        TOOL_MENU_GROUPS.forEach(group => {
            let groupTools = group.tools.filter(tool => allMenus.includes(tool));
            if (!groupTools.length) return;

            let groupId = `fhm_g_${group.id}`;
            _createGroup(groupId, group.title);
            groupTools.forEach(tool => {
                groupedTools.add(tool);
                itemCount += tools[tool].menuConfig.length;
                _createItem(tool, tools[tool].menuConfig, groupId);
            });
        });

        let otherTools = allMenus.filter(tool => !groupedTools.has(tool));
        if (otherTools.length) {
            let groupId = 'fhm_g_other';
            _createGroup(groupId, '其他工具');
            otherTools.forEach(tool => {
                itemCount += tools[tool].menuConfig.length;
                _createItem(tool, tools[tool].menuConfig, groupId);
            });
        }

        return itemCount;
    };

    let _buildSystemMenus = function (values, hasToolItems) {
        let sysMenuItems = [];
        String(values[0]) === '1' && sysMenuItems.push(defaultMenuOptions['download-crx']);
        String(values[1]) !== '0' && sysMenuItems.push(defaultMenuOptions['fehelper-setting']);

        if (sysMenuItems.length) {
            hasToolItems && _createSeparator();
            sysMenuItems.forEach(menu => _createItem(menu.text, [menu]));
        }
    };

    /**
     * 移除扩展专属的右键菜单
     */
    let _removeContextMenu = function (callback) {
        chrome.contextMenus.removeAll(callback);
    };

    /**
     * 创建或移除扩展专属的右键菜单
     */
    let _createOrRemoveContextMenu = function () {
        Settings.getOptions((opts) => {
            if (String(opts['OPT_ITEM_CONTEXTMENUS']) !== 'false') {
                _initMenus();
            } else {
                _removeContextMenu();
            }
        });
    };

    return {
        rebuild: _createOrRemoveContextMenu
    };
})();
