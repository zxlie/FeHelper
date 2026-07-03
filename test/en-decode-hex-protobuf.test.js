import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import EncodeUtils from '../apps/en-decode/endecode-lib.js';

function readSource(file) {
    return fs.readFileSync(path.resolve(file), 'utf8');
}

describe('en-decode hex and protobuf helpers', () => {
    it('Issue #614: Hex/ASCII 解码支持常见复制格式', () => {
        expect(EncodeUtils.hexDecode('48 65 6c 6c 6f')).toBe('Hello');
        expect(EncodeUtils.hexDecode('0x48,0x69')).toBe('Hi');
    });

    it('Issue #614: protobuf hex 可以解析为字段 JSON', () => {
        const output = JSON.parse(EncodeUtils.protobufHexDecode('0a03666f6f1001'));

        expect(output.format).toBe('protobuf-wire');
        expect(output.note).toContain('无法还原字段名');
        expect(output.fields).toEqual([
            {
                field: 1,
                wireType: 2,
                offset: 0,
                type: 'length-delimited',
                length: 3,
                rawHex: '666f6f',
                valueType: 'string',
                value: 'foo',
            },
            {
                field: 2,
                wireType: 0,
                offset: 5,
                type: 'varint',
                value: 1,
            },
        ]);
    });

    it('Issue #614: 页面暴露 Proto Hex 入口并接入转换分支', () => {
        const html = readSource('apps/en-decode/index.html');
        const source = readSource('apps/en-decode/index.js');

        expect(html).toContain('<span class="encode-count">24 种</span>');
        expect(html).toContain('value="protobufHexDecode"');
        expect(html).toContain('Proto Hex解析');
        expect(html).toContain('Hex/ASCII解码');
        expect(source).toContain("this.selectedType === 'protobufHexDecode'");
        expect(source).toContain('EncodeUtils.protobufHexDecode(this.sourceContent)');
    });
});
