/**
 * JSON 核心纯函数模块 —— 可被 Vitest 直接测试，也供 format-lib / json-worker 引用
 */

// ─── HTML 转义 ──────────────────────────────────────────────
export function htmlspecialchars(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─── URL 检测 ───────────────────────────────────────────────
export function isUrl(str) {
    if (typeof str !== 'string') return false;
    return /^(https?:\/\/|ftp:\/\/)[^\s<>"'\\]+$/i.test(str);
}

// ─── BigNumber duck-typing ──────────────────────────────────
export function isBigNumberLike(value) {
    return (
        value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        typeof value.s === 'number' &&
        typeof value.e === 'number' &&
        Array.isArray(value.c)
    );
}

// ─── 类型判断 ───────────────────────────────────────────────
export function getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'bigint') return 'bigint';
    if (typeof value === 'object') {
        if (isBigNumberLike(value)) return 'bigint';
        if (Array.isArray(value)) return 'array';
        return 'object';
    }
    return typeof value;
}

// ─── BigNumber → 字符串 ─────────────────────────────────────
export function rebuildBigNumberFromParts(value) {
    const sign = value.s < 0 ? '-' : '';
    const CHUNK_SIZE = 14;
    let digits = '';

    for (let i = 0; i < value.c.length; i++) {
        let chunkStr = Math.abs(value.c[i]).toString();
        if (i > 0) {
            chunkStr = chunkStr.padStart(CHUNK_SIZE, '0');
        }
        digits += chunkStr;
    }

    digits = digits.replace(/^0+/, '') || '0';
    const decimalIndex = value.e + 1;

    if (decimalIndex <= 0) {
        const zeros = '0'.repeat(Math.abs(decimalIndex));
        let fraction = zeros + digits;
        fraction = fraction.replace(/0+$/, '');
        if (!fraction) return sign + '0';
        return sign + '0.' + fraction;
    }
    if (decimalIndex >= digits.length) {
        return sign + digits + '0'.repeat(decimalIndex - digits.length);
    }

    const intPart = digits.slice(0, decimalIndex);
    let fracPart = digits.slice(decimalIndex).replace(/0+$/, '');
    if (!fracPart) return sign + intPart;
    return sign + intPart + '.' + fracPart;
}

export function getBigNumberDisplayString(value) {
    if (typeof value === 'bigint') return value.toString();
    if (!isBigNumberLike(value)) return String(value);

    if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
        try {
            const result = value.toString();
            if (typeof result === 'string' && result !== '[object Object]') {
                return result;
            }
        } catch (_) {}
    }
    return rebuildBigNumberFromParts(value);
}

// ─── BigInt 安全解析（统一实现，替代 format-lib 和 json-worker 各自的版本）──
export function parseWithBigInt(text) {
    text = String(text).trim();

    // 1) 宽松修正：单引号 key → 双引号 key
    let fixed = text.replace(/([\{,]\s*)'([^'\\]*?)'(\s*:)/g, '$1"$2"$3');
    // 2) 未加引号 key 补双引号
    fixed = fixed.replace(/([\{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    // 3) 单引号值 → 双引号值（仅对 : 后面的单引号字符串）
    fixed = fixed.replace(/(:\s*)'([^'\\]*?)'/g, '$1"$2"');

    // 3) 标记 16 位及以上的整数，确保不在字符串内部
    const marked = fixed.replace(
        /([:,\[]\s*)(-?\d{16,})(\s*)(?=[,\]\}])/g,
        function (match, prefix, number, spaces, offset) {
            let inStr = false;
            let esc = false;
            for (let i = 0; i < offset; i++) {
                if (esc) { esc = false; continue; }
                if (fixed[i] === '\\') { esc = true; continue; }
                if (fixed[i] === '"') inStr = !inStr;
            }
            if (inStr) return match;
            return prefix + '"__BigInt__' + number + '"' + spaces;
        },
    );

    return JSON.parse(marked, function (_key, value) {
        if (typeof value === 'string' && value.startsWith('__BigInt__')) {
            try {
                return BigInt(value.slice(10));
            } catch (_) {
                return value.slice(10);
            }
        }
        return value;
    });
}

// ─── 深度解包嵌套 JSON 字符串 ──────────────────────────────
export function deepParseJSONStrings(obj) {
    if (Array.isArray(obj)) {
        return obj.map((item) => {
            if (typeof item === 'string' && item.trim()) {
                try {
                    const parsed = JSON.parse(item);
                    if (_isDeepParsable(parsed)) {
                        return deepParseJSONStrings(parsed);
                    }
                } catch (_) {}
            }
            return deepParseJSONStrings(item);
        });
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val === 'string' && val.trim()) {
                try {
                    const parsed = JSON.parse(val);
                    if (_isDeepParsable(parsed)) {
                        newObj[key] = deepParseJSONStrings(parsed);
                        continue;
                    }
                } catch (_) {}
            }
            newObj[key] = deepParseJSONStrings(val);
        }
        return newObj;
    }
    return obj;
}

