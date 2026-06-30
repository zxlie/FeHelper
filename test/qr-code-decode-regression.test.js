import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

describe('qr-code decode regression guards', () => {
    it('retries QR decoding with prepared image candidates before reporting failure', () => {
        const source = readSource('apps/qr-code/index.js');

        expect(source).toContain('_decodeImageWithRetries');
        expect(source).toContain('_createQrDecodeCandidates');
        expect(source).toContain('_drawQrDecodeCanvas');
        expect(source).toContain('BrowserQRCodeReader');
        expect(source).toContain('BrowserMultiFormatReader(hints, 300)');
        expect(source).toContain('DecodeHintType.TRY_HARDER');
        expect(source).toContain('DecodeHintType.POSSIBLE_FORMATS');
        expect(source).toContain('BarcodeFormat.QR_CODE');
        expect(source).toContain("label: 'padded'");
        expect(source).toContain("label: 'scaled'");
        expect(source).toContain("label: 'contrast'");
    });

    it('shows actionable QR decode errors instead of raw ZXing reader exceptions', () => {
        const source = readSource('apps/qr-code/index.js');

        expect(source).toContain('_formatQrDecodeError');
        expect(source).toContain('未识别到二维码内容');
        expect(source).toContain('当前图片存在跨域限制');
        expect(source).toContain('callback && callback(false);');
        expect(source).not.toContain('self._showDecodeResult(imgSrc, err);');
        expect(source).not.toContain('callback && callback(err);');
    });

    it('keeps image context-menu decode from silently stopping on tainted canvas reads', () => {
        const source = readSource('apps/qr-code/content-script.js');

        expect(source).toContain('try {');
        expect(source).toContain('resolve(canvas.toDataURL());');
        expect(source).toContain('catch (err)');
        expect(source).toContain('resolve(src);');
        expect(source).toContain('canvas.parentNode.removeChild(canvas);');
    });
});
