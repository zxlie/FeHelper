/**
 * FeHelper AI 路由层
 * 管理 offscreen document 生命周期，转发 AI 请求，定义任务 prompt 模板
 */

let offscreenCreating = null;

async function ensureOffscreenDocument() {
    const path = 'offscreen/ai.html';
    const offscreenUrl = chrome.runtime.getURL(path);

    const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });
    if (contexts.length > 0) return;

    if (!offscreenCreating) {
        offscreenCreating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['DOM_PARSER'],
            justification: 'Run Chrome built-in Prompt API in a window context'
        }).finally(() => { offscreenCreating = null; });
    }
    await offscreenCreating;
}

// ─── 任务 prompt 模板 ────────────────────────────────────────────

const TASK_TEMPLATES = {

    'summarize-text': {
        systemPrompt: 'You are a concise text analysis assistant. Always respond in the same language as the input text.',
        buildPrompt: text =>
            `Summarize the following text:\n1) A brief summary (2-3 sentences)\n2) Key points as a bullet list\n\n---\n${text}`,
    },

    'summarize-json': {
        systemPrompt: 'You are a JSON data analyst. Describe structures and contents clearly. Respond in the same language as any human-readable values in the JSON, or in English if values are purely technical.',
        buildPrompt: text =>
            `Analyze this JSON data. Describe its structure, key fields, and summarize the content:\n\n${text}`,
        responseConstraint: {
            type: 'object',
            properties: {
                structure: { type: 'string' },
                fields: { type: 'array', items: { type: 'string' } },
                summary: { type: 'string' },
                issues: { type: 'array', items: { type: 'string' } }
            },
            required: ['structure', 'summary']
        }
    },

    'classify-console-error': {
        systemPrompt: 'You are a web development debugging assistant. Classify errors precisely and suggest actionable fixes. Respond in the same language as the surrounding text of the error.',
        buildPrompt: text =>
            `Classify this console error and suggest a fix:\n\n${text}`,
        responseConstraint: {
            type: 'object',
            properties: {
                category: { type: 'string', enum: ['syntax', 'runtime', 'network', 'security', 'resource', 'other'] },
                severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                summary: { type: 'string' },
                suggestedFix: { type: 'string' }
            },
            required: ['category', 'severity', 'summary', 'suggestedFix']
        }
    },

    'extract-fields': {
        systemPrompt: 'You are a data extraction assistant. Extract structured key-value fields from unstructured text. Respond in the same language as the input.',
        buildPrompt: text =>
            `Extract all identifiable key-value fields from this text and list them:\n\n${text}`,
    },

    'rewrite-prompt': {
        systemPrompt: 'You are a prompt engineering assistant. Optimize prompts for clarity, specificity and effectiveness. Respond in the same language as the input prompt.',
        buildPrompt: text =>
            `Rewrite and optimize this prompt to be clearer and more effective:\n\n${text}`,
    },

    'free-chat': {
        systemPrompt: 'You are FeHelper AI assistant, a helpful coding and development assistant. Be concise and precise. Respond in the same language the user uses.',
        buildPrompt: text => text,
    }
};

// ─── 处理函数 ────────────────────────────────────────────────────

async function handleAiCheck(callback) {
    try {
        await ensureOffscreenDocument();
        const resp = await chrome.runtime.sendMessage({
            type: 'fh-ai-offscreen-check',
            target: 'offscreen'
        });
        callback(resp);
    } catch (err) {
        callback({ ok: false, availability: 'unsupported', error: String(err) });
    }
}

async function handleAiRun(request, callback) {
    const { task, payload } = request;
    const template = TASK_TEMPLATES[task] || TASK_TEMPLATES['free-chat'];

    try {
        await ensureOffscreenDocument();

        const prompt = template.buildPrompt(payload.text || '');
        const offscreenReq = {
            type: 'fh-ai-offscreen-run',
            target: 'offscreen',
            requestId: 'ai-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
            task,
            payload: {
                prompt,
                systemPrompt: template.systemPrompt,
                options: {}
            }
        };

        if (template.responseConstraint) {
            offscreenReq.payload.options.responseConstraint = template.responseConstraint;
        }

        const resp = await chrome.runtime.sendMessage(offscreenReq);
        callback(resp);
    } catch (err) {
        callback({
            ok: false,
            error: { code: 'ROUTER_ERROR', message: String(err) }
        });
    }
}

export default { handleAiRun, handleAiCheck };
