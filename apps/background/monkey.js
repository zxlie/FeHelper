/**
 * 网页油猴 - 注入引擎 v2
 *  - 多匹配规则（mIncludes/mExcludes）
 *  - 三档运行时机（document-start / end / idle）
 *  - MAIN/ISOLATED 世界 + CSP 严格站点自动兜底
 *  - CSS 独立注入
 *  - GM_* API 注入
 *  - 错误回传到管理界面
 *  - 命中计数
 */
import InjectTools from './inject-tools.js';

const PAGE_MONKEY_LOCAL_STORAGE_KEY = 'PAGE-MODIFIER-LOCAL-STORAGE-KEY';
const PAGE_MONKEY_LOG_KEY = 'PAGE-MODIFIER-LOG-KEY';

/* ================== 数据迁移 ================== */
const migrateMonkey = (cm) => {
    if (!cm || typeof cm !== 'object') return cm;
    if (!cm.mIncludes || !cm.mIncludes.length) {
        cm.mIncludes = cm.mPattern ? [cm.mPattern] : [];
    }
    if (!Array.isArray(cm.mExcludes)) cm.mExcludes = [];
    if (!cm.mRunAt) cm.mRunAt = 'document-end';
    if (typeof cm.mAllFrames !== 'boolean') cm.mAllFrames = false;
    if (!cm.mWorld) cm.mWorld = 'MAIN';
    if (!Array.isArray(cm.mGrants)) cm.mGrants = [];
    if (!Array.isArray(cm.mTags)) cm.mTags = [];
    if (typeof cm.mHits !== 'number') cm.mHits = 0;
    if (typeof cm.mStyle !== 'string') cm.mStyle = '';
    return cm;
};

