/**
 * FeHelper Code Compress
 */
let editor = {};

new Vue({
    el: '#pageContainer',
    data: {
        sourceContent: '',
        resultContent: ''
    },

    mounted: function () {

        editor = CodeMirror.fromTextArea(this.$refs.codeSource, {
            mode: "text/javascript",
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            lineWrapping: true
        });

        //输入框聚焦
        editor.focus();
    },

    methods: {
        compress: function () {

            this.sourceContent = editor.getValue().trim();

            if (!this.sourceContent) {
                alert('请先粘贴您需要压缩的代码');
            } else {
                // 用uglifyjs3进行在线压缩
                let UglifyJs3 = Tarp.require('./uglifyjs3');
                let result = UglifyJs3.compress(this.sourceContent);
                this.resultContent = result.out || result.error;
                this.$refs.jfContent.style.color = result.error ? 'red' : 'black';
            }
        },

        getResult: function () {
            this.$refs.jfContent.select();
        }
    }
});