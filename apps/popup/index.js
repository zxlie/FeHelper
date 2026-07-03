/**
 * FeHelper Popup Menu
 */

import Awesome from '../background/awesome.js'
import MSG_TYPE from '../static/js/common.js';

const POPUP_RECENT_TOOLS = 'popup_recent_tools';
const USER_USAGE_DATA_KEY = 'FH_USER_USAGE_DATA';
const FH_UI_MODE = 'FH_UI_MODE';
const FH_POPUP_UI_MODE = 'FH_POPUP_UI_MODE';
const MAC_OPTION_DIGITS = {
    '¡': 1,
    '™': 2,
    '£': 3,
    '¢': 4,
    '∞': 5,
    '§': 6,
    '¶': 7,
    '•': 8,
    'ª': 9
};

const TOOL_BADGES = {
    'json-format': '{}',
    'json-diff': 'DI',
    'qr-code': 'QR',
    'image-base64': '64',
    'en-decode': 'EN',
    'code-beautify': 'JS',
    'code-compress': 'ZIP',
    'aiagent': 'AI',
    'timestamp': 'TS',
    'password': 'PW',
    'uuid-gen': 'ID',
    'sticky-notes': 'NT',
    'html2markdown': 'MD',
    'postman': 'API',
    'websocket': 'WS',
    'regexp': 'RE',
    'trans-radix': '36',
    'trans-color': 'RGB',
    'crontab': 'CR',
    'loan-rate': '%',
    'devtools': 'FH',
    'page-monkey': 'PM',
    'screenshot': 'SC',
    'mock-data': 'MO',
    'color-picker': 'CP',
    'naotu': 'MAP',
    'grid-ruler': 'PX',
    'page-timing': 'WPO',
    'excel2json': 'XLS',
    'chart-maker': 'CH',
    'svg-converter': 'SVG',
    'poster-maker': 'PS',
    'datetime-calc': 'DT'
};

const TOOL_ALIASES = {
    'json-format': 'json formatter format pretty parse',
    'json-diff': 'json diff compare text 文本 比对 对比 diffcheck markdown log',
    'qr-code': 'qrcode qr decode encode',
    'image-base64': 'image base64',
    'en-decode': 'encode decode url unicode md5 gzip hex base64',
    'code-beautify': 'beautify format js css html sql xml',
    'code-compress': 'minify compress js css html',
    'timestamp': 'time date datetime unix',
    'password': 'password random',
    'uuid-gen': 'uuid nanoid snowflake id',
    'html2markdown': 'markdown md html',
    'postman': 'api request http',
    'websocket': 'ws socket',
    'regexp': 'regex regexp regular expression',
    'trans-radix': 'binary hex radix base conversion',
    'trans-color': 'color hex rgb',
    'crontab': 'cron schedule',
    'loan-rate': 'loan rate interest',
    'page-monkey': 'userscript hack script',
    'screenshot': 'screen capture shot',
    'mock-data': 'mock fake data',
    'color-picker': 'picker eyedropper color',
    'grid-ruler': 'ruler grid pixel',
    'page-timing': 'performance timing web vitals',
    'excel2json': 'excel csv json xls',
    'chart-maker': 'chart data visualization',
    'svg-converter': 'svg png jpg webp',
    'poster-maker': 'poster image design',
    'datetime-calc': 'datetime date time timezone'
};

