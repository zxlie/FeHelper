/* global CustomEvent */
/** These functions are serialized into page worlds: keep them self-contained. */
export function installUrlChangeHook() {
    if (window.__fhMonkeyUrlChangeHooked) return true;
    if (window.onurlchange !== undefined) return false;
    var previousUrl = window.location.href;
    var notify = function () {
        var url = window.location.href;
        if (url === previousUrl) return;
        previousUrl = url;
        // A string detail crosses MAIN/ISOLATED worlds without object wrappers.
        window.dispatchEvent(new CustomEvent('urlchange', { detail: url }));
    };
    ['pushState', 'replaceState'].forEach(function (name) {
        var original = window.history[name];
        window.history[name] = function () {
            var result = original.apply(this, arguments);
            notify();
            return result;
        };
    });
    window.addEventListener('popstate', notify);
    window.addEventListener('hashchange', notify);
    window.__fhMonkeyUrlChangeHooked = true;
    return true;
}

export function installUrlChangeListener() {
    // Respect an existing provider (e.g. Tampermonkey), and install once per world.
    if (window.onurlchange !== undefined || window.__fhMonkeyUrlChangeListener) return;
    window.onurlchange = null;
    window.__fhMonkeyUrlChangeListener = true;
    window.addEventListener('urlchange', function (event) {
        if (typeof event.detail !== 'string' || event.detail !== window.location.href) return;
        // Set the convenience property on this world's event wrapper.
        event.url = event.detail;
        if (typeof window.onurlchange === 'function') window.onurlchange.call(window, event);
    }, true);
}
