/**
 * FeHelper AI 助手 - 流式问答
 * 支持 Chrome 内置 AI、SiliconFlow 及任意 OpenAI 兼容服务
 */

const PROVIDERS = {
    builtin: {
        name: 'Chrome 内置 AI',
        model: 'Gemini Nano',
        needsKey: false,
        local: true
    },
    siliconflow: {
        name: 'SiliconFlow',
        url: 'https://api.siliconflow.cn/v1/chat/completions',
        model: 'Qwen/Qwen2.5-Coder-7B-Instruct',
        needsKey: true,
        signupUrl: 'https://cloud.siliconflow.cn'
    },
    custom: {
        name: '自定义 (OpenAI 兼容)',
        url: '',
        model: '',
        needsKey: true
    }
};

const SYSTEM_PROMPT = {
    role: 'system',
    content: '你是由FeHelper提供的，一个专为开发者服务的AI助手。' +
        '你的目标是精准理解开发者的技术需求，并以最简洁、直接、专业的方式输出高质量代码，并且保证代码的完整性。' +
        '请避免无关的解释和冗余描述，只输出开发者真正需要的代码和必要的技术要点说明。' +
        '遇到不明确的需求时，优先追问关键细节，绝不输出与开发无关的内容。' +
        '如果生成的是代码，一定要用```的markdown代码块包裹，并使用markdown语法渲染。'
};

