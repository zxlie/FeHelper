import fs from 'node:fs';
import vm from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AI from '../apps/aiagent/fh.ai.js';

function model(status = 'downloadable', active = true) {
    vi.stubGlobal('navigator', { userActivation: { isActive: active } });
    const session = { prompt: vi.fn(async () => 'ok'), destroy: vi.fn() };
    const api = { availability: vi.fn(async () => status), create: vi.fn(async () => session) };
    vi.stubGlobal('LanguageModel', api);
    return { ...api, session };
}
function pageOptions() {
    let options;
    const context = vm.createContext({
        Vue: function(value) { options = value; }, URL,
        location: { href: 'chrome-extension://test/aiagent/index.html?prompt=hello&autoSend=1' },
        getAiFeaturePack: () => null
    });
    vm.runInContext(fs.readFileSync('apps/aiagent/index.js', 'utf8').replace(/^import .*$/gm, ''), context);
    return options;
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('#680 explicit model download consent', () => {
    it.each(['downloadable', 'downloading', 'available'])('status checks never create a session (%s)', async status => {
        const api = model(status, false);
        expect((await AI.getBuiltInAvailability()).availability).toBe(status);
        expect(api.create).not.toHaveBeenCalled();
    });
    it.each(['downloadable', 'available'])('blocks background or restored-page requests (%s)', async status => {
        const api = model(status, false);
        await expect(AI.askCoderLLM('hello', null, null, 'builtin')).rejects.toThrow(/点击/);
        await expect(AI.prepareBuiltInModel()).rejects.toThrow(/点击/);
        expect(api.create).not.toHaveBeenCalled();
    });
    it.each(['downloadable', 'downloading'])('sending alone does not consent to download (%s)', async status => {
        const api = model(status);
        await expect(AI.askCoderLLM('hello', null, null, 'builtin')).rejects.toThrow(/下载/);
        expect(api.create).not.toHaveBeenCalled();
    });
    it('allows a deliberate download and forwards cancellation to Chrome', async () => {
        const api = model();
        const controller = new AbortController();
        await AI.prepareBuiltInModel(null, { signal: controller.signal });
        expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ signal: controller.signal }));
        expect(api.session.destroy).toHaveBeenCalledOnce();
    });
    it('does not create a session after cancellation during the status check', async () => {
        const api = model();
        const controller = new AbortController();
        api.availability.mockImplementation(async () => { controller.abort(); return 'downloadable'; });
        await expect(AI.prepareBuiltInModel(null, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
        expect(api.create).not.toHaveBeenCalled();
    });
    it('discards and destroys a session if Chrome resolves after cancellation', async () => {
        const api = model();
        const callback = vi.fn();
        const controller = new AbortController();
        api.create.mockImplementation(async () => { controller.abort(); return api.session; });
        await expect(AI.askCoderLLM('hello', callback, null, 'builtin', {
            allowDownload: true, signal: controller.signal
        })).rejects.toMatchObject({ name: 'AbortError' });
        expect(api.session.prompt).not.toHaveBeenCalled();
        expect(api.session.destroy).toHaveBeenCalledOnce();
        expect(callback).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'available' }));
    });
    it('cancels a pending Chrome create request without reporting success', async () => {
        const api = model();
        const callback = vi.fn();
        const controller = new AbortController();
        let started;
        const pending = new Promise(resolve => { started = resolve; });
        api.create.mockImplementation(({ signal }) => new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
            started();
        }));
        const request = AI.prepareBuiltInModel(callback, { signal: controller.signal });
        const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
        await pending;
        controller.abort();
        await rejected;
        expect(callback).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'available' }));
    });
    it('restores a URL prompt as a draft, never auto-sends it', async () => {
        const options = pageOptions();
        const page = { initialPromptApplied: false, sendMessage: vi.fn(), $nextTick: fn => fn() };
        await options.methods.applyInitialPromptFromQuery.call(page);
        expect(page.prompt).toBe('hello');
        expect(page.sendMessage).not.toHaveBeenCalled();
    });
});

function marketPage() {
    let options;
    const context = vm.createContext({
        Vue: function(value) { options = value; }, AI, AI_FEATURE_PACKS: [],
        AbortController, window: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
        chrome: { storage: { local: { set: vi.fn() } } }
    });
    vm.runInContext(fs.readFileSync('apps/options/index.js', 'utf8').replace(/^import .*$/gm, ''), context);
    return { ...options.data, ...options.methods, showInPageNotification: vi.fn() };
}

describe('#680 download UI lifecycle', () => {
    it('keeps a startup check observational even when Chrome is already downloading', async () => {
        const api = model('downloading', false);
        const page = marketPage();
        await page.checkBuiltInAiStatus();
        expect(api.create).not.toHaveBeenCalled();
        expect(page.aiModelController).toBeNull();
        expect(page.aiModelMessage).toContain('未发起下载');
    });
    it('aborts via the cancel action and ignores late completion while a retry runs', async () => {
        model();
        const page = marketPage();
        page.aiModelStatus = 'downloadable';
        const attempts = [];
        vi.spyOn(AI, 'prepareBuiltInModel').mockImplementation((callback, options) =>
            new Promise(resolve => attempts.push({ callback, signal: options.signal, resolve })));
        const first = page.prepareBuiltInAiModel();
        page.cancelBuiltInAiModel();
        expect(attempts[0].signal.aborted).toBe(true);
        expect(page.aiModelBusy).toBe(false);
        expect(page.aiModelStatus).toBe('cancelled');
        const second = page.prepareBuiltInAiModel();
        attempts[0].callback({ provider: 'builtin', status: 'available' });
        attempts[0].resolve();
        await first;
        expect(page.aiModelBusy).toBe(true);
        expect(page.aiModelController.signal).toBe(attempts[1].signal);
        expect(page.showInPageNotification).not.toHaveBeenCalled();
        attempts[1].resolve();
        await second;
        expect(page.aiModelStatus).toBe('available');
        expect(page.aiModelBusy).toBe(false);
    });
    it('defaults chat download permission to off on every page instance', () => {
        expect(pageOptions().data.aiAllowDownload).toBe(false);
    });
    it('creates a chat session only after both active intent and download consent', async () => {
        const api = model();
        await AI.askCoderLLM('hello', null, null, 'builtin', { allowDownload: true });
        expect(api.create).toHaveBeenCalledOnce();
        expect(api.session.prompt).toHaveBeenCalledOnce();
        expect(api.session.destroy).toHaveBeenCalledOnce();
    });
});
