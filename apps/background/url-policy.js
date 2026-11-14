const INJECTABLE_TAB_URL_PATTERN = /^(http(s)?|file):\/\//;

const INJECTION_URL_BLACKLIST = [
    /^https:\/\/chrome\.google\.com/,
    /^https:\/\/chromewebstore\.google\.com/
];

// Firefox blocks content scripts here even when all host permissions are granted.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#restricted_domains
const FIREFOX_RESTRICTED_HOSTS = new Set([
    'accounts-static.cdn.mozilla.net',
    'accounts.firefox.com',
    'addons.cdn.mozilla.net',
    'addons.mozilla.org',
    'api.accounts.firefox.com',
    'content.cdn.mozilla.net',
    'discovery.addons.mozilla.org',
    'install.mozilla.org',
    'oauth.accounts.firefox.com',
    'profile.accounts.firefox.com',
    'support.mozilla.org',
    'sync.services.mozilla.com'
]);

function normalizeUrl(url) {
    return String(url || '');
}

export function isInjectableTabUrl(url) {
    const normalizedUrl = normalizeUrl(url);
    if (!INJECTABLE_TAB_URL_PATTERN.test(normalizedUrl)
            || INJECTION_URL_BLACKLIST.some(reg => reg.test(normalizedUrl))) {
        return false;
    }
    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox/')) {
        try {
            return !FIREFOX_RESTRICTED_HOSTS.has(new URL(normalizedUrl).hostname);
        } catch {
            return false;
        }
    }
    return true;
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
