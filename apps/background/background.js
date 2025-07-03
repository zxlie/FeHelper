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
import Statistics from './statistics.js';


let BgPageInstance = (function () {

    let FeJson = {
        notifyTimeoutId: -1
    };

    // 黑名单页面
    let blacklist = [
        /^https:\/\/chrome\.google\.com/
    ];

    // 全局缓存最新的客户端信息
    let FH_CLIENT_INFO = {};

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

    // 像页面注入css脚本
    let _injectContentCss = function(tabId,toolName,isDevTool){
        if(isDevTool){
            Awesome.getContentScript(toolName, true)
                .then(css => {
                    InjectTools.inject(tabId, { css })
                });
        }else{
            InjectTools.inject(tabId, {files: [`${toolName}/content-script.css`]});
        }
    };


    // 往当前页面直接注入脚本，不再使用content-script的配置了
    let _injectContentScripts = function (tabId) {

        // FH工具脚本注入
        Awesome.getInstalledTools().then(tools => {

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

            // 注入js脚本
            list.filter(tool => (tools[tool].contentScriptJs || tools[tool].contentScript))
                    .map(tool => Awesome.getContentScript(tool).then(js => {
                        InjectTools.inject(tabId, { js });
                    }));
        });
    };

    /**
     * 打开打赏弹窗
     * @param {string} toolName - 工具名称
     */
    chrome.gotoDonateModal = function (toolName) {
        chrome.tabs.query({currentWindow: true}, function (tabs) {

            Settings.getOptions((opts) => {
                let isOpened = false;
                let tabId;
                let reg = new RegExp("^chrome.*\\/options\\/index.html\\?donate_from=" + toolName + "$", "i");
                for (let i = 0, len = tabs.length; i < len; i++) {
                    if (reg.test(tabs[i].url)) {
                        isOpened = true;
                        tabId = tabs[i].id;
                        break;
                    }
                }

                if (!isOpened) {
                    let url = `/options/index.html?donate_from=${toolName}`;
                    chrome.tabs.create({ url,active: true });
                } else {
                    chrome.tabs.update(tabId, {highlighted: true}).then(tab => {
                        chrome.tabs.reload(tabId);
                    });
                }
                // 记录工具使用
                Statistics.recordToolUsage('donate',{from: toolName});

            });

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

            // 如果是二维码工具，且没有传入内容，则使用当前页面的URL
            if (tool === 'qr-code' && !withContent && activeTab) {
                withContent = activeTab.url;
            }

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
                    let url = `/${tool}/index.html` + (query ? "?" + query : '');
                    chrome.tabs.create({
                        url,
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
        // 获取当前唯一安装的工具并直接打开
        Awesome.getInstalledTools().then(tools => {
            const installedTools = Object.keys(tools).filter(tool => tools[tool].installed);
            if (installedTools.length === 1) {
                const singleTool = installedTools[0];
                chrome.DynamicToolRunner({
                    tool: singleTool,
                    noPage: !!tools[singleTool].noPage
                });
                
                // 记录工具使用
                Statistics.recordToolUsage(singleTool);
            } else {
                // 备用方案：如果检测失败，打开JSON格式化工具
                chrome.DynamicToolRunner({
                    tool: MSG_TYPE.JSON_FORMAT
                });
                
                // 记录工具使用
                Statistics.recordToolUsage(MSG_TYPE.JSON_FORMAT);
            }
        }).catch(error => {
            console.error('获取工具列表失败，使用默认工具:', error);
            // 出错时的备用方案
            chrome.DynamicToolRunner({
                tool: MSG_TYPE.JSON_FORMAT
            });
            
            // 记录工具使用
            Statistics.recordToolUsage(MSG_TYPE.JSON_FORMAT);
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
            // 对于卸载操作，添加一个小延迟确保存储操作完成
            const delay = action === 'offload' ? 100 : 0;
            
            setTimeout(() => {
                // 如果有安装过工具，则显示Popup模式
                Awesome.getInstalledTools().then(tools => {
                // 计算已安装的工具数量
                const installedTools = Object.keys(tools).filter(tool => tools[tool].installed);
                const installedCount = installedTools.length;
                
                if (installedCount > 1) {
                    // 多个工具：显示popup
                    chrome.action.setPopup({ popup: '/popup/index.html' });
                    // 移除点击监听器（如果存在）
                    if (chrome.action.onClicked.hasListener(browserActionClickedHandler)) {
                        chrome.action.onClicked.removeListener(browserActionClickedHandler);
                    }
                } else if (installedCount === 1) {
                    // 只有一个工具：直接打开工具，不显示popup
                    chrome.action.setPopup({ popup: '' });
                    
                    // 添加点击监听器
                    if (!chrome.action.onClicked.hasListener(browserActionClickedHandler)) {
                        chrome.action.onClicked.addListener(browserActionClickedHandler);
                    }
                } else {
                    // 没有安装任何工具：显示popup（让用户去安装工具）
                    chrome.action.setPopup({ popup: '/popup/index.html' });
                    // 移除点击监听器（如果存在）
                    if (chrome.action.onClicked.hasListener(browserActionClickedHandler)) {
                        chrome.action.onClicked.removeListener(browserActionClickedHandler);
                    }
                }
                });
            }, delay);

            if (action === 'offload') {
                _animateTips('-1');
            } else if(!!action) {
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
            callback({ params, uri });
        });
    };

    let _showScreenShotResult = function(data){
        // 确保截图数据完整有效
        if (!data || !data.screenshots || !data.screenshots.length) {
            return;
        }
        
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
        Awesome.StorageMgr.get('JS_CSS_PAGE_BEAUTIFY').then(val => {
            if(val !== '0') {
                let js = `window._codebutifydetect_('${params.fileType}')`;
                InjectTools.inject(params.tabId, { js });
                // 记录工具使用
                Statistics.recordToolUsage('code-beautify');
            }
        });
    };

    /**
     * 接收来自content_scripts发来的消息
     */
    let _addExtensionListener = function () {

        _updateBrowserAction();

        chrome.runtime.onMessage.addListener(function (request, sender, callback) {
            // 如果发生了错误，就啥都别干了
            if (chrome.runtime.lastError) {
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
                // 记录工具使用
                Statistics.recordToolUsage('screenshot');
            }
            // 直接处理content-script.js中的截图请求
            else if (request.type === 'fh-screenshot-capture-visible') {
                _captureVisibleTab(callback);
                // 记录工具使用
                Statistics.recordToolUsage('screenshot');
            }
            // 打开动态工具页面
            else if (request.type === MSG_TYPE.OPEN_DYNAMIC_TOOL) {
                chrome.DynamicToolRunner(request);
                // 记录工具使用
                if (request.page) {
                    Statistics.recordToolUsage(request.page);
                }
                callback && callback();
            }
            // 打开其他页面
            else if (request.type === MSG_TYPE.OPEN_PAGE) {
                chrome.DynamicToolRunner({
                    tool: request.page
                });
                // 记录工具使用
                if (request.page) {
                    Statistics.recordToolUsage(request.page);
                }
                callback && callback();
            }
            // 任何事件，都可以通过这个钩子来完成
            else if (request.type === MSG_TYPE.DYNAMIC_ANY_THING) {
                switch(request.thing){
                    // 插件选项保存成功提示
                    case 'save-options':
                        notifyText({
                            message: '配置修改已生效，请继续使用!',
                            autoClose: 2000
                        });
                        break;
                    // 触发网页截图功能
                    case 'trigger-screenshot':
                        handleTriggerScreenshot(request.tabId);
                        break;
                    // 获取JSON格式化工具的配置选项
                    case 'request-jsonformat-options':
                        requestJsonformatOptions(request.params, callback);
                        return true; // 这个返回true是非常重要的！！！要不然callback会拿不到结果
                    // 保存JSON格式化工具的配置选项
                    case 'save-jsonformat-options':
                        saveJsonformatOptions(request.params, callback);
                        return true;
                    // 切换JSON格式化工具栏显示状态
                    case 'toggle-jsonformat-options':
                        toggleJsonformatOptions(callback);
                        return true; // 这个返回true是非常重要的！！！要不然callback会拿不到结果
                    // 代码美化功能
                    case 'code-beautify':
                        _codeBeautify(request.params);
                        break;
                    // 关闭代码美化功能
                    case 'close-beautify':
                        handleCloseBeautify();
                        break;
                    // 二维码解码功能
                    case 'qr-decode':
                        handleQrDecode(request.params.uri);
                        break;
                    // 请求页面内容数据
                    case 'request-page-content':
                        handleRequestPageContent(request);
                        break;
                    // 设置页面性能时序数据
                    case 'set-page-timing-data':
                        handleSetPageTimingData(request.wpoInfo);
                        break;
                    // 颜色拾取器截图功能
                    case 'color-picker-capture':
                        _colorPickerCapture(request.params);
                        // 记录工具使用
                        Statistics.recordToolUsage('color-picker');
                        break;
                    // 分页截图功能
                    case 'add-screen-shot-by-pages':
                        _addScreenShotByPages(request.params,callback);
                        // 记录工具使用
                        Statistics.recordToolUsage('screenshot');
                        return true;
                    // 页面截图完成处理
                    case 'page-screenshot-done':
                        _showScreenShotResult(request.params);
                        break;
                    // 启动页面脚本注入（油猴功能）
                    case 'request-monkey-start':
                        Monkey.start(request.params);
                        break;
                    // 注入内容脚本CSS样式
                    case 'inject-content-css':
                        _injectContentCss(sender.tab.id,request.tool,!!request.devTool);
                        break;
                    // 打开插件选项页面
                    case 'open-options-page':
                        chrome.runtime.openOptionsPage();
                        break;
                    // 打开打赏弹窗
                    case 'open-donate-modal':
                        chrome.gotoDonateModal(request.params.toolName);
                        break;
                    // 加载本地脚本文件
                    case 'load-local-script':
                        loadLocalScript(request.script, callback);
                        return true; // 异步响应需要返回true
                    // 工具使用统计埋点
                    case 'statistics-tool-usage':
                        // 埋点：自动触发json-format-auto
                        Statistics.recordToolUsage(request.params.tool_name,request.params);
                        break;
                    // 获取热修复脚本
                    case 'fetch-hotfix-json':
                        fetchHotfixJson(callback);
                        return true; // 异步响应必须返回true
                    // 获取插件补丁数据
                    case 'fetch-fehelper-patchs':
                        fetchFehelperPatchs(callback);
                        return true;
                    // 获取指定工具的补丁
                    case 'fh-get-tool-patch':
                        getToolPatch(request.toolName, callback);
                        return true;
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
                    // 记录新安装用户
                    Statistics.recordInstallation();
                    break;
                case 'update':
                    _animateTips('+++1');
                    // 记录更新安装
                    Statistics.recordUpdate(previousVersion);
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
            // 检查是否为 Firefox 浏览器，Firefox 不支持 requestUpdateCheck API
            if (chrome.runtime.requestUpdateCheck && navigator.userAgent.indexOf("Firefox") === -1) {
                chrome.runtime.requestUpdateCheck((status) => {
                    if (status === "update_available") {
                        chrome.runtime.reload();
                    }
                });
            }
        }, 1000 * 30);
    };

    /**
     * 初始化
     */
    let _init = function () {
        console.log(`[FeHelper] Background初始化开始 - ${new Date().toLocaleString()}`);
        console.log(`[FeHelper] 扩展版本: ${chrome.runtime.getManifest().version}`);
        console.log(`[FeHelper] Service Worker启动原因: ${chrome.runtime.getContexts ? 'Context API可用' : '传统模式'}`);
        
        _checkUpdate();
        _addExtensionListener();
        
        // 初始化统计功能
        Statistics.init();
        
        Menu.rebuild();

        // 每天自动检查热更新（添加频率控制）
        checkAndFetchPatchs();
        
        // 定期清理冗余的垃圾
        setTimeout(() => {
            Awesome.gcLocalFiles();
        }, 1000 * 10);
        
        console.log(`[FeHelper] Background初始化完成 - ${new Date().toLocaleString()}`);
    };

    /**
     * 触发截图工具的执行
     * @param {number} tabId - 标签页ID
     */
    function _triggerScreenshotTool(tabId) {
        // 先尝试直接发送消息给content script
        chrome.tabs.sendMessage(tabId, {
            type: 'fh-screenshot-start'
        }).then(() => {
            // 成功触发
        }).catch(() => {
            // 如果发送消息失败，使用noPage模式
            chrome.DynamicToolRunner({
                tool: 'screenshot',
                noPage: true
            });
        });
    }

    // 监听options页面传递的客户端信息
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request && request.type === 'clientInfo' && request.data) {
            FH_CLIENT_INFO = request.data;
        }
    });

    // 处理从popup触发的截图请求
    function handleTriggerScreenshot(tabId) {
        if (tabId) {
            _triggerScreenshotTool(tabId);
        } else {
            chrome.DynamicToolRunner({
                tool: 'screenshot',
                noPage: true
            });
        }
        // 记录工具使用
        Statistics.recordToolUsage('screenshot');
    }

    // 请求JSON格式化选项配置
    function requestJsonformatOptions(params, callback) {
        Awesome.StorageMgr.get(params).then(result => {
            Object.keys(result).forEach(key => {
                if (['MAX_JSON_KEYS_NUMBER', 'JSON_FORMAT_THEME'].includes(key)) {
                    result[key] = parseInt(result[key]);
                } else {
                    result[key] = (""+result[key] !== 'false');
                }
            });
            callback && callback(result);
        });
    }

    // 保存JSON格式化选项配置
    function saveJsonformatOptions(params, callback) {
        Awesome.StorageMgr.set(params).then(() => {
            callback && callback();
        });
        // 记录工具使用
        Statistics.recordToolUsage('save-jsonformat-options');
    }

    // 切换JSON格式化选项显示状态
    function toggleJsonformatOptions(callback) {
        Awesome.StorageMgr.get('JSON_TOOL_BAR_ALWAYS_SHOW').then(result => {
            let show = result !== false;
            Awesome.StorageMgr.set('JSON_TOOL_BAR_ALWAYS_SHOW',!show).then(() => {
                callback && callback(!show);
            });
        });
        // 记录工具使用
        Statistics.recordToolUsage('json-format');
    }

    // 关闭代码美化功能
    function handleCloseBeautify() {
        Awesome.StorageMgr.set('JS_CSS_PAGE_BEAUTIFY',0);
        // 记录工具使用
        Statistics.recordToolUsage('code-beautify-close');
    }

    // 处理二维码解码
    function handleQrDecode(uri) {
        chrome.DynamicToolRunner({
            withContent: uri,
            tool: 'qr-code',
            query: `mode=decode`
        });
        // 记录工具使用
        Statistics.recordToolUsage('qr-code');
    }

    // 处理页面内容请求
    function handleRequestPageContent(request) {
        request.params = FeJson[request.tabId];
        delete FeJson[request.tabId];
    }

    // 处理页面性能数据设置
    function handleSetPageTimingData(wpoInfo) {
        chrome.DynamicToolRunner({
            tool: 'page-timing',
            withContent: wpoInfo
        });
        // 记录工具使用
        Statistics.recordToolUsage('page-timing');
    }

    // 获取指定工具的补丁（css/js）
    function getToolPatch(toolName, callback) {
        // 如果没有提供toolName，直接返回空补丁
        if (!toolName) {
            callback && callback({ css: '', js: '' });
            return;
        }

        let version = String(chrome.runtime.getManifest().version).split('.').map(n => parseInt(n)).join('.');
        const storageKey = `FH_PATCH_HOTFIX_${version}`;
        chrome.storage.local.get(storageKey, result => {
            const patchs = result[storageKey];
            if (patchs && patchs[toolName]) {
                const { css, js } = patchs[toolName];
                callback && callback({ css, js });
            } else {
                callback && callback({ css: '', js: '' });
            }
        });
    }

    // 加载本地脚本，处理加载JSON格式化相关脚本的请求
    function loadLocalScript(scriptUrl, callback) {
        fetch(scriptUrl)
            .then(response => response.text())
            .then(scriptContent => {
                callback && callback(scriptContent);
            })
            .catch(error => {
                console.error('加载脚本失败:', error);
                callback && callback(null);
            });
    }

    // 获取热修复脚本，代理请求 hotfix.json，解决CORS问题
    function fetchHotfixJson(callback) {
        fetch('https://baidufe.com/fehelper/static/js/hotfix.json?v=' + Date.now())
            .then(response => response.text())
            .then(scriptContent => {
                callback && callback({ success: true, content: scriptContent });
            })
            .catch(error => {
                callback && callback({ success: false, error: error.message });
            });
    }

    // 检查并获取补丁（带频率控制）
    function checkAndFetchPatchs() {
        const PATCH_CHECK_INTERVAL = 5 * 60 * 1000; // 5min
        const STORAGE_KEY = 'FH_LAST_PATCH_CHECK';
        
        chrome.storage.local.get(STORAGE_KEY, (result) => {
            const lastCheck = result[STORAGE_KEY] || 0;
            const now = Date.now();
            
            if (now - lastCheck > PATCH_CHECK_INTERVAL) {
                console.log(`[FeHelper] 距离上次检查已超过5min，开始检查热更新...`);
                
                fetchFehelperPatchs((result) => {
                    if (result && result.success) {
                        console.log(`[FeHelper] 自动热更新成功，版本: v${result.version}`);
                    } else if (result && result.notFound) {
                        console.log(`[FeHelper] 当前版本暂无热更新补丁`);
                    } else {
                        console.log(`[FeHelper] 自动热更新检查失败:`, result?.error);
                    }
                    
                    // 更新最后检查时间
                    chrome.storage.local.set({ [STORAGE_KEY]: now });
                });
            } else {
                const nextCheck = new Date(lastCheck + PATCH_CHECK_INTERVAL);
                console.log(`[FeHelper] 距离上次检查不足5min，下次检查时间: ${nextCheck.toLocaleString()}`);
            }
        });
    }

    // 获取FeHelper热修复补丁
    function fetchFehelperPatchs(callback) {
        let version = String(chrome.runtime.getManifest().version).split('.').map(n => parseInt(n)).join('.');
        let patchUrl = `https://www.baidufe.com/fehelper-old/fh-patchs/v${version}.json`;
        
        // 先检测文件是否存在（使用HEAD请求）
        fetch(patchUrl, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    // 文件存在，进行正常的fetch操作
                    return fetch(`${patchUrl}?t=${Date.now()}`)
                        .then(resp => {
                            if (!resp.ok) {
                                throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
                            }
                            return resp.json();
                        })
                        .then(data => {
                            const patchs = data.patchs || data;
                            const storageData = {};
                            storageData[`FH_PATCH_HOTFIX_${version}`] = patchs;
                            chrome.storage.local.set(storageData, () => {
                                console.log(`[FeHelper] 成功获取版本 v${version} 的热修复补丁`);
                                callback && callback({ success: true, version });
                            });
                        });
                } else {
                    // 文件不存在
                    console.log(`[FeHelper] 服务器上不存在版本 v${version} 的补丁文件`);
                    callback && callback({ success: false, error: '补丁文件不存在', notFound: true });
                }
            })
            .catch(e => {
                console.error(`[FeHelper] 获取补丁失败:`, e);
                callback && callback({ success: false, error: e.message });
            });
    }

    return {
        pageCapture: _captureVisibleTab,
        init: _init
    };
})();

BgPageInstance.init();