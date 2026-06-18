import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

describe('chart-maker layout regression guards', () => {
    it('keeps the chart canvas sized by a stable responsive wrapper', () => {
        const cssSource = readSource('apps/chart-maker/style.css');

        expect(cssSource).toContain('min-height: calc(100dvh - 80px);');
        expect(cssSource).toContain('flex: 1 1 420px;');
        expect(cssSource).toContain('min-height: 420px;');
        expect(cssSource).toContain('width: 100% !important;');
        expect(cssSource).toContain('height: 100% !important;');
        expect(cssSource).not.toContain('left: -230px;');
    });

    it('respects the legend-position selector for simple data charts', () => {
        const generatorSource = readSource('apps/chart-maker/chart-generator.js');

        expect(generatorSource).toContain("display: settings.legendPosition !== 'none'");
        expect(generatorSource).not.toContain('options.plugins.legend.display = false;');
        expect(generatorSource).not.toContain('settings.isSimpleData ||');
    });
});
