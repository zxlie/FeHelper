/**
 * FeHelper 代码美化工具
 */
import {
    copyInlineAiResult,
    createInlineAiState,
    getInlineAiTaskFromUrl,
    renderInlineMarkdown,
    resetInlineAiState,
    runInlineToolAi,
    setInlineAiGuide
} from '../aiagent/fh.ai-inline.js';

new Vue({
    el: '#pageContainer',
    data: {
        selectedType: 'Javascript',
        sourceContent: '',
        resultContent: '',
        showCopyBtn: false,
        aiPanel: createInlineAiState(),
        examples: {
            js: `function foo(){var x=10;if(x>5){return x*2;}else{return x/2;}}`,
            css: `.header{position:fixed;top:0;left:0;width:100%;background:#fff;z-index:100;}.header .logo{float:left;margin:10px;}.header .nav{float:right;}`,
            html: `<div class="container"><div class="header"><h1>标题</h1><nav><ul><li><a href="#">首页</a></li><li><a href="#">关于</a></li></ul></nav></div><div class="content"><p>内容区域</p></div></div>`,
            xml: `<?xml version="1.0" encoding="UTF-8"?><root><person><name>张三</name><age>25</age><city>北京</city></person><person><name>李四</name><age>30</age><city>上海</city></person></root>`,
            sql: `SELECT u.name,o.order_id,p.product_name FROM users u LEFT JOIN orders o ON u.id=o.user_id LEFT JOIN products p ON o.product_id=p.id WHERE u.status='active' AND o.create_time>='2024-01-01' ORDER BY o.create_time DESC;`
        }
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
        this.loadPatchHotfix();
        this.handleInlineAiLaunch();
    },

    computed: {
        aiPanelResultHtml: function () {
            return renderInlineMarkdown(this.aiPanel.result);
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
                toolName: 'code-beautify'
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
                            console.error('code-beautify补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        format: function () {
            if (!this.sourceContent.trim()) {
                return this.toast('内容为空，不需要美化处理！', 'warning');
            }else{
                this.toast('格式化进行中...', 'info');
            }

            let beauty = (result) => {
                result = result.replace(/>/g, '&gt;').replace(/</g, '&lt;');
                result = '<pre class="language-' + this.selectedType.toLowerCase() + ' line-numbers"><code>' + result + '</code></pre>';
                this.resultContent = result;

                // 代码高亮
                this.$nextTick(() => {
                    Prism.highlightAll();
                    this.showCopyBtn = true;
                    this.toast('格式化完成！', 'success');
                });
            };

            switch (this.selectedType) {
                case 'Javascript':
                    try {
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
                    } catch (error) {
                        this.toast('JavaScript格式化失败，请检查代码语法！', 'error');
                    }
                    break;
                case 'CSS':
                    try {
                        css_beautify(this.sourceContent, {}, result => beauty(result));
                    } catch (error) {
                        this.toast('CSS格式化失败，请检查代码语法！', 'error');
                    }
                    break;
                case 'HTML':
                    try {
                        beauty(html_beautify(this.sourceContent,{indent_size:4}));
                    } catch (error) {
                        this.toast('HTML格式化失败，请检查代码语法！', 'error');
                    }
                    break;
                case 'SQL':
                    try {
                        beauty(vkbeautify.sql(this.sourceContent, 4));
                    } catch (error) {
                        this.toast('SQL格式化失败，请检查代码语法！', 'error');
                    }
                    break;
                default:
                    try {
                        beauty(vkbeautify.xml(this.sourceContent));
                    } catch (error) {
                        this.toast('XML格式化失败，请检查代码语法！', 'error');
                    }
            }

        },

        copy: function () {

            let _copyToClipboard = (text) => {
                let input = document.createElement('textarea');
                input.style.position = 'fixed';
                input.style.opacity = 0;
                input.value = text;
                document.body.appendChild(input);
                input.select();
                document.execCommand('Copy');
                document.body.removeChild(input);

                this.toast('复制成功，随处粘贴可用！', 'success')
            };

            let txt = this.$refs.jfContentBox.textContent;
            _copyToClipboard(txt);
        },

        handleInlineAiLaunch: function () {
            const task = getInlineAiTaskFromUrl();
            if (!task) return;
            setInlineAiGuide(this.aiPanel, {
                taskKey: task,
                title: 'AI 解释代码',
                subtitle: '解释格式化结果、风险点和可读性建议。',
                result: '先粘贴 JS、CSS、HTML、XML 或 SQL 并点击“格式化”。格式化完成后点击“AI 解释代码”，AI 只基于当前代码和格式化结果给出说明。'
            });
        },

        closeAiPanel: function () {
            resetInlineAiState(this.aiPanel);
        },

        copyAiResult: function () {
            copyInlineAiResult(this.aiPanel);
        },

        applyAiPanelResult: function () {
            this.aiPanel.statusText = '当前任务只提供解读和建议，不直接改写代码';
        },

        getFormattedCodeForAi: function () {
            return this.$refs.jfContentBox ? this.$refs.jfContentBox.textContent.trim() : '';
        },

        buildCodeAiMeta: function (formatted) {
            return {
                语言: this.selectedType,
                源码字符数: this.sourceContent.length,
                格式化后字符数: formatted.length,
                格式化后行数: formatted ? formatted.split(/\n/).length : 0,
                任务: '解释意图、风险点和局部修正建议'
            };
        },

        askAiForCode: function () {
            const formatted = this.getFormattedCodeForAi();
            if (!this.sourceContent.trim()) {
                setInlineAiGuide(this.aiPanel, {
                    taskKey: 'explain-code',
                    title: 'AI 解释代码',
                    subtitle: '请先粘贴代码。',
                    result: '这个入口只在格式化后使用。先粘贴代码并点击“格式化”，再让 AI 解释代码作用、关键流程和潜在问题。'
                });
                return;
            }
            if (!formatted) {
                setInlineAiGuide(this.aiPanel, {
                    taskKey: 'explain-code',
                    title: 'AI 解释代码',
                    subtitle: '请先完成格式化。',
                    result: 'AI 会基于格式化后的结果进行解释。请先点击“格式化”，确认右侧出现格式化结果后再使用。'
                });
                return;
            }
            runInlineToolAi(this.aiPanel, {
                toolKey: 'code-beautify',
                taskKey: 'explain-code',
                title: 'AI 解释代码',
                subtitle: `${this.selectedType} 代码的意图和风险点。`,
                instruction: [
                    '请基于格式化后的代码做工具内解释，不要把用户引导到 AI 聊天页。',
                    '输出结构：1. 代码作用；2. 关键流程；3. 最多 5 个风险或可读性建议；4. 如有明显错误，只给局部修正片段。',
                    '不要重写整段代码，不要凭空补充业务背景。',
                    'SQL 要关注条件、JOIN、排序和潜在性能；HTML/CSS 要关注结构、选择器和样式覆盖；JavaScript 要关注副作用、异常和兼容性。'
                ].join('\n'),
                inputLabel: '当前源代码',
                input: this.sourceContent,
                resultLabel: '当前格式化结果',
                result: formatted,
                outputHint: '用 Markdown 输出，结论先行；局部修正用代码块；不要输出完整重写版本。',
                meta: this.buildCodeAiMeta(formatted)
            });
        },

        /**
         * 自动消失的通知弹窗，仿Notification效果
         * @param content 通知内容
         * @param type 通知类型：success、error、warning、info（默认）
         */
        toast (content, type = 'info') {
            window.clearTimeout(window.feHelperAlertMsgTid);
            let elAlertMsg = document.querySelector("#fehelper_alertmsg");
            
            // 根据类型配置样式
            const typeConfig = {
                info: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderColor: '#4ade80',
                    icon: 'ℹ'
                },
                success: {
                    background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
                    borderColor: '#22c55e',
                    icon: 'OK'
                },
                error: {
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderColor: '#f87171',
                    icon: 'ERR'
                },
                warning: {
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderColor: '#fbbf24',
                    icon: 'WARN'
                }
            };
            
            const config = typeConfig[type] || typeConfig.info;
            
            if (!elAlertMsg) {
                let elWrapper = document.createElement('div');
                elWrapper.innerHTML = `
                    <div id="fehelper_alertmsg" style="
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 10000000;
                        min-width: 300px;
                        max-width: 400px;
                        opacity: 0;
                        transform: translateX(100%);
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    ">
                        <div class="toast-inner" style="
                            background: ${config.background};
                            color: #fff;
                            padding: 16px 20px;
                            border-radius: 8px;
                            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1);
                            font-size: 14px;
                            font-weight: 500;
                            line-height: 1.4;
                            position: relative;
                            overflow: hidden;
                        ">
                            <div class="toast-border" style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 4px;
                                height: 100%;
                                background: ${config.borderColor};
                            "></div>
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 12px;
                            ">
                                <div class="toast-icon" style="
                                    flex-shrink: 0;
                                    width: 20px;
                                    height: 20px;
                                    background: rgba(255, 255, 255, 0.2);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 12px;
                                ">${config.icon}</div>
                                <div class="toast-content" style="flex: 1;">${content}</div>
                            </div>
                        </div>
                    </div>
                `;
                elAlertMsg = elWrapper.childNodes[1]; // 第一个是文本节点，第二个才是div
                document.body.appendChild(elAlertMsg);
                
                // 触发动画
                setTimeout(() => {
                    elAlertMsg.style.opacity = '1';
                    elAlertMsg.style.transform = 'translateX(0)';
                }, 10);
            } else {
                // 更新现有通知的内容和样式
                const toastInner = elAlertMsg.querySelector('.toast-inner');
                const toastBorder = elAlertMsg.querySelector('.toast-border');
                const toastIcon = elAlertMsg.querySelector('.toast-icon');
                const toastContent = elAlertMsg.querySelector('.toast-content');
                
                toastInner.style.background = config.background;
                toastBorder.style.background = config.borderColor;
                toastIcon.innerHTML = config.icon;
                toastContent.innerHTML = content;
                
                elAlertMsg.style.display = 'block';
                elAlertMsg.style.opacity = '1';
                elAlertMsg.style.transform = 'translateX(0)';
            }

            window.feHelperAlertMsgTid = window.setTimeout(function () {
                // 淡出动画
                elAlertMsg.style.opacity = '0';
                elAlertMsg.style.transform = 'translateX(100%)';
                
                // 动画完成后隐藏
                setTimeout(() => {
                    elAlertMsg.style.display = 'none';
                }, 300);
            }, 3000);
        },

        loadExample(type,event) {
            if(event){
                event.preventDefault();
            }
            const typeMap = {
                'js': 'Javascript',
                'css': 'CSS',
                'html': 'HTML',
                'xml': 'XML',
                'sql': 'SQL'
            };
            
            this.sourceContent = this.examples[type];
            this.selectedType = typeMap[type];
            this.toast(`已加载${typeMap[type]}示例代码`, 'info');
            this.$nextTick(() => {
                this.format();
            });
        },

        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },

        openDonateModal: function(event ){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'code-beautify' }
            });
        }
    }
});
