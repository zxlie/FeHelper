import Settings from '../options/settings.js';

export default (() => {

    let _execFunc = (tabId, allFrames, codeConfig, callback) => {
        let opts = {
            target: {tabId, allFrames},
            func: codeConfig.func,
            args: codeConfig.args || []
        };
        if (codeConfig.world) opts.world = codeConfig.world;
        chrome.scripting.executeScript(opts, function () {
            if (chrome.runtime.lastError) {
                console.warn('InjectTools._execFunc failed:', chrome.runtime.lastError);
            }
            callback && callback.apply(this, arguments);
        });
    };

    let _execJs = (tabId, allFrames, js, callback, world) => {
        let opts = {
            target: {tabId, allFrames},
            func: function(code){
                try {
                    new Function('window', 'document', 'globalThis', 'self', code)(window, document, window, window);
                } catch (e) {}
            },
            args: [js]
        };
        if (world) opts.world = world;
        chrome.scripting.executeScript(opts, function () {
            if (chrome.runtime.lastError) {
                console.warn('InjectTools._execJs failed:', chrome.runtime.lastError);
            }
            callback && callback.apply(this, arguments);
        });
    };

    /**
     * 如果tabId指定的tab还存在，就正常注入脚本
     * @param tabId 需要注入脚本的tabId
     * @param codeConfig 需要注入的代码，支持以下模式：
     *   - { files: [...] }                    注入文件
     *   - { files: [...], func, args }        注入文件后执行函数（CSP安全）
     *   - { func, args }                      直接执行函数（CSP安全）
     *   - { css: '...' }                      注入CSS字符串
     *   - { js: '...' }                       注入JS字符串（CSP不安全，兜底用）
     *   - { files: [...], js: '...' }         注入文件后执行JS字符串（CSP不安全）
     * @param callback 注入代码后的callback
     */
    let injectScriptIfTabExists = function (tabId, codeConfig, callback) {
        chrome.tabs.query({currentWindow: true}, (tabs) => {
            tabs.some(tab => {
                if (tab.id !== tabId) return false;
                Settings.getOptions((opts) => {

                    if (!codeConfig.hasOwnProperty('allFrames')) {
                        codeConfig.allFrames = String(opts['CONTENT_SCRIPT_ALLOW_ALL_FRAMES']) === 'true';
                    }

                    let af = codeConfig.allFrames;

                    if(codeConfig.files && codeConfig.files.length){
                        if(codeConfig.files.every(f => f.endsWith('.css'))) {
                            chrome.scripting.insertCSS({
                                target: {tabId, allFrames: af},
                                files: codeConfig.files
                            }, function () {
                                if (chrome.runtime.lastError) {
                                    console.warn('InjectTools.insertCSS(files) failed:', chrome.runtime.lastError);
                                }
                                callback && callback.apply(this, arguments);
                            });
                        } else {
                            chrome.scripting.executeScript({
                                target: {tabId, allFrames: af},
                                files: codeConfig.files
                            }, function () {
                                if (chrome.runtime.lastError) {
                                    console.warn('InjectTools.executeScript(files) failed:', chrome.runtime.lastError);
                                }
                                if (codeConfig.func) {
                                    _execFunc(tabId, af, codeConfig, callback);
                                } else if (codeConfig.js) {
                                    _execJs(tabId, af, 'try{' + codeConfig.js + ';}catch(e){};', callback, codeConfig.world);
                                } else {
                                    callback && callback.apply(this, arguments);
                                }
                            });
                        }
                    } else if(codeConfig.css){
                        chrome.scripting.insertCSS({
                            target: {tabId, allFrames: af},
                            css: codeConfig.css
                        }, function () {
                            if (chrome.runtime.lastError) {
                                console.warn('InjectTools.insertCSS(css) failed:', chrome.runtime.lastError);
                            }
                            callback && callback.apply(this, arguments);
                        });
                    } else if (codeConfig.func) {
                        _execFunc(tabId, af, codeConfig, callback);
                    } else if (codeConfig.js) {
                        _execJs(tabId, af, 'try{' + codeConfig.js + ';}catch(e){};', callback, codeConfig.world);
                    }

                });

                return true;
            });
        });
    };

    return { inject: injectScriptIfTabExists };
})();