/* ================== 匹配引擎 ================== */
const matchOnePattern = (pattern, url) => {
    if (!pattern) return false;
    let m = String(pattern).match(/^\/(.*)\/([gimsuy]*)$/);
    if (m) {
        try { return new RegExp(m[1], m[2] || '').test(url); } catch (e) { return false; }
    }
    if (pattern.indexOf('*') > -1) {
        let p = pattern;
        if (p.startsWith('*://')) p = p.replace('*://', '(http|https|file)://');
        else if (p.indexOf('://') < 0) p = '(http|https|file)://' + p;
        try {
            return new RegExp('^' + p.replace(/\./g, '\\.').replace(/\//g, '\\/').replace(/\*/g, '.*').replace(/\?/g, '\\?') + '$').test(url);
        } catch (e) { return false; }
    }
    let arr = [pattern, `${pattern}/`];
    if (!pattern.startsWith('http://') && !pattern.startsWith('https://') && !pattern.startsWith('file://')) {
        arr = arr.concat([`http://${pattern}`, `http://${pattern}/`, `https://${pattern}`, `https://${pattern}/`]);
    }
    return arr.includes(url);
};

const isMatch = (cm, url) => {
    let includes = cm.mIncludes && cm.mIncludes.length ? cm.mIncludes : (cm.mPattern ? [cm.mPattern] : []);
    if (!includes.length) return false;
    if (!includes.some(p => matchOnePattern(p, url))) return false;
    if ((cm.mExcludes || []).some(p => matchOnePattern(p, url))) return false;
    return true;
};

/* ================== GM API 源码 ================== */
const buildGmApi = (monkey) => {
    const meta = JSON.stringify({
        id: monkey.id,
        name: monkey.mName || '',
        version: monkey.mVersion || '1.0.0',
        author: monkey.mAuthor || '',
        description: monkey.mDescription || ''
    });
    return `
        const __GM_PREFIX = '__FH_GM_' + ${JSON.stringify(monkey.id)} + '_';
        const GM_info = { script: ${meta}, version: '2.0', scriptHandler: 'FeHelper Monkey' };
        const GM_setValue = function(k, v){ try { localStorage.setItem(__GM_PREFIX + k, JSON.stringify(v)); } catch(e){} };
        const GM_getValue = function(k, d){ try { var v = localStorage.getItem(__GM_PREFIX + k); return v != null ? JSON.parse(v) : d; } catch(e){ return d; } };
        const GM_deleteValue = function(k){ try { localStorage.removeItem(__GM_PREFIX + k); } catch(e){} };
        const GM_listValues = function(){ try { return Object.keys(localStorage).filter(function(k){ return k.indexOf(__GM_PREFIX) === 0; }).map(function(k){ return k.slice(__GM_PREFIX.length); }); } catch(e){ return []; } };
        const GM_addStyle = function(css){ var s = document.createElement('style'); s.textContent = css; (document.head || document.documentElement).appendChild(s); return s; };
        const GM_log = function(){ try { console.log.apply(console, ['[FH-Monkey:' + (GM_info.script.name || '') + ']'].concat([].slice.call(arguments))); } catch(e){} };
        const GM_openInTab = function(url, opts){ try { return window.open(url, (opts && opts.active === false) ? '_blank' : '_blank'); } catch(e){} };
        const GM_setClipboard = function(text){ try { navigator.clipboard && navigator.clipboard.writeText(text); } catch(e){} };
        const GM_notification = function(opts){
            try {
                var title = typeof opts === 'string' ? '' : (opts && opts.title) || 'FeHelper';
                var text  = typeof opts === 'string' ? opts : (opts && opts.text) || '';
                if (window.Notification && Notification.permission === 'granted') {
                    new Notification(title, { body: text });
                } else {
                    var d = document.createElement('div');
                    d.style.cssText = 'position:fixed;top:20px;right:20px;background:rgba(0,0,0,.85);color:#fff;padding:12px 16px;border-radius:8px;z-index:2147483647;font:14px/1.5 sans-serif;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,.3);';
                    d.innerHTML = (title ? '<b style="display:block;margin-bottom:4px">' + title + '</b>' : '') + text;
                    document.body && document.body.appendChild(d);
                    setTimeout(function(){ d.remove(); }, 4000);
                }
            } catch(e){}
        };
        const GM_xmlhttpRequest = function(details){
            try {
                var ctrl = new AbortController();
                var headers = details.headers || {};
                var p = fetch(details.url, {
                    method: details.method || 'GET',
                    headers: headers,
                    body: details.data,
                    credentials: details.anonymous ? 'omit' : 'include',
                    signal: ctrl.signal
                }).then(function(r){
                    return r.text().then(function(text){
                        var resObj = { status: r.status, statusText: r.statusText, responseText: text, response: text, finalUrl: r.url, responseHeaders: '' };
                        try { r.headers.forEach(function(v, k){ resObj.responseHeaders += k + ': ' + v + '\\r\\n'; }); } catch(e){}
                        details.onload && details.onload(resObj);
                        return resObj;
                    });
                }).catch(function(e){ details.onerror && details.onerror(e); });
                return { abort: function(){ try{ ctrl.abort(); }catch(e){} } };
            } catch(e){ details.onerror && details.onerror(e); }
        };
        const unsafeWindow = window;
        const GM = {
            setValue: GM_setValue, getValue: GM_getValue, deleteValue: GM_deleteValue, listValues: GM_listValues,
            addStyle: GM_addStyle, notification: GM_notification, xmlHttpRequest: GM_xmlhttpRequest, openInTab: GM_openInTab,
            setClipboard: GM_setClipboard, log: GM_log, info: GM_info
        };
    `;
};

/* ================== 拼接最终代码 ================== */
const buildFinalCode = (monkey) => {
    let requires = (monkey.mRequireJs || '').split(/[\s,，]+/).map(s => s.trim()).filter(Boolean);
    let userScript = monkey.mScript || '';
    let refresh = parseInt(monkey.mRefresh) || 0;
    let nameStr = JSON.stringify(monkey.mName || '');
    let idStr = JSON.stringify(monkey.id);

    // 注意：MAIN world 没有 chrome.runtime API，所以日志一律走
    // window.postMessage('FH_MONKEY_LOG' channel)，由 ISOLATED world
    // 桥接器（_injectLogBridge）转发到 background。
    return `
        (function(){
            ${buildGmApi(monkey)}

            var __post = function(level, msg){
                try {
                    window.postMessage({
                        __fh_monkey_log: true,
                        payload: {
                            id: ${idStr},
                            name: ${nameStr},
                            level: level,
                            msg: String((msg && msg.stack) || msg),
                            url: location.href,
                            time: Date.now()
                        }
                    }, '*');
                } catch(_) {}
            };
            var __reportError = function(e){
                __post('error', e);
                try { console.error('[FH-Monkey:' + ${nameStr} + ']', e); } catch(_) {}
            };

            // 让 GM_log 也回流到运行日志面板（每个脚本作用域独立闭包，必须每次都 hook）
            try {
                if (typeof GM_log === 'function') {
                    var __origGmLog = GM_log;
                    GM_log = function(){
                        try {
                            var args = [].slice.call(arguments);
                            var text = args.map(function(a){
                                try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(_) { return String(a); }
                            }).join(' ');
                            __post('info', text);
                        } catch(_) {}
                        try { return __origGmLog.apply(null, arguments); } catch(_) {}
                    };
                }
            } catch(_) {}

            // 全局 console / error / unhandledrejection 监听只挂一次（避免多脚本 N 倍重复 + 归属错乱），
            // 由全局 sentinel 控制；归属为通用 'page-monkey'，具体脚本错误请用 try-catch 自行 GM_log。
            try {
                if (!window.__fhMonkeyGlobalHooked) {
                    window.__fhMonkeyGlobalHooked = true;
                    var __postGlobal = function(level, msg){
                        try {
                            window.postMessage({
                                __fh_monkey_log: true,
                                payload: {
                                    id: '__global__', name: 'page-monkey',
                                    level: level, msg: String((msg && msg.stack) || msg),
                                    url: location.href, time: Date.now()
                                }
                            }, '*');
                        } catch(_) {}
                    };
                    ['error', 'warn'].forEach(function(level){
                        var orig = console[level];
                        console[level] = function(){
                            var args = [].slice.call(arguments);
                            var text = args.map(function(a){
                                try {
                                    if (a && a.stack) return a.stack;
                                    if (typeof a === 'object') return JSON.stringify(a);
                                    return String(a);
                                } catch(_) { return String(a); }
                            }).join(' ');
                            __postGlobal(level, text);
                            try { orig.apply(console, args); } catch(_) {}
                        };
                    });
                    window.addEventListener('error', function(e){
                        __postGlobal('error', (e && (e.message || (e.error && e.error.stack))) || 'window.onerror');
                    });
                    window.addEventListener('unhandledrejection', function(e){
                        var r = e && e.reason;
                        __postGlobal('error', 'UnhandledRejection: ' + ((r && r.stack) || r));
                    });
                }
            } catch(_) {}

            var __runUser = function(){
                __post('info', '脚本开始执行');
                try {
                    (function(){
                        ${userScript}
                    })();
                } catch(e) { __reportError(e); }
                ${refresh > 0 ? `try{ setTimeout(function(){ try{ location.reload(); }catch(e){} }, ${refresh * 1000}); }catch(e){}` : ''}
            };
            var __requires = ${JSON.stringify(requires)};
            // 通过 ISOLATED 桥 + background 代理 fetch @require 脚本，
            // 这样可以绕过页面 CSP / CORS 限制（MAIN world 直接 fetch 经常被 CSP block）。
            var __fetchRequire = function(url){
                return new Promise(function(resolve){
                    var reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2);
                    var timer = setTimeout(function(){
                        window.removeEventListener('message', onMsg, false);
                        resolve({ok:false, err:'require timeout'});
                    }, 15000);
                    function onMsg(e){
                        if (!e || !e.data || e.data.__fh_monkey_require_resp !== true) return;
                        if (e.data.reqId !== reqId) return;
                        clearTimeout(timer);
                        window.removeEventListener('message', onMsg, false);
                        resolve(e.data);
                    }
                    window.addEventListener('message', onMsg, false);
                    try {
                        window.postMessage({__fh_monkey_require: true, reqId: reqId, url: url}, '*');
                    } catch (err) {
                        clearTimeout(timer);
                        window.removeEventListener('message', onMsg, false);
                        resolve({ok:false, err:String(err && err.message || err)});
                    }
                });
            };
            if (__requires.length) {
                Promise.all(__requires.map(function(u){
                    return __fetchRequire(u).then(function(r){
                        if (!r || !r.ok) {
                            __reportError('require failed: ' + u + ' / ' + (r && r.err));
                            return;
                        }
                        var t = r.text || '';
                        try { (0, eval)(t); } catch(e) {
                            try {
                                var s = document.createElement('script');
                                s.textContent = t;
                                (document.head || document.documentElement).appendChild(s);
                                s.remove();
                            } catch (e2) {
                                __reportError('require eval failed: ' + u + ' / ' + e2);
                            }
                        }
                    });
                })).then(__runUser).catch(__runUser);
            } else {
                __runUser();
            }
        })();
    `;
};

/* ================== 注入实现 ================== */
const _buildTarget = (tabId, allFrames, frameId) => {
    if (typeof frameId === 'number') return { tabId, frameIds: [frameId] };
    if (allFrames) return { tabId, allFrames: true };
    return { tabId };
};

const _injectCss = (tabId, allFrames, frameId, css, monkey) => {
    try {
        chrome.scripting.insertCSS({
            target: _buildTarget(tabId, allFrames, frameId),
            css
        }).catch((err) => {
            log({
                id: monkey && monkey.id, name: (monkey && monkey.mName) || '', level: 'error',
                msg: 'css inject failed: ' + ((err && err.message) || err),
                url: '(tab ' + tabId + ')', time: Date.now()
            });
        });
    } catch (e) {
        log({
            id: monkey && monkey.id, name: (monkey && monkey.mName) || '', level: 'error',
            msg: 'css inject failed: ' + ((e && e.message) || e),
            url: '(tab ' + tabId + ')', time: Date.now()
        });
    }
};

// MAIN world 没有 chrome.runtime，需要在 ISOLATED world 中常驻一个桥接监听器，
// 通过 window.postMessage 接收 MAIN world 抛出的日志，再转发到 background。
// 返回 Promise，调用方需 await 以保证桥接器在 user script 之前就位（否则启动期日志会丢）。
const _injectLogBridge = (tabId, allFrames, frameId) => {
    try {
        return chrome.scripting.executeScript({
            target: _buildTarget(tabId, allFrames, frameId),
            func: function () {
                if (window.__fhMonkeyBridgeReady) return;
                window.__fhMonkeyBridgeReady = true;
                window.addEventListener('message', function (e) {
                    if (!e || !e.data) return;
                    var d = e.data;
                    // 1) 日志桥
                    if (d.__fh_monkey_log === true) {
                        try {
                            chrome.runtime.sendMessage({
                                type: 'fh-dynamic-any-thing',
                                thing: 'page-monkey-log',
                                params: d.payload || {}
                            });
                        } catch (_) {}
                        return;
                    }
                    // 2) @require 代理：通过 background fetch 远程脚本，
                    //    避免页面 CSP/CORS 限制 MAIN world 直接 fetch
                    if (d.__fh_monkey_require === true && d.url && d.reqId) {
                        var reqId = d.reqId, url = d.url;
                        try {
                            chrome.runtime.sendMessage({
                                type: 'fh-dynamic-any-thing',
                                thing: 'page-monkey-require-fetch',
                                params: { url: url }
                            }, function (resp) {
                                try {
                                    window.postMessage({
                                        __fh_monkey_require_resp: true,
                                        reqId: reqId,
                                        ok: !!(resp && resp.ok),
                                        text: (resp && resp.text) || '',
                                        err: (resp && resp.err) || ''
                                    }, '*');
                                } catch (_) {}
                            });
                        } catch (err) {
                            try {
                                window.postMessage({
                                    __fh_monkey_require_resp: true,
                                    reqId: reqId, ok: false, text: '',
                                    err: String(err && err.message || err)
                                }, '*');
                            } catch (_) {}
                        }
                    }
                }, false);
            },
            world: 'ISOLATED',
            injectImmediately: true
        }).catch((err) => {
            log({
                id: '__bridge__', name: 'page-monkey', level: 'error',
                msg: 'bridge inject failed: ' + ((err && err.message) || err),
                url: '(tab ' + tabId + ')', time: Date.now()
            });
        });
    } catch (_) {
        return Promise.resolve();
    }
};

const _injectScript = (tabId, frameId, monkey) => {
    let allFrames = !!monkey.mAllFrames;
    let world = monkey.mWorld === 'ISOLATED' ? 'ISOLATED' : 'MAIN';
    let finalCode = buildFinalCode(monkey);

    // 必须先等 ISOLATED 桥接器就位（MAIN/ISOLATED 模式都需要：
    // ISOLATED 模式下 user script 也通过 postMessage 走桥接，统一通道）。
    // 否则 user script 启动期的早期日志/@require 请求会丢失。
    let bridgeReady = _injectLogBridge(tabId, allFrames, frameId) || Promise.resolve();

    const exec = (worldOption, isFallback) => {
        try {
            chrome.scripting.executeScript({
                target: _buildTarget(tabId, allFrames, frameId),
                func: function (code) {
                    try { (0, eval)(code); } catch (e) {
                        // 注入阶段的 eval 错误也走桥接
                        try {
                            window.postMessage({
                                __fh_monkey_log: true,
                                payload: { level: 'error', msg: 'inject eval error: ' + ((e && e.stack) || e), time: Date.now() }
                            }, '*');
                        } catch (_) {}
                    }
                },
                args: [finalCode],
                world: worldOption,
                injectImmediately: true
            }).catch((err) => {
                if (!isFallback && worldOption === 'MAIN') {
                    exec('ISOLATED', true);
                } else {
                    // 最终失败也回报一条日志
                    log({
                        id: monkey.id, name: monkey.mName || '', level: 'error',
                        msg: 'inject failed: ' + ((err && err.message) || err),
                        url: '(tab ' + tabId + ', frame ' + (frameId || 0) + ')', time: Date.now()
                    });
                }
            });
        } catch (e) {
            if (!isFallback && worldOption === 'MAIN') exec('ISOLATED', true);
        }
    };
    bridgeReady.then(() => exec(world, false), () => exec(world, false));
};

const injectMonkey = (tabId, frameId, monkey) => {
    let allFrames = !!monkey.mAllFrames;
    if (monkey.mStyle && monkey.mStyle.trim()) {
        _injectCss(tabId, allFrames, frameId, monkey.mStyle, monkey);
    }
    _injectScript(tabId, frameId, monkey);
    _hit(monkey.id);
};

/* ================== 命中计数 ================== */
let _hitTimer = null;
let _hitBuffer = {};
const _hit = (id) => {
    _hitBuffer[id] = (_hitBuffer[id] || 0) + 1;
    if (_hitTimer) return;
    _hitTimer = setTimeout(() => {
        let buf = _hitBuffer; _hitBuffer = {}; _hitTimer = null;
        chrome.storage.local.get(PAGE_MONKEY_LOCAL_STORAGE_KEY, resps => {
            let raw = resps && resps[PAGE_MONKEY_LOCAL_STORAGE_KEY];
            if (!raw) return;
            try {
                let arr = JSON.parse(raw);
                arr.forEach(cm => { if (buf[cm.id]) cm.mHits = (cm.mHits || 0) + buf[cm.id]; });
                let data = {}; data[PAGE_MONKEY_LOCAL_STORAGE_KEY] = JSON.stringify(arr);
                chrome.storage.local.set(data);
            } catch (e) {}
        });
    }, 1500);
};

/* ================== 启动入口（按 runAt 触发） ================== */
const start = (params) => {
    try {
        if (!params || !params.url || params.tabId == null) return true;
        let runAt = params.runAt || 'document-end';
        let frameId = typeof params.frameId === 'number' ? params.frameId : 0;

        chrome.storage.local.get(PAGE_MONKEY_LOCAL_STORAGE_KEY, (resps) => {
            let raw, storageMode = false;
            if ((!resps || !resps[PAGE_MONKEY_LOCAL_STORAGE_KEY]) && typeof localStorage !== 'undefined') {
                raw = localStorage.getItem(PAGE_MONKEY_LOCAL_STORAGE_KEY) || '[]';
                storageMode = true;
            } else {
                raw = (resps && resps[PAGE_MONKEY_LOCAL_STORAGE_KEY]) || '[]';
            }

            let monkeys = [];
            try { monkeys = JSON.parse(raw); } catch (e) {}
            monkeys = monkeys.map(migrateMonkey);

            monkeys
                .filter(cm => !cm.mDisabled)
                .filter(cm => (cm.mRunAt || 'document-end') === runAt)
                .filter(cm => isMatch(cm, params.url))
                .filter(cm => frameId === 0 || !!cm.mAllFrames)
                .forEach(cm => injectMonkey(params.tabId, frameId, cm));

            if (storageMode) {
                let data = {}; data[PAGE_MONKEY_LOCAL_STORAGE_KEY] = raw;
                chrome.storage.local.set(data);
            }
        });
    } catch (e) {
        console.log('monkey error', e);
    }
    return true;
};

/* ================== 日志收集 ================== */
const log = (params) => {
    if (!params) return;
    chrome.storage.local.get(PAGE_MONKEY_LOG_KEY, resps => {
        let arr = [];
        try { arr = JSON.parse((resps && resps[PAGE_MONKEY_LOG_KEY]) || '[]'); } catch (e) {}
        arr.push(Object.assign({ time: Date.now() }, params));
        if (arr.length > 300) arr = arr.slice(-300);
        let data = {}; data[PAGE_MONKEY_LOG_KEY] = JSON.stringify(arr);
        chrome.storage.local.set(data);
    });
};

/* ================== @require 白名单校验 ================== */
// 桥接器代理 fetch 容易被恶意页面滥用做任意 URL 代理（绕过 CORS），
// 因此 background 端必须校验 URL 必须出现在某个已启用脚本的 mRequireJs 列表中。
const isAllowedRequireUrl = (url) => {
    return new Promise(resolve => {
        if (!url || typeof url !== 'string') return resolve(false);
        try {
            chrome.storage.local.get(PAGE_MONKEY_LOCAL_STORAGE_KEY, resps => {
                let raw = resps && resps[PAGE_MONKEY_LOCAL_STORAGE_KEY];
                if (!raw) return resolve(false);
                let monkeys = [];
                try { monkeys = JSON.parse(raw); } catch (e) {}
                let allowed = monkeys.some(cm => {
                    if (!cm || cm.mDisabled) return false;
                    let list = (cm.mRequireJs || '').split(/[\s,，]+/).map(s => s.trim()).filter(Boolean);
                    return list.indexOf(url) !== -1;
                });
                resolve(allowed);
            });
        } catch (_) { resolve(false); }
    });
};

export default { start, log, migrateMonkey, isMatch, matchOnePattern, isAllowedRequireUrl };
