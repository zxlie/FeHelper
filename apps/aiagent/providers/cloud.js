/**
 * 云端 LLM provider（SiliconFlow）
 * 从原 fh.ai.js 抽离，保持 SSE 流式输出能力
 */

import EncodeUtils from '../../en-decode/endecode-lib.js';

const DEFAULT_KEY = 'c2stamJ5eGlldmVmdmhnbnBnbGF3cmxlZ25uam9rY25kc3BpYndjZmh1d2Ntbm9jbmxp';
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

const SYSTEM_PROMPT = {
    role: 'system',
    content: '你是由FeHelper提供的，一个专为开发者服务的AI助手。' +
        '你的目标是精准理解开发者的技术需求，并以最简洁、直接、专业的方式输出高质量代码，并且保证代码的完整性。' +
        '请避免无关的解释和冗余描述，只输出开发者真正需要的代码和必要的技术要点说明。' +
        '遇到不明确的需求时，优先追问关键细节，绝不输出与开发无关的内容。' +
        '如果生成的是代码，一定要用```的markdown代码块包裹，并使用markdown语法渲染。'
};

function buildMessages(messages) {
    if (typeof messages === 'string') {
        return [SYSTEM_PROMPT, { role: 'user', content: messages }];
    }
    if (Array.isArray(messages)) {
        const has = messages.some(m => m.role === 'system');
        return has ? messages : [SYSTEM_PROMPT, ...messages];
    }
    return [SYSTEM_PROMPT];
}

export default {

    /**
     * @param {string|Array} messages
     * @param {function} receivingCallback - (msg, done)
     * @param {object} opts - { apiKey }
     */
    async ask(messages, receivingCallback, opts = {}) {
        const msgs = buildMessages(messages);
        const apiKey = opts.apiKey || EncodeUtils.base64Decode(DEFAULT_KEY);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'Qwen/Qwen2.5-Coder-7B-Instruct',
                messages: msgs,
                stream: true,
                max_tokens: 4096,
                enable_thinking: true,
                thinking_budget: 4096,
                min_p: 0.05,
                temperature: 0.7,
                top_p: 0.7,
                top_k: 50,
                frequency_penalty: 0.5,
                n: 1,
                response_format: { type: 'text' }
            })
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
                        if (obj.choices?.[0]?.delta) {
                            msg.id = obj.id;
                            msg.created = obj.created;
                            msg.content += obj.choices[0].delta.content;
                            receivingCallback && receivingCallback(msg);
                        }
                    } catch {}
                }
            }
        }
        receivingCallback && receivingCallback(null, true);
    }
};
