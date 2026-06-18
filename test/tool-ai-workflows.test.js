import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');

function readSource(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

describe('tool-level AI workflows', () => {
    it('adds an explain-code workflow to code beautify without rewriting whole files', () => {
        const html = readSource('apps/code-beautify/index.html');
        const source = readSource('apps/code-beautify/index.js');
        const features = readSource('apps/aiagent/fh.ai-features.js');

        expect(html).toContain('AI 解释代码');
        expect(html).toContain('@click="askAiForCode"');
        expect(html).toContain('class="fh-inline-ai-panel"');
        expect(html).not.toContain('AI读代码');

        expect(source).toContain('getInlineAiTaskFromUrl');
        expect(source).toContain('getFormattedCodeForAi');
        expect(source).toContain('buildCodeAiMeta');
        expect(source).toContain("toolKey: 'code-beautify'");
        expect(source).toContain("taskKey: 'explain-code'");
        expect(source).toContain("title: 'AI 解释代码'");
        expect(source).toContain('解释格式化结果、风险点和可读性建议');
        expect(source).toContain('不要把用户引导到 AI 聊天页');
        expect(source).toContain('不要重写整段代码');
        expect(source).toContain('局部修正片段');
        expect(source).toContain('SQL 要关注条件、JOIN、排序和潜在性能');
        expect(source).toContain('JavaScript 要关注副作用、异常和兼容性');
        expect(source).toContain("任务: '解释意图、风险点和局部修正建议'");

        expect(features).toContain("toolKey: 'code-beautify'");
        expect(features).toContain("entryTask: 'explain-code'");
        expect(features).toContain('不默认重写整段代码');
        expect(features).toContain('SQL 关注条件、JOIN、排序和潜在性能');
    });

    it('keeps en-decode AI grounded in local detection and applicable results', () => {
        const html = readSource('apps/en-decode/index.html');
        const source = readSource('apps/en-decode/index.js');
        const features = readSource('apps/aiagent/fh.ai-features.js');

        expect(html).toContain('value="AI解码"');
        expect(html).toContain('@click="askAiForEncode()"');
        expect(html).toContain('class="fh-inline-ai-panel"');

        expect(source).toContain('analyzeDecodeInput');
        expect(source).toContain("taskKey: 'smart-decode'");
        expect(source).toContain('preserveInitialResultOnError: true');
        expect(source).toContain('fallbackStatusText: \'AI 暂不可用，已保留本地自动解码结果\'');
        expect(source).toContain('必须明确 MD5、SHA1 只能校验不能解密');
        expect(source).toContain("applyLabel: '应用最佳结果'");
        expect(source).toContain('this.aiBestCandidate = analysis.bestCandidate');
        expect(source).toContain('本地候选数: analysis.candidates.length');

        expect(features).toContain("toolKey: 'en-decode'");
        expect(features).toContain("entryTask: 'smart-decode'");
        expect(features).toContain('自动尝试 URL、Base64、Unicode、HTML 实体、字符串转义、Hex、Gzip、JWT、Cookie、URL 参数');
        expect(features).toContain('MD5、SHA1 等哈希不可逆');
    });

    it('keeps Postman AI scoped to request and response diagnostics', () => {
        const html = readSource('apps/postman/index.html');
        const source = readSource('apps/postman/index.js');
        const features = readSource('apps/aiagent/fh.ai-features.js');

        expect(html).toContain('value="AI辅助调试"');
        expect(html).toContain('value="诊断响应"');
        expect(html).toContain('@click="askAiForRequest()"');
        expect(html).toContain('@click="askAiForPostman()"');

        expect(source).toContain('buildAiRequestInfo');
        expect(source).toContain('buildAiResponseInfo');
        expect(source).toContain("taskKey: 'assist-debug'");
        expect(source).toContain("taskKey: 'diagnose-response'");
        expect(source).toContain('必须检查：URL/查询参数、HTTP 方法、Headers、Content-Type、Body 格式、鉴权信息、CORS 可能性、Mock Server 适用性。');
        expect(source).toContain('如果没有响应，不要编造服务端返回');
        expect(source).toContain('JSON 解析错误');
        expect(source).toContain('curl 或 fetch 示例');
        expect(source).toContain('当前任务只提供接口建议，不自动修改请求');

        expect(features).toContain("toolKey: 'postman'");
        expect(features).toContain("entryTask: 'assist-debug'");
        expect(features).toContain('诊断响应，结合状态码、响应头、响应体和 JSON 解析错误定位问题');
        expect(features).toContain('不凭空假设后端返回');
    });
});
