import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

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
