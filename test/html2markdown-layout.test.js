import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

describe('html2markdown preview layout', () => {
    it('exposes production-grade markdown editor workflow controls', () => {
        const html = readSource('apps/html2markdown/index.html');
        const source = readSource('apps/html2markdown/index.js');
        const css = readSource('apps/html2markdown/index.css');

        expect(html).toContain("['panel-body mod-markdown', 'view-mode-' + viewMode");
        expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
        expect(html).toContain('class="mod-statusbar"');
        expect(html).toContain('{{stats.lines}} 行');
        expect(html).toContain('v-model="syncScroll"');
        expect(html).toContain('role="toolbar" aria-label="Markdown 编辑工具栏"');
        expect(html).toContain('aria-label="段落样式"');
        expect(html).toContain('@change="applyBlockStyle($event)"');
        expect(html).not.toContain('toolbar-group-label">样式</span>');
        expect(html).toContain("@click=\"insert('task-list')\"");
        expect(html).toContain("@click=\"insert('toc')\"");
        expect(html).toContain("@click=\"insert('callout')\"");
        expect(html).toContain("@click=\"insert('format-table')\"");
        expect(html).toContain('@click="undoEdit"');
        expect(html).toContain('@click="redoEdit"');
        expect(html).toContain('@click="toggleFullscreen"');
        expect(html).toContain('toolbar-labeled');
        expect(html).toContain('toolbar-symbol icon-link');
        expect(html).toContain('toolbar-symbol icon-image');
        expect(html).toContain('toolbar-symbol icon-preview');
        expect(html).toContain('toolbar-symbol toolbar-symbol-table');
        expect(html).toContain('toolbar-symbol toolbar-symbol-download');
        expect(html).not.toContain('toolbar-glyph">链</span>');
        expect(html).not.toContain('toolbar-glyph">图</span>');
        expect(html).not.toContain('toolbar-glyph">眼</span>');
        expect(html).toContain("@click=\"setViewMode('split')\"");
        expect(html).toContain('@click="copyMarkdown"');
        expect(html).toContain('@click="copyHtml"');
        expect(html).toContain('@click="clearContent"');
        expect(source).toContain("const MARKDOWN_DRAFT_KEY = 'fh-html2markdown:draft';");
        expect(source).toContain("viewMode: 'split'");
        expect(source).toContain("editor.on('change', () => this.updateHashAndPreview());");
        expect(source).toContain("editor.on('scroll', () => this.syncPreviewScroll());");
        expect(source).toContain("'Ctrl-B': () => this.insert('b')");
        expect(source).toContain("'Ctrl-Alt-1': () => this.insert('h1')");
        expect(source).toContain("editor.setOption('mode', this.codeType === 'HTML' ? 'htmlmixed' : 'gfm');");
        expect(source).toContain('updateStats(source)');
        expect(source).toContain('saveDraft(source)');
        expect(source).toContain('getDraftKey()');
        expect(source).toContain('getDraftTimeKey()');
        expect(source).toContain('setViewMode(mode)');
        expect(source).toContain('undoEdit()');
        expect(source).toContain('redoEdit()');
        expect(source).toContain('applyBlockStyle(event)');
        expect(source).toContain('insertHeading(level)');
        expect(source).toContain('insertInline(prefix, suffix, placeholder)');
        expect(source).toContain('insertLinePrefix(type)');
        expect(source).toContain('insertLink(isImage)');
        expect(source).toContain('insertTable()');
        expect(source).toContain('insertCallout()');
        expect(source).toContain('insertToc()');
        expect(source).toContain('createHeadingAnchor(title)');
        expect(source).toContain('toggleFullscreen()');
        expect(source).toContain('formatMarkdownTables()');
        expect(source).toContain('formatMarkdownTableRows(rows)');
        expect(source).toContain('copyToClipboard(text, successMessage)');
        expect(source).toContain('copyMarkdown()');
        expect(source).toContain('copyHtml()');
        expect(source).toContain('clearContent()');
        expect(css).toContain('.toolbar-group');
        expect(css).toContain('.toolbar-style-group');
        expect(css).toContain('.toolbar-button');
        expect(css).toContain('.toolbar-select');
        expect(css).toContain('.toolbar-labeled');
        expect(css).toContain('.toolbar-symbol');
        expect(css).toContain('.toolbar-symbol-table');
        expect(css).toContain('.toolbar-symbol-download');
        expect(css).toContain('.mod-statusbar');
        expect(css).toContain('body.fh-modern .mod-markdown.mode-h2m > .markdown-body');
        expect(css).toContain('.mod-markdown.view-mode-preview .markdown-body');
        expect(css).toContain('.mod-markdown.view-mode-editor .mod-editor');
    });

    it('lets wide preview tables scroll inside the preview pane', () => {
        const css = readSource('apps/html2markdown/index.css');

        expect(css).toContain('body.fh-modern #pageContainer {\n    height: 100dvh;');
        expect(css).toContain('body.fh-modern #pageContainer > .panel-body.mod-markdown');
        expect(css).toContain('body.fh-modern .mod-markdown > .markdown-body {\n    max-width: none;');
        expect(css).toContain('overflow: auto;');
        expect(css).toContain('overscroll-behavior: contain;');
        expect(css).toContain('body.fh-modern .mod-markdown > .markdown-body table {');
        expect(css).toContain('width: max-content;');
        expect(css).toContain('min-width: 100%;');
        expect(css).toContain('max-width: none;');
        expect(css).toContain('overflow: visible;');
        expect(css).toContain('table-layout: auto;');
        expect(css).toContain('body.fh-modern .mod-markdown > .markdown-body table th,');
        expect(css).toContain('word-break: normal;');
    });
});
