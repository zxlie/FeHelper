/**
 * Bounded TOON subset, based on https://github.com/toon-format/spec/blob/main/SPEC.md.
 * Two-space indentation; flat tabular columns, nested objects and list arrays.
 * Keyed tables / nested field groups are explicitly unsupported. No key expansion.
 * Numbers use JavaScript doubles; unsafe integers and non-finite values are rejected.
 */
const NUMBER = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;
const MAX_LENGTH = 2 * 1024 * 1024;
const MAX_DEPTH = 100;
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const primitive = value => value === null || typeof value !== 'object';
const trimSpaces = text => text.replace(/^ +| +$/g, '');

function checkDepth(depth) {
    if (depth > MAX_DEPTH) throw new Error('嵌套超过 100 层，暂不支持');
}
function checkText(text) {
    if (typeof text !== 'string' || text.length > MAX_LENGTH) throw new Error('请输入不超过 2 Mi 字符的文本');
}
function number(token) {
    const value = Number(token);
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) {
        throw new Error('数字超出安全精度范围，请将大整数改为字符串');
    }
    return value === 0 ? 0 : value;
}
function validUnicode(text) {
    for (const char of text) {
        const code = char.codePointAt(0);
        if (code >= 0xd800 && code <= 0xdfff) throw new Error('不支持未配对的 Unicode 代理字符');
    }
    return text;
}
function quote(text) {
    validUnicode(text);
    return '"' + Array.from(text, char => {
        if (char === '\\') return '\\\\';
        if (char === '"') return '\\"';
        if (char === '\n') return '\\n';
        if (char === '\r') return '\\r';
        if (char === '\t') return '\\t';
        if (char.charCodeAt(0) < 32) return '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0');
        return char;
    }).join('') + '"';
}
function keyText(key) {
    return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(key) ? key : quote(key);
}
function scalar(value) {
    if (typeof value === 'string') {
        validUnicode(value);
        return !value || /^[ #\-\t\uFEFF]|[ \t]$/.test(value) || /[:,"\\[\]{}]/.test(value) || Array.from(value).some(char => char.charCodeAt(0) < 32)
            || /^(true|false|null)$/.test(value) || /^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)
            ? quote(value) : value;
    }
    if (typeof value === 'number') return String(number(String(value)));
    if (value === null || typeof value === 'boolean') return String(value);
    throw new Error('仅支持 JSON 数据类型');
}

export function encodeToon(value) {
    const lines = [];
    const emit = (depth, text) => lines.push('  '.repeat(depth) + text);
    function object(obj, depth) {
        checkDepth(depth);
        for (const key of Object.keys(obj)) field(obj[key], depth, keyText(key));
    }
    function array(items, depth, prefix, allowTable = true) {
        checkDepth(depth);
        const header = `${prefix}[${items.length}]`;
        if (items.every(primitive)) {
            emit(depth, `${header}:${items.length ? ' ' + items.map(scalar).join(',') : ''}`);
            return;
        }
        const keys = items.length && !primitive(items[0]) && !Array.isArray(items[0]) ? Object.keys(items[0]) : [];
        const tabular = allowTable && keys.length && items.every(item => item && !Array.isArray(item)
            && typeof item === 'object' && Object.keys(item).length === keys.length
            && keys.every(key => own(item, key) && primitive(item[key])));
        if (tabular) {
            emit(depth, `${header}{${keys.map(keyText).join(',')}}:`);
            items.forEach(item => emit(depth + 1, keys.map(key => scalar(item[key])).join(',')));
            return;
        }
        emit(depth, header + ':');
        for (const item of items) {
            if (primitive(item)) emit(depth + 1, '- ' + scalar(item));
            else if (Array.isArray(item)) array(item, depth + 1, '- ', false);
            else if (!Object.keys(item).length) emit(depth + 1, '-');
            else {
                const start = lines.length;
                object(item, depth + 2);
                lines[start] = '  '.repeat(depth + 1) + '- ' + lines[start].slice((depth + 2) * 2);
            }
        }
    }
    function field(item, depth, key) {
        if (Array.isArray(item)) {
            if (!item.length) emit(depth, key + ': []');
            else array(item, depth, key);
        } else if (primitive(item)) emit(depth, `${key}: ${scalar(item)}`);
        else {
            emit(depth, key + ':');
            object(item, depth + 1);
        }
    }
    if (Array.isArray(value)) {
        if (!value.length) emit(0, '[]');
        else array(value, 0, '');
    } else if (primitive(value)) emit(0, scalar(value));
    else object(value, 0);
    const result = lines.join('\n');
    checkText(result);
    return result;
}

