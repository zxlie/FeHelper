/**
 * FE-Helper后台运行程序
 * @author zhaoxianlie
 */
var BgPageInstance = (function () {

    let MSG_TYPE = Tarp.require('../static/js/core/msg_type');
    let Settings = Tarp.require('../options/settings');
    let feHelper = {};

    // debug cache，主要记录每个tab的ajax debug 开关
    let ajaxDbgCache = {};

    /**
     * 文本格式，可以设置一个图标和标题
     * @param {Object} options
     * @config {string} type notification的类型，可选值：html、text
     * @config {string} icon 图标
     * @config {string} title 标题
     * @config {string} message 内容
     */
    let notifyText = function (options) {
        if (!window.Notification) {
            return;
        }
        if (!options.icon) {
            options.icon = "static/img/fe-48.png";
        }
        if (!options.title) {
            options.title = "温馨提示";
        }

        return chrome.notifications.create('', {
            type: 'basic',
            title: options.title,
            iconUrl: chrome.runtime.getURL(options.icon),
            message: options.message
        });

    };

    /**
     * 查看页面wpo信息
     */
    let _showPageWpoInfo = function (wpoInfo) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (!wpoInfo) {
                notifyText({
                    message: "对不起，检测失败"
                });
            } else {
                chrome.tabs.create({
                    url: "wpo/index.html?" + btoa(encodeURIComponent(JSON.stringify(wpoInfo))),
                    active: true
                });
            }
        });
    };

    /**
     * 获取页面wpo信息
     * @return {[type]}
     */
    let _getPageWpoInfo = function () {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            //显示桌面提醒
            chrome.tabs.sendMessage(tab.id, {
                type: MSG_TYPE.GET_PAGE_WPO_INFO
            });
        });
    };

    /**
     * 创建或更新成功执行的动作
     * @param evt
     * @param content
     * @private
     */
    let _tabUpdatedCallback = function (evt, content) {
        return function (newTab) {
            if (content) {
                setTimeout(function () {
                    chrome.tabs.sendMessage(newTab.id, {
                        type: MSG_TYPE.TAB_CREATED_OR_UPDATED,
                        content: content,
                        event: evt
                    });
                }, 300)
            }
        };
    };

    /**
     * 打开对应文件，运行该Helper
     * @param tab
     * @param file
     * @param txt
     * @private
     */
    let _openFileAndRun = function (tab, file, txt) {
        chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT}, function (tabs) {
            let isOpened = false;
            let tabId;
            let reg = new RegExp("^chrome.*" + file + ".html$", "i");
            for (let i = 0, len = tabs.length; i < len; i++) {
                if (reg.test(tabs[i].url)) {
                    isOpened = true;
                    tabId = tabs[i].id;
                    break;
                }
            }
            if (!isOpened) {
                chrome.tabs.create({
                    url: '' + file + '/index.html',
                    active: true
                }, _tabUpdatedCallback(file, txt));
            } else {
                chrome.tabs.update(tabId, {highlighted: true}, _tabUpdatedCallback(file, txt));
            }
        });
    };

    /**
     * ajax debugger 开关切换
     * @private
     */
    let _debuggerSwitchOn = function (callback) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            ajaxDbgCache[tab.id] = !ajaxDbgCache[tab.id];

            chrome.tabs.executeScript(tab.id, {
                code: 'console.info("FeHelper提醒：Ajax Debugger开关已' + (ajaxDbgCache[tab.id] ? '开启' : '关闭') + '！");',
                allFrames: false
            });
            callback && callback();
        });
    };

    /**
     * 告诉DevTools页面，当前的debug开关是否打开
     * @param callback
     * @private
     */
    let _tellDevToolsDbgSwitchOn = function (callback) {

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            callback && callback(ajaxDbgCache[tab.id]);
        });
    };

    /**
     * 根据给定参数，运行对应的Helper
     */
    let _runHelper = function (config, callback) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];

            // 如果是采用独立文件方式访问，直接打开该页面即可
            if (config.useFile === 1) {
                let content = config.msgType === MSG_TYPE.QR_CODE ? tab.url : '';
                _openFileAndRun(tab, config.msgType, content);
            } else {
                switch (config.msgType) {
                    //查看网页加载时间
                    case MSG_TYPE.SHOW_PAGE_LOAD_TIME:
                        _getPageWpoInfo();
                        break;
                    //Ajax调试
                    case MSG_TYPE.AJAX_DEBUGGER:
                        _debuggerSwitchOn(callback);
                        break;
                    default :
                        break;
                }
            }
        });
    };

    /**
     * 创建扩展专属的右键菜单
     */
    let _createContextMenu = function () {
        _removeContextMenu();
        feHelper.contextMenuId = chrome.contextMenus.create({
            title: "FeHelper",
            contexts: ['page', 'selection', 'editable', 'link', 'image'],
            documentUrlPatterns: ['http://*/*', 'https://*/*', 'file://*/*']
        });
        chrome.contextMenus.create({
            title: "二维码生成",
            contexts: ['page', 'selection', 'editable', 'link', 'image'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
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
                    _openFileAndRun(tab, MSG_TYPE.QR_CODE, txt);
                });
            }
        });

        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['image'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "二维码解码",
            contexts: ['image'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                _qrDecode(info, tab);
            }
        });


        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "页面取色器",
            contexts: ['page', 'selection', 'editable'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                _showColorPicker();
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "字符串编解码",
            contexts: ['page', 'selection', 'editable'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                chrome.tabs.executeScript(tab.id, {
                    code: '(' + (function () {
                        return window.getSelection().toString();
                    }).toString() + ')()',
                    allFrames: false
                }, function (txt) {
                    _openFileAndRun(tab, MSG_TYPE.EN_DECODE, txt);
                });
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "JSON格式化",
            contexts: ['page', 'selection', 'editable'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                chrome.tabs.executeScript(tab.id, {
                    code: '(' + (function () {
                        return window.getSelection().toString();
                    }).toString() + ')()',
                    allFrames: false
                }, function (txt) {
                    _openFileAndRun(tab, MSG_TYPE.JSON_FORMAT, txt);
                });
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "代码格式化",
            contexts: ['page', 'selection', 'editable'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                chrome.tabs.executeScript(tab.id, {
                    code: '(' + (function () {
                        return window.getSelection().toString();
                    }).toString() + ')()',
                    allFrames: false
                }, function (txt) {
                    _openFileAndRun(tab, MSG_TYPE.CODE_BEAUTIFY, txt);
                });
            }
        });

    };

    /**
     * 移除扩展专属的右键菜单
     */
    let _removeContextMenu = function () {
        if (!feHelper.contextMenuId) return;
        chrome.contextMenus.remove(feHelper.contextMenuId);
        feHelper.contextMenuId = null;
    };

    /**
     * 创建或移除扩展专属的右键菜单
     */
    let _createOrRemoveContextMenu = function () {
        Settings.getOptsFromBgPage((opts) => {
            if (opts['opt_item_contextMenus'] !== 'false') {
                _createContextMenu();
            } else {
                _removeContextMenu();
            }
        });
    };

    /**
     * 二维码转码
     * @param info
     * @param tab
     * @private
     */
    let _qrDecode = function (info, tab) {
        qrcode.callback = function (text) {
            if ((text || '').indexOf('error decoding QR Code') !== -1) {
                let image = new Image();
                image.src = info.srcUrl;
                image.onload = function () {
                    let width = this.naturalWidth;
                    let height = this.naturalHeight;

                    // url方式解码失败，再转换成data uri后继续解码
                    (function createCanvasContext(img, t, l, w, h) {
                        let canvas = document.createElement('canvas');
                        canvas.setAttribute('id', 'qr-canvas');
                        canvas.height = h + 100;
                        canvas.width = w + 100;
                        let context = canvas.getContext('2d');
                        context.fillStyle = 'rgb(255,255,255)';
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        context.drawImage(img, l, t, w, h, 50, 50, w, h);
                        qrcode.callback = function (txt) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: MSG_TYPE.QR_DECODE,
                                result: txt
                            });
                        };
                        qrcode.decode(canvas.toDataURL());
                    })(image, 0, 0, width, height);
                }
            } else {
                chrome.tabs.sendMessage(tab.id, {
                    type: MSG_TYPE.QR_DECODE,
                    result: text
                });
            }
        };
        qrcode.decode(info.srcUrl);
    };

    /**
     * 显示color picker
     * @private
     */
    let _showColorPicker = function () {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            let tabid = tab.id;
            let port = chrome.tabs.connect(tabid, {name: "popupshown"});
            chrome.tabs.sendMessage(tabid, {enableColorPicker: true}, function (response) {
                chrome.tabs.sendMessage(tabid, {doPick: true}, function (r) {
                });
            });
        });
    };

    /**
     * 将网页截成一张图，实现取色
     * @param callback
     * @private
     */
    let _drawColorPicker = function (callback) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            let tabid = tab.id;
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (dataUrl) {
                chrome.tabs.sendMessage(tabid, {
                    setPickerImage: true,
                    pickerImage: dataUrl
                }, function (response) {
                    callback && callback();
                });
            });
        });
    };

    /**
     * 在当前页面的控制台输出console
     * @param request
     * @private
     */
    let _ajaxDebugger = function (request) {

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            chrome.tabs.executeScript(tab.id, {
                code: "(" + (function (jsonStr) {
                    let args = JSON.parse(unescape(jsonStr));
                    console[args[0]].apply(console, Array.prototype.slice.call(args, 1));
                }).toString() + ")('" + request.content + "');"
            });
        });
    };

    /**
     * 接收来自content_scripts发来的消息
     */
    let _addExtensionListener = function () {
        chrome.runtime.onMessage.addListener(function (request, sender, callback) {
            //提取配置项
            if (request.type === MSG_TYPE.GET_OPTIONS) {
                Settings.getOptsFromBgPage(callback);
            }
            //保存配置项
            else if (request.type === MSG_TYPE.SET_OPTIONS) {
                Settings.setOptsFromBgPage(request.items, callback);
                //管理右键菜单
                _createOrRemoveContextMenu();
            }
            //保存当前网页加载时间
            else if (request.type === MSG_TYPE.CALC_PAGE_LOAD_TIME) {
                _showPageWpoInfo(request.wpo);
            }
            // 从popup中点过来的
            else if (request.type === MSG_TYPE.FROM_POPUP) {
                _runHelper(request.config, callback);
            }
            // color picker
            else if (request.type === MSG_TYPE.COLOR_PICKER) {
                _drawColorPicker(callback);
            }
            // console switch
            else if (request.type === MSG_TYPE.AJAX_DEBUGGER_SWITCH) {
                _tellDevToolsDbgSwitchOn(callback);
            }
            // console show
            else if (request.type === MSG_TYPE.AJAX_DEBUGGER_CONSOLE) {
                _ajaxDebugger(request);
            }

            return true;
        });
    };

    /**
     * 初始化
     */
    let _init = function () {
        _addExtensionListener();
        _createOrRemoveContextMenu();
    };

    return {
        init: _init,
        runHelper: _runHelper,
        showColorPicker: _showColorPicker,
        tellMeAjaxDbgSwitch: _tellDevToolsDbgSwitchOn
    };
})();

//初始化
BgPageInstance.init();