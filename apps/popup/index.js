/**
 * FeHelper Popup Menu
 */

import Awesome from '../background/awesome.js'
import MSG_TYPE from '../static/js/common.js';

function triggerScreenshot() {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs || !tabs.length || !tabs[0].id) return;
        
        const tabId = tabs[0].id;
        
        // 先尝试直接发送消息给content script
        chrome.tabs.sendMessage(tabId, {
            type: 'fh-screenshot-start'
        }).then(response => {
            console.log('截图工具触发成功');
            window.close();
        }).catch(error => {
            console.log('无法直接触发截图工具，尝试使用noPage模式', error);
            // 如果发送消息失败，使用noPage模式
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'trigger-screenshot',
                tabId: tabId
            });
            window.close();
        });
    });
}

new Vue({
    el: '#pageContainer',
    data: {
        manifest: {},
        fhTools: {}
    },

    created: function () {
        // 获取当前ctx的version
        this.manifest = chrome.runtime.getManifest();

        Awesome.getInstalledTools().then(async (tools) => {
            // 获取用户自定义的工具排序
            const customOrder = await chrome.storage.local.get('tool_custom_order');
            const savedOrder = customOrder.tool_custom_order ? JSON.parse(customOrder.tool_custom_order) : null;
            
            // 如果有自定义排序，重新排列工具
            if (savedOrder && Array.isArray(savedOrder)) {
                const orderedTools = {};
                const unorderedTools = { ...tools };
                
                // 按照保存的顺序添加工具
                savedOrder.forEach(toolKey => {
                    if (unorderedTools[toolKey]) {
                        orderedTools[toolKey] = unorderedTools[toolKey];
                        delete unorderedTools[toolKey];
                    }
                });
                
                // 添加新安装的工具（不在保存的顺序中的）
                Object.assign(orderedTools, unorderedTools);
                
                this.fhTools = orderedTools;
            } else {
                this.fhTools = tools;
            }
        });

        // 自动开关灯
        DarkModeMgr.turnLightAuto();

        // 记录工具使用
        // 埋点：自动触发json-format-auto
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'statistics-tool-usage',
            params: {
                tool_name: 'popup'
            }
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

        // 查找截图按钮并绑定事件
        const screenshotButtons = Array.from(document.querySelectorAll('a[data-tool="screenshot"], button[data-tool="screenshot"]'));
        
        screenshotButtons.forEach(button => {
            // 移除原有的点击事件
            const oldClick = button.onclick;
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                triggerScreenshot();
                return false;
            };
        });

        // 页面加载后自动采集
        if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
            Awesome.collectAndSendClientInfo();
        }
    },

    methods: {

        runHelper: async function (toolName) {
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


