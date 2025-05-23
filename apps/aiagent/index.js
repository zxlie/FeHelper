/**
 * ChatGPT工具
 * @author zhaoxianlie
 */

import AI from './fh.ai.js';

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
        showHistoryPanel: false
    },
    computed: {
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
        // 加载本地历史
        const local = localStorage.getItem('fh-aiagent-history');
        if(local){
            try {
                this.history = JSON.parse(local);
            } catch(e) {}
        }
    },
    methods: {
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
            if(this.undergoing) return;
            if(this.respResult.id){
                // 先存储上一轮对话到历史
                this.history.push({
                    id: this.respResult.id,
                    sendTime: this.respResult.sendTime,
                    message: this.respResult.message,
                    respTime: this.respResult.respTime,
                    respContent: this.respResult.respContent
                });
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

            AI.askCoderLLM(this.messages, (respJson, done) => {
                if(done){
                    this.undergoing = false;
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
                let id = respJson.id;
                let rawContent = respJson.content || '';
                // 检查多轮代码补全场景
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
                respContent = marked(respContent);
                if(this.tempId !== id) {
                    this.tempId = id;
                    let dateTime = new Date(respJson.created * 1000);
                    let respTime = dateTime.format('yyyy/MM/dd HH:mm:ss');
                    this.respResult = { id,sendTime,message:prompt,respTime,respContent };
                    // 新增：助手回复push到currentSession
                    this.currentSession.push({
                        role: 'assistant',
                        id,
                        time: respTime,
                        content: respContent
                    });
                }else{
                    this.respResult.respContent = respContent;
                    // 更新最后一条助手消息内容
                    if(this.currentSession.length && this.currentSession[this.currentSession.length-1].role==='assistant'){
                        this.currentSession[this.currentSession.length-1].content = respContent;
                    }
                }
                this.$nextTick(() => this.scrollToBottom());
            });            
        },

        scrollToBottom(){
            this.$refs.boxResult.scrollTop = this.$refs.boxResult.scrollHeight;
        },
        goChat(){
            this.sendMessage(this.prompt);
            this.$nextTick(() => this.prompt='');
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

        loadHistory(item) {
            // 渲染到主面板
            this.respResult = {
                id: item.id,
                sendTime: item.sendTime,
                message: item.message,
                respTime: item.respTime,
                respContent: item.respContent
            };
            this.showHistoryPanel = false;
            this.$nextTick(() => this.scrollToBottom());
        },

        startNewChat(event) {
            event && event.preventDefault();
            this.messages = [];
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


