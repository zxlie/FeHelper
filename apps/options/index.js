/**
 * FeHelper Options Page
 */

import Settings from './settings.js';
import Awesome from '../dynamic/awesome.js'
import MSG_TYPE from '../static/js/common.js';

new Vue({
    el: '#pageContainer',
    data: {
        es6Support:true,
        defaultKey: 'Alt+Shift+J',
        selectedOpts: [],
        manifest: {},
        fhTools: {},
        menuFeHelperSeting: false,
        menuDownloadCrx: false,
        sortArray: [],
        donate: {
            text: '微信打赏！鼓励升级！',
            image: './donate.jpeg'
        },
        countDown: 0,
        isFirefox: /Firefox/.test(navigator.userAgent)
    },

    created: function () {
        // 页面滤镜：关掉
        !this.isFirefox && DarkModeMgr.turnLightAuto();

        this.initData().then(() => {
            this.shortCut();
            this.remoteUpgrade();
            this.remoteHotFix();
        });
    },

    methods: {

        initData: async function () {

            this.manifest = chrome.runtime.getManifest();

            Settings.getOptions((opts) => {
                this.selectedOpts = Object.keys(opts).filter(k => String(opts[k]) === 'true');
            });

            this.sortArray = await Awesome.SortToolMgr.get();

            // 获取两个特殊右键菜单项的安装情况
            Awesome.menuMgr('fehelper-setting', 'get').then(value => {
                this.menuFeHelperSeting = String(value) !== '0';
            });
            Awesome.menuMgr('download-crx', 'get').then(value => {
                this.menuDownloadCrx = String(value) === '1';
            });

            Awesome.getAllTools().then(tools => {
                this.fhTools = tools;
                let isSortArrEmpty = !this.sortArray.length;

                Object.keys(tools).forEach(tool => {
                    if (tools[tool].installed) {
                        isSortArrEmpty && (tool !== 'devtools') && this.sortArray.push(tool);
                        !tools[tool]._devTool && Awesome.checkUpgrade(tool).then(upgrade => {
                            this.fhTools[tool].upgrade = upgrade;
                        });
                    }
                });
                this.sortTools();
            });
        },

        shortCut: function () {
            // 获取当前热键
            chrome.commands && chrome.commands.getAll && chrome.commands.getAll(keys => {
                keys.some(key => {
                    if (key.name === '_execute_browser_action' && key.shortcut) {
                        this.defaultKey = key.shortcut;
                        return true;
                    }
                });
            });
        },

        sortTools: function (repaintMenu) {
            let tools = {};
            let installed = {};
            Object.keys(this.fhTools).forEach(tool => {
                if (this.fhTools[tool].installed) {
                    installed[tool] = this.fhTools[tool];
                }
            });
            if (this.sortArray.length) {
                this.sortArray.forEach(tool => {
                    tools[tool] = installed[tool];
                });
                Awesome.SortToolMgr.set(this.sortArray);
            } else {
                tools = installed;
            }

            Object.keys(this.fhTools).forEach(tool => {
                if (!tools[tool]) {
                    tools[tool] = this.fhTools[tool];
                }
            });
            this.fhTools = tools;
            this.$forceUpdate();

            // 重绘右键菜单，以确保排序实时更新
            repaintMenu && chrome.runtime.sendMessage({
                type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                action: `menu-upgrade`,
                showTips: false,
                menuOnly: true
            });
        },
        sortUp: function (index) {
            if(index == 0) return;
            this.sortArray[index] = this.sortArray.splice(index - 1, 1, this.sortArray[index])[0];
            this.sortTools(true);
        },
        sortDown: function (index) {
            if(index == this.sortArray.length-1) return;
            this.sortArray[index] = this.sortArray.splice(index + 1, 1, this.sortArray[index])[0];
            this.sortTools(true);
        },

        remoteUpgrade: function () {
            // 从服务器同步最新添加的一些工具，实现远程更新，无需提审FeHelper
            let remoteUpgradeUrl = `${this.manifest.homepage_url}/static/js/awesome.js?v=${new Date * 1}`;
            fetch(remoteUpgradeUrl).then(resp => resp.text()).then(jsText => {
                try {
                    if (!jsText) return false;
                    window.evalCore.getEvalInstance(window)(jsText);

                    // 下面是新增的工具，允许部分key重置
                    Object.keys(RemoteAwesome.newTools).forEach(tool => {
                        if (!this.fhTools[tool]) {
                            this.fhTools[tool] = RemoteAwesome.newTools[tool];
                        } else {
                            this.fhTools[tool].name = RemoteAwesome.newTools[tool].name || this.fhTools[tool].name;
                            this.fhTools[tool].tips = RemoteAwesome.newTools[tool].tips || this.fhTools[tool].tips;
                            this.fhTools[tool].menuConfig = RemoteAwesome.newTools[tool].menuConfig || this.fhTools[tool].menuConfig;
                            if (RemoteAwesome.newTools[tool].contentScript !== undefined && this.fhTools[tool].contentScript !== RemoteAwesome.newTools[tool].contentScript) {
                                this.fhTools[tool].contentScript = RemoteAwesome.newTools[tool].contentScript;
                                this.fhTools[tool].upgrade = true;
                            }
                            if (RemoteAwesome.newTools[tool].contentScriptCss !== undefined && this.fhTools[tool].contentScriptCss !== RemoteAwesome.newTools[tool].contentScriptCss) {
                                this.fhTools[tool].contentScriptCss = RemoteAwesome.newTools[tool].contentScriptCss;
                                this.fhTools[tool].upgrade = true;
                            }
                            if (RemoteAwesome.newTools[tool].offloadForbid !== undefined && this.fhTools[tool].offloadForbid !== RemoteAwesome.newTools[tool].offloadForbid) {
                                this.fhTools[tool].offloadForbid = RemoteAwesome.newTools[tool].offloadForbid;
                                this.fhTools[tool].upgrade = true;
                            }
                        }
                    });

                    // 下面是需要下架掉的旧工具
                    RemoteAwesome.removedTools.forEach(tool => {
                        delete this.fhTools[tool];
                    });

                    // 页面强制刷新渲染
                    this.$forceUpdate();

                    // 结果存储到本地
                    Awesome.CodeCacheMgr.set(jsText);
                } catch (err) {
                    console.log(err)
                }
            }).catch(error => console.log('远程更新失败：', error));
        },

        remoteHotFix: function () {
            let hotfix = () => {
                // 从服务器同步最新添加的一些工具，实现远程更新，无需提审FeHelper
                let remoteHotfixUrl = `${this.manifest.homepage_url}/static/js/hotfix.js?v=${new Date().toLocaleDateString()}`;
                fetch(remoteHotfixUrl).then(resp => resp.text()).then(jsText => {
                    try {
                        if (!jsText) return false;
                        window.evalCore.getEvalInstance(window)(jsText);
                    } catch (e) {
                    }
                }).catch(error => console.log('远程热修复失败：', error));
            };
            setTimeout(hotfix, 2000);
        },

        close: () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.remove(tabs[0].id);
            });
        },

        cancel: function () {
            this.close();
        },

        save: function () {

            Settings.setOptions(this.selectedOpts, () => {
                // 保存成功提示，同时更新Menu
                chrome.runtime.sendMessage({
                    type: MSG_TYPE.DYNAMIC_ANY_THING,
                    func: ((params, callback) => {
                        //管理右键菜单
                        Menu.manage(Settings);
                        notifyText({
                            message: '配置修改已生效，请继续使用!',
                            autoClose: 2000
                        });
                    }).toString()
                });

                // 自动开关灯一次
                DarkModeMgr.turnLightAuto();
            });

            // 还要保存两个特殊的菜单配置项
            let settingAction = this.menuFeHelperSeting ? 'install' : 'offload';
            let crxAction = this.menuDownloadCrx ? 'install' : 'offload';
            Awesome.menuMgr('fehelper-setting', settingAction).then(() => {
                Awesome.menuMgr('download-crx', crxAction).then(() => {
                    chrome.runtime.sendMessage({
                        type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                        action: `menu-${crxAction}`,
                        showTips: false,
                        menuOnly: true
                    });
                });
            });
        },

        setShortcuts: function () {
            chrome.tabs.create({
                url: 'chrome://extensions/shortcuts'
            });
            return false;
        },

        donateToggle: function (event) {
            let box = this.$refs.boxDonate;
            if (box.classList.contains('hide')) {
                box.classList.remove('hide');
                box.style.top = (event.target.offsetTop + 30) + 'px';
                box.style.left = event.target.offsetLeft + 'px';
            } else {
                box.classList.add('hide');
            }
        },

        installOrUpgrade: function (tool, event) {

            let btn = event.target;
            if (btn.tagName.toLowerCase() === 'i') {
                btn = btn.parentNode;
            }

            if (btn.getAttribute('data-undergoing') === '1') {
                return false;
            }
            btn.setAttribute('data-undergoing', 1);
            let elProgress = btn.querySelector('span.x-progress');

            Awesome.install(tool, progress => {
                elProgress.textContent = `(${progress})`;
            }).then(() => {
                if (this.fhTools[tool].upgrade) {
                    this.fhTools[tool].upgrade = false;
                }

                chrome.runtime.sendMessage({
                    type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                    toolName: tool,
                    action: this.fhTools[tool].installed ? 'upgrade' : 'install',
                    showTips: true,
                    backgroundScript: this.fhTools[tool].backgroundScript
                });

                this.$nextTick(() => {
                    btn.setAttribute('data-undergoing', 0);
                    elProgress.textContent = `(100%)`;
                    setTimeout(() => {
                        this.fhTools[tool].installed = true;
                        elProgress.textContent = '';
                        if (!this.sortArray.includes(tool) && (tool !== 'devtools')) {
                            this.sortArray.push(tool);
                        }
                        // 按照安装状态进行排序
                        this.sortTools();
                    }, 500)
                });
            }, rejectResp => {
                btn.setAttribute('data-undergoing', 0);
                alert('可能是网络状态不太好，请稍后再试...');
            });
        },

        offLoad: function (tool, event) {

            if (event.target.getAttribute('data-undergoing') === '1') {
                return false;
            }
            event.target.setAttribute('data-undergoing', 1);

            Awesome.offLoad(tool).then(() => {
                chrome.runtime.sendMessage({
                    type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                    action: 'offload',
                    showTips: true
                });

                this.fhTools[tool].installed = false;
                event.target.setAttribute('data-undergoing', 0);
                let index = this.sortArray.indexOf(tool);
                index !== -1 && this.sortArray.splice(index, 1);

                // 继续移除右键菜单
                Awesome.menuMgr(tool, 'offload').then(() => {
                    this.fhTools[tool].menu = false;

                    chrome.runtime.sendMessage({
                        type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                        action: `menu-offload`,
                        showTips: false,
                        menuOnly: true
                    });

                    // 按照安装状态进行排序
                    this.sortTools();
                });
            });
        },

        menuMgr: function (tool, event) {

            if (event.target.getAttribute('data-undergoing') === '1') {
                return false;
            }
            event.target.setAttribute('data-undergoing', 1);

            let offLoadMode = this.fhTools[tool].menu;
            let action = offLoadMode ? 'offload' : 'install';

            Awesome.menuMgr(tool, action).then(() => {
                chrome.runtime.sendMessage({
                    type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                    action: `menu-${action}`,
                    showTips: true,
                    menuOnly: true
                });

                this.fhTools[tool].menu = !offLoadMode;
                event.target.setAttribute('data-undergoing', 0);

                // 页面强制刷新渲染
                this.$forceUpdate();
            });
        },

        turnLight(event) {
            event.preventDefault();
            event.stopPropagation();
            DarkModeMgr.turnLight(true);
            this.countDown = 5;
            let intervalId = setInterval(() => {
                if (this.countDown === 0) {
                    DarkModeMgr.turnLight(false);
                    clearInterval(intervalId);
                } else {
                    this.countDown--;
                }
            }, 1000);
        },

        openFeOnline: function () {
            chrome.tabs.create({
                url: this.manifest.homepage_url
            });
        }
    }
});
