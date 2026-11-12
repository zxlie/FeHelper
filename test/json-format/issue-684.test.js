import fs from 'node:fs';
import vm from 'node:vm';
import {describe, expect, it} from 'vitest';
import {createFormatPage, readSource, flush} from './runtime.js';

// Optional baseline source enables the exact same tests against the pre-fix code.
const formatterSource = process.env.FH_684_SOURCE
    ? fs.readFileSync(process.env.FH_684_SOURCE, 'utf8')
    : readSource('apps/json-format/format-lib.js');

function fixture() {
    const page = createFormatPage();
    const {context} = page;
    const buttons = [];
    const loads = [];
    const handlers = new Map();
    const $ = context.$;
    context.$ = selector => {
        const el = $(selector);
        if (selector === undefined) el.length = 0;
        if (selector === '#jfContent') {
            const find = el.find;
            el.find = selector => {
                if (selector !== '[data-fh-lazy]') return find(selector);
                const id = nodeId(page.node('jfContent').innerHTML);
                const list = {find: () => ({each() {}}), html(value) {loads.push(value);}};
                const root = {first: () => root, children: () => list,
                    attr(name, value) {return value === undefined ? String(id) : root;},
                    removeClass: () => root};
                return root;
            };
            el.on = (event, selector, handler) => {handlers.set(selector, handler); return el;};
        }
        if (typeof selector === 'string' && selector.startsWith('<button')) {
            const bind = el.bind;
            el.bind = (event, handler) => {
                buttons.push({html: selector, click: () => handler({preventDefault() {}, stopPropagation() {}})});
                return bind(event, handler);
            };
        }
        return el;
    };
    // Test-only access to the real renderer, without adding production exports.
    vm.runInContext(formatterSource.replace('format: format,', `
        __test: {
            node: typeof _pagedJsonNodeHtml === 'function' ? _pagedJsonNodeHtml : undefined,
            children: typeof _pagedJsonChildrenHtml === 'function' ? _pagedJsonChildrenHtml : undefined,
            entries: () => pagedJsonNodes,
            prepare(value) {
                cachedJsonValue = value;
                cachedJsonString = _safeStringify(value, 4);
                pagedJsonViewEnabled = true;
            },
            text: _stringifyJsonNodeValue,
            path: _getJsonPathForElement,
            remove: _handleNodeOptionClick,
            load: typeof _loadPagedJsonChildren === 'function' ? _loadPagedJsonChildren : undefined,
            snapshot: () => cachedJsonString,
            replacePagedRender(callback) {_renderPagedJsonTree = callback;},
            events: _addEvents
        }, format: format,`), context);
    return {...page, buttons, loads, handlers, api: context.Formatter.__test};
}

const largeArray = () => Array.from({length: 20001}, (_,i) => ({id: i, nested: {last: i === 20000}}));
const nodeId = html => Number(html.match(/data-fh-lazy="(\d+)"/)[1]);
const nodeEl = id => ({attr: name => name === 'data-fh-lazy' ? String(id) : undefined});

function openRoot(api, value) {
    api.prepare(value);
    const id = nodeId(api.node(value, []));
    const entry = api.entries().get(id);
    return {id, entry, html: api.children(entry, 0)};
}

