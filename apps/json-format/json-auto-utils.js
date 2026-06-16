/**
 * Shared JSON helpers for the auto-format content script.
 * This file is intentionally a classic script so chrome.scripting can inject it
 * before content-script.js without requiring module support.
 */
(function (root, factory) {
    const utils = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = utils;
    }
    root.FHJsonAutoUtils = utils;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    function isBigNumberLike(value) {
        return (
            value !== null &&
            value !== undefined &&
            typeof value === 'object' &&
            typeof value.s === 'number' &&
            typeof value.e === 'number' &&
            Array.isArray(value.c)
        );
    }

    function rebuildBigNumberFromParts(value) {
        const sign = value.s < 0 ? '-' : '';
        const chunkSize = 14;
        let digits = '';

        for (let i = 0; i < value.c.length; i++) {
            let chunkStr = Math.abs(value.c[i]).toString();
            if (i > 0) {
                chunkStr = chunkStr.padStart(chunkSize, '0');
            }
            digits += chunkStr;
        }

        digits = digits.replace(/^0+/, '') || '0';
        const decimalIndex = value.e + 1;

        if (decimalIndex <= 0) {
            const zeros = '0'.repeat(Math.abs(decimalIndex));
            let fraction = zeros + digits;
            fraction = fraction.replace(/0+$/, '');
            return fraction ? sign + '0.' + fraction : sign + '0';
        }
        if (decimalIndex >= digits.length) {
            return sign + digits + '0'.repeat(decimalIndex - digits.length);
        }

        const intPart = digits.slice(0, decimalIndex);
        const fracPart = digits.slice(decimalIndex).replace(/0+$/, '');
        return fracPart ? sign + intPart + '.' + fracPart : sign + intPart;
    }

    function getBigNumberDisplayString(value) {
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

    function parseWithBigInt(text) {
        text = String(text).trim();

        let fixed = text.replace(/([\{,]\s*)'([^'\\]*?)'(\s*:)/g, '$1"$2"$3');
        fixed = fixed.replace(/([\{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
        fixed = fixed.replace(/(:\s*)'([^'\\]*?)'/g, '$1"$2"');

        const marked = fixed.replace(
            /([:,\[]\s*)(-?\d{16,})(\s*)(?=(?:,|\]|\}|$))/g,
            function (match, prefix, number, spaces, offset) {
                let inStr = false;
                let esc = false;
                for (let i = 0; i < offset; i++) {
                    if (esc) {
                        esc = false;
                        continue;
                    }
                    if (fixed[i] === '\\') {
                        esc = true;
                        continue;
                    }
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

    function isJSONContainer(value) {
        if (typeof value !== 'object' || value === null) return false;
        if (!Array.isArray(value) && Object.prototype.toString.call(value) !== '[object Object]') return false;
        if (isBigNumberLike(value) && Object.keys(value).length === 3) return false;
        return true;
    }

    function deepParseJSONStrings(obj) {
        if (Array.isArray(obj)) {
            return obj.map((item) => {
                if (typeof item === 'string' && item.trim()) {
                    try {
                        const parsed = parseWithBigInt(item);
                        if (isJSONContainer(parsed)) {
                            return deepParseJSONStrings(parsed);
                        }
                    } catch (_) {}
                }
                return deepParseJSONStrings(item);
            });
        }
        if (typeof obj === 'object' && obj !== null) {
            const newObj = {};
            Object.keys(obj).forEach((key) => {
                const value = obj[key];
                if (typeof value === 'string' && value.trim()) {
                    try {
                        const parsed = parseWithBigInt(value);
                        if (isJSONContainer(parsed)) {
                            newObj[key] = deepParseJSONStrings(parsed);
                            return;
                        }
                    } catch (_) {}
                }
                newObj[key] = deepParseJSONStrings(value);
            });
            return newObj;
        }
        return obj;
    }

    function unpackTopLevelEscapedJSON(value) {
        if (typeof value !== 'string' || !value.trim()) return value;

        try {
            const parsed = parseWithBigInt(value);
            if (isJSONContainer(parsed)) {
                return deepParseJSONStrings(parsed);
            }
        } catch (_) {}

        return value;
    }

    function safeStringify(obj, space) {
        const tagged = JSON.stringify(
            obj,
            function (_key, value) {
                if (typeof value === 'bigint') {
                    return `__FH_BIGINT__${value.toString()}`;
                }
                if (typeof value === 'number' && value.toString().includes('e')) {
                    return `__FH_NUMSTR__${value.toLocaleString('fullwide', { useGrouping: false })}`;
                }
                if (isBigNumberLike(value)) {
                    return `__FH_BIGNUM__${getBigNumberDisplayString(value)}`;
                }
                return value;
            },
            space,
        );

        return tagged
            .replace(/"__FH_BIGINT__(-?\d+)"/g, '$1')
            .replace(/"__FH_NUMSTR__(-?\d+)"/g, '$1')
            .replace(/"__FH_BIGNUM__(-?\d+(?:\.\d+)?)"/g, '$1');
    }

    function unwrapJSONLikeSource(source) {
        source = String(source || '').trim();
        let fnTry = null;
        let fnCatch = null;
        let funcName = null;

        if (source.startsWith('try {')) {
            fnTry = 'try {';
            source = source.slice(5).trimStart();
        }

        const catchIdx = source.lastIndexOf('} catch');
        if (catchIdx !== -1) {
            fnCatch = source.slice(catchIdx);
            source = source.slice(0, catchIdx).trimEnd();
        }

        const matches = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/m.exec(source);
        if (matches != null && ((fnTry && fnCatch) || (!fnTry && !fnCatch))) {
            funcName = matches[1];
            source = matches[2];
        }

        return { source, funcName, fnTry, fnCatch };
    }

    function parseJSONLike(source, options) {
        options = options || {};
        const meta = unwrapJSONLikeSource(source);
        let jsonObj = null;
        const startsAsContainer = /^[\{\[]/.test(meta.source);
        const startsAsEscapedContainer = options.nestedEscapeParse && /^["']/.test(meta.source);

        if (!startsAsContainer && !startsAsEscapedContainer) {
            return null;
        }

        try {
            jsonObj = parseWithBigInt(meta.source);
        } catch (_) {
            try {
                jsonObj = new Function('return ' + meta.source)();
            } catch (exx) {
                try {
                    jsonObj = new Function("return '" + meta.source + "'")();
                    if (typeof jsonObj === 'string') {
                        try {
                            jsonObj = parseWithBigInt(jsonObj);
                        } catch (_) {
                            jsonObj = new Function('return ' + jsonObj)();
                        }
                    }
                } catch (_) {
                    return null;
                }
            }
        }

        if (options.nestedEscapeParse && typeof jsonObj === 'string') {
            jsonObj = unpackTopLevelEscapedJSON(jsonObj);
        }
        if (options.nestedEscapeParse && isJSONContainer(jsonObj)) {
            jsonObj = deepParseJSONStrings(jsonObj);
        }
        if (!isJSONContainer(jsonObj)) {
            return null;
        }

        try {
            meta.normalizedSource = safeStringify(jsonObj);
        } catch (_) {
            return null;
        }
        meta.value = jsonObj;
        return meta;
    }

    function coerceDecodedJSONSource(source, decodedSource, options) {
        const parsed = parseJSONLike(decodedSource, options);
        if (!parsed) {
            return source;
        }
        return parsed.normalizedSource;
    }

    return {
        isBigNumberLike,
        parseWithBigInt,
        deepParseJSONStrings,
        unpackTopLevelEscapedJSON,
        safeStringify,
        parseJSONLike,
        coerceDecodedJSONSource,
    };
});
