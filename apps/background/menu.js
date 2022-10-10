/**
 * FeHelper 右键菜单管理
 * @type {{manage}}
 * @author zhaoxianlie
 */

import CrxDownloader from './crx-download.js';
import Awesome from './awesome.js';
import toolMap from './tools.js';

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
                            func: () => info.selectionText
                        }, txt => chrome.DynamicToolRunner({
                            tool: 'json-format',
                            withContent: txt[0]
                        }));

                        // chrome.tabs.executeScript(tab.id, {
                        //     code: '(' + (function (pInfo) {
                        //         return pInfo.selectionText;
                        //     }).toString() + ')(' + JSON.stringify(info) + ')',
                        //     allFrames: false
                        // }, function (txt) {
                        //     chrome.DynamicToolRunner({
                        //         tool: 'json-format',
                        //         withContent: txt[0]
                        //     });
                        // });
                    };
                    break;

                case 'code-beautify':
                case 'en-decode':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.tabs.executeScript(tab.id, {
                            code: '(' + (function (pInfo) {
                                let linkUrl = pInfo.linkUrl;
                                let pageUrl = pInfo.pageUrl;
                                let imgUrl = pInfo.srcUrl;
                                let selection = pInfo.selectionText;

                                return linkUrl || imgUrl || selection || pageUrl;
                            }).toString() + ')(' + JSON.stringify(info) + ')',
                            allFrames: false
                        }, function (txt) {
                            chrome.DynamicToolRunner({
                                withContent: txt[0],
                                query: `tool=${tool}`
                            });
                        });
                    };
                    break;


                case 'qr-code':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.tabs.executeScript(tab.id, {
                            code: '(' + (function (pInfo) {
                                let linkUrl = pInfo.linkUrl;
                                let pageUrl = pInfo.pageUrl;
                                let imgUrl = pInfo.srcUrl;
                                let selection = pInfo.selectionText;

                                return linkUrl || imgUrl || selection || pageUrl;
                            }).toString() + ')(' + JSON.stringify(info) + ')',
                            allFrames: false
                        }, function (txt) {
                            chrome.DynamicToolRunner({
                                withContent: txt[0],
                                query: `tool=qr-code`
                            });
                        });
                    };
                    toolMap[tool].menuConfig[1].onClick = function (info, tab) {

                        // V2020.2.618之前的版本都用这个方法
                        let funForLowerVer = function () {
                            chrome.tabs.executeScript(tab.id, {
                                code: '(' + (function (pInfo) {
                                    function loadImage(src) {
                                        return new Promise(resolve => {
                                            let image = new Image();
                                            image.setAttribute('crossOrigin', 'Anonymous');
                                            image.src = src;
                                            image.onload = function () {
                                                let width = this.naturalWidth;
                                                let height = this.naturalHeight;
                                                let canvas = document.createElement('canvas');
                                                canvas.style.cssText = 'position:absolute;top:-10000px;left:-10000px';
                                                document.body.appendChild(canvas);
                                                canvas.setAttribute('id', 'qr-canvas');
                                                canvas.height = height + 100;
                                                canvas.width = width + 100;
                                                let context = canvas.getContext('2d');
                                                context.fillStyle = 'rgb(255,255,255)';
                                                context.fillRect(0, 0, canvas.width, canvas.height);
                                                context.drawImage(image, 0, 0, width, height, 50, 50, width, height);
                                                resolve(canvas.toDataURL());
                                            };
                                            image.onerror = function () {
                                                resolve(src);
                                            };
                                        });
                                    }

                                    let tempDataUrl = '__TEMP_DATA_URL_FOR_QRDECODE_';
                                    loadImage(pInfo.srcUrl).then(dataUrl => {
                                        window[tempDataUrl] = dataUrl;
                                    });

                                    return tempDataUrl;

                                }).toString() + ')(' + JSON.stringify(info) + ')',
                                allFrames: false
                            }, function (resp) {
                                let tempDataUrl = resp[0];
                                let intervalId = -1;
                                let repeatTime = 0;
                                let loop = function () {
                                    repeatTime++;
                                    intervalId = setInterval(function () {
                                        chrome.tabs.executeScript(tab.id, {
                                            code: '(' + (function (tempDataUrl) {
                                                return window[tempDataUrl];
                                            }).toString() + ')(' + JSON.stringify(tempDataUrl) + ')',
                                            allFrames: false
                                        }, function (arr) {
                                            if (arr[0] === null && repeatTime <= 10) {
                                                loop();
                                            } else {
                                                clearInterval(intervalId);
                                                chrome.DynamicToolRunner({
                                                    withContent: arr[0] || info.srcUrl,
                                                    query: `tool=qr-code&mode=decode`
                                                });
                                            }
                                        });
                                    }, 200);
                                };
                                loop();
                            });
                        };

                        chrome.tabs.executeScript(tab.id, {
                            code: '(' + (function (pInfo) {
                                try {
                                    if (typeof window.qrcodeContentScript === 'function') {
                                        let qrcode = window.qrcodeContentScript();
                                        if (typeof qrcode.decode === 'function') {
                                            // 直接解码
                                            qrcode.decode(pInfo.srcUrl);
                                            return 1;
                                        }
                                    }
                                } catch (e) {
                                    return 0;
                                }
                                return 0;
                            }).toString() + ')(' + JSON.stringify(info) + ')',
                            allFrames: false
                        }, function (resp) {
                            (resp[0] === 0) && funForLowerVer();
                        });

                    };
                    break;

                default:
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.DynamicToolRunner({
                            withContent: tool === 'image-base64' ? info.srcUrl : '',
                            query: `tool=${tool}`
                        });
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
            let _menu_id = 'fhm_c' + escape(menu.text).replace(/\W/g,'');
            chrome.contextMenus.create({
                id: _menu_id,
                title: menu.icon + '  ' + menu.text,
                contexts: menu.contexts || ['all'],
                parentId: FeJson.contextMenuId
            });

            chrome.contextMenus.onClicked.addListener(((tName,mId,mFunc) => (info, tab) => {
                if(info.menuItemId === mId) {
                    if(mFunc) {
                        mFunc(info,tab);
                    }else{
                        chrome.DynamicToolRunner({
                            query: `tool=${tName}`
                        });
                    }
                }
            })(toolName,_menu_id,menu.onClick));
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
    let _createContextMenu = function () {
        _removeContextMenu();
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
    };

    /**
     * 移除扩展专属的右键菜单
     */
    let _removeContextMenu = function () {
        chrome.contextMenus.removeAll();
    };

    /**
     * 创建或移除扩展专属的右键菜单
     */
    let _createOrRemoveContextMenu = function (_settings) {
        _settings.getOptions((opts) => {
            console.log(String(opts['OPT_ITEM_CONTEXTMENUS']))
            if (String(opts['OPT_ITEM_CONTEXTMENUS']) !== 'false') {
                _createContextMenu();
            } else {
                _removeContextMenu();
            }
        });
    };

    return {
        manage: _createOrRemoveContextMenu
    };
})();
