/**
 * ChatGPT工具
 * @author zhaoxianlie
 */

import Awesome from '../background/awesome.js';
import EncodeUtils from '../en-decode/endecode-lib.js';

new Vue({
    el: '#pageContainer',
    data: {
        prompt: '',
        imgSize: '512x512',
        chatModel: 'text-davinci-003',
        showSettingPanel:false,
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
        showLoading: false,
        authKey: ''
    },
    mounted: function () {
        this.$refs.prompt.focus();
        this.authKey = this.decodeAuthKey(this.$refs.prompt.getAttribute('data-key'));
        // 如果本地有存储过authKey，就优先用本地的
        Awesome.StorageMgr.get('CHATGPT_AUTH_KEY').then(authKey => {
            this.authKey = authKey || this.authKey;
        });

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
        Awesome.StorageMgr.get('CHATGPT_CHAT_MODEL').then(model => {
            this.chatModel = model || 'text-davinci-003';
        });
        Awesome.StorageMgr.get('CHATGPT_IMAGE_SIZE').then(size => {
            this.imgSize = size || '512x512';
        });

    },
    methods: {
        chatWithOpenAI(configs){
            if(this.showLoading) return;
            let sendTime = (new Date()).format('yyyy/MM/dd HH:mm:ss');
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
                  'Authorization': ['Bearer',this.authKey].join(' ')
                }
            })
            .then(resp => {
                if(resp.ok){
                    return resp.json();
                } else {
                    let json = {
                        created: new Date()/1000
                    };
                    // 鉴权失败
                    if(resp.status == 401) {
                        json.errorMessage = '出错啦！ChatGPT鉴权失败！';
                    } else if(resp.status == 429) {
                        let url = 'https://beta.openai.com/account/api-keys';
                        json.errorMessage = '当前账号下OpenAI的免费限额用完了，你可以在右上角【机器人设置】中更换为你自己的OpenAI API Key！'
                            + `如果你还没有OpenAI账号，<a class="resp-tips" target="_blank" href="${url}">你可以点击这里进入</a>，提前申请好API Key！`;
                    } else {
                        json.errorMessage = '发生未知错误，请稍后再试！';
                    }
                    // 伪造一个结果：实际上就是报错
                    configs.buildResponse = json => {
                        return new Promise(resolve => {
                            let error = `<span class="resp-error">${json.errorMessage}</span>`;
                            let helpLink = 'https://github.com/zxlie/FeHelper/issues/194';
                            let tips = `<a class="resp-tips" target="_blank" href="${helpLink}">你也可以到这里，获取更多帮助！</a>`;
                            return resolve(error + tips);
                        });
                    };
                    return json;
                }
            })
            .then(json => {
                if(!json) return ;
                let id = json.id || `gptimg-${new Date*1}`;
                let dateTime = new Date(json.created * 1000);
                let respTime = dateTime.format('yyyy/MM/dd HH:mm:ss');

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
                        return resolve(marked(json.choices[0].text.replace(/^\？\n\n/,'')));
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
            toast('页面上的这些Demo，你可以随便点击一个来尝试！');
        },
        msgClean(){
            if(confirm('防止误操作，你确定要清空所有消息吗？不可恢复哦！')) {
                this.results = [];
                this.saveConversation();
                toast('所有消息已情况！');
            }
        },
        toggleSettingPanel(){
            this.showSettingPanel = !this.showSettingPanel;
        },
        saveSettings(){
            this.showSettingPanel = false;
            Awesome.StorageMgr.set('CHATGPT_IMAGE_SIZE',this.imgSize);
            Awesome.StorageMgr.set('CHATGPT_CHAT_MODEL',this.chatModel);
            Awesome.StorageMgr.set('CHATGPT_AUTH_KEY',this.authKey);
            toast('设置成功，已立即生效，可以继续使用了！');
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
        },
        decodeAuthKey(dataKey){
            return EncodeUtils.utf8Decode(EncodeUtils.base64Decode(dataKey));
        }
    }

});
