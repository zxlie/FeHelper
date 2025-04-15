import Settings from '../options/settings.js';

export default (() => {
    /**
     * 如果tabId指定的tab还存在，就正常注入脚本
     * @param tabId 需要注入脚本的tabId
     * @param codeConfig 需要注入的代码
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

                    codeConfig.js = 'try{' + codeConfig.js + ';}catch(e){};';
                    // 有文件就注入文件
                    if(codeConfig.files && codeConfig.files.length){
                        // 注入样式
                        if(codeConfig.files.join(',').indexOf('.css') > -1) {
                            chrome.scripting.insertCSS({
                                target: {tabId, allFrames: codeConfig.allFrames},
                                files: codeConfig.files
                            }, function () {
                                callback && callback.apply(this, arguments);
                            });
                        }
                        // 注入js
                        else {
                            chrome.scripting.executeScript({
                                target: {tabId, allFrames: codeConfig.allFrames},
                                files: codeConfig.files
                            }, function () {
                                chrome.scripting.executeScript({
                                    target: {tabId, allFrames: codeConfig.allFrames},
                                    func: function(code){try{evalCore.getEvalInstance(window)(code)}catch(x){}},
                                    args: [codeConfig.js]
                                }, function () {
                                    callback && callback.apply(this, arguments);
                                });
                            });
                        }
                    }else if(codeConfig.css){
                        // 注入css样式
                        chrome.scripting.executeScript({
                            target: {tabId, allFrames: codeConfig.allFrames},
                            css:codeConfig.css
                        }, function () {
                            callback && callback.apply(this, arguments);
                        });
                    }else{
                        // 注入js脚本
                        chrome.scripting.executeScript({
                            target: {tabId, allFrames: codeConfig.allFrames},
                            func: function(code){try{evalCore.getEvalInstance(window)(code)}catch(x){}},
                            args: [codeConfig.js]
                        }, function () {
                            callback && callback.apply(this, arguments);
                        });
                    }

                });

                return true;
            });
        });
    };

    return { inject: injectScriptIfTabExists };
})();
