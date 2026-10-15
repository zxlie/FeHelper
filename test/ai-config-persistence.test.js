import fs from 'node:fs';
import vm from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AI from '../apps/aiagent/fh.ai.js';
import { createInlineAiState, runInlineToolAi } from '../apps/aiagent/fh.ai-inline.js';

function storage() {
    const data = {};
    vi.stubGlobal('chrome', { storage: { local: {
        get: (_keys, callback) => callback({ ...data }),
        set: (values, callback) => { Object.assign(data, values); callback?.(); }
    } } });
    return data;
}

function pageOptions(url) {
    let options;
    const context = vm.createContext({
        Vue: function (value) { options = value; },
        URL, location: { href: url },
        getAiFeaturePack: () => null
    });
    vm.runInContext(fs.readFileSync('apps/aiagent/index.js', 'utf8').replace(/^import .*$/gm, ''), context);
    return options;
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('global AI configuration persistence', () => {
    it('restores saved custom service after reopening a legacy builtin URL', async () => {
        storage();
        const expected = { provider: 'custom', apiKey: 'test-only', customUrl: 'https://example.invalid/v1/chat/completions', customModel: 'test-model' };
        await AI.saveConfig(expected);
        const cfg = await AI.getConfig();
        expect(cfg).toEqual(expected);
        const options = pageOptions('chrome-extension://test/aiagent/index.html?provider=builtin');
        const page = { initialPromptApplied: false, aiProvider: cfg.provider, providers: AI.PROVIDERS };
        await options.methods.applyInitialPromptFromQuery.call(page);
        expect(page.aiProvider).toBe('custom');
        expect(await AI.getConfig()).toEqual(expected);
    });

    it.each(['custom', 'siliconflow', 'builtin'])('inline tools follow the saved %s service and its privacy state', async provider => {
        storage();
        await AI.saveConfig({ provider, apiKey: 'test-only' });
        const ask = vi.spyOn(AI, 'askCoderLLM').mockImplementation(async (_messages, callback) => {
            callback({ content: 'result' });
            callback(null, true);
        });
        const state = createInlineAiState();
        await runInlineToolAi(state, { toolKey: 'json-format', input: '{}' });
        expect(ask.mock.calls[0][3]).toBe(provider);
        expect(state.localOnly).toBe(provider === 'builtin');
        expect(state.result).toBe('result');
        expect(state.loading).toBe(false);
    });

    it('opening AI and preparing the local model do not overwrite the chosen service', () => {
        const options = fs.readFileSync('apps/options/index.js', 'utf8');
        expect(options).not.toContain("params.set('provider', 'builtin')");
        expect(options).not.toContain("chrome.storage.local.set({ fh_ai_provider: 'builtin' })");
    });
});
