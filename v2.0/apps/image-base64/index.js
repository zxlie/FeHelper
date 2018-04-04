/**
 * FeHelper Image Base64 Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        sizeOri: '暂无数据',
        sizeBase: '暂无数据',
        previewSrc: '',
        resultContent: ''
    },
    mounted: function () {

        //监听paste事件
        document.addEventListener('paste', (event) => {
            let items = event.clipboardData.items || {};
            for (let index in items) {
                let item = items[index];
                if (/image\//.test(item.type)) {
                    let file = item.getAsFile();
                    this._getDataUri(file);
                    break;
                }
            }
        }, false);

        // 监听拖拽
        document.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
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
            let that = this;
            reader.onload = function (evt) {
                that.resultContent = evt.target.result;
                that.previewSrc = evt.target.result;
                that.$refs.panelBox.style.backgroundImage = 'none';
                that.sizeOri = that._sizeFormat(file.size);
                that.sizeBase = that._sizeFormat(evt.target.result.length);
            };
            reader.readAsDataURL(file);
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
        }
    }
});