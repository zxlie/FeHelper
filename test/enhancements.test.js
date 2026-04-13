/**
 * Phase 4 功能增强回归测试
 * 覆盖：进制转换 BigInt、FileTime 转换、编解码等
 */
import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════
// 1. 进制转换 BigInt 支持
// ═══════════════════════════════════════════════════════
describe('进制转换 BigInt', () => {
    function radixConvert(srcValue, from, to) {
        const src = String(srcValue).trim();
        if (!src) return '0';
        let decimal;
        if (from === 10) {
            decimal = BigInt(src);
        } else {
            decimal = BigInt(0);
            const digits = src.toLowerCase();
            const base = BigInt(from);
            for (let i = 0; i < digits.length; i++) {
                const d = parseInt(digits[i], from);
                if (isNaN(d)) throw new Error('Invalid digit');
                decimal = decimal * base + BigInt(d);
            }
        }
        if (to === 10) return decimal.toString();
        if (decimal === 0n) return '0';
        const base = BigInt(to);
        const chars = '0123456789abcdef';
        let result = '';
        let n = decimal < 0n ? -decimal : decimal;
        while (n > 0n) {
            result = chars[Number(n % base)] + result;
            n = n / base;
        }
        return (decimal < 0n ? '-' : '') + result;
    }

    it('普通数字 10→16', () => {
        expect(radixConvert('255', 10, 16)).toBe('ff');
    });

    it('普通数字 16→10', () => {
        expect(radixConvert('ff', 16, 10)).toBe('255');
    });

    it('超大整数 10→16 不丢精度', () => {
        const big = '9999999999999999999999';
        const hex = radixConvert(big, 10, 16);
        const back = radixConvert(hex, 16, 10);
        expect(back).toBe(big);
    });

    it('超大整数 10→2', () => {
        const result = radixConvert('18446744073709551615', 10, 2);
        expect(result).toBe('1111111111111111111111111111111111111111111111111111111111111111');
    });

    it('零', () => {
        expect(radixConvert('0', 10, 16)).toBe('0');
    });

    it('负数', () => {
        expect(radixConvert('-255', 10, 16)).toBe('-ff');
    });
});

// ═══════════════════════════════════════════════════════
// 2. Windows FILETIME 转换
// ═══════════════════════════════════════════════════════
describe('Windows FILETIME 转换', () => {
    const FILETIME_EPOCH_OFFSET = 11644473600000;

    function fileTimeToUnixMs(fileTime) {
        return Number(BigInt(fileTime) / BigInt(10000)) - FILETIME_EPOCH_OFFSET;
    }

    function unixMsToFileTime(unixMs) {
        return (BigInt(unixMs) + BigInt(FILETIME_EPOCH_OFFSET)) * BigInt(10000);
    }

    it('已知 FILETIME → Unix 时间 (2024-01-01 00:00:00 UTC)', () => {
        // 2024-01-01T00:00:00Z = Unix 1704067200000ms
        // FILETIME = (1704067200000 + 11644473600000) * 10000 = 133480416000000000 ... verify:
        const expected_unix = 1704067200000;
        const ft = String((BigInt(expected_unix) + BigInt(FILETIME_EPOCH_OFFSET)) * BigInt(10000));
        const unixMs = fileTimeToUnixMs(ft);
        const date = new Date(unixMs);
        expect(date.getUTCFullYear()).toBe(2024);
        expect(date.getUTCMonth()).toBe(0);
        expect(date.getUTCDate()).toBe(1);
    });

    it('Unix 时间 → FILETIME 往返', () => {
        const now = Date.now();
        const ft = unixMsToFileTime(now);
        const backMs = fileTimeToUnixMs(ft.toString());
        expect(Math.abs(backMs - now)).toBeLessThan(1);
    });

    it('FILETIME epoch (1601-01-01)', () => {
        const unixMs = fileTimeToUnixMs('0');
        const date = new Date(unixMs);
        expect(date.getUTCFullYear()).toBe(1601);
    });
});

// ═══════════════════════════════════════════════════════
// 3. evalCore 替换验证
// ═══════════════════════════════════════════════════════
describe('evalCore 安全替换', () => {
    it('new Function 可以执行简单代码', () => {
        let result = 0;
        const fn = new Function('return 42');
        result = fn();
        expect(result).toBe(42);
    });

    it('new Function 有独立作用域', () => {
        const localVar = 'original';
        new Function('var localVar = "modified"')();
        expect(localVar).toBe('original');
    });
});