function triggerScreenshot() {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs || !tabs.length || !tabs[0].id) return;

        const tabId = tabs[0].id;

        chrome.tabs.sendMessage(tabId, {
            type: 'fh-screenshot-start'
        }).then(() => {
            window.close();
        }).catch(() => {
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
        favorites: [],
        recentUsed: [],
        activeToolKey: '',
        searchKey: '',
        isLoading: true,
        uiMode: 'lite'
    },

    computed: {
        installedTools() {
            return Object.keys(this.fhTools)
                .filter(toolName => this.fhTools[toolName] && this.fhTools[toolName].installed)
                .map(toolName => this.toToolViewModel(toolName));
        },

        installedToolsCount() {
            return this.installedTools.length;
        },

        normalizedSearchKey() {
            return this.normalizeText(this.searchKey);
        },

        filteredTools() {
            const keyword = this.normalizedSearchKey;
            if (!keyword) return this.installedTools;

            return this.installedTools.filter(tool => {
                return tool.searchText.indexOf(keyword) !== -1;
            });
        },

        visibleGroups() {
            if (this.normalizedSearchKey) {
                return this.filterVisibleGroups([{
                    key: 'search',
                    title: '搜索结果',
                    countLabel: String(this.filteredTools.length),
                    tools: this.filteredTools
                }]);
            }

            if (this.uiMode === 'lite') {
                return this.filterVisibleGroups([{
                    key: 'lite',
                    title: '',
                    countLabel: '',
                    tools: this.installedTools
                }]);
            }

            const recentTools = this.toolsByKeys(this.recentUsed).slice(0, 4);
            const recentKeys = this.keyMap(recentTools);

            const favoriteTools = this.installedTools
                .filter(tool => tool.favorite && !recentKeys[tool.key])
                .slice(0, 5);
            const shownKeys = this.keyMap(recentTools.concat(favoriteTools));

            const allTools = this.installedTools.filter(tool => !shownKeys[tool.key]);

            return this.filterVisibleGroups([{
                key: 'recent',
                title: '最近使用',
                countLabel: recentTools.length ? String(recentTools.length) : '自动记录',
                tools: recentTools.length ? recentTools : this.installedTools.slice(0, 4)
            }, {
                key: 'favorite',
                title: '收藏',
                countLabel: String(favoriteTools.length),
                tools: favoriteTools
            }, {
                key: 'all',
                title: '全部工具',
                countLabel: String(allTools.length),
                tools: allTools
            }]);
        },

        flatVisibleTools() {
            return this.visibleGroups.reduce((tools, group) => {
                return tools.concat(group.tools || []);
            }, []);
        }
    },

    watch: {
        searchKey() {
            this.syncActiveTool();
        },

        fhTools() {
            this.syncActiveTool();
        },

        recentUsed() {
            this.syncActiveTool();
        },

        favorites() {
            this.syncActiveTool();
        }
    },

    created: function () {
        this.manifest = chrome.runtime.getManifest();

        this.loadTools();
    },

    mounted: function () {
        this.panelKeydownHandler = event => this.handlePanelKeydown(event);
        document.addEventListener('keydown', this.panelKeydownHandler, true);
        this.applyUiModeToDocument();

        this.$nextTick(() => {
            setTimeout(() => {
                if (typeof DarkModeMgr !== 'undefined' && DarkModeMgr.watchAutoDarkMode) {
                    DarkModeMgr.watchAutoDarkMode(enabled => {
                        document.documentElement.setAttribute('dark-mode', enabled ? 'on' : 'off');
                    }, {applyFilter: false});
                } else if (typeof DarkModeMgr !== 'undefined') {
                    DarkModeMgr.turnLightAuto();
                }

                if (this.$refs.searchInput) {
                    this.$refs.searchInput.focus();
                }

                this.deferNonCriticalStartup();
            }, 50);
        });
    },

    beforeDestroy: function () {
        if (this.panelKeydownHandler) {
            document.removeEventListener('keydown', this.panelKeydownHandler, true);
        }
    },

    methods: {
        deferTask(callback, timeout = 250) {
            const runner = () => {
                try {
                    callback();
                } catch (e) {}
            };
            if (window.requestIdleCallback) {
                window.requestIdleCallback(runner, {timeout});
                return;
            }
            setTimeout(runner, timeout);
        },

        deferNonCriticalStartup() {
            this.deferTask(() => this.notifyPopupOpened(), 120);
            this.deferTask(() => this.loadPatchHotfix(), 450);
            this.deferTask(() => this.recordUsage(), 650);
            this.deferTask(() => {
                if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
                    Awesome.collectAndSendClientInfo();
                }
            }, 900);
        },

        notifyPopupOpened() {
            try {
                const wakeup = chrome.runtime.sendMessage({ type: 'fh-popup-opened' });
                if (wakeup && typeof wakeup.catch === 'function') {
                    wakeup.catch(() => {});
                }
            } catch (e) {
            }
        },

        loadPatchHotfix() {
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
                    if (patch.js && typeof patch.js === 'string' && patch.js.length < 50000) {
                        try {
                            new Function(patch.js)();
                        } catch (e) {
                            console.error('popup补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        getLayoutClasses() {
            const classes = [];
            const installedCount = this.installedToolsCount;

            if (installedCount <= 1) {
                classes.push('very-few-tools');
            } else if (installedCount <= 3) {
                classes.push('few-tools');
            }
            if (this.normalizedSearchKey) {
                classes.push('is-searching');
            }
            classes.push(this.uiMode === 'omni' ? 'is-omni-mode' : 'is-lite-mode');

            return classes;
        },

        applyUiModeToDocument() {
            const isLiteMode = this.uiMode === 'lite';
            document.documentElement.classList.toggle('fh-popup-lite-mode', isLiteMode);
            document.body.classList.toggle('fh-popup-lite-mode', isLiteMode);
        },

        async loadTools() {
            try {
                const [tools, customOrder, meta] = await Promise.all([
                    Awesome.getInstalledTools(),
                    this.storageGet('tool_custom_order'),
                    this.storageGet(['favorites', POPUP_RECENT_TOOLS, USER_USAGE_DATA_KEY, FH_POPUP_UI_MODE, FH_UI_MODE])
                ]);
                const savedOrder = customOrder.tool_custom_order ? this.safeParseJson(customOrder.tool_custom_order, null) : null;

                if (savedOrder && Array.isArray(savedOrder)) {
                    const orderedTools = {};
                    const unorderedTools = Object.assign({}, tools);

                    savedOrder.forEach(toolKey => {
                        if (unorderedTools[toolKey]) {
                            orderedTools[toolKey] = unorderedTools[toolKey];
                            delete unorderedTools[toolKey];
                        }
                    });

                    Object.assign(orderedTools, unorderedTools);
                    this.fhTools = orderedTools;
                } else {
                    this.fhTools = tools;
                }

                this.applyPopupMeta(meta);
                this.isLoading = false;
                this.syncActiveTool();
            } catch (error) {
                console.error('加载工具列表失败:', error);
                this.fhTools = {};
                this.isLoading = false;
            }
        },

        async loadPopupMeta() {
            const meta = await this.storageGet(['favorites', POPUP_RECENT_TOOLS, USER_USAGE_DATA_KEY, FH_POPUP_UI_MODE, FH_UI_MODE]);
            this.applyPopupMeta(meta);
        },

        applyPopupMeta(meta) {
            meta = meta || {};
            const favorites = Array.isArray(meta.favorites) ? meta.favorites : [];
            const popupRecent = Array.isArray(meta[POPUP_RECENT_TOOLS]) ? meta[POPUP_RECENT_TOOLS] : [];
            const usageRecent = this.readRecentUsedTools(meta[USER_USAGE_DATA_KEY]);

            this.favorites = this.uniqueKeys(favorites);
            this.recentUsed = this.uniqueKeys(popupRecent.concat(usageRecent)).slice(0, 10);
            this.uiMode = String(meta[FH_POPUP_UI_MODE] || meta[FH_UI_MODE] || '').toLowerCase() === 'omni' ? 'omni' : 'lite';
            this.applyUiModeToDocument();
        },

        async setUiMode(mode) {
            const nextMode = mode === 'omni' ? 'omni' : 'lite';
            if (this.uiMode === nextMode) return;
            this.uiMode = nextMode;
            this.applyUiModeToDocument();
            await this.storageSet({
                [FH_POPUP_UI_MODE]: nextMode
            });
            this.syncActiveTool();
        },

        storageGet(keys) {
            return new Promise(resolve => {
                try {
                    const result = chrome.storage.local.get(keys, data => {
                        resolve(data || {});
                    });
                    if (result && typeof result.then === 'function') {
                        result.then(data => resolve(data || {})).catch(() => resolve({}));
                    }
                } catch (e) {
                    resolve({});
                }
            });
        },

        storageSet(items) {
            return new Promise(resolve => {
                try {
                    const result = chrome.storage.local.set(items, () => resolve());
                    if (result && typeof result.then === 'function') {
                        result.then(() => resolve()).catch(() => resolve());
                    }
                } catch (e) {
                    resolve();
                }
            });
        },

        safeParseJson(value, fallback) {
            try {
                return typeof value === 'string' ? JSON.parse(value) : value;
            } catch (e) {
                return fallback;
            }
        },

        readRecentUsedTools(rawUsageData) {
            const usageData = this.safeParseJson(rawUsageData, {});
            const dailyUsage = usageData && usageData.dailyUsage ? usageData.dailyUsage : {};
            const recentKeys = [];

            Object.keys(dailyUsage).sort().reverse().forEach(date => {
                const tools = dailyUsage[date] && dailyUsage[date].tools ? dailyUsage[date].tools : {};
                Object.keys(tools).forEach(toolKey => {
                    recentKeys.push(toolKey);
                });
            });

            return this.uniqueKeys(recentKeys);
        },

        uniqueKeys(keys) {
            const seen = {};
            return (keys || []).filter(key => {
                if (!key || seen[key]) return false;
                seen[key] = true;
                return true;
            });
        },

        keyMap(tools) {
            return (tools || []).reduce((map, tool) => {
                if (tool && tool.key) {
                    map[tool.key] = true;
                }
                return map;
            }, {});
        },

        filterVisibleGroups(groups) {
            return (groups || []).filter(group => group && group.tools && group.tools.length);
        },

        toolsByKeys(keys) {
            return this.uniqueKeys(keys).map(key => {
                const tool = this.fhTools[key];
                return tool && tool.installed ? this.toToolViewModel(key) : null;
            }).filter(Boolean);
        },

        toToolViewModel(toolName) {
            const tool = this.fhTools[toolName] || {};
            const menuConfig = Array.isArray(tool.menuConfig) ? tool.menuConfig : [];
            const menuText = menuConfig.map(item => item && item.text ? item.text : '').join(' ');
            const tips = this.cleanText(tool.tips || menuText || tool.name || toolName);

            return {
                key: toolName,
                name: tool.name || toolName,
                shortTips: this.shortenText(tips, 38),
                badge: TOOL_BADGES[toolName] || this.makeBadge(toolName, tool.name),
                favorite: this.favorites.indexOf(toolName) !== -1,
                searchText: this.normalizeText([
                    toolName,
                    tool.name,
                    tips,
                    menuText,
                    TOOL_ALIASES[toolName]
                ].join(' '))
            };
        },

        makeBadge(toolName, toolLabel) {
            const letters = String(toolName || toolLabel || 'FH')
                .split(/[-_\s]+/)
                .filter(Boolean)
                .map(part => part.charAt(0))
                .join('')
                .slice(0, 3)
                .toUpperCase();

            return letters || 'FH';
        },

        cleanText(text) {
            return String(text || '')
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        shortenText(text, maxLength) {
            const normalized = this.cleanText(text);
            if (normalized.length <= maxLength) return normalized;
            return normalized.slice(0, maxLength - 3) + '...';
        },

        normalizeText(text) {
            return String(text || '').trim().toLowerCase();
        },

        syncActiveTool() {
            this.$nextTick(() => {
                const tools = this.flatVisibleTools;
                if (!tools.length) {
                    this.activeToolKey = '';
                    return;
                }

                const stillVisible = tools.some(tool => tool.key === this.activeToolKey);
                if (!stillVisible) {
                    this.activeToolKey = tools[0].key;
                }
            });
        },

        setActiveTool(toolKey) {
            this.activeToolKey = toolKey;
        },

        handleToolHover(toolKey) {
            if (this.uiMode === 'lite') {
                return;
            }
            this.setActiveTool(toolKey);
        },

        getShortcut(toolKey) {
            const index = this.flatVisibleTools.findIndex(tool => tool.key === toolKey);
            if (index < 0 || index > 8) return '';
            return `⌥${index + 1}`;
        },

        getShortcutTitle(toolKey) {
            const index = this.flatVisibleTools.findIndex(tool => tool.key === toolKey);
            if (index < 0 || index > 8) return '';
            return `Option/Alt + ${index + 1}`;
        },

        getShortcutDigitFromEvent(event) {
            const code = event.code || '';
            const codeMatch = /^(Digit|Numpad)([1-9])$/.exec(code);
            if (codeMatch) return Number(codeMatch[2]);

            const key = String(event.key || '');
            if (/^[1-9]$/.test(key)) return Number(key);
            if (MAC_OPTION_DIGITS[key]) return MAC_OPTION_DIGITS[key];

            const keyCode = Number(event.keyCode || event.which || 0);
            if (keyCode >= 49 && keyCode <= 57) return keyCode - 48;
            if (keyCode >= 97 && keyCode <= 105) return keyCode - 96;

            return 0;
        },

        getShortcutToolFromEvent(event) {
            if (!event || event.ctrlKey || event.metaKey || event.shiftKey) {
                return null;
            }

            const digit = this.getShortcutDigitFromEvent(event);
            const isOptionDigit = !!event.altKey && !!digit;
            const isMacOptionSymbol = !!MAC_OPTION_DIGITS[String(event.key || '')];

            if (!isOptionDigit && !isMacOptionSymbol) return null;
            return this.flatVisibleTools[digit - 1] || null;
        },

        handlePanelKeydown(event) {
            if (event.__fhPopupHandled) return;

            const target = event.target || {};
            const tagName = target.tagName ? target.tagName.toLowerCase() : '';
            const isSearchInput = tagName === 'input';
            const isTextArea = tagName === 'textarea';
            const isToolButton = target.classList && target.classList.contains('fh-tool-row');
            const isOtherCommand = !isToolButton && (tagName === 'button' || tagName === 'a');

            const shortcutTool = isTextArea ? null : this.getShortcutToolFromEvent(event);
            if (shortcutTool) {
                event.__fhPopupHandled = true;
                event.preventDefault();
                event.stopPropagation && event.stopPropagation();
                event.stopImmediatePropagation && event.stopImmediatePropagation();
                this.activeToolKey = shortcutTool.key;
                this.runHelper(shortcutTool.key);
                return;
            }

            if (isOtherCommand) return;
            if (isTextArea) return;

            if (event.key === '/' && !isSearchInput) {
                event.__fhPopupHandled = true;
                event.preventDefault();
                if (this.$refs.searchInput) {
                    this.$refs.searchInput.focus();
                }
                return;
            }

            if (event.key === 'Escape') {
                event.__fhPopupHandled = true;
                event.preventDefault();
                if (this.searchKey) {
                    this.searchKey = '';
                    this.syncActiveTool();
                } else {
                    window.close();
                }
                return;
            }

            if (event.key === 'ArrowDown') {
                event.__fhPopupHandled = true;
                event.preventDefault();
                this.selectRelativeTool(1);
                return;
            }

            if (event.key === 'ArrowUp') {
                event.__fhPopupHandled = true;
                event.preventDefault();
                this.selectRelativeTool(-1);
                return;
            }

            if (event.key === 'Enter') {
                if (!this.activeToolKey) return;
                event.__fhPopupHandled = true;
                event.preventDefault();
                this.runHelper(this.activeToolKey);
            }
        },

        selectRelativeTool(step) {
            const tools = this.flatVisibleTools;
            if (!tools.length) return;

            const currentIndex = tools.findIndex(tool => tool.key === this.activeToolKey);
            const nextIndex = currentIndex === -1
                ? 0
                : (currentIndex + step + tools.length) % tools.length;

            this.activeToolKey = tools[nextIndex].key;
            this.$nextTick(() => {
                const activeRow = document.querySelector('.fh-tool-row.is-active');
                if (activeRow && activeRow.scrollIntoView) {
                    activeRow.scrollIntoView({ block: 'nearest' });
                }
            });
        },

        async rememberTool(toolName) {
            const recentUsed = this.uniqueKeys([toolName].concat(this.recentUsed)).slice(0, 10);
            this.recentUsed = recentUsed;
            await this.storageSet({
                [POPUP_RECENT_TOOLS]: recentUsed
            });
        },

        recordUsage() {
            try {
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'statistics-tool-usage',
                    params: {
                        tool_name: 'popup'
                    }
                });
            } catch (error) {
                console.warn('统计记录失败:', error);
            }
        },

        runHelper: async function (toolName, options = {}) {
            if (!toolName || !this.fhTools[toolName]) return;

            this.rememberTool(toolName).catch(error => {
                console.warn('记录最近使用工具失败:', error);
            });

            if (toolName === 'screenshot') {
                triggerScreenshot();
                return;
            }

            let tool = this.fhTools[toolName];
            let request = {
                type: MSG_TYPE.OPEN_DYNAMIC_TOOL,
                page: toolName,
                noPage: !!tool.noPage
            };
            if (options.query) {
                request.query = options.query;
            }
            if (options.withContent) {
                request.withContent = options.withContent;
            }
            if (tool._devTool) {
                request.page = 'dynamic';
                request.query = options.query
                    ? `tool=${toolName}&${options.query}`
                    : `tool=${toolName}`;
            }
            try {
                const response = await chrome.runtime.sendMessage(request);
                if (response && response.ok === false) {
                    throw new Error(response.error || '后台未能打开工具页面');
                }
                !!tool.noPage && setTimeout(window.close, 200);
            } catch (e) {
                try {
                    await chrome.tabs.create({
                        url: `/${toolName}/index.html` + (request.query ? `?${request.query}` : ''),
                        active: true
                    });
                } catch (fallbackError) {
                    console.error('工具页面打开失败:', e, fallbackError);
                }
            }
        },

        openOptionsPage() {
            chrome.runtime.openOptionsPage();
        },

        openUrl(event) {
            event.preventDefault();
            chrome.tabs.create({url: event.currentTarget.href});
            return false;
        }
    }
});
