import {describe, expect, it} from 'vitest';
import {createFormatPage, flush} from './runtime.js';

const large = JSON.stringify({payload: 'x'.repeat(600001), tail: ['complete']});

describe('#666: asynchronous automatic decoding must not blank or replace a newer result', () => {
    it('renders the original large JSON when URL decoding fails', async () => {
        const page = createFormatPage();
        page.app.autoDecode = true;
        page.context.JsonEnDecode.urlDecodeByFetch = async () => {throw new Error('fetch blocked');};
        await page.format(large);
        await flush();
        expect(page.node('jfContent_pre').textContent).toBe(JSON.stringify(JSON.parse(large), null, 4));
        expect(page.app.jsonActionReady).toBe(true);
    });

    it.each(['', '{bad:', '{"latest":true}'])('ignores old decoded content after input becomes %j', async latest => {
        const page = createFormatPage();
        const pending = [];
        page.app.jsonLintSwitch = false;
        page.app.autoDecode = true;
        page.context.JsonEnDecode.urlDecodeByFetch = source => new Promise(resolve => pending.push(() => resolve(source)));
        await page.format(large);
        page.app.autoDecode = false;
        await page.format(latest);
        const before = {html: page.node('jfContent').innerHTML, plain: page.node('jfContent_pre').textContent};
        pending[0]();
        await flush();
        expect(page.node('jfContent').innerHTML).toBe(before.html);
        expect(page.node('jfContent_pre').textContent).toBe(before.plain);
    });

    it('falls back when automatic decoding introduces unescaped quotes', async () => {
        const page = createFormatPage();
        page.app.autoDecode = true;
        const value = {url: '%22', payload: 'x'.repeat(600001)};
        const source = JSON.stringify(value);
        page.context.JsonEnDecode.urlDecodeByFetch = async text => decodeURIComponent(text);
        await page.format(source);
        await flush();
        expect(page.node('jfContent_pre').textContent).toBe(JSON.stringify(value, null, 4));
        expect(page.app.jsonFormattedSource).toBe(source);
    });

    it('keeps derived actions aligned with a successful decoded result', async () => {
        const page = createFormatPage();
        page.app.autoDecode = true;
        page.context.JsonEnDecode.urlDecodeByFetch = async text => decodeURIComponent(text);
        await page.format('{"label":"%E4%B8%AD%E6%96%87"}');
        await flush();
        expect(JSON.parse(page.app.jsonFormattedSource)).toEqual({label: '中文'});
        expect(page.node('jfContent').innerHTML).toContain('中文');
    });
});
