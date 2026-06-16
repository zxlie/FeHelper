/**
 * FeHelper QR Code Tools
 */
import {
    copyInlineAiResult,
    createInlineAiState,
    renderInlineMarkdown,
    resetInlineAiState,
    runInlineToolAi,
    setInlineAiGuide
} from '../aiagent/fh.ai-inline.js';

function syncQrPageDarkMode(enabled) {
    document.body.classList.toggle('theme-dark', !!enabled);
    document.body.classList.toggle('theme-default', !enabled);
    document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
    document.documentElement.setAttribute('dark-mode', enabled ? 'on' : 'off');
}

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
        showResult: false,
        aiPanel: createInlineAiState(),
        qrRecipes: [
            { key: 'wifi', label: 'Wi-Fi', prompt: '生成 Wi-Fi 二维码：SSID=，密码=，加密=WPA。' },
            { key: 'contact', label: '名片', prompt: '生成联系人二维码：姓名=，公司=，手机=，邮箱=，网址=。' },
            { key: 'event', label: '日程', prompt: '生成日程二维码：标题=，地点=，开始时间=，结束时间=。' },
            { key: 'sms', label: '短信', prompt: '生成短信二维码：手机号=，内容=。' },
            { key: 'email', label: '邮件', prompt: '生成邮件二维码：收件人=，主题=，正文=。' },
            { key: 'geo', label: '位置', prompt: '生成位置二维码：地址或经纬度=。' }
        ]
        ,codeType: 'qrcode',
        barcodeFormat: 'CODE128',
        barcodeMode: false
    },
    mounted: function () {
        if (window.DarkModeMgr && DarkModeMgr.watchAutoDarkMode) {
            DarkModeMgr.watchAutoDarkMode(syncQrPageDarkMode, {applyFilter: false});
        } else if (window.chrome && chrome.runtime && window.DarkModeMgr) {
            DarkModeMgr.turnLightAuto();
        }

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

        this.loadPatchHotfix();
    },
    computed: {
        aiPanelResultHtml() {
            return renderInlineMarkdown(this.aiPanel.result);
        },
        aiPanelInputSource() {
            if (this.aiPanel.taskKey === 'audit-qr') {
                return this.textContent;
            }
            if (this.aiPanel.taskKey === 'inspect-decode') {
                return this.resultContent;
            }
            return '';
        },
        aiPanelInputHtml() {
            return renderInlineMarkdown(this.aiPanelInputSource);
        }
    },

    methods: {

        loadPatchHotfix() {
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
                return;
            }
            // 页面加载时自动获取并注入页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'qr-code'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js && typeof patch.js === 'string' && patch.js.length < 50000) {
                        try {
                            new Function(patch.js)();
                        } catch (e) {
                            console.error('qr-code补丁JS执行失败', e);
                        }
                    }
                }
            });
        },
        convert: function () {
            this.showResult = true;
            this.$nextTick(() => {
                if (!this.textContent) {
                    $('#preview').html('请在输入框里输入内容');
                    this.barcodeMode = false;
                    return;
                }
                if (this.codeType === 'barcode') {
                    this.barcodeMode = true;
                    $('#preview').html('<svg id="barcodeSvg"></svg>');
                    try {
                        JsBarcode('#barcodeSvg', this.textContent, {
                            format: this.barcodeFormat,
                            width: 2,
                            height: 100,
                            displayValue: true,
                            fontSize: 14,
                            valid: function(valid) {
                                if (!valid) throw new Error('输入内容不符合所选格式要求');
                            }
                        });
                    } catch(e) {
                        var hints = {
                            'EAN13': '需要 13 位纯数字（最后一位为校验位，可只输 12 位自动补全）',
                            'EAN8': '需要 8 位纯数字（可只输 7 位自动补全校验位）',
                            'UPC': '需要 12 位纯数字（可只输 11 位自动补全校验位）',
                            'ITF14': '需要 14 位纯数字'
                        };
                        var msg = (e && (e.message || String(e))) || '未知错误';
                        msg = msg.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                        var hint = hints[this.barcodeFormat];
                        if (hint) msg += '<br><span style="font-size:12px;color:#666">提示：' + hint + '</span>';
                        $('#preview').html('<div style="color:red;text-align:center;padding:20px">条形码生成失败<br>' + msg + '</div>');
                        this.barcodeMode = false;
                    }
                } else {
                    this.barcodeMode = false;
                    $('#preview').html('').qrcode(this._createOptions());
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
        },

        copyQR: function() {
            const canvas = this.$el.querySelector('#preview canvas');
            const copyButton = this.$el.querySelector('#copy_button');
            const originalText = '复制';

            if (!canvas || !copyButton) {
                alert('请先生成二维码！');
                return;
            }

            canvas.toBlob(blob => {
                if (navigator.clipboard && navigator.clipboard.write) {
                    navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
                    .then(() => {
                        copyButton.textContent = '√ 已复制';
                        copyButton.classList.add('btn-action-success');

                        setTimeout(() => {
                            copyButton.textContent = originalText;
                            copyButton.classList.remove('btn-action-success');
                        }, 2000);
                    }).catch(err => {
                        console.error('无法复制二维码: ', err);
                        alert('复制失败，请检查浏览器权限或手动截图。');
                    });
                } else {
                    alert('当前浏览器不支持自动复制图片，请手动截图。');
                }
            });
        },

        downloadQR: function() {
            if (this.codeType === 'barcode' && this.barcodeMode) {
                const svg = document.getElementById('barcodeSvg');
                if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const blob = new Blob([svgData], {type: 'image/svg+xml'});
                    const link = document.createElement('a');
                    link.download = 'barcode.svg';
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    URL.revokeObjectURL(link.href);
                } else {
                    alert('请先生成条形码！');
                }
            } else {
                const canvas = this.$el.querySelector('#preview canvas');
                if (canvas) {
                    const link = document.createElement('a');
                    link.download = 'qrcode.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } else {
                    alert('请先生成二维码！');
                }
            }
        },

        useQrRecipe: function(recipe) {
            if (!recipe) return;
            this.codeType = 'qrcode';
            this.textContent = recipe.prompt;
            resetInlineAiState(this.aiPanel);
            this.$nextTick(() => {
                this.$refs.codeSource && this.$refs.codeSource.focus();
            });
        },

        closeAiPanel: function() {
            resetInlineAiState(this.aiPanel);
        },

        copyAiResult: function() {
            copyInlineAiResult(this.aiPanel);
        },

        askAiForDecodedResult: function() {
            if (!this.resultContent) {
                setInlineAiGuide(this.aiPanel, {
                    taskKey: 'inspect-decode',
                    title: 'AI 识别内容',
                    subtitle: '先粘贴或上传二维码图片。',
                    result: '解码成功后，AI 会判断内容类型、提取关键信息，并标出短链、支付、跳转或可疑参数。'
                });
                return;
            }
            runInlineToolAi(this.aiPanel, {
                toolKey: 'qr-code',
                taskKey: 'inspect-decode',
                title: 'AI 识别内容',
                subtitle: '只分析解码文本，不上传图片。',
                instruction: '请识别当前二维码解码文本的类型，提取关键字段，指出风险点和建议操作。重点关注短链、支付参数、未知域名、可疑跳转、Wi-Fi 密码、名片字段和日程字段。不要要求用户再次上传图片。',
                inputLabel: '当前解码结果',
                input: this.resultContent,
                resultLabel: '图片状态',
                result: this.previewSrc ? (this.previewSrc.indexOf('data:') === 0 ? '已加载本地或剪贴板图片。' : `图片来源：${this.previewSrc}`) : '',
                meta: {
                    模式: '解码'
                },
                outputHint: '按“类型 / 关键信息 / 风险 / 建议”四段输出，保持紧凑。',
                canApply: false
            });
        },

        askAiForQrQuality: function() {
            if (!this.textContent.trim()) {
                setInlineAiGuide(this.aiPanel, {
                    taskKey: 'audit-qr',
                    title: 'AI 扫码体检',
                    subtitle: '先生成或填写内容。',
                    result: 'AI 会检查内容长度、颜色对比、图标遮挡和条形码格式约束。'
                });
                return;
            }
            runInlineToolAi(this.aiPanel, {
                toolKey: 'qr-code',
                taskKey: 'audit-qr',
                title: 'AI 扫码体检',
                subtitle: '检查当前载荷和参数是否容易被扫码。',
                instruction: '请检查当前二维码或条形码的可扫性。重点判断内容长度、格式是否标准、颜色对比是否足够、图标是否可能遮挡、尺寸是否合理，以及条形码格式是否匹配输入。不要改写内容，给出可执行的调整建议。',
                inputLabel: '当前载荷',
                input: this.textContent,
                resultLabel: '当前参数',
                result: '',
                meta: {
                    类型: this.codeType,
                    条形码格式: this.codeType === 'barcode' ? this.barcodeFormat : '',
                    尺寸: this.codeType === 'qrcode' ? this.qrSize : '',
                    颜色: this.codeType === 'qrcode' ? this.qrColor : '',
                    图标: this.codeType === 'qrcode' ? this.useIcon : ''
                },
                outputHint: '先给体检结论，再列最多 4 条调整建议。',
                canApply: false
            });
        },

        openOptionsPage: function(event ){
            event.preventDefault();
            event.stopPropagation();
            if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
                 chrome.runtime.openOptionsPage();
            } else {
                 console.error('无法打开选项页。');
            }
        },

        openDonateModal: function(event ){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'qr-code' }
            });
        }
    }
});
