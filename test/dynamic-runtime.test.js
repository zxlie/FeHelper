import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { describe, it, expect } from 'vitest';

const runtimePath = path.resolve('apps/dynamic/runtime.js');
const runtimeSource = fs.readFileSync(runtimePath, 'utf8');

function loadRuntime(overrides = {}) {
    const sandbox = {
        console,
        globalThis: null,
        window: null,
        ...overrides
    };
    sandbox.globalThis = sandbox;
    sandbox.window = sandbox.window || sandbox;
    vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
    return sandbox.window.FHDynamicRuntime;
}

describe('dynamic runtime developer support', () => {
    function createNativeFunction(context = {}) {
        return function (...args) {
            const code = String(args.pop() || '');
            const names = args;
            return function (...values) {
                const sandbox = { console, ...context };
                names.forEach((name, index) => {
                    sandbox[name] = values[index];
                });
                return vm.runInNewContext(`(function(){${code}\n}).call(this)`, sandbox);
            };
        };
    }

    it('dynamic index.html uses external helper scripts instead of inline bootstrap', () => {
        const html = fs.readFileSync(path.resolve('apps/dynamic/index.html'), 'utf8');
        expect(html).toContain('<script src="native-function.js"></script>');
        expect(html).toContain('<script src="runtime.js"></script>');
        expect(html).not.toMatch(/<script>\s*\/\/ 保留原生 Function 引用/);
    });

    it('collectAssetKeys strips query strings from stored source keys', () => {
        const runtime = loadRuntime();
        const nodes = [{
            getAttribute(name) {
                if (name === 'data-type') return 'js';
                if (name === 'data-source') return '../demo/a.js?v=1,../demo/b.js?hash=2';
                return '';
            }
        }, {
            getAttribute(name) {
                if (name === 'data-type') return 'css';
                if (name === 'data-source') return '../demo/a.css?theme=dark';
                return '';
            }
        }];

        expect(runtime.collectAssetKeys(nodes)).toEqual({
            js: ['../demo/a.js', '../demo/b.js'],
            css: ['../demo/a.css']
        });
    });

    it('recoverNativeFunction falls back to iframe Function when evalCore has replaced window.Function', () => {
        const runtime = loadRuntime();
        const iframeFunction = createNativeFunction();
        const replacedFunction = function (code) {
            if (String(code).includes('const ') || String(code).includes('=>')) {
                throw new SyntaxError('legacy parser cannot handle modern syntax');
            }
            return iframeFunction(code);
        };

        let removed = false;
        const fakeWindow = {
            Function: replacedFunction,
            console
        };
        const fakeDocument = {
            documentElement: {
                appendChild() {}
            },
            createElement(tag) {
                expect(tag).toBe('iframe');
                return {
                    style: {},
                    setAttribute() {},
                    remove() {
                        removed = true;
                    },
                    contentWindow: {
                        Function: iframeFunction
                    }
                };
            }
        };

        const recovered = runtime.recoverNativeFunction(fakeWindow, fakeDocument);
        expect(recovered('const answer = 40 + 2; return answer;')()).toBe(42);
        expect(fakeWindow.__FH_NATIVE_FUNCTION__).toBe(recovered);
        expect(removed).toBe(true);
    });

    it('executeScripts can run modern bundle code even after window.Function is replaced', () => {
        const runtime = loadRuntime();
        const fakeWindow = {
            console
        };
        const iframeFunction = createNativeFunction();
        const replacedFunction = function (code) {
            if (String(code).includes('const ') || String(code).includes('=>')) {
                throw new SyntaxError('legacy parser cannot handle modern syntax');
            }
            return iframeFunction(code);
        };
        fakeWindow.Function = replacedFunction;
        const fakeDocument = {
            body: {
                style: {},
                innerHTML: '',
                dataset: {}
            },
            documentElement: {
                appendChild() {}
            },
            createElement() {
                return {
                    style: {},
                    setAttribute() {},
                    remove() {},
                    contentWindow: {
                        Function: iframeFunction
                    }
                };
            }
        };

        const ok = runtime.executeScripts([
            'const add = (a, b) => a + b;',
            'window.__dynamicToolResult = add(19, 23);',
            'document.body.dataset.executed = "yes";'
        ], { win: fakeWindow, doc: fakeDocument });

        expect(ok).toBe(true);
        expect(fakeWindow.__dynamicToolResult).toBe(42);
        expect(fakeDocument.body.dataset.executed).toBe('yes');
        expect(fakeDocument.body.innerHTML).toBe('');
    });
});