function _isDeepParsable(parsed) {
    if (typeof parsed !== 'object' || parsed === null) return false;
    if (!Array.isArray(parsed) && Object.prototype.toString.call(parsed) !== '[object Object]') return false;
    // 排除 BigNumber duck-type {s, e, c}
    if (isBigNumberLike(parsed) && Object.keys(parsed).length === 3) return false;
    return true;
}

// ─── Unicode 编解码 ─────────────────────────────────────────
export function uniEncode(str) {
    return escape(str)
        .replace(/%u/gi, '\\u')
        .replace(/%7b/gi, '{')
        .replace(/%7d/gi, '}')
        .replace(/%3a/gi, ':')
        .replace(/%2c/gi, ',')
        .replace(/%27/gi, "'")
        .replace(/%22/gi, '"')
        .replace(/%5b/gi, '[')
        .replace(/%5d/gi, ']')
        .replace(/%3D/gi, '=')
        .replace(/%08/gi, '\b')
        .replace(/%0D/gi, '\r')
        .replace(/%0C/gi, '\f')
        .replace(/%09/gi, '\t')
        .replace(/%20/gi, ' ')
        .replace(/%0A/gi, '\n')
        .replace(/%3E/gi, '>')
        .replace(/%3C/gi, '<')
        .replace(/%3F/gi, '?');
}

export function uniDecode(text) {
    text = text.replace(/(\\)?\\u/gi, '%u').replace('%u0025', '%25');
    text = unescape(text.toString().replace(/%2B/g, '+'));
    const matches = text.match(/(%u00([0-9A-F]{2}))/gi);
    if (matches) {
        for (const m of matches) {
            const code = m.substring(1, 3);
            const x = Number('0x' + code);
            if (x >= 128) text = text.replace(m, code);
        }
    }
    return unescape(text.toString().replace(/%2B/g, '+'));
}

// ─── 安全的 safeStringify（保留 BigInt 精度）──────────────
export function safeStringify(obj, space) {
    const tagged = JSON.stringify(
        obj,
        function (_key, value) {
            if (typeof value === 'bigint') {
                return `__FH_BIGINT__${value.toString()}`;
            }
            if (typeof value === 'number' && value.toString().includes('e')) {
                return `__FH_NUMSTR__${value.toLocaleString('fullwide', { useGrouping: false })}`;
            }
            return value;
        },
        space,
    );
    return tagged
        .replace(/"__FH_BIGINT__(-?\d+)"/g, '$1')
        .replace(/"__FH_NUMSTR__(-?\d+)"/g, '$1');
}

// ─── 日期格式化（替代 Date.prototype.format 的纯函数版本）──
export function formatDate(date, pattern) {
    const pad = (src, len) => {
        const neg = src < 0;
        let s = String(Math.abs(src));
        while (s.length < len) s = '0' + s;
        return (neg ? '-' : '') + s;
    };
    if (typeof pattern !== 'string') return date.toString();

    const y = date.getFullYear();
    const M = date.getMonth() + 1;
    const d = date.getDate();
    const H = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    const S = date.getMilliseconds();

    return pattern
        .replace(/yyyy/g, pad(y, 4))
        .replace(/yy/g, pad(parseInt(y.toString().slice(2), 10), 2))
        .replace(/MM/g, pad(M, 2))
        .replace(/M/g, M)
        .replace(/dd/g, pad(d, 2))
        .replace(/d/g, d)
        .replace(/HH/g, pad(H, 2))
        .replace(/H/g, H)
        .replace(/hh/g, pad(H % 12, 2))
        .replace(/h/g, H % 12)
        .replace(/mm/g, pad(m, 2))
        .replace(/ss/g, pad(s, 2))
        .replace(/SSS/g, pad(S, 3))
        .replace(/S/g, S);
}

// ─── 字符串字节数（替代 String.prototype.getBytes 的纯函数版本）──
export function getStringBytes(str) {
    const stream = str.replace(/\n/g, 'xx').replace(/\t/g, 'x');
    const escaped = encodeURIComponent(stream);
    return escaped.replace(/%[A-Z0-9][A-Z0-9]/g, 'x').length;
}

// ─── toast 安全版（XSS 防护）────────────────────────────────
export function createSafeToastHTML(content) {
    const safe = htmlspecialchars(content);
    return (
        '<div id="fehelper_alertmsg" style="position:fixed;top:5px;right:5px;z-index:1000000">' +
        '<p style="background:#000;display:inline-block;color:#fff;text-align:center;' +
        'padding:10px 10px;margin:0 auto;font-size:14px;border-radius:4px;">' +
        safe +
        '</p></div>'
    );
}
