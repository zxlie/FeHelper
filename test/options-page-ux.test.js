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
        const optionsCss = readSource('apps/options/index.css');
        const optionsSource = readSource('apps/options/index.js');

        expect(optionsHtml).toContain('<title>FeHelper-控制台</title>');
        expect(optionsHtml).toContain("{{ uiMode === 'lite' ? 'Lite 控制台' : '开发者工具控制台' }}");
        expect(optionsHtml).toContain("['fh-workspace-grid', uiMode === 'lite' ? 'is-lite' : 'is-omni']");
        expect(optionsHtml).toContain('class="fh-context-rail" v-if="uiMode === \'omni\'"');
        expect(optionsHtml).toContain('v-for="card in visibleRecommendationCards"');
        expect(optionsHtml).toContain('v-if="promoRecommendationCard"');
        expect(optionsHtml).toContain('合作入口');
        expect(optionsSource).toContain('visibleRecommendationCards()');
        expect(optionsSource).toContain('promoRecommendationCard()');
        expect(optionsCss).toContain('grid-template-columns: 248px minmax(0, 1fr);');
        expect(optionsCss).toContain('white-space: nowrap;');
        expect(optionsCss).toContain('@media (max-width: 720px)');
        expect(optionsCss).not.toContain('grid-template-columns: 228px minmax(0, 1fr);');
        expect(optionsHtml).not.toContain('class="fh-hero');
        expect(optionsHtml).not.toContain('fh-hero-stats');
        expect(optionsHtml).not.toContain('Extension console');
        expect(optionsHtml).not.toContain('Focused workspace');
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

    it('keeps the removed popup AI router out of popup and settings', () => {
        const popupHtml = readSource('apps/popup/index.html');
        const popupSource = readSource('apps/popup/index.js');
        const manifest = JSON.parse(readSource('apps/manifest.json'));
        const optionsSource = readSource('apps/options/index.js');
        const optionsHtml = readSource('apps/options/index.html');
        const settingsSource = readSource('apps/options/settings.js');
        const saveSettingsBlock = sourceBetween(optionsSource, '// 构建设置对象', 'opts = this.normalizeDarkModeOptions(opts);');

        expect(popupHtml).not.toContain('fh-ai-router');
        expect(popupHtml).not.toContain('智能识别');
        expect(popupHtml).not.toContain('剪贴板');
        expect(popupSource).not.toContain('aiRouter');
        expect(popupSource).not.toContain('POPUP_AI_ROUTER_ENABLED');
        expect(popupSource).not.toContain('navigator.clipboard');
        expect(manifest.permissions).not.toContain('clipboardRead');
        expect(optionsHtml).not.toContain('id="POPUP_AI_ROUTER_ENABLED"');
        expect(optionsHtml).not.toContain('在 popup 显示智能识别');
        expect(settingsSource).not.toContain("'POPUP_AI_ROUTER_ENABLED'");
        expect(saveSettingsBlock).not.toContain("'POPUP_AI_ROUTER_ENABLED'");
    });

    it('lets the lite popup shrink to its installed tool count', () => {
        const popupCss = readSource('apps/popup/index.css');
        const litePageSizing = sourceBetween(
            popupCss,
            'html.fh-popup-lite-mode,',
            'html[data-fh-theme-pending="true"]'
        );
        const liteShellSizing = sourceBetween(
            popupCss,
            '.fh-popup.is-lite-mode {',
            '.fh-popup.is-lite-mode .fh-header'
        );
        const liteListSizing = sourceBetween(
            popupCss,
            '.fh-popup.is-lite-mode .fh-command-list {',
            '.fh-popup.is-lite-mode .fh-command-list::-webkit-scrollbar'
        );

        expect(litePageSizing).toContain('min-height: 0;');
        expect(litePageSizing).toContain('height: auto;');
        expect(liteShellSizing).toContain('min-height: 0;');
        expect(liteShellSizing).not.toContain('100vh');
        expect(liteListSizing).toContain('flex: 0 1 auto;');
        expect(popupCss).not.toContain('.fh-popup.few-tools,\n.fh-popup.very-few-tools');
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

    it('states the actual sensitive-permission posture clearly', () => {
        const optionsHtml = readSource('apps/options/index.html');
        const optionsCss = readSource('apps/options/index.css');
        const privacyPolicy = readSource('website/privacy-policy.html');

        expect(optionsHtml).toContain('当前版本实际权限');
        expect(optionsHtml).toContain('不会申请的敏感权限');
        expect(optionsHtml).toContain('no history');
        expect(optionsHtml).toContain('no clipboardRead');
        expect(optionsCss).toContain('.setting-permission-tags');
        expect(optionsCss).toContain('.setting-copy code');
        expect(privacyPolicy).toContain('当前源码未声明 <code>history</code> 或 <code>clipboardRead</code>');
        expect(privacyPolicy).toContain('<code>tabs</code>');
        expect(privacyPolicy).toContain('<code>webNavigation</code>');
    });

    it('exposes the JSON auto-format key limit from the settings page', () => {
        const optionsHtml = readSource('apps/options/index.html');
        const optionsSource = readSource('apps/options/index.js');
        const optionsCss = readSource('apps/options/index.css');
        const contentScript = readSource('apps/json-format/content-script.js');

        expect(optionsHtml).toContain('JSON 自动格式化 Key 数上限');
        expect(optionsHtml).toContain('id="MAX_JSON_KEYS_NUMBER"');
        expect(optionsHtml).toContain('v-model.number="jsonFormatKeyLimit"');
        expect(optionsHtml).toContain('@change="normalizeJsonFormatKeyLimitInput"');
        expect(optionsSource).toContain("const JSON_FORMAT_KEY_LIMIT = 'MAX_JSON_KEYS_NUMBER';");
        expect(optionsSource).toContain('const DEFAULT_JSON_KEY_LIMIT = 10000;');
        expect(optionsSource).toContain('jsonFormatKeyLimit: DEFAULT_JSON_KEY_LIMIT');
        expect(optionsSource).toContain('loadJsonFormatSettings()');
        expect(optionsSource).toContain("thing: 'request-jsonformat-options'");
        expect(optionsSource).toContain('saveJsonFormatSettings()');
        expect(optionsSource).toContain("thing: 'save-jsonformat-options'");
        expect(optionsSource).toContain('await this.saveJsonFormatSettings();');
        expect(optionsCss).toContain('.setting-number-control');
        expect(contentScript).toContain('FeHelper设置页的「JSON 自动格式化 Key 数上限」');
    });
});
