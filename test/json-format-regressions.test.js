import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { describe, expect, it } from 'vitest';
import { canBuildTableViewData } from '../apps/json-format/table-utils.js';

const ROOT = path.resolve(__dirname, '..');

function readSource(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function loadJsonLint() {
    const sandbox = { window: {} };
    vm.runInNewContext(readSource('apps/json-format/json-lint.js'), sandbox);
    return sandbox.window.JsonLint;
}

function runJsonWorker(jsonString, skin) {
    const messages = [];
    const sandbox = {
        BigInt,
        console,
        JSON,
        self: {
            postMessage(message) {
                messages.push(message);
            }
        }
    };
    vm.runInNewContext(readSource('apps/json-format/json-worker.js'), sandbox);
    sandbox.self.onmessage({ data: { jsonString, skin } });
    return messages;
}

function loadJsonFormatPage() {
    const elements = new Map();
    const pendingFormats = [];
    let app;
    let options;

    function element(id) {
        if (!elements.has(id)) {
            elements.set(id, { innerHTML: '', textContent: '', style: {} });
        }
        return elements.get(id);
    }

    // Only DOM storage, visibility and unrelated event bindings are doubled.
    // Parsing, page state transitions and Formatter rendering run unchanged.
    function $(selector) {
        const el = typeof selector === 'string' && /^#[\w-]+$/.test(selector)
            ? element(selector.slice(1))
            : typeof selector === 'string' && selector.startsWith('<')
                ? { innerHTML: selector, textContent: '', style: {} }
                : null;
        const wrapper = {
            0: el,
            length: el ? 1 : 0,
            html(value) {
                if (value === undefined) return el ? el.innerHTML : '';
                if (el) {
                    el.innerHTML = typeof value === 'string' ? value : value[0].innerHTML;
                    el.textContent = '';
                }
                return wrapper;
            },
            text(value) {
                if (value === undefined) return el ? el.textContent : '';
                if (el) el.textContent = String(value);
                return wrapper;
            },
            empty() { return wrapper.html(''); },
            show() { if (el) el.style.display = ''; return wrapper; },
            hide() { if (el) el.style.display = 'none'; return wrapper; },
            find() { return $(null); },
            first() { return wrapper; }
        };
        for (const method of ['appendTo', 'prependTo', 'addClass', 'removeClass', 'removeAttr', 'bind', 'click', 'on', 'off']) {
            wrapper[method] = () => wrapper;
        }
        return wrapper;
    }

    const sandbox = {
        $, Blob, console,
        location: { protocol: 'https:' },
        localStorage: { getItem: () => null, setItem() {} },
        document: {
            querySelector(selector) {
                if (selector === '#pageContainer') return { ...element('pageContainer'), __vue__: app };
                return /^#[\w-]+$/.test(selector) ? element(selector.slice(1)) : null;
            },
            addEventListener() {}
        },
        Vue: function (config) { options = config; },
        createInlineAiState: () => ({}),
        canBuildTableViewData
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    for (const file of ['json-auto-utils.js', 'json-decode.js', 'format-lib.js']) {
        vm.runInContext(readSource('apps/json-format/' + file), sandbox, { filename: file });
    }
    const pageSource = readSource('apps/json-format/index.js')
        .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '');
    vm.runInContext(pageSource, sandbox, { filename: 'index.js' });
    app = { ...options.data, $nextTick: callback => callback() };
    for (const [name, method] of Object.entries(options.methods)) {
        app[name] = method.bind(app);
    }
    // Keep the decoder's asynchronous boundary without doing a fetch.
    sandbox.JsonEnDecode.urlDecodeByFetch = async source => source;
    const format = sandbox.Formatter.format;
    sandbox.Formatter.format = (...args) => {
        const pending = format(...args);
        pendingFormats.push(pending);
        return pending;
    };
    vm.runInContext('editor = { getValue: () => window.inputSource };', sandbox);

    return {
        app,
        element,
        async format(source) {
            sandbox.inputSource = source;
            pendingFormats.length = 0;
            const result = app.format();
            expect(typeof result).toBe('boolean');
            await Promise.resolve();
            await Promise.all(pendingFormats);
            return result;
        }
    };
}

describe('json-format page rendering', () => {
    const largeValue = { payload: 'x'.repeat(600001), tail: '完整末尾' };
    const largeSource = JSON.stringify(largeValue);

    function expectPlainResult(page, value) {
        expect(page.element('jfContent_pre').style.display).not.toBe('none');
        expect(page.element('jfContent_pre').textContent).toBe(JSON.stringify(value, null, 4));
        expect(page.element('jfContent').style.display).toBe('none');
        expect(page.app.jsonActionReady).toBe(true);
    }

    it.each([false, true])('shows the complete large JSON with autoDecode=%s', async autoDecode => {
        const page = loadJsonFormatPage();
        page.app.autoDecode = autoDecode;

        expect(await page.format(largeSource)).toBe(true);

        expectPlainResult(page, largeValue);
    });

    it('shows JSON that exceeds the node budget while remaining below the text limit', async () => {
        const page = loadJsonFormatPage();
        const value = Array(20001).fill(0);

        await page.format(JSON.stringify(value));

        expectPlainResult(page, value);
    });

    it('renders small JSON through the synchronous fallback', async () => {
        const page = loadJsonFormatPage();

        expect(await page.format('{"status":"small-ok"}')).toBe(true);

        expect(page.element('jfContent').style.display).not.toBe('none');
        expect(page.element('jfContent').innerHTML).toContain('small-ok');
        expect(page.element('jfContent_pre').style.display).toBe('none');
    });

    it('switches from small to large and back to small without leaving a hidden result', async () => {
        const page = loadJsonFormatPage();
        await page.format('{"status":"before"}');
        await page.format(largeSource);
        expectPlainResult(page, largeValue);

        await page.format('{"status":"after"}');

        expect(page.element('jfContent').style.display).not.toBe('none');
        expect(page.element('jfContent').innerHTML).toContain('after');
        expect(page.element('jfContent_pre').style.display).toBe('none');
    });

    it.each(['', '{"broken":'])('clears the previous large result for input %j', async source => {
        const page = loadJsonFormatPage();
        // This asynchronous path already renders large JSON before the fix.
        page.app.autoDecode = true;
        page.app.jsonLintSwitch = false;
        await page.format(largeSource);
        expectPlainResult(page, largeValue);

        expect(await page.format(source)).toBe(false);

        expect(page.element('jfContent_pre').style.display).toBe('none');
        expect(page.element('jfContent_pre').textContent).toBe('');
        expect(page.element('jfContent').style.display).not.toBe('none');
        expect(page.element('jfContent').innerHTML).toContain(source ? 'fh-error-state' : 'x-placeholder');
        expect(page.app.jsonActionReady).toBe(false);
        expect(page.element('optionBar').style.display).toBe('none');
    });
});

describe('json-format issue regressions', () => {
    it('Issue #645: JsonLint does not quote pseudo keys inside string timestamps', () => {
        const lint = loadJsonLint();
        const result = lint.lintDetect('{"time":"2026-08-15 00:00:00"}');

        expect(result.hasError).toBeUndefined();
        expect(result.dom).not.toContain('errorEm');
    });

    it('Issue #645: JsonLint still flags unquoted keys near the real syntax error', () => {
        const lint = loadJsonLint();
        const result = lint.lintDetect('{name:"FeHelper", broken: }');

        expect(result.hasError).toBe(true);
        expect(result.dom).toContain('&quot;name&quot;');
        expect(result.dom).toContain('&quot;broken&quot;');
        expect(result.dom).toContain('errorEm');
    });

    it('Issue #642/#639/#636: formatter uses cached node values and delegated events', () => {
        const source = readSource('apps/json-format/format-lib.js');

        expect(source).toContain('let cachedJsonValue = null;');
        expect(source).toContain('cachedJsonValue = parsedJson;');
        expect(source).toContain('getPreservedValueAtPath');
        expect(source).toContain('let value = cachedJsonValue !== null ? cachedJsonValue : JSON.parse(cachedJsonString);');
        expect(source).toContain('let jsonSearchIndex = null;');
        expect(source).toContain('_ensureJsonSearchIndex()');
        expect(source).toContain('jsonSearchIndex.forEach(function (entry)');
        expect(source).toContain('_renderLargeJsonPlainView');
        expect(source).toContain('shouldUsePlainJsonView');
        expect(source).toContain("jfContent.off('.fhJsonTree')");
        expect(source).toContain("jfContent.on('click.fhJsonTree', 'span.expand'");
        expect(source).toContain("jfContent.on('click.fhJsonTree', '.item'");
        expect(source).not.toContain("$('#jfContent .item').each(function ()");
        expect(source).not.toContain("$('#jfContent .item').bind('click'");
        expect(source).not.toContain("jfOptEl.find('a.opt-download').unbind('click').bind('click'");
        expect(source).toContain('reindexArrayElementNodes');
        expect(source).toContain("arrayContainer.children('.item-array-element').toArray()");
    });

    it('Issue #640/#638: formatter download paths use safe stringify and window-note filenames', () => {
        const source = readSource('apps/json-format/format-lib.js');

        expect(source).toContain('sanitizeJsonDownloadFilename');
        expect(source).toContain('getJsonDownloadBasename');
        expect(source).toContain("aLink.download = filename + '.json';");
        expect(source).toContain("filename: filename + '.json'");
        expect(source).toContain('.replace(/"__FH_PRESERVE_INTEGER_KEY__(\\d+)":/g, \'"$1":\')');
        expect(source).toContain('let txt = _stringifyJsonNodeValue(el);');
        expect(source).toContain('downloadJsonBlobWithAnchor');
        expect(source).toContain('deletePreservedValueAtPath');
    });

    it('Issue #640: worker output never exposes preserved integer-key placeholders', () => {
        for (const skin of [undefined, 'theme-simple']) {
            const messages = runJsonWorker('{"2":{"3":1234567890123456789}}', skin);
            const formatted = messages.find(message => message[0] === 'FORMATTED');
            expect(formatted[1]).not.toContain('__FH_PRESERVE_INTEGER_KEY__');
            expect(formatted[1]).toContain('2');
            expect(formatted[1]).toContain('3');
        }
    });

    it('Issue #639/#636: large plain mode explicitly disables tree search and points to browser search', () => {
        const formatter = readSource('apps/json-format/format-lib.js');
        const contentScript = readSource('apps/json-format/content-script.js');

        expect(formatter).toContain('let largeJsonPlainViewEnabled = false;');
        expect(formatter).toContain("'大型 JSON 为完整文本视图，请使用浏览器查找'");
        expect(formatter).toContain('isLargeJsonPlainViewEnabled');
        expect(contentScript).toContain('Formatter.isLargeJsonPlainViewEnabled()');
        expect(contentScript).toContain(".text(searchDisabled ? '⌘F' : text)");
    });

    it('Issue #637/#638: page exposes offline JSON Schema and note-based JSONPath filenames', () => {
        const html = readSource('apps/json-format/index.html');
        const source = readSource('apps/json-format/index.js');

        expect(source).toContain('buildJsonSchema');
        expect(source).toContain('sanitizeJsonDownloadFilename');
        expect(source).toContain('getPreservedProperty');
        expect(html).toContain('@click="generateOfflineJsonSchema"');
        expect(html).toContain('离线 Schema');
        expect(source).toContain('generateOfflineJsonSchema: function()');
        expect(source).toContain('const schema = buildJsonSchema(jsonObj);');
        expect(source).toContain('getJsonDownloadBasename');
        expect(source).toContain('window.__fhJsonWindowNote = note;');
        expect(source).toContain('return sanitizeJsonDownloadFilename(this.windowNote, fallback);');
        expect(source).toContain('getPreservedProperty(current, prop)');
    });
});
