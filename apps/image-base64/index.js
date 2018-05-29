/**
 * FeHelper Image Base64 Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        sizeOri: '暂无数据',
        sizeBase: '暂无数据',
        previewSrc: '',
        resultContent: '',
        toolName: {'image': '图片转Base64', 'base64': 'Base64转图片'},
        curType: 'image',
        nextType: 'base64',
        txtBase64Input: ''
    },
    mounted: function () {

        let MSG_TYPE = Tarp.require('../static/js/msg_type');

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        chrome.runtime.onMessage.addListener((request, sender, callback) => {
            if (request.type === MSG_TYPE.TAB_CREATED_OR_UPDATED && request.event === MSG_TYPE.IMAGE_BASE64) {
                if (request.content) {
                    if(this.curType !== 'image') {
                        this.trans();
                    }
                    this.convertOnline(request.content, flag => {
                        if (!flag) {
                            chrome.extension.getBackgroundPage().BgPageInstance.notify({
                                message: '抱歉，' + request.content + ' 对应的图片未转码成功！'
                            });
                        }
                    });
                }
            }
        });

        //监听paste事件
        document.addEventListener('paste', (event) => {
            if (this.curType !== 'image') return;
            this.paste(event);
        }, false);

        // 监听拖拽
        document.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (this.curType !== 'image') return;
            let files = event.dataTransfer.files;
            if (files.length) {
                if (/image\//.test(files[0].type)) {
                    this._getDataUri(files[0]);
                } else {
                    alert('请选择图片文件！');
                }
            }
        }, false);

        document.addEventListener('dragover', (event) => {
            if (this.curType !== 'image') return;
            event.preventDefault();
            event.stopPropagation();
        }, false);
    },
    methods: {

        _sizeFormat: function (num) {
            if (isNaN(num)) {
                return '暂无数据';
            }
            num = +num;
            if (num < 1024) {
                return num + ' B';
            } else if (num < 1024 * 1024) {
                return (num / 1024).toFixed(2) + ' KB';
            } else {
                return (num / 1024 / 1024).toFixed(2) + ' MB';
            }
        },

        _getDataUri: function (file) {
            let reader = new FileReader();
            reader.onload = (evt) => {
                this.resultContent = evt.target.result;
                this.previewSrc = evt.target.result;
                this.$refs.panelBox.style.backgroundImage = 'none';
                this.sizeOri = this._sizeFormat(file.size);
                this.sizeBase = this._sizeFormat(evt.target.result.length);
            };
            reader.readAsDataURL(file);
        },

        convertOnline: function (onlineSrc, callback) {
            let that = this;
            that.previewSrc = onlineSrc;
            let image = new Image();
            image.src = onlineSrc;
            image.onload = function () {
                let width = this.naturalWidth;
                let height = this.naturalHeight;

                // url方式解码失败，再转换成data uri后继续解码
                (function createCanvasContext(img, t, l, w, h) {
                    let canvas = document.createElement('canvas');
                    canvas.setAttribute('id', 'qr-canvas');
                    canvas.height = h + 100;
                    canvas.width = w + 100;
                    let context = canvas.getContext('2d');
                    context.fillStyle = 'rgb(255,255,255)';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(img, l, t, w, h, 50, 50, w, h);

                    that.resultContent = canvas.toDataURL();
                    that.$refs.panelBox.style.backgroundImage = 'none';
                    that.sizeOri = width + 'x' + height;
                    that.sizeBase = that._sizeFormat(that.resultContent.length);

                    callback && callback(true);
                })(image, 0, 0, width, height);
            };
            image.onerror = function () {
                callback && callback(false);
            };
        },

        convert: function () {
            if (this.$refs.fileBox.files.length) {
                this._getDataUri(this.$refs.fileBox.files[0]);
                this.$refs.fileBox.value = '';
            }
        },

        select: function () {
            this.$refs.resultBox.select();
        },

        upload: function (evt) {
            evt.preventDefault();
            this.$refs.fileBox.click();
        },

        paste: function (event) {
            let items = event.clipboardData.items || {};

            // 优先处理图片
            for (let index in items) {
                let item = items[index];
                if (/image\//.test(item.type)) {
                    let file = item.getAsFile();
                    return this._getDataUri(file);
                }
            }

            // 然后处理url
            try {
                // 逐个遍历
                (async () => {
                    for (let index in items) {
                        let item = items[index];
                        if (/text\/plain/.test(item.type)) {
                            let url = await new Promise(resolve => {
                                item.getAsString(url => resolve(url))
                            });
                            let flag = await new Promise(resolve => {
                                this.convertOnline(url, flag => resolve(flag));
                            });
                            if (flag) break;
                        }
                    }
                })();
            } catch (ex) {
                // 只能处理一个了
                for (let index in items) {
                    let item = items[index];
                    if (/text\/plain/.test(item.type)) {
                        return item.getAsString(url => {
                            this.convertOnline(url);
                        });
                    }
                }
            }
        },

        trans: function () {
            this.curType = {image: 'base64', base64: 'image'}[this.curType];
            this.nextType = {image: 'base64', base64: 'image'}[this.nextType];
        },

        loadError: function (e) {
            if(this.curType === 'base64' && this.txtBase64Input.trim().length) {
                alert('无法识别的Base64编码，请确认是正确的图片Data URI？');
            }
        }
    }
});