describe('#684: large JSON remains available as an on-demand tree', () => {
    it.each([['array', largeArray()], ['characters', {payload: 'x'.repeat(2000001)}],
        ['depth', Array.from({length: 110}).reduce(value => ({child: value}), {tail: true})]
    ])('offers a node view beyond the existing %s safety limit through the manual page', async (_, value) => {
        const page = fixture();
        page.app.autoDecode = false;
        expect(await page.format(JSON.stringify(value))).toBe(true);
        expect(page.context.Formatter.isLargeJsonPlainViewEnabled()).toBe(true);
        expect(page.node('jfContent_pre').textContent).toBe(JSON.stringify(value, null, 4));
        expect(page.buttons.some(button => button.html.includes('fh-json-paged-tree'))).toBe(true);
    });


    it('switches from full text to a visible bounded tree using the real toolbar handler', async () => {
        const page = fixture();
        await page.format(JSON.stringify(largeArray()));
        page.buttons.find(button => button.html.includes('fh-json-paged-tree')).click();
        expect(page.context.Formatter.isLargeJsonPlainViewEnabled()).toBe(false);
        expect(page.context.Formatter.isPlainJsonViewEnabled()).toBe(false);
        expect(page.node('jfContent').style.display).not.toBe('none');
        expect(page.node('jfContent_pre').style.display).toBe('none');
        expect(page.loads[0].match(/data-array-index=/g)).toHaveLength(100);
        expect(page.api.entries().size).toBe(101);
        expect(page.handlers.has('.fh-json-page, .fh-json-full-string')).toBe(true);
    });

    it('deletes a tail item from the complete cache and rebuilds page cursors', async () => {
        const page = fixture();
        const value = largeArray();
        await page.format(JSON.stringify(value));
        const {api, context} = page;
        const root = openRoot(api, value);
        const tail = api.children(root.entry, 20000);
        let refreshed = 0;
        api.replacePagedRender(() => refreshed++);
        const el = {length: 1, ...nodeEl(nodeId(tail)), hasClass: () => true,
            parent: () => ({is: () => false})};
        const action = {hasClass: name => name === 'opt-del', closest: () => el};
        const $ = context.$;
        context.$ = target => target === action ? action : $(target);
        context.toast = () => {};
        context.CustomEvent = class {constructor(type, options) {this.type = type; this.detail = options.detail;}};
        const events = [];
        context.document.dispatchEvent = event => events.push(event);
        api.remove({target: action, preventDefault() {}, stopPropagation() {}});
        expect(value).toHaveLength(20000);
        expect(JSON.parse(api.snapshot()).at(-1).id).toBe(19999);
        expect(refreshed).toBe(1);
        expect(JSON.parse(events.at(-1).detail.source)).toHaveLength(20000);
    });

    it('reveals full long strings as text through the delegated click handler', async () => {
        const page = fixture();
        const value = {payload: 'x'.repeat(2000001) + '<script>tail</script>'};
        await page.format(JSON.stringify(value));
        const {html} = openRoot(page.api, value);
        page.api.events();
        let text = '', removed = false;
        const string = {text(value) {text = value; return string;}, addClass() {return string;}};
        const el = {...nodeEl(nodeId(html)), children: () => string};
        const button = {hasClass: () => false, closest: () => el, remove() {removed = true;}};
        const $ = page.context.$;
        page.context.$ = target => target === button ? button : $(target);
        page.handlers.get('.fh-json-page, .fh-json-full-string').call(button, {preventDefault() {}, stopPropagation() {}});
        expect(JSON.parse(text)).toBe(value.payload);
        expect(removed).toBe(true);
    });

    it('also offers the tree through the public content-script startup and decoding chain', async () => {
        const page = fixture();
        const {context} = page;
        const messages = [];
        context.clearInterval = clearInterval;
        context.chrome = {runtime: {getURL: path => path, sendMessage(message, callback) {
            messages.push(message.thing);
            if (message.thing === 'request-jsonformat-options') callback({
                JSON_PAGE_FORMAT: true, MAX_JSON_KEYS_NUMBER: 0,
                AUTO_TEXT_DECODE: true, NESTED_ESCAPE_PARSE: false
            });
        }}};
        context.Awesome = {collectAndSendClientInfo() {}};
        context.Node = {ELEMENT_NODE: 1, TEXT_NODE: 3};
        context.location.protocol = 'chrome-extension:'; // fixture DOM is installed before starting
        // DOM shell/toolbar mounting and status-bar layout are outside this VM harness.
        // Keep the public startup, options requests, detection, decoding and formatter calls real.
        vm.runInContext(readSource('apps/json-format/content-script.js')
            .replace('_mountFormatterShell();', 'window.__shellMounted = true;')
            .replace('_initToolbar();', 'window.__toolbarMounted = true;'), context);
        context.Formatter.setStatusBarEnabled = () => {};
        const source = JSON.stringify({rows: largeArray(), note: '%E4%B8%AD'});
        context.location.href = 'http://localhost/large.json';
        context.location.protocol = 'http:';
        context.URL = URL;
        context.document.contentType = 'application/json';
        const classList = {add() {}, remove() {}, toggle() {}};
        context.document.documentElement = {classList};
        context.document.body = {childNodes: [], children: [], textContent: source, classList};
        context.document.querySelectorAll = selector => selector === 'body>pre' ? [{textContent: source}] : [];
        context.JsonEnDecode.urlDecodeByFetch = async text => decodeURIComponent(text);
        context.JsonAutoFormat.format();
        await new Promise(resolve => setTimeout(resolve, 10));
        await flush();
        expect(context.__shellMounted).toBe(true);
        expect(context.__toolbarMounted).toBe(true);
        expect(messages).toContain('inject-content-css');
        expect(messages.filter(message => message === 'request-jsonformat-options')).toHaveLength(2);
        expect(JSON.parse(page.node('jfContent_pre').textContent).rows).toHaveLength(20001);
        expect(JSON.parse(page.node('jfContent_pre').textContent).note).toBe('中');
        expect(page.buttons.some(button => button.html.includes('fh-json-paged-tree'))).toBe(true);
    });

    it('renders only 100 immediate children and reaches the final array item without losing its path/value', () => {
        const {api} = fixture();
        const value = largeArray();
        const root = openRoot(api, value);
        expect(root.html.match(/data-array-index=/g)).toHaveLength(100);
        expect(root.html).not.toContain('nested'); // child objects remain unopened
        expect(api.entries().size).toBe(101);
        const tail = api.children(root.entry, 20000);
        expect(tail.match(/data-array-index=/g)).toHaveLength(1);
        expect(tail).toContain('20001–20001 / 20001 项');
        expect(api.path(nodeEl(nodeId(tail)))).toBe('$[20000]');
        expect(JSON.parse(api.text(nodeEl(nodeId(tail))))).toEqual(value[20000]);
        expect(api.snapshot()).toBe(JSON.stringify(value, null, 4));
    });

    it('pages wide objects, keeps numeric key order, and escapes markup in keys and values', () => {
        const {api, context} = fixture();
        const value = context.FHJsonAutoUtils.parseWithBigInt('{"2":"first","1":"second","<img src=x>":"<script>bad</script>","tail":1234567890123456789}');
        for (let i = 0; i < 20001; i++) value['key' + i] = i;
        const root = openRoot(api, value);
        expect(root.html.indexOf('>2</span>')).toBeLessThan(root.html.indexOf('>1</span>'));
        expect(root.html).toContain('&lt;img src=x&gt;');
        expect(root.html).toContain('&lt;script&gt;bad&lt;/script&gt;');
        expect(root.html).not.toContain('<script>');
        expect(root.html).toContain('1234567890123456789');
        const tail = api.children(root.entry, 999999);
        expect(tail).toContain('key20000');
        expect(tail).toContain('20001–20005 / 20005 项');
    });

    it('walks a 110-level value without eagerly rendering descendants', () => {
        const {api} = fixture();
        const value = Array.from({length: 110}).reduce(child => ({child}), {tail: 'reachable'});
        let {entry, html} = openRoot(api, value);
        for (let i = 0; i < 110; i++) {
            expect(html.match(/data-fh-lazy=/g)).toHaveLength(1);
            entry = api.entries().get(nodeId(html));
            html = api.children(entry, 0);
        }
        expect(html).toContain('reachable');
        expect(api.path(nodeEl(nodeId(html)))).toBe('$' + '.child'.repeat(110) + '.tail');
    });

    it.each(['x', 'https://example.invalid/'])('bounds %s string previews while preserving the complete value', prefix => {
        const {api} = fixture();
        const value = {payload: prefix + 'x'.repeat(2000001)};
        const {html} = openRoot(api, value);
        expect(html.length).toBeLessThan(3000);
        expect(html).toContain('fh-json-full-string');
        expect(html).not.toContain('<a ');
        expect(JSON.parse(api.text(nodeEl(nodeId(html))))).toBe(value.payload);
    });

    it('drops old page registrations and selection when paging instead of accumulating all rows', () => {
        let replacement = '';
        const loaderPage = fixture();
        const root = openRoot(loaderPage.api, largeArray());
        const old = [...loaderPage.api.entries().keys()].filter(key => key !== root.id);
        const $ = loaderPage.context.$;
        loaderPage.context.$ = target => target && target.testId ? {attr: () => target.testId} : $(target);
        const children = {find: () => ({each(callback) {old.forEach(testId => callback.call({testId}));}}),
            html(value) {replacement = value;}};
        const el = {attr(name, value) {return value === undefined ? String(root.id) : el;},
            children: () => children, removeClass() {return el;}};
        loaderPage.api.load(el, 20000);
        expect(replacement).toContain('data-array-index="20000"');
        expect(loaderPage.api.entries().size).toBe(2);
        old.forEach(id => expect(loaderPage.api.entries().has(id)).toBe(false));
    });

    it('never presents a partial DOM search as a full JSON search, and resets for the next input', async () => {
        const {api, context} = fixture();
        openRoot(api, largeArray());
        expect(context.Formatter.search('unloaded')).toMatchObject({disabled: true, total: 0});
        expect(context.Formatter.getSearchState().reason).toContain('全文');
        await context.Formatter.format('{"small":"visible"}');
        await flush();
        expect(api.entries().size).toBe(0);
        expect(context.Formatter.getSearchState().disabled).toBe(false);
    });
});
