/**
 * FeHelper Popup Menu
 */

import Awesome from '../background/awesome.js'
import MSG_TYPE from '../static/js/common.js';
import AI from '../aiagent/fh.ai.js';
import {
    analyzeDeveloperInput,
    buildAiRouterMessages,
    mergeRouterAnalysis,
    parseAiRouterResponse
} from '../aiagent/fh.ai-router.js';

const POPUP_RECENT_TOOLS = 'popup_recent_tools';
const USER_USAGE_DATA_KEY = 'FH_USER_USAGE_DATA';
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
    'json-diff': 'json diff compare',
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
        aiRouter: {
            input: '',
            sourceLabel: '',
            statusText: '',
            modelStatus: 'checking',
            loading: false,
            error: '',
            analysis: null,
            aiDraft: ''
        }
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
        },

        shouldShowAiRouter() {
            return this.aiRouter.modelStatus === 'available';
        },

        aiRouterStatusText() {
            if (this.aiRouter.loading) return this.aiRouter.statusText || '正在让 Gemini Nano 精判';
            if (this.aiRouter.error) return this.aiRouter.error;
            if (this.aiRouter.analysis) {
                return this.aiRouter.analysis.refinedByAi
                    ? `Gemini 精判：${this.aiRouter.analysis.inputType}`
                    : `本地识别：${this.aiRouter.analysis.inputType}`;
            }
            return '识别剪贴板或搜索输入，推荐合适工具';
        },

        aiRouterActions() {
            const analysis = this.aiRouter.analysis || {};
            const actions = analysis.actions
                ? analysis.actions
                : [];
            const primaryAction = analysis.primaryAction;
            if (!primaryAction) return actions.slice(0, 3);
            const primaryKey = `${primaryAction.toolKey}:${primaryAction.taskKey || ''}`;
            return [primaryAction]
                .concat(actions.filter(action => `${action.toolKey}:${action.taskKey || ''}` !== primaryKey))
                .slice(0, 3);
        },

        aiRouterSignals() {
            const signals = this.aiRouter.analysis && this.aiRouter.analysis.signals
                ? this.aiRouter.analysis.signals
                : [];
            return signals.slice(0, 3);
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

        try {
            const wakeup = chrome.runtime.sendMessage({ type: 'fh-popup-opened' });
            if (wakeup && typeof wakeup.catch === 'function') {
                wakeup.catch(() => {});
            }
        } catch (e) {
        }

        this.loadTools();
        this.refreshAiModelSnapshot();
        this.loadPatchHotfix();
    },

    mounted: function () {
        this.panelKeydownHandler = event => this.handlePanelKeydown(event);
        document.addEventListener('keydown', this.panelKeydownHandler, true);

        this.$nextTick(() => {
            setTimeout(() => {
                if (typeof DarkModeMgr !== 'undefined') {
                    DarkModeMgr.turnLightAuto();
                }

                this.recordUsage();

                if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
                    Awesome.collectAndSendClientInfo();
                }

                if (this.$refs.searchInput) {
                    this.$refs.searchInput.focus();
                }
            }, 50);
        });
    },

    beforeDestroy: function () {
        if (this.panelKeydownHandler) {
            document.removeEventListener('keydown', this.panelKeydownHandler, true);
        }
    },

    methods: {
        async refreshAiModelSnapshot() {
            try {
                const result = await AI.getBuiltInAvailability();
                this.aiRouter.modelStatus = result.availability || 'unsupported';
                await chrome.storage.local.set({
                    fh_ai_builtin_status_snapshot: {
                        status: result.availability,
                        progress: result.availability === 'available' ? 1 : 0,
                        message: result.message || '',
                        checkedAt: Date.now(),
                        source: 'popup'
                    }
                });
            } catch (error) {
                this.aiRouter.modelStatus = 'error';
                await chrome.storage.local.set({
                    fh_ai_builtin_status_snapshot: {
                        status: 'error',
                        progress: 0,
                        message: error && error.message ? error.message : 'AI 模型状态检测失败',
                        checkedAt: Date.now(),
                        source: 'popup'
                    }
                });
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

            return classes;
        },

        async loadTools() {
            try {
                const tools = await Awesome.getInstalledTools();
                const customOrder = await this.storageGet('tool_custom_order');
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

                await this.loadPopupMeta();
                this.isLoading = false;
                this.syncActiveTool();
            } catch (error) {
                console.error('加载工具列表失败:', error);
                this.fhTools = {};
                this.isLoading = false;
            }
        },

        async loadPopupMeta() {
            const meta = await this.storageGet(['favorites', POPUP_RECENT_TOOLS, USER_USAGE_DATA_KEY]);
            const favorites = Array.isArray(meta.favorites) ? meta.favorites : [];
            const popupRecent = Array.isArray(meta[POPUP_RECENT_TOOLS]) ? meta[POPUP_RECENT_TOOLS] : [];
            const usageRecent = this.readRecentUsedTools(meta[USER_USAGE_DATA_KEY]);

            this.favorites = this.uniqueKeys(favorites);
            this.recentUsed = this.uniqueKeys(popupRecent.concat(usageRecent)).slice(0, 10);
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

        runLocalAiRouter(input, sourceLabel) {
            const value = String(input || '').trim();
            this.aiRouter.input = value;
            this.aiRouter.sourceLabel = sourceLabel || '';
            this.aiRouter.error = '';
            this.aiRouter.aiDraft = '';
            this.aiRouter.loading = false;
            this.aiRouter.analysis = analyzeDeveloperInput(value);
            this.aiRouter.statusText = value
                ? `${sourceLabel || '当前输入'}已完成本地识别`
                : '没有可识别内容';
        },

        inspectSearchInput() {
            const value = this.searchKey || this.aiRouter.input;
            this.runLocalAiRouter(value, '搜索输入');
            if (this.searchKey && this.aiRouter.analysis && this.aiRouter.analysis.inputType !== 'unknown') {
                this.searchKey = '';
            }
        },

        async readClipboardTextForRouter() {
            let clipboardApiError = null;

            try {
                if (typeof window !== 'undefined' && window.focus) {
                    window.focus();
                }
                if (navigator.clipboard && navigator.clipboard.readText) {
                    return await navigator.clipboard.readText();
                }
            } catch (error) {
                clipboardApiError = error;
            }

            const textarea = document.createElement('textarea');
            textarea.setAttribute('aria-hidden', 'true');
            textarea.setAttribute('tabindex', '-1');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '0';
            textarea.style.width = '1px';
            textarea.style.height = '1px';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();

            try {
                const ok = document.execCommand && document.execCommand('paste');
                const value = textarea.value || '';
                if (ok || value) {
                    return value;
                }
            } catch (error) {
                if (!clipboardApiError) {
                    clipboardApiError = error;
                }
            } finally {
                document.body.removeChild(textarea);
                if (this.$refs.searchInput && this.$refs.searchInput.focus) {
                    this.$refs.searchInput.focus();
                }
            }

            const message = clipboardApiError && clipboardApiError.message
                ? clipboardApiError.message
                : '';
            throw new Error(message || '读取剪贴板失败，请确认扩展已获得剪贴板读取权限。');
        },

        async inspectClipboard() {
            this.aiRouter.loading = true;
            this.aiRouter.error = '';
            this.aiRouter.statusText = '正在读取剪贴板';
            try {
                const text = await this.readClipboardTextForRouter();
                this.runLocalAiRouter(text, '剪贴板');
                if (text) {
                    this.searchKey = '';
                }
            } catch (error) {
                this.aiRouter.loading = false;
                this.aiRouter.error = this.formatClipboardError(error);
                this.aiRouter.statusText = '';
            }
        },

        formatClipboardError(error) {
            const message = error && error.message ? error.message : '';
            if (/readText|clipboard|permission|denied|not focused|Document is not focused/i.test(message)) {
                return '剪贴板读取被浏览器拒绝，请重新加载扩展后再试，或先粘贴到搜索框再点“识别”。';
            }
            return message || '读取剪贴板失败，请先粘贴到搜索框再点“识别”。';
        },

        async refineAiRouterWithAi() {
            const input = this.aiRouter.input || this.searchKey;
            if (!input || this.aiRouter.loading) return;

            if (!this.aiRouter.analysis) {
                this.runLocalAiRouter(input, this.aiRouter.sourceLabel || '当前输入');
            }

            this.aiRouter.loading = true;
            this.aiRouter.error = '';
            this.aiRouter.aiDraft = '';
            this.aiRouter.statusText = '正在调用 Gemini Nano 精判工具动作';

            try {
                const messages = buildAiRouterMessages(input, this.aiRouter.analysis);
                await AI.askCoderLLM(messages, (respJson, done) => {
                    if (done) {
                        const aiAnalysis = parseAiRouterResponse(this.aiRouter.aiDraft);
                        if (aiAnalysis) {
                            this.aiRouter.analysis = mergeRouterAnalysis(this.aiRouter.analysis, aiAnalysis);
                            this.aiRouter.statusText = 'Gemini Nano 已完成工具精判';
                        } else {
                            this.aiRouter.statusText = 'Gemini 返回内容无法解析，保留本地推荐';
                        }
                        this.aiRouter.loading = false;
                        return;
                    }
                    if (respJson && respJson.type === 'status') {
                        this.aiRouter.statusText = this.formatAiRouterStatus(respJson);
                        return;
                    }
                    if (respJson && typeof respJson.content === 'string') {
                        this.aiRouter.aiDraft = respJson.content;
                        this.aiRouter.statusText = 'Gemini Nano 正在生成判断';
                    }
                }, null, 'builtin');
            } catch (error) {
                this.aiRouter.loading = false;
                this.aiRouter.error = this.formatAiRouterError(error);
                this.aiRouter.statusText = '';
            }
        },

        formatAiRouterStatus(payload) {
            if (!payload || payload.provider !== 'builtin') return 'Gemini Nano 正在处理';
            if (payload.status === 'downloading') {
                const progress = typeof payload.progress === 'number'
                    ? Math.round(Math.max(0, Math.min(1, payload.progress)) * 100)
                    : 0;
                return progress > 0 && progress < 100
                    ? `正在下载 Gemini Nano 模型（${progress}%）`
                    : '正在下载 Gemini Nano 模型';
            }
            const statusText = {
                unsupported: '当前浏览器不支持 Chrome 内置 AI',
                unavailable: '当前设备暂不满足本机 AI 运行条件',
                downloadable: 'Gemini Nano 模型可下载',
                available: 'Gemini Nano 已就绪',
                error: 'AI 状态检测失败'
            };
            return payload.message || statusText[payload.status] || 'Gemini Nano 正在处理';
        },

        formatAiRouterError(error) {
            const message = error && error.message ? error.message : String(error || '');
            if (message.startsWith('BUILTIN_AI_UNAVAILABLE:')) {
                return message.replace('BUILTIN_AI_UNAVAILABLE:', '');
            }
            return message || 'AI 精判失败，已保留本地推荐';
        },

        buildAiRouterActionQuery(action) {
            const params = ['from=router'];
            if (action && action.taskKey) {
                params.push(`aiTask=${encodeURIComponent(action.taskKey)}`);
            }
            return params.join('&');
        },

        async runAiRouterAction(action) {
            if (!action || !action.toolKey) return;
            const tool = this.fhTools[action.toolKey];
            if (!tool || !tool.installed) {
                chrome.tabs.create({
                    url: `/options/index.html?query=${encodeURIComponent(action.toolKey)}`
                });
                return;
            }

            await this.runHelper(action.toolKey, {
                query: this.buildAiRouterActionQuery(action),
                withContent: this.aiRouter.input || this.searchKey
            });
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
            const isToolButton = target.classList && target.classList.contains('fh-tool-row');
            const isOtherCommand = !isToolButton && (tagName === 'button' || tagName === 'a');

            const shortcutTool = this.getShortcutToolFromEvent(event);
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

            await this.rememberTool(toolName);

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
                await chrome.runtime.sendMessage(request);
                !!tool.noPage && setTimeout(window.close, 200);
            } catch (e) {
                chrome.tabs.create({
                    url: `/${toolName}/index.html` + (request.query ? `?${request.query}` : ''),
                    active: true
                });
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
