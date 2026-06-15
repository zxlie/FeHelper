/**
 * FeHelper 信息编解码
 */
import EncodeUtils from './endecode-lib.js';
import {
    copyInlineAiResult,
    createInlineAiState,
    getInlineAiTaskFromUrl,
    renderInlineMarkdown,
    resetInlineAiState,
    runInlineToolAi,
    setInlineAiGuide
} from '../aiagent/fh.ai-inline.js';
import { analyzeDecodeInput } from './ai-decode-analyzer.js';

new Vue({
    el: '#pageContainer',
    data: {
        selectedType: 'uniEncode',
        sourceContent: '',
        resultContent: '',
        urlResult: null,
        aiPanel: createInlineAiState(),
        aiBestCandidate: null
    },

    mounted: function () {

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        if (location.protocol === 'chrome-extension:') {
            chrome.tabs.query({currentWindow: true,active: true, }, (tabs) => {
                let activeTab = tabs && tabs.filter(tab => tab.active)[0];
                if (!activeTab) return;
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'request-page-content',
                    tabId: activeTab.id
                }).then(resp => {
                    if(!resp || !resp.content) return ;
                    this.sourceContent = resp.content;
                    this.convert();
                });
            });
        }

        this.$refs.srcText.focus();
        this.loadPatchHotfix();
        this.handleInlineAiLaunch();
    },
    computed: {
        aiPanelResultHtml() {
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
                toolName: 'en-decode'
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
                            console.error('en-decode补丁JS执行失败', e);
                        }
                    }
                }
            });
        },
        
        convert: async function () {
            this.$nextTick(async () => {
                this.urlResult = null;

                try {
                    if (this.selectedType === 'uniEncode') {

                        this.resultContent = EncodeUtils.uniEncode(this.sourceContent);
                    } else if (this.selectedType === 'uniDecode') {

                        this.resultContent = EncodeUtils.uniDecode(this.sourceContent.replace(/\\U/g, '\\u'));
                    } else if (this.selectedType === 'utf8Encode') {

                        this.resultContent = encodeURIComponent(this.sourceContent);
                    } else if (this.selectedType === 'utf8Decode') {

                        this.resultContent = decodeURIComponent(this.sourceContent);
                    } else if (this.selectedType === 'utf16Encode') {

                        this.resultContent = EncodeUtils.utf8to16(encodeURIComponent(this.sourceContent));
                    } else if (this.selectedType === 'utf16Decode') {

                        this.resultContent = decodeURIComponent(EncodeUtils.utf16to8(this.sourceContent));
                    } else if (this.selectedType === 'base64Encode') {

                        this.resultContent = EncodeUtils.base64Encode(EncodeUtils.utf8Encode(this.sourceContent));
                    } else if (this.selectedType === 'base64Decode') {

                        this.resultContent = EncodeUtils.utf8Decode(EncodeUtils.base64Decode(this.sourceContent));
                    } else if (this.selectedType === 'md5Encode') {

                        this.resultContent = EncodeUtils.md5(this.sourceContent);
                    } else if (this.selectedType === 'hexEncode') {

                        this.resultContent = EncodeUtils.hexEncode(this.sourceContent);
                    } else if (this.selectedType === 'hexDecode') {

                        this.resultContent = EncodeUtils.hexDecode(this.sourceContent);
                    } else if (this.selectedType === 'html2js') {

                        this.resultContent = EncodeUtils.html2js(this.sourceContent);
                    } else if (this.selectedType === 'sha1Encode') {

                        this.resultContent = EncodeUtils.sha1Encode(this.sourceContent);
                    } else if (this.selectedType === 'htmlEntityEncode') {

                        this.resultContent = globalThis.he.encode(this.sourceContent, {
                            'useNamedReferences': true,
                            'allowUnsafeSymbols': true
                        });
                    } else if (this.selectedType === 'htmlEntityFullEncode') {

                        this.resultContent = globalThis.he.encode(this.sourceContent, {
                            'encodeEverything': true,
                            'useNamedReferences': true,
                            'allowUnsafeSymbols': true
                        });
                    } else if (this.selectedType === 'htmlEntityDecode') {

                        this.resultContent = globalThis.he.decode(this.sourceContent, {
                            'isAttributeValue': false
                        });
                    } else if (this.selectedType === 'urlParamsDecode') {
                        let res = EncodeUtils.urlParamsDecode(this.sourceContent);
                        if (res.error) {
                            this.resultContent = res.error;
                        } else {
                            this.resultContent = '';
                            this.urlResult = res;
                        }
                    } else if(this.selectedType === 'jwtDecode') {
                        let {header,payload,sign} = EncodeUtils.jwtDecode(this.sourceContent);
                        this.resultContent = `Header: ${header}\n\nPayload: ${payload}\n\nSign: ${sign}`;
                    } else if(this.selectedType === 'cookieDecode') {
                        let ckJson = EncodeUtils.formatCookieStringToJson(this.sourceContent);
                        this.resultContent = JSON.stringify(ckJson,null,4);
                    } else if (this.selectedType === 'gzipEncode') {
                        // gzip压缩
                        if (!this.sourceContent.trim()) {
                            this.resultContent = '请输入需要压缩的文本内容';
                            return;
                        }
                        this.resultContent = '正在压缩...';
                        this.resultContent = await EncodeUtils.gzipEncode(this.sourceContent);
                    } else if (this.selectedType === 'gzipDecode') {
                        // gzip解压缩
                        if (!this.sourceContent.trim()) {
                            this.resultContent = '请输入需要解压缩的Base64编码数据';
                            return;
                        }
                        this.resultContent = '正在解压缩...';
                        this.resultContent = await EncodeUtils.gzipDecode(this.sourceContent);
                    } else if (this.selectedType === 'stringEscape') {
                        this.resultContent = EncodeUtils.stringEscape(this.sourceContent);
                    } else if (this.selectedType === 'stringUnescape') {
                        this.resultContent = EncodeUtils.stringUnescape(this.sourceContent);
                    }
                } catch (error) {
                    this.resultContent = '操作失败: ' + error.message;
                }
                this.$forceUpdate();
            });
        },

        clear: function () {
            this.sourceContent = '';
            this.resultContent = '';
            this.urlResult = null;
        },

        getResult: function () {
            this.$refs.rstCode.select();
        },

        handleInlineAiLaunch() {
            const task = getInlineAiTaskFromUrl();
            if (!task) return;
            setInlineAiGuide(this.aiPanel, {
                taskKey: task,
                title: 'AI 自动解码',
                subtitle: '先跑本地链路探测，再让 AI 解释结果。',
                result: '粘贴乱码、Base64、URL 参数、JWT、Cookie 或 Gzip Base64 后点击“AI 解码”。FeHelper 会自动尝试多条链路，并支持一键应用最佳结果。'
            });
        },

        closeAiPanel() {
            resetInlineAiState(this.aiPanel);
            this.aiBestCandidate = null;
        },

        copyAiResult() {
            copyInlineAiResult(this.aiPanel);
        },

        applyAiPanelResult() {
            if (!this.aiBestCandidate) {
                this.aiPanel.statusText = '没有可应用的解码结果';
                return;
            }

            const candidate = this.aiBestCandidate;
            if (candidate.selectedType) {
                this.selectedType = candidate.selectedType;
            }
            this.urlResult = candidate.urlResult || null;
            this.resultContent = candidate.urlResult ? '' : candidate.output;
            this.aiPanel.statusText = '已应用最佳解码结果';
        },

        askAiForEncode: async function () {
            if (!this.sourceContent.trim()) {
                setInlineAiGuide(this.aiPanel, {
                    taskKey: 'smart-decode',
                    title: 'AI 自动解码',
                    subtitle: '请先粘贴需要判断的内容。',
                    result: 'AI 会自动尝试 URL、Base64、Unicode、HTML 实体、Gzip、JWT、Cookie 等链路，并把最可信结果放到可应用区。'
                });
                return;
            }
            this.aiBestCandidate = null;

            const analysis = await analyzeDecodeInput(this.sourceContent);
            this.aiBestCandidate = analysis.bestCandidate;

            runInlineToolAi(this.aiPanel, {
                toolKey: 'en-decode',
                taskKey: 'smart-decode',
                title: 'AI 自动解码',
                subtitle: analysis.bestCandidate
                    ? `${analysis.bestCandidate.title}，置信度 ${analysis.bestCandidate.confidence}`
                    : '没有找到高可信链路。',
                instruction: [
                    '请基于 FeHelper 的本地探测结果做简短判断，不要重新编造一套链路。',
                    '如果本地候选已经清晰，直接确认推荐链路、解释最终内容结构和风险。',
                    '必须明确 MD5、SHA1 只能校验不能解密。',
                    '输出要保留最终明文代码块，便于复制。'
                ].join('\n'),
                inputLabel: '当前原文',
                input: this.sourceContent,
                resultLabel: 'FeHelper 本地探测结果',
                result: analysis.markdown,
                initialResult: analysis.markdown,
                preserveInitialResultOnError: true,
                fallbackStatusText: 'AI 暂不可用，已保留本地自动解码结果',
                outputHint: '先给结论，再给链路、最终明文和风险提示。不要输出编码百科。',
                canApply: !!analysis.bestCandidate,
                applyLabel: '应用最佳结果',
                meta: {
                    当前转换方式: this.selectedType,
                    本地候选数: analysis.candidates.length
                }
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
                params: { toolName: 'en-decode' }
            });
        }
    }
});
