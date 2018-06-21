/**
 * FeHelper 代码美化工具
 */
new Vue({
    el: '#pageContainer',
    data: {
        selectedType: 'Javascript',
        sourceContent: '',
        resultContent: ''
    },

    mounted: function () {

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        chrome.runtime.onMessage.addListener((request, sender, callback) => {
            let MSG_TYPE = Tarp.require('../static/js/msg_type');
            if (request.type === MSG_TYPE.TAB_CREATED_OR_UPDATED && request.event === MSG_TYPE.CODE_BEAUTIFY) {
                if (request.content) {
                    this.sourceContent = request.content;
                    this.format();
                }
            }
        });

        //输入框聚焦
        this.$refs.codeSource.focus();
    },

    methods: {
        format: function () {
            if(!this.sourceContent.trim()) {
                return alert('内容为空，不需要美化处理！');
            }

            let beauty = (result) => {
                result = result.replace(/>/g, '&gt;').replace(/</g, '&lt;');
                result = '<pre class="language-' + this.selectedType.toLowerCase() + ' line-numbers"><code>' + result + '</code></pre>';
                this.resultContent = result;

                // 代码高亮
                this.$nextTick(() => {
                    Prism.highlightAll();
                });
            };

            switch (this.selectedType) {
                case 'Javascript':
                    let opts = {
                        brace_style: "collapse",
                        break_chained_methods: false,
                        indent_char: " ",
                        indent_scripts: "keep",
                        indent_size: "4",
                        keep_array_indentation: true,
                        preserve_newlines: true,
                        space_after_anon_function: true,
                        space_before_conditional: true,
                        unescape_strings: false,
                        wrap_line_length: "120"
                    };
                    Tarp.require('./beautify.js').js_beautify(this.sourceContent, opts, result => beauty(result));
                    break;
                case 'CSS':
                    Tarp.require('./beautify-css.js').css_beautify(this.sourceContent, {}, result => beauty(result));
                    break;
                case 'HTML':
                    Tarp.require('./beautify-html.js');
                    beauty(html_beautify(this.sourceContent));
                    break;
                case 'SQL':
                    Tarp.require('./vkbeautify.js');
                    beauty(vkbeautify.sql(this.sourceContent, 4));
                    break;
                default:
                    Tarp.require('./vkbeautify.js');
                    beauty(vkbeautify.xml(this.sourceContent));
            }

        }
    }
});