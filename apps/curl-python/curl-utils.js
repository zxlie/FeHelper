/** Offline curl text parser: never invokes a shell or performs a network request.
 * POSIX single/double quotes and escaped newlines; no shell expansion.
 * Unsupported curl semantics fail explicitly instead of producing partial requests.
 * Reference: https://curl.se/docs/manpage.html
 */
function shellWords(input) {
    if (typeof input !== 'string' || input.length > 2 * 1024 * 1024) throw new Error('请输入不超过 2 Mi 字符的 curl 命令');
    input = input.trim();
    if (input.includes('\0')) throw new Error('命令不能包含 NUL 字符');
    const words = [];
    let word = '', quote = '', started = false;
    function finish() {
        if (started) words.push(word);
        word = ''; started = false;
    }
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (quote === "'") {
            if (char === "'") quote = '';
            else word += char;
            continue;
        }
        if (char === '\\') {
            const next = input[++i];
            if (next === undefined) throw new Error('命令末尾转义不完整');
            if (next === '\n') continue;
            if (next === '\r' && input[i + 1] === '\n') { i++; continue; }
            if (quote === '"' && !['$', '`', '"', '\\'].includes(next)) word += '\\';
            word += next; started = true; continue;
        }
        if (char === '$' || char === '`') throw new Error('不支持 shell 变量、命令替换或 ANSI-C 引号，请粘贴展开后的字面值');
        if (quote === '"') {
            if (char === '"') quote = '';
            else word += char;
            continue;
        }
        if (char === "'" || char === '"') { quote = char; started = true; continue; }
        if (';|&<>()'.includes(char) || char === '\n' || char === '\r') throw new Error('仅支持单条 curl 命令；URL 中的特殊字符请用引号包围');
        if (char === '#' && !started) throw new Error('不支持 shell 注释');
        if (char === ' ' || char === '\t') finish();
        else { word += char; started = true; }
    }
    if (quote) throw new Error('引号未闭合');
    finish();
    if (words.shift() !== 'curl') throw new Error('命令必须以 curl 开始（支持 POSIX/Bash 引号）');
    return words;
}
const aliases = {
    X: '--request', H: '--header', d: '--data', u: '--user', b: '--cookie', A: '--user-agent',
    e: '--referer', F: '--form', G: '--get', I: '--head', L: '--location', k: '--insecure',
    s: '--silent', S: '--show-error', v: '--verbose', i: '--include', g: '--globoff'
};
const valued = new Set(['--request', '--header', '--data', '--data-ascii', '--data-raw', '--data-binary',
    '--data-urlencode', '--json', '--user', '--cookie', '--user-agent', '--referer', '--form', '--form-string', '--url']);