let AI = (() => {

    function isBuiltInPromptSupported() {
        return typeof globalThis !== 'undefined' && !!globalThis.LanguageModel;
    }

    function getDefaultProvider(data) {
        if (data && data.fh_ai_apikey) {
            return 'siliconflow';
        }
        return isBuiltInPromptSupported() ? 'builtin' : 'siliconflow';
    }

    function buildMessages(messages) {
        if (typeof messages === 'string') {
            return [SYSTEM_PROMPT, { role: 'user', content: messages }];
        }
        if (Array.isArray(messages)) {
            const systemMessages = messages
                .filter(item => item && item.role === 'system' && typeof item.content === 'string' && item.content.trim())
                .filter(item => item.content !== SYSTEM_PROMPT.content)
                .map(item => item.content.trim());
            const conversationMessages = messages
                .filter(item => item && item.role && item.role !== 'system' && typeof item.content === 'string');
            const systemContent = systemMessages.length
                ? `${SYSTEM_PROMPT.content}\n\n${systemMessages.join('\n\n')}`
                : SYSTEM_PROMPT.content;
            return [{ role: 'system', content: systemContent }, ...conversationMessages];
        }
        return [SYSTEM_PROMPT];
    }

    function buildPromptParts(messages) {
        const source = buildMessages(messages);
        return {
            initialPrompts: source
                .filter(item => item && item.role === 'system' && typeof item.content === 'string')
                .map(item => ({
                    role: item.role,
                    content: item.content
                })),
            conversation: source
                .filter(item => item && item.role && item.role !== 'system' && typeof item.content === 'string')
                .map(item => ({
                    role: item.role,
                    content: item.content
                }))
        };
    }

    function buildConversation(messages) {
        return buildPromptParts(messages).conversation
            .map(item => ({
                role: item.role,
                content: item.content
            }));
    }

    function getNowCreated() {
        return Math.floor(Date.now() / 1000);
    }

    function emitStatus(receivingCallback, status, progress, message) {
        receivingCallback && receivingCallback({
            type: 'status',
            provider: 'builtin',
            status,
            progress,
            message
        });
    }

    function createBuiltInError(message) {
        const err = new Error(`BUILTIN_AI_UNAVAILABLE:${message}`);
        err.code = 'BUILTIN_AI_UNAVAILABLE';
        return err;
    }

    function stringifyStreamChunk(chunk) {
        if (typeof chunk === 'string') {
            return chunk;
        }
        if (!chunk) {
            return '';
        }
        if (typeof chunk === 'object') {
            return chunk.content || chunk.text || chunk.value || '';
        }
        return String(chunk);
    }

    async function getBuiltInAvailability() {
        if (!isBuiltInPromptSupported()) {
            return {
                supported: false,
                availability: 'unsupported',
                message: '当前浏览器不支持 Chrome 内置 AI，请使用 Chrome 138+ 或切换云端服务。'
            };
        }
        try {
            const availability = await globalThis.LanguageModel.availability();
            return {
                supported: true,
                availability,
                message: ''
            };
        } catch (err) {
            return {
                supported: true,
                availability: 'error',
                message: err && err.message ? err.message : '检测 Chrome 内置 AI 状态失败。'
            };
        }
    }

    /**
     * 从 chrome.storage.local 读取用户配置
     */
    function getConfig() {
        return new Promise(resolve => {
            chrome.storage.local.get(['fh_ai_provider', 'fh_ai_apikey', 'fh_ai_custom_url', 'fh_ai_custom_model'], data => {
                resolve({
                    provider: data.fh_ai_provider || getDefaultProvider(data),
                    apiKey: data.fh_ai_apikey || '',
                    customUrl: data.fh_ai_custom_url || '',
                    customModel: data.fh_ai_custom_model || ''
                });
            });
        });
    }

    function saveConfig(cfg) {
        return new Promise(resolve => {
            chrome.storage.local.set({
                fh_ai_provider: cfg.provider,
                fh_ai_apikey: cfg.apiKey,
                fh_ai_custom_url: cfg.customUrl || '',
                fh_ai_custom_model: cfg.customModel || ''
            }, resolve);
        });
    }

    async function askBuiltInLLM(messages, receivingCallback) {
        if (!isBuiltInPromptSupported()) {
            throw createBuiltInError('当前浏览器不支持 Chrome 内置 AI，请使用 Chrome 138+ 或切换云端服务。');
        }

        const availability = await globalThis.LanguageModel.availability();
        emitStatus(receivingCallback, availability, undefined, '');

        if (availability === 'unavailable') {
            throw createBuiltInError('当前设备暂不满足 Chrome 内置 AI 运行条件，请切换 SiliconFlow 或自定义服务。');
        }

        const promptParts = buildPromptParts(messages);
        const msg = {
            id: `builtin-${Date.now()}`,
            created: getNowCreated(),
            content: ''
        };
        let session;

        try {
            session = await globalThis.LanguageModel.create({
                initialPrompts: promptParts.initialPrompts,
                monitor(monitor) {
                    monitor.addEventListener('downloadprogress', event => {
                        emitStatus(receivingCallback, 'downloading', event.loaded || 0, 'Chrome 正在下载本机 AI 模型。');
                    });
                }
            });

            emitStatus(receivingCallback, 'available', 1, '');

            if (typeof session.promptStreaming === 'function') {
                const stream = session.promptStreaming(promptParts.conversation);
                for await (const chunk of stream) {
                    const text = stringifyStreamChunk(chunk);
                    if (!text) continue;
                    msg.content += text;
                    receivingCallback && receivingCallback(msg);
                }
            } else {
                const result = await session.prompt(promptParts.conversation);
                msg.content = stringifyStreamChunk(result);
                receivingCallback && receivingCallback(msg);
            }

            receivingCallback && receivingCallback(null, true);
        } finally {
            if (session && typeof session.destroy === 'function') {
                session.destroy();
            }
        }
    }

    async function prepareBuiltInModel(receivingCallback) {
        if (!isBuiltInPromptSupported()) {
            throw createBuiltInError('当前浏览器不支持 Chrome 内置 AI，请使用 Chrome 138+ 或切换云端服务。');
        }

        const availability = await globalThis.LanguageModel.availability();
        emitStatus(receivingCallback, availability, undefined, '');

        if (availability === 'unavailable') {
            throw createBuiltInError('当前设备暂不满足 Chrome 内置 AI 运行条件，请切换 SiliconFlow 或自定义服务。');
        }

        let session;
        try {
            session = await globalThis.LanguageModel.create({
                initialPrompts: [SYSTEM_PROMPT],
                monitor(monitor) {
                    monitor.addEventListener('downloadprogress', event => {
                        emitStatus(receivingCallback, 'downloading', event.loaded || 0, 'Chrome 正在下载本机 AI 模型。');
                    });
                }
            });
            emitStatus(receivingCallback, 'available', 1, 'Chrome 内置 AI 已可用。');
            return getBuiltInAvailability();
        } finally {
            if (session && typeof session.destroy === 'function') {
                session.destroy();
            }
        }
    }

    /**
     * 流式问答
     */
    async function askCoderLLM(messages, receivingCallback, apiKey, providerOverride) {
        if (providerOverride === 'builtin') {
            return askBuiltInLLM(messages, receivingCallback);
        }

        const config = await getConfig();
        const providerKey = providerOverride || config.provider || 'siliconflow';
        const provider = PROVIDERS[providerKey] || PROVIDERS.siliconflow;

        if (providerKey === 'builtin') {
            return askBuiltInLLM(messages, receivingCallback);
        }

        const key = apiKey || config.apiKey;
        if (!key) {
            const signupUrl = provider.signupUrl || 'https://cloud.siliconflow.cn';
            throw new Error(`NO_API_KEY:${providerKey}:${signupUrl}`);
        }

        const url = providerKey === 'custom' ? (config.customUrl || provider.url) : provider.url;
        const model = providerKey === 'custom' ? (config.customModel || provider.model) : provider.model;
        const msgs = buildMessages(messages);

        const body = {
            model,
            messages: msgs,
            stream: true,
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 0.7
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let done = false;
        const msg = { id: '', content: '' };

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split('\n');
                buffer = lines.pop();
                for (let line of lines) {
                    line = line.trim();
                    if (!line || !line.startsWith('data:')) continue;
                    let jsonStr = line.replace(/^data:/, '').trim();
                    if (jsonStr === '[DONE]') continue;
                    try {
                        let obj = JSON.parse(jsonStr);
                        if (obj.choices?.[0]?.delta?.content) {
                            msg.id = obj.id;
                            msg.created = obj.created;
                            msg.content += obj.choices[0].delta.content;
                            receivingCallback && receivingCallback(msg);
                        }
                    } catch (e) {}
                }
            }
        }
        receivingCallback && receivingCallback(null, true);
    }

    return { askCoderLLM, getConfig, saveConfig, getBuiltInAvailability, prepareBuiltInModel, isBuiltInPromptSupported, PROVIDERS };
})();

export default AI;
