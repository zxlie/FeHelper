/**
 * ChatGPT工具
 * @author zhaoxianlie
 */

import Awesome from '../background/awesome.js';

new Vue({
    el: '#pageContainer',
    data: {
        prompt: '',
        imgSize: '512x512',
        showImageSize:false,
        demos: [
            'FeHelper是什么？怎么安装？',
            '用Js写一个冒泡排序的Demo',
            'Js里的fetch API是怎么用的',
            '画一幅三只小猫玩毛线的画',
            '画一幅清明上河图'
        ],
        initMessage: {
            id:'id-test123',
            sendTime:'2022/12/20 12:12:12',
            message: '你好，可以告诉我你是谁吗？我该怎么和你沟通？',
            respTime: '2022/12/20 12:12:13',
            respContent: '你好，我是FeHelper智能助理，由OpenAI提供技术支持；你可以在下面的输入框向我提问，我会尽可能回答你~~~'
        },
        results:[],
        showLoading: false
    },
    mounted: function () {
        this.$refs.prompt.focus();
        Awesome.StorageMgr.get('CHATGPT_CONVERSATION').then(results => {
            if(results && results.length) {
                this.results = results;
                this.$nextTick(() => {
                    // 页面上的代码，直接高亮出来显示
                    document.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightBlock(block);
                    });
                    // 确保图片加载完以后，页面能滚动到最底部
                    document.querySelectorAll('img.gpt-image').forEach(img => {
                        img.addEventListener('load',e => {
                            this.scrollToBottom();
                        },false);
                    });
                    this.letMsgScrollIntoView();
                });
            }else{
                this.results.push(this.initMessage);
            }
        });
        Awesome.StorageMgr.get('CHATGPT_IMAGE_SIZE').then(size => {
            this.imgSize = size || '512x512';
        });
    },
    methods: {
        chatWithOpenAI(configs){
            if(this.showLoading) return;
            let sendTime = (new Date()).toLocaleDateString() + ' ' + (new Date()).toLocaleTimeString();
            // 先加入队列，先展示，获取成功后会移除
            this.results.push({sendTime,message:configs.data.prompt});
            this.toggleLoading();
            this.$nextTick(() => {
                this.letMsgScrollIntoView();
            });

            // 开始发送真实的消息
            return fetch(configs.url, {
                method: 'POST',
                body: JSON.stringify(configs.data),
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': ['Be','arer',' s','k-4BTm','dqam4xCSQ','rWFyM','j1T3Bl','bkFJU','el2gggF','n291PJ','AWs','fvQ'].join('')
                }
            })
            .then(resp => resp.json())
            .then(json => {
                let id = json.id || `gptimg-${new Date*1}`;
                let dateTime = new Date(json.created * 1000);
                let respTime = dateTime.toLocaleDateString() + ' ' + dateTime.toLocaleTimeString();

                return configs.buildResponse(json).then(respContent => {
                    this.results.pop(); // 把最后一个节点移除掉，重新添加一个干净的
                    this.results.push({ id,sendTime,message:configs.data.prompt,respTime,respContent });
                    this.saveConversation();
                    this.toggleLoading();
                    this.$nextTick(() => {
                        let elm = document.getElementById(id);
                        elm.querySelectorAll('pre code').forEach((block) => {
                            hljs.highlightBlock(block);
                        });
                        elm.scrollIntoView();
                    });
                    return json;
                });
            });
        },
        sendMessage(message){
            if(/画一幅/.test(message)) {
                return this.drawImage(message);
            }
            this.chatWithOpenAI({
                url:'https://api.openai.com/v1/completions',
                data: {model:'text-davinci-003',temperature:0,max_tokens:2048,prompt:message},
                buildResponse: json => {
                    return new Promise(resolve => {
                        return resolve(marked(json.choices[0].text));
                    });
                }
            });
        },
        drawImage(message){
            this.chatWithOpenAI({
                url:'https://api.openai.com/v1/images/generations',
                data: {prompt:message,n:1,size: this.imgSize || '512x512'},
                buildResponse: json => {
                    return this.imageBase64(json.data[0].url).then(dataURI => {
                        return `<img src="${dataURI}" alt="图片" class="gpt-image" />`;
                    });
                }
            });
        },
        saveConversation(){
            Awesome.StorageMgr.set('CHATGPT_CONVERSATION',this.results);
        },
        toggleLoading(){
            this.showLoading = !this.showLoading;
        },
        letMsgScrollIntoView(){
            Array.from(document.querySelectorAll('td.td-content')).pop().scrollIntoView();
        },
        scrollToBottom(){
            this.$refs.boxResult.scrollTop = this.$refs.boxResult.scrollHeight;
        },
        goChat(){
            if(this.showLoading) return false;
            this.sendMessage(this.prompt);
            this.$nextTick(() => this.prompt='');
        },
        demoTry(){
            this.$refs.boxResult.scrollTop = 0;
        },
        msgClean(){
            if(confirm('防止误操作，你确定要清空所有消息吗？不可恢复哦！')) {
                this.results = [];
                this.saveConversation();
            }
        },
        showImgSizePanel(){
            this.showImageSize = !this.showImageSize;
        },
        sureImgSize(){
            this.showImageSize = false;
            Awesome.StorageMgr.set('CHATGPT_IMAGE_SIZE',this.imgSize);
        },
        imageBase64(onlineSrc) {
            let that = this;
            return new Promise((resolve,reject) => {
                let image = new Image();
                image.onload = function () {
                    let width = this.naturalWidth;
                    let height = this.naturalHeight;
                    (function createCanvasContext(img, t, l, w, h) {
                        let canvas = document.createElement('canvas');
                        canvas.setAttribute('id', 'qr-canvas');
                        canvas.height = h;
                        canvas.width = w;
                        let context = canvas.getContext('2d');
                        context.fillStyle = 'rgb(255,255,255)';
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        context.drawImage(img, l, t, w, h, 0, 0, w, h);

                        resolve(canvas.toDataURL());
                    })(image, 0, 0, width, height);
                };
                image.onerror = function () {
                    reject();
                };
                image.src = onlineSrc;
            });
        }
    }

});
