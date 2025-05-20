import InjectTools from './inject-tools.js';
import Statistics from './statistics.js';

export default (() => {
    let start = (params) => {
        try {
            const PAGE_MONKEY_LOCAL_STORAGE_KEY = 'PAGE-MODIFIER-LOCAL-STORAGE-KEY';

            let handler = monkeys => {
                monkeys.filter(cm => !cm.mDisabled).forEach(cm => {
                    let result = null;
                    let matched = cm.mPattern.match(/^\/(.*)\/(.*)?$/);
                    if (matched && ( !matched[2] || matched[2] && !/[^igm]*/i.test(matched[2]))) {
                        // 正则，直接匹配
                        cm.mPattern = new RegExp(matched[1], matched[2] || "");
                        result = cm.mPattern.test(params.url) && cm;
                    } else if (cm.mPattern.indexOf('*') > -1) {
                        if (cm.mPattern.startsWith('*://')) {
                            cm.mPattern = cm.mPattern.replace('*://', '(http|https|file)://');
                        } else if (cm.mPattern.indexOf('://') < 0) {
                            cm.mPattern = '(http|https|file)://' + cm.mPattern;
                        }

                        // 通配符，则转换为正则再匹配
                        cm.mPattern = new RegExp('^' + cm.mPattern.replace(/\./g,'\\.').replace(/\//g, '\\/').replace(/\*/g, '.*').replace(/\?/g, '\\?') + '$');
                        result = cm.mPattern.test(params.url) && cm;
                    } else {
                        // 绝对地址，直接比对
                        let arr = [cm.mPattern, `${cm.mPattern}/`];
                        if (!cm.mPattern.startsWith('http://') && !cm.mPattern.startsWith('https://')) {
                            arr = arr.concat([`http://${cm.mPattern}`, `http://${cm.mPattern}/`,
                                `https://${cm.mPattern}`, `https://${cm.mPattern}/`]);
                        }
                        if (arr.includes(params.url)) {
                            result = cm;
                        }
                    }

                    if (result) {
                        let scripts = '(' + ((monkey) => {
                            let injectFunc = () => {
                                // 执行脚本
                                try{evalCore.getEvalInstance(window)(monkey.mScript)}catch(x){}

                                parseInt(monkey.mRefresh) && setTimeout(() => {
                                    location.reload(true);
                                }, parseInt(monkey.mRefresh) * 1000);
                            };

                            window._fhImportJs = js => {
                                return fetch(js).then(resp => resp.text()).then(jsText => {
                                    if(window.evalCore && window.evalCore.getEvalInstance){
                                         return window.evalCore.getEvalInstance(window)(jsText);
                                    }
                                    let el = document.createElement('script');
                                    el.textContent = jsText;
                                    document.head.appendChild(el);
                                });
                            };

                            let jsFiles = (monkey.mRequireJs || '').split(/[\s,，]+/).filter(js => js.length);
                            if (jsFiles.length) {
                                let arrPromise = Array.from(new Set(jsFiles)).map(js => window._fhImportJs(js));
                                Promise.all(arrPromise).then(injectFunc);
                            } else {
                                injectFunc();
                            }
                        }).toString() + `)(${JSON.stringify(result)})`;
                        InjectTools.inject(params.tabId, {js: scripts, allFrames: false});
                    }
                });
            };

            chrome.storage.local.get(PAGE_MONKEY_LOCAL_STORAGE_KEY, (resps) => {
                let cacheMonkeys, storageMode = false;
                if ((!resps || !resps[PAGE_MONKEY_LOCAL_STORAGE_KEY]) && typeof localStorage !== 'undefined') {
                    cacheMonkeys = localStorage.getItem(PAGE_MONKEY_LOCAL_STORAGE_KEY) || '[]';
                    storageMode = true;
                } else {
                    cacheMonkeys = resps[PAGE_MONKEY_LOCAL_STORAGE_KEY] || '[]';
                }

                if(params && params.url){
                    handler(JSON.parse(cacheMonkeys));
                }

                // 本地存储的内容，需要全部迁移到chrome.storage.local中，以确保unlimitedStorage
                if (storageMode) {
                    let storageData = {};
                    storageData[PAGE_MONKEY_LOCAL_STORAGE_KEY] = cacheMonkeys;
                    chrome.storage.local.set(storageData);
                }
            });

        } catch (e) {
            console.log('monkey error',e);
        }
        return true;
    };

    return {start};
})();
