/**
 * FeHelper Popup Menu
 */

new Vue({
    el: '#pageContainer',
    data: {
        ajaxDebugger: '已开',
        canMeShow: {},
        manifest: {},
        isFireFox: window.navigator && /firefox/i.test(navigator.userAgent)
    },

    created: function () {
        // 获取当前ctx的version
        this.manifest = chrome.runtime.getManifest();

        let Settings = Tarp.require('../options/settings');

        // 根据配置，控制功能菜单的显示与隐藏
        Settings.getOptions((opts) => this.canMeShow = opts);

        // ajax debugger开关文案控制
        let bgPage = chrome.extension.getBackgroundPage();
        bgPage.BgPageInstance.tellMeAjaxDbgSwitch((dbgSwitchOn) => {
            this.ajaxDebugger = dbgSwitchOn ? '已开' : '已关';
        });
    },

    mounted: function () {

        // 整个popup窗口支持上线选择
        document.body.addEventListener('keydown', e => {
            let keyCode = e.keyCode || e.which;
            if (![38, 40, 13].includes(keyCode)) {
                return false;
            }
            let ul = document.querySelector('#pageContainer ul');
            let hovered = ul.querySelector('li.x-hovered');
            let next, prev;
            if (hovered) {
                hovered.classList.remove('x-hovered');
                next = hovered.nextElementSibling;
                prev = hovered.previousElementSibling;
            }
            if (!next) {
                next = ul.querySelector('li:first-child');
            }
            if (!prev) {
                prev = ul.querySelector('li:last-child');
            }

            switch (keyCode) {
                case 38: // 方向键：↑
                    prev.classList.add('x-hovered');
                    break;
                case 40: // 方向键：↓
                    next.classList.add('x-hovered');
                    break;
                case 13: // 回车键：选择
                    hovered.click();
            }

        }, false);
    },

    methods: {

        runHelper: function (mType, useFile) {
            // 获取后台页面，返回window对象
            let bgPage = chrome.extension.getBackgroundPage();

            if (mType === 'COLOR_PICKER') {
                bgPage.BgPageInstance.showColorPicker();
            } else {
                let MSG_TYPE = Tarp.require('../static/js/msg_type');
                bgPage.BgPageInstance.runHelper({
                    msgType: MSG_TYPE[mType],
                    useFile: useFile
                }, () => {
                    if (mType === 'AJAX_DEBUGGER') {
                        bgPage.BgPageInstance.tellMeAjaxDbgSwitch((dbgSwitchOn) => {
                            this.ajaxDebugger = dbgSwitchOn ? '已开' : '已关';
                        }, true);
                    }
                });
            }

            window.close();
        },

        openOptionsPage: () => {
            chrome.runtime.openOptionsPage();
            window.close();
        },

        openUrl: function (event) {
            event.preventDefault();
            // 获取后台页面，返回window对象
            let bgPage = chrome.extension.getBackgroundPage();
            bgPage.BgPageInstance.openUrl(event.currentTarget.href);
            window.close();
            return false;
        }
    }
});