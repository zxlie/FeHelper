/**
 * FeHelper QR Code Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        textContent: '',
        qrSize: 200,
        qrColor: '#000000',
        useIcon: 'no',
        previewSrc: '',
        resultContent: '',
        qrEncodeMode: true,
        showResult: false
    },
    mounted: function () {

        let mode = new URL(location.href).searchParams.get('mode');
        this.qrEncodeMode = mode !== 'decode';

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        if (location.protocol === 'chrome-extension:') {
            chrome.tabs.query({currentWindow: true,active: true, }, (tabs) => {
                let activeTab = tabs.filter(tab => tab.active)[0];
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'request-page-content',
                    tabId: activeTab.id
                }).then(resp => {
                    if(!resp) return ;
                    let text = resp.content || (resp.tab ? (resp.tab.fromTab ? resp.tab.fromTab.url : '') : '');
                    if (text) {
                        if (!this.qrEncodeMode) {
                            // 解码模式
                            this._qrDecode(text);
                        } else {
                            this.textContent = text;
                            this.convert();
                        }
                    }
                });
            });
        }

        this.$refs.codeSource && this.$refs.codeSource.focus();

        // 拖拽注册
        document.addEventListener('drop', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            let files = evt.dataTransfer.files;
            if (files.length) {
                if (this.qrEncodeMode) {
                    this._drawIcon(files[0]);
                } else {
                    this._decodeLocal(files[0]);
                }
            }
        }, false);

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);


        //监听paste事件
        document.addEventListener('paste', (event) => {
            if (this.qrEncodeMode) return;
            this.paste(event);
        }, false);

        // color picker绑定
        $("#opt_fc").colorpicker({
            fillcolor: true,
            success: (obj, color) => {
                this.qrColor = color;
                this.convert();
            }
        })
    },

    methods: {
        convert: function () {
            this.showResult = true;
            this.$nextTick(() => {
                if (this.textContent) {
                    $('#preview').html('').qrcode(this._createOptions());
                } else {
                    $('#preview').html('再在输入框里输入一些内容，就能生成二维码了哦~')
                }
            });
        },

        fileChanged: function (event) {
            if (event.target.files.length) {
                if (this.qrEncodeMode) {
                    this._drawIcon(event.target.files[0]);
                } else {
                    this._decodeLocal(event.target.files[0]);
                }
                event.target.value = '';
            }
        },

        _drawIcon: function (file) {
            if (/image\//.test(file.type)) {
                this.useIcon = 'custom';
                let reader = new FileReader();
                reader.onload = (evt) => {
                    this.$refs.logoCustom.src = evt.target.result;
                    this.convert();
                };
                reader.readAsDataURL(file);
            } else {
                alert('请选择图片文件！');
            }
        },

        _createOptions: function () {
            let defaultOptions = {
                render: 'canvas',
                minVersion: 1,
                maxVersion: 40,
                ecLevel: 'L',
                left: 0,
                top: 0,
                size: +this.qrSize || 200,
                fill: this.qrColor,
                background: '#fff',
                radius: 0,
                quiet: 0,
                text: this.textContent,
                mode: 0,
                mSize: 0.15,
                mPosX: 0.5,
                mPosY: 0.5,
                label: 'FH',
                fontname: 'sans',
                fontcolor: '#f00',
                image: false
            };

            // 判断是否需要设置icon
            switch (this.useIcon) {
                case 'default':
                    defaultOptions.mode = 4;
                    defaultOptions.image = this.$refs.logoDefault;
                    break;
                case 'custom':
                    defaultOptions.mode = 4;
                    defaultOptions.image = this.$refs.logoCustom;
                    break;
            }

            return defaultOptions;
        },

        trans: function () {
            this.qrEncodeMode = !this.qrEncodeMode;
        },
        select: function () {
            this.$refs.resultBox.select();
        },

        _decodeLocal: function (file) {
            let reader = new FileReader();
            reader.onload = (e) => {
                this._qrDecode(e.target.result);
            };
            reader.readAsDataURL(file);
        },

        paste: function (event) {
            let items = event.clipboardData.items || {};

            // 优先处理图片
            for (let index in items) {
                let item = items[index];
                if (/image\//.test(item.type)) {
                    let file = item.getAsFile();
                    return this._decodeLocal(file);
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
                                this._qrDecode(url, flag => resolve(flag));
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
                            this._qrDecode(url);
                        });
                    }
                }
            }
        },

        /**
         * 二维码转码
         * @param imgSrc
         * @param callback
         */
        _qrDecode: function (imgSrc, callback) {

            let self = this;
            const codeReader = new ZXing.BrowserMultiFormatReader();

            let image = new Image();
            image.src = imgSrc;
            image.setAttribute('crossOrigin', 'Anonymous');
            image.onload = function () {
                codeReader.decodeFromImage(this).then((result) => {
                    self._showDecodeResult(imgSrc, result.text);
                    callback && callback(result.text);
                }).catch((err) => {
                    self._showDecodeResult(imgSrc, err);
                    callback && callback(err);
                });
            };
            image.onerror = function (e) {
                callback && callback(false);
                alert('抱歉，当前图片无法被解码，请保存图片再拖拽进来试试！')
            };
        },

        _showDecodeResult: function (src, txt) {
            this.previewSrc = src;
            this.$refs.panelBox.style.backgroundImage = 'none';
            this.resultContent = txt;
        }
    }
});
