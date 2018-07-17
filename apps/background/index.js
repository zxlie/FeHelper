/**
 * FE-Helper后台运行程序
 * @author zhaoxianlie
 */
var BgPageInstance = (function () {

    let MSG_TYPE = Tarp.require('../static/js/msg_type');
    let Settings = Tarp.require('../options/settings');
    let Network = Tarp.require('../background/network');
    let PageCapture = Tarp.require('../page-capture/capture-api')(MSG_TYPE);

    let feHelper = {
        codeStandardMgr: {},
        ajaxDebuggerMgr: {},
        csDetectIntervals: [],
        manifest: chrome.runtime.getManifest(),
        notifyTimeoutId: -1
    };
    let devToolsDetected = false;

    //侦测就绪情况
    let _detectReadyState = function (getType, callback) {

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tabId = tabs[0].id;
            feHelper.codeStandardMgr[tabId][getType] = true;

            if (feHelper.codeStandardMgr[tabId].css && feHelper.codeStandardMgr[tabId].js) {
                feHelper.codeStandardMgr[tabId].allDone = true;
            }
            if (feHelper.codeStandardMgr[tabId].allDone && typeof callback === 'function') {
                callback();
            }
        });

    };

    /**
     * 执行前端FCPHelper检测
     */
    let _doFcpDetect = function (tab) {
        feHelper.codeStandardMgr[tab.id] = feHelper.codeStandardMgr[tab.id] || {};
        //所有元素都准备就绪
        if (feHelper.codeStandardMgr[tab.id].allDone) {
            clearInterval(feHelper.csDetectIntervals[tab.id]);
            chrome.tabs.sendMessage(tab.id, {
                type: MSG_TYPE.CODE_STANDARDS,
                event: MSG_TYPE.FCP_HELPER_DETECT
            });
        } else if (feHelper.csDetectIntervals[tab.id] === undefined) {
            chrome.tabs.sendMessage(tab.id, {
                type: MSG_TYPE.CODE_STANDARDS,
                event: MSG_TYPE.FCP_HELPER_INIT
            });
            //显示桌面提醒
            notifyText({
                message: "正在准备数据，请稍等..."
            });
            feHelper.csDetectIntervals[tab.id] = setInterval(function () {
                _doFcpDetect(tab);
            }, 200);
        }
    };


    /**
     * 文本格式，可以设置一个图标和标题
     * @param {Object} options
     * @config {string} type notification的类型，可选值：html、text
     * @config {string} icon 图标
     * @config {string} title 标题
     * @config {string} message 内容
     */
    let notifyText = function (options) {
        let notifyId = 'fehleper-notify-id';

        clearTimeout(feHelper.notifyTimeoutId);
        if (options.closeImmediately) {
            return chrome.notifications.clear(notifyId);
        }

        if (!options.icon) {
            options.icon = "static/img/fe-48.png";
        }
        if (!options.title) {
            options.title = "温馨提示";
        }
        chrome.notifications.create(notifyId, {
            type: 'basic',
            title: options.title,
            iconUrl: chrome.runtime.getURL(options.icon),
            message: options.message
        });

        feHelper.notifyTimeoutId = setTimeout(() => {
            chrome.notifications.clear(notifyId);
        }, parseInt(options.autoClose || 3000, 10));

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

            Settings.getOptsFromBgPage((opts) => {
                let isOpened = false;
                let tabId;

                // 允许在新窗口打开
                if (opts['FORBID_OPEN_IN_NEW_TAB']) {
                    let reg = new RegExp("^chrome.*/" + file + "/index.html$", "i");
                    for (let i = 0, len = tabs.length; i < len; i++) {
                        if (reg.test(tabs[i].url)) {
                            isOpened = true;
                            tabId = tabs[i].id;
                            break;
                        }
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

        });
    };

    /**
     * ajax debugger 开关切换
     * @private
     */
    let _debuggerSwitchOn = function (callback) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            feHelper.ajaxDebuggerMgr[tab.id] = !feHelper.ajaxDebuggerMgr[tab.id];

            chrome.tabs.executeScript(tab.id, {
                code: 'console.info("FeHelper提醒：Ajax Debugger开关已' + (feHelper.ajaxDebuggerMgr[tab.id] ? '开启' : '关闭') + '！");',
                allFrames: false
            });
            callback && callback();
        });
    };

    /**
     * 告诉DevTools页面，当前的debug开关是否打开
     * @param callback
     * @param withAlert
     * @private
     */
    let _tellDevToolsDbgSwitchOn = function (callback, withAlert) {

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            callback && callback(feHelper.ajaxDebuggerMgr[tab.id]);

            if (withAlert) {
                if (feHelper.ajaxDebuggerMgr[tab.id]) {
                    let msg = '';
                    if (devToolsDetected) {
                        msg = 'DevTools已打开，确保已切换到【Console】界面，并关注信息输出，愉快的进行Ajax Debugger！'
                    } else {
                        msg = '请打开DevTools，并切换到【Console】界面，关注信息输出，愉快的进行Ajax Debugger！';
                    }
                    alert(msg);
                }
            }
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
                    //编码规范检测
                    case MSG_TYPE.FCP_HELPER_DETECT:
                        _doFcpDetect(tab);
                        break;
                    //将当前网页转为图片
                    case MSG_TYPE.PAGE_CAPTURE:
                        PageCapture.full(tab);
                        break;
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
            title: "FeHelper工具",
            contexts: ['page', 'selection', 'editable', 'link', 'image'],
            documentUrlPatterns: ['http://*/*', 'https://*/*', 'file://*/*']
        });
        chrome.contextMenus.create({
            title: "▣  二维码生成",
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
                    _openFileAndRun(tab, MSG_TYPE.QR_CODE, (typeof txt === 'object') ? txt[0] : txt);
                });
            }
        });

        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['image'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "◈  二维码解码",
            contexts: ['image'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                _qrDecode(info, tab);
            }
        });


        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['image'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "♛  图片转Base64",
            contexts: ['image'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                _openFileAndRun(tab, MSG_TYPE.IMAGE_BASE64, info.srcUrl);
            }
        });

        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "♨  字符串编解码",
            contexts: ['page', 'selection', 'editable'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                chrome.tabs.executeScript(tab.id, {
                    code: '(' + (function (pInfo) {

                        return pInfo.selectionText;
                    }).toString() + ')(' + JSON.stringify(info) + ')',
                    allFrames: false
                }, function (txt) {
                    _openFileAndRun(tab, MSG_TYPE.EN_DECODE, (typeof txt === 'object') ? txt[0] : txt);
                });
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "★  JSON格式化",
            contexts: ['page', 'selection', 'editable'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                chrome.tabs.executeScript(tab.id, {
                    code: '(' + (function (pInfo) {
                        return pInfo.selectionText;
                    }).toString() + ')(' + JSON.stringify(info) + ')',
                    allFrames: false
                }, function (txt) {
                    _openFileAndRun(tab, MSG_TYPE.JSON_FORMAT, (typeof txt === 'object') ? txt[0] : txt);
                });
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "☂  代码格式化",
            contexts: ['page', 'selection', 'editable'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                chrome.tabs.executeScript(tab.id, {
                    code: '(' + (function (pInfo) {
                        return pInfo.selectionText;
                    }).toString() + ')(' + JSON.stringify(info) + ')',
                    allFrames: false
                }, function (txt) {
                    _openFileAndRun(tab, MSG_TYPE.CODE_BEAUTIFY, (typeof txt === 'object') ? txt[0] : txt);
                });
            }
        });

        chrome.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
            parentId: feHelper.contextMenuId
        });
        chrome.contextMenus.create({
            title: "☀  页面取色器",
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
            title: "✂  网页滚动截屏",
            contexts: ['all'],
            parentId: feHelper.contextMenuId,
            onclick: function (info, tab) {
                PageCapture.full(tab);
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
            if (opts['opt_item_contextMenus']) {
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

        let qrcode = Tarp.require('../static/vendor/zxing/zxing.min.js');
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
            chrome.tabs.sendMessage(tabid, {
                type: MSG_TYPE.SHOW_COLOR_PICKER,
                enableColorPicker: true
            }, function (response) {
                chrome.tabs.sendMessage(tabid, {
                    type: MSG_TYPE.SHOW_COLOR_PICKER,
                    doPick: true
                }, function (r) {
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
                    type: MSG_TYPE.SHOW_COLOR_PICKER,
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

    //判断是否可以针对json页面进行自动格式化
    let _jsonAutoFormatRequest = function () {
        Settings.getOptsFromBgPage(opts => {
            opts.JSON_PAGE_FORMAT && chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: MSG_TYPE.JSON_PAGE_FORMAT,
                    options: {MAX_JSON_KEYS_NUMBER: opts.MAX_JSON_KEYS_NUMBER}
                });
            });
        });
    };

    //判断是否可以针对js、css自动检测格式化
    let _jsCssAutoDetectRequest = function () {

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {

            let tab = tabs[0];

            chrome.tabs.executeScript(tab.id, {
                code: '(' + (() => {

                    let ext = location.pathname.substring(location.pathname.lastIndexOf(".") + 1).toLowerCase();
                    let fileType = ({'js': 'javascript', 'css': 'css'})[ext];
                    let contentType = document.contentType.toLowerCase();

                    if (!fileType) {
                        if (/\/javascript$/.test(contentType)) {
                            fileType = 'javascript';
                        } else if (/\/css$/.test(contentType)) {
                            fileType = 'css';
                        }
                    } else if (contentType === 'text/html') {
                        fileType = undefined;
                    }

                    return fileType;
                }).toString() + ')()'
            }, function (fileType) {
                if (fileType[0] === 'javascript' || fileType[0] === 'css') {
                    Settings.getOptsFromBgPage(opts => {
                        opts.JS_CSS_PAGE_BEAUTIFY && chrome.tabs.sendMessage(tab.id, {
                            type: MSG_TYPE.JS_CSS_PAGE_BEAUTIFY,
                            content: fileType[0]
                        });
                    });
                }
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
                Settings.setOptsFromBgPage(request.items);
                //管理右键菜单
                _createOrRemoveContextMenu();
                notifyText({
                    message: '配置已生效，请继续使用!',
                    autoClose: 2000
                });
            }
            //判断是否可以针对json页面进行自动格式化
            else if (request.type === MSG_TYPE.JSON_PAGE_FORMAT_REQUEST) {
                _jsonAutoFormatRequest();
            }
            //判断是否可以针对js、css自动检测格式化
            else if (request.type === MSG_TYPE.JS_CSS_PAGE_BEAUTIFY_REQUEST) {
                _jsCssAutoDetectRequest();
            }
            //保存当前网页加载时间
            else if (request.type === MSG_TYPE.CALC_PAGE_LOAD_TIME) {
                _showPageWpoInfo(request.wpo);
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
            // 打开设置页
            else if (request.type === MSG_TYPE.OPEN_OPTIONS_PAGE) {
                chrome.runtime.openOptionsPage();
            }

            // ===========================以下为编码规范检测====start==================================
            //处理CSS的请求
            else if (request.type === MSG_TYPE.GET_CSS) {
                //直接AJAX获取CSS文件内容
                Network.readFileContent(request.link, callback);
            }
            //处理JS的请求
            else if (request.type === MSG_TYPE.GET_JS) {
                //直接AJAX获取JS文件内容
                Network.readFileContent(request.link, callback);
            }
            //处理HTML的请求
            else if (request.type === MSG_TYPE.GET_HTML) {
                //直接AJAX获取JS文件内容
                Network.readFileContent(request.link, callback);
            }
            //处理cookie
            else if (request.type === MSG_TYPE.GET_COOKIE) {
                Network.getCookies(request, callback);
            }
            //移除cookie
            else if (request.type === MSG_TYPE.REMOVE_COOKIE) {
                Network.removeCookie(request, callback);
            }
            //设置cookie
            else if (request.type === MSG_TYPE.SET_COOKIE) {
                Network.setCookie(request, callback);
            }
            //CSS准备就绪
            else if (request.type === MSG_TYPE.CSS_READY) {
                _detectReadyState('css', callback);
            }
            //JS准备就绪
            else if (request.type === MSG_TYPE.JS_READY) {
                _detectReadyState('js', callback);
            }
            //HTML准备就绪
            else if (request.type === MSG_TYPE.HTML_READY) {
                _detectReadyState('html', callback);
            }
            // ===========================以上为编码规范检测====end==================================


            return true;
        });

        // 检测DevTools是否打开
        let openCount = 0;
        chrome.runtime.onConnect.addListener(function (port) {
            if (port.name === MSG_TYPE.DEV_TOOLS) {
                if (openCount === 0) {
                    devToolsDetected = true;
                }
                openCount++;

                port.onDisconnect.addListener(function (port) {
                    openCount--;
                    if (openCount === 0) {
                        devToolsDetected = false;
                    }
                });
            }
        });

        // 安装与更新
        chrome.runtime.onInstalled.addListener(({reason, previousVersion}) => {
            switch (reason) {
                case 'install':
                    chrome.runtime.openOptionsPage();
                    break;
                case 'update':
                    setTimeout(() => {
                        chrome.browserAction.setBadgeText({text: '+++1'});
                        setTimeout(() => {
                            chrome.browserAction.setBadgeText({text: ''});
                        }, 1500);
                    }, 1500);
                    break;
            }
        });
        // 卸载
        chrome.runtime.setUninstallURL(feHelper.manifest.homepage_url);
    };

    /**
     * 检查插件更新
     * @private
     */
    let _checkUpdate = function () {
        setTimeout(() => {
            chrome.runtime.requestUpdateCheck((status) => {
                if (status === "update_available") {
                    chrome.runtime.reload();
                }
            });
        }, 1000 * 10);
    };

    /**
     * 初始化
     */
    let _init = function () {
        _checkUpdate();
        _addExtensionListener();
        _createOrRemoveContextMenu();
    };

    return {
        init: _init,
        runHelper: _runHelper,
        notify: notifyText,
        showColorPicker: _showColorPicker,
        tellMeAjaxDbgSwitch: _tellDevToolsDbgSwitchOn,
        getCapturedData: PageCapture.getCapturedData
    };
})();

//初始化
BgPageInstance.init();