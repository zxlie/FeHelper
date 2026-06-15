import toolMap from '../background/tools.js';

const MAX_ROUTER_INPUT = 16000;
const PROMPT_INPUT_LIMIT = 7000;

const TOOL_ROUTER_HINTS = {
    'json-format': ['json', 'jsonp', 'jsonpath', '格式化', '解析', 'bigint'],
    'json-diff': ['diff', 'compare', '对比', '差异', 'patch', '变更'],
    'qr-code': ['qr', 'qrcode', '二维码', 'wifi', 'vcard', 'vevent'],
    'image-base64': ['image base64', 'data:image', '图片base64', '图片转base64'],
    'en-decode': ['decode', 'encode', 'base64', 'url encode', 'unicode', 'gzip', 'jwt', 'cookie', 'hex', '编解码'],
    'code-beautify': ['beautify', 'format code', 'js', 'css', 'html', 'sql', 'xml', '代码美化'],
    'code-compress': ['minify', 'compress code', 'uglify', '代码压缩'],
    'aiagent': ['ai', 'gemini', 'assistant', '智能助手'],
    'timestamp': ['timestamp', 'unix', '时间戳', 'filetime'],
    'byte-unit': ['byte', 'kb', 'mb', 'gb', 'tb', '字节', '存储单位'],
    'password': ['password', '密码', '随机密码'],
    'uuid-gen': ['uuid', 'nanoid', 'snowflake', '雪花id'],
    'sticky-notes': ['note', 'memo', '便签', '笔记'],
    'html2markdown': ['markdown', 'html to markdown', 'html2markdown'],
    'postman': ['api', 'http', 'curl', 'postman', 'request', 'response', '接口'],
    'websocket': ['websocket', 'ws://', 'wss://', 'socket'],
    'regexp': ['regex', 'regexp', '正则', 'regular expression'],
    'trans-radix': ['binary', 'octal', 'radix', '进制', '二进制', '十六进制'],
    'trans-color': ['color', 'hex color', 'rgb', 'hsl', '颜色'],
    'crontab': ['cron', 'crontab', 'schedule', '调度'],
    'loan-rate': ['loan', 'rate', 'interest', '贷款', '利率', '月供'],
    'devtools': ['devtools', '开发者工具', '插件开发'],
    'page-monkey': ['userscript', 'tampermonkey', '油猴', '脚本'],
    'screenshot': ['screenshot', 'capture', '截图'],
    'mock-data': ['mock', 'fake data', '测试数据', '造数据'],
    'color-picker': ['eyedropper', 'picker', '取色'],
    'naotu': ['mindmap', '脑图', '思维导图'],
    'grid-ruler': ['grid', 'ruler', '栅格', '标尺'],
    'page-timing': ['performance', 'web vitals', 'lcp', 'cls', 'fcp', '性能'],
    'excel2json': ['excel', 'csv', 'tsv', 'xls', '表格转json'],
    'chart-maker': ['chart', 'visualization', '图表', '可视化'],
    'svg-converter': ['svg', 'svg to png', 'svg转图片'],
    'poster-maker': ['poster', '海报', '营销图'],
    'datetime-calc': ['datetime', 'timezone', '日期计算', '时间计算', '时区']
};

function getMenuText(tool = {}) {
    return Array.isArray(tool.menuConfig)
        ? tool.menuConfig.map(item => item && item.text ? item.text : '').filter(Boolean).join('；')
        : '';
}

function normalizeCatalogText(value) {
    return normalizeInput(value).toLowerCase();
}

const CATALOG_KEYWORD_STOP_WORDS = new Set([
    'fehelper',
    '工具',
    '支持',
    '可以',
    '进行',
    '快速',
    '包括',
    '格式',
    '内容',
    '页面'
]);

function getCatalogKeywordParts(value) {
    const fullText = normalizeCatalogText(value);
    if (!fullText) return [];
    const parts = fullText
        .split(/[\s,，、。；;：:()（）/|]+/)
        .map(part => part.trim())
        .filter(part => part.length >= 2 && !CATALOG_KEYWORD_STOP_WORDS.has(part));
    return [fullText].concat(parts);
}

function buildToolCatalog() {
    return Object.keys(toolMap).map(key => {
        const tool = toolMap[key] || {};
        const hints = TOOL_ROUTER_HINTS[key] || [];
        const menuText = getMenuText(tool);
        return {
            key,
            name: tool.name || key,
            tips: tool.tips || '',
            menuText,
            noPage: !!tool.noPage,
            contexts: Array.isArray(tool.menuConfig)
                ? Array.from(new Set(tool.menuConfig.reduce((acc, item) => acc.concat(item.contexts || []), [])))
                : [],
            keywords: Array.from(new Set([
                key,
                tool.name || '',
                menuText,
                tool.tips || '',
                ...hints
            ].reduce((acc, item) => acc.concat(getCatalogKeywordParts(item)), []).filter(Boolean)))
        };
    });
}

const TOOL_CATALOG = buildToolCatalog();

const DEFAULT_ACTION_ID_BY_TOOL = {
    'json-format': 'json-format',
    'en-decode': 'decode-smart',
    'postman': 'api-debug',
    'regexp': 'regex-assist',
    'crontab': 'cron-assist',
    'timestamp': 'time-assist',
    'qr-code': 'qr-inspect',
    'code-beautify': 'code-explain',
    'trans-color': 'color-convert',
    'aiagent': 'ai-chat'
};

