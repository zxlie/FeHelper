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
        fhTools: {},
        isLoading: true
    },

    computed: {
        // 计算已安装的工具数量
        installedToolsCount() {
            return Object.values(this.fhTools).filter(tool => tool.installed).length;
        }
    },

    created: function () {
        // 获取当前ctx的version
        this.manifest = chrome.runtime.getManifest();
        
        console.log(`[FeHelper-Popup] Popup页面开始加载 - ${new Date().toLocaleString()}`);
        console.log(`[FeHelper-Popup] 扩展版本: ${this.manifest.version}`);
        
        // 主动向后端发送消息，确保Service Worker被激活
        chrome.runtime.sendMessage({
            type: 'fh-popup-opened',
            timestamp: Date.now()
        }, (response) => {
            console.log(`[FeHelper-Popup] Service Worker激活成功 - ${new Date().toLocaleString()}`);
            console.log(`[FeHelper-Popup] 后台响应:`, response || '无响应');
        });
        
        // 立即开始加载工具列表，不阻塞页面渲染
        this.loadTools();

        // 页面加载时自动获取并注入popup页面的补丁
        this.loadPatchHotfix();
    },

    mounted: function () {
        console.log(`[FeHelper-Popup] Popup页面DOM渲染完成 - ${new Date().toLocaleString()}`);
        
        // 页面DOM渲染完成后，执行非关键操作
        this.$nextTick(() => {
            // 延迟执行非关键操作，避免阻塞UI渲染
            setTimeout(() => {
                console.log(`[FeHelper-Popup] 开始执行非关键初始化操作`);
                
                // 自动开关灯
                if (typeof DarkModeMgr !== 'undefined') {
                    DarkModeMgr.turnLightAuto();
                    console.log(`[FeHelper-Popup] 自动开关灯功能已初始化`);
                }

                // 记录工具使用（非关键操作）
                this.recordUsage();

                // 页面加载后自动采集（非关键操作）
                if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
                    Awesome.collectAndSendClientInfo();
                    console.log(`[FeHelper-Popup] 客户端信息采集已发送`);
                }
                
                console.log(`[FeHelper-Popup] 非关键初始化操作完成`);
            }, 50); // 延迟50ms执行，让UI先渲染
        });

        // 整个popup窗口支持上下键选择
        this.setupKeyboardNavigation();
        
        // 查找截图按钮并绑定事件
        this.setupScreenshotButton();
    },

    methods: {

        loadPatchHotfix() {
            // 页面加载时自动获取并注入options页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'popup'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js) {
                        try {
                            if (window.evalCore && window.evalCore.getEvalInstance) {
                                window.evalCore.getEvalInstance(window)(patch.js);
                            }
                        } catch (e) {
                            console.error('popup补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        getLayoutClasses() {
            const installedCount = this.installedToolsCount;
            const classes = [];
            
            if (installedCount <= 1) {
                classes.push('very-few-tools');
            } else if (installedCount <= 3) {
                classes.push('few-tools');
            }
            
            return classes;
        },

        async loadTools() {
            try {
                const tools = await Awesome.getInstalledTools();
                
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
                
                this.isLoading = false;
                
                // 根据工具数量添加相应的CSS类来优化显示
                this.$nextTick(() => {
                    this.updateLayoutClasses();
                });
            } catch (error) {
                console.error('加载工具列表失败:', error);
                this.isLoading = false;
                // 即使加载失败，也不应该让popup完全无法使用
                this.fhTools = {};
                
                // 加载失败时也需要更新布局类
                this.$nextTick(() => {
                    this.updateLayoutClasses();
                });
            }
        },

        recordUsage() {
            try {
                // 埋点：自动触发popup统计
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'statistics-tool-usage',
                    params: {
                        tool_name: 'popup'
                    }
                });
            } catch (error) {
                // 忽略统计错误，不影响主功能
                console.warn('统计记录失败:', error);
            }
        },

        setupKeyboardNavigation() {
            document.body.addEventListener('keydown', e => {
                let keyCode = e.keyCode || e.which;
                if (![38, 40, 13].includes(keyCode)) {
                    return false;
                }
                let ul = document.querySelector('#pageContainer ul');
                if (!ul) return false;
                
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
                        if (prev) prev.classList.add('x-hovered');
                        break;
                    case 40: // 方向键：↓
                        if (next) next.classList.add('x-hovered');
                        break;
                    case 13: // 回车键：选择
                        if (hovered) hovered.click();
                }
            }, false);
        },

        setupScreenshotButton() {
            // 查找截图按钮并绑定事件
            const screenshotButtons = Array.from(document.querySelectorAll('a[data-tool="screenshot"], button[data-tool="screenshot"]'));
            
            screenshotButtons.forEach(button => {
                // 移除原有的点击事件
                button.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerScreenshot();
                    return false;
                };
            });
        },

        runHelper: async function (toolName) {
            if (!toolName || !this.fhTools[toolName]) {
                console.error(`[FeHelper-Popup] 无效的工具名称或工具未安装: ${toolName}`);
                return;
            }
            
            const tool = this.fhTools[toolName];
            let request = {
                type: MSG_TYPE.OPEN_DYNAMIC_TOOL,
                page: toolName,
                noPage: !!tool.noPage
            };
            
            if(tool._devTool) {
                request.page = 'dynamic';
                request.query = `tool=${toolName}`;
            }
            
            try {
                await chrome.runtime.sendMessage(request);
                !!tool.noPage && setTimeout(window.close, 200);
            } catch (error) {
                console.error(`[FeHelper-Popup] 消息发送失败:`, error);
                
                // 备用方案：直接打开工具页面
                chrome.tabs.create({
                    url: `/${toolName}/index.html` + (request.query ? `?${request.query}` : ''),
                    active: true
                });
            }
        },

        openOptionsPage: () => {
            chrome.runtime.openOptionsPage();
        },

        openUrl: function (event) {
            event.preventDefault();
            // 获取后台页面，返回window对象
            chrome.tabs.create({url: event.currentTarget.href});
            return false;
        },

        updateLayoutClasses() {
            const container = document.getElementById('pageContainer');
            if (!container) return;
            
            const installedCount = this.installedToolsCount;
            
            // 移除所有布局相关的类
            container.classList.remove('few-tools', 'very-few-tools');
            
            // 根据工具数量添加相应的类
            if (installedCount <= 1) {
                container.classList.add('very-few-tools');
                console.log('Popup布局：应用very-few-tools类 (工具数量:', installedCount, ')');
            } else if (installedCount <= 3) {
                container.classList.add('few-tools');
                console.log('Popup布局：应用few-tools类 (工具数量:', installedCount, ')');
            } else {
                console.log('Popup布局：使用默认布局 (工具数量:', installedCount, ')');
            }
        }
    }
});


