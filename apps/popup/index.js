/**
 * FeHelper Popup Menu
 */

import Awesome from '../background/awesome.js'
import MSG_TYPE from '../static/js/common.js';

new Vue({
    el: '#pageContainer',
    data: {
        manifest: {},
        fhTools: {}
    },

    created: function () {
        // 获取当前ctx的version
        this.manifest = chrome.runtime.getManifest();

        Awesome.getInstalledTools().then(tools => {
            this.fhTools = tools;
        });

        // 自动开关灯
        DarkModeMgr.turnLightAuto();
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

        runHelper: function (toolName) {
            let request = {
                type: MSG_TYPE.OPEN_DYNAMIC_TOOL,
                page: toolName,
                noPage: !!this.fhTools[toolName].noPage
            };
            if(this.fhTools[toolName]._devTool) {
                request.page = 'dynamic';
                request.query = `tool=${toolName}`;
            }
            chrome.runtime.sendMessage(request);
            !!this.fhTools[toolName].noPage && setTimeout(window.close,200);
        },

        openOptionsPage: () => {
            chrome.runtime.openOptionsPage();
        },

        openUrl: function (event) {
            event.preventDefault();
            // 获取后台页面，返回window对象
            chrome.tabs.create({url: event.currentTarget.href});
            return false;
        }
    }
});
