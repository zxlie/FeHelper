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

    it('Issue #592: 宽松 key 修正不会破坏字符串值里的逗号和冒号', () => {
        const source = '{\n  "schema": ",m:"\n}';
        const parsed = utils.parseJSONLike(source);

        expect(utils.parseWithBigInt(source)).toEqual({ schema: ',m:' });
        expect(parsed.value.schema).toBe(',m:');
        expect(parsed.normalizedSource).toBe('{"schema":",m:"}');
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

    it('Issue #593: HTML 自动格式化路径可关闭正文中的 JSON 片段提取', () => {
        const source = '普通网页正文 before {"status":"ok"} after';

        expect(utils.parseJSONLike(source)).not.toBeNull();
        expect(utils.parseJSONLike(source, { allowExtractJSONFragment: false })).toBeNull();
    });

    it('Issue #601: HTML 自动格式化路径可关闭函数调用/JSONP 解析', () => {
        const source = "wx.switchTab({\n  url: '/index'\n})";

        expect(utils.parseJSONLike(source, { allowExtractJSONFragment: false })).not.toBeNull();
        expect(utils.parseJSONLike(source, {
            allowExtractJSONFragment: false,
            allowJSONP: false,
        })).toBeNull();
    });

    it('Issue #601: HTML 页面代码示例不会被正文 JSON 片段提取误判', () => {
        const parseOptions = {
            allowExtractJSONFragment: false,
            allowJSONP: false,
        };
        const samples = [
            "wx.switchTab({\n  url: '/index'\n})",
            "import { motion } from 'motion/react';\n\nexport default function Demo() {\n  return <motion.div layout={{ duration: 0.2 }} />;\n}",
            "<html><body><pre>wx.switchTab({ url: '/index' })</pre></body></html>",
        ];

        samples.forEach(source => {
            expect(utils.parseJSONLike(source, parseOptions)).toBeNull();
        });
        expect(utils.parseJSONLike('{"status":"ok"}', parseOptions).value.status).toBe('ok');
    });

    it('Issue #634: 普通 HTML 页面中的对象文本不会被当成独立 JSON 文档', () => {
        const candidate = utils.getStandaloneHTMLJSONCandidate({
            directText: '',
            preTexts: [],
            otherElementTexts: ['登录成功', '{status:"ok"}'],
        });

        expect(candidate).toBe(false);
    });

    it('Issue #634: 独立 body>pre 中的真正 JSON 仍会自动格式化', () => {
        const source = '{"status":"ok","items":[1,2]}';
        const candidate = utils.getStandaloneHTMLJSONCandidate({
            directText: '',
            preTexts: [source],
            otherElementTexts: [],
        });

        expect(candidate).toBe(source);
    });

    it('Issue #634: 仅包含纯文本 JSON 的 HTML body 仍会自动格式化', () => {
        const source = '{"status":"ok"}';
        const candidate = utils.getStandaloneHTMLJSONCandidate({
            directText: source,
            preTexts: [],
            otherElementTexts: [],
        });

        expect(candidate).toBe(source);
    });

    it('Issue #634: HTML body/pre 只接受严格 JSON，且不执行宽松对象表达式', () => {
        globalThis.__fh_json_probe = 0;

        expect(utils.getStandaloneHTMLJSONCandidate({
            directText: '{status:"ok"}',
            preTexts: [],
            otherElementTexts: [],
        })).toBe(false);
        expect(utils.getStandaloneHTMLJSONCandidate({
            directText: '',
            preTexts: ['{status:(globalThis.__fh_json_probe=7,"ok")}'],
            otherElementTexts: [],
        })).toBe(false);
        expect(globalThis.__fh_json_probe).toBe(0);
        delete globalThis.__fh_json_probe;
    });

    it('Issue #608: raw YAML/YML resources are not JSON auto-format targets', () => {
        expect(utils.isYAMLResource(
            'https://raw.githubusercontent.com/bitxeno/go-docker-skeleton/refs/heads/master/.github/workflows/release.yml',
            'text/plain; charset=utf-8',
        )).toBe(true);
        expect(utils.isYAMLResource('https://example.com/config.yaml', 'text/plain')).toBe(true);
        expect(utils.isYAMLResource('https://example.com/config', 'application/x-yaml')).toBe(true);
        expect(utils.isYAMLResource('https://example.com/data.json', 'application/json')).toBe(false);
    });

    it('Issue #646/#650: Markdown resources are not JSON auto-format targets', () => {
        expect(utils.isMarkdownResource('file:///Users/test/test.md', 'text/plain')).toBe(true);
        expect(utils.isMarkdownResource('https://example.com/readme.markdown', 'text/plain')).toBe(true);
        expect(utils.isMarkdownResource('https://example.com/content', 'text/markdown; charset=utf-8')).toBe(true);
        expect(utils.isMarkdownResource('https://example.com/data.json', 'application/json')).toBe(false);
        expect(utils.parseJSONLike('有一幢楼，建于[1990]年。')).not.toBeNull();
        expect(utils.parseJSONLike('有一幢楼，建于[1990]年。', { allowExtractJSONFragment: false })).toBeNull();
    });

    it('Issue #613: 自动格式化保留数字字符串 key 的输入顺序', () => {
        const parsed = utils.parseJSONLike('{"2":"b","1":"a","name":"FeHelper"}');
        const keys = Object.keys(parsed.value).map(utils.normalizePreservedKey);

        expect(keys).toEqual(['2', '1', 'name']);
        expect(utils.safeStringify(parsed.value)).toBe('{"2":"b","1":"a","name":"FeHelper"}');
    });

    it('Issue #623/#624: JSON Pointer 中的数字字符串 key 前缀会被归一化', () => {
        const parsed = utils.parseJSONLike('{"2":{"name":"b"},"1":"a"}');
        const internalKey = Object.keys(parsed.value)[0];

        expect(internalKey).toBe('__FH_PRESERVE_INTEGER_KEY__2');
        expect(utils.normalizePreservedJsonPointer('/' + internalKey + '/name')).toBe('/2/name');
    });

    it('Issue #642/#640: parsed cache 可按显示路径读取数字字符串 key', () => {
        const parsed = utils.parseJSONLike('{"2":{"name":"b"},"rows":[{"1":"a"}]}');

        expect(utils.getPreservedValueAtPath(parsed.value, ['2', 'name'])).toBe('b');
        expect(utils.getPreservedValueAtPath(parsed.value, ['rows', '[0]', '1'])).toBe('a');
    });

    it('Issue #642: 删除节点时同步 parsed cache，祖先导出不会带回已删字段', () => {
        const parsed = utils.parseJSONLike('{"keep":1,"drop":2,"rows":[{"1":"a","2":"b"}]}');

        expect(utils.deletePreservedValueAtPath(parsed.value, ['drop'])).toBe(true);
        expect(utils.deletePreservedValueAtPath(parsed.value, ['rows', '[0]', '1'])).toBe(true);
        expect(utils.safeStringify(parsed.value)).toBe('{"keep":1,"rows":[{"2":"b"}]}');
    });

    it('Issue #642: 删除数组首项后重排可见节点索引与尾逗号', () => {
        function createElement(index, hasComma) {
            const element = {
                attributes: { 'data-array-index': String(index) },
                children: [],
                setAttribute(name, value) { this.attributes[name] = value; },
                appendChild(child) { this.children.push(child); child.parentNode = this; },
                removeChild(child) { this.children.splice(this.children.indexOf(child), 1); },
            };
            if (hasComma) {
                element.appendChild({ className: 'comma', textContent: ',' });
            }
            return element;
        }

        const visibleNodes = [createElement(1, true), createElement(2, false)];
        const documentRef = {
            createElement() { return { className: '', textContent: '' }; },
        };

        utils.reindexArrayElementNodes(visibleNodes, documentRef);

        expect(visibleNodes.map(node => node.attributes['data-array-index'])).toEqual(['0', '1']);
        expect(visibleNodes[0].children.map(child => child.className)).toEqual(['comma']);
        expect(visibleNodes[1].children.map(child => child.className)).toEqual([]);
    });

    it('Issue #640: fallback anchor downloader starts the first click and cleans up', () => {
        const events = [];
        const link = {
            style: {},
            click() { events.push('click'); },
            remove() { events.push('remove'); },
        };
        const documentRef = {
            body: {
                appendChild(node) { events.push(node === link ? 'append' : 'wrong'); },
            },
            createElement(tag) {
                expect(tag).toBe('a');
                return link;
            },
        };
        const urlApi = {
            createObjectURL() { events.push('create'); return 'blob:test'; },
            revokeObjectURL(url) { events.push('revoke:' + url); },
        };

        expect(utils.downloadJsonBlobWithAnchor({}, '窗口名.json', { documentRef, urlApi })).toBe(true);
        expect(link.download).toBe('窗口名.json');
        expect(link.href).toBe('blob:test');
        expect(events).toEqual(['create', 'append', 'click', 'remove', 'revoke:blob:test']);
    });

    it('Issue #639/#636: 大型 JSON 触发完整文本视图安全降级', () => {
        expect(utils.shouldUsePlainJsonView({ ok: true }, 20)).toBe(false);
        expect(utils.shouldUsePlainJsonView(Array.from({ length: 20001 }, (_, index) => index), 100)).toBe(true);
        expect(utils.shouldUsePlainJsonView({ payload: 'x' }, 2000001)).toBe(true);
    });
});

describe('case-insensitive boolean tokens (#656)', () => {
    it('accepts booleans without changing quoted text, escaped quotes or key names', () => {
        const input = '{"TRUE":TRUE,"off":False,"list":[TrUe,FALSE],"text":"True False \\"TRUE\\"","single":\'False\'}';
        const value = utils.parseWithBigInt(input);
        expect(value.TRUE).toBe(true);
        expect(value.off).toBe(false);
        expect(value.list).toEqual([true, false]);
        expect(value.text).toBe('True False "TRUE"');
        expect(value.single).toBe('False');
    });
    it('rejects identifiers and does not relax strict auto-detection of non-JSON', () => {
        expect(() => utils.parseWithBigInt('{"x":trueValue}')).toThrow();
        expect(() => utils.parseWithBigInt('{"x":FALSE_VALUE}')).toThrow();
    });
});