const SPECIAL_ACTION_TEMPLATES = [
    {
        id: 'json-format',
        toolKey: 'json-format',
        taskKey: '',
        title: 'JSON 格式化与结构分析',
        commandLabel: '用 JSON 工具处理',
        desc: '格式化、提取字段、表格化查看和生成 JSONPath。'
    },
    {
        id: 'json-repair',
        toolKey: 'json-format',
        taskKey: 'repair-json',
        title: 'JSON AI 修复',
        commandLabel: 'AI 修复 JSON',
        desc: '解析失败时解释错误，并生成可应用的合法 JSON。'
    },
    {
        id: 'decode-smart',
        toolKey: 'en-decode',
        taskKey: 'smart-decode',
        title: '智能解码链路',
        commandLabel: 'AI 解码',
        desc: '尝试 URL、Base64、Unicode、JWT、Cookie、Gzip 等链路。'
    },
    {
        id: 'api-debug',
        toolKey: 'postman',
        taskKey: 'assist-debug',
        title: '接口调试诊断',
        commandLabel: '打开 Postman',
        desc: '检查 URL、Headers、Body、Content-Type、鉴权和响应问题。'
    },
    {
        id: 'regex-assist',
        toolKey: 'regexp',
        taskKey: 'explain-regex',
        title: '正则解释与测试',
        commandLabel: '分析正则',
        desc: '解释表达式、生成测试样例，并提示潜在回溯风险。'
    },
    {
        id: 'cron-assist',
        toolKey: 'crontab',
        taskKey: 'explain-cron',
        title: 'Cron 调度解释',
        commandLabel: '解析 Cron',
        desc: '解释执行频率、下一次时间和常见时区误区。'
    },
    {
        id: 'time-assist',
        toolKey: 'timestamp',
        taskKey: 'parse-time',
        title: '时间戳与时区转换',
        commandLabel: '转换时间',
        desc: '识别秒/毫秒时间戳、日期字符串和时区语义。'
    },
    {
        id: 'qr-inspect',
        toolKey: 'qr-code',
        taskKey: 'inspect-payload',
        title: '二维码载荷检查',
        commandLabel: '检查 QR 载荷',
        desc: '识别 URL、Wi-Fi、vCard、日程、短信、邮件等载荷。'
    },
    {
        id: 'code-explain',
        toolKey: 'code-beautify',
        taskKey: 'explain-code',
        title: '代码格式化与风险解读',
        commandLabel: '读代码',
        desc: '格式化代码，解释意图、依赖和可疑点。'
    },
    {
        id: 'color-convert',
        toolKey: 'trans-color',
        taskKey: 'convert-color',
        title: '颜色值转换',
        commandLabel: '转换颜色',
        desc: '在 HEX、RGB、HSL 等颜色表示之间转换。'
    },
    {
        id: 'ai-chat',
        toolKey: 'aiagent',
        taskKey: 'router-chat',
        title: 'FeHelper AI 助手',
        commandLabel: '问 AI',
        desc: '把当前内容交给 AI 助手继续分析。'
    }
];

function shortenToolName(name) {
    return String(name || '')
        .replace(/^FeHelper\s*/i, '')
        .replace(/工具$/, '')
        .replace(/生成器$/, '')
        .slice(0, 10) || '工具';
}

const SPECIAL_DEFAULT_TOOL_KEYS = new Set(SPECIAL_ACTION_TEMPLATES.map(action => action.toolKey));
const TOOL_ACTION_TEMPLATES = TOOL_CATALOG
    .filter(tool => !SPECIAL_DEFAULT_TOOL_KEYS.has(tool.key))
    .map(tool => ({
        id: `tool:${tool.key}`,
        toolKey: tool.key,
        taskKey: '',
        title: tool.name,
        commandLabel: `打开${shortenToolName(tool.name)}`,
        desc: tool.tips || `${tool.name} 相关能力。`
    }));

const ACTION_TEMPLATES = SPECIAL_ACTION_TEMPLATES.concat(TOOL_ACTION_TEMPLATES);

const ACTION_TEMPLATE_BY_KEY = ACTION_TEMPLATES.reduce((map, action) => {
    map[action.id] = action;
    return map;
}, {});

function normalizeInput(value) {
    return String(value == null ? '' : value).trim();
}

function clipText(text, limit = MAX_ROUTER_INPUT) {
    const source = String(text == null ? '' : text);
    if (source.length <= limit) return source;
    const headLength = Math.floor(limit * 0.68);
    const tailLength = Math.floor(limit * 0.22);
    return `${source.slice(0, headLength)}\n\n[FeHelper Router 已截断中间 ${source.length - headLength - tailLength} 个字符]\n\n${source.slice(source.length - tailLength)}`;
}

function getConfidence(score) {
    if (score >= 82) return '高';
    if (score >= 58) return '中';
    return '低';
}

