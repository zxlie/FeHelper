import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readSource(file) {
    return fs.readFileSync(path.resolve(file), 'utf8');
}

describe('issue #594-#596 regressions', () => {
    it('developer docs button points to the live docs site instead of removed README_NEW.md', () => {
        const source = readSource('apps/devtools/index.js');

        expect(source).toContain("window.open('https://fehelper.com/docs.html?tool=devtools')");
        expect(source).not.toContain('README_NEW.md');
    });

    it('json-diff loads the shared JSON parser and uses it before native JSON.parse', () => {
        const html = readSource('apps/json-diff/index.html');
        const source = readSource('apps/json-diff/index.js');

        expect(html).toContain('../json-format/json-auto-utils.js');
        expect(source).toContain('function parseJsonForDiff(text)');
        expect(source).toContain('window.FHJsonAutoUtils.parseJSONLike');
        expect(source).toContain('leftJson = parseJsonForDiff(leftText);');
        expect(source).toContain('rightJson = parseJsonForDiff(rightText);');
    });

    it('json-diff toolbar stays compact instead of growing over the editors', () => {
        const css = readSource('apps/json-diff/index.css');

        expect(css).toContain('.json-examples');
        expect(css).toContain('height: 44px;');
        expect(css).toContain('flex-wrap: nowrap;');
        expect(css).toContain('overflow-x: auto;');
        expect(css).toContain('height: calc(100% - 58px);');
    });

    it('json-diff uses explicit format and compare actions instead of auto comparing on every edit', () => {
        const html = readSource('apps/json-diff/index.html');
        const source = readSource('apps/json-diff/index.js');

        expect(html).toContain('@click="formatBothSides"');
        expect(html).toContain('@click="compareContent"');
        expect(source).toContain('formatBothSides: function()');
        expect(source).toContain('markPendingChange: function(message)');
        expect(source).not.toContain('setTimeout(() => this.compareContent(), 300)');
    });

    it('custom noPage tools inject storage-backed scripts with DOM globals', () => {
        const background = readSource('apps/background/background.js');
        const injectTools = readSource('apps/background/inject-tools.js');

        expect(background).toContain('toolInfo._devTool');
        expect(background).toContain('Awesome.getContentScript(tool)');
        expect(background).toContain("tool.replace(/[-_]/g, '')");
        expect(injectTools).toContain("new Function('window', 'document', 'globalThis', 'self', code)(window, document, window, window)");
    });

    it('developer docs describe a runnable custom tool path', () => {
        const docs = readSource('website/docs/devtools.md');

        expect(docs).toContain('DYNAMIC_TOOL:<toolId>');
        expect(docs).toContain('dynamic/index.html?tool=<toolId>');
        expect(docs).toContain('dynamic/sandbox.html');
        expect(docs).toContain('content_security_policy.sandbox');
        expect(docs).toContain('window.fhdocnopageContentScript');
        expect(docs).toContain('window.fhdocnopageNoPage');
        expect(docs).toContain('FH_CUSTOM_TOOL_OK');
        expect(docs).toContain('FH_NOPAGE_OK');
    });

    it('developer tool templates use the documented config shape', () => {
        const fileTemplate = readSource('apps/devtools/file-tpl.js');
        const helloWorldConfig = readSource('apps/devtools/hello-world/fh-config.js');

        expect(fileTemplate).toContain('"contentScriptJs": #contentScript#');
        expect(fileTemplate).not.toContain('"contentScript": #contentScript#');
        expect(helloWorldConfig).toContain('"contentScriptJs": true');
        expect(helloWorldConfig).not.toContain('"contentScript": true');
    });
});
