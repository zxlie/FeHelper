/**
 * 用于content-script注入的脚本
 */
window.pagemonkeyContentScript = function () {
    chrome.runtime.sendMessage({
        type: 'fh-dynamic-any-thing',
        thing: 'request-monkey-start',
        params: {
            url: location.href,
            tabId: window.__FH_TAB_ID__
        }
    });
};
