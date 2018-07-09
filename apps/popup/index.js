/**
 * FeHelper Popup Menu
 */

new Vue({
    el: '#pageContainer',
    data: {
        ajaxDebugger: '已开',
        canMeShow: {},
        manifest:{}
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

        openOptionsPage: () => chrome.runtime.openOptionsPage()
    }
});