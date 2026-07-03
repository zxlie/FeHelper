import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function readSource(file) {
    return fs.readFileSync(path.resolve(file), 'utf8');
}

describe('popup open regressions', () => {
    it('Issue #612: popup defers non-critical startup work after first render', () => {
        const source = readSource('apps/popup/index.js');
        const createdIndex = source.indexOf('created: function ()');
        const mountedIndex = source.indexOf('mounted: function ()');

        expect(createdIndex).toBeGreaterThan(-1);
        expect(mountedIndex).toBeGreaterThan(createdIndex);
        expect(source.slice(createdIndex, mountedIndex)).toContain('this.loadTools();');
        expect(source.slice(createdIndex, mountedIndex)).not.toContain('fh-popup-opened');
        expect(source.slice(createdIndex, mountedIndex)).not.toContain('loadPatchHotfix');
        expect(source).toContain('deferNonCriticalStartup()');
        expect(source).toContain('this.deferTask(() => this.notifyPopupOpened(), 120);');
        expect(source).toContain('this.deferTask(() => this.loadPatchHotfix(), 450);');
        expect(source).toContain('this.deferTask(() => this.recordUsage(), 650);');
        expect(source).toContain('Awesome.collectAndSendClientInfo();');
        expect(source).toContain('Promise.all([\n                    Awesome.getInstalledTools(),');
    });

    it('Issue #609: popup click path handles background failures and does not wait for recent tool storage', () => {
        const popup = readSource('apps/popup/index.js');
        const background = readSource('apps/background/background.js');

        expect(popup).toContain('this.rememberTool(toolName).catch(error => {');
        expect(popup).toContain('const response = await chrome.runtime.sendMessage(request);');
        expect(popup).toContain('if (response && response.ok === false) {');
        expect(popup).toContain("throw new Error(response.error || '后台未能打开工具页面');");
        expect(popup).toContain('await chrome.tabs.create({');
        expect(background).toContain('FeHelperBg.DynamicToolRunner = async function (configs)');
        expect(background).toContain("return {ok: false, error: '工具配置无效'}");
        expect(background).toContain('return {ok: true, action: \'create\', tabId: tab && tab.id};');
        expect(background).toContain('return {ok: false, error};');
        expect(background).toContain('callback && callback(result || {ok: true});');
        expect(background).toContain('return true;');
    });
});
