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
            'FeHelper是什么？怎么安装？',
            '用Js写一个冒泡排序的Demo',
            'Js里的Fetch API是怎么用的'
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
        tempId:'',
        hideDemo: false
    },
    mounted: function () {
        this.$refs.prompt.focus();
        this.hideDemo = !!(new URL(location.href)).searchParams.get('hideDemo');
    },
    methods: {

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
            let sendTime = (new Date()).format('yyyy/MM/dd HH:mm:ss');
            this.$nextTick(() => {
                this.scrollToBottom();
            });

            this.tempId = '';
            let respContent = '';
            AI.askYiLarge(prompt,(respJson,done) => {
                if(done){
                    return;
                }
                let id = respJson.id;
                respContent = respJson.content || '';
                if(!this.validateCodeBlocks(respContent)) {
                    respContent += '\n```';
                }
                respContent = marked(respContent);
                if(this.tempId !== id) {
                    this.tempId = id;
                    let dateTime = new Date(respJson.created * 1000);
                    let respTime = dateTime.format('yyyy/MM/dd HH:mm:ss');
                    this.respResult = { id,sendTime,message:prompt,respTime,respContent };
                }else{
                    this.respResult.respContent = respContent;
                }
                
                this.$nextTick(() => {
                    let elm = document.getElementById(id);
                    elm.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightBlock(block);
                    });
                    this.scrollToBottom();
                });
            });            
        },

        scrollToBottom(){
            this.$refs.boxResult.scrollTop = this.$refs.boxResult.scrollHeight;
        },
        goChat(){
            this.sendMessage(this.prompt);
            this.$nextTick(() => this.prompt='');
        }
    }

});
