/**
 * Json Page Automatic Format Via FeHelper
 * @author zhaoxianlie
 */
let AutomaticJsonFormat = (() => {

    "use strict";
    let _getCurrAbsPath = function () {
        let rExtractUri = /((?:http|https|file|chrome-extension):\/\/.*?\/[^:]+)(?::\d+)?:\d+/;
        let stack;
        try {
            a.b();
        }
        catch (e) {
            stack = e.fileName || e.sourceURL || e.stack || e.stacktrace;
        }
        if (stack) {
            return rExtractUri.exec(stack)[1];
        }
    };
    let absPath = _getCurrAbsPath();
    Tarp.require.config = {
        paths: [absPath],
        uri: absPath
    };

    let _htmlFragment = [
        '<div class="mod-json mod-contentscript"><div class="rst-item">',
        '<div id="formattingMsg">',
        '<svg id="spinner" width="16" height="16" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" version="1.1">',
        '<path d="M 150,0 a 150,150 0 0,1 106.066,256.066 l -35.355,-35.355 a -100,-100 0 0,0 -70.711,-170.711 z" fill="#3d7fe6"></path>',
        '</svg>加载中...',
        '</div>',
        '<div id="jfCallbackName_start" class="callback-name"></div>',
        '<div id="jfContent"></div>',
        '<pre id="jfContent_pre"></pre>',
        '<div id="jfCallbackName_end" class="callback-name"></div>',
        '</div></div>'
    ].join('');

    let _loadCss = function () {
        let cssUrl = chrome.extension.getURL('json-format/without-ui.css');
        jQuery('<link id="_fehelper_fcp_css_" href="' + cssUrl + '" rel="stylesheet" type="text/css" />').appendTo('head');
    };

    /**
     * 从页面提取JSON文本
     * @returns {string}
     * @private
     */
    let _getJsonText = function () {

        let pre = $('body>pre:eq(0)')[0] || {textContent: ""};
        let source = $.trim(pre.textContent);
        if (!source) {
            source = $.trim(document.body.textContent || '')
        }
        if (!source) {
            return false;
        }

        // 如果body的内容还包含HTML标签，肯定不是合法的json了
        // 如果是合法的json，也只可能有一个text节点
        let nodes = document.body.childNodes;
        let newSource = '';
        for (let i = 0, len = nodes.length; i < len; i++) {
            if (nodes[i].nodeType === Node.TEXT_NODE) {
                newSource += nodes[i].textContent;
            } else if (nodes[i].nodeType === Node.ELEMENT_NODE) {
                let tagName = nodes[i].tagName.toLowerCase();
                let html = $.trim(nodes[i].textContent);
                // 如果是pre标签，则看内容是不是和source一样，一样则continue
                if (tagName === 'pre' && html === source) {
                    continue;
                } else if ((nodes[i].offsetWidth === 0 || nodes[i].offsetHeight === 0 || !html) && ['script', 'link'].indexOf(tagName) === -1) {
                    // 如果用户安装迅雷或者其他的插件，也回破坏页面结构，需要兼容一下
                    continue;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        return $.trim(newSource || '') || source;
    };

    /**
     * 此方法用于将Unicode码解码为正常字符串
     * @param {Object} text
     */
    let _uniDecode = function (text) {
        text = text.replace(/\\/g, "%").replace('%U', '%u').replace('%u0025', '%25');

        text = unescape(text.toString().replace(/%2B/g, "+"));
        let matches = text.match(/(%u00([0-9A-F]{2}))/gi);
        if (matches) {
            for (let matchid = 0; matchid < matches.length; matchid++) {
                let code = matches[matchid].substring(1, 3);
                let x = Number("0x" + code);
                if (x >= 128) {
                    text = text.replace(matches[matchid], code);
                }
            }
        }
        text = unescape(text.toString().replace(/%2B/g, "+"));

        return text;
    };

    /**
     * 执行format操作
     * @private
     */
    let _format = function () {
        let source = _getJsonText();
        if (!source) {
            return;
        }

        // JSONP形式下的callback name
        let funcName = null;
        // json对象
        let jsonObj = null;
        let newSource = source;
        let fnTry = null;
        let fnCatch = null;

        // 下面校验给定字符串是否为一个合法的json
        try {
            // 再看看是不是jsonp的格式
            let reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/gm;
            let reTry = /^(try\s*\{\s*)?/g;
            let reCatch = /(\}\s*catch\s*\(\s*\S+\s*\)\s*\{([\s\S])*\})?$/g;

            // 检测是否有try-catch包裹
            let sourceReplaced = source.replace(reTry, function () {
                fnTry = fnTry ? fnTry : arguments[1];
                return '';
            }).replace(reCatch, function () {
                fnCatch = fnCatch ? fnCatch : arguments[1];
                return '';
            }).trim();

            let matches = reg.exec(sourceReplaced);
            if (matches != null && (fnTry && fnCatch || !fnTry && !fnCatch)) {
                funcName = matches[1];
                newSource = matches[2];
                jsonObj = new Function("return " + newSource)();
            } else {
                reg = /^([\{\[])/;
                if (!reg.test(source)) {
                    return;
                }
            }

            // 强化验证
            if (jsonObj == null || typeof jsonObj !== 'object') {
                jsonObj = new Function("return " + source)();

                // 还要防止下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
                if (typeof jsonObj === "string") {
                    // 再来一次
                    jsonObj = new Function("return " + jsonObj)();
                }
            }
        } catch (ex) {
            return;
        }

        // 是json格式，可以进行JSON自动格式化
        if (jsonObj != null && typeof jsonObj === "object") {
            try {
                // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                let jsonStr = JSON.stringify(jsonObj);
                // 如果newSource的长度比原source长度短很多的话，猜测应该是格式化错了，需要撤销操作
                // 这里一定要unicode decode一下，要不然会出现误判
                let len1 = jsonStr.replace(/'|"|\s/g, '').length;
                let len2 = (_uniDecode(newSource)).replace(/'|"|\s/g, '').length;
                // 误差不允许超过20%
                if (Math.abs(len1 - len2) / ((len1 + len2) / 2) > 0.2) {
                    return;
                }

                newSource = jsonStr;
            } catch (ex) {
                // 通过JSON反解不出来的，一定有问题
                return;
            }

            $('body').html(_htmlFragment);
            _loadCss();

            Tarp.require('./format-lib').format(newSource);

            // 如果是JSONP格式的，需要把方法名也显示出来
            if (funcName != null) {
                if (fnTry && fnCatch) {
                    $('#jfCallbackName_start').html('<pre style="padding:0">' + fnTry + '</pre>' + funcName + '(');
                    $('#jfCallbackName_end').html(')<br><pre style="padding:0">' + fnCatch + '</pre>');
                } else {
                    $('#jfCallbackName_start').html(funcName + '(');
                    $('#jfCallbackName_end').html(')');
                }
            }
        }
    };

    let _init = function () {

        $(function () {
            let Settings = Tarp.require('../options/settings');
            if (Settings.pageJsonMustFormat) {
                _format();
            } else {
                let MSG_TYPE = Tarp.require('../static/js/msg_type');
                chrome.extension.sendMessage({
                    type: MSG_TYPE.GET_OPTIONS,
                    items: [MSG_TYPE.JSON_PAGE_FORMAT]
                }, function (opts) {
                    if (!opts || opts.JSON_PAGE_FORMAT !== 'false') {
                        _format();
                    }
                });
            }
        });
    };

    return {
        init: _init
    };
})();

AutomaticJsonFormat.init();