function tryParseJson(text) {
    const value = normalizeInput(text);
    if (!/^(?:\{|\[)/.test(value)) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function looksLikeJson(text) {
    const value = normalizeInput(text);
    return /^(?:\{|\[)/.test(value) && /(?:\}|\])$/.test(value);
}

function looksLikeEscapedJson(text) {
    const value = normalizeInput(text);
    return /\\(?:["/nrt]|u[0-9a-fA-F]{4})/.test(value) && /\\?"[A-Za-z0-9_$-]+\\?"\s*:/.test(value);
}

function looksLikeJwt(text) {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(normalizeInput(text));
}

function looksLikeUrlEncoded(text) {
    return /%[0-9a-fA-F]{2}/.test(text) || /\\u[0-9a-fA-F]{4}/.test(text) || /\\x[0-9a-fA-F]{2}/.test(text);
}

function looksLikeBase64(text) {
    const source = normalizeInput(text);
    if (source.length < 12 || source.length > 100000 || source.includes('.')) return false;
    const compact = source.replace(/^data:[^,]+,/, '').replace(/\s+/g, '');
    if (compact.length < 12 || compact.length % 4 === 1) return false;
    return /^[A-Za-z0-9+/_=-]+$/.test(compact) && /[A-Z0-9+/=_-]/.test(compact);
}

function looksLikeHex(text) {
    const compact = normalizeInput(text).replace(/\s+/g, '');
    if (compact.length < 10 || compact.length % 2 !== 0) return false;
    if (!/^[0-9a-fA-F]+$/.test(compact)) return false;
    return !/^\d+$/.test(compact) || compact.length >= 16;
}

function looksLikeUrl(text) {
    const value = normalizeInput(text);
    if (!/^(https?:\/\/|mailto:|tel:|geo:|WIFI:|BEGIN:VCARD|BEGIN:VEVENT)/i.test(value)) return false;
    if (/^https?:\/\//i.test(value)) {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }
    return true;
}

function looksLikeCookie(text) {
    const value = normalizeInput(text);
    if (/^https?:\/\//i.test(value)) return false;
    if (!value.includes('=') || !value.includes(';')) return false;
    return value.split(';').filter(part => /^[^=;\s]+=.*/.test(part.trim())).length >= 2;
}

function looksLikeCurlOrHttp(text) {
    const value = normalizeInput(text);
    return /^curl\s+/i.test(value)
        || /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+https?:\/\//i.test(value)
        || /^HTTP\/\d(?:\.\d)?\s+\d{3}/i.test(value)
        || /\b(status|statusCode|headers|content-type|authorization|cors)\b/i.test(value) && /https?:\/\/|\/api\/|Bearer\s+/i.test(value);
}

function looksLikeCron(text) {
    const value = normalizeInput(text);
    const parts = value.split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) return false;
    return parts.every(part => /^(\*|\?|\d+|\d+-\d+|\d+\/\d+|\*\/\d+|\d+(,\d+)+|[A-Z]{3}|\d+L|L|LW|W|\d+#\d+)$/i.test(part));
}

function looksLikeTimestamp(text) {
    const value = normalizeInput(text);
    if (/^\d{10}$/.test(value)) return true;
    if (/^\d{13}$/.test(value)) return true;
    if (/^\d{17,19}$/.test(value)) return true;
    return /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value) && /\d{1,2}:\d{2}/.test(value);
}

function looksLikeRegex(text) {
    const value = normalizeInput(text);
    if (/^\/.+\/[dgimsuvy]*$/.test(value)) return true;
    return /(\(\?<|\(\?:|\[[^\]]+\]|\.\*|\.\+|\\d|\\w|\\s|\{\d+(,\d*)?\})/.test(value) && value.length < 3000;
}

function looksLikeCode(text) {
    const value = normalizeInput(text);
    if (value.length < 8) return false;
    return /\b(function|const|let|var|class|import|export|SELECT|INSERT|UPDATE|DELETE|CREATE|<\w+|<\/\w+>|=>|console\.|return)\b/i.test(value);
}

function looksLikeColor(text) {
    const value = normalizeInput(text);
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)
        || /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0?\.\d+|1|0))?\s*\)$/i.test(value)
        || /^hsla?\(/i.test(value);
}

function looksLikeQrPayload(text) {
    const value = normalizeInput(text);
    return /^(WIFI:|BEGIN:VCARD|BEGIN:VEVENT|SMSTO:|MATMSG:|mailto:|tel:|geo:)/i.test(value);
}

function makeAction(templateId, reason, priority, overrides = {}) {
    const template = ACTION_TEMPLATE_BY_KEY[templateId] || ACTION_TEMPLATE_BY_KEY['ai-chat'];
    return Object.assign({}, template, {
        reason: reason || template.desc,
        priority: priority || 0
    }, overrides);
}

function makeCatalogAction(toolKey, reason, priority, overrides = {}) {
    return makeAction(DEFAULT_ACTION_ID_BY_TOOL[toolKey] || `tool:${toolKey}`, reason, priority, overrides);
}

function getActionKey(action) {
    return `${action && action.toolKey || ''}:${action && action.taskKey || ''}`;
}

function dedupeActions(actions) {
    const byId = new Map();
    actions.forEach(action => {
        if (!action || !action.toolKey) return;
        const key = getActionKey(action);
        const current = byId.get(key);
        if (!current || (action.priority || 0) > (current.priority || 0)) {
            byId.set(key, action);
        }
    });
    return Array.from(byId.values()).sort((left, right) => (right.priority || 0) - (left.priority || 0));
}

function putPrimaryActionFirst(actions, primaryAction) {
    if (!primaryAction) return actions;
    const primaryKey = getActionKey(primaryAction);
    return [primaryAction].concat(actions.filter(action => getActionKey(action) !== primaryKey));
}

function pushFinding(findings, inputType, score, summary, signals, actions) {
    findings.push({
        inputType,
        score,
        confidence: getConfidence(score),
        summary,
        signals: signals.filter(Boolean),
        actions: dedupeActions(actions)
    });
}

function looksLikeDataImage(text) {
    return /^data:image\/[a-z0-9.+-]+;base64,/i.test(normalizeInput(text));
}

function looksLikeImageBase64(text) {
    const compact = normalizeInput(text).replace(/^data:[^,]+,/i, '').replace(/\s+/g, '');
    if (compact.length < 16 || compact.length % 4 === 1) return false;
    return /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(compact);
}

function looksLikeSvg(text) {
    const value = normalizeInput(text);
    return /<svg[\s>]/i.test(value) || /^https?:\/\/.+\.svg(?:[?#].*)?$/i.test(value);
}

function looksLikeWebSocketUrl(text) {
    return /^wss?:\/\//i.test(normalizeInput(text));
}

function looksLikeUuid(text) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizeInput(text));
}

function looksLikeByteUnit(text) {
    return /\b\d+(?:\.\d+)?\s*(?:b|bytes?|kb|mb|gb|tb|kib|mib|gib|tib)\b/i.test(normalizeInput(text));
}

function looksLikeRadixNumber(text) {
    const value = normalizeInput(text);
    return /^0x[0-9a-f]+$/i.test(value)
        || /^0b[01]+$/i.test(value)
        || (/^[01]{8,}$/.test(value) && /0/.test(value) && /1/.test(value));
}

function looksLikeHtmlFragment(text) {
    const value = normalizeInput(text);
    return !looksLikeSvg(value) && /<\/?[a-z][\s\S]*>/i.test(value);
}

function looksLikeDelimitedTable(text) {
    const lines = normalizeInput(text).split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 12);
    if (lines.length < 2) return false;

    const separators = ['\t', ',', '|'];
    return separators.some(separator => {
        if (!lines.some(line => line.includes(separator))) return false;
        const counts = lines.map(line => {
            const normalized = separator === '|'
                ? line.replace(/^\|/, '').replace(/\|$/, '')
                : line;
            return normalized.split(separator).map(cell => cell.trim()).filter(Boolean).length;
        });
        return counts[0] >= 2 && counts.every(count => count === counts[0]);
    });
}

function looksLikePerformanceTrace(text) {
    return /\b(LCP|CLS|FID|FCP|INP|TTFB|DOMContentLoaded|loadEventEnd|PerformanceNavigationTiming|first-contentful-paint)\b/i.test(text);
}

function looksLikeUserscript(text) {
    return /==UserScript==|@match|@grant|GM_setValue|GM_xmlhttpRequest|Tampermonkey/i.test(text);
}

function looksLikeMarkdown(text) {
    return /^(#{1,6}\s|[-*]\s|\d+\.\s|```|\|.+\|)$/m.test(text);
}

function looksLikeOutline(text) {
    const lines = normalizeInput(text).split(/\r?\n/).filter(Boolean);
    if (lines.length < 3 || lines.length > 80) return false;
    return lines.filter(line => /^\s*(?:[-*+]|\d+\.|[一二三四五六七八九十]+[、.])\s+/.test(line)).length >= Math.ceil(lines.length * 0.6);
}

function looksLikeLoanText(text) {
    return /(贷款|房贷|车贷|利率|月供|等额本息|等额本金|提前还款|loan|interest|mortgage)/i.test(text);
}

function looksLikeMockDataRequest(text) {
    return /(mock|fake data|测试数据|造数据|随机生成|姓名|手机号|身份证|地址|email|邮箱)/i.test(text);
}

function looksLikePosterRequest(text) {
    return /(海报|小红书|朋友圈|营销图|宣传图|poster|banner|封面图)/i.test(text);
}

function looksLikePasswordRequest(text) {
    return /(密码|口令|password|passphrase|随机.*(?:字符|字符串)|生成.*(?:密码|口令))/i.test(text);
}

function looksLikeDateTimeRequest(text) {
    return /(时区|timezone|日期计算|工作日|倒计时|相差.*天|datetime|date diff|UTC|GMT)/i.test(text);
}

function collectContentToolFindings(source, findings) {
    if (looksLikeDataImage(source) || looksLikeImageBase64(source)) {
        pushFinding(findings, 'image-base64', 93, '识别为图片 Base64 或 Data URL，适合在图片与 Base64 工具中预览、反解或转换。', [
            looksLikeDataImage(source) ? 'data:image Base64 头' : '图片文件 Base64 魔数'
        ], [
            makeCatalogAction('image-base64', '图片 Base64 应进入图片转换工具处理。', 96),
            makeCatalogAction('en-decode', '如果需要排查编码层，也可以继续解码。', 48)
        ]);
    }

    if (looksLikeSvg(source)) {
        pushFinding(findings, 'svg', 92, '识别为 SVG 内容或 SVG 链接，适合转换为 PNG、JPG、WEBP 等图片格式。', [
            /<svg[\s>]/i.test(source) ? '包含 svg 标签' : 'SVG 文件 URL'
        ], [
            makeCatalogAction('svg-converter', 'SVG 内容应进入 SVG 转图片工具。', 95),
            makeCatalogAction('code-beautify', '需要检查源码时可先格式化 SVG/XML。', 58)
        ]);
    }

    if (looksLikeWebSocketUrl(source)) {
        pushFinding(findings, 'websocket', 91, '识别为 WebSocket 地址，建议进入 Websocket 工具测试连接和消息收发。', [
            'ws/wss 协议'
        ], [
            makeCatalogAction('websocket', 'WebSocket 地址需要用专用连接测试工具。', 94),
            makeCatalogAction('postman', '如果旁边有 HTTP 鉴权接口，也可联动接口调试。', 42)
        ]);
    }

    if (looksLikeUuid(source)) {
        pushFinding(findings, 'uuid', 90, '识别为 UUID，可以进入 UUID/ID 工具继续生成、校验或解析其他 ID。', [
            '标准 UUID 结构'
        ], [
            makeCatalogAction('uuid-gen', 'UUID/ID 内容应进入 ID 工具。', 92)
        ]);
    }

    if (looksLikeDelimitedTable(source)) {
        pushFinding(findings, 'table-data', 84, '识别为表格、CSV 或 TSV 数据，适合转 JSON，也可以直接做图表。', [
            '多行定界符列结构'
        ], [
            makeCatalogAction('excel2json', '表格文本适合先转换为结构化 JSON。', 90),
            makeCatalogAction('chart-maker', '结构化数据也可以进入图表工具快速可视化。', 70)
        ]);
    }

    if (looksLikeHtmlFragment(source)) {
        pushFinding(findings, 'html-fragment', 83, '识别为 HTML 片段，适合转 Markdown 或先做代码美化。', [
            '包含 HTML 标签结构'
        ], [
            makeCatalogAction('html2markdown', 'HTML 片段可进入 Markdown 转换工具。', 88),
            makeCatalogAction('code-beautify', '需要查看结构时可先格式化 HTML。', 78)
        ]);
    }

    if (looksLikePerformanceTrace(source)) {
        pushFinding(findings, 'performance', 82, '识别为网页性能指标或 Performance Trace 片段，适合进入网站性能优化工具分析。', [
            '包含核心 Web 指标或 Performance API 字段'
        ], [
            makeCatalogAction('page-timing', '性能指标应进入网站性能优化工具。', 88)
        ]);
    }

    if (looksLikeUserscript(source)) {
        pushFinding(findings, 'userscript', 82, '识别为油猴脚本或网页 Hack 配置，适合进入网页油猴工具管理。', [
            '包含 UserScript 元数据或 GM API'
        ], [
            makeCatalogAction('page-monkey', '油猴脚本适合进入网页油猴工具。', 88),
            makeCatalogAction('code-beautify', '脚本源码可先格式化和检查。', 56)
        ]);
    }

    if (looksLikeByteUnit(source)) {
        pushFinding(findings, 'byte-unit', 78, '识别为文件大小或存储容量，适合做 B、KB、MB、GB、TB 单位换算。', [
            '包含容量单位'
        ], [
            makeCatalogAction('byte-unit', '容量数值应进入存储单位转换。', 84)
        ]);
    }

    if (looksLikeRadixNumber(source)) {
        pushFinding(findings, 'radix-number', 76, '识别为二进制或十六进制数值，适合进入进制转换工具。', [
            '包含 0x/0b 或纯二进制特征'
        ], [
            makeCatalogAction('trans-radix', '进制字面量应进入进制转换。', 82)
        ]);
    }

    if (looksLikeMarkdown(source)) {
        pushFinding(findings, 'markdown', 72, '识别为 Markdown 内容，适合在 Markdown 转换工具中预览或导出。', [
            '包含 Markdown 标题、列表、代码块或表格'
        ], [
            makeCatalogAction('html2markdown', 'Markdown 内容可进入 Markdown 工具预览转换。', 78),
            makeCatalogAction('sticky-notes', '也可保存为便签笔记。', 50)
        ]);
    }

    if (looksLikeOutline(source)) {
        pushFinding(findings, 'outline', 68, '识别为大纲或条目列表，适合整理为思维导图或便签。', [
            '多行列表结构'
        ], [
            makeCatalogAction('naotu', '大纲内容适合转成思维导图。', 74),
            makeCatalogAction('sticky-notes', '也可保存到便签笔记。', 60)
        ]);
    }
}

function collectKeywordToolFindings(source, findings) {
    const value = normalizeInput(source);
    if (!value || value.length > 120 || /\n/.test(value)) return;
    const lowered = value.toLowerCase();

    TOOL_CATALOG.forEach(tool => {
        const matchedKeyword = tool.keywords.find(keyword => keyword.length >= 2 && lowered.includes(keyword));
        if (!matchedKeyword) return;
        pushFinding(findings, `intent:${tool.key}`, 64, `识别为「${tool.name}」相关意图，可以直接打开对应 FeHelper 工具。`, [
            `命中关键词：${matchedKeyword}`
        ], [
            makeCatalogAction(tool.key, `搜索或意图文本命中 ${tool.name}。`, 72)
        ]);
    });

    if (looksLikeLoanText(source)) {
        pushFinding(findings, 'intent:loan-rate', 72, '识别为贷款、利率或月供计算意图，建议进入贷款利率工具。', [
            '贷款/利率关键词'
        ], [
            makeCatalogAction('loan-rate', '贷款和月供内容应进入贷款利率工具。', 80)
        ]);
    }

    if (looksLikePosterRequest(source)) {
        pushFinding(findings, 'intent:poster-maker', 72, '识别为海报、封面或营销图生成意图，建议进入海报快速生成。', [
            '海报/营销图关键词'
        ], [
            makeCatalogAction('poster-maker', '海报需求应进入海报快速生成工具。', 82)
        ]);
    }

    if (looksLikeMockDataRequest(source)) {
        pushFinding(findings, 'intent:mock-data', 70, '识别为测试数据或 Mock 数据生成意图，建议进入数据 Mock 工具。', [
            'Mock/测试数据关键词'
        ], [
            makeCatalogAction('mock-data', '测试数据需求应进入数据 Mock 工具。', 78)
        ]);
    }

    if (looksLikePasswordRequest(source)) {
        pushFinding(findings, 'intent:password', 70, '识别为随机密码或口令生成意图，建议进入随机密码生成工具。', [
            '密码生成关键词'
        ], [
            makeCatalogAction('password', '密码生成需求应进入随机密码工具。', 78)
        ]);
    }

    if (looksLikeDateTimeRequest(source)) {
        pushFinding(findings, 'intent:datetime-calc', 70, '识别为高级日期、时区或时间差计算意图，建议进入时间戳计算器。', [
            '日期/时区计算关键词'
        ], [
            makeCatalogAction('datetime-calc', '日期和时区计算应进入时间戳计算器。', 78),
            makeCatalogAction('timestamp', '普通时间戳转换也可用时间转换工具。', 58)
        ]);
    }
}

function analyzeDeveloperInput(input) {
    const source = clipText(normalizeInput(input));
    if (!source) {
        return {
            inputType: 'empty',
            confidence: '低',
            score: 0,
            summary: '粘贴内容、URL、接口响应、Token、时间或代码后，FeHelper 会推荐合适工具。',
            signals: [],
            actions: [makeAction('ai-chat', '没有可分析内容。', 1)],
            primaryAction: makeAction('ai-chat', '没有可分析内容。', 1),
            sourceLength: 0,
            refinedByAi: false
        };
    }

    const findings = [];
    const parsedJson = tryParseJson(source);

    if (parsedJson) {
        pushFinding(findings, 'json', 94, '识别为合法 JSON，可以格式化、推断结构或生成 JSONPath。', [
            Array.isArray(parsedJson) ? '顶层是数组' : '顶层是对象',
            `长度 ${source.length} 字符`
        ], [
            makeAction('json-format', 'JSON 已合法，直接进入 JSON 工具处理即可。', 95),
            makeAction('code-explain', '如果这是接口片段，也可以让 AI 解释字段含义。', 42)
        ]);
    } else if (looksLikeJson(source) || looksLikeEscapedJson(source)) {
        pushFinding(findings, 'broken-json', 86, '识别为疑似 JSON 或转义 JSON，建议先修复再继续分析。', [
            looksLikeEscapedJson(source) ? '包含转义引号或转义控制字符' : '有 JSON 起止符',
            '当前无法直接 JSON.parse'
        ], [
            makeAction('json-repair', '疑似 JSON 解析失败，需要 JSON 工具修复。', 92),
            makeAction('decode-smart', '如果是多层转义，先走智能解码链路。', 72)
        ]);
    }

    if (looksLikeJwt(source)) {
        pushFinding(findings, 'jwt', 96, '识别为 JWT，建议本地解码 Header/Payload 并检查 exp、token 字段。', [
            '三段 Base64URL 结构',
            '适合本地解析，避免外发 token'
        ], [
            makeAction('decode-smart', 'JWT 适合用本地编解码工具解析。', 98),
            makeAction('api-debug', '也可带入接口调试看 Authorization 配置。', 64)
        ]);
    }

    if (looksLikeUrlEncoded(source) || looksLikeBase64(source) || looksLikeHex(source) || looksLikeCookie(source)) {
        const signals = [];
        if (looksLikeUrlEncoded(source)) signals.push('包含 URL/Unicode/UTF16 转义特征');
        if (looksLikeBase64(source)) signals.push('疑似 Base64');
        if (looksLikeHex(source)) signals.push('疑似 Hex');
        if (looksLikeCookie(source)) signals.push('疑似 Cookie');
        pushFinding(findings, 'encoded-text', 88, '识别为编码、转义或 Cookie 内容，建议使用智能解码链路。', signals, [
            makeAction('decode-smart', '需要多步探测才能避免选错解码方式。', 94),
            looksLikeCookie(source) ? makeAction('api-debug', 'Cookie 常和接口鉴权问题有关。', 44) : null
        ].filter(Boolean));
    }

    if (looksLikeCurlOrHttp(source)) {
        pushFinding(findings, 'api-debug', 91, '识别为接口请求、响应或调试片段，建议进入 Postman 辅助定位。', [
            '包含 HTTP 方法、URL、Header、状态码或接口字段',
            /\bauthorization\b/i.test(source) ? '包含鉴权 Header 线索' : ''
        ], [
            makeAction('api-debug', '接口现场应保留 Method、URL、Headers、Body 一起分析。', 96),
            makeAction('json-repair', '如果响应体是 JSON，可继续格式化分析。', 46)
        ]);
    } else if (looksLikeUrl(source)) {
        pushFinding(findings, looksLikeQrPayload(source) ? 'qr-payload' : 'url', looksLikeQrPayload(source) ? 84 : 76, looksLikeQrPayload(source)
            ? '识别为二维码标准载荷，建议检查字段和扫码可靠性。'
            : '识别为 URL，可解析参数、生成二维码或带入接口调试。', [
            /^https?:\/\//i.test(source) ? 'URL 格式' : '标准 QR 载荷',
            source.includes('?') ? '包含查询参数' : ''
        ], [
            source.includes('?') ? makeAction('decode-smart', 'URL 参数可以直接解析。', 76) : null,
            makeAction('qr-inspect', 'URL 或标准载荷适合生成二维码并检查风险。', 70),
            /^https?:\/\/[^/]+\/api\//i.test(source) ? makeAction('api-debug', 'API URL 可进入 Postman 继续调试。', 68) : null
        ].filter(Boolean));
    }

    if (looksLikeCron(source)) {
        pushFinding(findings, 'cron', 87, '识别为 Cron 表达式，建议解释执行频率和下一次运行时间。', [
            `${source.split(/\s+/).length} 段调度表达式`
        ], [
            makeAction('cron-assist', 'Cron 表达式需要结合时区和执行器规则理解。', 92)
        ]);
    }

    if (looksLikeTimestamp(source)) {
        pushFinding(findings, 'time', 82, '识别为时间戳或日期时间，建议转换并确认秒/毫秒与时区。', [
            /^\d{13}$/.test(source) ? '13 位毫秒时间戳' : '',
            /^\d{10}$/.test(source) ? '10 位秒级时间戳' : ''
        ], [
            makeAction('time-assist', '时间类内容需要明确单位和时区。', 90)
        ]);
    }

    if (looksLikeRegex(source)) {
        pushFinding(findings, 'regex', 79, '识别为正则表达式，建议解释匹配意图并生成测试样例。', [
            '包含正则元字符或字面量斜杠'
        ], [
            makeAction('regex-assist', '正则适合用样例验证和回溯风险检查。', 88)
        ]);
    }

    if (looksLikeCode(source)) {
        pushFinding(findings, 'code', 74, '识别为代码片段，建议先格式化再做意图和风险解读。', [
            '包含代码关键字或标签结构'
        ], [
            makeAction('code-explain', '代码片段需要先格式化提升可读性。', 86)
        ]);
    }

    if (looksLikeColor(source)) {
        pushFinding(findings, 'color', 72, '识别为颜色值，可以转换为其他颜色格式。', [
            '颜色字面量'
        ], [
            makeAction('color-convert', '颜色值可进入颜色转换工具。', 82)
        ]);
    }

    collectContentToolFindings(source, findings);
    collectKeywordToolFindings(source, findings);

    if (!findings.length) {
        pushFinding(findings, 'unknown', 32, '暂未识别出明确工具类型，可以交给 FeHelper AI 做进一步判断。', [
            `长度 ${source.length} 字符`
        ], [
            makeAction('ai-chat', '未知内容交给 AI 助手继续判断。', 40)
        ]);
    }

    const best = findings.sort((left, right) => right.score - left.score)[0];
    const allActions = dedupeActions(findings.reduce((acc, finding) => acc.concat(finding.actions), []));
    const primaryAction = best.actions[0] || allActions[0] || makeAction('ai-chat', '继续 AI 分析。', 1);

    return Object.assign({}, best, {
        actions: putPrimaryActionFirst(allActions, primaryAction),
        primaryAction,
        sourceLength: source.length,
        refinedByAi: false
    });
}

function findActionTemplate(toolKey, taskKey) {
    return ACTION_TEMPLATES.find(template => template.toolKey === toolKey && (!taskKey || template.taskKey === taskKey))
        || ACTION_TEMPLATES.find(template => template.toolKey === toolKey)
        || null;
}

function coerceAiAction(action, index) {
    if (!action || typeof action !== 'object') return null;
    const requestedTaskKey = normalizeInput(action.taskKey);
    const template = findActionTemplate(action.toolKey, requestedTaskKey);
    if (!template) return null;
    return Object.assign({}, template, {
        taskKey: template.taskKey,
        title: normalizeInput(action.title) || template.title,
        commandLabel: normalizeInput(action.commandLabel) || template.commandLabel,
        desc: normalizeInput(action.desc) || template.desc,
        reason: normalizeInput(action.reason) || 'Gemini Nano 推荐此动作。',
        priority: Number.isFinite(Number(action.priority)) ? Number(action.priority) : 100 - index
    });
}

function extractJsonObject(text) {
    const source = String(text || '').trim();
    const blockMatch = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (blockMatch) return blockMatch[1].trim();

    const start = source.indexOf('{');
    const end = source.lastIndexOf('}');
    if (start >= 0 && end > start) {
        return source.slice(start, end + 1);
    }
    return '';
}

function parseAiRouterResponse(text) {
    const candidate = extractJsonObject(text);
    if (!candidate) return null;
    let parsed;
    try {
        parsed = JSON.parse(candidate);
    } catch {
        return null;
    }

    const actions = Array.isArray(parsed.actions)
        ? parsed.actions.map(coerceAiAction).filter(Boolean)
        : [];

    return {
        inputType: normalizeInput(parsed.inputType).slice(0, 60) || 'ai-refined',
        confidence: ['高', '中', '低'].includes(parsed.confidence) ? parsed.confidence : '中',
        score: Number.isFinite(Number(parsed.score)) ? Number(parsed.score) : 74,
        summary: normalizeInput(parsed.summary).slice(0, 120) || 'Gemini Nano 已完成工具判断。',
        signals: Array.isArray(parsed.signals)
            ? parsed.signals.map(item => normalizeInput(item)).filter(Boolean).slice(0, 5)
            : [],
        actions: dedupeActions(actions),
        refinedByAi: true
    };
}

function mergeRouterAnalysis(localAnalysis, aiAnalysis) {
    if (!aiAnalysis) return localAnalysis;
    const actions = dedupeActions([]
        .concat(aiAnalysis.actions || [])
        .concat(localAnalysis && localAnalysis.actions ? localAnalysis.actions : []));

    return Object.assign({}, localAnalysis, aiAnalysis, {
        actions,
        primaryAction: actions[0] || (localAnalysis && localAnalysis.primaryAction) || makeAction('ai-chat', '继续 AI 分析。', 1),
        sourceLength: localAnalysis ? localAnalysis.sourceLength : 0,
        refinedByAi: true
    });
}

function formatAllowedActionsForPrompt() {
    return ACTION_TEMPLATES
        .map(action => {
            const task = action.taskKey ? `/${action.taskKey}` : '';
            return `${action.id} => ${action.toolKey}${task}`;
        })
        .join('\n');
}

function formatToolCatalogForPrompt() {
    return TOOL_CATALOG
        .map(tool => {
            const actionIds = ACTION_TEMPLATES
                .filter(action => action.toolKey === tool.key)
                .map(action => action.taskKey ? `${action.id}/${action.taskKey}` : action.id)
                .join(', ');
            const menu = tool.menuText ? `菜单: ${tool.menuText}` : '';
            const tips = tool.tips ? `能力: ${tool.tips}` : '';
            return `- ${tool.key} | ${tool.name} | ${tips} | ${menu} | 动作: ${actionIds}`;
        })
        .join('\n');
}

function buildAiRouterMessages(input, localAnalysis) {
    const allowedActions = formatAllowedActionsForPrompt();
    const toolCatalog = formatToolCatalogForPrompt();
    const schemaExample = {
        inputType: 'jwt',
        confidence: '高',
        score: 90,
        summary: '识别为 JWT，适合本地解码并检查 exp。',
        signals: ['三段 Base64URL 结构'],
        actions: [{
            toolKey: 'en-decode',
            taskKey: 'smart-decode',
            title: '智能解码链路',
            commandLabel: 'AI 解码',
            desc: '本地解析 JWT Header/Payload。',
            reason: 'JWT 不应外发，优先本地处理。',
            priority: 98
        }]
    };

    return [{
        role: 'system',
        content: [
            '你是 FeHelper 的 AI Tool Router，只负责判断开发者粘贴内容应该交给哪个 FeHelper 工具。',
            '你必须结合 FeHelper 完整工具目录、本地预判信号和待判断内容做路由，不要只按关键词粗暴匹配。',
            '不要聊天，不要解释基础概念，不要输出 Markdown。',
            '只能从允许动作列表里选择 action，不能虚构工具或 action。',
            '必须只输出一个 JSON 对象，字段必须符合示例结构。',
            '如果内容包含 token、cookie、secret、authorization，优先推荐本地工具，不要建议上传到云端。'
        ].join('\n')
    }, {
        role: 'user',
        content: [
            '# FeHelper 完整工具目录',
            toolCatalog,
            '',
            '# 允许动作列表',
            allowedActions,
            '',
            '# FeHelper 本地预判',
            JSON.stringify({
                inputType: localAnalysis && localAnalysis.inputType,
                confidence: localAnalysis && localAnalysis.confidence,
                summary: localAnalysis && localAnalysis.summary,
                signals: localAnalysis && localAnalysis.signals,
                actions: localAnalysis && localAnalysis.actions ? localAnalysis.actions.slice(0, 4).map(action => ({
                    toolKey: action.toolKey,
                    taskKey: action.taskKey,
                    title: action.title
                })) : []
            }, null, 2),
            '',
            '# 输出 JSON 示例',
            JSON.stringify(schemaExample, null, 2),
            '',
            '# 待判断内容',
            clipText(input, PROMPT_INPUT_LIMIT)
        ].join('\n')
    }];
}

export {
    ACTION_TEMPLATES,
    TOOL_CATALOG,
    analyzeDeveloperInput,
    buildAiRouterMessages,
    clipText,
    mergeRouterAnalysis,
    parseAiRouterResponse
};
