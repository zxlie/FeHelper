/**
 * FeHelper Popup Menu
 */

new Vue({
    el: 'ul.fe-function-list',
    data: {
        ajaxDebugger: '开',
        canMeShow: {}
    },
    created: function () {
        let Settings = Tarp.require('../options/settings');

        // 根据配置，控制功能菜单的显示与隐藏
        Settings.doGetOptions(Settings.optionItems, (opts) => {
            opts && Object.keys(opts).forEach((item) => {
                this.canMeShow[item] = opts[item] !== 'false';
            });
        })
    },
    methods: {

        runHelper: function (mType, useFile) {
            // 获取后台页面，返回window对象
            let bgPage = chrome.extension.getBackgroundPage();

            if (mType === 'COLOR_PICKER') {
                bgPage.BgPageInstance.showColorPicker();
            } else {
                bgPage.BgPageInstance.runHelper({
                    msgType: mType,
                    useFile: useFile
                });
            }
        }
    }
});