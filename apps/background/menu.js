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
        contextMenuId:"fhm_main"
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
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.selectionText],
                            func: (text) => text
                        }, resp => chrome.DynamicToolRunner({
                            tool, withContent: resp[0].result
                        }));
                    };
                    break;

                case 'code-beautify':
                case 'en-decode':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.linkUrl || info.srcUrl || info.selectionText || info.pageUrl],
                            func: (text) => text
                        }, resp => chrome.DynamicToolRunner({
                            tool, withContent: resp[0].result
                        }));
                    };
                    break;


                case 'qr-code':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.linkUrl || info.srcUrl || info.selectionText || info.pageUrl || tab.url],
                            func: (text) => text
                        }, resp => chrome.DynamicToolRunner({
                            tool, withContent: resp[0].result
                        }));
                    };
                    toolMap[tool].menuConfig[1].onClick = function (info, tab) {
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            args: [info.srcUrl],
                            func: (text) => {
                                try {
                                    if (typeof window.qrcodeContentScript === 'function') {
                                        let qrcode = window.qrcodeContentScript();
                                        if (typeof qrcode.decode === 'function') {
                                            qrcode.decode(pInfo.srcUrl);
                                            return 1;
                                        }
                                    }
                                } catch (e) {
                                    return 0;
                                }
                            }
                        });
                    };
                    break;

                default:
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.DynamicToolRunner({
                            tool, withContent: tool === 'image-base64' ? info.srcUrl : ''
                        })
                    };
                    break;
            }
        });
    })();

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
            let menuItemId = 'fhm_c' + escape(menu.text).replace(/\W/g,'')+(new Date()*1);

            chrome.contextMenus.create({
                id: menuItemId,
                title: menu.icon + '  ' + menu.text,
                contexts: menu.contexts || ['all'],
                parentId: FeJson.contextMenuId
            });

            chrome.contextMenus.onClicked.addListener(((tool,mId,mFunc) => (info, tab) => {
                if(info.menuItemId === mId) {
                    if(mFunc) {
                        mFunc(info,tab);
                    }else{
                        chrome.DynamicToolRunner({ tool });
                    }
                }
            })(toolName,menuItemId,menu.onClick));
        });
    };


    /**
     * 绘制一条分割线
     * @private
     */
    let _createSeparator = function () {
        chrome.contextMenus.create({
            id: 'fhm_s' + Math.ceil(Math.random()*10e9),
            type: 'separator',
            parentId: FeJson.contextMenuId
        });
    };

    /**
     * 创建扩展专属的右键菜单
     */
    let _initMenus = function () {
        _removeContextMenu(() => {
            chrome.contextMenus.create({
                id: FeJson.contextMenuId,
                title: "FeHelper",
                contexts: ['page', 'selection', 'editable', 'link', 'image'],
                documentUrlPatterns: ['http://*/*', 'https://*/*', 'file://*/*']
            });

            // 绘制用户安装的菜单，放在前面
            Awesome.getInstalledTools().then(tools => {
                let allMenus = Object.keys(tools).filter(tool => tools[tool].installed && tools[tool].menu);
                let onlineTools = allMenus.filter(tool => tool !== 'devtools' && !tools[tool].hasOwnProperty('_devTool'));
                let devTools = allMenus.filter(tool => tool === 'devtools' || tools[tool].hasOwnProperty('_devTool'));

                // 绘制FH提供的工具菜单
                onlineTools.forEach(tool => _createItem(tool, tools[tool].menuConfig));
                // 如果有本地工具的菜单需要绘制，则需要加一条分割线
                devTools.length && _createSeparator();
                // 绘制本地工具的菜单
                devTools.forEach(tool => _createItem(tool, tools[tool].menuConfig));
            });

            // 绘制两个系统提供的菜单，放到最后
            let sysMenu = ['download-crx', 'fehelper-setting'];
            let arrPromises = sysMenu.map(menu => Awesome.menuMgr(menu, 'get'));
            Promise.all(arrPromises).then(values => {
                let needDraw = String(values[0]) === '1' || String(values[1]) !== '0';

                // 绘制一条分割线
                _createSeparator();

                // 绘制菜单
                String(values[0]) === '1' && _createItem(sysMenu[0], [defaultMenuOptions[sysMenu[0]]]);
                String(values[1]) !== '0' && _createItem(sysMenu[1], [defaultMenuOptions[sysMenu[1]]]);
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
