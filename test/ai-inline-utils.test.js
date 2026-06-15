import { describe, expect, it } from 'vitest';
import {
    buildToolAiMessages,
    clipTextForPrompt,
    extractFirstCodeBlock,
    extractJsonCandidate,
    renderInlineMarkdown
} from '../apps/aiagent/fh.ai-inline.js';

describe('AI inline helper', () => {
    it('builds tool-aware system and user messages', () => {
        const messages = buildToolAiMessages('json-format', {
            title: '解释并修复 JSON 错误',
            instruction: '请修复当前 JSON。',
            inputLabel: '输入',
            input: '{"a":1,}',
            resultLabel: '错误',
            result: 'Unexpected token',
            meta: {
                JSONLint: '开启'
            }
        });

        expect(messages).toHaveLength(2);
        expect(messages[0].role).toBe('system');
        expect(messages[0].content).toContain('FeHelper 的 JSON 自动化助手');
        expect(messages[0].content).toContain('工具内联 AI 规则');
        expect(messages[1].content).toContain('请修复当前 JSON。');
        expect(messages[1].content).toContain('## 输入');
        expect(messages[1].content).toContain('## 错误');
        expect(messages[1].content).toContain('- JSONLint: 开启');
    });

    it('builds QR payload-aware messages', () => {
        const messages = buildToolAiMessages('qr-code', {
            title: 'AI 生成载荷',
            instruction: '请转换成标准二维码载荷。',
            input: '生成 Wi-Fi 二维码：SSID=office，密码=12345678，加密=WPA。',
            outputHint: '必须包含一个 text 代码块。'
        });

        expect(messages[0].content).toContain('标准二维码载荷');
        expect(messages[0].content).toContain('Wi-Fi');
        expect(messages[0].content).toContain('vCard');
        expect(messages[1].content).toContain('请转换成标准二维码载荷。');
    });

    it('clips long context while preserving head and tail', () => {
        const text = `${'a'.repeat(9000)}MID${'z'.repeat(9000)}`;
        const clipped = clipTextForPrompt(text, 1000);

        expect(clipped.length).toBeLessThan(text.length);
        expect(clipped).toContain('FeHelper 已截断中间');
        expect(clipped.startsWith('aaaa')).toBe(true);
        expect(clipped.endsWith('zzzz')).toBe(true);
    });

    it('extracts preferred code block', () => {
        const text = [
            '说明',
            '```text',
            'hello',
            '```',
            '```json',
            '{"ok":true}',
            '```'
        ].join('\n');

        expect(extractFirstCodeBlock(text, 'json')).toBe('{"ok":true}');
        expect(extractFirstCodeBlock(text)).toBe('hello');
    });

    it('extracts json candidate from code block or prose', () => {
        expect(extractJsonCandidate('```json\n{"a":1}\n```')).toBe('{"a":1}');
        expect(extractJsonCandidate('修正版如下：\n{"b":2}\n可以复制')).toBe('{"b":2}');
    });

    it('renders inline markdown from the global marked parser', () => {
        const prevMarked = globalThis.marked;
        globalThis.marked = source => `<p>${source}</p>`;

        try {
            expect(renderInlineMarkdown('**代码意图**')).toBe('<p>**代码意图**</p>');
        } finally {
            globalThis.marked = prevMarked;
        }
    });

    it('escapes markdown fallback when marked is unavailable', () => {
        const prevMarked = globalThis.marked;
        delete globalThis.marked;

        try {
            expect(renderInlineMarkdown('<script>alert(1)</script>'))
                .toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
        } finally {
            globalThis.marked = prevMarked;
        }
    });

    it('renders useful markdown blocks without marked', () => {
        const prevMarked = globalThis.marked;
        delete globalThis.marked;

        try {
            const html = renderInlineMarkdown([
                '## 结论',
                '- 缺少 `Authorization`',
                '- Body 应为 **JSON**',
                '',
                '```json',
                '{"ok":true}',
                '```'
            ].join('\n'));

            expect(html).toContain('<h2>结论</h2>');
            expect(html).toContain('<ul><li>缺少 <code>Authorization</code></li><li>Body 应为 <strong>JSON</strong></li></ul>');
            expect(html).toContain('<pre><code class="language-json">{&quot;ok&quot;:true}</code></pre>');
        } finally {
            globalThis.marked = prevMarked;
        }
    });
});
