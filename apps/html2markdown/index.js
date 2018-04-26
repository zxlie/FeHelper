/**
 * FeHelper HTML转Markdown
 */
new Vue({
    el: '#pageContainer',
    data: {
        sourceContent: '',
        resultContent: '',
        previewHTML: '',
        showPreview: false,
        previewText: '效果预览',
        codeType: 'HTML',
        nextCodeType: 'Markdown',
        toolName: {
            HTML: 'HTML转Markdown',
            Markdown: 'Markdown转HTML'
        }
    },

    mounted: function () {
        this.$refs.srcText.focus();
    },
    methods: {
        convert: function () {
            let h2m = Tarp.require('../static/vendor/h2m/h2m');
            let markdown = Tarp.require('../static/vendor/h2m/markdown');
            if (this.codeType === 'HTML') {
                this.resultContent = h2m(this.sourceContent, {
                    converter: 'CommonMark' // CommonMark | MarkdownExtra
                });
                this.previewHTML = markdown.toHTML(this.resultContent);
            } else {
                this.resultContent = this.previewHTML = markdown.toHTML(this.sourceContent);
            }
        },

        preview: function (event) {
            event && event.preventDefault();
            this.showPreview = !this.showPreview;
            this.previewText = this.showPreview ? '查看源码' : '效果预览';
        },

        trans: function () {
            this.codeType = {HTML: 'Markdown', Markdown: 'HTML'}[this.codeType];
            this.nextCodeType = {HTML: 'Markdown', Markdown: 'HTML'}[this.nextCodeType];
            this.preview();
            this.clear();
        },

        clear: function () {
            this.sourceContent = '';
            this.resultContent = '';
            this.resultContent = false;
        },

        getResult: function () {
            this.$refs.rstCode.select();
        },

        setDemo: function () {
            if (this.codeType === 'HTML') {
                this.sourceContent = this.$refs.htmlDemo.innerHTML;
            } else {
                this.sourceContent = '## FE助手\n' +
                    '\n' +
                    '- 字符串编解码\n' +
                    '- `Json`串格式化\n' +
                    '- 代码美化工具\n' +
                    '- 代码压缩工具\n' +
                    '- 二维码生成器\n' +
                    '- 页面取色工具\n' +
                    '- Js正则表达式\n' +
                    '- 时间(戳)转换\n' +
                    '- 图片Base64\n' +
                    '- 编码规范检测\n' +
                    '- 页面性能检测\n' +
                    '- Html转`Markdown`\n' +
                    '- Ajax调试:**关**';
            }
            this.convert();
        }
    }
});