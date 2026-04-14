/**
 * FeHelper Offscreen AI 执行层
 * 在隐藏的 extension page 中调用 Chrome Prompt API（不支持 Service Worker）
 */

const LM = typeof LanguageModel !== 'undefined'
    ? LanguageModel
    : (self.ai && self.ai.languageModel) || null;

let sessionCache = new Map();

async function checkAvailability() {
    if (!LM) return 'unsupported';
    try {
        return await LM.availability();
    } catch {
        return 'unsupported';
    }
}

async function getOrCreateSession(key, opts = {}) {
    if (sessionCache.has(key)) {
        try {
            const cached = sessionCache.get(key);
            // 简单探活：如果 session 已被销毁会抛异常
            if (cached && typeof cached.prompt === 'function') return cached;
        } catch { sessionCache.delete(key); }
    }

    if (!LM) throw new Error('BUILTIN_AI_NOT_SUPPORTED');

    const avail = await LM.availability();
    if (avail === 'unavailable') throw new Error('MODEL_UNAVAILABLE');

    const session = await LM.create(opts);
    sessionCache.set(key, session);
    return session;
}

async function runTask(request) {
    const { task, payload } = request;
    const { prompt, systemPrompt, options = {} } = payload;

    const sessionKey = task + ':' + (systemPrompt || '').slice(0, 40);
    const sessionOpts = {};
    if (systemPrompt) sessionOpts.systemPrompt = systemPrompt;

    const session = await getOrCreateSession(sessionKey, sessionOpts);

    const promptOpts = {};
    if (options.responseConstraint) {
        promptOpts.responseConstraint = options.responseConstraint;
    }

    const result = await session.prompt(prompt, promptOpts);
    return { text: result, provider: 'builtin-chrome' };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.target !== 'offscreen') return;

    if (request.type === 'fh-ai-offscreen-check') {
        checkAvailability().then(
            status => sendResponse({ ok: true, availability: status }),
            err => sendResponse({ ok: false, availability: 'unsupported', error: String(err) })
        );
        return true;
    }

    if (request.type === 'fh-ai-offscreen-run') {
        runTask(request).then(
            data => sendResponse({ ok: true, requestId: request.requestId, data }),
            err => sendResponse({
                ok: false,
                requestId: request.requestId,
                error: { code: err.message || 'UNKNOWN', message: String(err) }
            })
        );
        return true;
    }
});
