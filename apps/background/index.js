/**
 * FeJson后台运行程序
 * @author zhaoxianlie
 */

import MSG_TYPE from '../static/js/common.js';
import Settings from '../options/settings.js';
import Menu from './menu.js';
import Awesome from '../dynamic/awesome.js';

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
                if (tab.id === tabId) {
                    Settings.getOptions((opts) => {

                        codeConfig.code = 'try{' + codeConfig.code + '}catch(e){};';
                        if (!codeConfig.hasOwnProperty('allFrames')) {
                            codeConfig.allFrames = String(opts['CONTENT_SCRIPT_ALLOW_ALL_FRAMES']) === 'true';
                        }

                        chrome.scripting.executeScript({
                            target: {tabId, allFrames: codeConfig.allFrames},
                            func: (code => {return function(){
                                console.log('-------',code);// -----TODO
                            }})(codeConfig.code)
                        }, function () {
                            callback && callback.apply(this, arguments);
                        });
                    });

                    return true;
                }
                return false;
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

        // 如果是noPage模式，则表名只完成content-script的工作，直接发送命令即可
        if (configs.noPage) {
            tool = new URL(`http://f.h?${tool}`).searchParams.get('tool').replace(/-/g, '');
            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                let found = tabs.some(tab => {
                    if (/^(http(s)?|file):\/\//.test(tab.url) && blacklist.every(reg => !reg.test(tab.url))) {
                        let codes = `window['${tool}NoPage'] && window['${tool}NoPage'](${JSON.stringify(tab)});`;
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

        // 创建或更新成功执行的动作
        let _tabUpdatedCallback = function (toolName, content) {
            return function (newTab) {
                setTimeout(function () {
                    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                        tabs && tabs.length && chrome.tabs.sendMessage(newTab.id, {
                            type: MSG_TYPE.TAB_CREATED_OR_UPDATED,
                            content: content,
                            event: toolName,
                            fromTab: activeTab
                        });
                    });
                }, 300);
            };
        };

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
                        url: `/${tool}/index.html`,
                        active: true
                    }, _tabUpdatedCallback(tool, withContent));
                } else {
                    chrome.tabs.update(tabId, {highlighted: true}, _tabUpdatedCallback(tool, withContent));
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
                if (Object.keys(tools).length) {
                    chrome.action.setPopup({
                        popup: '/popup/index.html'
                    });
                } else {
                    // 删除popup page
                    chrome.action.setPopup({
                        popup: ''
                    });

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
            Menu.manage(Settings);
        }

        if (showTips) {
            let actionTxt = '';
            switch (action) {
                case 'install':
                    actionTxt = '工具已「安装」成功，并已添加到弹出下拉列表，点击FeHelper图标可正常使用！';
                    break;
                case 'upgrade':
                    actionTxt = '工具已「更新」成功，点击FeHelper图标可正常使用！';
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

    // 往当前页面直接注入脚本，不再使用content-script的配置了
    let _injectContentScripts = function (tabId) {

        // 创建一个css内容的注入方法
        // 在内容脚本中，这样调用方法即可，比如：window.${toolName}ContentScriptCssInject();
        let _createCssInjecter = (tool, cssText) => {
            return `window['${tool.replace(/-/g, '')}ContentScriptCssInject']=()=>{let style=document.createElement('style');
                    style.textContent=unescape('${escape(cssText)}');document.head.appendChild(style);}`;
        };

        // JSON格式化脚本注入
        Settings.getOptions(opts => {
            if (opts.JSON_PAGE_FORMAT && String(opts.JSON_PAGE_FORMAT) !== 'false') {

                // 注入样式
                Awesome.getContentScript('json-format', true).then(css => {
                    if (css && css.length) {
                        injectScriptIfTabExists(tabId, {code: _createCssInjecter('json-format', css)});
                    } else {
                        fetch('../json-format/content-script.css').then(resp => resp.text()).then(css => {
                            injectScriptIfTabExists(tabId, {code: _createCssInjecter('json-format', css)});
                        });
                    }
                });

                // 注入脚本
                Awesome.getContentScript('json-format').then(jsText => {
                    let funcCaller = `window.JsonAutoFormat && window.JsonAutoFormat.format({JSON_PAGE_FORMAT: true});`;
                    if (!!jsText) {
                        injectScriptIfTabExists(tabId, {code: `${jsText};${funcCaller}`});
                    } else {
                        fetch('../json-format/content-script.js').then(resp => resp.text()).then(js => {
                            injectScriptIfTabExists(tabId, {code: `${js};${funcCaller}`});
                        });
                    }
                });
            }
        });

        // 其他工具注入
        Awesome.getInstalledTools().then(tools => {
            let list = Object.keys(tools).filter(tool => tool !== 'json-format' && tools[tool].contentScript);

            // 注入样式
            let promiseStyles = list.map(tool => Awesome.getContentScript(tool, true));
            Promise.all(promiseStyles).then(values => {
                let cssCodes = [];
                values.forEach((css, i) => {
                    if (css && css.length) {
                        cssCodes.push(_createCssInjecter(list[i], css));
                    }
                });
                injectScriptIfTabExists(tabId, {code: cssCodes.join(';')});
            });

            // 注入脚本
            let promiseScripts = list.map(tool => Awesome.getContentScript(tool));
            Promise.all(promiseScripts).then(values => {
                let jsCodes = [];
                values.forEach((js, i) => {
                    let func = `window['${list[i].replace(/-/g, '')}ContentScript']`;
                    jsCodes.push(`(()=>{ ${js} ; let func=${func};func&&func();})()`);
                });

                injectScriptIfTabExists(tabId, {code: jsCodes.join(';')});
            });
        });
    };

    /**
     * 接收来自content_scripts发来的消息
     */
    let _addExtensionListener = function () {
        // 初始化
        _updateBrowserAction();

        chrome.runtime.onMessage.addListener(function (request, sender, callback) {
            // 如果发生了错误，就啥都别干了
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
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
                // request.func && request.func(request.params, callback);
                callback && callback(request.params);
            } else {
                callback && callback();
            }

            return true;
        });


        // 每开一个窗口，都向内容脚本注入一个js，绑定tabId
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

            if (String(changeInfo.status).toLowerCase() === "complete"
                && /^(http(s)?|file):\/\//.test(tab.url)
                && blacklist.every(reg => !reg.test(tab.url))) {

                injectScriptIfTabExists(tabId, {
                    code: `window.__FH_TAB_ID__=${tabId};`
                });

                _injectContentScripts(tabId);
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
