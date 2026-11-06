import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('../apps/background/inject-tools.js', () => ({ default: {} }));
import Monkey from '../apps/background/monkey.js';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const legacyScript = `(() => {
  const events = ['contextmenu', 'selectstart', 'copy', 'cut', 'dragstart', 'mousedown'];
  events.forEach(ev => {
    document.addEventListener(ev, e => e.stopPropagation(), true);
    window.addEventListener(ev, e => e.stopPropagation(), true);
  });
  document.oncontextmenu = document.onselectstart = document.oncopy = null;
  console.log('[FeHelper] 已解除复制/右键限制');
})();`;

function template(context = vm.createContext({ window: {} })) {
    const html = read('apps/page-monkey/index.html');
    for (const [, src] of html.matchAll(/src="([^"]*(?:templates|monkey-free-copy)\.js)"/g)) {
        vm.runInContext(read(path.join('apps/page-monkey', src)), context);
    }
    return { ...context.window.MonkeyTemplates.flatMap(c => c.list).find(t => t.mName.includes('自由复制')), id: 'copy' };
}

// Supplemental capture-phase harness; this does not replace native browser QA.
function page() {
    const handlers = [];
    const target = name => ({ addEventListener: (type, fn, capture) => handlers.push({ name, type, fn, capture }) });
    const window = { ...target('window'), postMessage() {}, location: { href: 'https://example.com/logs' } };
    const document = { ...target('document'), oncopy: vi.fn(), onselectstart: vi.fn(), oncontextmenu: vi.fn() };
    const context = vm.createContext({ window, document, location: window.location, console: { log() {}, warn() {}, error() {} } });
    const element = (tag, editable = false) => ({
        nodeType: 1, isContentEditable: editable,
        matches: selector => selector.split(',').map(s => s.trim()).includes(tag)
    });
    function dispatch(type, eventPath = [element('div')]) {
        const event = { type, target: eventPath[0], composedPath: () => eventPath, stopped: false,
            stopPropagation() { this.stopped = true; }, preventDefault: vi.fn() };
        for (const name of ['window', 'document']) {
            for (const h of handlers.filter(h => h.name === name && h.type === type && h.capture)) h.fn(event);
            if (event.stopped) break;
        }
        return event;
    }
    return { context, window, document, element, dispatch, run: code => vm.runInContext(code, context) };
}

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('free-copy template compatibility (#682)', () => {
    it('preserves pointer events needed by query editors, time pickers and drag controls', () => {
        const p = page();
        p.run(template().mScript);
        for (const type of ['mousedown', 'mouseup', 'click', 'dragstart', 'keydown', 'input', 'change', 'cut', 'paste']) {
            expect(p.dispatch(type).stopped, type).toBe(false);
        }
    });

    it('preserves editable controls and composed paths through shadow roots', () => {
        const p = page();
        const oncopy = p.document.oncopy;
        p.run(template().mScript);
        const paths = [
            [p.element('input')], [p.element('textarea')], [p.element('select')],
            [p.element('span', true)], [p.element('span'), p.element('[role="textbox"]')],
            [p.element('textarea'), { nodeType: 11 }, p.element('div')]
        ];
        for (const eventPath of paths) {
            for (const type of ['copy', 'selectstart', 'contextmenu']) {
                expect(p.dispatch(type, eventPath).stopped, type).toBe(false);
            }
        }
        expect(p.document.oncopy).toBe(oncopy);
    });

    it('still bypasses copy, selection and context menu restrictions on ordinary text', () => {
        const p = page();
        const tpl = template();
        p.run(tpl.mScript);
        for (const type of ['copy', 'selectstart', 'contextmenu']) {
            const event = p.dispatch(type, [{ nodeType: 3 }, p.element('p')]);
            expect(event.stopped, type).toBe(true);
            expect(event.preventDefault).not.toHaveBeenCalled();
        }
        expect(tpl.mStyle).toContain('user-select: text !important');
    });

    it('leaves document-wide editors in control of copy and selection', () => {
        const p = page();
        p.document.designMode = 'on';
        p.run(template().mScript);
        for (const type of ['copy', 'selectstart', 'contextmenu']) {
            expect(p.dispatch(type).stopped).toBe(false);
        }
    });

    it('upgrades only the exact legacy built-in script and preserves user settings', () => {
        const original = { ...template(), mScript: legacyScript, mName: 'renamed copy helper', mIncludes: ['https://example.com/*'], mDisabled: true };
        const migrated = Monkey.migrateMonkey({ ...original });
        expect(migrated.mScript).not.toBe(legacyScript);
        expect(migrated.mScript).toBe(template().mScript);
        expect(migrated).toMatchObject({ mName: original.mName, mIncludes: original.mIncludes, mDisabled: true });
        expect(Monkey.migrateMonkey(migrated).mScript).toBe(template().mScript);
        const custom = { ...original, mScript: legacyScript + '\n// user customization' };
        expect(Monkey.migrateMonkey(custom).mScript).toBe(custom.mScript);
    });

    it('shows the upgraded script in the manager and installs the same safe template', () => {
        let options;
        const saved = { ...template(), mScript: legacyScript };
        const context = vm.createContext({
            window: {}, URL, location: { href: 'chrome-extension://test/page-monkey/index.html' },
            Vue: function (config) { options = config; },
            chrome: { storage: { local: { get: (_keys, cb) => cb({
                'PAGE-MODIFIER-LOCAL-STORAGE-KEY': JSON.stringify([saved])
            }) } } }
        });
        const tpl = template(context);
        vm.runInContext(read('apps/page-monkey/index.js'), context);
        const app = { ...options.data, persist: vi.fn(), toast: vi.fn() };
        options.methods.loadMonkeys.call(app);
        expect(app.cachedMonkeys[0].mScript).toBe(tpl.mScript);
        options.methods.installTemplate.call(app, tpl);
        expect(app.cachedMonkeys).toHaveLength(2);
        expect(app.cachedMonkeys[1].mScript).toBe(tpl.mScript);
        expect(app.persist).toHaveBeenCalledOnce();
    });

    it('starts stored legacy copies through the real background pipeline, including child frames', async () => {
        vi.useFakeTimers();
        const p = page();
        // The content script is a compatibility stub and must not inject a second copy.
        p.run(read('apps/page-monkey/content-script.js'));
        p.window.pagemonkeyContentScript();
        const stored = { ...template(), mScript: legacyScript };
        const calls = [];
        const css = [];
        vi.stubGlobal('chrome', {
            storage: { local: { get: (_key, cb) => cb({ 'PAGE-MODIFIER-LOCAL-STORAGE-KEY': JSON.stringify([stored]) }), set() {} } },
            scripting: {
                executeScript: async options => {
                    calls.push(options);
                    if (options.func.name === 'executeUserScript') {
                        vm.runInContext('(' + options.func.toString() + ')', p.context)(...options.args);
                    }
                    return [{ frameId: 2, result: options.func.name === 'claimUserStyle' }];
                },
                insertCSS: async options => css.push(options)
            }
        });
        Monkey.start({ tabId: 7, frameId: 2, url: p.window.location.href, runAt: 'document-start' });
        await vi.waitFor(() => expect(p.window.__fhMonkeyExecuted?.copy).toBe(true));
        expect(p.dispatch('mousedown').stopped).toBe(false);
        expect(p.dispatch('copy', [p.element('input')]).stopped).toBe(false);
        expect(p.dispatch('copy').stopped).toBe(true);
        expect(calls.find(c => c.func.name === 'executeUserScript')).toMatchObject({ world: 'MAIN', target: { tabId: 7, frameIds: [2] } });
        expect(css[0]).toMatchObject({ target: { tabId: 7, frameIds: [2] }, css: stored.mStyle });
    });
});