// Locate punctuation only outside quoted tokens (also used for splitting table cells).
function positions(text, symbol) {
    const result = [];
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        if (quoted && text[i] === '\\') { i++; continue; }
        if (text[i] === '"') quoted = !quoted;
        else if (!quoted && text[i] === symbol) result.push(i);
    }
    if (quoted) throw new Error('引号未闭合');
    return result;
}
function split(text, delimiter, fields = false) {
    let start = 0;
    const parts = [];
    for (const index of positions(text, delimiter)) {
        parts.push(trimSpaces(text.slice(start, index)));
        start = index + 1;
    }
    parts.push(trimSpaces(text.slice(start)));
    if (fields && parts.some(part => !part)) throw new Error('表格字段不能为空');
    return parts;
}
function unquote(token) {
    let result = '';
    for (let i = 1; i < token.length; i++) {
        const char = token[i];
        if (char === '"') {
            if (i !== token.length - 1) throw new Error('引号后存在多余内容');
            return validUnicode(result);
        }
        if (char !== '\\') { result += char; continue; }
        const escape = token[++i];
        const simple = { '\\': '\\', '"': '"', n: '\n', r: '\r', t: '\t' };
        if (own(simple, escape)) result += simple[escape];
        else if (escape === 'u' && /^[\da-f]{4}$/i.test(token.slice(i + 1, i + 5))) {
            const code = parseInt(token.slice(i + 1, i + 5), 16);
            if (code >= 0xd800 && code <= 0xdfff) throw new Error('TOON 不支持 Unicode 代理转义，请直接输入字符');
            result += String.fromCharCode(code);
            i += 4;
        } else throw new Error('不支持的 TOON 转义');
    }
    throw new Error('引号未闭合');
}
function tokenValue(token, isKey = false) {
    if (token.startsWith('"')) return unquote(token);
    validUnicode(token);
    if (isKey) return token;
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'null') return null;
    return NUMBER.test(token) ? number(token) : token;
}
function put(obj, key, value) {
    if (own(obj, key)) throw new Error(`重复字段：${key}`);
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
}

