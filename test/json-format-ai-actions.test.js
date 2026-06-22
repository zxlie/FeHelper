import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');

function readSource(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

describe('json-format AI actions', () => {
    it('adds derived JSON AI actions to the parsed-result state', () => {
        const html = readSource('apps/json-format/index.html');
        const source = readSource('apps/json-format/index.js');
        const css = readSource('apps/json-format/index.css');
        const formatLib = readSource('apps/json-format/format-lib.js');

        expect(html).toContain('class="fh-json-ai-actions"');
        expect(html.indexOf('class="fh-json-ai-actions"')).toBeLessThan(html.indexOf('openJsonPathModal'));
        expect(html).toContain("askAiForJsonDerivedOutput('structure')");
        expect(html).toContain("askAiForJsonDerivedOutput('typescript')");
        expect(html).toContain("askAiForJsonDerivedOutput('schema')");
        expect(html).toContain("askAiForJsonDerivedOutput('zod')");
        expect(html).toContain('v-if="jsonActionReady && canUseJsonLocalAi" aria-label="JSON AI 生成"');
        expect(html).toContain('v-if="errorMsg && canUseJsonLocalAi"');
        expect(html).toContain('class="xjf-btn fh-jsonpath-trigger fh-pane-tool-action"');
        expect(html).toContain('jsonAiControlDisabled');
        expect(html).toContain('class="fh-json-ai-trigger"');
        expect(html).toContain('class="fh-json-ai-menu"');
        expect(html).toContain('aria-haspopup="true"');
        expect(html).toContain('role="menu"');
        expect(html).toContain('role="menuitem"');
        expect(html).not.toContain('<span>AI</span>');
        expect(html).not.toContain('jsonAiStatusClass');
        expect(html).not.toContain('{{jsonAiStatusText}}</span>');
        expect(source).toContain('const JSON_DERIVED_AI_TASKS');
        expect(source).toContain("taskKey: 'json-structure-health'");
        expect(source).toContain('function isJsonDerivedAiTask(task)');
        expect(source).toContain('function buildJsonStructureSummary(source)');
        expect(source).toContain('async refreshJsonAiAvailability()');
        expect(source).toContain('async ensureJsonLocalAiReady(taskKey)');
        expect(source).toContain("AI模式: 'Chrome 内置 Gemini Nano，本地执行'");
        expect(source).toContain("provider: 'builtin'");
        expect(source).toContain('sourceSnapshot: aiContext.sourceSnapshot');
        expect(source).toContain('AI 返回的 JSON 未通过本地解析校验');
        expect(source).toContain('JSON Schema Draft 2020-12');
        expect(source).toContain('RootSchema');
        expect(source).toContain("task === 'json-structure'");
        expect(source).not.toContain('resultPaneHint()');
        expect(html).not.toContain('粘贴 JSON、JSONP 或转义 JSON。');
        expect(html).not.toContain('{{resultPaneHint}}');
        expect(css).toContain('.fh-json-ai-actions');
        expect(css).toContain('.fh-json-ai-actions::after');
        expect(css).toContain('.fh-json-ai-trigger');
        expect(css).toContain('.fh-json-ai-menu');
        expect(css).toContain('.fh-json-ai-actions:hover .fh-json-ai-menu');
        expect(css).toContain('.fh-json-ai-actions:focus-within .fh-json-ai-menu');
        expect(css).toContain('pointer-events: none;');
        expect(css).toContain('pointer-events: auto;');
        expect(css).toContain('width: max(100%, 132px);');
        expect(css).toContain('height: 10px;');
        expect(css).toContain('.fh-pane-actions > .fh-pane-tool-action');
        expect(css).toContain('.fh-pane-actions .fh-option-bar .xjf-btn');
        expect(css).toContain('height: 30px;');
        expect(css).toContain('padding: 0 16px;');
        expect(css).toContain('.fh-json-ai-actions .fh-pane-ai-action.fh-ai-tool-btn');
        expect(css).toContain('backdrop-filter: blur(10px) saturate(145%);');
        expect(css).toContain('border-color: rgba(37, 99, 235, 0.14) !important;');
        expect(css).toContain('.fh-pane-ai-action.fh-ai-tool-btn:disabled');
        expect(css).toContain('body.theme-dark .fh-json-ai-actions');
        expect(css).toContain('body.theme-dark .fh-json-ai-trigger');
        expect(css).toContain('body.theme-dark .fh-json-ai-menu');
        expect(css).toContain('body.theme-dark .fh-pane-actions > .fh-pane-tool-action');
        expect(css).not.toContain('.fh-json-ai-status');
        expect(formatLib).toContain('元数据');
        expect(formatLib).toContain('JSON视图');
        expect(formatLib).not.toContain("? '树形' : '元数据'");
        expect(formatLib).toContain('复制格式化后的 JSON 全文');
        expect(formatLib).toContain('>复制</button>');
        expect(formatLib).not.toContain('复制全文</button>');
        expect(formatLib).toContain('格式化后的 JSON 全文已复制到剪贴板');
        expect(formatLib).toContain('let buttonCopyPlain');
        expect(formatLib).toContain('let _isEditableShortcutTarget');
        expect(formatLib).toContain('let _selectPrettyJsonText');
        expect(formatLib).toContain('let _exitPrettyJsonSelection');
        expect(formatLib).toContain("key === 'escape'");
        expect(formatLib).toContain('_setPlainJsonView(false)');
        expect(formatLib).not.toContain("optionBar.find('.fh-json-copy-plain').toggle");
        expect(formatLib).toContain('document.addEventListener(\'copy\'');
        expect(formatLib).toContain("event.clipboardData.setData('text/plain', cachedJsonString)");
        expect(formatLib).toContain('.CodeMirror, .cm-editor, .cm-content');
        expect(source).toContain("document.addEventListener('keydown', this.handleGlobalKeydown, true)");
        expect(source).toContain("document.removeEventListener('keydown', this.handleGlobalKeydown, true)");
        expect(source).toContain('handleGlobalKeydown(event)');
        expect(source).toContain("event.key !== 'Escape'");
        expect(source).toContain('this.closeAiPanel()');
        expect(source).toContain('this.closeJsonPathExamplesModal()');
        expect(source).toContain('this.closeTableViewModal()');
        expect(source).toContain('this.closeJsonPathModal()');
        expect(source).toContain('event.stopImmediatePropagation && event.stopImmediatePropagation()');
    });

    it('keeps AI feature promotion tied to concrete tools instead of popup routing', () => {
        const features = readSource('apps/aiagent/fh.ai-features.js');
        const website = readSource('website/index.html');

        expect(features).toContain("title: 'JSON 结构助手'");
        expect(features).toContain("entryTask: 'json-structure'");
        expect(features).toContain('结构体检');
        expect(features).toContain('JSON Schema 或 Zod');
        expect(website).toContain('JSON 结构助手');
        expect(website).toContain('生成 TypeScript、JSON Schema 或 Zod');
        expect(website).not.toContain('AI 智能识别路由');
        expect(website).not.toContain('弹窗中识别');
    });
});