const switches = new Set(['--get', '--head', '--location', '--insecure', '--silent', '--show-error', '--verbose', '--include', '--globoff']);
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function parseCurl(input) {
    const words = shellWords(input);
    const headers = {};
    const seenHeaders = new Set();
    const data = [], forms = [];
    let url, method, auth, jsonMode = false, get = false, head = false, redirects = false, verify = true;
    let literalUrls = false, globoff = false;
    function setHeader(name, value) {
        if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) || /[\r\n]/.test(value) || !value || /^[ \t]/.test(value)) throw new Error('不支持空值、删除式或含换行的 HTTP 请求头');
        if (Array.from(value).some(char => char.charCodeAt(0) > 127)) throw new Error('暂不支持非 ASCII 请求头值，curl 与 requests 的编码不同');
        const lower = name.toLowerCase();
        if (['content-length', 'transfer-encoding', 'accept-encoding'].includes(lower)) throw new Error(`暂不支持手动设置 ${name}；requests 的传输层语义不同`);
        if (seenHeaders.has(lower)) throw new Error(`重复请求头 ${name} 无法由 requests 字典无损表示`);
        seenHeaders.add(lower);
        Object.defineProperty(headers, name, { value, writable: true, enumerable: true, configurable: true });
    }
    function defaultHeader(name, value) {
        if (!seenHeaders.has(name.toLowerCase())) setHeader(name, value);
    }
    function addUrl(value) {
        if (url !== undefined) throw new Error('暂不支持多个 URL 或多次请求');
        url = value;
    }
    function option(name, value) {
        switch (name) {
            case '--url': addUrl(value); break;
            case '--request':
                if (!/^[A-Z]+$/.test(value)) throw new Error('仅支持大写请求方法；requests 会自动转为大写');
                method = value; break;
            case '--header': {
                const colon = value.indexOf(':');
                if (colon < 1) throw new Error('请求头格式应为 Name: value，不支持 @文件 或删除式请求头');
                setHeader(value.slice(0, colon), value.slice(colon + 1).replace(/^[ \t]+/, '')); break;
            }
            case '--user': {
                const colon = value.indexOf(':');
                if (colon < 0) throw new Error('Basic Auth 需要 user:password；不支持交互式密码提示');
                if (Array.from(value).some(char => char.charCodeAt(0) > 127)) throw new Error('暂不支持非 ASCII Basic Auth 凭据，curl 与 requests 的编码不同');
                auth = [value.slice(0, colon), value.slice(colon + 1)]; break;
            }
            case '--cookie':
                if (!value.includes('=') || value.startsWith('@')) throw new Error('仅支持字面 Cookie，不读取 cookie 文件');
                setHeader('Cookie', value); break;
            case '--user-agent': setHeader('User-Agent', value); break;
            case '--referer':
                if (value.endsWith(';auto')) throw new Error('暂不支持自动 Referer');
                setHeader('Referer', value); break;
            case '--form': case '--form-string': {
                const equal = value.indexOf('=');
                if (equal < 1) throw new Error('表单格式应为 name=value');
                const field = value.slice(equal + 1);
                if (name === '--form' && (/^[@<]/.test(field) || /[;"\\]/.test(value))) throw new Error('仅支持字面文本表单；文件、类型参数和表单转义暂不支持');
                forms.push([value.slice(0, equal), field]); break;
            }
            case '--data': case '--data-ascii': case '--data-binary': case '--data-raw': case '--json': case '--data-urlencode': {
                if (name !== '--data-raw' && value.startsWith('@')) throw new Error('不支持读取 @文件，请直接粘贴请求体');
                const isJson = name === '--json';
                if (data.length && jsonMode !== isJson) throw new Error('暂不支持混用 --json 与 --data 系列');
                jsonMode = isJson;
                if (name === '--data-urlencode') {
                    const equal = value.indexOf('=');
                    if ((equal < 0 && value.includes('@')) || (equal > 0 && value.slice(0, equal).includes('@'))) throw new Error('不支持 --data-urlencode 读取文件');
                    value = equal < 0 ? encodeURIComponent(value) : (equal ? value.slice(0, equal + 1) : '') + encodeURIComponent(value.slice(equal + 1));
                }
                data.push(value); break;
            }
            case '--get': get = true; break;
            case '--head': head = true; break;
            case '--location': redirects = true; break;
            case '--insecure': verify = false; break;
            case '--globoff': globoff = true; break;
            // Output/diagnostic switches do not change the HTTP request.
            case '--silent': case '--show-error': case '--verbose': case '--include': break;
            default: throw new Error(`暂不支持选项 ${name}，请先移除或手动处理其语义`);
        }
    }
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (literalUrls || !word.startsWith('-')) { addUrl(word); continue; }
        if (word === '--') { literalUrls = true; continue; }
        if (word.startsWith('--')) {
            const equal = word.indexOf('=');
            const name = equal < 0 ? word : word.slice(0, equal);
            if (!valued.has(name) && !switches.has(name)) throw new Error(`暂不支持选项 ${name}，不会忽略该选项`);
            if (switches.has(name)) {
                if (equal >= 0) throw new Error(`选项 ${name} 不接受值`);
                option(name);
            } else {
                const value = equal < 0 ? words[++i] : word.slice(equal + 1);
                if (value === undefined) throw new Error(`选项 ${name} 缺少参数`);
                option(name, value);
            }
        } else {
            for (let j = 1; j < word.length; j++) {
                const name = has(aliases, word[j]) ? aliases[word[j]] : null;
                if (!name) throw new Error(`暂不支持选项 -${word[j]}`);
                if (valued.has(name)) {
                    const value = j + 1 < word.length ? word.slice(j + 1) : words[++i];
                    if (value === undefined) throw new Error(`选项 ${name} 缺少参数`);
                    option(name, value); break;
                }
                option(name);
            }
            if (word === '-') throw new Error('不支持从标准输入读取');
        }
    }
    if (!url || !/^https?:\/\//i.test(url) || Array.from(url).some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) throw new Error('请输入完整的 http:// 或 https:// URL');
    const parsedUrl = new URL(url);
    if (parsedUrl.username || parsedUrl.password) throw new Error('URL 内嵌认证暂不支持，请使用 -u user:password');
    if (!globoff && /[{}[\]]/.test(url.replace(/^https?:\/\/\[[^\]]+\]/i, ''))) throw new Error('不支持 URL glob 展开；字面括号请使用 --globoff');
    if (head && data.length && !get) throw new Error('HEAD 与请求体不能混用');
    if (head && method && method !== 'HEAD') throw new Error('暂不支持 --head 与不同的 -X 方法组合');
    if (redirects && method && method !== 'GET') throw new Error('暂不支持 -L 与自定义非 GET 方法组合，重定向方法语义不同');
    if (redirects && seenHeaders.has('cookie')) throw new Error('暂不支持 -L 与字面 Cookie 组合，跨站重定向语义不同');
    if (forms.length && (data.length || get || head)) throw new Error('暂不支持混用 multipart 表单、请求体、GET 或 HEAD');
    if (forms.length && seenHeaders.has('content-type')) throw new Error('multipart 的 Content-Type/boundary 必须由 requests 生成');
    if (auth && seenHeaders.has('authorization')) throw new Error('不能同时指定 Basic Auth 与 Authorization 请求头');
    let body = data.length ? data.join(jsonMode ? '' : '&') : undefined;
    if (get && body !== undefined) {
        const hash = url.indexOf('#');
        const base = hash < 0 ? url : url.slice(0, hash);
        url = base + (base.includes('?') ? '&' : '?') + body + (hash < 0 ? '' : url.slice(hash));
        body = undefined;
    }
    if (jsonMode) {
        defaultHeader('Content-Type', 'application/json');
        defaultHeader('Accept', 'application/json');
    } else if (body !== undefined) defaultHeader('Content-Type', 'application/x-www-form-urlencoded');
    return { url, method: method || (head ? 'HEAD' : get ? 'GET' : data.length || forms.length ? 'POST' : 'GET'), headers, body, forms, auth, redirects, verify };
}

// JSON's quoted string syntax is also a safe Python string literal for this data.
function pythonString(value) {
    return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
export function curlToPython(input) {
    const request = parseCurl(input);
    const code = ['import requests', '', '# Generated from literal curl text. Review before running.',
        '# curl output/diagnostic flags are not reproduced. No request is sent by FeHelper.',
        'session = requests.Session()', 'session.trust_env = False', '', 'response = session.request(',
        `    method=${pythonString(request.method)},`, `    url=${pythonString(request.url)},`];
    if (Object.keys(request.headers).length) {
        code.push('    headers={');
        Object.entries(request.headers).forEach(([key, value]) => code.push(`        ${pythonString(key)}: ${pythonString(value)},`));
        code.push('    },');
    }
    if (request.auth) code.push(`    auth=(${request.auth.map(pythonString).join(', ')}),`);
    if (request.body !== undefined) code.push(`    data=${pythonString(request.body)}.encode("utf-8"),`);
    if (request.forms.length) {
        code.push('    files=[');
        request.forms.forEach(([key, value]) => code.push(`        (${pythonString(key)}, (None, ${pythonString(value)})),`));
        code.push('    ],');
    }
    code.push(`    allow_redirects=${request.redirects ? 'True' : 'False'},`, `    verify=${request.verify ? 'True' : 'False'},`, ')', '', 'print(response.status_code)', 'print(response.text)');
    return code.join('\n');
}
