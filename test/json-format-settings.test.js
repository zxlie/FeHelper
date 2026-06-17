import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

describe('json-format settings regression guards', () => {
    it('uses explicit defaults for content-script json-format options', () => {
        const source = readSource('apps/background/background.js');

        expect(source).toContain('const defaultOptions = {');
        expect(source).toContain('JSON_TOOL_BAR_ALWAYS_SHOW: true');
        expect(source).toContain('ENABLE_JSON_KEY_SORT: true');
        expect(source).toContain('NESTED_ESCAPE_PARSE: false');
        expect(source).toContain('AUTO_TEXT_DECODE: false');
        expect(source).toContain('JSON_FORMAT_COMPACT_MODE: true');
        expect(source).toContain("const migrated = String(result.FH_JSONFORMAT_DEFAULTS_MIGRATED) === 'true';");
        expect(source).toContain('if (Array.isArray(params)) {');
        expect(source).toContain("} else if (typeof params === 'string') {");
        expect(source).toContain("storageQuery = Object.assign({FH_JSONFORMAT_DEFAULTS_MIGRATED: false}, params || {});");
        expect(source).toContain("result.JSON_TOOL_BAR_ALWAYS_SHOW = true;");
        expect(source).toContain("result.ENABLE_JSON_KEY_SORT = true;");
        expect(source).toContain("result.NESTED_ESCAPE_PARSE = false;");
        expect(source).toContain("ENABLE_JSON_KEY_SORT: 'true'");
        expect(source).toContain("NESTED_ESCAPE_PARSE: 'false'");
        expect(source).toContain("FH_JSONFORMAT_DEFAULTS_MIGRATED: 'true'");
        expect(source).toContain("result[key] === undefined || result[key] === null || result[key] === ''");
        expect(source).not.toContain('result[key] = (""+result[key] !== \'false\');');
    });

    it('manual json-format page no longer silently inherits legacy nested-parse keys', () => {
        const source = readSource('apps/json-format/index.js');

        expect(source).toContain("this.nestedEscapeParse = (this.safeGetLocalStorage('jsonformat:nested-escape-parse') === 'true');");
        expect(source).not.toContain('jsonformat:auto-unpack-json-string');
        expect(source).not.toContain('jsonformat:escape-json-string');
    });

    it('content-script exposes a persistent compact mode toggle', () => {
        const source = readSource('apps/json-format/content-script.js');
        const cssSource = readSource('apps/json-format/content-script.css');

        expect(source).toContain("JSON_FORMAT_COMPACT_MODE: 'JSON_FORMAT_COMPACT_MODE'");
        expect(source).toContain("id=\"compactModeToggle\"");
        expect(source).toContain('formatOptions.JSON_FORMAT_COMPACT_MODE = enabled;');
        expect(cssSource).toContain('body.fh-json-compact');
    });
});
