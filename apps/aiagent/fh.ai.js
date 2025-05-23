import EncodeUtils from '../en-decode/endecode-lib.js';
/**
 * 用零一万物大模型来进行流式问答输出
 */
let AI = (() => {
    /**
     * 用 SiliconFlow 大模型（CoderVM）进行流式问答输出，支持多轮上下文对话
     * @param {Array} messages 聊天历史数组，每项格式: {role: 'user'|'assistant', content: string}
     * @param {function} receivingCallback 每次收到新内容时的回调，参数为 message 对象
     * @param {string} apiKey 可选，API Key
     * @example
     * const messages = [
     *   { role: 'user', content: '你好' },
     *   { role: 'assistant', content: '你好，有什么可以帮您？' },
     *   { role: 'user', content: '帮我写个排序算法' }
     * ];
     * AI.askCoderLLM(messages, callback);
     */
    async function askCoderLLM(messages, receivingCallback, apiKey) {
        // 默认插入system prompt
        const systemPrompt = {
            role: 'system',
            content: '你是由FeHelper提供的，一个专为开发者服务的AI助手。' +
            '你的目标是精准理解开发者的技术需求，并以最简洁、直接、专业的方式输出高质量代码，并且保证代码的完整性。' +
            '请避免无关的解释和冗余描述，只输出开发者真正需要的代码和必要的技术要点说明。' +
            '遇到不明确的需求时，优先追问关键细节，绝不输出与开发无关的内容。' +
            '如果生成的是代码，一定要用```的markdown代码块包裹，并使用markdown语法渲染。'
        };
        let msgs;
        if (typeof messages === 'string') {
            // 单轮对话，自动组装为数组
            msgs = [systemPrompt, { role: 'user', content: messages }];
        } else if (Array.isArray(messages)) {
            // 多轮对话，插入system prompt（如未包含）
            const hasSystemPrompt = messages.some(m => m.role === 'system' && m.content === systemPrompt.content);
            msgs = hasSystemPrompt ? messages : [systemPrompt, ...messages];
        } else {
            // 其他类型，降级为空对话
            msgs = [systemPrompt];
        }

        const defaultKey = 'c2stamJ5eGlldmVmdmhnbnBnbGF3cmxlZ25uam9rY25kc3BpYndjZmh1d2Ntbm9jbmxp';
        const url = 'https://api.siliconflow.cn/v1/chat/completions';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey || EncodeUtils.base64Decode(defaultKey)}`
            },
            body: JSON.stringify({
                "model": "Qwen/Qwen2.5-Coder-7B-Instruct",
                "messages": msgs, // 直接传递多轮历史
                "stream": true, // 开启流式输出
                "max_tokens": 4096,
                "enable_thinking": true,
                "thinking_budget": 4096,
                "min_p": 0.05,
                "stop": [],
                "temperature": 0.7,
                "top_p": 0.7,
                "top_k": 50,
                "frequency_penalty": 0.5,
                "n": 1,
                "response_format": {
                    "type": "text"
                }
            })
        };
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // 处理流式返回（text/event-stream）
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let done = false;
            const msg = {id:'',content:''};
            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    // 以换行分割，逐条处理
                    let lines = buffer.split('\n');
                    // 最后一行可能不完整，留到下次
                    buffer = lines.pop();
                    for (let line of lines) {
                        line = line.trim();
                        if (!line || !line.startsWith('data:')) continue;
                        let jsonStr = line.replace(/^data:/, '').trim();
                        if (jsonStr === '[DONE]') continue;
                        try {
                            let obj = JSON.parse(jsonStr);
                            if (obj.choices && obj.choices[0] && obj.choices[0].delta) {
                                msg.id = obj.id;
                                msg.created = obj.created;
                                msg.content += obj.choices[0].delta.content;
                                receivingCallback && receivingCallback(msg);
                            }
                        } catch (e) {
                            // 忽略解析失败的片段
                        }
                    }
                }
            }
            receivingCallback && receivingCallback(null,true);
        } catch (error) {
            console.error('Error fetching coderVM stream:', error);
        }
    }
    
    return {askCoderLLM};
})();


export default AI;

