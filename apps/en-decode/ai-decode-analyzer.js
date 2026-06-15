import EncodeUtils from './endecode-lib.js';

const MAX_DEPTH = 3;
const MAX_STATES = 28;
const MAX_CANDIDATES = 6;
const CODE_PREVIEW_LIMIT = 4200;

const OPERATION_DEFS = [
    {
        key: 'urlDecode',
        label: 'URL解码',
        selectedType: 'utf8Decode',
        weight: 26,
        match: text => /%[0-9a-fA-F]{2}/.test(text),
        run: text => decodeURIComponent(text.replace(/\+/g, '%20'))
    },
    {
        key: 'unicodeDecode',
        label: 'Unicode解码',
        selectedType: 'uniDecode',
        weight: 24,
        match: text => /\\[uU][0-9a-fA-F]{4}/.test(text),
        run: text => EncodeUtils.uniDecode(text.replace(/\\U/g, '\\u'))
    },
    {
        key: 'utf16Decode',
        label: 'UTF16解码',
        selectedType: 'utf16Decode',
        weight: 22,
        match: text => /\\x[0-9a-fA-F]{2}/.test(text),
        run: text => decodeURIComponent(EncodeUtils.utf16to8(text))
    },
    {
        key: 'htmlEntityDecode',
        label: 'HTML实体解码',
        selectedType: 'htmlEntityDecode',
        weight: 18,
        match: text => /&(?:#[0-9]+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/.test(text),
        run: text => decodeHtmlEntities(text)
    },
    {
        key: 'stringUnescape',
        label: '字符串去转义',
        selectedType: 'stringUnescape',
        weight: 16,
        match: text => /\\(?:n|r|t|f|\\|"|'|u[0-9a-fA-F]{4})/.test(text),
        run: text => EncodeUtils.stringUnescape(text)
    },
    {
        key: 'gzipDecode',
        label: 'Gzip解压',
        selectedType: 'gzipDecode',
        weight: 34,
        match: text => looksLikeGzipBase64(text),
        run: text => EncodeUtils.gzipDecode(normalizeBase64(text))
    },
    {
        key: 'base64Decode',
        label: 'Base64解码',
        selectedType: 'base64Decode',
        weight: 28,
        match: text => looksLikeBase64(text),
        run: text => decodeBase64Text(text)
    },
    {
        key: 'hexDecode',
        label: '十六进制解码',
        selectedType: 'hexDecode',
        weight: 17,
        match: text => looksLikeHex(text),
        run: text => EncodeUtils.hexDecode(text.replace(/\s+/g, ''))
    }
];

function normalizeText(value) {
    return String(value == null ? '' : value).trim();
}

function getStateKey(value) {
    const text = String(value);
    return `${text.length}:${text.slice(0, 320)}:${text.slice(-120)}`;
}

function decodeHtmlEntities(text) {
    if (globalThis.he && typeof globalThis.he.decode === 'function') {
        return globalThis.he.decode(text, {isAttributeValue: false});
    }

    if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    const named = {
        amp: '&',
        apos: "'",
        gt: '>',
        lt: '<',
        nbsp: ' ',
        quot: '"'
    };

    return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]+);/g, (match, entity) => {
        if (entity[0] === '#') {
            const code = entity[1].toLowerCase() === 'x'
                ? parseInt(entity.slice(2), 16)
                : parseInt(entity.slice(1), 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        return Object.prototype.hasOwnProperty.call(named, entity) ? named[entity] : match;
    });
}

function normalizeBase64(text) {
    const data = normalizeText(text).replace(/^data:[^,]+,/, '').replace(/\s+/g, '');
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - normalized.length % 4) % 4;
    return normalized + '='.repeat(padLength);
}