export function decodeToon(text) {
    checkText(text);
    validUnicode(text);
    const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n').map((raw, index) => {
        if (/^ *#/.test(raw)) return null;
        const indent = raw.match(/^ */)[0];
        if (indent.length % 2) throw new Error(`第 ${index + 1} 行：仅支持每级 2 个空格缩进`);
        const content = raw.slice(indent.length).replace(/ +$/, '');
        if (content.includes('\r')) throw new Error(`第 ${index + 1} 行：不支持单独的回车字符`);
        return { text: content, depth: indent.length / 2, line: index + 1 };
    }).filter(Boolean);
    // Blank lines in array scopes are intentionally rejected rather than silently discarded.
    let cursor = 0;
    function skipBlank() { while (cursor < lines.length && !lines[cursor].text) cursor++; }
    function header(content) {
        const colon = positions(content, ':')[0];
        const bracket = positions(content, '[')[0];
        if (colon === undefined || bracket === undefined || bracket > colon) return null;
        const key = content.slice(0, bracket);
        const rest = content.slice(bracket);
        if (/^\[\d+:/.test(rest)) throw new Error('暂不支持 TOON keyed tabular 对象，请使用普通嵌套对象');
        const match = rest.match(/^\[(0|[1-9]\d*)([|\t]?)\](?:\{(.*)\})?:(.*)$/);
        if (!match || /[ \t]$/.test(key)) throw new Error('不支持或无效的数组声明');
        const delimiter = match[2] || ',';
        let fields = null;
        if (match[3] !== undefined) {
            if (positions(match[3], '{').length || positions(match[3], '}').length) throw new Error('暂不支持嵌套表格字段，请使用列表对象');
            for (const other of [',', '|', '\t'].filter(d => d !== delimiter)) {
                if (positions(match[3], other).length) throw new Error('表格字段分隔符不匹配');
            }
            fields = split(match[3], delimiter, true).map(field => tokenValue(field, true));
            if (new Set(fields).size !== fields.length) throw new Error('表格字段重复');
        }
        return { key: key ? tokenValue(key, true) : null, count: match[1], fields, delimiter, inline: trimSpaces(match[4]) };
    }
    function array(h, depth, nestedItem = false) {
        checkDepth(depth);
        const result = [];
        if (h.fields && (h.inline || nestedItem)) throw new Error('表格数组不能包含行内值，也不能直接作为列表项');
        if (h.inline) {
            for (const part of split(h.inline, h.delimiter)) result.push(tokenValue(part));
        } else {
            while (cursor < lines.length) {
                const row = lines[cursor];
                if (!row.text) {
                    let next = cursor;
                    while (next < lines.length && !lines[next].text) next++;
                    if (next < lines.length && lines[next].depth > depth) throw new Error(`第 ${row.line} 行：数组内部不支持空行`);
                    break;
                }
                if (row.depth <= depth) break;
                if (row.depth !== depth + 1) throw new Error(`第 ${row.line} 行：数组缩进不正确`);
                cursor++;
                if (h.fields) {
                    const colon = positions(row.text, ':')[0];
                    const delimiter = positions(row.text, h.delimiter)[0];
                    if (colon !== undefined && (delimiter === undefined || colon < delimiter)) throw new Error('表格行中存在未引用的键值字段');
                    const cells = split(row.text, h.delimiter).map(part => tokenValue(part));
                    if (cells.length !== h.fields.length) throw new Error('表格列数与声明不一致');
                    const obj = {};
                    h.fields.forEach((key, index) => put(obj, key, cells[index]));
                    result.push(obj);
                } else {
                    if (!/^-( |$)/.test(row.text)) throw new Error('列表项必须以 - 开始');
                    const content = row.text.replace(/^- */, '');
                    const inner = header(content);
                    if (inner && inner.key === null) result.push(array(inner, row.depth, true));
                    else if (positions(content, ':').length) {
                        // First field is carried on the hyphen line at one virtual level deeper.
                        cursor--;
                        lines[cursor] = { ...row, text: content, depth: row.depth + 1 };
                        result.push(object(row.depth + 1));
                    } else result.push(content === '' ? {} : content === '[]' ? [] : tokenValue(content));
                }
            }
        }
        if (String(result.length) !== h.count) throw new Error(`数组长度不匹配：声明 ${h.count}，实际 ${result.length}`);
        return result;
    }
    function object(depth) {
        checkDepth(depth);
        const result = {};
        while (cursor < lines.length) {
            skipBlank();
            if (cursor === lines.length || lines[cursor].depth < depth) break;
            const row = lines[cursor];
            if (row.depth !== depth) throw new Error(`第 ${row.line} 行：缩进层级不正确`);
            cursor++;
            if (row.text.startsWith('\t')) throw new Error('仅支持每级 2 个空格缩进');
            const h = header(row.text);
            if (h) {
                if (h.key === null) throw new Error('对象内数组必须有字段名');
                put(result, h.key, array(h, depth));
                continue;
            }
            const colon = positions(row.text, ':')[0];
            if (colon === undefined) throw new Error(`第 ${row.line} 行：需要 key: value`);
            const key = tokenValue(trimSpaces(row.text.slice(0, colon)), true);
            const rest = trimSpaces(row.text.slice(colon + 1));
            put(result, key, rest === '' ? object(depth + 1) : rest === '[]' ? [] : tokenValue(rest));
        }
        return result;
    }
    skipBlank();
    if (cursor === lines.length) return {};
    const first = lines[cursor];
    if (first.depth !== 0 || first.text.startsWith('\t')) throw new Error('第一行不能缩进');
    const h = header(first.text);
    let result;
    if (h && h.key === null) { cursor++; result = array(h, 0); }
    else if (!positions(first.text, ':').length) {
        cursor++;
        result = first.text === '[]' ? [] : tokenValue(first.text);
    } else result = object(0);
    skipBlank();
    if (cursor !== lines.length) throw new Error('根节点后存在多余内容');
    return result;
}

export function jsonToToon(text) {
    checkText(text);
    // Inspect numeric lexemes before JSON.parse rounds unsafe integers.
    const tokens = text.match(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g) || [];
    for (const token of tokens) if (!token.startsWith('"')) number(token);
    return encodeToon(JSON.parse(text));
}
