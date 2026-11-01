import {describe, expect, it, vi} from 'vitest';
import {createFormatPage, flush} from './runtime.js';

function workerPage() {
    const page = createFormatPage();
    const workers = [];
    page.context.location.protocol = 'chrome-extension:';
    page.context.navigator = {userAgent: 'Chromium'};
    page.context.chrome = {runtime: {getURL: path => 'chrome-extension://fehelper/' + path}};
    page.context.top = page.context;
    page.context.parent = page.context;
    page.context.Worker = class {
        constructor() { workers.push(this); }
        postMessage() {}
        terminate() { this.terminated = true; }
    };
    return {...page, workers};
}

const large = JSON.stringify({payload: 'x'.repeat(641056), tail: ['complete']});

describe('#658: old Worker results must not replace a newer large JSON', () => {
    it('ignores queued completion and error events after switching to the full-text result', async () => {
        const page = workerPage();
        await page.format('{"old":true}');
        const worker = page.workers[0];
        expect(worker).toBeDefined();
        const onmessage = worker.onmessage;
        const onerror = worker.onerror;
        await page.format(large);
        onmessage({data: ['FORMATTED', '<div>OLD TREE</div>']});
        onerror(new Error('late failure'));
        await flush();
        expect(page.node('jfContent_pre').textContent).toBe(JSON.stringify(JSON.parse(large), null, 4));
        expect(page.node('jfContent_pre').style.display).not.toBe('none');
        expect(page.node('jfContent').innerHTML).not.toContain('OLD TREE');
        expect(page.context.Formatter.isLargeJsonPlainViewEnabled()).toBe(true);
    });

    it('keeps the timeout armed after a FORMATTING progress message', async () => {
        vi.useFakeTimers();
        try {
            const page = workerPage();
            page.context.setTimeout = setTimeout;
            page.context.clearTimeout = clearTimeout;
            await page.format('{"tail":"recovered after stalled worker"}');
            page.workers[0].onmessage({data: ['FORMATTING']});
            await vi.advanceTimersByTimeAsync(5001);
            expect(page.node('jfContent').innerHTML).toContain('recovered after stalled worker');
            expect(page.node('formattingMsg').style.display).toBe('none');
        } finally { vi.useRealTimers(); }
    });

    it('discards a superseded request before worker setup finishes', async () => {
        const page = workerPage();
        const pending = page.context.Formatter.format('{"old":true}');
        await page.context.Formatter.format(large);
        await pending;
        await flush();
        expect(page.workers[0].terminated).toBe(true);
        expect(page.node('jfContent_pre').style.display).not.toBe('none');
        expect(page.node('jfContent_pre').textContent).toContain('complete');
    });
});


it('#658 cancels old worker success/error/timeout while the next input is decoding', async () => {
    vi.useFakeTimers();
    try {
        const page = workerPage();
        page.context.setTimeout = setTimeout;
        page.context.clearTimeout = clearTimeout;
        await page.format('{"old":true}');
        const worker = page.workers[0];
        const success = worker.onmessage, failure = worker.onerror;
        page.app.autoDecode = true;
        let finish;
        page.context.JsonEnDecode.urlDecodeByFetch = source => new Promise(resolve => { finish = () => resolve(source); });
        await page.format('{"new":true}');
        const whileDecoding = page.node('jfContent').innerHTML;
        success({data: ['FORMATTED', 'OLD TREE']});
        failure(new Error('old worker failure'));
        await vi.advanceTimersByTimeAsync(5001);
        expect(page.node('jfContent').innerHTML).not.toContain('OLD TREE');
        expect(page.node('jfContent').innerHTML).toBe(whileDecoding);
        expect(worker.terminated).toBe(true);
        finish();
        await flush();
        page.workers.at(-1).onmessage({data: ['FORMATTED', 'NEW TREE']});
        expect(page.node('jfContent').innerHTML).toBe('NEW TREE');
    } finally { vi.useRealTimers(); }
});
