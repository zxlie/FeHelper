/**
 * FeHelper HTML转Markdown
 */


let editor = null;
let hashtoTimeoutId;
let previewElm;
let previewTextArea;

new Vue({
    el: '#pageContainer',
    data: {
        showPreview: false,
        previewText: '效果预览',
        codeType: 'Markdown',
        nextCodeType: 'HTML',
        toolName: {
            HTML: 'HTML转Markdown',
            Markdown: 'Markdown编辑器'
        }
    },

    mounted: function () {
        this.init();
        this.loadPatchHotfix();
    },
    methods: {

        loadPatchHotfix() {
            // 页面加载时自动获取并注入页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'html2markdown'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js) {
                        try {
                            new Function(patch.js)();
                        } catch (e) {
                            console.error('html2markdown补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        trans: function () {
            editor.setValue('');

            this.codeType = {HTML: 'Markdown', Markdown: 'HTML'}[this.codeType];
            this.nextCodeType = {HTML: 'Markdown', Markdown: 'HTML'}[this.nextCodeType];

            let classList = this.$refs.modMarkdownBox.classList;
            if (this.codeType === 'HTML') {
                classList.add('mode-h2m');
                previewElm.innerHTML = `<textarea disabled></textarea>`;
                previewTextArea = previewElm.querySelector('textarea');
            } else {
                classList.remove('mode-h2m');
                previewElm.innerHTML = '';
            }
        },

        /**
         * 初始化ctrl+s的保存
         */
        init() {

            previewElm = this.$refs.boxPreview;

            // ===========================editor初始化
            editor = CodeMirror.fromTextArea(this.$refs.elEditor, {
                mode: "gfm",
                lineNumbers: true,
                matchBrackets: true,
                lineWrapping: true,
                theme: 'default'
            });
            editor.on('change', this.updateHashAndPreview);

            // ===========================支持save-as
            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
            navigator.saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob;
            window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;

            document.addEventListener('keydown', (e) => {
                if (e.keyCode === 83 && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.saveMarkdown('md');
                    return false;
                }
            });

            // ===========================支持页面拖拽识别
            document.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();

                let theFile = e.dataTransfer.files[0];
                let theReader = new FileReader();
                theReader.onload = function (e) {
                    editor.setValue(e.target.result);
                };

                theReader.readAsText(theFile);
            }, false);

            this.initWithHash();
        },

        /**
         * 根据Hash进行更新编辑器
         */
        initWithHash() {
            if (this.codeType === 'HTML') return;

            if (window.location.hash) {
                let h = window.location.hash.replace(/^#/, '');
                if (h.slice(0, 5) === 'view:') {
                    let val = decodeURIComponent(escape(RawDeflate.inflate(atob(h.slice(5)))));
                    previewElm.innerHTML = marked(val);
                    previewElm.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightBlock(block);
                    });
                    document.body.className = 'view';
                } else {
                    editor.setValue(decodeURIComponent(escape(RawDeflate.inflate(atob(h)))));
                    this.updateHashAndPreview(editor);
                    editor.focus();
                }
            } else {
                this.updateHashAndPreview(editor);
                editor.focus();
            }
        },

        /**
         * 更新预览区域
         */
        updateHashAndPreview() {
            try {
                if (this.codeType === 'HTML') {
                    previewTextArea.value = h2m(editor.getValue(), {
                        converter: 'CommonMark' // CommonMark | MarkdownExtra
                    });
                } else {
                    previewElm.innerHTML = marked(editor.getValue());
                    previewElm.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightBlock(block);
                    });
                    clearTimeout(hashtoTimeoutId);
                    hashtoTimeoutId = setTimeout(function () {
                        window.location.hash = btoa(RawDeflate.deflate(unescape(encodeURIComponent(editor.getValue()))))
                    }, 1000);
                }
            } catch (e) {
                console.log(e);
            }
        },

        saveMarkdown(type) {

            let date = new Date();
            let name = "FH-" + date.getFullYear() + (date.getMonth() + 1) + date.getDate()
                + date.getHours() + date.getMinutes() + date.getSeconds() + `.${type}`;

            let code = editor.getValue();
            if (this.codeType === 'HTML') {
                if (type !== 'html') {
                    code = previewTextArea.value;
                }
            } else {
                if (type === 'html') {
                    code = DemoTpl.exportHtml.replace('#title#', name).replace('#style#', DemoTpl.exportCss).replace('#html#', this.getParsedHtml());
                }
            }

            let blob = new Blob([code], {type: type === 'md' ? 'text/plain' : 'text/html'});

            if (window.saveAs) {
                window.saveAs(blob, name);
            } else if (navigator.saveBlob) {
                navigator.saveBlob(blob, name);
            } else {
                let url = URL.createObjectURL(blob);
                let link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", name);
                let event = document.createEvent('MouseEvents');
                event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                link.dispatchEvent(event);
            }
        },

        /**
         * 获取编译后的
         * @returns {*}
         */
        getParsedHtml() {
            return previewElm.innerHTML;
        },

        insert(type) {
            let textConfig = {
                b: '** text-here **',
                i: '* text-here *',
                quote: '\n> text-here ',
                code: '\n```javascript\n\n\n```\n',
                'unordered-list': '\n\n- text-here\n- text-here\n- text-here\n',
                'ordered-list': '\n\n1. text-here\n2. text-here\n3. text-here\n',
                link: '\n[text-here](your-link-url)',
                image: '\n![text-here](your-image-src)'
            };
            editor.replaceSelection(textConfig[type] || '');
            editor.focus();
        },

        getResult: function () {
            this.$refs.rstCode.select();
        },

        setDemo: function () {
            editor.setValue(DemoTpl[this.codeType.toLowerCase()]);
        },

        // 导入内容
        importContent: function () {
            let that = this;
            let fileInput = document.getElementById('fileInput');
            if (!fileInput) {
                fileInput = document.createElement('input');
                fileInput.id = 'fileInput';
                fileInput.type = 'file';
                fileInput.accept = {HTML: 'text/html', Markdown: 'text/x-markdown'}[that.codeType];
                fileInput.style.cssText = 'position:relative;top:-1000px;left:-1000px;';
                fileInput.onchange = function (event) {
                    let reader = new FileReader();
                    reader.readAsText(fileInput.files[0], 'utf-8');
                    reader.onload = (evt) => {
                        editor.setValue(evt.target.result);
                        document.body.removeChild(fileInput);
                    };
                };
                document.body.appendChild(fileInput);
            }
            fileInput.click();
        },

        togglePreview() {
            let classList = this.$refs.modMarkdownBox.classList;
            let closeClass = 'preview-closed';
            if (classList.contains(closeClass)) {
                classList.remove(closeClass);
            } else {
                classList.add(closeClass);
            }
        },

        // 通过调用系统打印的形式，打印为pdf
        exportContent: function (previewMode) {
            let newContent = "<html><head><meta charset='utf-8'/><title></title>" +
                "<style>" + DemoTpl.printCss + "</style>" +
                "</head><body class='markdown-body'>" + this.getParsedHtml() + "</body></html>";
            let newWin = window.open();
            newWin.focus();
            newWin.document.write(newContent);
            if (!previewMode) {
                newWin.print();
                newWin.document.close();
                newWin.close();
            }
        },

        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },

        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'html2markdown' }
            });
        }
    }
});