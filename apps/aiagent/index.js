/**
 * ChatGPT工具
 * @author zhaoxianlie
 */

import AI from './fh.ai.js';
import { getAiFeaturePack } from './fh.ai-features.js';

const AI_STATUS_TEXT = {
    unsupported: '当前浏览器不支持 Chrome 内置 AI',
    unavailable: '当前设备暂不满足 Chrome 内置 AI 运行条件',
    downloadable: 'Chrome 内置 AI 模型可下载，首次发送时会自动下载',
    downloading: 'Chrome 正在下载本机 AI 模型',
    available: 'Chrome 内置 AI 已就绪',
    error: 'Chrome 内置 AI 状态检测失败'
};

const SAFE_HTML_TAGS = new Set([
    'a', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p', 'pre', 'span', 'strong',
    'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul'
]);

const SAFE_ATTRS = {
    a: new Set(['href', 'target', 'rel']),
    code: new Set(['class']),
    span: new Set(['class']),
    td: new Set(['colspan', 'rowspan']),
    th: new Set(['colspan', 'rowspan'])
};

function isSafeHref(value) {
    return /^(https?:|mailto:|#)/i.test(value || '');
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function sanitizeAssistantHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html || '';

    function walk(parent) {
        Array.from(parent.children).forEach(node => {
            const tag = node.tagName.toLowerCase();
            if (!SAFE_HTML_TAGS.has(tag)) {
                node.replaceWith(document.createTextNode(node.textContent || ''));
                return;
            }
            Array.from(node.attributes).forEach(attr => {
                const name = attr.name.toLowerCase();
                const allowed = SAFE_ATTRS[tag] && SAFE_ATTRS[tag].has(name);
                if (!allowed || name.startsWith('on')) {
                    node.removeAttribute(attr.name);
                    return;
                }
                if (tag === 'a' && name === 'href' && !isSafeHref(attr.value)) {
                    node.removeAttribute(attr.name);
                }
            });
            if (tag === 'a' && node.getAttribute('href')) {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noreferrer noopener');
            }
            walk(node);
        });
    }

    walk(template.content);
    return template.innerHTML;
}

new Vue({
    el: '#pageContainer',
    data: {
        prompt: '',
        demos: [
            '用Js写一个冒泡排序的Demo',
            'Js里的Fetch API是怎么用的',
            '帮我写一个单网页版的俄罗斯方块游戏',
            '我开发了一个浏览器插件，是专门为HR自动找简历的，现在请你帮我用SVG绘制一个插件的ICON，不需要问我细节，直接生成'
        ],
        initMessage: {
            id:'id-test123',
            sendTime:'2022/12/20 12:12:12',
            message: '你好，可以告诉我你是谁吗？我该怎么和你沟通？',
            respTime: '2022/12/20 12:12:13',
            respContent: '你好，我是FeHelper智能助理，由OpenAI提供技术支持；你可以在下面的输入框向我提问，我会尽可能回答你~~~'
        },
        respResult:{
            id: '',
            sendTime:'',
            message:'',
            respTime:'',
            respContent:''
        },
        currentSession: [],
        history:[],
        tempId:'',
        hideDemo: false,
        undergoing: false,
        messages: [],
        showHistoryPanel: false,
        showSettings: false,
        showApiKeyWarning: false,
        settingsSaved: false,
        aiProvider: 'siliconflow',
        aiApiKey: '',
        aiCustomUrl: '',
        aiCustomModel: '',
        providers: {},
        aiBuiltinStatus: '',
        aiBuiltinProgress: 0,
        aiBuiltinChecking: false,
        aiStatusMessage: '',
        pendingAiStatusId: '',
        initialPromptApplied: false,
        activeAiFeature: null,
        activeSystemContext: ''
    },
    computed: {
        currentProviderInfo() {
            return this.providers[this.aiProvider] || {};
        },
        currentProviderNeedsKey() {
            return this.currentProviderInfo.needsKey !== false;
        },
        builtinStatusText() {
            if (this.aiBuiltinChecking) {
                return '正在检测 Chrome 内置 AI 状态';
            }
            return AI_STATUS_TEXT[this.aiBuiltinStatus] || '尚未检测 Chrome 内置 AI 状态';
        },
        builtinProgressPercent() {
            return Math.round(Math.max(0, Math.min(1, this.aiBuiltinProgress || 0)) * 100);
        },
        apiKeyWarningText() {
            const providerName = this.currentProviderInfo.name || '当前 AI 服务商';
            return `${providerName} 尚未配置 API Key，请先完成设置。`;
        },
        groupedHistory() {
            // 按日期分组，主题为message前20字
            const groups = {};
            this.history.forEach(item => {
                const date = item.sendTime ? item.sendTime.split(' ')[0] : '未知日期';
                if (!groups[date]) groups[date] = [];
                groups[date].push({
                    ...item,
                    theme: item.message ? item.message.slice(0, 20) : ''
                });
            });
            return groups;
        }
    },
    watch: {
        history: {
            handler(val) {
                localStorage.setItem('fh-aiagent-history', JSON.stringify(val));
            },
            deep: true
        }
    },
    mounted: function () {
        this.$refs.prompt.focus();
        this.hideDemo = !!(new URL(location.href)).searchParams.get('hideDemo');
        const local = localStorage.getItem('fh-aiagent-history');
        if(local){
            try {
                this.history = JSON.parse(local).map(item => ({
                    ...item,
                    respContent: sanitizeAssistantHtml(item.respContent || '')
                }));
            } catch(e) {}
        }
        this.providers = AI.PROVIDERS;
        AI.getConfig().then(cfg => {
            this.aiProvider = cfg.provider;
            this.aiApiKey = cfg.apiKey;
            this.aiCustomUrl = cfg.customUrl;
            this.aiCustomModel = cfg.customModel;
            if (this.currentProviderNeedsKey && !cfg.apiKey) {
                this.showApiKeyWarning = true;
            }
            if (this.aiProvider === 'builtin') {
                this.refreshBuiltinStatus();
            }
            this.applyInitialPromptFromQuery();
        });
        this.loadPatchHotfix();
    },
    methods: {

        loadPatchHotfix() {
            // 页面加载时自动获取并注入页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'aiagent'
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
                            console.error('aiagent补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        // 这个代码，主要用来判断大模型返回的内容是不是包含完整的代码块
        validateCodeBlocks(content) {
            let backticksCount = 0;
            let inCodeBlock = false;
            let codeBlockStartIndex = -1;
        
            for (let i = 0; i < content.length; i++) {
                // 检查当前位置是否是三个连续的反引号
                if (content.startsWith('```', i)) {
                    backticksCount++;
                    i += 2; // 跳过接下来的两个字符，因为它们也是反引号的一部分
        
                    // 如果我们遇到了奇数个反引号序列，那么我们进入了代码块
                    if (backticksCount % 2 !== 0) {
                        inCodeBlock = true;
                        codeBlockStartIndex = i - 2;
                    } else { // 否则，我们离开了代码块
                        inCodeBlock = false;
                        if (codeBlockStartIndex === -1 || codeBlockStartIndex > i) {
                            return false; // 这意味着有不匹配的反引号
                        }
                        codeBlockStartIndex = -1;
                    }
                }
            }
        
            // 如果最终 backticksCount 是偶数，则所有代码块都正确关闭
            return backticksCount % 2 === 0 && !inCodeBlock;
        },

        sendMessage(prompt){
            prompt = (prompt || '').trim();
            if(this.undergoing) return;
            if(!prompt) return;
            if(this.respResult.id){
                // 先存储上一轮对话到历史
                this.history.push({
                    id: this.respResult.id,
                    sendTime: this.respResult.sendTime,
                    message: this.respResult.message,
                    respTime: this.respResult.respTime,
                    respContent: this.respResult.respContent
                });
                this.respResult = {
                    id: '',
                    sendTime: '',
                    message: '',
                    respTime: '',
                    respContent: ''
                };
            }

            this.undergoing = true;
            let sendTime = (new Date()).format('yyyy/MM/dd HH:mm:ss');
            this.$nextTick(() => {
                this.scrollToBottom();
            });

            this.tempId = '';
            let respContent = '';

            // 1. 先把用户输入 push 到 messages
            this.messages.push({ role: 'user', content: prompt });
            // 新增：用户消息push到currentSession
            this.currentSession.push({
                role: 'user',
                id: 'user-' + Date.now(),
                time: sendTime,
                content: prompt
            });

            AI.askCoderLLM(this.buildAiRequestMessages(), (respJson, done) => {
                if(done){
                    this.undergoing = false;
                    if (this.aiProvider === 'builtin' && this.aiBuiltinStatus === 'available') {
                        this.aiStatusMessage = AI_STATUS_TEXT.available;
                    }
                    if (!this.respResult.id && this.pendingAiStatusId) {
                        this.replaceBuiltInPendingMessage({
                            role: 'assistant',
                            id: 'empty-' + Date.now(),
                            time: (new Date()).format('yyyy/MM/dd HH:mm:ss'),
                            content: '<span class="resp-error">本次没有返回内容，请稍后重试或切换云端服务。</span>'
                        });
                    }
                    if(this.respResult.id && this.respResult.respContent){
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = this.respResult.respContent;
                        const plainText = tempDiv.textContent || tempDiv.innerText || '';
                        this.messages.push({ role: 'assistant', content: plainText });
                        this.history.push({
                            id: this.respResult.id,
                            sendTime: this.respResult.sendTime,
                            message: this.respResult.message,
                            respTime: this.respResult.respTime,
                            respContent: this.respResult.respContent
                        });
                    }
                    this.$nextTick(() => {
                        document.querySelectorAll('.x-xcontent pre code').forEach((block) => {
                            hljs.highlightBlock(block);
                            insertCodeToolbar(block);
                        });
                        this.scrollToBottom();
                    });
                    return;
                }
                if (respJson && respJson.type === 'status') {
                    this.updateBuiltInStatus(respJson);
                    this.showBuiltInPendingMessage(respJson);
                    return;
                }
                this.removeBuiltInPendingMessage();
                let id = respJson.id || `ai-${Date.now()}`;
                let rawContent = respJson.content || '';
                const lastAssistantMsg = this.currentSession.slice().reverse().find(m => m.role === 'assistant');
                const lastIsCodeBlock = lastAssistantMsg && /```\s*$/.test(lastAssistantMsg.content.trim());
                const thisIsCodeBlock = /^```/.test(rawContent.trim());
                if (lastIsCodeBlock && !thisIsCodeBlock) {
                    rawContent = '```js\n' + rawContent.trim() + '\n```';
                }
                respContent = rawContent;
                if(!this.validateCodeBlocks(respContent)) {
                    respContent += '\n```';
                }
                respContent = this.renderMarkdown(respContent);
                if(this.tempId !== id) {
                    this.tempId = id;
                    let dateTime = new Date((respJson.created || Math.floor(Date.now() / 1000)) * 1000);
                    let respTime = dateTime.format('yyyy/MM/dd HH:mm:ss');
                    this.respResult = { id,sendTime,message:prompt,respTime,respContent };
                    this.currentSession.push({
                        role: 'assistant',
                        id,
                        time: respTime,
                        content: respContent
                    });
                }else{
                    this.respResult.respContent = respContent;
                    if(this.currentSession.length && this.currentSession[this.currentSession.length-1].role==='assistant'){
                        this.currentSession[this.currentSession.length-1].content = respContent;
                    }
                }
                this.$nextTick(() => this.scrollToBottom());
            }, null, this.aiProvider === 'builtin' ? 'builtin' : undefined).catch(err => {
                this.undergoing = false;
                if (err.message && err.message.startsWith('NO_API_KEY:')) {
                    this.showApiKeyWarning = true;
                    this.messages.pop();
                    this.currentSession.pop();
                } else {
                    const errMessage = this.formatAiErrorMessage(err);
                    if (err.message && err.message.startsWith('BUILTIN_AI_UNAVAILABLE:')) {
                        this.aiBuiltinStatus = 'unavailable';
                        this.aiStatusMessage = errMessage;
                    }
                    const errTime = (new Date()).format('yyyy/MM/dd HH:mm:ss');
                    const errMsg = `<span class="resp-error">请求失败：${escapeHtml(errMessage)}</span>`;
                    this.replaceBuiltInPendingMessage({
                        role: 'assistant',
                        id: 'err-' + Date.now(),
                        time: errTime,
                        content: errMsg
                    });
                    this.$nextTick(() => this.scrollToBottom());
                }
            });            
        },

        scrollToBottom(){
            this.$refs.boxResult.scrollTop = this.$refs.boxResult.scrollHeight;
        },
        goChat(){
            this.sendMessage(this.prompt);
            this.$nextTick(() => this.prompt='');
        },

        buildAiRequestMessages() {
            const messages = this.messages.slice();
            if (!this.activeSystemContext) {
                return messages;
            }
            return [
                { role: 'system', content: this.activeSystemContext },
                ...messages
            ];
        },

        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },

        openDonateModal: function(event ){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'aiagent' }
            });
        },

        renderMarkdown(content) {
            return sanitizeAssistantHtml(marked(content || ''));
        },

        async applyInitialPromptFromQuery() {
            if (this.initialPromptApplied) return;
            this.initialPromptApplied = true;
            const params = new URL(location.href).searchParams;
            const provider = params.get('provider');
            const featureKey = params.get('aiFeature');
            const featurePack = getAiFeaturePack(featureKey);
            const prompt = params.get('prompt') || (featurePack && featurePack.prompt);
            const autoSend = params.get('autoSend') === '1';

            if (provider && this.providers[provider]) {
                this.aiProvider = provider;
            }
            if (featurePack) {
                this.activeAiFeature = featurePack;
                this.activeSystemContext = featurePack.systemContext || '';
            }
            if (!prompt) return;

            this.prompt = prompt;
            this.hideDemo = true;
            if (autoSend) {
                this.$nextTick(() => {
                    this.sendMessage(prompt);
                    this.prompt = '';
                });
            }
        },

        updateBuiltInStatus(payload) {
            if (!payload || payload.provider !== 'builtin') return;
            this.aiBuiltinStatus = payload.status || this.aiBuiltinStatus;
            if (typeof payload.progress === 'number') {
                this.aiBuiltinProgress = Math.max(0, Math.min(1, payload.progress));
            }
            this.aiStatusMessage = this.formatBuiltInStatusMessage(payload);
        },

        formatBuiltInStatusMessage(payload) {
            const status = payload && payload.status ? payload.status : this.aiBuiltinStatus;
            const progress = typeof (payload && payload.progress) === 'number'
                ? Math.round(Math.max(0, Math.min(1, payload.progress)) * 100)
                : this.builtinProgressPercent;
            if (status === 'downloadable') {
                return 'Chrome 内置 AI 模型尚未下载，正在开始首次下载。首次使用可能需要几分钟。';
            }
            if (status === 'downloading') {
                const suffix = progress > 0 && progress < 100 ? `（${progress}%）` : '';
                return `Chrome 正在下载本机 AI 模型${suffix}。下载完成后会自动继续回答。`;
            }
            if (status === 'available') {
                return 'Chrome 内置 AI 已就绪，正在生成回答。';
            }
            return (payload && payload.message) || AI_STATUS_TEXT[status] || 'Chrome 内置 AI 正在准备。';
        },

        showBuiltInPendingMessage(payload) {
            if (this.aiProvider !== 'builtin' || !this.undergoing) return;
            const text = this.formatBuiltInStatusMessage(payload);
            const content = `<span class="fh-ai-inline-status">${escapeHtml(text)}</span>`;
            const now = (new Date()).format('yyyy/MM/dd HH:mm:ss');
            if (!this.pendingAiStatusId) {
                this.pendingAiStatusId = 'ai-status-' + Date.now();
                this.currentSession.push({
                    role: 'assistant',
                    id: this.pendingAiStatusId,
                    time: now,
                    content
                });
            } else {
                const item = this.currentSession.find(msg => msg.id === this.pendingAiStatusId);
                if (item) {
                    item.time = now;
                    item.content = content;
                }
            }
            this.$nextTick(() => this.scrollToBottom());
        },

        removeBuiltInPendingMessage() {
            if (!this.pendingAiStatusId) return;
            this.currentSession = this.currentSession.filter(msg => msg.id !== this.pendingAiStatusId);
            this.pendingAiStatusId = '';
        },

        replaceBuiltInPendingMessage(message) {
            if (!this.pendingAiStatusId) {
                this.currentSession.push(message);
                return;
            }
            const index = this.currentSession.findIndex(msg => msg.id === this.pendingAiStatusId);
            if (index >= 0) {
                this.currentSession.splice(index, 1, message);
            } else {
                this.currentSession.push(message);
            }
            this.pendingAiStatusId = '';
        },

        async refreshBuiltinStatus() {
            if (this.aiProvider !== 'builtin') return;
            this.aiBuiltinChecking = true;
            const result = await AI.getBuiltInAvailability();
            this.aiBuiltinStatus = result.availability;
            this.aiBuiltinProgress = result.availability === 'available' ? 1 : 0;
            this.aiBuiltinChecking = false;
            this.aiStatusMessage = result.message || this.builtinStatusText;
        },

        formatAiErrorMessage(err) {
            const message = err && err.message ? err.message : '未知错误';
            if (message.startsWith('BUILTIN_AI_UNAVAILABLE:')) {
                return message.replace('BUILTIN_AI_UNAVAILABLE:', '');
            }
            return message;
        },

        loadHistory(item) {
            // 渲染到主面板
            this.respResult = {
                id: item.id,
                sendTime: item.sendTime,
                message: item.message,
                respTime: item.respTime,
                respContent: sanitizeAssistantHtml(item.respContent || '')
            };
            this.showHistoryPanel = false;
            this.$nextTick(() => this.scrollToBottom());
        },

        startNewChat(event) {
            event && event.preventDefault();
            this.messages = [];
            this.pendingAiStatusId = '';
            this.respResult = {
                id: '',
                sendTime: '',
                message: '',
                respTime: '',
                respContent: ''
            };
            this.currentSession = [];
            this.showHistoryPanel = false;
            this.$nextTick(() => {
                this.$forceUpdate();
                this.scrollToBottom();
            });
        },

        onHistoryClick(event) {
            event.preventDefault();
            event.stopPropagation();
            this.showHistoryPanel = !this.showHistoryPanel;
        },

        onProviderChange() {
            this.aiApiKey = '';
            this.showApiKeyWarning = false;
            this.aiStatusMessage = '';
            this.pendingAiStatusId = '';
            if (this.aiProvider === 'builtin') {
                this.refreshBuiltinStatus();
            }
        },
        async saveAiSettings() {
            await AI.saveConfig({
                provider: this.aiProvider,
                apiKey: this.aiApiKey,
                customUrl: this.aiCustomUrl,
                customModel: this.aiCustomModel
            });
            this.settingsSaved = true;
            this.showApiKeyWarning = this.currentProviderNeedsKey && !this.aiApiKey;
            if (this.aiProvider === 'builtin') {
                await this.refreshBuiltinStatus();
            }
            setTimeout(() => { this.settingsSaved = false; }, 2000);
        },
        onPromptKeydown(e) {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // 允许换行
                    return;
                } else {
                    // 阻止默认换行，发送消息
                    e.preventDefault();
                    this.goChat();
                }
            }
        }
    }

});

