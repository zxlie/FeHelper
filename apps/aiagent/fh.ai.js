/**
 * FeHelper AI 统一入口
 * provider 路由：builtin-chrome → cloud → export
 */

import BuiltinProvider from './providers/builtin-chrome.js';
import CloudProvider from './providers/cloud.js';

let AI = (() => {

    let _builtinStatus = null; // 缓存探测结果

    /**
     * 探测 Chrome 内置 AI 是否可用
     * @returns {Promise<string>} 'available' | 'downloadable' | 'downloading' | 'unavailable' | 'unsupported'
     */
    async function checkBuiltinAI() {
        try {
            const resp = await BuiltinProvider.check();
            _builtinStatus = resp?.ok ? resp.availability : 'unsupported';
        } catch {
            _builtinStatus = 'unsupported';
        }
        return _builtinStatus;
    }

    function getBuiltinStatus() {
        return _builtinStatus;
    }

    /**
     * 统一 AI 调用入口
     * @param {string|Array} messages - 用户输入或多轮消息
     * @param {function} receivingCallback - (msg, done) 流式/结果回调
     * @param {object} opts
     * @param {string} opts.provider - 'auto' | 'builtin-chrome' | 'cloud' | 'export'
     * @param {string} opts.task - 任务类型（仅 builtin-chrome 生效）
     * @param {string} opts.apiKey - 云端自定义 API Key
     * @param {object} opts.context - 页面上下文
     */
    async function ask(messages, receivingCallback, opts = {}) {
        let provider = opts.provider || 'auto';

        // auto 模式：内置可用则用内置，否则降级云端
        if (provider === 'auto') {
            if (_builtinStatus === null) await checkBuiltinAI();
            provider = _builtinStatus === 'available' ? 'builtin-chrome' : 'cloud';
        }

        switch (provider) {
            case 'builtin-chrome':
                return BuiltinProvider.ask(messages, receivingCallback, opts);

            case 'cloud':
                return CloudProvider.ask(messages, receivingCallback, opts);

            case 'export':
                return exportPromptBundle(messages, opts);

            default:
                throw new Error('Unknown AI provider: ' + provider);
        }
    }

    /**
     * 导出 prompt 到剪贴板（无 AI 可用时的降级方案）
     */
    function exportPromptBundle(messages, opts = {}) {
        let text;
        if (typeof messages === 'string') {
            text = messages;
        } else if (Array.isArray(messages)) {
            text = messages
                .filter(m => m.role !== 'system')
                .map(m => `[${m.role}] ${m.content}`)
                .join('\n\n');
        } else {
            text = String(messages);
        }

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }

        return {
            id: 'export-' + Date.now(),
            content: '💡 Prompt 已复制到剪贴板，请粘贴到你常用的 AI 工具中使用。\n\n---\n\n' + text
        };
    }

    /**
     * 向后兼容：直接调用云端 LLM
     */
    async function askCoderLLM(messages, receivingCallback, apiKey) {
        return ask(messages, receivingCallback, { provider: 'cloud', apiKey });
    }

    return { ask, askCoderLLM, checkBuiltinAI, getBuiltinStatus, exportPromptBundle };
})();

export default AI;
