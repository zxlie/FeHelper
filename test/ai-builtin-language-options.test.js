import { afterEach, describe, expect, it, vi } from 'vitest';
import AI from '../apps/aiagent/fh.ai.js';

function withNavigatorLanguage(language, callback) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: { language }
    });

    try {
        return callback();
    } finally {
        if (descriptor) {
            Object.defineProperty(globalThis, 'navigator', descriptor);
        } else {
            delete globalThis.navigator;
        }
    }
}

function installLanguageModelMock(sessionOverrides = {}) {
    const session = {
        destroy: vi.fn(),
        promptStreaming: vi.fn(() => (async function* () {
            yield 'ok';
        })()),
        ...sessionOverrides
    };
    const availability = vi.fn(async () => 'available');
    const create = vi.fn(async () => session);

    globalThis.LanguageModel = {
        availability,
        create
    };

    return { availability, create, session };
}

describe('Chrome built-in AI language options', () => {
    afterEach(() => {
        delete globalThis.LanguageModel;
        vi.restoreAllMocks();
    });

    it('declares expected text input and output languages', () => {
        withNavigatorLanguage('zh-CN', () => {
            expect(AI.getBuiltInTextLanguageOptions()).toEqual({
                expectedInputs: [
                    { type: 'text', languages: ['en', 'ja', 'es'] }
                ],
                expectedOutputs: [
                    { type: 'text', languages: ['en'] }
                ]
            });
        });
    });

    it('uses a supported browser language when possible', () => {
        withNavigatorLanguage('ja-JP', () => {
            expect(AI.getBuiltInTextLanguageOptions().expectedOutputs).toEqual([
                { type: 'text', languages: ['ja'] }
            ]);
        });
    });

    it('checks availability with the same language options', async () => {
        const { availability } = installLanguageModelMock();

        await AI.getBuiltInAvailability();

        expect(availability).toHaveBeenCalledWith(AI.getBuiltInTextLanguageOptions());
    });

    it('creates built-in sessions with expected output languages', async () => {
        const { create, session } = installLanguageModelMock();

        await AI.askCoderLLM('hello', vi.fn(), null, 'builtin');

        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            expectedInputs: [
                { type: 'text', languages: ['en', 'ja', 'es'] }
            ],
            expectedOutputs: [
                { type: 'text', languages: ['en'] }
            ],
            initialPrompts: [
                expect.objectContaining({ role: 'system' })
            ],
            monitor: expect.any(Function)
        }));
        expect(session.promptStreaming).toHaveBeenCalledWith([
            { role: 'user', content: 'hello' }
        ]);
        expect(session.destroy).toHaveBeenCalled();
    });
});
