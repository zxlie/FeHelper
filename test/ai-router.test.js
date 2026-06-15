import { describe, expect, it } from 'vitest';
import {
    TOOL_CATALOG,
    analyzeDeveloperInput,
    buildAiRouterMessages,
    mergeRouterAnalysis,
    parseAiRouterResponse
} from '../apps/aiagent/fh.ai-router.js';

describe('AI tool router', () => {
    it('builds the router catalog from the full FeHelper tool map', () => {
        const toolKeys = TOOL_CATALOG.map(tool => tool.key);

        expect(TOOL_CATALOG.length).toBeGreaterThanOrEqual(30);
        expect(toolKeys).toContain('svg-converter');
        expect(toolKeys).toContain('websocket');
        expect(toolKeys).toContain('excel2json');
        expect(toolKeys).toContain('poster-maker');
        expect(toolKeys).toContain('datetime-calc');
    });

    it('routes valid JSON to the JSON tool first', () => {
        const analysis = analyzeDeveloperInput('{"ok":true,"items":[1,2,3]}');

        expect(analysis.inputType).toBe('json');
        expect(analysis.confidence).toBe('高');
        expect(analysis.primaryAction.toolKey).toBe('json-format');
        expect(analysis.primaryAction.taskKey).toBe('');
        expect(analysis.primaryAction.commandLabel).toBe('用 JSON 工具处理');
    });

    it('routes broken JSON to AI repair', () => {
        const analysis = analyzeDeveloperInput('{"ok":true,}');

        expect(analysis.inputType).toBe('broken-json');
        expect(analysis.primaryAction.toolKey).toBe('json-format');
        expect(analysis.primaryAction.taskKey).toBe('repair-json');
        expect(analysis.primaryAction.commandLabel).toBe('AI 修复 JSON');
    });

    it('routes JWT to the local decode tool', () => {
        const token = [
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
            'eyJzdWIiOiJ1XzEyMyIsImV4cCI6NDEwMjQ0NDgwMH0',
            'signature'
        ].join('.');
        const analysis = analyzeDeveloperInput(token);

        expect(analysis.inputType).toBe('jwt');
        expect(analysis.primaryAction.toolKey).toBe('en-decode');
        expect(analysis.actions.map(action => action.toolKey)).toContain('postman');
    });

    it('routes curl and HTTP snippets to Postman', () => {
        const analysis = analyzeDeveloperInput([
            'curl https://api.example.com/v1/users',
            '-H "Authorization: Bearer token"',
            '-H "Content-Type: application/json"',
            '-d \'{"name":"FeHelper"}\''
        ].join(' '));

        expect(analysis.inputType).toBe('api-debug');
        expect(analysis.primaryAction.toolKey).toBe('postman');
        expect(analysis.signals.join('\n')).toContain('HTTP');
    });

    it('routes cron expressions to crontab', () => {
        const analysis = analyzeDeveloperInput('*/15 9-18 * * 1-5');

        expect(analysis.inputType).toBe('cron');
        expect(analysis.primaryAction.toolKey).toBe('crontab');
    });

    it('routes image Base64 payloads to the image conversion tool', () => {
        const analysis = analyzeDeveloperInput('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB');

        expect(analysis.inputType).toBe('image-base64');
        expect(analysis.primaryAction.toolKey).toBe('image-base64');
    });

    it('routes WebSocket addresses to the WebSocket tool', () => {
        const analysis = analyzeDeveloperInput('wss://example.com/socket?token=dev');

        expect(analysis.inputType).toBe('websocket');
        expect(analysis.primaryAction.toolKey).toBe('websocket');
    });

    it('routes SVG snippets to the SVG converter', () => {
        const analysis = analyzeDeveloperInput('<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>');

        expect(analysis.inputType).toBe('svg');
        expect(analysis.primaryAction.toolKey).toBe('svg-converter');
    });

    it('routes delimited table data to Excel conversion and chart tools', () => {
        const analysis = analyzeDeveloperInput('name,age\nalice,18\nbob,20');
        const toolKeys = analysis.actions.map(action => action.toolKey);

        expect(analysis.inputType).toBe('table-data');
        expect(analysis.primaryAction.toolKey).toBe('excel2json');
        expect(toolKeys).toContain('chart-maker');
    });

    it('routes UUID values to the UUID/ID tool', () => {
        const analysis = analyzeDeveloperInput('550e8400-e29b-41d4-a716-446655440000');

        expect(analysis.inputType).toBe('uuid');
        expect(analysis.primaryAction.toolKey).toBe('uuid-gen');
        expect(analysis.actions[0].toolKey).toBe('uuid-gen');
    });

    it('routes short natural-language intents through tool keywords', () => {
        const analysis = analyzeDeveloperInput('我要做一张小红书海报');

        expect(analysis.inputType).toBe('intent:poster-maker');
        expect(analysis.primaryAction.toolKey).toBe('poster-maker');
    });

    it('builds strict router messages for Gemini Nano', () => {
        const local = analyzeDeveloperInput('{"ok":true}');
        const messages = buildAiRouterMessages('{"ok":true}', local);

        expect(messages).toHaveLength(2);
        expect(messages[0].content).toContain('AI Tool Router');
        expect(messages[0].content).toContain('只输出一个 JSON 对象');
        expect(messages[1].content).toContain('FeHelper 完整工具目录');
        expect(messages[1].content).toContain('svg-converter');
        expect(messages[1].content).toContain('excel2json');
        expect(messages[1].content).toContain('poster-maker');
        expect(messages[1].content).toContain('FeHelper 本地预判');
    });

    it('parses and merges AI router JSON responses', () => {
        const local = analyzeDeveloperInput('1700000000000');
        const ai = parseAiRouterResponse([
            '```json',
            JSON.stringify({
                inputType: 'time',
                confidence: '高',
                score: 91,
                summary: '识别为毫秒时间戳。',
                signals: ['13 位数字'],
                actions: [{
                    toolKey: 'timestamp',
                    taskKey: 'parse-time',
                    reason: '需要确认时区。',
                    priority: 99
                }]
            }),
            '```'
        ].join('\n'));
        const merged = mergeRouterAnalysis(local, ai);

        expect(ai.actions[0].toolKey).toBe('timestamp');
        expect(merged.refinedByAi).toBe(true);
        expect(merged.primaryAction.toolKey).toBe('timestamp');
        expect(merged.summary).toBe('识别为毫秒时间戳。');
    });
});
