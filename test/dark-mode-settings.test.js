import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function sourceBetween(source, startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    return source.slice(start, end);
}

describe('dark mode settings policy', () => {
    it('clears always-dark when auto-dark is disabled during load and save', () => {
        const optionsSource = readSource('apps/options/index.js');
        const loadBlock = sourceBetween(optionsSource, 'async loadSettings() {', '// 检查浏览器类型');
        const saveBlock = sourceBetween(optionsSource, 'async saveSettings() {', '// 设置快捷键');

        expect(optionsSource).toMatch(/normalizeDarkModeOptions\(opts = {}\)[\s\S]*normalizedOpts\.ALWAYS_DARK_MODE = 'false';/);
        expect(loadBlock).toContain('const normalizedOpts = this.normalizeDarkModeOptions(opts);');
        expect(loadBlock).toContain('Settings.setOptions(normalizedOpts);');
        expect(saveBlock).toContain('this.normalizeDarkModeSelections();');
        expect(saveBlock).toContain('opts = this.normalizeDarkModeOptions(opts);');
    });

    it('keeps dark mode preference as an explicit single-choice setting', () => {
        const optionsSource = readSource('apps/options/index.js');
        const optionsHtml = readSource('apps/options/index.html');

        expect(optionsSource).toMatch(/normalizeDarkModeSelections\(\)[\s\S]*!this\.selectedOpts\.includes\('AUTO_DARK_MODE'\)[\s\S]*this\.selectedOpts = this\.selectedOpts\.filter\(key => key !== 'ALWAYS_DARK_MODE'\);/);
        expect(optionsSource).toMatch(/selectedOpts:\s*{[\s\S]*handler\(\)[\s\S]*this\.normalizeDarkModeSelections\(\);/);
        expect(optionsSource).toMatch(/darkModePreference\(\)[\s\S]*return 'always';[\s\S]*return 'system';[\s\S]*return 'off';/);
        expect(optionsSource).toMatch(/setDarkModePreference\(preference\)[\s\S]*preference === 'always'[\s\S]*'AUTO_DARK_MODE', true[\s\S]*'ALWAYS_DARK_MODE', true/);
        expect(optionsSource).toMatch(/preference === 'system'[\s\S]*'AUTO_DARK_MODE', true[\s\S]*'ALWAYS_DARK_MODE', false/);
        expect(optionsHtml).toContain('name="dark_mode_preference"');
        expect(optionsHtml).toContain('id="DARK_MODE_OFF"');
        expect(optionsHtml).toContain('id="DARK_MODE_SYSTEM"');
        expect(optionsHtml).toContain('id="DARK_MODE_ALWAYS"');
    });

    it('uses only Chrome/system preference for automatic dark mode', () => {
        [
            'apps/options/index.js',
            'apps/options/theme-boot.js',
            'apps/static/js/dark-mode.js',
            'apps/static/js/tool-layout.js',
            'apps/popup/theme-boot.js',
            'apps/json-format/content-script.js'
        ].forEach(filePath => {
            const source = readSource(filePath);

            expect(source, filePath).not.toMatch(/isNightTime|_isNightTime/);
            expect(source, filePath).not.toMatch(/prefersColorSchemeDark\(\)\s*\|\|/);
            expect(source, filePath).not.toMatch(/19:00|06:00|05:59|夜间时段兜底/);
        });

        expect(readSource('apps/options/index.html')).not.toContain('19:00 到 06:00');
    });

    it('does not treat string "false" as enabled in JSON auto-format pages', () => {
        const source = readSource('apps/json-format/content-script.js');

        expect(source).toContain("let _isEnabledSetting = value => value === true || value === 'true';");
        expect(source).toContain('formatOptions.AUTO_DARK_MODE = _isEnabledSetting(formatOptions.AUTO_DARK_MODE);');
        expect(source).toContain('formatOptions.ALWAYS_DARK_MODE = _isEnabledSetting(formatOptions.ALWAYS_DARK_MODE);');
        expect(source).toContain('if (_isEnabledSetting(formatOptions.ALWAYS_DARK_MODE)) {');
        expect(source).toContain('if (!_isEnabledSetting(formatOptions.AUTO_DARK_MODE)) {');
        expect(source).toContain('if (_isEnabledSetting(formatOptions.AUTO_DARK_MODE) && String(formatOptions.JSON_FORMAT_THEME || 0) === \'0\') {');
    });
});
