import fs from 'node:fs';
import vm from 'node:vm';
import {describe, expect, it, vi} from 'vitest';

function bootWorker(tools) {
    let listener;
    const timers = [];
    const onClicked = {
        addListener: vi.fn(fn => { listener = fn; }),
        removeListener: vi.fn(() => { listener = undefined; }),
        hasListener: fn => listener === fn
    };
    const sandbox = {
        chrome: {
            action: {onClicked, setPopup: vi.fn()},
            alarms: {onAlarm: {addListener: vi.fn()}},
            runtime: {onMessage: {addListener: vi.fn()}}
        },
        Awesome: {getInstalledTools: vi.fn(async () => tools)},
        Statistics: {recordToolUsage: vi.fn()},
        MSG_TYPE: {JSON_FORMAT: 'json-format'},
        console, setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {}
    };
    const source = fs.readFileSync(process.env.BACKGROUND_SOURCE || 'apps/background/background.js','utf8')
        .replace(/^import[\s\S]*?;\s*$/gm, '')
        .replace('BgPageInstance.init();', '')
        .replace('globalThis.FeHelperBg = FeHelperBg;', 'globalThis.FeHelperBg = FeHelperBg; globalThis.updateAction = _updateBrowserAction;');
    vm.runInNewContext(source, sandbox);
    sandbox.FeHelperBg.DynamicToolRunner = vi.fn();
    return {sandbox, onClicked, timers, click: () => listener?.()};
}

describe('#664 service-worker cold action wakeup', () => {
    it('registers the action click before asynchronous startup and opens the single tool', async () => {
        const worker = bootWorker({timestamp: {installed:true}});
        expect(worker.onClicked.addListener).toHaveBeenCalledTimes(1);
        expect(worker.sandbox.Awesome.getInstalledTools).not.toHaveBeenCalled();
        worker.click();
        await Promise.resolve();
        expect(worker.sandbox.FeHelperBg.DynamicToolRunner).toHaveBeenCalledWith({tool:'timestamp',noPage:false});
    });
    it('keeps the wakeup listener registered when the popup switches between one and multiple tools', async () => {
        const worker=bootWorker({timestamp:{installed:true},'json-format':{installed:true}});
        worker.sandbox.updateAction();
        worker.timers[0]();
        await Promise.resolve();
        expect(worker.sandbox.chrome.action.setPopup).toHaveBeenCalledWith({popup:'/popup/index.html'});
        expect(worker.onClicked.removeListener).not.toHaveBeenCalled();
        expect(worker.onClicked.addListener).toHaveBeenCalledTimes(1);
    });
});
