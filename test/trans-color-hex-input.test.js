import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { describe, expect, it } from 'vitest';

function loadTransColorApp() {
    const source = fs.readFileSync(path.resolve('apps/trans-color/index.js'), 'utf8');
    let options;

    vm.runInNewContext(source, {
        Vue: function Vue(config) {
            options = config;
        },
        chrome: {
            runtime: {
                sendMessage: () => {}
            }
        },
        document: {
            createElement: () => ({ textContent: '' }),
            head: { appendChild: () => {} }
        },
        console
    });

    const app = JSON.parse(JSON.stringify(options.data));
    Object.keys(options.methods).forEach(methodName => {
        app[methodName] = options.methods[methodName].bind(app);
    });

    return app;
}

describe('trans-color HEX input regression guards', () => {
    it('does not normalize the actively edited HEX input on every keypress', () => {
        const app = loadTransColorApp();

        app.fromHEX = '#000';
        app.updateFromHEX();

        expect(app.fromHEX).toBe('#000');
        expect(app.toHEX).toBe('#000000');
        expect(app.toRGB).toBe('rgb(0, 0, 0)');

        app.fromHEX = '#0000';
        app.updateFromHEX();

        expect(app.fromHEX).toBe('#0000');
        expect(app.toHEX).toBe('#00000000');
        expect(app.toRGB).toBe('rgba(0, 0, 0, 0)');
    });

    it('still updates other color input fields when HEX changes', () => {
        const app = loadTransColorApp();

        app.fromHEX = '#f00';
        app.updateFromHEX();

        expect(app.fromHEX).toBe('#f00');
        expect(app.fromRGB).toBe('rgb(255, 0, 0)');
        expect(app.fromHSL).toBe('hsl(0, 100%, 50%)');
        expect(app.fromHSV).toBe('hsv(0, 100%, 100%)');
    });

    it('keeps non-HEX source inputs stable while synchronizing converted fields', () => {
        const app = loadTransColorApp();

        app.fromRGB = 'rgb(255, 0, 0)';
        app.updateFromRGB();

        expect(app.fromRGB).toBe('rgb(255, 0, 0)');
        expect(app.fromHEX).toBe('#ff0000');
        expect(app.toHEX).toBe('#ff0000');
    });
});
