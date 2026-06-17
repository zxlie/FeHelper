import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const utils = require('../apps/json-format/json-auto-utils.js');

describe('json-auto-utils', () => {
    it('用与手动 JSON 工具一致的宽松解析处理自动格式化输入', () => {
        const parsed = utils.parseJSONLike("{status: 'ok', id: 1234567890123456789}");

        expect(parsed.value.status).toBe('ok');
        expect(parsed.value.id).toBe(BigInt('1234567890123456789'));
        expect(parsed.normalizedSource).toBe('{"status":"ok","id":1234567890123456789}');
    });

    it('识别 JSONP 并保留回调名元信息', () => {
        const parsed = utils.parseJSONLike('callback({"status":200})');

        expect(parsed.funcName).toBe('callback');
        expect(parsed.value.status).toBe(200);
        expect(parsed.normalizedSource).toBe('{"status":200}');
    });

    it('Issue #576: 自动解码破坏合法 JSON 时回退原始 JSON', () => {
        const source = '{"url":"https://example.com/callback?payload=%7B%22status%22%3Atrue%7D"}';
        const decoded = decodeURIComponent(source);

        expect(() => utils.parseWithBigInt(decoded)).toThrow();
        expect(utils.coerceDecodedJSONSource(source, decoded)).toBe(source);
        expect(utils.parseJSONLike(utils.coerceDecodedJSONSource(source, decoded))).not.toBeNull();
    });

    it('自动解码得到完整 JSON 时使用解码后的合法 JSON', () => {
        const source = '%7B%22name%22%3A%22FeHelper%22%7D';
        const decoded = decodeURIComponent(source);

        expect(utils.coerceDecodedJSONSource(source, decoded)).toBe('{"name":"FeHelper"}');
    });

    it('支持顶层转义 JSON 的嵌套解析', () => {
        const source = '"{\\"id\\":1234567890123456789}"';
        const parsed = utils.parseJSONLike(source, { nestedEscapeParse: true });

        expect(parsed.value.id).toBe(BigInt('1234567890123456789'));
        expect(parsed.normalizedSource).toBe('{"id":1234567890123456789}');
    });

    it('兼容带 XSSI/防劫持前缀的 JSON 页面内容', () => {
        const source = `)]}'\n{"status":"ok","items":[1,2,3]}`;
        const parsed = utils.parseJSONLike(source);

        expect(parsed).not.toBeNull();
        expect(parsed.value.status).toBe('ok');
        expect(parsed.normalizedSource).toBe('{"status":"ok","items":[1,2,3]}');
    });

    it('兼容正文前后带说明文本的 JSON 片段', () => {
        const source = 'source viewer\n{"status":"ok","payload":{"count":2}}\nrendered by browser';
        const parsed = utils.parseJSONLike(source);

        expect(parsed).not.toBeNull();
        expect(parsed.value.payload.count).toBe(2);
        expect(parsed.normalizedSource).toBe('{"status":"ok","payload":{"count":2}}');
    });
});
