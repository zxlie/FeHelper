import AI from './fh.ai.js';
import { getAiFeaturePack } from './fh.ai-features.js';

const MAX_CONTEXT_LENGTH = 12000;
const INLINE_AI_RULES = [
    'FeHelper 工具内联 AI 规则：',
    '1. 只回答当前工具里的具体任务，不把用户引导到聊天页。',
    '2. 优先给可复制、可应用、可验证的结果。',
    '3. 不解释基础概念，除非用户当前错误需要定位原因。',
    '4. 输出要紧凑，先给结论，再给必要步骤。'
].join('\n');

const STATUS_TEXT = {
    unsupported: '当前浏览器不支持 Chrome 内置 AI',
    unavailable: '当前设备暂不满足本机 AI 运行条件',
    downloadable: 'Gemini Nano 模型可下载，首次使用会自动下载',
    downloading: '正在下载 Gemini Nano 本机模型',
    available: 'Gemini Nano 已就绪，正在生成',
    error: 'AI 状态检测失败'
};

const SAFE_MARKDOWN_TAGS = new Set([
    'a', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p', 'pre', 'span', 'strong',
    'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul'
]);

const SAFE_MARKDOWN_ATTRS = {
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
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderInlineMarkdownText(text) {
    return escapeHtml(text)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|#[^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function renderInlineMarkdownFallback(source) {
    const lines = String(source || '').replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let paragraphLines = [];
    let listItems = [];
    let listType = '';
    let inCodeBlock = false;
    let codeLang = '';
    let codeLines = [];

    function flushParagraph() {
        if (!paragraphLines.length) return;
        html += `<p>${paragraphLines.map(renderInlineMarkdownText).join('<br>')}</p>`;
        paragraphLines = [];
    }

    function flushList() {
        if (!listItems.length || !listType) return;
        html += `<${listType}>${listItems.map(item => `<li>${renderInlineMarkdownText(item)}</li>`).join('')}</${listType}>`;
        listItems = [];
        listType = '';
    }

    function flushCodeBlock() {
        const langClass = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : '';
        html += `<pre><code${langClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
        codeLang = '';
        codeLines = [];
    }

    lines.forEach(line => {
        const codeFence = line.match(/^```([a-zA-Z0-9_-]*)\s*$/);
        if (inCodeBlock) {
            if (codeFence) {
                inCodeBlock = false;
                flushCodeBlock();
                return;
            }
            codeLines.push(line);
            return;
        }

        if (codeFence) {
            flushParagraph();
            flushList();
            inCodeBlock = true;
            codeLang = codeFence[1] || '';
            return;
        }

        if (!line.trim()) {
            flushParagraph();
            flushList();
            return;
        }

        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
            flushParagraph();
            flushList();
            const level = heading[1].length;
            html += `<h${level}>${renderInlineMarkdownText(heading[2].trim())}</h${level}>`;
            return;
        }

        if (/^\s*---+\s*$/.test(line)) {
            flushParagraph();
            flushList();
            html += '<hr>';
            return;
        }

        const unordered = line.match(/^\s*[-*]\s+(.+)$/);
        const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
        if (unordered || ordered) {
            flushParagraph();
            const nextType = unordered ? 'ul' : 'ol';
            if (listType && listType !== nextType) {
                flushList();
            }
            listType = nextType;
            listItems.push((unordered || ordered)[1].trim());
            return;
        }

        const quote = line.match(/^>\s?(.+)$/);
        if (quote) {
            flushParagraph();
            flushList();
            html += `<blockquote>${renderInlineMarkdownText(quote[1].trim())}</blockquote>`;
            return;
        }

        paragraphLines.push(line.trim());
    });

    if (inCodeBlock) {
        flushCodeBlock();
    }
    flushParagraph();
    flushList();
    return html;
}

