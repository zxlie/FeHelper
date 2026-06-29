import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

describe('datetime-calc layout regression guards', () => {
    it('keeps timestamp tool select controls on native browser rendering', () => {
        const cssSource = readSource('apps/datetime-calc/index.css');

        expect(cssSource).toContain('.panel-section select.form-control {');
        expect(cssSource).toContain('height: 50px;');
        expect(cssSource).toContain('line-height: normal;');
        expect(cssSource).not.toContain('appearance: none;');
        expect(cssSource).not.toContain('-webkit-appearance: none;');
        expect(cssSource).not.toContain('-moz-appearance: none;');
        expect(cssSource).not.toMatch(/select\.form-control[^{]*\{[\s\S]*?background-image:\s*url\("data:image\/svg\+xml/);
    });
});
