/**
 * FeHelper HTML转Markdown
 */


let editor = null;
let hashtoTimeoutId;
let noticeTimeoutId;
let previewElm;
let previewTextArea;

const MARKDOWN_DRAFT_KEY = 'fh-html2markdown:draft';
const MARKDOWN_DRAFT_TIME_KEY = 'fh-html2markdown:draft-time';

new Vue({
    el: '#pageContainer',
    data: {
        showPreview: false,
        previewText: '效果预览',
        codeType: 'Markdown',
        nextCodeType: 'HTML',
        viewMode: 'split',
        syncScroll: true,
        noticeText: '',
        stats: {
            lines: 1,
            words: 0,
            chars: 0,
            readingTime: 1
        },
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
                    if (patch.js && typeof patch.js === 'string' && patch.js.length < 50000) {
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
            this.codeType = {HTML: 'Markdown', Markdown: 'HTML'}[this.codeType];
            this.nextCodeType = {HTML: 'Markdown', Markdown: 'HTML'}[this.nextCodeType];

            let classList = this.$refs.modMarkdownBox.classList;
            if (this.codeType === 'HTML') {
                classList.add('mode-h2m');
                previewElm.innerHTML = `<textarea readonly aria-label="Markdown 转换结果"></textarea>`;
                previewTextArea = previewElm.querySelector('textarea');
            } else {
                classList.remove('mode-h2m');
                previewElm.innerHTML = '';
                previewTextArea = null;
            }
            editor.setOption('mode', this.codeType === 'HTML' ? 'htmlmixed' : 'gfm');
            editor.setValue(this.loadDraft());
            this.updateHashAndPreview();
            this.setViewMode('split');
            editor.focus();
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
                theme: 'default',
                extraKeys: {
                    'Ctrl-B': () => this.insert('b'),
                    'Cmd-B': () => this.insert('b'),
                    'Ctrl-I': () => this.insert('i'),
                    'Cmd-I': () => this.insert('i'),
                    'Ctrl-K': () => this.insert('link'),
                    'Cmd-K': () => this.insert('link'),
                    'Ctrl-Alt-1': () => this.insert('h1'),
                    'Ctrl-Alt-2': () => this.insert('h2'),
                    'Ctrl-Alt-3': () => this.insert('h3')
                }
            });
            editor.on('change', () => this.updateHashAndPreview());
            editor.on('scroll', () => this.syncPreviewScroll());

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
                let draft = this.loadDraft();
                if (draft) {
                    editor.setValue(draft);
                } else {
                    this.updateHashAndPreview(editor);
                }
                editor.focus();
            }
        },

        /**
         * 更新预览区域
         */
        updateHashAndPreview() {
            try {
                let source = editor.getValue();
                this.updateStats(source);
                this.saveDraft(source);
                if (this.codeType === 'HTML') {
                    if (!previewTextArea) {
                        return;
                    }
                    previewTextArea.value = h2m(source, {
                        converter: 'CommonMark' // CommonMark | MarkdownExtra
                    });
                    this.$nextTick(() => this.syncPreviewScroll());
                } else {
                    previewElm.innerHTML = marked(source);
                    previewElm.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightBlock(block);
                    });
                    this.$nextTick(() => this.syncPreviewScroll());
                    clearTimeout(hashtoTimeoutId);
                    hashtoTimeoutId = setTimeout(function () {
                        window.location.hash = btoa(RawDeflate.deflate(unescape(encodeURIComponent(source))))
                    }, 1000);
                }
            } catch (e) {
                console.log(e);
            }
        },

        updateStats(source) {
            let text = source || '';
            let trimmed = text.trim();
            let words = trimmed ? (trimmed.match(/[A-Za-z0-9_]+|[\u4e00-\u9fa5]/g) || []).length : 0;
            this.stats = {
                lines: text ? text.split(/\r\n|\r|\n/).length : 1,
                words,
                chars: text.length,
                readingTime: Math.max(1, Math.ceil(Math.max(words, text.length / 4) / 300))
            };
        },

        loadDraft() {
            try {
                return localStorage.getItem(this.getDraftKey()) || '';
            } catch (e) {
                return '';
            }
        },

        saveDraft(source) {
            try {
                localStorage.setItem(this.getDraftKey(), source || '');
                localStorage.setItem(this.getDraftTimeKey(), String(Date.now()));
            } catch (e) {}
        },

        clearDraft() {
            try {
                localStorage.removeItem(this.getDraftKey());
                localStorage.removeItem(this.getDraftTimeKey());
            } catch (e) {}
        },

        getDraftKey() {
            return `${MARKDOWN_DRAFT_KEY}:${String(this.codeType || 'Markdown').toLowerCase()}`;
        },

        getDraftTimeKey() {
            return `${MARKDOWN_DRAFT_TIME_KEY}:${String(this.codeType || 'Markdown').toLowerCase()}`;
        },

        syncPreviewScroll() {
            if (!this.syncScroll || this.viewMode === 'editor' || !editor || !previewElm) {
                return;
            }
            let info = editor.getScrollInfo();
            let editorScrollable = info.height - info.clientHeight;
            let scrollTarget = this.codeType === 'HTML' && previewTextArea ? previewTextArea : previewElm;
            let previewScrollable = scrollTarget.scrollHeight - scrollTarget.clientHeight;
            if (editorScrollable <= 0 || previewScrollable <= 0) {
                return;
            }
            scrollTarget.scrollTop = previewScrollable * (info.top / editorScrollable);
        },

        setViewMode(mode) {
            this.viewMode = ['split', 'editor', 'preview'].includes(mode) ? mode : 'split';
            this.$nextTick(() => {
                editor && editor.refresh();
                this.syncPreviewScroll();
            });
        },

        showNotice(message) {
            this.noticeText = message;
            clearTimeout(noticeTimeoutId);
            noticeTimeoutId = setTimeout(() => {
                this.noticeText = '';
            }, 1800);
        },

        copyToClipboard(text, successMessage) {
            let fallbackCopy = () => {
                let textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', 'readonly');
                textarea.style.cssText = 'position:fixed;top:-1000px;left:-1000px;';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            };

            let copyPromise = navigator.clipboard && navigator.clipboard.writeText
                ? navigator.clipboard.writeText(text)
                : Promise.resolve().then(fallbackCopy);

            copyPromise
                .then(() => this.showNotice(successMessage))
                .catch(() => this.showNotice('复制失败，请手动复制'));
        },

        copyMarkdown() {
            let markdown = this.codeType === 'HTML' && previewTextArea ? previewTextArea.value : editor.getValue();
            this.copyToClipboard(markdown, 'Markdown 已复制');
        },

        copyHtml() {
            let html = this.codeType === 'HTML' ? editor.getValue() : this.getParsedHtml();
            this.copyToClipboard(html, 'HTML 已复制');
        },

        clearContent() {
            editor.setValue('');
            this.clearDraft();
            this.showNotice('内容已清空');
            editor.focus();
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

        undoEdit() {
            editor.undo();
            editor.focus();
        },

        redoEdit() {
            editor.redo();
            editor.focus();
        },

        applyBlockStyle(event) {
            let type = event.target.value;
            event.target.value = '';
            if (!type) {
                editor.focus();
                return;
            }
            this.insert(type);
        },

        insert(type) {
            if (this.codeType !== 'Markdown') {
                this.showNotice('HTML 模式下仅支持转换输出');
                return;
            }
            let actions = {
                h1: () => this.insertHeading(1),
                h2: () => this.insertHeading(2),
                h3: () => this.insertHeading(3),
                b: () => this.insertInline('**', '**', 'text-here'),
                i: () => this.insertInline('*', '*', 'text-here'),
                strike: () => this.insertInline('~~', '~~', 'text-here'),
                'inline-code': () => this.insertInline('`', '`', 'code'),
                quote: () => this.insertLinePrefix('quote'),
                code: () => this.insertBlock('```javascript\n', '\n```', ''),
                'unordered-list': () => this.insertLinePrefix('unordered-list'),
                'ordered-list': () => this.insertLinePrefix('ordered-list'),
                'task-list': () => this.insertLinePrefix('task-list'),
                link: () => this.insertLink(false),
                image: () => this.insertLink(true),
                table: () => this.insertTable(),
                hr: () => this.insertHorizontalRule(),
                callout: () => this.insertCallout(),
                toc: () => this.insertToc(),
                'format-table': () => this.formatMarkdownTables()
            };
            if (actions[type]) {
                actions[type]();
            }
            editor.focus();
        },

        insertHeading(level) {
            let from = editor.getCursor('from');
            let to = editor.getCursor('to');
            let startLine = from.line;
            let endLine = to.ch === 0 && to.line > from.line ? to.line - 1 : to.line;
            let prefix = `${'#'.repeat(level)} `;
            let nextLines = [];
            for (let line = startLine; line <= endLine; line++) {
                let text = editor.getLine(line).replace(/^\s{0,3}#{1,6}\s+/, '').trim();
                nextLines.push(prefix + (text || '标题'));
            }
            editor.replaceRange(
                nextLines.join('\n'),
                {line: startLine, ch: 0},
                {line: endLine, ch: editor.getLine(endLine).length}
            );
            editor.setSelection(
                {line: startLine, ch: prefix.length},
                {line: startLine, ch: nextLines[0].length}
            );
        },

        insertInline(prefix, suffix, placeholder) {
            let from = editor.getCursor('from');
            let selection = editor.getSelection();
            let value = selection || placeholder;
            editor.replaceSelection(prefix + value + suffix);
            if (!selection) {
                editor.setSelection(
                    {line: from.line, ch: from.ch + prefix.length},
                    {line: from.line, ch: from.ch + prefix.length + value.length}
                );
            }
        },

        insertBlock(prefix, suffix, placeholder) {
            let from = editor.getCursor('from');
            let selection = editor.getSelection();
            let value = selection || placeholder;
            let block = '\n' + prefix + value + suffix + '\n';
            editor.replaceSelection(block);
            if (!selection) {
                editor.setCursor({line: from.line + 1, ch: prefix.length});
            }
        },

        insertLinePrefix(type) {
            let from = editor.getCursor('from');
            let to = editor.getCursor('to');
            let startLine = from.line;
            let endLine = to.ch === 0 && to.line > from.line ? to.line - 1 : to.line;
            let lines = [];
            for (let line = startLine; line <= endLine; line++) {
                lines.push(editor.getLine(line));
            }
            let nextLines = lines.map((line, index) => {
                if (!line.trim()) {
                    if (type === 'quote') return '> text-here';
                    if (type === 'ordered-list') return `${index + 1}. text-here`;
                    if (type === 'task-list') return '- [ ] text-here';
                    return '- text-here';
                }
                let prefix = type === 'quote'
                    ? '> '
                    : type === 'ordered-list'
                        ? `${index + 1}. `
                        : type === 'task-list'
                            ? '- [ ] '
                            : '- ';
                return line.replace(/^(\s*)/, `$1${prefix}`);
            });
            editor.replaceRange(
                nextLines.join('\n'),
                {line: startLine, ch: 0},
                {line: endLine, ch: editor.getLine(endLine).length}
            );
            editor.setSelection(
                {line: startLine, ch: 0},
                {line: endLine, ch: nextLines[nextLines.length - 1].length}
            );
        },

        insertLink(isImage) {
            let from = editor.getCursor('from');
            let selection = editor.getSelection() || 'text-here';
            let value = isImage ? `![${selection}](your-image-src)` : `[${selection}](your-link-url)`;
            editor.replaceSelection(value);
            if (selection === 'text-here') {
                let offset = isImage ? 2 : 1;
                editor.setSelection(
                    {line: from.line, ch: from.ch + offset},
                    {line: from.line, ch: from.ch + offset + selection.length}
                );
            }
        },

        insertTable() {
            let selection = editor.getSelection();
            let table = this.buildTableFromSelection(selection);
            editor.replaceSelection(table);
            editor.focus();
        },

        buildTableFromSelection(selection) {
            let lines = (selection || '').split(/\r\n|\r|\n/).filter(line => line.trim());
            if (lines.length > 1) {
                let delimiter = lines.some(line => line.includes('\t')) ? '\t' : ',';
                let rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
                if (rows.every(row => row.length > 1)) {
                    return this.formatMarkdownTableRows([
                        rows[0],
                        rows[0].map(() => '---'),
                        ...rows.slice(1)
                    ]);
                }
            }
            return '\n| 列 1 | 列 2 | 列 3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n';
        },

        insertHorizontalRule() {
            editor.replaceSelection('\n\n---\n\n');
            editor.focus();
        },

        insertCallout() {
            editor.replaceSelection('\n> [!NOTE]\n> text-here\n');
            editor.focus();
        },

        insertToc() {
            let headings = editor.getValue()
                .split(/\r\n|\r|\n/)
                .map(line => /^(#{1,3})\s+(.+)$/.exec(line.trim()))
                .filter(Boolean)
                .map(match => {
                    let level = match[1].length;
                    let title = match[2].replace(/\s+#*$/, '').trim();
                    return {
                        level,
                        title,
                        anchor: this.createHeadingAnchor(title)
                    };
                });
            if (!headings.length) {
                this.showNotice('当前文档没有 H1-H3 标题');
                editor.focus();
                return;
            }
            let toc = headings.map(item => {
                let indent = '  '.repeat(Math.max(0, item.level - 1));
                return `${indent}- [${item.title}](#${item.anchor})`;
            }).join('\n');
            editor.replaceSelection('\n' + toc + '\n\n');
            this.showNotice('目录已生成');
            editor.focus();
        },

        createHeadingAnchor(title) {
            return title
                .toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-');
        },

        formatMarkdownTables() {
            let lines = editor.getValue().split(/\r\n|\r|\n/);
            let result = [];
            let changed = false;
            let inFence = false;

            for (let index = 0; index < lines.length; index++) {
                let line = lines[index];
                if (/^\s*```/.test(line)) {
                    inFence = !inFence;
                    result.push(line);
                    continue;
                }
                if (!inFence && this.isMarkdownTableRow(line) && this.isMarkdownTableDivider(lines[index + 1] || '')) {
                    let tableLines = [line];
                    index++;
                    while (index < lines.length && this.isMarkdownTableRow(lines[index])) {
                        tableLines.push(lines[index]);
                        index++;
                    }
                    index--;
                    let rows = tableLines.map(row => this.parseMarkdownTableRow(row));
                    result.push(...this.formatMarkdownTableRows(rows).trim().split('\n'));
                    changed = true;
                } else {
                    result.push(line);
                }
            }

            if (changed) {
                editor.setValue(result.join('\n'));
                this.showNotice('表格已整理');
            } else {
                this.showNotice('未发现可整理的表格');
            }
            editor.focus();
        },

        isMarkdownTableRow(line) {
            return /^\s*\|.*\|\s*$/.test(line || '');
        },

        isMarkdownTableDivider(line) {
            return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line || '');
        },

        parseMarkdownTableRow(line) {
            return (line || '')
                .trim()
                .replace(/^\|/, '')
                .replace(/\|$/, '')
                .split('|')
                .map(cell => cell.trim());
        },

        formatMarkdownTableRows(rows) {
            let columnCount = Math.max(...rows.map(row => row.length));
            let normalizedRows = rows.map(row => {
                let nextRow = row.slice();
                while (nextRow.length < columnCount) nextRow.push('');
                return nextRow;
            });
            let widths = [];
            for (let column = 0; column < columnCount; column++) {
                widths[column] = Math.max(3, ...normalizedRows.map(row => row[column].length));
            }
            return normalizedRows.map((row, rowIndex) => {
                if (rowIndex === 1 && row.every(cell => /^:?-{3,}:?$/.test(cell))) {
                    return `| ${widths.map(width => '-'.repeat(width)).join(' | ')} |`;
                }
                return `| ${row.map((cell, column) => cell.padEnd(widths[column], ' ')).join(' | ')} |`;
            }).join('\n') + '\n';
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
            this.setViewMode(this.viewMode === 'editor' ? 'split' : 'editor');
        },

        toggleFullscreen() {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => this.showNotice('无法进入全屏'));
            } else if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => this.showNotice('无法退出全屏'));
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
