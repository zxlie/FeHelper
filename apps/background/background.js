/**
 * FeJson后台运行程序
 * @author zhaoxianlie
 */


import MSG_TYPE from '../static/js/common.js';
import Settings from '../options/settings.js';
import Menu from './menu.js';
import Awesome from './awesome.js';
import InjectTools from './inject-tools.js';
import Monkey from './monkey.js';


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



    // 往当前页面直接注入脚本，不再使用content-script的配置了
    let _injectContentScripts = function (tabId) {

        // FH工具脚本注入
        Awesome.getInstalledTools().then(tools => {

            // 注入样式
            let cssFiles = Object.keys(tools)
                            .filter(tool => !tools[tool]._devTool && tools[tool].contentScriptCss)
                            .map(tool => `${tool}/content-script.css`);
            InjectTools.inject(tabId, {files: cssFiles});

            // 注入js
            let jsTools = Object.keys(tools)
                        .filter(tool => !tools[tool]._devTool
                                && (tools[tool].contentScriptJs || tools[tool].contentScript));
            let jsCodes = [];
            jsTools.forEach((t, i) => {
                let func = `window['${t.replace(/-/g, '')}ContentScript']`;
                jsCodes.push(`(()=>{let func=${func};func&&func();})()`);
            });
            let jsFiles = jsTools.map(tool => `${tool}/content-script.js`);
            InjectTools.inject(tabId, {files: jsFiles,js: jsCodes.join(';')});
        });

        // 其他开发者自定义工具脚本注入======For FH DevTools
        Awesome.getInstalledTools().then(tools => {
            let list = Object.keys(tools).filter(tool => tools[tool]._devTool);

            // 注入css样式
            list.filter(tool => tools[tool].contentScriptCss)
                    .map(tool => Awesome.getContentScript(tool, true).then(css => {
                        InjectTools.inject(tabId, { css });
                    }));

            // 注入js脚本
            list.filter(tool => (tools[tool].contentScriptJs || tools[tool].contentScript))
                    .map(tool => Awesome.getContentScript(tool).then(js => {
                        InjectTools.inject(tabId, { js });
                    }));
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
                        InjectTools.inject(tab.id, {js: codes});
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
     * 插件图标点击后的默认动作
     * @param request
     * @param sender
     * @param callback
     */
    let browserActionClickedHandler = function (request, sender, callback) {
        chrome.DynamicToolRunner({
            tool: MSG_TYPE.JSON_FORMAT
        });
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
            // 如果有安装过工具，则显示Popup模式
            Awesome.getInstalledTools().then(tools => {
                if (Object.keys(tools).length > 1) {
                    chrome.action.setPopup({ popup: '/popup/index.html' });
                } else {
                    // 删除popup page
                    chrome.action.setPopup({ popup: '' });

                    // 否则点击图标，直接打开页面
                    if (!chrome.action.onClicked.hasListener(browserActionClickedHandler)) {
                        chrome.action.onClicked.addListener(browserActionClickedHandler);
                    }
                }
            });

            if (action === 'offload') {
                _animateTips('-1');
            } else {
                _animateTips('+1');
            }
        } else {
            // 重绘菜单
            Menu.rebuild();
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

    let _addScreenShotByPages = function(params,callback){
        chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, uri => {
            callback({ params,uri });
        });
    };

    let _showScreenShotResult = function(data){
        chrome.DynamicToolRunner({
            tool: 'screenshot',
            withContent: data
        });
    };

    let _colorPickerCapture = function(params) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (dataUrl) {
                let js = `window.colorpickerNoPage(${JSON.stringify({
                    setPickerImage: true,
                    pickerImage: dataUrl
                })})`;
                InjectTools.inject(tabs[0].id, { js });
            });
        });
    };

    let _codeBeautify = function(params){
        if (['javascript', 'css'].includes(params.fileType)) {
            Awesome.StorageMgr.get('JS_CSS_PAGE_BEAUTIFY').then(val => {
                if(val !== '0') {
                    let js = `window._codebutifydetect_('${params.fileType}')`;
                    InjectTools.inject(params.tabId, { js });
                }
            });
        }
    };

    /**
     * 接收来自content_scripts发来的消息
     */
    let _addExtensionListener = function () {

        _updateBrowserAction();

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
                        notifyText({
                            message: '配置修改已生效，请继续使用!',
                            autoClose: 2000
                        });
                        break;
                    case 'request-jsonformat-options':
                        Awesome.StorageMgr.get(request.params).then(result => {
                            Object.keys(result).forEach(key => {
                                if (['MAX_JSON_KEYS_NUMBER', 'JSON_FORMAT_THEME'].includes(key)) {
                                    result[key] = parseInt(result[key]);
                                } else {
                                    result[key] = (result[key] !== 'false');
                                }
                            });
                            callback && callback(result);
                        });
                        return true; // 这个返回true是非常重要的！！！要不然callback会拿不到结果
                    case 'save-jsonformat-options':
                        Awesome.StorageMgr.set(request.params).then(() => {
                            callback && callback();
                        });
                        return true;
                    case 'toggle-jsonformat-options':
                        Awesome.StorageMgr.get('JSON_TOOL_BAR_ALWAYS_SHOW').then(result => {
                            let show = result !== 'false';
                            Awesome.StorageMgr.set('JSON_TOOL_BAR_ALWAYS_SHOW',!show).then(() => {
                                callback && callback(!show);
                            });
                        });
                        return true; // 这个返回true是非常重要的！！！要不然callback会拿不到结果
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
                    case 'add-screen-shot-by-pages':
                        _addScreenShotByPages(request.params,callback);
                        return true;
                    case 'page-screenshot-done':
                        _showScreenShotResult(request.params);
                        break;
                    case 'request-monkey-start':
                        Monkey.start(request.params);
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
                    InjectTools.inject(tabId, { js: `window.__FH_TAB_ID__=${tabId};` });
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
        Menu.rebuild();
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
