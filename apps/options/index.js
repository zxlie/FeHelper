/**
 * FeHelper Options Page
 */

import Settings from './settings.js';
import Awesome from '../background/awesome.js'
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

        remoteHotFix: function () {
            let hotfix = () => {
                // 从服务器同步最新添加的一些工具，实现远程更新，无需提审FeHelper
                let remoteHotfixUrl = `${this.manifest.homepage_url}/static/js/hotfix.js?cur_ver=${new Date().toLocaleDateString()}`;
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
                    }).then(() => {
                        Settings.setOptions(this.selectedOpts, () => {
                            // 保存成功提示，同时更新Menu
                            chrome.runtime.sendMessage({
                                type: MSG_TYPE.DYNAMIC_ANY_THING,
                                thing: 'save-options'
                            });

                            // 自动开关灯一次
                            DarkModeMgr.turnLightAuto();
                        });
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

        install: function (tool, event) {

            let btn = event.target;
            if (btn.tagName.toLowerCase() === 'i') {
                btn = btn.parentNode;
            }

            if (btn.getAttribute('data-undergoing') === '1') {
                return false;
            }
            btn.setAttribute('data-undergoing', 1);
            let elProgress = btn.querySelector('span.x-progress');

            // 显示安装进度
            let pt = 1;
            Awesome.install(tool).then(() => {
                elProgress.textContent = `(${pt}%)`;
                let ptInterval = setInterval(() => {
                    elProgress.textContent = `(${pt}%)`;
                    pt+= Math.floor(Math.random() * 20);
                    if(pt>100) {
                        clearInterval(ptInterval);
                        elProgress.textContent = ``;
                        this.fhTools[tool].installed = true;
                        if (!this.sortArray.includes(tool) && (tool !== 'devtools')) {
                            this.sortArray.push(tool);
                        }
                        // 按照安装状态进行排序
                        this.sortTools();
                        btn.setAttribute('data-undergoing', 0);

                        chrome.runtime.sendMessage({
                            type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                            toolName: tool,
                            action: 'install',
                            showTips: true
                        });
                    }
                },100);
            });
        },

        offLoad: function (tool, event) {

            if(!confirm('防止误操作；请再次确认是否要卸载这个工具？')) {
                return;
            }

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
