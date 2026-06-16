const INJECTABLE_TAB_URL_PATTERN = /^(http(s)?|file):\/\//;

const INJECTION_URL_BLACKLIST = [
    /^https:\/\/chrome\.google\.com/,
    /^https:\/\/chromewebstore\.google\.com/
];

function normalizeUrl(url) {
    return String(url || '');
}

export function isInjectableTabUrl(url) {
    const normalizedUrl = normalizeUrl(url);
    return INJECTABLE_TAB_URL_PATTERN.test(normalizedUrl)
            && INJECTION_URL_BLACKLIST.every(reg => !reg.test(normalizedUrl));
}

export function getPopupWakeupTarget(tab) {
    const tabId = tab && tab.id;
    const url = tab && tab.url;

    if (!tabId) {
        return { ok: false, reason: 'missing_tab', url };
    }

    if (!isInjectableTabUrl(url)) {
        return { ok: false, reason: 'not_injectable', url };
    }

    return { ok: true, tabId, url };
}
