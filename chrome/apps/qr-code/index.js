/**
 * FeHelper QR Code Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        textContent: '',
        qrSize: 200,
        qrColor: '#000000',
        useIcon: 'no'
    },
    mounted: function () {

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        chrome.runtime.onMessage.addListener((request, sender, callback) => {
            let MSG_TYPE = Tarp.require('../static/js/msg_type');
            if (request.type === MSG_TYPE.TAB_CREATED_OR_UPDATED && request.event === MSG_TYPE.QR_CODE) {
                if (request.content) {
                    this.textContent = request.content;
                    this.convert();
                }
            }
        });

        this.$refs.codeSource.focus();

        // 拖拽注册
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let files = e.dataTransfer.files;
            if (files.length) {
                this._drawIcon(files[0]);
            }
        }, false);

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
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
                this._drawIcon(event.target.files[0]);
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
                // render method: 'canvas', 'image' or 'div'
                render: 'canvas',

                // version range somewhere in 1 .. 40
                minVersion: 1,
                maxVersion: 40,

                // error correction level: 'L', 'M', 'Q' or 'H'
                ecLevel: 'L',

                // offset in pixel if drawn onto existing canvas
                left: 0,
                top: 0,

                // size in pixel
                size: +this.qrSize || 200,

                // code color or image element
                fill: this.qrColor,

                // background color or image element, null for transparent background
                background: '#fff',

                // corner radius relative to module width: 0.0 .. 0.5
                radius: 0,

                // quiet zone in modules
                quiet: 0,
                text: this.textContent,

                // modes
                // 0: normal
                // 1: label strip
                // 2: label box
                // 3: image strip
                // 4: image box
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
        }
    }
});