/**
 * Chrome 内置 Prompt API provider
 * 通过 background → offscreen 链路调用浏览器本地 AI 模型
 */

export default {

    async check() {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ type: 'fh-ai-check' }, resp => {
                if (chrome.runtime.lastError) {
                    resolve({ ok: false, availability: 'unsupported' });
                    return;
                }
                resolve(resp || { ok: false, availability: 'unsupported' });
            });
        });
    },

    /**
     * @param {string|Array} messages - 用户输入文本或多轮消息数组
     * @param {function} receivingCallback - 回调 (msg, done)
     * @param {object} opts - { task, context }
     */
    async ask(messages, receivingCallback, opts = {}) {
        const text = typeof messages === 'string'
            ? messages
            : messages.filter(m => m.role === 'user').pop()?.content || '';

        const task = opts.task || 'free-chat';

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'fh-ai-run',
                provider: 'builtin-chrome',
                task,
                payload: {
                    text,
                    context: opts.context || {}
                }
            }, resp => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                if (resp && resp.ok) {
                    const msg = {
                        id: resp.requestId || ('local-' + Date.now()),
                        created: Math.floor(Date.now() / 1000),
                        content: resp.data.text
                    };
                    receivingCallback && receivingCallback(msg);
                    receivingCallback && receivingCallback(null, true);
                    resolve(msg);
                } else {
                    const err = resp?.error || { code: 'UNKNOWN', message: 'Built-in AI request failed' };
                    receivingCallback && receivingCallback(null, true);
                    reject(new Error(err.code + ': ' + err.message));
                }
            });
        });
    }
};
