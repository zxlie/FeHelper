import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

// Use the packaged Vue reactivity in Node; extension APIs are only local stubs.
function openPasswordTool(storage = new Map(), unavailable = false) {
    let app;
    const context = vm.createContext({
        console: { warn: vi.fn(), error: vi.fn() },
        setTimeout: vi.fn(),
        localStorage: {
            getItem(key) {
                if (unavailable) throw new Error('Storage unavailable');
                return storage.get(key) ?? null;
            },
            setItem(key, value) {
                if (unavailable) throw new Error('Storage unavailable');
                storage.set(key, value);
            },
            removeItem(key) { storage.delete(key); }
        },
        chrome: { runtime: { sendMessage: vi.fn() } }
    });
    vm.runInContext(readSource('apps/static/vendor/vue/vue.js'), context);
    const Vue = context.Vue;
    context.Vue = function(options) {
        delete options.el;
        app = new Vue(options);
        options.mounted.call(app);
        return app;
    };
    vm.runInContext(readSource('apps/password/index.js'), context);
    return app;
}

const defaults = {
    number: true, lowerLetter: true, upperLetter: true,
    specialChar: false, length: 20, count: 1
};

describe('Issue #674: remember password generation options', () => {
    it('keeps defaults on first use without storing passwords', () => {
        const storage = new Map();
        const app = openPasswordTool(storage);
        expect(app).toMatchObject(defaults);
        expect(app.resultContent).toBe('');
        expect(storage.size).toBe(0);
    });

    it('restores all options after edits without requiring Generate', async () => {
        const storage = new Map([['password:special-chars', '!@']]);
        const app = openPasswordTool(storage);
        const settings = {
            number: false, lowerLetter: false, upperLetter: false,
            specialChar: true, length: 12, count: 3
        };
        Object.assign(app, settings, { length: '12', count: '3' });
        await app.$nextTick();
        const reopened = openPasswordTool(storage);
        expect(reopened).toMatchObject(settings);
        expect(reopened.customSpecialChar).toBe('!@');
        expect(reopened.resultContent).toBe('');
        reopened.convert();
        await reopened.$nextTick();
        expect(reopened.resultContent.split('\n')).toHaveLength(3);
        expect(reopened.resultContent.split('\n').every(value => /^[!@]{12}$/.test(value))).toBe(true);
        expect(JSON.parse(storage.get('password:settings'))).toEqual(settings);
        expect([...storage.keys()].sort()).toEqual(['password:settings', 'password:special-chars']);
    });

    it('preserves false switches and zero length', async () => {
        const storage = new Map();
        const app = openPasswordTool(storage);
        Object.assign(app, { number: false, lowerLetter: false, upperLetter: false, length: 0 });
        await app.$nextTick();
        expect(openPasswordTool(storage)).toMatchObject({
            number: false, lowerLetter: false, upperLetter: false,
            specialChar: false, length: 0, count: 1
        });
    });

    it.each(['{broken', 'null', '[]', '42', JSON.stringify({
        number: 'false', lowerLetter: 0, upperLetter: null,
        specialChar: 'true', length: -1, count: 0, resultContent: 'saved-secret'
    })])('ignores invalid saved settings: %s', saved => {
        const app = openPasswordTool(new Map([['password:settings', saved]]));
        expect(app).toMatchObject(defaults);
        expect(app.resultContent).toBe('');
    });

    it('still generates passwords when storage reads and writes fail', async () => {
        const app = openPasswordTool(new Map(), true);
        expect(app).toMatchObject(defaults);
        app.length = 8;
        app.convert();
        await app.$nextTick();
        expect(app.resultContent).toMatch(/^[a-zA-Z0-9]{8}$/);
    });
});

describe('password tool settings', () => {
    it('Issue #619: special characters can be edited and reset', () => {
        const html = readSource('apps/password/index.html');
        const source = readSource('apps/password/index.js');
        const css = readSource('apps/password/index.css');

        expect(html).toContain('id="specialCharSet"');
        expect(html).toContain('v-model="customSpecialChar"');
        expect(html).toContain(':disabled="!specialChar"');
        expect(html).toContain('@input="updateSpecialChars"');
        expect(html).toContain('@click="resetSpecialChars"');
        expect(source).toContain('defaultSpecialChar:');
        expect(source).toContain('customSpecialChar:');
        expect(source).toContain("const PASSWORD_SPECIAL_CHARS_KEY = 'password:special-chars';");
        expect(source).toContain('safeGetLocalStorage: function(key)');
        expect(source).toContain('safeSetLocalStorage: function(key, value)');
        expect(source).toContain('safeRemoveLocalStorage: function(key)');
        expect(source).toContain('const savedSpecialChars = this.safeGetLocalStorage(PASSWORD_SPECIAL_CHARS_KEY);');
        expect(source).toContain('getSelectedCharPool: function()');
        expect(source).toContain('this.chars.specialChar = this.customSpecialChar;');
        expect(source).toContain('this.safeSetLocalStorage(PASSWORD_SPECIAL_CHARS_KEY, this.customSpecialChar);');
        expect(source).toContain('this.safeRemoveLocalStorage(PASSWORD_SPECIAL_CHARS_KEY);');
        expect(source).toContain('updateSpecialChars: function()');
        expect(source).toContain('resetSpecialChars: function()');
        expect(source).toContain("this.showToastMsg(this.specialChar ? '请先配置特殊符号集合' : '请至少选择一种字符');");
        expect(css).toContain('.password-card .special-char-editor');
        expect(css).toContain('.password-card .special-char-input.form-control');
    });
});
