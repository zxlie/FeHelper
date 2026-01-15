/**
 * FeHelper 右键菜单管理
 * @type {{manage}}
 * @author zhaoxianlie
 */

import CrxDownloader from './crx-download.js';
import Awesome from './awesome.js';
import toolMap from './tools.js';
import Settings from '../options/settings.js';

export default (function () {

    let FeJson = {
        contextMenuId:"fhm_main",
        // 全局监听器映射表，存储菜单ID到点击处理函数的映射
        menuClickHandlers: {}
    };

    // 邮件菜单配置项
    let defaultMenuOptions = {
        'download-crx': {
            icon: '♥',
            text: '插件下载分享',
            onClick: function (info, tab) {
                CrxDownloader.downloadCrx(tab);
            }
        },
        'fehelper-setting': {
            icon: '❂',
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
                        console.log('[FeHelper-Menu] 点击菜单: JSON格式化', { tabId: tab.id, selectionText: info.selectionText?.length > 0 ? '有选中内容' : '无选中内容' });
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.selectionText || ''],
                            func: (text) => text
                        }, resp => {
                            console.log('[FeHelper-Menu] JSON格式化脚本执行完成', { hasResult: !!resp[0].result });
                            chrome.DynamicToolRunner({
                                tool, withContent: resp[0].result
                            });
                        });
                    };
                    break;

                case 'code-beautify':
                case 'en-decode':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        console.log(`[FeHelper-Menu] 点击菜单: ${tool === 'code-beautify' ? '代码美化' : '信息编码转换'}`, { tabId: tab.id });
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.linkUrl || info.srcUrl || info.selectionText || info.pageUrl || ''],
                            func: (text) => text
                        }, resp => {
                            console.log(`[FeHelper-Menu] ${tool}脚本执行完成`, { hasResult: !!resp[0].result });
                            chrome.DynamicToolRunner({
                                tool, withContent: resp[0].result
                            });
                        });
                    };
                    break;

                case 'qr-code':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        console.log('[FeHelper-Menu] 点击菜单: 二维码生成器', { tabId: tab.id });
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.linkUrl || info.srcUrl || info.selectionText || info.pageUrl || tab.url || ''],
                            func: (text) => text
                        }, resp => {
                            console.log('[FeHelper-Menu] 二维码生成器脚本执行完成', { hasResult: !!resp[0].result });
                            chrome.DynamicToolRunner({
                                tool, withContent: resp[0].result
                            });
                        });
                    };
                    toolMap[tool].menuConfig[1].onClick = function (info, tab) {
                        console.log('[FeHelper-Menu] 点击菜单: 二维码解码器', { tabId: tab.id, hasSrcUrl: !!info.srcUrl });
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
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
                                } catch (e) {
                                    console.error('[FeHelper-Menu] 二维码解码失败', e);
                                    return 0;
                                }
                            }
                        });
                    };
                    break;

                default:
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        console.log(`[FeHelper-Menu] 点击菜单: ${toolMap[tool].name}`, { tabId: tab.id, toolName: tool });
                        chrome.DynamicToolRunner({
                            tool, withContent: tool === 'image-base64' ? info.srcUrl : ''
                        })
                    };
                    break;
            }
        });
    })();

    // 全局菜单点击事件监听器
    let _globalMenuClickListener = function(info, tab) {
        if (FeJson.menuClickHandlers[info.menuItemId]) {
            FeJson.menuClickHandlers[info.menuItemId](info, tab);
        } else {
            // 尝试重新构建菜单
            _initMenus();
        }
    };

    // 注册全局监听器（只注册一次）
    if (!chrome.contextMenus.onClicked.hasListener(_globalMenuClickListener)) {
        chrome.contextMenus.onClicked.addListener(_globalMenuClickListener);
    }

    /**
     * 创建一个menu 菜单
     * @param toolName
     * @param menuList
     * @returns {boolean}
     * @private
     */
    let _createItem = (toolName, menuList) => {
        menuList && menuList.forEach && menuList.forEach(menu => {

            // 确保每次创建出来的是一个新的主菜单，防止onClick事件冲突
            let menuItemId = 'fhm_c' + escape(menu.text).replace(/\W/g,'') + new Date*1 + Math.floor(Math.random()*1000);

            chrome.contextMenus.create({
                id: menuItemId,
                title: menu.icon + '  ' + menu.text,
                contexts: menu.contexts || ['all'],
                parentId: FeJson.contextMenuId
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('[FeHelper-Menu] 创建菜单失败:', chrome.runtime.lastError.message, { menuItemId, toolName });
                } else {
                    // 将菜单ID和点击处理函数存储到映射表中
                    FeJson.menuClickHandlers[menuItemId] = menu.onClick || function() {
                        chrome.DynamicToolRunner({ tool: toolName });
                    };
                }
            });
        });
    };


    /**
     * 绘制一条分割线
     * @private
     */
    let _createSeparator = function () {
        let separatorId = 'fhm_s' + Math.ceil(Math.random()*10e9);
        chrome.contextMenus.create({
            id: separatorId,
            type: 'separator',
            parentId: FeJson.contextMenuId
        });
    };

    /**
     * 创建扩展专属的右键菜单
     */
    let _initMenus = function () {
        // 清空监听器映射表
        FeJson.menuClickHandlers = {};
        
        _removeContextMenu(() => {
            // 先创建主菜单，确保父菜单存在
            chrome.contextMenus.create({
                id: FeJson.contextMenuId ,
                title: "FeHelper",
                contexts: ['page', 'selection', 'editable', 'link', 'image'],
                documentUrlPatterns: ['http://*/*', 'https://*/*', 'file://*/*']
            }, (id) => {
                if (chrome.runtime.lastError) {
                    console.error('[FeHelper-Menu] 创建主菜单失败:', chrome.runtime.lastError.message);
                    return; // 主菜单创建失败，终止后续操作
                }
                
                // 主菜单创建成功后，再创建其他菜单
                Promise.all([
                    // 绘制用户安装的菜单
                    Awesome.getInstalledTools().then(tools => {
                        let allMenus = Object.keys(tools).filter(tool => tools[tool].installed && tools[tool].menu);
                        let onlineTools = allMenus.filter(tool => tool !== 'devtools' && !tools[tool].hasOwnProperty('_devTool'));
                        let devTools = allMenus.filter(tool => tool === 'devtools' || tools[tool].hasOwnProperty('_devTool'));

                        // 绘制FH提供的工具菜单
                        onlineTools.forEach(tool => _createItem(tool, tools[tool].menuConfig));
                        
                        // 如果有本地工具的菜单需要绘制，则需要加一条分割线
                        if (devTools.length > 0) {
                            _createSeparator();
                            // 绘制本地工具的菜单
                            devTools.forEach(tool => {
                                // 说明是自定义工具 构造menuConfig
                                if(!tools[tool].menuConfig) {
                                    tools[tool].menuConfig = [{
                                        icon: tools[tool].icon,
                                        text: tools[tool].name,
                                        onClick: (info, tab) => {
                                            chrome.DynamicToolRunner({
                                                page: 'dynamic',
                                                noPage: !!tools[tool].noPage,
                                                query: `tool=${tool}`
                                            });
                                            !!tools[tool].noPage && setTimeout(window.close, 200);
                                        }
                                    }];
                                }
                                _createItem(tool, tools[tool].menuConfig)
                            });
                        }
                        
                        return tools;
                    }),
                    
                    // 获取系统菜单配置
                    (async () => {
                        let sysMenu = ['download-crx', 'fehelper-setting'];
                        let arrPromises = sysMenu.map(menu => Awesome.menuMgr(menu, 'get'));
                        let values = await Promise.all(arrPromises);
                        return { sysMenu, values };
                    })()
                ]).then(([tools, sysMenuConfig]) => {
                    // 绘制两个系统提供的菜单，放到最后
                    let { sysMenu, values } = sysMenuConfig;
                    let needDraw = String(values[0]) === '1' || String(values[1]) !== '0';

                    // 绘制一条分割线
                    _createSeparator();

                    // 绘制菜单
                    if (String(values[0]) === '1') {
                        _createItem(sysMenu[0], [defaultMenuOptions[sysMenu[0]]]);
                    }
                    if (String(values[1]) !== '0') {
                        _createItem(sysMenu[1], [defaultMenuOptions[sysMenu[1]]]);
                    }
                });
            });
        });
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
