/**
 * JSON 核心纯函数回归测试
 * 覆盖 GitHub Issues + 已知 Bug：BigInt 精度、科学计数法、嵌套解析、编解码 等
 */
import { describe, it, expect } from 'vitest';
import {
    htmlspecialchars,
    isUrl,
    isBigNumberLike,
    getType,
    rebuildBigNumberFromParts,
    getBigNumberDisplayString,
    parseWithBigInt,
    deepParseJSONStrings,
    uniEncode,
    uniDecode,
    safeStringify,
    formatDate,
    getStringBytes,
    createSafeToastHTML,
} from '../apps/json-format/json-utils.js';

// ═══════════════════════════════════════════════════════
// 1. htmlspecialchars
// ═══════════════════════════════════════════════════════
describe('htmlspecialchars', () => {
    it('转义 HTML 特殊字符', () => {
        expect(htmlspecialchars('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        );
    });
    it('转义 & 号', () => {
        expect(htmlspecialchars('a&b')).toBe('a&amp;b');
    });
    it('转义单引号', () => {
        expect(htmlspecialchars("it's")).toBe('it&#039;s');
    });
    it('空字符串', () => {
        expect(htmlspecialchars('')).toBe('');
    });
});

// ═══════════════════════════════════════════════════════
// 2. isUrl
// ═══════════════════════════════════════════════════════
describe('isUrl', () => {
    it('http 协议', () => expect(isUrl('http://example.com')).toBe(true));
    it('https 协议', () => expect(isUrl('https://example.com/path?a=1')).toBe(true));
    it('ftp 协议', () => expect(isUrl('ftp://files.example.com')).toBe(true));
    it('非 URL', () => expect(isUrl('not-a-url')).toBe(false));
    it('null 输入', () => expect(isUrl(null)).toBe(false));
    it('数字输入', () => expect(isUrl(123)).toBe(false));
});

// ═══════════════════════════════════════════════════════
// 3. isBigNumberLike / getType
// ═══════════════════════════════════════════════════════
describe('isBigNumberLike', () => {
    it('识别 BigNumber duck-type', () => {
        expect(isBigNumberLike({ s: 1, e: 17, c: [99581589502011] })).toBe(true);
    });
    it('排除普通对象', () => {
        expect(isBigNumberLike({ a: 1, b: 2 })).toBe(false);
    });
    it('null 安全', () => {
        expect(isBigNumberLike(null)).toBe(false);
    });
});

describe('getType', () => {
    it('null', () => expect(getType(null)).toBe('null'));
    it('undefined', () => expect(getType(undefined)).toBe('undefined'));
    it('string', () => expect(getType('hello')).toBe('string'));
    it('number', () => expect(getType(42)).toBe('number'));
    it('boolean', () => expect(getType(true)).toBe('boolean'));
    it('array', () => expect(getType([1, 2])).toBe('array'));
    it('object', () => expect(getType({ a: 1 })).toBe('object'));
    it('bigint', () => expect(getType(BigInt('12345678901234567890'))).toBe('bigint'));
    it('BigNumber duck-type → bigint', () => {
        expect(getType({ s: 1, e: 5, c: [123456] })).toBe('bigint');
    });
});

// ═══════════════════════════════════════════════════════
// 4. BigNumber 还原
// ═══════════════════════════════════════════════════════
describe('rebuildBigNumberFromParts', () => {
    it('还原正整数', () => {
        expect(rebuildBigNumberFromParts({ s: 1, e: 5, c: [123456] })).toBe('123456');
    });
    it('还原负整数', () => {
        expect(rebuildBigNumberFromParts({ s: -1, e: 5, c: [123456] })).toBe('-123456');
    });
    it('还原小数', () => {
        expect(rebuildBigNumberFromParts({ s: 1, e: 0, c: [1, 23000000000000] })).toBe('1.23');
    });
    it('还原纯小数 (0.xxx)', () => {
        const result = rebuildBigNumberFromParts({ s: 1, e: -1, c: [5] });
        expect(result).toBe('0.5');
    });
});

describe('getBigNumberDisplayString', () => {
    it('原生 BigInt', () => {
        expect(getBigNumberDisplayString(BigInt('995815895020119788889'))).toBe(
            '995815895020119788889',
        );
    });
    it('BigNumber duck-type 对象', () => {
        const bn = { s: 1, e: 2, c: [123] };
        const result = getBigNumberDisplayString(bn);
        expect(result).toBe('123');
    });
    it('普通值 fallback', () => {
        expect(getBigNumberDisplayString(42)).toBe('42');
    });
});

// ═══════════════════════════════════════════════════════
// 5. parseWithBigInt — GitHub Issue 核心回归
// ═══════════════════════════════════════════════════════
describe('parseWithBigInt', () => {
    it('Issue: 16 位及以上整数保持精度', () => {
        const json = '{"id": 995815895020119788889}';
        const result = parseWithBigInt(json);
        expect(result.id).toBe(BigInt('995815895020119788889'));
    });

    it('Issue: 负大整数', () => {
        const json = '{"id": -9958158950201197888}';
        const result = parseWithBigInt(json);
        expect(result.id).toBe(BigInt('-9958158950201197888'));
    });

    it('15 位及以下整数保持为 number', () => {
        const json = '{"id": 123456789012345}';
        const result = parseWithBigInt(json);
        expect(typeof result.id).toBe('number');
        expect(result.id).toBe(123456789012345);
    });

    it('字符串内的大数字不被替换', () => {
        const json = '{"msg": "订单号：9958158950201197888"}';
        const result = parseWithBigInt(json);
        expect(typeof result.msg).toBe('string');
        expect(result.msg).toBe('订单号：9958158950201197888');
    });

    it('数组中的大整数', () => {
        const json = '[1234567890123456789, 42]';
        const result = parseWithBigInt(json);
        expect(result[0]).toBe(BigInt('1234567890123456789'));
        expect(result[1]).toBe(42);
    });

    it('嵌套对象中的大整数', () => {
        const json = '{"a": {"b": 1234567890123456789}}';
        const result = parseWithBigInt(json);
        expect(result.a.b).toBe(BigInt('1234567890123456789'));
    });

    it('宽松解析：单引号 key', () => {
        const json = "{'name': 'test', 'value': 123}";
        const result = parseWithBigInt(json);
        expect(result.name).toBe('test');
    });

    it('宽松解析：未加引号 key', () => {
        const json = '{name: "test", value: 123}';
        const result = parseWithBigInt(json);
        expect(result.name).toBe('test');
    });

    it('普通 JSON 解析（无大整数）', () => {
        const json = '{"a": 1, "b": "hello", "c": true, "d": null}';
        const result = parseWithBigInt(json);
        expect(result).toEqual({ a: 1, b: 'hello', c: true, d: null });
    });

    it('Issue: 科学计数法数字不丢精度', () => {
        const json = '{"val": 1.5e2}';
        const result = parseWithBigInt(json);
        expect(result.val).toBe(150);
    });

    it('Issue: 带尾零的小数', () => {
        const json = '{"val": 1.50}';
        const result = parseWithBigInt(json);
        expect(result.val).toBe(1.5);
    });
});

// ═══════════════════════════════════════════════════════
// 6. deepParseJSONStrings — 嵌套 JSON 解包
// ═══════════════════════════════════════════════════════
describe('deepParseJSONStrings', () => {
    it('解包字符串内的 JSON 对象', () => {
        const obj = { data: '{"name":"test"}' };
        const result = deepParseJSONStrings(obj);
        expect(result.data).toEqual({ name: 'test' });
    });

    it('解包字符串内的 JSON 数组', () => {
        const obj = { list: '[1, 2, 3]' };
        const result = deepParseJSONStrings(obj);
        expect(result.list).toEqual([1, 2, 3]);
    });

    it('递归多层解包', () => {
        const inner = JSON.stringify({ x: 1 });
        const outer = { data: JSON.stringify({ nested: inner }) };
        const result = deepParseJSONStrings(outer);
        expect(result.data.nested).toEqual({ x: 1 });
    });

    it('非 JSON 字符串保持不变', () => {
        const obj = { msg: 'hello world' };
        expect(deepParseJSONStrings(obj)).toEqual({ msg: 'hello world' });
    });

    it('BigNumber duck-type 不被误解包', () => {
        const obj = { val: '{"s":1,"e":5,"c":[123456]}' };
        const result = deepParseJSONStrings(obj);
        expect(typeof result.val).toBe('string');
    });

    it('空字符串安全', () => {
        expect(deepParseJSONStrings({ a: '' })).toEqual({ a: '' });
    });

    it('数组内的嵌套 JSON', () => {
        const arr = ['{"k":"v"}', 'plain'];
        const result = deepParseJSONStrings(arr);
        expect(result[0]).toEqual({ k: 'v' });
        expect(result[1]).toBe('plain');
    });

    it('null / 原始值安全', () => {
        expect(deepParseJSONStrings(null)).toBeNull();
        expect(deepParseJSONStrings(42)).toBe(42);
        expect(deepParseJSONStrings('str')).toBe('str');
    });
});

// ═══════════════════════════════════════════════════════
// 7. Unicode 编解码
// ═══════════════════════════════════════════════════════
describe('uniEncode / uniDecode', () => {
    it('中文编解码往返', () => {
        const str = '你好世界';
        expect(uniDecode(uniEncode(str))).toBe(str);
    });

    it('保留 JSON 结构字符', () => {
        const str = '{"key": "value"}';
        const encoded = uniEncode(str);
        expect(encoded).toContain('{');
        expect(encoded).toContain('}');
        expect(encoded).toContain(':');
    });

    it('特殊空白字符', () => {
        const str = 'a\tb\nc';
        const decoded = uniDecode(uniEncode(str));
        expect(decoded).toBe(str);
    });
});

// ═══════════════════════════════════════════════════════
// 8. safeStringify — BigInt 保精度
// ═══════════════════════════════════════════════════════
describe('safeStringify', () => {
    it('BigInt 输出为裸数字', () => {
        const obj = { id: BigInt('9958158950201197888') };
        const result = safeStringify(obj);
        expect(result).toBe('{"id":9958158950201197888}');
        expect(result).not.toContain('"9958158950201197888"');
    });

    it('普通数字不受影响', () => {
        const obj = { val: 42 };
        expect(safeStringify(obj)).toBe('{"val":42}');
    });

    it('支持 space 缩进', () => {
        const obj = { a: 1 };
        const result = safeStringify(obj, 2);
        expect(result).toContain('\n');
    });

    it('嵌套 BigInt', () => {
        const obj = { data: { id: BigInt('1234567890123456789') } };
        const result = safeStringify(obj);
        expect(result).toContain('1234567890123456789');
    });
});

// ═══════════════════════════════════════════════════════
// 9. formatDate（替代 Date.prototype.format）
// ═══════════════════════════════════════════════════════
describe('formatDate', () => {
    const date = new Date(2024, 0, 5, 9, 3, 7, 42); // 2024-01-05 09:03:07.042

    it('yyyy-MM-dd HH:mm:ss', () => {
        expect(formatDate(date, 'yyyy-MM-dd HH:mm:ss')).toBe('2024-01-05 09:03:07');
    });
    it('yy/M/d', () => {
        expect(formatDate(date, 'yy/M/d')).toBe('24/1/5');
    });
    it('毫秒格式化 SSS', () => {
        expect(formatDate(date, 'HH:mm:ss.SSS')).toBe('09:03:07.042');
    });
    it('非字符串 pattern 回退', () => {
        expect(formatDate(date, null)).toBe(date.toString());
    });
});

// ═══════════════════════════════════════════════════════
// 10. getStringBytes
// ═══════════════════════════════════════════════════════
describe('getStringBytes', () => {
    it('纯 ASCII', () => {
        expect(getStringBytes('hello')).toBe(5);
    });
    it('中文字符', () => {
        expect(getStringBytes('你好')).toBeGreaterThan(2);
    });
    it('空字符串', () => {
        expect(getStringBytes('')).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════
// 11. createSafeToastHTML（XSS 防护）
// ═══════════════════════════════════════════════════════
describe('createSafeToastHTML', () => {
    it('转义 HTML 标签防止 XSS', () => {
        const html = createSafeToastHTML('<img src=x onerror=alert(1)>');
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });
    it('正常内容安全输出', () => {
        const html = createSafeToastHTML('操作成功');
        expect(html).toContain('操作成功');
        expect(html).toContain('fehelper_alertmsg');
    });
});

// ═══════════════════════════════════════════════════════
// 12. 综合回归：端到端 JSON 解析 → 格式化 → 输出
// ═══════════════════════════════════════════════════════
describe('端到端回归', () => {
    it('包含 BigInt 的完整 JSON 往返', () => {
        const input = '{"orderId": 9958158950201197888, "amount": 99.5, "name": "test"}';
        const parsed = parseWithBigInt(input);
        expect(parsed.orderId).toBe(BigInt('9958158950201197888'));
        expect(parsed.amount).toBe(99.5);
        expect(parsed.name).toBe('test');

        const output = safeStringify(parsed);
        expect(output).toContain('9958158950201197888');
        expect(output).not.toMatch(/\d+n[,\}]/); // 无 BigInt 后缀 "n"
    });

    it('嵌套转义 JSON + BigInt', () => {
        // inner 本身包含大整数的 JSON 字符串——deepParse 会递归解包至对象
        const inner = '{"id": 1234567890123456789}';
        const outer = { data: JSON.stringify({ nested: inner }) };
        const unpacked = deepParseJSONStrings(outer);
        // nested 被递归解包为对象
        expect(typeof unpacked.data.nested).toBe('object');
        expect(unpacked.data.nested.id).toBe(1234567890123456789);
    });

    it('JSONP 格式预处理', () => {
        const jsonp = 'callback({"status": 200, "id": 1234567890123456789})';
        const match = /^([\w.]+)\(\s*([\s\S]*)\s*\)$/gm.exec(jsonp);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('callback');
        const parsed = parseWithBigInt(match[2]);
        expect(parsed.id).toBe(BigInt('1234567890123456789'));
    });

    it('Issue: URL 编码的 JSON', () => {
        const encoded = '%7B%22name%22%3A%22test%22%7D';
        const decoded = decodeURIComponent(encoded);
        expect(JSON.parse(decoded)).toEqual({ name: 'test' });
    });
});
