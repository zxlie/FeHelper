/**
 * FeJson后台运行程序
 * @author zhaoxianlie
 */


import MSG_TYPE from '../static/js/common.js';
import Settings from '../options/settings.js';
import Menu from './menu.js';
import Awesome from './awesome.js';


let BgPageInstance = (function () {

    let FeJson = {
        notifyTimeoutId: -1
    };

    // 黑名单页面
    let blacklist = [
        /^https:\/\/chrome\.google\.com/
    ];

    /**
     * 文本格式，可以设置一个图标和标题
     * @param {Object} options
     * @config {string} type notification的类型，可选值：html、text
     * @config {string} icon 图标
     * @config {string} title 标题
     * @config {string} message 内容
     */
    let notifyText = function (options) {
        let notifyId = 'FeJson-notify-id';

        clearTimeout(FeJson.notifyTimeoutId);
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

        FeJson.notifyTimeoutId = setTimeout(() => {
            chrome.notifications.clear(notifyId);
        }, parseInt(options.autoClose || 3000, 10));

    };

    /**
     * 如果tabId指定的tab还存在，就正常注入脚本
     * @param tabId 需要注入脚本的tabId
     * @param codeConfig 需要注入的代码
     * @param callback 注入代码后的callback
     */
    let injectScriptIfTabExists = function (tabId, codeConfig, callback) {
        chrome.tabs.query({currentWindow: true}, (tabs) => {
            tabs.some(tab => {
                if (tab.id !== tabId) return false;
                Settings.getOptions((opts) => {

                    if (!codeConfig.hasOwnProperty('allFrames')) {
                        codeConfig.allFrames = String(opts['CONTENT_SCRIPT_ALLOW_ALL_FRAMES']) === 'true';
                    }

                    codeConfig.code = 'try{' + codeConfig.code + ';}catch(e){};';
                    // 有文件就注入文件
                    if(codeConfig.files && codeConfig.files.length){
                        // 注入样式
                        if(codeConfig.files.join(',').indexOf('.css') > -1) {
                            chrome.scripting.insertCSS({
                                target: {tabId, allFrames: codeConfig.allFrames},
                                files: codeConfig.files
                            }, function () {
                                callback && callback.apply(this, arguments);
                            });
                        }
                        // 注入js
                        else {
                            chrome.scripting.executeScript({
                                target: {tabId, allFrames: codeConfig.allFrames},
                                files: codeConfig.files
                            }, function () {
                                chrome.scripting.executeScript({
                                    target: {tabId, allFrames: codeConfig.allFrames},
                                    func: function(code){evalCore.getEvalInstance(window)(code)},
                                    args: [codeConfig.code]
                                }, function () {
                                    callback && callback.apply(this, arguments);
                                });
                            });
                        }
                    }else{
                        // 没有文件就只注入脚本
                        chrome.scripting.executeScript({
                            target: {tabId, allFrames: codeConfig.allFrames},
                            func: function(code){evalCore.getEvalInstance(window)(code)},
                            args: [codeConfig.code]
                        }, function () {
                            callback && callback.apply(this, arguments);
                        });
                    }

                });

                return true;
            });
        });
    };

    // 往当前页面直接注入脚本，不再使用content-script的配置了
    let _injectContentScripts = function (tabId) {

        // 其他工具注入
        Awesome.getInstalledTools().then(tools => {

            // 注入样式
            let cssFiles = Object.keys(tools).filter(tool => tools[tool].contentScriptCss)
                            .map(tool => `${tool}/content-script.css`);
            injectScriptIfTabExists(tabId, {files: cssFiles});

            // 注入js
            let jsTools = Object.keys(tools).filter(tool => tools[tool].contentScriptJs);
            let jsCodes = [];
            jsTools.forEach((t, i) => {
                let func = `window['${t.replace(/-/g, '')}ContentScript']`;
                jsCodes.push(`(()=>{let func=${func};func&&func();})()`);
            });
            let jsFiles = jsTools.map(tool => `${tool}/content-script.js`);
            injectScriptIfTabExists(tabId, {files: jsFiles,code: jsCodes.join(';')});
        });
    };

    /**
     * 动态运行工具
     * @param configs
     * @config tool 工具名称
     * @config withContent 默认携带的内容
     * @config query 请求参数
     * @config noPage 无页面模式
     * @constructor
     */
    chrome.DynamicToolRunner = async function (configs) {

        let tool = configs.tool || configs.page;
        let withContent = configs.withContent;
        let activeTab = null;
        let query = configs.query;

        // 如果是noPage模式，则表名只完成content-script的工作，直接发送命令即可
        if (configs.noPage) {
            let toolFunc = tool.replace(/-/g, '');
            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                let found = tabs.some(tab => {
                    if (/^(http(s)?|file):\/\//.test(tab.url) && blacklist.every(reg => !reg.test(tab.url))) {
                        let codes = `window['${toolFunc}NoPage'] && window['${toolFunc}NoPage'](${JSON.stringify(tab)});`;
                        injectScriptIfTabExists(tab.id, {code: codes});
                        return true;
                    }
                    return false;
                });
                if (!found) {
                    notifyText({
                        message: '抱歉，此工具无法在当前页面使用！'
                    });
                }
            });
            return;
        }

        chrome.tabs.query({currentWindow: true}, function (tabs) {

            activeTab = tabs.filter(tab => tab.active)[0];

            Settings.getOptions((opts) => {
                let isOpened = false;
                let tabId;

                // 允许在新窗口打开
                if (String(opts['FORBID_OPEN_IN_NEW_TAB']) === 'true') {
                    let reg = new RegExp("^chrome.*\\/" + tool + "\\/index.html" + (query ? "\\?" + query : '') + "$", "i");
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
                        url: `/${tool}/index.html` + (query ? "?" + query : ''),
                        active: true
                    }).then(tab => { FeJson[tab.id] = { content: withContent }; });
                } else {
                    chrome.tabs.update(tabId, {highlighted: true}).then(tab => {
                        FeJson[tab.id] = { content: withContent };
                        chrome.tabs.reload(tabId);
                    });
                }

            });

        });
    };

    /**
     * 动态在icon处显示提示
     * @param tips
     * @private
     */
    let _animateTips = (tips) => {
        setTimeout(() => {
            chrome.action.setBadgeText({text: tips});
            setTimeout(() => {
                chrome.action.setBadgeText({text: ''});
            }, 2000);
        }, 3000);
    };

    /**
     * 更新browser action的点击动作
     * @param action install / upgrade / offload
     * @param showTips 是否notify
     * @param menuOnly 只管理Menu
     * @private
     */
    let _updateBrowserAction = function (action, showTips, menuOnly) {
        if (!menuOnly) {
            if (action === 'offload') {
                _animateTips('-1');
            } else {
                _animateTips('+1');
            }
        } else {
            // 重绘菜单
            Menu.manage(Settings);
        }

        if (showTips) {
            let actionTxt = '';
            switch (action) {
                case 'install':
                    actionTxt = '工具已「安装」成功，并已添加到弹出下拉列表，点击FeHelper图标可正常使用！';
                    break;
                case 'offload':
                    actionTxt = '工具已「卸载」成功，并已从弹出下拉列表中移除！';
                    break;
                case 'menu-install':
                    actionTxt = '已将此工具快捷方式加入到「右键菜单」中！';
                    break;
                case 'menu-offload':
                    actionTxt = '已将此工具快捷方式从「右键菜单」中移除！';
                    break;
                default:
                    actionTxt = '恭喜，操作成功！';
            }
            notifyText({
                message: actionTxt,
                autoClose: 2500
            });
        }
    };

    // 捕获当前页面可视区域
    let _captureVisibleTab = function (callback) {
        chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, uri => {
            callback && callback(uri);
        });
    };

    let _screenCapture = function(params){

        // 将Blob数据存储到本地临时文件
        function saveBlob(blob, filename, index, callback, errback) {
            filename = ((filename, index) => {
                if (!index) {
                    return filename;
                }
                let sp = filename.split('.');
                let ext = sp.pop();
                return sp.join('.') + '-' + (index + 1) + '.' + ext;
            })(filename, index);
            let urlName = `filesystem:chrome-extension://${chrome.i18n.getMessage('@@extension_id')}/temporary/${filename}`;

            let size = blob.size + (1024 / 2);

            let reqFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            reqFileSystem(window.TEMPORARY, size, function (fs) {
                fs.root.getFile(filename, {create: true}, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = () => callback(urlName);
                        fileWriter.write(blob);
                    }, errback);
                }, errback);
            }, errback);
        }

        function reallyDone(imgUrl) {
            params.fileSystemUrl = imgUrl;
            let sendDataUri = tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'page-screenshot-done',
                    data: params
                });
            };
            if (!params.resultTab) {
                chrome.tabs.create({
                    url: 'dynamic/index.html?tool=screenshot',
                    active: true
                }, (tab) => {
                    setTimeout((tab => {
                        return () => sendDataUri(tab);
                    })(tab), 500);
                });
            } else {
                chrome.tabs.update(params.resultTab, {highlighted: true, active: true}, sendDataUri);
            }
        }

        // 获取Blobs数据
        function getBlobs(dataUris) {
            return dataUris.map(function (uri) {
                let byteString = atob(uri.split(',')[1]);
                let mimeString = uri.split(',')[0].split(':')[1].split(';')[0];
                let ab = new ArrayBuffer(byteString.length);
                let ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                return new Blob([ab], {type: mimeString});
            });
        }

        function wellDone(dus) {
            let blobs = getBlobs(dus);
            let i = 0;
            let len = blobs.length;

            // 保存 & 打开
            (function doNext() {
                saveBlob(blobs[i], params.filename, i, function (imgUrl) {
                    ++i >= len ? reallyDone(imgUrl) : doNext();
                }, reallyDone);
            })();
        }

        wellDone(params.dataUris);
    };

    let _addScreenShotByPages = function(params){
        chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, uri => {
            let code = `window.addScreenShot(${JSON.stringify(params)},'${uri}');`
            injectScriptIfTabExists(params.tabInfo.id, { code });
        });

        let code = `window.addScreenShot(${JSON.stringify(params)},'${uri}');`
        injectScriptIfTabExists(params.tabInfo.id, { code: `window.captureCallback();` });
    };

    let _colorPickerCapture = function(params) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (dataUrl) {
                let code = `window.colorpickerNoPage(${JSON.stringify({
                    setPickerImage: true,
                    pickerImage: dataUrl
                })})`;
                injectScriptIfTabExists(tabs[0].id, { code });
            });
        });
    };

    let _codeBeautify = function(params){
        if (['javascript', 'css'].includes(params.fileType)) {
            Awesome.StorageMgr.get('JS_CSS_PAGE_BEAUTIFY').then(val => {
                if(val !== '0') {
                    let code = `window._codebutifydetect_('${params.fileType}')`;
                    injectScriptIfTabExists(params.tabId, { code });
                }
            });
        }
    };

    /**
     * 接收来自content_scripts发来的消息
     */
    let _addExtensionListener = function () {

        chrome.runtime.onMessage.addListener(function (request, sender, callback) {
            // 如果发生了错误，就啥都别干了
            if (chrome.runtime.lastError) {
                console.log('chrome.runtime.lastError:',chrome.runtime.lastError);
                return true;
            }

            // 动态安装工具或者卸载工具，需要更新browserAction
            if (request.type === MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD) {
                _updateBrowserAction(request.action, request.showTips, request.menuOnly);
                callback && callback();
            }
            // 截屏
            else if (request.type === MSG_TYPE.CAPTURE_VISIBLE_PAGE) {
                _captureVisibleTab(callback);
            }
            // 打开动态工具页面
            else if (request.type === MSG_TYPE.OPEN_DYNAMIC_TOOL) {
                chrome.DynamicToolRunner(request);
                callback && callback();
            }
            // 打开其他页面
            else if (request.type === MSG_TYPE.OPEN_PAGE) {
                chrome.DynamicToolRunner({
                    tool: request.page
                });
                callback && callback();
            }
            // 任何事件，都可以通过这个钩子来完成
            else if (request.type === MSG_TYPE.DYNAMIC_ANY_THING) {
                switch(request.thing){
                    case 'save-options':
                        //管理右键菜单
                        Menu.manage(Settings);
                        notifyText({
                            message: '配置修改已生效，请继续使用!',
                            autoClose: 2000
                        });
                        break;
                    case 'code-beautify':
                        _codeBeautify(request.params);
                        break;
                    case 'close-beautify':
                        Awesome.StorageMgr.set('JS_CSS_PAGE_BEAUTIFY',0);
                        break;
                    case 'qr-decode':
                        chrome.DynamicToolRunner({
                            withContent: request.params.uri,
                            tool: MSG_TYPE.QR_CODE,
                            query: `mode=decode`
                        });
                        break;
                    case 'request-page-content':
                        request.params = FeJson[request.tabId];
                        delete FeJson[request.tabId];
                        break;
                    case 'set-page-timing-data':
                        chrome.DynamicToolRunner({
                            tool: 'page-timing',
                            withContent: request.wpoInfo
                        });
                        break;
                    case 'color-picker-capture':
                        _colorPickerCapture(request.params);
                        break;
                    case 'screen-capture':
                        _screenCapture(request.params);
                        break;
                    case 'add-screen-shot-by-pages':
                        _addScreenShotByPages(request.params);
                        break;
                }
                callback && callback(request.params);
            } else {
                callback && callback();
            }

            return true;
        });


        // 每开一个窗口，都向内容脚本注入一个js，绑定tabId
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

            if (String(changeInfo.status).toLowerCase() === "complete") {

                if(/^(http(s)?|file):\/\//.test(tab.url) && blacklist.every(reg => !reg.test(tab.url))){
                    injectScriptIfTabExists(tabId, { code: `window.__FH_TAB_ID__=${tabId};` });
                    _injectContentScripts(tabId);
                }
            }
        });

        // 安装与更新
        chrome.runtime.onInstalled.addListener(({reason, previousVersion}) => {
            switch (reason) {
                case 'install':
                    chrome.runtime.openOptionsPage();
                    break;
                case 'update':
                    _animateTips('+++1');
                    if (previousVersion === '2019.12.2415') {
                        notifyText({
                            message: '历尽千辛万苦，FeHelper已升级到最新版本，可以到插件设置页去安装旧版功能了！',
                            autoClose: 5000
                        });
                    }

                    // 从V2020.02.1413版本开始，本地的数据存储大部分迁移至chrome.storage.local
                    // 这里需要对老版本升级过来的情况进行强制数据迁移
                    let getAbsNum = num => parseInt(num.split(/\./).map(n => n.padStart(4, '0')).join(''), 10);
                    // let preVN = getAbsNum(previousVersion);
                    // let minVN = getAbsNum('2020.02.1413');
                    // if (preVN < minVN) {
                    //     Awesome.makeStorageUnlimited();
                    //     setTimeout(() => chrome.runtime.reload(), 1000 * 5);
                    // }
                    break;
            }
        });
        // 卸载
        chrome.runtime.setUninstallURL(chrome.runtime.getManifest().homepage_url);
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
        }, 1000 * 30);
    };

    /**
     * 初始化
     */
    let _init = function () {
        _checkUpdate();
        _addExtensionListener();
        Menu.manage(Settings);
        // 定期清理冗余的垃圾
        setTimeout(() => {
            Awesome.gcLocalFiles();
        }, 1000 * 10);
    };

    return {
        pageCapture: _captureVisibleTab,
        init: _init
    };
})();

BgPageInstance.init();