function decodeBase64Bytes(text) {
    const normalized = normalizeBase64(text);
    let binary;
    if (typeof globalThis.atob === 'function') {
        binary = globalThis.atob(normalized);
    } else if (typeof globalThis.Buffer !== 'undefined') {
        binary = globalThis.Buffer.from(normalized, 'base64').toString('binary');
    } else {
        throw new Error('当前环境不支持 Base64 解码');
    }

    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

function decodeBase64Text(text) {
    const bytes = decodeBase64Bytes(text);
    if (typeof globalThis.TextDecoder === 'function') {
        return new globalThis.TextDecoder('utf-8', {fatal: false}).decode(bytes);
    }
    let binary = '';
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return EncodeUtils.utf8Decode(binary);
}

function looksLikeBase64(text) {
    const source = normalizeText(text);
    if (source.length < 8 || source.length > 80000) return false;
    if (source.includes('.')) return false;

    const compact = source.replace(/^data:[^,]+,/, '').replace(/\s+/g, '');
    if (compact.length < 8 || compact.length % 4 === 1) return false;
    if (!/^[A-Za-z0-9+/_=-]+$/.test(compact)) return false;
    if (/^[a-zA-Z]+$/.test(compact) && compact.length < 16) return false;

    return /[A-Z0-9+/=_-]/.test(compact);
}

function looksLikeGzipBase64(text) {
    const compact = normalizeText(text).replace(/\s+/g, '');
    return /^H4sI/i.test(compact);
}

function looksLikeHex(text) {
    const compact = normalizeText(text).replace(/\s+/g, '');
    if (compact.length < 8 || compact.length % 2 !== 0) return false;
    if (!/^[0-9a-fA-F]+$/.test(compact)) return false;
    if (/^\d+$/.test(compact) && compact.length < 16) return false;
    return true;
}

function getPrintableRatio(text) {
    if (!text) return 0;
    let printable = 0;
    for (let index = 0; index < text.length; index++) {
        const code = text.charCodeAt(index);
        if (code === 9 || code === 10 || code === 13 || code >= 32) {
            printable++;
        }
    }
    return printable / text.length;
}

function isUsefulOutput(input, output) {
    const value = normalizeText(output);
    if (!value || value === normalizeText(input)) return false;
    if (value.length > 120000) return false;
    if (value.includes('\uFFFD') && value.length > 12) return false;
    return getPrintableRatio(value) >= 0.78;
}

function tryParseJson(text) {
    const value = normalizeText(text);
    if (!value || !/^[{[]/.test(value)) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function formatJsonValue(value) {
    return JSON.stringify(value, null, 4);
}

function looksLikeJwt(text) {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(normalizeText(text));
}

function parseJwt(text) {
    try {
        const decoded = EncodeUtils.jwtDecode(normalizeText(text));
        return {
            header: tryParseJson(decoded.header) || decoded.header,
            payload: tryParseJson(decoded.payload) || decoded.payload,
            sign: decoded.sign
        };
    } catch {
        return null;
    }
}

function formatJwt(decoded) {
    const header = typeof decoded.header === 'string' ? decoded.header : formatJsonValue(decoded.header);
    const payload = typeof decoded.payload === 'string' ? decoded.payload : formatJsonValue(decoded.payload);
    return `Header:\n${header}\n\nPayload:\n${payload}\n\nSign:\n${decoded.sign}`;
}

function parseUrl(text) {
    const source = normalizeText(text);
    if (!/^https?:\/\//i.test(source)) return null;
    try {
        return new URL(source);
    } catch {
        return null;
    }
}

function buildUrlResult(urlObj) {
    return {
        url: urlObj.href,
        params: Array.from(urlObj.searchParams.entries()),
        protocol: urlObj.protocol,
        pathname: urlObj.pathname,
        hostname: urlObj.hostname
    };
}

function formatUrlResult(urlResult) {
    return formatJsonValue({
        protocol: urlResult.protocol,
        hostname: urlResult.hostname,
        pathname: urlResult.pathname,
        params: urlResult.params
    });
}

function looksLikeCookie(text) {
    const source = normalizeText(text);
    if (!source.includes('=') || !source.includes(';')) return false;
    if (/^https?:\/\//i.test(source)) return false;
    return source.split(';').filter(part => part.includes('=')).length >= 2;
}

function parseCookie(text) {
    return normalizeText(text).split(';').reduce((acc, pair) => {
        const index = pair.indexOf('=');
        if (index <= 0) return acc;
        const rawKey = pair.slice(0, index).trim();
        const rawValue = pair.slice(index + 1).trim();
        let decoded;
        try {
            decoded = {
                key: decodeURIComponent(rawKey),
                value: decodeURIComponent(rawValue)
            };
        } catch {
            decoded = {
                key: rawKey,
                value: rawValue
            };
        }
        acc[decoded.key] = decoded.value;
        return acc;
    }, {});
}

function hasControlChars(text) {
    for (let index = 0; index < text.length; index++) {
        const code = text.charCodeAt(index);
        if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31)) {
            return true;
        }
    }
    return false;
}

function getLastSelectedType(steps) {
    const last = [...steps].reverse().find(step => step.selectedType);
    return last ? last.selectedType : '';
}

function getTextQualityScore(text) {
    const source = normalizeText(text);
    if (!source) return -20;
    let score = Math.round(getPrintableRatio(source) * 20);
    if (/[\u4e00-\u9fa5]/.test(source)) score += 8;
    if (/[A-Za-z]{3,}/.test(source)) score += 4;
    if (/https?:\/\//i.test(source)) score += 4;
    if (source.length > 20) score += 4;
    if (hasControlChars(source)) score -= 24;
    return score;
}

function getWarnings(output, outputType) {
    const warnings = [];
    const text = normalizeText(output);
    if (/(^|["'\s_,-])(access[_-]?token|refresh[_-]?token|token|authorization|password|passwd|secret|api[_-]?key|session)(["'\s_,-]|$)/i.test(text)) {
        warnings.push('包含疑似 token、密钥或会话字段，复制分享前先脱敏。');
    }
    if (outputType === 'jwt') {
        const expMatch = text.match(/"exp"\s*:\s*(\d{10})/);
        if (expMatch) {
            const exp = Number(expMatch[1]) * 1000;
            const status = exp < Date.now() ? '已过期' : '未过期';
            warnings.push(`JWT exp 时间戳检测：${new Date(exp).toLocaleString()}，当前看起来${status}。`);
        }
    }
    return warnings;
}

function buildCandidate(path, finalStep) {
    const steps = finalStep ? [...path.steps, finalStep] : [...path.steps];
    const output = finalStep && finalStep.output != null ? finalStep.output : path.value;
    const outputType = finalStep && finalStep.outputType ? finalStep.outputType : 'text';
    const selectedType = finalStep && finalStep.selectedType ? finalStep.selectedType : getLastSelectedType(steps);
    const urlResult = finalStep && finalStep.urlResult ? finalStep.urlResult : null;

    let score = path.score + getTextQualityScore(output) - Math.max(0, steps.length - 1) * 4;
    if (outputType === 'json') score += 34;
    if (outputType === 'jwt') score += 38;
    if (outputType === 'url') score += 28;
    if (outputType === 'cookie') score += 24;
    if (steps.length > 1) score += 6;

    const stepLabels = steps.map(step => step.label);
    return {
        id: `${stepLabels.join('>')}|${getStateKey(output)}`,
        title: getCandidateTitle(outputType, stepLabels),
        steps,
        stepLabels,
        output,
        outputType,
        selectedType,
        urlResult,
        score,
        confidence: getConfidence(score),
        warnings: getWarnings(output, outputType)
    };
}

function getCandidateTitle(outputType, stepLabels) {
    if (outputType === 'json') return '解码为 JSON';
    if (outputType === 'jwt') return '解码为 JWT';
    if (outputType === 'url') return '解析为 URL 参数';
    if (outputType === 'cookie') return '格式化 Cookie';
    if (stepLabels.length) return '解码为可读文本';
    return '原文可读';
}

function getConfidence(score) {
    if (score >= 92) return '高';
    if (score >= 66) return '中';
    return '低';
}

function collectCandidates(path) {
    const candidates = [];
    const json = tryParseJson(path.value);
    if (json) {
        candidates.push(buildCandidate(path, {
            key: 'jsonPretty',
            label: 'JSON格式化预览',
            output: formatJsonValue(json),
            outputType: 'json'
        }));
    }

    const jwt = looksLikeJwt(path.value) ? parseJwt(path.value) : null;
    if (jwt) {
        candidates.push(buildCandidate(path, {
            key: 'jwtDecode',
            label: 'JWT解码',
            selectedType: 'jwtDecode',
            output: formatJwt(jwt),
            outputType: 'jwt'
        }));
    }

    const url = parseUrl(path.value);
    if (url) {
        const urlResult = buildUrlResult(url);
        candidates.push(buildCandidate(path, {
            key: 'urlParamsDecode',
            label: 'URL参数解析',
            selectedType: 'urlParamsDecode',
            output: formatUrlResult(urlResult),
            outputType: 'url',
            urlResult
        }));
    }

    if (looksLikeCookie(path.value)) {
        const cookie = parseCookie(path.value);
        candidates.push(buildCandidate(path, {
            key: 'cookieDecode',
            label: 'Cookie格式化',
            selectedType: 'cookieDecode',
            output: formatJsonValue(cookie),
            outputType: 'cookie'
        }));
    }

    if (path.steps.length) {
        candidates.push(buildCandidate(path));
    }

    return candidates;
}

async function runOperation(operation, value) {
    const output = await operation.run(value);
    return normalizeText(output);
}

function dedupeAndRankCandidates(candidates) {
    const byId = new Map();
    candidates.forEach(candidate => {
        const current = byId.get(candidate.id);
        if (!current || candidate.score > current.score) {
            byId.set(candidate.id, candidate);
        }
    });
    return Array.from(byId.values())
        .sort((left, right) => right.score - left.score)
        .slice(0, MAX_CANDIDATES);
}

async function analyzeDecodeInput(input) {
    const source = normalizeText(input);
    if (!source) {
        return {
            candidates: [],
            bestCandidate: null,
            markdown: '请先粘贴需要解码的内容。'
        };
    }

    const seen = new Set([getStateKey(source)]);
    let frontier = [{
        value: source,
        steps: [],
        score: getTextQualityScore(source)
    }];
    let exploredCount = 1;
    const candidates = [];

    candidates.push(...collectCandidates(frontier[0]));

    for (let depth = 0; depth < MAX_DEPTH && frontier.length; depth++) {
        const next = [];
        for (const path of frontier) {
            for (const operation of OPERATION_DEFS) {
                if (exploredCount >= MAX_STATES) break;
                if (!operation.match(path.value)) continue;

                try {
                    const output = await runOperation(operation, path.value);
                    if (!isUsefulOutput(path.value, output)) continue;

                    const stateKey = getStateKey(output);
                    if (seen.has(stateKey)) continue;
                    seen.add(stateKey);
                    exploredCount++;

                    const nextPath = {
                        value: output,
                        steps: [...path.steps, {
                            key: operation.key,
                            label: operation.label,
                            selectedType: operation.selectedType
                        }],
                        score: path.score + operation.weight
                    };
                    candidates.push(...collectCandidates(nextPath));
                    next.push(nextPath);
                } catch {
                    // Failed probes are expected when testing possible chains.
                }
            }
        }
        frontier = next;
    }

    const rankedCandidates = dedupeAndRankCandidates(candidates);
    return {
        candidates: rankedCandidates,
        bestCandidate: rankedCandidates[0] || null,
        markdown: buildDecodeMarkdown(source, rankedCandidates)
    };
}

function getCodeFenceType(outputType) {
    return ['json', 'jwt', 'url', 'cookie'].includes(outputType) ? 'json' : 'text';
}

function clipCode(text) {
    const source = String(text || '');
    if (source.length <= CODE_PREVIEW_LIMIT) return source;
    return `${source.slice(0, CODE_PREVIEW_LIMIT)}\n\n[FeHelper 已截断，完整结果可点击“应用最佳结果”查看]`;
}

function sanitizeFence(text) {
    return clipCode(text).replace(/```/g, '` ` `');
}

function buildDecodeMarkdown(source, candidates) {
    if (!candidates.length) {
        return [
            '## AI 解码建议',
            '',
            '没有找到高可信的自动解码链路。',
            '',
            '可以尝试手动选择 URL解码、Base64解码、Unicode解码、Gzip解压，或补充更完整的上下文。'
        ].join('\n');
    }

    const best = candidates[0];
    const lines = [
        '## AI 解码建议',
        '',
        `**结论**：${best.title}`,
        `**推荐链路**：${best.stepLabels.join(' -> ')}`,
        `**置信度**：${best.confidence}`,
        '点击“应用最佳结果”可写入结果区。',
        '',
        '**最终明文**',
        '',
        `\`\`\`${getCodeFenceType(best.outputType)}`,
        sanitizeFence(best.output),
        '```'
    ];

    if (best.warnings.length) {
        lines.push('', '**风险提示**');
        best.warnings.forEach(warning => {
            lines.push(`- ${warning}`);
        });
    }

    const alternatives = candidates.slice(1, 4);
    if (alternatives.length) {
        lines.push('', '**其他候选**');
        alternatives.forEach((candidate, index) => {
            lines.push(`${index + 1}. ${candidate.title}：${candidate.stepLabels.join(' -> ')}，置信度 ${candidate.confidence}`);
        });
    }

    if (source.length > CODE_PREVIEW_LIMIT) {
        lines.push('', '输入较长，AI 只展示结果预览。应用后会写入完整结果。');
    }

    return lines.join('\n');
}

export {
    analyzeDecodeInput,
    buildDecodeMarkdown,
    decodeBase64Text,
    looksLikeBase64,
    looksLikeHex
};
