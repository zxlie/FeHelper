(function () {
    var root = document.documentElement;
    var pendingAttr = 'data-fh-theme-pending';
    var autoKey = 'AUTO_DARK_MODE';
    var alwaysKey = 'ALWAYS_DARK_MODE';

    function isEnabledSetting(value) {
        return value === true || value === 'true';
    }

    function getLocalSetting(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    function setLocalSetting(key, value) {
        try {
            if (value !== undefined && value !== null) {
                localStorage.setItem(key, value);
            }
        } catch (e) {}
    }

    function prefersColorSchemeDark() {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        } catch (e) {
            return false;
        }
    }

    function shouldEnableDarkMode(settings) {
        if (isEnabledSetting(settings[alwaysKey])) {
            return true;
        }
        if (!isEnabledSetting(settings[autoKey])) {
            return false;
        }
        return prefersColorSchemeDark();
    }

    function applyTheme(settings) {
        var enabled = shouldEnableDarkMode(settings);
        root.setAttribute('dark-mode', enabled ? 'on' : 'off');
        root.setAttribute('data-theme', enabled ? 'dark' : 'light');
    }

    function finish(settings) {
        settings = settings || {};
        applyTheme(settings);
        root.removeAttribute(pendingAttr);
    }

    var localSettings = {};
    localSettings[autoKey] = getLocalSetting(autoKey);
    localSettings[alwaysKey] = getLocalSetting(alwaysKey);

    if (localSettings[autoKey] !== null || localSettings[alwaysKey] !== null) {
        finish(localSettings);
        return;
    }

    root.setAttribute(pendingAttr, 'true');

    if (
        typeof chrome === 'undefined' ||
        !chrome.storage ||
        !chrome.storage.local ||
        !chrome.storage.local.get
    ) {
        finish(localSettings);
        return;
    }

    var resolved = false;
    var resolve = function (settings) {
        if (resolved) {
            return;
        }
        resolved = true;
        settings = settings || {};
        setLocalSetting(autoKey, settings[autoKey]);
        setLocalSetting(alwaysKey, settings[alwaysKey]);
        finish(settings);
    };

    try {
        chrome.storage.local.get([autoKey, alwaysKey], resolve);
        window.setTimeout(function () {
            resolve(localSettings);
        }, 500);
    } catch (e) {
        resolve(localSettings);
    }
})();