// 工具函数：复制和运行
function copyCode(code) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code);
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// 新增：为代码块插入工具栏
function insertCodeToolbar(block) {
    // 检查是否已插入按钮，避免重复
    if (block.parentNode.querySelector('.fh-code-toolbar')) return;

    // 创建工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'fh-code-toolbar';
    toolbar.style.cssText = 'position:absolute;bottom:6px;right:12px;z-index:10;display:flex;gap:8px;';

    // 复制按钮
    const btnCopy = document.createElement('button');
    btnCopy.innerText = '复制';
    btnCopy.className = 'fh-btn-copy';
    btnCopy.style.cssText = 'padding:2px 8px;font-size:12px;cursor:pointer;';
    btnCopy.onclick = (e) => {
        e.stopPropagation();
        copyCode(block.innerText);
        // 复制成功反馈
        const oldText = btnCopy.innerText;
        btnCopy.innerText = '已复制';
        btnCopy.disabled = true;
        setTimeout(() => {
            btnCopy.innerText = oldText;
            btnCopy.disabled = false;
        }, 1000);
    };

    // 运行按钮
    const lang = (block.className || '').toLowerCase();
    let btnRun = document.createElement('button');
    btnRun.className = 'fh-btn-run';
    btnRun.style.cssText = 'padding:2px 8px;font-size:12px;cursor:pointer;';
    let shouldAppendBtnRun = true;
    if (lang.includes('lang-javascript') || lang.includes('lang-js')) {
        btnRun.innerText = 'Console运行';
        btnRun.onclick = (e) => {
            e.stopPropagation();
            copyCode(block.innerText);
            btnRun.innerText = '已复制到剪贴板';
            btnRun.disabled = true;
            setTimeout(() => {
                btnRun.innerText = 'Console运行';
                btnRun.disabled = false;
            }, 1200);
            showToast('代码已复制到剪贴板，请按F12打开开发者工具，切换到Console粘贴回车即可运行！');
        };
    } else if (lang.includes('lang-html')) {
        btnRun.innerText = '下载并运行';
        btnRun.onclick = (e) => {
            e.stopPropagation();
            const blob = new Blob([block.innerText], {type: 'text/html'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fehelper-demo.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            btnRun.innerText = '已下载';
            btnRun.disabled = true;
            setTimeout(() => {
                btnRun.innerText = '下载并运行';
                btnRun.disabled = false;
            }, 1200);
            showToast('HTML文件已下载，请双击打开即可运行！');
        };
    } else if (lang.includes('lang-xml') || lang.includes('lang-svg')) {
        // 检查内容是否为svg
        const codeText = block.innerText.trim();
        if (/^<svg[\s\S]*<\/svg>$/.test(codeText)) {
            btnRun.innerText = '点击预览';
            btnRun.onclick = (e) => {
                e.stopPropagation();
                // 弹窗预览svg
                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;';
                const inner = document.createElement('div');
                inner.style.cssText = 'background:#fff;width:400px;height:400px;border-radius:10px;box-shadow:0 2px 16px rgba(0,0,0,0.18);position:relative;display:flex;align-items:center;justify-content:center;';
                const closeBtn = document.createElement('button');
                closeBtn.innerText = '×';
                closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;width:32px;height:32px;font-size:22px;line-height:28px;background:transparent;border:none;cursor:pointer;color:#888;z-index:2;';
                closeBtn.onclick = () => document.body.removeChild(modal);
                const img = document.createElement('img');
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(codeText)));
                img.alt = 'SVG预览';
                img.style.cssText = 'max-width:90%;max-height:90%;display:block;border:1px solid #eee;background:#fafbfc;';
                inner.appendChild(closeBtn);
                inner.appendChild(img);
                modal.appendChild(inner);
                document.body.appendChild(modal);
            };
        } else {
            btnRun.remove();
            shouldAppendBtnRun = false;
        }
    } else {
        btnRun.remove();
        shouldAppendBtnRun = false;
    }

    toolbar.appendChild(btnCopy);
    if (shouldAppendBtnRun) {
        toolbar.appendChild(btnRun);
    }

    // 让pre相对定位，插入工具栏到底部
    const pre = block.parentNode;
    pre.style.position = 'relative';
    pre.appendChild(toolbar);
}

// 页面内Toast提示
function showToast(msg) {
    let toast = document.createElement('div');
    toast.className = 'fh-toast';
    toast.innerText = msg;
    toast.style.cssText = `
        position:fixed;left:50%;top:80px;transform:translateX(-50%);
        background:rgba(0,0,0,0.85);color:#fff;padding:10px 24px;
        border-radius:6px;font-size:16px;z-index:99999;box-shadow:0 2px 8px rgba(0,0,0,0.2);
        transition:opacity 0.3s;opacity:1;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 1800);
}
