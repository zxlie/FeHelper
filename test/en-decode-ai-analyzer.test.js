import { describe, expect, it } from 'vitest';
import {
    analyzeDecodeInput,
    looksLikeBase64,
    looksLikeHex
} from '../apps/en-decode/ai-decode-analyzer.js';

function toBase64Url(value) {
    return Buffer.from(JSON.stringify(value), 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

describe('en-decode AI analyzer', () => {
    it('finds URL decode plus Base64 decode plus JSON preview', async () => {
        const payload = JSON.stringify({ok: true, name: 'FeHelper'});
        const input = encodeURIComponent(Buffer.from(payload, 'utf8').toString('base64'));
        const analysis = await analyzeDecodeInput(input);

        expect(analysis.bestCandidate.title).toBe('解码为 JSON');
        expect(analysis.bestCandidate.stepLabels).toEqual([
            'URL解码',
            'Base64解码',
            'JSON格式化预览'
        ]);
        expect(analysis.bestCandidate.output).toContain('"name": "FeHelper"');
        expect(analysis.markdown).toContain('应用最佳结果');
    });

    it('recognizes JWT and formats header and payload', async () => {
        const token = [
            toBase64Url({alg: 'HS256', typ: 'JWT'}),
            toBase64Url({sub: 'u_123', exp: 4102444800}),
            'signature'
        ].join('.');
        const analysis = await analyzeDecodeInput(token);

        expect(analysis.bestCandidate.title).toBe('解码为 JWT');
        expect(analysis.bestCandidate.selectedType).toBe('jwtDecode');
        expect(analysis.bestCandidate.output).toContain('"sub": "u_123"');
        expect(analysis.bestCandidate.warnings.length).toBeGreaterThan(0);
    });

    it('recognizes cookies and keeps values with equals signs', async () => {
        const analysis = await analyzeDecodeInput('sid=abc.def; token=a=b=c; theme=dark');

        expect(analysis.bestCandidate.title).toBe('格式化 Cookie');
        expect(analysis.bestCandidate.selectedType).toBe('cookieDecode');
        expect(analysis.bestCandidate.output).toContain('"token": "a=b=c"');
        expect(analysis.bestCandidate.warnings.join('\n')).toContain('疑似 token');
    });

    it('keeps detectors conservative enough for short plain text', () => {
        expect(looksLikeBase64('hello')).toBe(false);
        expect(looksLikeHex('12345678')).toBe(false);
        expect(looksLikeHex('e4bda0e5a5bd')).toBe(true);
    });
});
