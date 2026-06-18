import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

function readSource(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function sourceBetween(source, startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    return source.slice(start, end);
}

describe('options page UX policy', () => {
    it('does not expose fake hot or newest sorting without real data', () => {
        const optionsHtml = readSource('apps/options/index.html');
        const optionsSource = readSource('apps/options/index.js');
        const sortSelect = sourceBetween(optionsHtml, 'aria-label="选择排序方式"', '</select>');
        const sortBlock = sourceBetween(optionsSource, 'switch (this.sortType)', 'return result;');
        const toolDataBlock = sourceBetween(optionsSource, 'processedTools[key] = {', '};');

        expect(sortSelect).toContain('value="default"');
        expect(sortSelect).toContain('value="name"');
        expect(sortSelect).not.toContain('value="hot"');
        expect(sortSelect).not.toContain('value="newest"');
        expect(sortBlock).toContain("case 'name':");
        expect(sortBlock).toContain('localeCompare');
        expect(toolDataBlock).not.toContain('updateTime');
    });

    it('keeps the options page responsive on narrow screens', () => {
        const optionsHtml = readSource('apps/options/index.html');

        expect(optionsHtml).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    });

    it('frames the options page as a control console, not only a marketplace', () => {
        const optionsHtml = readSource('apps/options/index.html');

        expect(optionsHtml).toContain('<title>FeHelper-控制台</title>');
        expect(optionsHtml).toContain("{{ uiMode === 'lite' ? 'FeHelper Lite 控制台' : 'FeHelper 控制台' }}");
        expect(optionsHtml).toContain('统一管理 popup、右键菜单、外观和权限');
        expect(optionsHtml).toContain("['fh-workspace-grid', uiMode === 'lite' ? 'is-lite' : 'is-omni']");
        expect(optionsHtml).toContain('class="fh-context-rail" v-if="uiMode === \'omni\'"');
        expect(optionsHtml.indexOf('class="fh-tools-panel"')).toBeLessThan(optionsHtml.indexOf('class="fh-context-rail" v-if="uiMode === \'omni\'"'));
    });

    it('allows search, category, and user view filters to stay combined', () => {
        const optionsSource = readSource('apps/options/index.js');
        const optionsHtml = readSource('apps/options/index.html');
        const handleCategory = sourceBetween(optionsSource, 'handleCategoryChange(category) {', 'handleSort()');
        const showInstalled = sourceBetween(optionsSource, 'async showMyInstalled() {', 'showMyFavorites()');
        const showFavorites = sourceBetween(optionsSource, 'showMyFavorites() {', '// 重置工具列表到原始状态');
        const showRecent = sourceBetween(optionsSource, 'async showRecentUsed() {', 'handleRecommendClick(card)');
        const categoryWatcher = sourceBetween(optionsSource, 'currentCategory: {', 'selectedOpts:');

        [handleCategory, showInstalled, showFavorites, showRecent, categoryWatcher].forEach(block => {
            expect(block).not.toContain("this.searchKey = ''");
            expect(block).not.toContain("this.currentCategory = ''");
        });
        expect(handleCategory).not.toContain("this.currentView = 'all'");
        expect(optionsSource).toContain('hasActiveFilter()');
        expect(optionsHtml).toContain('class="fh-clear-filter"');
        expect(optionsHtml).toContain('v-if="hasActiveFilter"');
    });

    it('keeps AI console actions distinct and status copy concise', () => {
        const optionsSource = readSource('apps/options/index.js');
        const optionsHtml = readSource('apps/options/index.html');
        const primaryActionVisibility = sourceBetween(optionsSource, 'showAiPrimaryAction() {', 'aiRefreshActionLabel()');
        const statusCardTitle = sourceBetween(optionsSource, 'aiStatusCardTitle() {', 'aiPanelTitle()');

        expect(optionsHtml).toContain('v-if="showAiPrimaryAction"');
        expect(primaryActionVisibility).toContain("return this.aiModelStatus !== 'available';");
        expect(optionsSource).not.toContain('打开 JSON 修复');
        expect(optionsSource).not.toContain('openPrimaryAiFeature');
        expect(optionsHtml).toContain('@click="checkBuiltInAiStatus({ notify: true })"');
        expect(optionsHtml).toContain('{{aiRefreshActionLabel}}');
        expect(optionsHtml).toContain('{{aiStatusCardTitle}}');
        expect(optionsHtml).not.toContain('{{aiStatusLabel}}');
        expect(statusCardTitle).toContain("return 'Gemini Nano 已可用';");
        expect(statusCardTitle).not.toContain('建议优先使用 FeHelper AI');
    });

    it('lets users hide and restore the popup AI router', () => {
        const popupHtml = readSource('apps/popup/index.html');
        const popupSource = readSource('apps/popup/index.js');
        const optionsSource = readSource('apps/options/index.js');
        const optionsHtml = readSource('apps/options/index.html');
        const settingsSource = readSource('apps/options/settings.js');
        const popupControls = sourceBetween(popupHtml, 'class="fh-ai-router-controls"', '</div>');
        const routerVisibility = sourceBetween(popupSource, 'shouldShowAiRouter() {', 'aiRouterStatusText()');
        const saveSettingsBlock = sourceBetween(optionsSource, '// 构建设置对象', 'opts = this.normalizeDarkModeOptions(opts);');

        expect(popupControls).not.toContain('inspectSearchInput');
        expect(popupControls).toContain('@click="inspectClipboard"');
        expect(popupControls).toContain('@click="disableAiRouter"');
        expect(popupControls).toContain('禁用');
        expect(popupSource).toContain("const POPUP_AI_ROUTER_ENABLED = 'POPUP_AI_ROUTER_ENABLED';");
        expect(popupSource).toContain("[POPUP_AI_ROUTER_ENABLED]: 'false'");
        expect(routerVisibility).toContain('this.popupAiRouterReady');
        expect(routerVisibility).toContain('this.popupAiRouterEnabled');
        expect(routerVisibility).toContain("this.aiRouter.modelStatus === 'available'");
        expect(routerVisibility).toContain('this.isAiAssistantEnabled');
        expect(optionsHtml).toContain('id="POPUP_AI_ROUTER_ENABLED"');
        expect(optionsHtml).toContain('在 popup 显示智能识别');
        expect(settingsSource).toContain("'POPUP_AI_ROUTER_ENABLED': true");
        expect(saveSettingsBlock).toContain("'POPUP_AI_ROUTER_ENABLED'");
    });

    it('gives modal dialogs semantic roles and keyboard handling', () => {
        const optionsHtml = readSource('apps/options/index.html');
        const optionsSource = readSource('apps/options/index.js');

        expect(optionsHtml.match(/role="dialog"/g)).toHaveLength(3);
        expect(optionsHtml.match(/aria-modal="true"/g)).toHaveLength(3);
        expect(optionsHtml).toContain('@keydown="handleModalKeydown($event, \'settings\')"');
        expect(optionsHtml).toContain('@keydown="handleModalKeydown($event, \'donate\')"');
        expect(optionsHtml).toContain('@keydown="handleModalKeydown($event, \'confirm\')"');
        expect(optionsSource).toContain('focusModal(refName)');
        expect(optionsSource).toContain('handleModalKeydown(event, modalType)');
        expect(optionsSource).toContain("event.key === 'Escape'");
        expect(optionsSource).toContain("event.key !== 'Tab'");
    });
});
