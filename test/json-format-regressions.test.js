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

function loadJsonFormatPage(withFolding = false) {
    const elements = new Map();
    const pendingFormats = [];
    const editors = [];
    let app;
    let options;

    function element(id) {
        if (!elements.has(id)) {
            elements.set(id, { innerHTML: '', textContent: '', style: {}, appendChild() {} });
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
        for (const method of ['appendTo', 'prependTo', 'addClass', 'removeClass', 'removeAttr', 'bind', 'click', 'on', 'off', 'prop']) {
            wrapper[method] = () => wrapper;
        }
        return wrapper;
    }

    const sandbox = {
        $, Blob, console, setTimeout, clearTimeout, performance,
        location: { protocol: 'https:' },
        localStorage: { getItem: () => null, setItem() {} },
        document: {
            querySelector(selector) {
                if (selector === '#pageContainer') return { ...element('pageContainer'), __vue__: app };
                return /^#[\w-]+$/.test(selector) ? element(selector.slice(1)) : null;
            },
            createElement: () => ({ value: '', style: {} }),
            addEventListener() {}
        },
        Vue: function (config) { options = config; },
        createInlineAiState: () => ({}),
        canBuildTableViewData
    };
    if (withFolding) {
        // The real browser tests exercise CodeMirror's folding/viewport code.
        // This double checks our payload, options, batching and disposal contract.
        sandbox.CodeMirror = {
            fold: { indent() {} },
            Doc: function (value, mode) { this.value = value; this.mode = mode; },
            Pos: (line, ch) => ({ line, ch }),
            fromTextArea(textarea, config) {
                const lines = textarea.value.split('\n');
                const editor = {
                    config,
                    folds: [],
                    swappedDocuments: [],
                    state: { foldGutter: null },
                    disposed: false,
                    getValue: () => textarea.value,
                    firstLine: () => 0,
                    lastLine: () => lines.length - 1,
                    foldCode(position, options, action) { editor.folds.push({ position, action }); },
                    operation: callback => callback(),
                    getOption: name => config[name],
                    swapDoc(doc) { editor.swappedDocuments.push(doc); },
                    refresh() {},
                    setOption(name, value) { editor.config[name] = value; },
                    toTextArea() { editor.disposed = true; }
                };
                editors.push(editor);
                return editor;
            }
        };
    }
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
        editors,
        formatter: sandbox.Formatter,
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

describe('large JSON folding view', () => {
    const value = { payload: 'x'.repeat(600001), tail: '完整末尾' };
    const source = JSON.stringify(value);

    it('loads the whole document in a read-only viewport with folding enabled', async () => {
        const page = loadJsonFormatPage(true);
        await page.format(source);

        expect(page.editors).toHaveLength(1);
        const editor = page.editors[0];
        expect(editor.getValue()).toBe(JSON.stringify(value, null, 4));
        expect(editor.config.readOnly).toBe(true);
        expect(editor.config.foldGutter).toBe(true);
        expect(editor.config.viewportMargin).toBe(10);
        expect(editor.config.lineWrapping).toBe(false);
        expect(page.element('jfContent').style.display).not.toBe('none');
        expect(page.element('jfContent_pre').style.display).toBe('none');
    });

    it('switches to full text and back without discarding the folding editor', async () => {
        const page = loadJsonFormatPage(true);
        await page.format(source);

        page.formatter.setPlainJsonView(true);
        expect(page.element('jfContent_pre').textContent).toBe(JSON.stringify(value, null, 4));
        expect(page.element('jfContent_pre').style.display).not.toBe('none');
        page.formatter.setPlainJsonView(false);

        expect(page.element('jfContent').style.display).not.toBe('none');
        expect(page.editors).toHaveLength(1);
        expect(page.editors[0].disposed).toBe(false);
        expect(page.formatter.getSearchState().disabled).toBe(true);
    });

    it('indexes nested containers without scanning editor tokens or treating quoted brackets as containers', async () => {
        const page = loadJsonFormatPage(true);
        const nested = { payload: 'x'.repeat(600001), child: { items: [{ id: 1 }, [2, 3], {}], text: '{ [ } ]\nescaped' }, tail: 'end' };
        await page.format(JSON.stringify(nested));
        const editor = page.editors[0];
        const lines = editor.getValue().split('\n');
        const find = editor.config.foldOptions.rangeFinder;
        const lineOf = text => lines.findIndex(line => line.trim() === text);

        expect(find(null, { line: 0 })).toEqual({ from: { line: 0, ch: 1 }, to: { line: lines.length - 2, ch: lines.at(-2).length } });
        const child = lineOf('"child": {');
        const childEnd = lineOf('},');
        expect(find(null, { line: child }).to.line).toBe(lineOf('"text": "{ [ } ]\\nescaped"'));
        expect(find(null, { line: child }).from.line).toBe(child);
        expect(find(null, { line: lineOf('"items": [') }).to.line).toBe(lineOf('{}'));
        expect(find(null, { line: lineOf('[') }).to.line).toBe(lineOf('3'));
        expect(find(null, { line: lineOf('{}') })).toBeUndefined();
        expect(find(null, { line: lineOf('"text": "{ [ } ]\\nescaped"') })).toBeUndefined();
        expect(find(null, { line: childEnd })).toBeUndefined();
    });

    it('folds children first and replaces the read-only document to unfold without clearing overlapping marks', async () => {
        const page = loadJsonFormatPage(true);
        await page.format(source);
        expect(page.editors).toHaveLength(1);
        const editor = page.editors[0];

        page.formatter.collapseAll();
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(editor.folds.some(call => call.action === 'fold')).toBe(true);
        expect(editor.folds[0].position.line).toBe(editor.lastLine());
        page.formatter.expandAll();
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(editor.swappedDocuments).toHaveLength(1);
        expect(editor.swappedDocuments[0].value).toBe(editor.getValue());
        expect(editor.swappedDocuments[0].mode).toEqual(editor.config.mode);
        expect(editor.getValue()).toBe(JSON.stringify(value, null, 4));
    });

    it.each(['', '{"broken":', '{"status":"small"}'])('disposes the editor and cancels queued folding when input becomes %j', async nextSource => {
        const page = loadJsonFormatPage(true);
        page.app.jsonLintSwitch = false;
        await page.format(source);
        expect(page.editors).toHaveLength(1);
        const editor = page.editors[0];
        page.formatter.collapseAll();

        await page.format(nextSource);
        await new Promise(resolve => setTimeout(resolve, 20));

        expect(editor.disposed).toBe(true);
        expect(editor.folds).toHaveLength(0);
        expect(page.element('jfContent').style.display).not.toBe('none');
        expect(page.element('jfContent_pre').style.display).toBe('none');
    });

    it('cancels the folding addon viewport timer when disposing the result editor', async () => {
        const page = loadJsonFormatPage(true);
        await page.format(source);
        const editor = page.editors[0];
        let staleUpdate = false;
        editor.state.foldGutter = { changeUpdate: setTimeout(() => { staleUpdate = true; }, 0) };

        await page.format('');
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(staleUpdate).toBe(false);
        expect(editor.config.foldGutter).toBe(false);
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

function createFormatPage() {
    const nodes = new Map();
    const formats = [];
    let config;
    const node = id => {
        if (!nodes.has(id)) nodes.set(id, {innerHTML: '', textContent: '', style: {}});
        return nodes.get(id);
    };
    function $(selector) {
        const el = typeof selector === 'string' && /^#[\w-]+$/.test(selector)
            ? node(selector.slice(1)) : {innerHTML: '', textContent: '', style: {}};
        const wrapper = new Proxy({0: el, length: 1}, {
            get(target, name) {
                if (name in target) return target[name];
                if (name === 'html' || name === 'text') return value => {
                    const key = name === 'html' ? 'innerHTML' : 'textContent';
                    if (value === undefined) return el[key];
                    el[key] = typeof value === 'string' ? value : value[0].innerHTML;
                    return wrapper;
                };
                if (name === 'show' || name === 'hide') return () => {
                    el.style.display = name === 'hide' ? 'none' : '';
                    return wrapper;
                };
                if (name === 'empty') return () => { el.innerHTML = ''; el.textContent = ''; return wrapper; };
                return () => wrapper;
            }
        });
        return wrapper;
    }
    const context = vm.createContext({
        console, $, Blob,
        location: {protocol: 'https:'},
        localStorage: {getItem: () => null},
        document: {
            querySelector: selector => /^#[\w-]+$/.test(selector) ? node(selector.slice(1)) : null,
            addEventListener() {}
        },
        Vue: function(options) { config = options; },
        createInlineAiState: () => ({}),
        canBuildTableViewData: () => false
    });
    context.window = context;
    for (const file of ['json-auto-utils.js', 'json-decode.js', 'format-lib.js']) {
        vm.runInContext(readSource('apps/json-format/' + file), context);
    }
    vm.runInContext(readSource('apps/json-format/index.js').replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, ''), context);
    const app = {...config.data, $nextTick: callback => callback()};
    for (const [name, method] of Object.entries(config.methods)) app[name] = method.bind(app);
    node('pageContainer').__vue__ = app;
    context.JsonEnDecode.urlDecodeByFetch = async source => source;
    const format = context.Formatter.format;
    context.Formatter.format = (...args) => { const pending = format(...args); formats.push(pending); return pending; };
    vm.runInContext('editor = {getValue: () => window.source};', context);
    return {app, node, context, async format(source) {
        context.source = source;
        formats.length = 0;
        const ok = app.format();
        await Promise.resolve();
        await Promise.all(formats);
        return ok;
    }};
}

describe('large JSON page result lifecycle (#666 / #658)', () => {
    const value = {payload: 'x'.repeat(600001), tail: ['complete']};
    it.each([false, true])('renders full plaintext with autoDecode=%s', async autoDecode => {
        const page = createFormatPage();
        page.app.autoDecode = autoDecode;
        expect(await page.format(JSON.stringify(value))).toBe(true);
        expect(page.node('jfContent_pre').textContent).toBe(JSON.stringify(value, null, 4));
        expect(page.node('jfContent_pre').style.display).not.toBe('none');
        expect(page.app.jsonActionReady).toBe(true);
    });
    it('renders beyond the node budget and clears stale plaintext on invalid or empty input', async () => {
        const page = createFormatPage();
        const array = Array(20001).fill(1);
        page.app.jsonLintSwitch = false;
        for (const next of ['', '{bad:']) {
            expect(await page.format(JSON.stringify(array))).toBe(true);
            expect(page.node('jfContent_pre').textContent).toBe(JSON.stringify(array, null, 4));
            expect(await page.format(next)).toBe(false);
            expect(page.node('jfContent_pre').textContent).toBe('');
            expect(page.node('jfContent_pre').style.display).toBe('none');
            expect(page.node('jfContent').style.display).not.toBe('none');
            expect(page.app.jsonActionReady).toBe(false);
        }
    });
    it('returns to a visible tree after a large result', async () => {
        const page = createFormatPage();
        await page.format(JSON.stringify(value));
        await page.format('{"small":"visible"}');
        expect(page.node('jfContent').innerHTML).toContain('visible');
        expect(page.node('jfContent').style.display).not.toBe('none');
        expect(page.node('jfContent_pre').style.display).toBe('none');
    });
});

describe('tree data integrity', () => {
    it('#661: fallback copy removes nested menus and preserves menu-like user text', () => {
        const source = readSource('apps/json-format/format-lib.js');
        const start = source.indexOf('let getJsonText = function');
        const end = source.indexOf('let _getJsonPathKeys', start);
        let removeAllMenus = false;
        const value = {nested: {message: '复制|下载|删除', other: '复制路径|复制|下载|删除'}};
        const clone = {
            find(selector) {
                expect(selector).toBe('.boxOpt');
                return {remove() { removeAllMenus = true; }};
            },
            text() { return JSON.stringify(value) + (removeAllMenus ? '' : '复制|复制路径|下载|删除'); }
        };
        const actual = vm.runInNewContext(source.slice(start, end) + '\ngetJsonText(el);', {
            cachedJsonValue: null,
            el: {clone: () => clone},
            _safeStringify: (value, space) => JSON.stringify(value, null, space)
        });
        expect(JSON.parse(actual)).toEqual(value);
    });

    it('#669: collapse and expand include a root array as well as nested containers', () => {
        const source = readSource('apps/json-format/format-lib.js');
        const start = source.indexOf('let _collapseAllJsonNodes = function');
        const end = source.indexOf('/**', start);
        let collapsed = false;
        const rootArray = {
            removeClass(name) { if (name === 'collapsed') collapsed = false; },
            text() {}
        };
        const sandbox = {
            plainJsonViewEnabled: false, jfStatusBar: null,
            $(selector) { return selector.includes('.item-array') ? rootArray : {text() {}, removeClass() {}}; },
            collapse(target) { if (target === rootArray) collapsed = true; }
        };
        vm.runInNewContext(source.slice(start, end) + '\n_collapseAllJsonNodes();', sandbox);
        expect(collapsed).toBe(true);
        vm.runInNewContext('_expandAllJsonNodes();', sandbox);
        expect(collapsed).toBe(false);
    });

    it('#655: nested runner test_events survive worker tree formatting', () => {
        const value = {data: {runner: {test_events: [
            {name: 'first-event', payload: {steps: ['begin', 'end']}},
            {name: 'last-event', success: false}
        ]}}};
        const messages = runJsonWorker(JSON.stringify(value));
        const html = messages.find(message => message[0] === 'FORMATTED')[1];
        for (const text of ['test_events', 'first-event', 'last-event', 'begin', 'end', 'false']) {
            expect(html).toContain(text);
        }
    });
});

describe('explicit string escape / unescape (#647)', () => {
    function pageWithInput(source) {
        const page = createFormatPage();
        vm.runInContext(readSource('apps/json-format/json-bigint.js'), page.context);
        page.context.source = source;
        vm.runInContext('editor.setValue = value => { window.source = value; };', page.context);
        return page;
    }
    it('publishes the explicit transformation before any deferred Vue tick', () => {
        const page = pageWithInput('raw input');
        page.app.$nextTick = () => {};
        page.app.transformJsonString(false);
        expect(page.context.source).toBe('"raw input"');
        expect(page.app.fireChange).toBe(true);
    });
    it('round-trips quotes, backslashes, newlines and surrounding whitespace', () => {
        const source = '  {"path":"C:\\tmp",\n"text":"hello"} \n';
        const page = pageWithInput(source);
        page.app.transformJsonString(false);
        expect(page.context.source).toBe(JSON.stringify(source));
        page.app.transformJsonString(true);
        expect(page.context.source).toBe(source);
    });
    it.each(['{}', '[1]', 'true', '123', 'null', '"bad\nraw"', '"\\x41"', '\'text\''])('rejects %j without changing input', source => {
        const page = pageWithInput(source);
        page.app.transformJsonString(true);
        expect(page.context.source).toBe(source);
        expect(page.app.errorMsg).toContain('输入内容未改变');
    });
    it('decodes exactly one level and supports empty strings', () => {
        const once = JSON.stringify('{"nested":true}');
        const page = pageWithInput(JSON.stringify(once));
        page.app.transformJsonString(true);
        expect(page.context.source).toBe(once);
        page.context.source = '""';
        page.app.transformJsonString(true);
        expect(page.context.source).toBe('');
    });
});
