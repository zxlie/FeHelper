/**
 * FeHelper 代码美化工具
 */
new Vue({
    el: '#pageContainer',
    data: {
        selectedType: 'Javascript',
        sourceContent: '',
        resultContent: '',
        showCopyBtn: false
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
                    this.showCopyBtn = true;
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
                        wrap_line_length: "120",
                        "max_preserve_newlines": "5",
                        "jslint_happy": false,
                        "end_with_newline": false,
                        "indent_inner_html": false,
                        "comma_first": false,
                        "e4x": false
                    };
                    beauty(Tarp.require('../code-beautify/beautify.js').js_beautify(this.sourceContent, opts));
                    break;
                case 'CSS':
                    Tarp.require('../code-beautify/beautify-css.js').css_beautify(this.sourceContent, {}, result => beauty(result));
                    break;
                case 'HTML':
                    Tarp.require('../code-beautify/beautify-html.js');
                    beauty(html_beautify(this.sourceContent));
                    break;
                case 'SQL':
                    Tarp.require('../code-beautify/vkbeautify.js');
                    beauty(vkbeautify.sql(this.sourceContent, 4));
                    break;
                default:
                    Tarp.require('../code-beautify/vkbeautify.js');
                    beauty(vkbeautify.xml(this.sourceContent));
            }

        },

        copy: function(){

            let _copyToClipboard = function (text) {
                let input = document.createElement('textarea');
                input.style.position = 'fixed';
                input.style.opacity = 0;
                input.value = text;
                document.body.appendChild(input);
                input.select();
                document.execCommand('Copy');
                document.body.removeChild(input);

                alert('复制成功，随处粘贴可用！')
            };

            let txt = this.$refs.jfContentBox.textContent;
            _copyToClipboard(txt);
        }
    }
});