function sanitizeInlineAiHtml(html) {
    if (typeof document === 'undefined') {
        return String(html || '');
    }

    const template = document.createElement('template');
    template.innerHTML = html || '';

    function walk(parent) {
        Array.from(parent.children).forEach(node => {
            const tag = node.tagName.toLowerCase();
            if (!SAFE_MARKDOWN_TAGS.has(tag)) {
                node.replaceWith(document.createTextNode(node.textContent || ''));
                return;
            }

            Array.from(node.attributes).forEach(attr => {
                const name = attr.name.toLowerCase();
                const allowed = SAFE_MARKDOWN_ATTRS[tag] && SAFE_MARKDOWN_ATTRS[tag].has(name);
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

function renderInlineMarkdown(content) {
    const source = String(content || '');
    if (!source.trim()) return '';

    const markedApi = typeof globalThis !== 'undefined' ? globalThis.marked : null;
    const html = typeof markedApi === 'function'
        ? markedApi(source)
        : markedApi && typeof markedApi.parse === 'function'
            ? markedApi.parse(source)
            : renderInlineMarkdownFallback(source);

    return sanitizeInlineAiHtml(html);
}

function createInlineAiState() {
    return {
        visible: false,
        loading: false,
        taskKey: '',
        title: '',
        subtitle: '',
        statusText: '',
        result: '',
        error: '',
        canApply: false,
        applyLabel: '应用结果'
    };
}

function resetInlineAiState(state) {
    Object.assign(state, createInlineAiState());
}

function setInlineAiGuide(state, options = {}) {
    resetInlineAiState(state);
    Object.assign(state, {
        visible: true,
        taskKey: options.taskKey || 'guide',
        title: options.title || 'FeHelper AI',
        subtitle: options.subtitle || '',
        statusText: options.statusText || '',
        result: options.result || '',
        canApply: !!options.canApply,
        applyLabel: options.applyLabel || '应用结果'
    });
}

function clipTextForPrompt(text, limit = MAX_CONTEXT_LENGTH) {
    const value = text == null ? '' : String(text);
    if (value.length <= limit) return value;
    const head = value.slice(0, Math.floor(limit * 0.72));
    const tail = value.slice(value.length - Math.floor(limit * 0.22));
    return `${head}\n\n[FeHelper 已截断中间 ${value.length - head.length - tail.length} 个字符]\n\n${tail}`;
}

function formatSection(label, value) {
    const content = clipTextForPrompt(value || '');
    if (!content.trim()) return '';
    return `## ${label}\n${content}`;
}

function formatMeta(meta = {}) {
    const lines = Object.entries(meta)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `- ${key}: ${value}`);
    return lines.length ? `## 当前工具状态\n${lines.join('\n')}` : '';
}

function buildToolAiMessages(toolKey, request = {}) {
    const pack = getAiFeaturePack(toolKey);
    const systemContext = [
        pack && pack.systemContext,
        INLINE_AI_RULES,
        request.systemContext
    ].filter(Boolean).join('\n\n');

    const userContent = [
        `# ${request.title || (pack && pack.title) || 'FeHelper AI 任务'}`,
        request.instruction || request.action || (pack && pack.prompt) || '',
        formatMeta(request.meta),
        formatSection(request.inputLabel || '当前输入', request.input),
        formatSection(request.resultLabel || '当前结果', request.result),
        request.outputHint ? `## 输出要求\n${request.outputHint}` : ''
    ].filter(Boolean).join('\n\n');

    return [
        { role: 'system', content: systemContext || INLINE_AI_RULES },
        { role: 'user', content: userContent }
    ];
}

function formatInlineStatus(payload) {
    if (!payload || payload.provider !== 'builtin') return '';
    const status = payload.status || 'available';
    if (status === 'downloading') {
        const progress = typeof payload.progress === 'number'
            ? Math.round(Math.max(0, Math.min(1, payload.progress)) * 100)
            : 0;
        return progress > 0 && progress < 100
            ? `${STATUS_TEXT.downloading}（${progress}%）`
            : STATUS_TEXT.downloading;
    }
    return payload.message || STATUS_TEXT[status] || STATUS_TEXT.available;
}

function formatInlineError(error) {
    const message = error && error.message ? error.message : String(error || '');
    if (message.startsWith('BUILTIN_AI_UNAVAILABLE:')) {
        return message.replace('BUILTIN_AI_UNAVAILABLE:', '');
    }
    if (message.startsWith('NO_API_KEY:')) {
        return '当前 AI 服务未配置 API Key，请先到 AI 设置页完成配置。';
    }
    return message || 'AI 请求失败，请稍后重试。';
}

async function runInlineToolAi(state, request = {}) {
    resetInlineAiState(state);
    Object.assign(state, {
        visible: true,
        loading: true,
        taskKey: request.taskKey || '',
        title: request.title || 'FeHelper AI',
        subtitle: request.subtitle || '',
        result: request.initialResult || '',
        canApply: !!request.canApply,
        applyLabel: request.applyLabel || '应用结果',
        statusText: request.initialResult ? '已完成本地诊断，正在生成 AI 解释' : '正在准备本机 AI'
    });

    const messages = buildToolAiMessages(request.toolKey, request);
    try {
        await AI.askCoderLLM(messages, (respJson, done) => {
            if (done) {
                state.loading = false;
                state.statusText = state.result ? '生成完成' : '本次没有返回内容';
                return;
            }
            if (respJson && respJson.type === 'status') {
                state.statusText = formatInlineStatus(respJson);
                return;
            }
            if (respJson && typeof respJson.content === 'string') {
                state.result = respJson.content;
                state.statusText = '正在生成';
            }
        }, null, request.provider || 'builtin');
    } catch (error) {
        state.loading = false;
        if (request.preserveInitialResultOnError && state.result) {
            state.error = '';
            state.statusText = request.fallbackStatusText || 'AI 请求失败，已保留当前结果';
            return;
        }
        state.error = formatInlineError(error);
        state.statusText = '请求失败';
    }
}

function extractFirstCodeBlock(text, preferredLanguage) {
    const source = String(text || '');
    const blocks = [];
    const reg = /```([a-zA-Z0-9_-]*)\s*\n([\s\S]*?)```/g;
    let match;
    while ((match = reg.exec(source))) {
        blocks.push({
            lang: (match[1] || '').toLowerCase(),
            code: (match[2] || '').trim()
        });
    }
    if (!blocks.length) return '';
    if (preferredLanguage) {
        const target = preferredLanguage.toLowerCase();
        const found = blocks.find(block => block.lang === target);
        if (found) return found.code;
    }
    return blocks[0].code;
}

function extractJsonCandidate(text) {
    const code = extractFirstCodeBlock(text, 'json') || extractFirstCodeBlock(text);
    if (code) return code;

    const source = String(text || '').trim();
    const objectStart = source.indexOf('{');
    const objectEnd = source.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
        return source.slice(objectStart, objectEnd + 1).trim();
    }
    const arrayStart = source.indexOf('[');
    const arrayEnd = source.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
        return source.slice(arrayStart, arrayEnd + 1).trim();
    }
    return '';
}

async function copyInlineAiResult(state) {
    const text = state && state.result ? state.result : '';
    if (!text) return false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        state.statusText = '已复制 AI 结果';
        return true;
    }
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('Copy');
    document.body.removeChild(input);
    state.statusText = ok ? '已复制 AI 结果' : '复制失败';
    return ok;
}

function getInlineAiTaskFromUrl() {
    try {
        return new URL(location.href).searchParams.get('aiTask') || '';
    } catch {
        return '';
    }
}

export {
    createInlineAiState,
    resetInlineAiState,
    setInlineAiGuide,
    runInlineToolAi,
    buildToolAiMessages,
    clipTextForPrompt,
    extractFirstCodeBlock,
    extractJsonCandidate,
    copyInlineAiResult,
    getInlineAiTaskFromUrl,
    renderInlineMarkdown,
    sanitizeInlineAiHtml
};
