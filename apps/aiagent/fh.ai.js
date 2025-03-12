/**
 * 用零一万物大模型来进行流式问答输出
 */
let AI = (() => {
    const defaultKey = '1aaea43f7d0d42a6ba63396d8be508ff';

    async function streamChatCompletions(prompt,receivingCallback,apiKey) {
        const url = 'https://api.lingyiwanwu.com/v1/chat/completions';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey || defaultKey}`
            },
            body: JSON.stringify({
                model: "yi-large",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                stream: true
            })
        };
    
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            // 创建一个ReadableStream用于处理流式数据
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
    
            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    // 将接收到的数据块解码为字符串，并假设每一行都是一个独立的JSON对象
                    const lines = decoder.decode(value, { stream: true }).split('\n').filter(line => line.trim() !== '');
                    for (const line of lines) {
                        try {
                            // 解析每一行作为单独的JSON对象
                            const message = JSON.parse(line.replace(/^data:\s+/,''));
                            receivingCallback && receivingCallback(message);
                        } catch (jsonError) {
                            console.log(line)
                            if(line === 'data: [DONE]'){
                                receivingCallback && receivingCallback(null,true);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching chat completions:', error);
        }
    }
    
    return {askYiLarge: streamChatCompletions};
})();


export default AI;