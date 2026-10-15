import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { describe, expect, it } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function loadDatetimeCalc() {
    const elements = {};
    const documentStub = {
        addEventListener() {},
        querySelector(selector) {
            return elements[selector] || null;
        },
        querySelectorAll() {
            return [];
        },
        getElementById(id) {
            return elements['#' + id] || null;
        },
        createElement() {
            return { style: {}, appendChild() {}, addEventListener() {} };
        },
        body: {
            appendChild() {},
            removeChild() {}
        },
        head: {
            appendChild() {}
        }
    };
    const sandbox = {
        console,
        Date,
        Intl,
        Math,
        setInterval() { return 1; },
        clearInterval() {},
        document: documentStub,
        navigator: { language: 'zh-CN' },
        chrome: {
            runtime: { sendMessage() {} },
            storage: { local: { get(_keys, cb) { cb && cb({}); }, set(_data, cb) { cb && cb(); } } }
        },
        window: {}
    };
    sandbox.window = sandbox;
    sandbox.elements = elements;
    vm.runInNewContext(readSource('apps/datetime-calc/index.js'), sandbox, { filename: 'datetime-calc/index.js' });
    return sandbox;
}

describe('datetime-calc issue regressions', () => {
    it('Issue #648: opens the existing batch converter from the legacy timestamp tool', () => {
        const app = loadDatetimeCalc();
        app.location = {hash: '#batch-converter'};
        app.TimestampApp.initUI();
        expect(app.AppState.activeTab).toBe('batch-converter');
        expect(readSource('apps/timestamp/index.html')).toContain('../datetime-calc/index.html#batch-converter');
    });

    it('converts mixed batch rows independently and renders invalid input as text', () => {
        const app = loadDatetimeCalc();
        app.AppState.selectedTimezone = 'UTC';
        app.elements['.batch-input'] = {value: '1700000000\n2023-11-14 22:13:20\n<img src=x onerror=alert(1)>'};
        app.elements['.batch-results'] = {innerHTML: ''};
        app.elements['.result-stats'] = {innerHTML: ''};
        app.TimestampApp.batchConvert();
        expect(app.elements['.result-stats'].innerHTML).toContain('成功：2，失败：1');
        expect(app.elements['.batch-results'].innerHTML).toContain('1700000000');
        expect(app.elements['.batch-results'].innerHTML).toContain('&lt;img');
        expect(app.elements['.batch-results'].innerHTML).not.toContain('<img');
    });
    it('Issue #644: parses historical 11-13 digit millisecond timestamps without treating short numbers as timestamps', () => {
        const app = loadDatetimeCalc();

        expect(app.TimeUtils.parseTimeInput('949680000000')).toMatchObject({
            timestamp: 949680000000,
            format: 'Unix时间戳(毫秒, 11-13位)'
        });
        expect(app.TimeUtils.parseTimeInput('12345678901').timestamp).toBe(12345678901);
        expect(app.TimeUtils.parseTimeInput('1234567890123').timestamp).toBe(1234567890123);
        expect(app.TimeUtils.parseTimeInput('2026').format).not.toContain('Unix时间戳');
    });

    it('Issue #635: supports explicit manual UTC offset while preserving automatic IANA conversion helpers', () => {
        const app = loadDatetimeCalc();

        expect(app.parseUTCOffsetMinutes('+08:00')).toBe(480);
        expect(app.parseUTCOffsetMinutes('-0500')).toBe(-300);
        expect(app.parseUTCOffsetMinutes('-5')).toBe(-300);
        expect(app.parseUTCOffsetMinutes('9.5')).toBe(570);
        expect(app.parseUTCOffsetMinutes('+9.5')).toBe(570);
        expect(app.parseUTCOffsetMinutes('UTC+9:30')).toBe(570);
        expect(app.parseUTCOffsetMinutes('GMT+5:45')).toBe(345);
        expect(app.formatUTCOffset(-300)).toBe('UTC-05:00');
        expect(app.getUTCTimestampFromFixedOffsetLocal('2026-08-15 00:00:00', 480))
            .toBe(Date.UTC(2026, 7, 14, 16, 0, 0));
        expect(() => app.parseUTCOffsetMinutes('+14:30')).toThrow('UTC 偏移范围');
        expect(() => app.parseUTCOffsetMinutes('UTC+14.25')).toThrow('UTC 偏移范围');
        expect(typeof app.getUTCTimestampFromLocal).toBe('function');
    });
});
