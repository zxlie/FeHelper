import Awesome from '../background/awesome.js'
import MSG_TYPE from '../static/js/common.js';
import Settings from './settings.js';
import Statistics from '../background/statistics.js';

// 工具分类定义
const TOOL_CATEGORIES = [
    { key: 'dev', name: '开发工具类', tools: ['json-format', 'json-diff', 'code-beautify', 'code-compress', 'postman', 'websocket', 'regexp','page-timing'] },
    { key: 'encode', name: '编解码转换类', tools: ['en-decode', 'trans-radix', 'timestamp', 'trans-color'] },
    { key: 'image', name: '图像处理类', tools: ['qr-code', 'image-base64', 'svg-converter', 'chart-maker', 'poster-maker' ,'screenshot', 'color-picker'] },
    { key: 'productivity', name: '效率工具类', tools: ['aiagent', 'sticky-notes', 'html2markdown', 'page-monkey'] },
    { key: 'calculator', name: '计算工具类', tools: ['crontab', 'loan-rate', 'password', 'uuid-gen'] },
    { key: 'other', name: '其他工具', tools: [] }
];

// Vue实例
new Vue({
    el: '#marketContainer',
    data: {
        manifest: { version: '0.0.0' },
        searchKey: '',
        currentCategory: '',
        sortType: 'default',
        viewMode: 'list', // 默认网格视图
        categories: TOOL_CATEGORIES,
        favorites: new Set(),
        recentUsed: [],
        loading: true,
        originalTools: {}, // 保存原始工具数据
        currentView: 'all', // 当前视图类型（all/installed/favorites/recent）
        activeTools: {}, // 当前显示的工具列表
        installedCount: 0, // 已安装工具数量
        
        // 版本相关
        latestVersion: '', // 最新版本号
        needUpdate: false, // 是否需要更新
        
        // 设置相关
        showSettingsModal: false,
        defaultKey: 'Alt+Shift+J', // 默认快捷键
        countDown: 0, // 夜间模式倒计时
        selectedOpts: [], // 选中的选项（已支持FORBID_STATISTICS）
        menuDownloadCrx: false, // 菜单-插件下载
        menuFeHelperSeting: false, // 菜单-FeHelper设置
        isFirefox: false, // 是否Firefox浏览器

        // 打赏相关
        showDonateModal: false,
        donate: {
            text: '感谢你对FeHelper的认可和支持！',
            image: './donate.jpeg'
        },

        // 确认对话框
        confirmDialog: {
            show: false,
            title: '操作确认',
            message: '',
            callback: null,
            data: null
        },

        // 工具排序相关
        sortableTools: [], // 可排序的工具列表
        draggedIndex: -1, // 拖拽的工具索引

        recentCount: 0,
        versionChecked: false,
        
        // 推荐卡片配置，后续可从服务端获取
        recommendationCards: [
            {
                toolKey: 'qr-code',
                icon: '📱',
                title: '二维码工具',
                desc: '快速生成和识别二维码，支持自定义样式',
                tag: '必装',
                tagClass: 'must-tag',
                isAd: false
            },
            {
                toolKey: 'chart-maker',
                icon: '📊',
                title: '图表制作工具',
                desc: '支持多种数据可视化图表，快速生成专业图表',
                tag: '最新',
                tagClass: 'new-tag',
                isAd: false
            },
            {
                toolKey: 'mock-data',
                icon: '🎲',
                title: '数据Mock工具',
                desc: '快速生成各种测试数据，支持快速模板一键生成',
                tag: '推荐',
                tagClass: 'recommend-tag',
                isAd: false
            },
            {
                icon: '🔔',
                title: '推广位',
                desc: '广告位招租，欢迎流量主联系，开放合作，流量主请到github联系',
                tag: '广告',
                tagClass: 'ad-tag',
                isAd: true,
                url: 'https://github.com/zxlie/FeHelper'
            }
        ],
    },

    async created() {
        // 1. 读取URL中的query参数并赋值给searchKey
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('query');
            if (query) {
                this.searchKey = query;
            }
        } catch (e) {
            // 忽略异常
        }
        // 2. 初始化数据
        await this.initData();
        this.recentCount = (await Statistics.getRecentUsedTools(10)).length;
        // 初始化后更新已安装工具数量
        this.updateInstalledCount();
        // 恢复用户的视图模式设置
        this.loadViewMode();
        // 加载设置项
        this.loadSettings();
        // 检查浏览器类型
        this.checkBrowserType();
        // 检查版本更新
        this.checkVersionUpdate();
        
        // 加载远程推荐卡片配置
        this.loadRemoteRecommendationCards();
        
        // 检查URL中是否有donate_from参数
        this.checkDonateParam();

        // 页面加载时自动获取并注入options页面的补丁
        this.loadPatchHotfix();

        // 埋点：自动触发options
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'statistics-tool-usage',
            params: {
                tool_name: 'options'
            }
        });
    },

    computed: {
        filteredTools() {
            if (this.loading) {
                return [];
            }

            // 获取当前工具列表
            let result = Object.values(this.activeTools).map(tool => ({
                ...tool,
                favorite: this.favorites.has(tool.key)
            }));

            // 搜索过滤
            if (this.searchKey) {
                const key = this.searchKey.toLowerCase();
                result = result.filter(tool => 
                    (tool.name || '').toLowerCase().includes(key) || 
                    (tool.tips || '').toLowerCase().includes(key)
                );
            }

            // 分类过滤，在所有视图下生效
            if (this.currentCategory) {
                const category = TOOL_CATEGORIES.find(c => c.key === this.currentCategory);
                const categoryTools = category ? category.tools : [];
                result = result.filter(tool => categoryTools.includes(tool.key));
            }

            // 排序
            switch (this.sortType) {
                case 'newest':
                    result.sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0));
                    break;
                case 'hot':
                    result.sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0));
                    break;
                default:
                    const allTools = TOOL_CATEGORIES.reduce((acc, category) => {
                        acc.push(...category.tools);
                        return acc;
                    }, []);
                    
                    result.sort((a, b) => {
                        const indexA = allTools.indexOf(a.key);
                        const indexB = allTools.indexOf(b.key);
                        
                        // 如果工具不在任何类别中，放到最后
                        if (indexA === -1 && indexB === -1) {
                            return a.key.localeCompare(b.key); // 字母顺序排序
                        }
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        
                        return indexA - indexB;
                    });
            }

            return result;
        }
    },

    methods: {
        async initData() {
            try {
                this.loading = true;

                // 获取manifest信息
                const manifest = await chrome.runtime.getManifest();
                this.manifest = manifest;

                // 从 Awesome.getAllTools 获取工具列表
                const tools = await Awesome.getAllTools();
                
                // 获取收藏数据
                const favorites = await this.getFavoritesData();
                this.favorites = new Set(favorites);

                // 获取最近使用数据
                const recentUsed = await this.getRecentUsedData();
                this.recentUsed = recentUsed;
                this.recentCount = recentUsed.length;

                // 获取已安装工具列表
                const installedTools = await Awesome.getInstalledTools();

                // 处理工具数据
                const processedTools = {};
                Object.entries(tools).forEach(([key, tool]) => {
                    // 检查工具是否已安装
                    const isInstalled = installedTools.hasOwnProperty(key);
                    // 检查是否有右键菜单
                    const hasMenu = tool.menu || false;
                    
                    processedTools[key] = {
                        ...tool,
                        key, // 添加key到工具对象中
                        updateTime: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
                        installed: isInstalled, // 使用实时安装状态
                        inContextMenu: hasMenu, // 使用实时菜单状态
                        systemInstalled: tool.systemInstalled || false, // 是否系统预装
                        favorite: this.favorites.has(key)
                    };
                });

                this.originalTools = processedTools;
                
                // 初始化activeTools为所有工具
                this.activeTools = { ...processedTools };
                
                // 更新"其他工具"类别
                this.updateOtherCategory(Object.keys(processedTools));

                // 默认选中"全部分类"
                this.currentCategory = '';
            } catch (error) {
                console.error('初始化数据失败:', error);
            } finally {
                this.loading = false;
            }
        },
        
        // 更新"其他工具"类别，将未分类的工具添加到此类别
        updateOtherCategory(allToolKeys) {
            // 获取所有已分类的工具
            const categorizedTools = new Set();
            TOOL_CATEGORIES.forEach(category => {
                if (category.key !== 'other') {
                    category.tools.forEach(tool => categorizedTools.add(tool));
                }
            });
            
            // 找出未分类的工具
            const uncategorizedTools = allToolKeys.filter(key => !categorizedTools.has(key));
            
            // 更新"其他工具"类别
            const otherCategory = TOOL_CATEGORIES.find(category => category.key === 'other');
            if (otherCategory) {
                otherCategory.tools = uncategorizedTools;
            }
        },

        // 检查版本更新
        async checkVersionUpdate() {
            try {
                // 获取已安装的版本号
                const currentVersion = this.manifest.version;
                
                // 尝试从本地存储获取最新版本信息，避免频繁请求
                const cachedData = await new Promise(resolve => {
                    chrome.storage.local.get('fehelper_latest_version_data', data => {
                        resolve(data.fehelper_latest_version_data || null);
                    });
                });
        
                // 检查是否需要重新获取版本信息：
                // 1. 缓存不存在
                // 2. 缓存已过期（超过24小时）
                // 3. 缓存的当前版本与实际版本不同（说明插件已更新）
                const now = Date.now();
                const cacheExpired = !cachedData || !cachedData.timestamp || (now - cachedData.timestamp > 24 * 60 * 60 * 1000);
                const versionChanged = cachedData && cachedData.currentVersion !== currentVersion;
                
                this.versionChecked = !(cacheExpired || versionChanged);
                if (!this.versionChecked) {
                    try {
                        // 使用shields.io的JSON API获取最新版本号
                        const response = await fetch('https://img.shields.io/chrome-web-store/v/pkgccpejnmalmdinmhkkfafefagiiiad.json');
                        if (!response.ok) {
                            throw new Error(`HTTP错误：${response.status}`);
                        }
                        this.versionChecked = true;
                        
                        const data = await response.json();
                        // 提取版本号 - shields.io返回的数据中包含版本信息
                        let latestVersion = '';
                        if (data && data.value) {
                            // 去掉版本号前的'v'字符（如果有）
                            latestVersion = data.value.replace(/^v/, '');
                        }
                        
                        // 比较版本号
                        const needUpdate = this.compareVersions(currentVersion, latestVersion) < 0;
                        
                        // 保存到本地存储中
                        await chrome.storage.local.set({
                            'fehelper_latest_version_data': {
                                timestamp: now,
                                currentVersion, // 保存当前检查时的版本号
                                latestVersion,
                                needUpdate
                            }
                        });
                        
                        this.latestVersion = latestVersion;
                        this.needUpdate = needUpdate;
                    } catch (fetchError) {
                        // 获取失败时不显示更新按钮
                        this.needUpdate = false;
                        
                        // 如果是版本变更导致的重新检查，但获取失败，则使用缓存数据
                        if (versionChanged && cachedData) {
                            this.latestVersion = cachedData.latestVersion || '';
                            // 比较新的currentVersion和缓存的latestVersion
                            this.needUpdate = this.compareVersions(currentVersion, cachedData.latestVersion) < 0;
                        }
                    }
                } else {
                    // 使用缓存数据
                    this.latestVersion = cachedData.latestVersion || '';
                    this.needUpdate = cachedData.needUpdate || false;
                }
            } catch (error) {
                this.needUpdate = false; // 出错时不显示更新提示
            }
        },
        
        // 比较版本号：如果v1 < v2返回-1，v1 = v2返回0，v1 > v2返回1
        compareVersions(v1, v2) {
            // 将版本号拆分为数字数组
            const v1Parts = v1.split('.').map(Number);
            const v2Parts = v2.split('.').map(Number);
            
            // 计算两个版本号中较长的长度
            const maxLength = Math.max(v1Parts.length, v2Parts.length);
            
            // 比较每一部分
            for (let i = 0; i < maxLength; i++) {
                // 获取当前部分，如果不存在则视为0
                const part1 = v1Parts[i] || 0;
                const part2 = v2Parts[i] || 0;
                
                // 比较当前部分
                if (part1 < part2) return -1;
                if (part1 > part2) return 1;
            }
            
            // 所有部分都相等
            return 0;
        },
        
        // 打开Chrome商店页面
        openStorePage() {
            try {
                // 使用Chrome Extension API请求检查更新
                // Manifest V3中requestUpdateCheck返回Promise，结果是一个对象而不是数组
                chrome.runtime.requestUpdateCheck().then(result => {
                    // 正确获取status和details，它们是result对象的属性
                    this.handleUpdateStatus(result.status, result.details);
                }).catch(error => {
                    this.handleUpdateError(error);
                });
            } catch (error) {
                this.handleUpdateError(error);
            }
        },

        // 处理更新状态
        handleUpdateStatus(status, details) {
            if (status === 'update_available') {
                // 显示更新通知
                this.showNotification({
                    title: 'FeHelper 更新',
                    message: '已发现新版本，正在更新...'
                });
                
                // 重新加载扩展以应用更新
                setTimeout(() => {
                    chrome.runtime.reload();
                }, 1000);
            } else if (status === 'no_update') {
                // 如果没有可用更新，但用户点击了更新按钮
                this.showNotification({
                    title: 'FeHelper 更新',
                    message: '您的FeHelper已经是最新版本。'
                });
            } else {
                // 其他情况，如更新检查失败等
                // 备选方案：跳转到官方网站
                chrome.tabs.create({ 
                    url: 'https://fehelper.com/'
                });
                
                this.showNotification({
                    title: 'FeHelper 更新',
                    message: '自动更新失败，请访问FeHelper官网手动获取最新版本。'
                });
            }
        },

        // 处理更新错误
        handleUpdateError(error) {
            // 出错时跳转到官方网站
            chrome.tabs.create({ 
                url: 'https://fehelper.com/'
            });
            
            this.showNotification({
                title: 'FeHelper 更新错误',
                message: '更新过程中出现错误，请手动检查更新。'
            });
        },

        // 显示通知的统一方法
        showNotification(options) {
            try {
                // 定义通知ID，方便后续关闭
                const notificationId = 'fehelper-update-notification';
                const simpleNotificationId = 'fehelper-simple-notification';

                // 直接尝试创建通知，不检查权限
                // Chrome扩展在manifest中已声明notifications权限，应该可以直接使用
                const notificationOptions = {
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('static/img/fe-48.png'),
                    title: options.title || 'FeHelper',
                    message: options.message || '',
                    priority: 2,
                    requireInteraction: false, // 改为false，因为我们会手动关闭
                    silent: false // 播放音效
                };
                
                // 首先尝试直接创建通知
                chrome.notifications.create(notificationId, notificationOptions, (createdId) => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        // 通知创建失败，尝试使用alert作为备选方案
                        alert(`${options.title}: ${options.message}`);
                        
                        // 再尝试使用不同的选项创建通知
                        const simpleOptions = {
                            type: 'basic',
                            iconUrl: chrome.runtime.getURL('static/img/fe-48.png'),
                            title: options.title || 'FeHelper',
                            message: options.message || ''
                        };
                        
                        // 使用简化选项再次尝试
                        chrome.notifications.create(simpleNotificationId, simpleOptions, (simpleId) => {
                            if (chrome.runtime.lastError) {
                                console.error('简化通知创建也失败:', chrome.runtime.lastError);
                            } else {
                                // 3秒后自动关闭简化通知
                                setTimeout(() => {
                                    chrome.notifications.clear(simpleId);
                                }, 3000);
                            }
                        });
                    } else {
                        // 3秒后自动关闭通知
                        setTimeout(() => {
                            chrome.notifications.clear(createdId);
                        }, 3000);
                    }
                });
                
                // 同时使用内置UI显示消息
                this.showInPageNotification(options);
            } catch (error) {
                // 降级为alert
                alert(`${options.title}: ${options.message}`);
            }
        },

        // 在页面内显示通知消息
        showInPageNotification(options) {
            try {
                // 确保 options 是一个对象
                if (!options || typeof options !== 'object') {
                    options = { message: String(options || '') };
                }
                // 创建一个通知元素
                const notificationEl = document.createElement('div');
                notificationEl.className = 'in-page-notification';
                const title = (options && options.title) ? String(options.title) : 'FeHelper';
                const message = (options && options.message) ? String(options.message) : '';
                notificationEl.innerHTML = `
                    <div class="notification-content">
                        <div class="notification-title">${title}</div>
                        <div class="notification-message">${message}</div>
                    </div>
                    <button class="notification-close">×</button>
                `;
                
                // 添加样式
                const style = document.createElement('style');
                style.textContent = `
                    .in-page-notification {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background-color: #4285f4;
                        color: white;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        min-width: 300px;
                        animation: slideIn 0.3s ease-out;
                    }
                    .notification-content {
                        flex: 1;
                    }
                    .notification-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .notification-message {
                        font-size: 14px;
                    }
                    .notification-close {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 20px;
                        cursor: pointer;
                        margin-left: 10px;
                        padding: 0 5px;
                    }
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                
                // 添加到页面
                document.head.appendChild(style);
                document.body.appendChild(notificationEl);
                
                // 点击关闭按钮移除通知
                const closeBtn = notificationEl.querySelector('.notification-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        notificationEl.style.animation = 'slideOut 0.3s ease-out forwards';
                        notificationEl.addEventListener('animationend', () => {
                            notificationEl.remove();
                        });
                    });
                }
                
                // 3秒后自动移除（从5秒改为3秒）
                setTimeout(() => {
                    notificationEl.style.animation = 'slideOut 0.3s ease-out forwards';
                    notificationEl.addEventListener('animationend', () => {
                        notificationEl.remove();
                    });
                }, 3000);
            } catch (error) {
                console.error('创建页内通知出错:', error);
            }
        },

        async getFavoritesData() {
            return new Promise((resolve) => {
                chrome.storage.local.get('favorites', (result) => {
                    resolve(result.favorites || []);
                });
            });
        },

        async getRecentUsedData() {
            // 直接从Statistics模块获取最近使用的工具
            return await Statistics.getRecentUsedTools(10);
        },

        async saveFavorites() {
            try {
                await chrome.storage.local.set({
                    favorites: Array.from(this.favorites)
                });
                // 更新工具的收藏状态
                Object.keys(this.originalTools).forEach(key => {
                    this.originalTools[key].favorite = this.favorites.has(key);
                });
            } catch (error) {
                console.error('保存收藏失败:', error);
            }
        },

        handleSearch() {
            // 搜索时不重置视图类型，允许在已过滤的结果中搜索
        },

        handleCategoryChange(category) {
            // 切换到全部工具视图
            if (this.currentView !== 'all') {
                this.currentView = 'all';
                this.updateActiveTools('all');
            }
            this.currentCategory = category;
            this.searchKey = '';
            // 确保工具显示正确
            this.activeTools = { ...this.originalTools };
        },

        handleSort() {
            // 排序逻辑已在computed中实现
        },

        getCategoryCount(categoryKey) {
            const category = TOOL_CATEGORIES.find(c => c.key === categoryKey);
            const categoryTools = category ? category.tools : [];
            return categoryTools.length;
        },

        async getInstalledCount() {
            try {
                // 使用Awesome.getInstalledTools实时获取已安装工具数量
                const installedTools = await Awesome.getInstalledTools();
                return Object.keys(installedTools).length;
            } catch (error) {
                // 回退到本地数据
                return Object.values(this.originalTools).filter(tool => 
                    tool.installed || tool.systemInstalled || false
                ).length;
            }
        },

        getFavoritesCount() {
            return this.favorites.size;
        },

        getToolCategory(toolKey) {
            for (const category of TOOL_CATEGORIES) {
                if (category.tools.includes(toolKey)) {
                    return category.key;
                }
            }
            return 'other';
        },

        async showMyInstalled() {
            this.currentView = 'installed';
            this.currentCategory = '';
            this.searchKey = '';
            await this.updateActiveTools('installed');
            // 更新已安装工具数量
            await this.updateInstalledCount();
        },

        showMyFavorites() {
            this.currentView = 'favorites';
            this.currentCategory = '';
            this.searchKey = '';
            this.updateActiveTools('favorites');
        },

        // 重置工具列表到原始状态
        resetTools() {
            this.currentView = 'all';
        },

        // 安装工具
        async installTool(toolKey) {
            try {
                // 查找可能存在的按钮元素
                const btnElement = document.querySelector(`button[data-tool="${toolKey}"]`);
                let elProgress = null;
                
                // 如果是通过按钮点击调用的，获取进度条元素
                if (btnElement) {
                    if (btnElement.getAttribute('data-undergoing') === '1') {
                        return false;
                    }
                    btnElement.setAttribute('data-undergoing', '1');
                    elProgress = btnElement.querySelector('span.x-progress');
                }
                
                // 显示安装进度
                let pt = 1;
                await Awesome.install(toolKey);
                
                // 只有当进度条元素存在时才更新文本内容
                if (elProgress) {
                    elProgress.textContent = `(${pt}%)`;
                    let ptInterval = setInterval(() => {
                        elProgress.textContent = `(${pt}%)`;
                        pt += Math.floor(Math.random() * 20);
                        if(pt > 100) {
                            clearInterval(ptInterval);
                            elProgress.textContent = ``;
                            
                            // 在进度条完成后显示安装成功的通知
                            this.showInPageNotification({
                                message: `${this.originalTools[toolKey].name} 安装成功！`,
                                type: 'success',
                                duration: 3000
                            });
                        }
                    }, 100);
                } else {
                    // 如果没有进度条元素，直接显示通知
                    this.showInPageNotification({
                        message: `${this.originalTools[toolKey].name} 安装成功！`,
                        type: 'success',
                        duration: 3000
                    });
                }
                
                // 更新原始数据和当前活动数据
                this.originalTools[toolKey].installed = true;
                if (this.activeTools[toolKey]) {
                    this.activeTools[toolKey].installed = true;
                }
                
                // 更新已安装工具数量
                this.updateInstalledCount();
                
                // 如果按钮存在，更新其状态
                if (btnElement) {
                    btnElement.setAttribute('data-undergoing', '0');
                }
                
                // 发送消息通知后台更新
                chrome.runtime.sendMessage({
                    type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                    toolName: toolKey,
                    action: 'install',
                    showTips: true
                });
                
            } catch (error) {
                // 显示安装失败的通知
                this.showInPageNotification({
                    message: `安装失败：${error.message || '未知错误'}`,
                    type: 'error',
                    duration: 5000
                });
            }
        },

        // 卸载工具
        async uninstallTool(toolKey) {
            try {
                // 使用自定义确认对话框而非浏览器原生的confirm
                this.showConfirm({
                    title: '卸载确认',
                    message: `确定要卸载"${this.originalTools[toolKey].name}"工具吗？`,
                    callback: async (key) => {
                        try {
                            // 先调用Awesome.offLoad卸载工具（确保存储数据先被删除）
                            await Awesome.offLoad(key);
                            
                            // 再发送消息给background更新browser action
                            await chrome.runtime.sendMessage({
                                type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                                toolName: key,
                                action: 'offload',
                                showTips: true
                            });
                            
                            // 更新原始数据和当前活动数据
                            this.originalTools[key].installed = false;
                            this.originalTools[key].inContextMenu = false;
                            
                            if (this.activeTools[key]) {
                                this.activeTools[key].installed = false;
                                this.activeTools[key].inContextMenu = false;
                            }
                            
                            // 更新已安装工具数量
                            this.updateInstalledCount();
                            
                            // 显示卸载成功的通知
                            this.showInPageNotification({
                                message: `${this.originalTools[key].name} 已成功卸载！`,
                                type: 'success',
                                duration: 3000
                            });
                        } catch (error) {
                            // 显示卸载失败的通知
                            this.showInPageNotification({
                                message: `卸载失败：${error.message || '未知错误'}`,
                                type: 'error',
                                duration: 5000
                            });
                        }
                    },
                    data: toolKey
                });
            } catch (error) {
                console.error('准备卸载过程中出错:', error);
            }
        },

        // 切换右键菜单
        async toggleContextMenu(toolKey) {
            try {
                const tool = this.originalTools[toolKey];
                const newState = !tool.inContextMenu;
                
                // 更新菜单状态
                await Awesome.menuMgr(toolKey, newState ? 'install' : 'offload');
                
                // 更新原始数据和当前活动数据
                tool.inContextMenu = newState;
                if (this.activeTools[toolKey]) {
                    this.activeTools[toolKey].inContextMenu = newState;
                }
                
                // 发送消息通知后台更新右键菜单
                chrome.runtime.sendMessage({
                    type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                    action: `menu-${newState ? 'install' : 'offload'}`,
                    showTips: false,
                    menuOnly: true
                });
            } catch (error) {
                console.error('切换右键菜单失败:', error);
            }
        },

        // 切换收藏状态
        async toggleFavorite(toolKey) {
            try {
                if (this.favorites.has(toolKey)) {
                    this.favorites.delete(toolKey);
                    // 更新原始数据和当前活动数据
                    this.originalTools[toolKey].favorite = false;
                    if (this.activeTools[toolKey]) {
                        this.activeTools[toolKey].favorite = false;
                    }
                } else {
                    this.favorites.add(toolKey);
                    // 更新原始数据和当前活动数据
                    this.originalTools[toolKey].favorite = true;
                    if (this.activeTools[toolKey]) {
                        this.activeTools[toolKey].favorite = true;
                    }
                }
                await this.saveFavorites();
                
                // 如果是在收藏视图，需要更新视图
                if (this.currentView === 'favorites') {
                    this.updateActiveTools('favorites');
                }
            } catch (error) {
                console.error('切换收藏状态失败:', error);
            }
        },

        async updateActiveTools(view) {
            if (this.loading || Object.keys(this.originalTools).length === 0) {
                return;
            }

            switch (view) {
                case 'installed':
                    // 使用Awesome.getInstalledTools实时获取已安装工具
                    try {
                        const installedTools = await Awesome.getInstalledTools();
                        // 合并installedTools与originalTools的数据
                        this.activeTools = Object.fromEntries(
                            Object.entries(this.originalTools).filter(([key]) => 
                                installedTools.hasOwnProperty(key)
                            )
                        );
                    } catch (error) {
                        // 回退到本地数据
                        this.activeTools = Object.fromEntries(
                            Object.entries(this.originalTools).filter(([_, tool]) => 
                                tool.installed || tool.systemInstalled || false
                            )
                        );
                    }
                    break;
                case 'favorites':
                    this.activeTools = Object.fromEntries(
                        Object.entries(this.originalTools).filter(([key]) => this.favorites.has(key))
                    );
                    break;
                case 'recent':
                    // 切换recent时，recentUsed已在showRecentUsed中实时拉取
                    this.activeTools = Object.fromEntries(
                        Object.entries(this.originalTools).filter(([key]) => this.recentUsed.includes(key))
                    );
                    break;
                case 'all':
                default:
                    this.activeTools = { ...this.originalTools };
                    // 分类过滤在computed属性中处理
                    break;
            }
        },

        // 新增更新已安装工具数量的方法
        async updateInstalledCount() {
            this.installedCount = await this.getInstalledCount();
        },

        // 加载用户保存的视图模式
        async loadViewMode() {
            try {
                const result = await new Promise(resolve => {
                    chrome.storage.local.get('fehelper_view_mode', result => {
                        resolve(result.fehelper_view_mode);
                    });
                });
                
                if (result) {
                    this.viewMode = result;
                }
            } catch (error) {
                console.error('加载视图模式失败:', error);
            }
        },

        // 保存用户的视图模式选择
        async saveViewMode(mode) {
            try {
                this.viewMode = mode;
                await chrome.storage.local.set({
                    'fehelper_view_mode': mode
                });
            } catch (error) {
                console.error('保存视图模式失败:', error);
            }
        },

        // 加载设置项
        async loadSettings() {
            try {
                Settings.getOptions(async (opts) => {
                    let selectedOpts = [];
                    Object.keys(opts).forEach(key => {
                        if(String(opts[key]) === 'true') {
                            selectedOpts.push(key);
                        }
                    });
                    this.selectedOpts = selectedOpts;
                    
                    // 同步localStorage设置，确保与其他工具兼容
                    localStorage.setItem('AUTO_DARK_MODE', opts.AUTO_DARK_MODE);
                    localStorage.setItem('ALWAYS_DARK_MODE', opts.ALWAYS_DARK_MODE);
                    
                    // 应用深色模式设置
                    this.applyDarkModeSettings(opts);
                    
                    // 加载右键菜单设置
                    this.menuDownloadCrx = await Awesome.menuMgr('download-crx', 'get') === '1';
                    this.menuFeHelperSeting = await Awesome.menuMgr('fehelper-setting', 'get') !== '0';
                    
                    // 获取快捷键
                    chrome.commands.getAll((commands) => {
                        for (let command of commands) {
                            if (command.name === '_execute_action') {
                                this.defaultKey = command.shortcut || 'Alt+Shift+J';
                                break;
                            }
                        }
                    });
                });
            } catch (error) {
                console.error('加载设置项失败:', error);
            }
        },
        
        // 检查浏览器类型
        checkBrowserType() {
            try {
                this.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            } catch (error) {
                this.isFirefox = false;
            }
        },

        // 应用深色模式设置
        applyDarkModeSettings(opts) {
            const body = document.body;
            const shouldEnableDarkMode = this.shouldEnableDarkMode(opts);
            
            // 同时设置localStorage和chrome.storage.local，确保与其他工具兼容
            localStorage.setItem('AUTO_DARK_MODE', opts.AUTO_DARK_MODE);
            localStorage.setItem('ALWAYS_DARK_MODE', opts.ALWAYS_DARK_MODE);
            
            if (shouldEnableDarkMode) {
                body.classList.add('dark-mode');
                // 设置html属性，方便其他工具检测
                document.documentElement.setAttribute('data-theme', 'dark');
                document.documentElement.setAttribute('dark-mode', 'on');
            } else {
                body.classList.remove('dark-mode');
                document.documentElement.setAttribute('data-theme', 'light');
                document.documentElement.setAttribute('dark-mode', 'off');
            }
        },

        // 判断是否应该启用深色模式
        shouldEnableDarkMode(opts) {
            // 如果始终开启深色模式，直接返回true
            if (opts.ALWAYS_DARK_MODE === true || opts.ALWAYS_DARK_MODE === 'true') {
                return true;
            }
            
            // 如果自动开启深色模式，检查时间
            if (opts.AUTO_DARK_MODE === true || opts.AUTO_DARK_MODE === 'true') {
                return this.isNightTime();
            }
            
            return false;
        },

        // 检查当前时间是否在夜间时段（19:00-06:00）
        isNightTime() {
            const now = new Date();
            const hour = now.getHours();
            
            // 19:00-23:59 或 00:00-05:59
            return hour >= 19 || hour < 6;
        },
        
        // 显示设置模态框
        async showSettings() {
            this.showSettingsModal = true;
            // 加载可排序的工具列表
            await this.loadSortableTools();
        },

        // 关闭设置模态框
        closeSettings() {
            this.showSettingsModal = false;
        },

        // 显示打赏模态框
        openDonateModal() {
            this.showDonateModal = true;
        },

        // 关闭打赏模态框
        closeDonateModal() {
            this.showDonateModal = false;
        },

        // 显示确认对话框
        showConfirm(options) {
            this.confirmDialog = {
                show: true,
                title: options.title || '操作确认',
                message: options.message || '确定要执行此操作吗？',
                callback: options.callback || null,
                data: options.data || null
            };
        },

        // 确认操作
        confirmAction() {
            if (this.confirmDialog.callback) {
                this.confirmDialog.callback(this.confirmDialog.data);
            }
            this.confirmDialog.show = false;
        },

        // 取消确认
        cancelConfirm() {
            this.confirmDialog.show = false;
        },

        // 保存设置
        async saveSettings() {
            try {
                // 构建设置对象
                let opts = {};
                [
                    'OPT_ITEM_CONTEXTMENUS',
                    'FORBID_OPEN_IN_NEW_TAB',
                    'CONTENT_SCRIPT_ALLOW_ALL_FRAMES',
                    'JSON_PAGE_FORMAT',
                    'AUTO_DARK_MODE',
                    'ALWAYS_DARK_MODE',
                    'FORBID_STATISTICS' // 新增，确保保存
                ].forEach(key => {
                    opts[key] = this.selectedOpts.includes(key).toString();
                });
                
                // 先保存工具排序（如果用户有修改）
                if (this.sortableTools && this.sortableTools.length > 0) {
                    try {
                        const toolOrder = this.sortableTools.map(tool => tool.key);
                        await chrome.storage.local.set({
                            tool_custom_order: JSON.stringify(toolOrder)
                        });
                    } catch (sortError) {
                        console.warn('保存工具排序时出现错误:', sortError);
                        // 工具排序保存失败不应该阻止设置保存
                    }
                }
                
                // 保存设置 - 直接传递对象，settings.js已增加对对象类型的支持
                Settings.setOptions(opts, async () => {
                    try {
                        // 处理右键菜单
                        const crxAction = this.menuDownloadCrx ? 'install' : 'offload';
                        const settingAction = this.menuFeHelperSeting ? 'install' : 'offload';
                        
                        await Promise.all([
                            Awesome.menuMgr('download-crx', crxAction),
                            Awesome.menuMgr('fehelper-setting', settingAction)
                        ]);
                        
                        // 通知后台更新右键菜单
                        chrome.runtime.sendMessage({
                            type: MSG_TYPE.DYNAMIC_TOOL_INSTALL_OR_OFFLOAD,
                            action: 'menu-change',
                            menuOnly: true
                        });
                        
                        // 应用深色模式设置
                        this.applyDarkModeSettings(opts);
                        
                        // 关闭弹窗
                        this.closeSettings();
                        
                        // 显示提示
                        this.showNotification({
                            title: 'FeHelper 设置',
                            message: '设置和工具排序已保存！'
                        });
                    } catch (innerError) {
                        this.showNotification({
                            title: 'FeHelper 设置错误',
                            message: '保存菜单设置失败: ' + innerError.message
                        });
                    }
                });
            } catch (error) {
                this.showNotification({
                    title: 'FeHelper 设置错误',
                    message: '保存设置失败: ' + error.message
                });
            }
        },
        
        // 设置快捷键
        setShortcuts() {
            chrome.tabs.create({
                url: 'chrome://extensions/shortcuts'
            });
        },
        
        // 体验夜间模式
        turnLight(event) {
            event.preventDefault();
            
            // 获取body元素
            const body = document.body;
            
            // 切换夜间模式
            if (body.classList.contains('dark-mode')) {
                body.classList.remove('dark-mode');
                document.documentElement.setAttribute('data-theme', 'light');
                document.documentElement.setAttribute('dark-mode', 'off');
            } else {
                body.classList.add('dark-mode');
                document.documentElement.setAttribute('data-theme', 'dark');
                document.documentElement.setAttribute('dark-mode', 'on');
                
                // 设置倒计时
                this.countDown = 10;
                
                // 启动倒计时
                const timer = setInterval(() => {
                    this.countDown--;
                    if (this.countDown <= 0) {
                        clearInterval(timer);
                        body.classList.remove('dark-mode');
                        document.documentElement.setAttribute('data-theme', 'light');
                        document.documentElement.setAttribute('dark-mode', 'off');
                    }
                }, 1000);
            }
        },


        // 检查URL中的donate_from参数并显示打赏弹窗
        checkDonateParam() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const donateFrom = urlParams.get('donate_from');
                
                if (donateFrom) {
                    // 记录打赏来源
                    chrome.storage.local.set({
                        'fehelper_donate_from': donateFrom,
                        'fehelper_donate_time': Date.now()
                    });
                    
                    // 等待工具数据加载完成
                    this.$nextTick(() => {
                        // 在所有工具中查找匹配项
                        let matchedTool = null;
                        
                        // 首先尝试直接匹配工具key
                        if (this.originalTools && this.originalTools[donateFrom]) {
                            matchedTool = this.originalTools[donateFrom];
                        } else if (this.originalTools) {
                            // 如果没有直接匹配，尝试在所有工具中查找部分匹配
                            for (const [key, tool] of Object.entries(this.originalTools)) {
                                if (key.includes(donateFrom) || donateFrom.includes(key) ||
                                    (tool.name && tool.name.includes(donateFrom)) || 
                                    (donateFrom && donateFrom.includes(tool.name))) {
                                    matchedTool = tool;
                                    break;
                                }
                            }
                        }
                        
                        // 更新打赏文案
                        if (matchedTool) {
                            this.donate.text = `看起来【${matchedTool.name}】工具帮助到了你，感谢你的认可！`;
                        } else {
                            // 没有匹配到特定工具，使用通用文案
                            this.donate.text = `感谢你对FeHelper的认可和支持！`;
                        }
                        
                        // 显示打赏弹窗
                        this.showDonateModal = true;
                    });

                    // 埋点：自动触发options
                    chrome.runtime.sendMessage({
                        type: 'fh-dynamic-any-thing',
                        thing: 'statistics-tool-usage',
                        params: {
                            tool_name: 'donate'
                        }
                    });
                }
            } catch (error) {
                console.error('处理打赏参数时出错:', error);
            }
        },

        // 补充 getRecentCount，保证模板调用不报错，且数据源唯一
        async getRecentCount() {
            const recent = await Statistics.getRecentUsedTools(10);
            return recent.length;
        },

        async showRecentUsed() {
            this.currentView = 'recent';
            this.currentCategory = '';
            this.searchKey = '';
            // 重新获取最近使用的工具数据
            this.recentUsed = await Statistics.getRecentUsedTools(10);
            this.recentCount = this.recentUsed.length;
            // activeTools会通过currentView的watcher自动更新
        },

        handleRecommendClick(card) {
            if (card.isAd && card.url) {
                window.open(card.url, '_blank');
            } else if (card.toolKey) {
                this.installTool(card.toolKey);
            }
        },

        // 加载远程推荐卡片配置
        async loadRemoteRecommendationCards() {
            try {
                // 通过background代理请求，解决CORS问题
                const result = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'fh-dynamic-any-thing',
                        thing: 'fetch-hotfix-json',
                    }, resolve);
                });
                if (!result || !result.success) {
                    throw new Error('获取远程配置失败: ' + (result && result.error ? result.error : '未知错误'));
                }
                // 获取脚本内容
                const scriptContent = result.content;
                // 解析脚本内容，提取GlobalRecommendationCards变量
                let remoteCards = null;
                try {
                    remoteCards = JSON.parse(scriptContent);
                } catch (parseError) {
                    console.error('解析远程推荐卡片配置失败:', parseError);
                }
                
                // 如果成功解析到配置，则更新本地配置
                if (remoteCards && Array.isArray(remoteCards) && remoteCards.length > 0) {
                    remoteCards.forEach((card, idx) => {
                        if (
                            card &&
                            card.toolKey &&
                            this.originalTools &&
                            !this.originalTools.hasOwnProperty(card.toolKey)
                        ) {
                            // toolKey 不存在于本地工具，跳过赋值，保留本地默认
                            return;
                        }
                        // 没有 toolKey 字段，或者 toolKey 存在于本地工具，直接覆盖
                        this.recommendationCards[idx] = card;
                    });
                    this.$forceUpdate();
                }
            } catch (error) {
                console.error('获取远程推荐卡片配置失败:', error);
            }
        },

        // 工具排序相关方法
        async loadSortableTools() {
            try {
                const installedTools = await Awesome.getInstalledTools();
                
                // 从存储中加载自定义排序
                const customOrder = await chrome.storage.local.get('tool_custom_order');
                const savedOrder = customOrder.tool_custom_order ? JSON.parse(customOrder.tool_custom_order) : null;
                
                // 转换为可排序的数组格式
                let toolsArray = Object.entries(installedTools).map(([key, tool]) => ({
                    key,
                    name: tool.name,
                    tips: tool.tips,
                    icon: tool.icon || (tool.menuConfig && tool.menuConfig[0] ? tool.menuConfig[0].icon : '🔧')
                }));
                
                // 如果有保存的自定义排序，按照该顺序排列
                if (savedOrder && Array.isArray(savedOrder)) {
                    const orderedTools = [];
                    const unorderedTools = [...toolsArray];
                    
                    // 按照保存的顺序添加工具
                    savedOrder.forEach(toolKey => {
                        const toolIndex = unorderedTools.findIndex(t => t.key === toolKey);
                        if (toolIndex !== -1) {
                            orderedTools.push(unorderedTools.splice(toolIndex, 1)[0]);
                        }
                    });
                    
                    // 添加新安装的工具（不在保存的顺序中的）
                    orderedTools.push(...unorderedTools);
                    toolsArray = orderedTools;
                }
                
                this.sortableTools = toolsArray;
            } catch (error) {
                console.error('加载可排序工具失败:', error);
            }
        },

        // 拖拽开始
        handleDragStart(event, index) {
            this.draggedIndex = index;
            event.target.classList.add('dragging');
            event.dataTransfer.setData('text/plain', index);
        },

        // 拖拽经过
        handleDragOver(event) {
            event.preventDefault();
            // 移除所有 drag-over 类
            document.querySelectorAll('.sortable-item').forEach(item => {
                item.classList.remove('drag-over');
            });
            // 添加到当前元素
            event.currentTarget.classList.add('drag-over');
        },

        // 放置
        handleDrop(event, dropIndex) {
            event.preventDefault();
            
            if (this.draggedIndex === -1 || this.draggedIndex === dropIndex) {
                return;
            }

            // 重新排列数组
            const draggedItem = this.sortableTools[this.draggedIndex];
            const newTools = [...this.sortableTools];
            
            // 移除被拖拽的项目
            newTools.splice(this.draggedIndex, 1);
            
            // 在新位置插入
            if (dropIndex > this.draggedIndex) {
                newTools.splice(dropIndex - 1, 0, draggedItem);
            } else {
                newTools.splice(dropIndex, 0, draggedItem);
            }
            
            this.sortableTools = newTools;
            
            // 清理样式
            this.cleanupDragStyles();
        },

        // 拖拽结束
        handleDragEnd(event) {
            this.cleanupDragStyles();
            this.draggedIndex = -1;
        },

        // 清理拖拽样式
        cleanupDragStyles() {
            document.querySelectorAll('.sortable-item').forEach(item => {
                item.classList.remove('dragging', 'drag-over');
            });
        },

        // 重置工具顺序为默认
        async resetToolOrder() {
            try {
                // 移除保存的自定义排序
                await chrome.storage.local.remove('tool_custom_order');
                
                // 重新加载工具列表（会使用默认顺序）
                await this.loadSortableTools();
                
                this.showInPageNotification({
                    message: '工具顺序已重置为默认排序',
                    type: 'success'
                });
            } catch (error) {
                console.error('重置工具顺序失败:', error);
                this.showInPageNotification({
                    message: '重置失败，请重试',
                    type: 'error'
                });
            }
        },

        // 保存工具排序
        async saveToolOrder() {
            try {
                const toolOrder = this.sortableTools.map(tool => tool.key);
                await chrome.storage.local.set({
                    tool_custom_order: JSON.stringify(toolOrder)
                });
                
                this.showInPageNotification({
                    message: '工具排序已保存！弹窗中的工具将按此顺序显示',
                    type: 'success'
                });
            } catch (error) {
                console.error('保存工具排序失败:', error);
                this.showInPageNotification({
                    message: '保存失败，请重试',
                    type: 'error'
                });
            }
        },

        async autoFixBugs() {
            this.showNotification({ 
                title: 'FeHelper 一键修复',
                message: '正在拉取修复补丁，请稍候...' 
            });
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fetch-fehelper-patchs'
            }, (resp) => {
                if (chrome.runtime.lastError) {
                    this.showNotification({ 
                        title: 'FeHelper 一键修复',
                        message: '补丁拉取失败：' + chrome.runtime.lastError.message 
                    });
                    return;
                }
                if (!resp || !resp.success) {
                    const errorMsg = resp && resp.error ? resp.error : '未知错误';
                    this.showNotification({ 
                        title: 'FeHelper 一键修复',
                        message: errorMsg
                    });
                    return;
                }
                this.showNotification({
                    title: 'FeHelper 一键修复',
                    message: '当前FeHelper插件中的已知Bug都已修复，你可以去验证了。',
                    duration: 5000
                });
                // 当前页面的bug立即更新
                this.loadPatchHotfix();
            });
        },

        loadPatchHotfix() {
            // 页面加载时自动获取并注入options页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'options'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js && typeof patch.js === 'string' && patch.js.length < 50000) {
                        try {
                            new Function(patch.js)();
                        } catch (e) {
                            console.error('options补丁JS执行失败', e);
                        }
                    }
                }
            });
        }
    },

    watch: {
        // 监听currentView变化
        currentView: {
            immediate: true,
            handler(newView) {
                this.updateActiveTools(newView);
            }
        },
        
        // 监听currentCategory变化
        currentCategory: {
            handler(newCategory) {
                // 保证在视图模式之外的分类切换也能正确显示
                if (this.currentView === 'all') {
                    this.activeTools = { ...this.originalTools };
                }
                // 重置搜索条件
                if (this.searchKey) {
                    this.searchKey = '';
                }
            }
        },
    },
});

// 添加滚动事件监听
window.addEventListener('scroll', () => {
    const header = document.querySelector('.market-header');
    const sidebar = document.querySelector('.market-sidebar');
    
    if (window.scrollY > 10) {
        header.classList.add('scrolled');
        sidebar && sidebar.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
        sidebar && sidebar.classList.remove('scrolled');
    }
});

// 页面加载后自动采集
if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
    Awesome.collectAndSendClientInfo();
} 



