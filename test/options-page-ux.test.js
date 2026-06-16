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

    it('allows search, category, and user view filters to stay combined', () => {
        const optionsSource = readSource('apps/options/index.js');
        const optionsHtml = readSource('apps/options/index.html');
        const handleCategory = sourceBetween(optionsSource, 'handleCategoryChange(category) {', 'handleSort()');
        const showInstalled = sourceBetween(optionsSource, 'async showMyInstalled() {', 'showMyFavorites()');
        const showFavorites = sourceBetween(optionsSource, 'showMyFavorites() {', '// 重置工具列表到原始状态');
        const showRecent = sourceBetween(optionsSource, 'async showRecentUsed() {', 'handleRecommendClick(card)');

        [handleCategory, showInstalled, showFavorites, showRecent].forEach(block => {
            expect(block).not.toContain("this.searchKey = ''");
            expect(block).not.toContain("this.currentCategory = ''");
        });
        expect(handleCategory).not.toContain("this.currentView = 'all'");
        expect(optionsSource).toContain('hasActiveFilter()');
        expect(optionsHtml).toContain('class="fh-clear-filter"');
        expect(optionsHtml).toContain('v-if="hasActiveFilter"');
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
