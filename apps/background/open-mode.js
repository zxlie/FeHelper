const POPUP_WINDOW_OPTION = 'OPEN_TOOL_IN_POPUP_WINDOW';
const REUSE_TAB_OPTION = 'FORBID_OPEN_IN_NEW_TAB';

function optionEnabled(value) {
    return value === true || String(value).toLowerCase() === 'true' || value === '1';
}

function shouldOpenToolInPopup(configs = {}, opts = {}) {
    if (configs.noPage) return false;
    if (configs.openMode) {
        return configs.openMode === 'popup' || configs.openMode === 'window';
    }
    return optionEnabled(opts[POPUP_WINDOW_OPTION]);
}

function shouldReuseExistingToolTab(opts = {}) {
    return optionEnabled(opts[REUSE_TAB_OPTION]);
}

function buildToolUrl(tool, query) {
    return `/${tool}/index.html` + (query ? `?${query}` : '');
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildToolUrlPattern(tool, query) {
    return new RegExp(
        '^chrome.*\\/' + escapeRegExp(tool) + '\\/index\\.html' +
        (query ? '\\?' + escapeRegExp(query) : '') + '$',
        'i'
    );
}

function buildPopupWindowOptions(url) {
    return {
        url,
        type: 'popup',
        focused: true,
        width: 1120,
        height: 760
    };
}

function buildToolTabOptions(url, activeTab) {
    const options = {url, active: true};
    if (activeTab && Number.isInteger(activeTab.index) && activeTab.index >= 0) {
        options.index = activeTab.index + 1;
        if (Number.isInteger(activeTab.windowId) && activeTab.windowId >= 0) {
            options.windowId = activeTab.windowId;
        }
    }
    return options;
}

async function resolveCreatedWindowTab(createdWindow, queryTabs) {
    const includedTab = createdWindow && createdWindow.tabs && createdWindow.tabs[0];
    if (includedTab && includedTab.id != null) {
        return includedTab;
    }
    if (!createdWindow || createdWindow.id == null || typeof queryTabs !== 'function') {
        return null;
    }
    const tabs = await queryTabs({windowId: createdWindow.id});
    return tabs.find(tab => tab.active) || tabs[0] || null;
}

export {
    POPUP_WINDOW_OPTION,
    REUSE_TAB_OPTION,
    buildPopupWindowOptions,
    buildToolTabOptions,
    buildToolUrl,
    buildToolUrlPattern,
    resolveCreatedWindowTab,
    optionEnabled,
    shouldOpenToolInPopup,
    shouldReuseExistingToolTab
};
