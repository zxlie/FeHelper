import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');

function readSource(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

describe('qr-code AI actions', () => {
    it('turns natural language into applicable QR content', () => {
        const html = readSource('apps/qr-code/index.html');
        const source = readSource('apps/qr-code/index.js');
        const css = readSource('apps/qr-code/index.css');

        expect(html).toContain('AI 生成内容');
        expect(html).not.toContain('AI 生成载荷');
        expect(html).toContain('@click="askAiForQrPayload"');
        expect(html).toContain("aiPanel.taskKey === 'build-payload'");
        expect(html).toContain('@click="applyAiPanelResult"');
        expect(source).toContain('extractFirstCodeBlock');
        expect(source).toContain('getInlineAiTaskFromUrl');
        expect(source).toContain('buildQrContentFromDescription');
        expect(source).toContain('本地生成完成');
        expect(source).toContain('handleInlineAiLaunch');
        expect(source).toContain("task === 'build-payload'");
        expect(source).toContain("taskKey: 'build-payload'");
        expect(source).toContain("applyLabel: '应用内容'");
        expect(source).toContain('WIFI:S:<ssid>');
        expect(source).toContain('sms:<number>?body=<percent-encoded-message>');
        expect(source).not.toContain('SMSTO');
        expect(source).toContain("this.textContent = payload.trim();");
        expect(source).toContain('this.convert();');
        expect(css).toContain('.qr-ai-build-btn');
    });

    it('keeps QR AI grounded in decoded text or generated payloads', () => {
        const source = readSource('apps/qr-code/index.js');
        const features = readSource('apps/aiagent/fh.ai-features.js');

        expect(source).toContain('图片不会发送给 AI，只分析解码后的文本。');
        expect(source).toContain('不要要求用户再次上传图片。');
        expect(source).toContain('不要误报字段缺失');
        expect(source).toContain('最终可用内容必须放进 ```text 代码块。');
        expect(source).not.toContain('二维码智能载荷');
        expect(features).toContain('二维码内容助手');
        expect(features).toContain('标准二维码内容');
    });
});
