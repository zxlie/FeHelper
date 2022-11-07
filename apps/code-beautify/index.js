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
        if (location.protocol === 'chrome-extension:') {
            chrome.tabs.query({currentWindow: true,active: true, }, (tabs) => {
                let activeTab = tabs.filter(tab => tab.active)[0];
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'request-page-content',
                    tabId: activeTab.id
                }).then(resp => {
                    if(!resp || !resp.content) return ;
                    this.sourceContent = resp.content;
                    this.format();
                });
            });
        }

        //输入框聚焦
        this.$refs.codeSource.focus();
    },

    methods: {
        format: function () {
            if (!this.sourceContent.trim()) {
                return alert('内容为空，不需要美化处理！');
            }else{
                this.toast('格式化进行中...');
            }

            let beauty = (result) => {
                result = result.replace(/>/g, '&gt;').replace(/</g, '&lt;');
                result = '<pre class="language-' + this.selectedType.toLowerCase() + ' line-numbers"><code>' + result + '</code></pre>';
                this.resultContent = result;

                // 代码高亮
                this.$nextTick(() => {
                    Prism.highlightAll();
                    this.showCopyBtn = true;
                    this.toast('格式化完成！');
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
                    beauty(js_beautify(this.sourceContent, opts));
                    break;
                case 'CSS':
                    css_beautify(this.sourceContent, {}, result => beauty(result));
                    break;
                case 'HTML':
                    beauty(html_beautify(this.sourceContent,{indent_size:15}));
                    break;
                case 'SQL':
                    beauty(vkbeautify.sql(this.sourceContent, 4));
                    break;
                default:
                    beauty(vkbeautify.xml(this.sourceContent));
            }

        },

        copy: function () {

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
        },

        /**
         * 自动消失的Alert弹窗
         * @param content
         */
        toast (content) {
            window.clearTimeout(window.feHelperAlertMsgTid);
            let elAlertMsg = document.querySelector("#fehelper_alertmsg");
            if (!elAlertMsg) {
                let elWrapper = document.createElement('div');
                elWrapper.innerHTML = '<div id="fehelper_alertmsg" style="position:fixed;bottom:5px;left:5px;z-index:1000000">' +
                    '<p style="background:#000;display:inline-block;color:#fff;text-align:center;' +
                    'padding:10px 10px;margin:0 auto;font-size:14px;border-radius:4px;">' + content + '</p></div>';
                elAlertMsg = elWrapper.childNodes[0];
                document.body.appendChild(elAlertMsg);
            } else {
                elAlertMsg.querySelector('p').innerHTML = content;
                elAlertMsg.style.display = 'block';
            }

            window.feHelperAlertMsgTid = window.setTimeout(function () {
                elAlertMsg.style.display = 'none';
            }, 3000);
        }
    }
});
