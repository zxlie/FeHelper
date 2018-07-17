/**
 * Json Page Automatic Format Via FeHelper
 * @author zhaoxianlie
 */


// json with bigint supported
Tarp.require('../static/vendor/json-bigint/index');

module.exports = (() => {

    "use strict";

    let _htmlFragment = [
        '<style type="text/css">.mod-contentscript #formattingMsg{position:absolute;top:0;font-size:14px;color:#333;margin:5px;}#formattingMsg .x-loading{width:12px;height:12px;border:1px solid #f00;border-radius:50%;box-shadow:0 0 10px 2px;color:#c00;border-right-color:transparent;border-top-color:transparent;animation:spin-right 1s linear infinite normal;animation-delay:0s;margin:0 5px 0 0;display:inline-block}#formattingMsg .x-loading:before{display:block;width:8px;height:8px;margin:1px;border:2px solid #f00;content:" ";border-radius:50%;border-left-color:transparent;border-bottom-color:transparent}@keyframes spin-right{from{transform:rotate(0deg);opacity:.2}50%{transform:rotate(180deg);opacity:1.0}to{transform:rotate(360deg);opacity:.2}}</style>',
        '<div class="mod-json mod-contentscript"><div class="rst-item">',
        '<div id="formattingMsg"><span class="x-loading"></span>格式化中...</div>',
        '<div id="jfCallbackName_start" class="callback-name"></div>',
        '<div id="jfContent"></div>',
        '<pre id="jfContent_pre"></pre>',
        '<div id="jfCallbackName_end" class="callback-name"></div>',
        '</div></div>'
    ].join('');

    let _loadCss = function () {
        let cssUrl = chrome.extension.getURL('json-format/without-ui.css');
        $('<link id="_fehelper_fcp_css_" href="' + cssUrl + '" rel="stylesheet" type="text/css" />').appendTo('head');
    };

    /**
     * 自动消失的Alert弹窗
     * @param content
     */
    window.alert = function (content) {
        window.clearTimeout(window.feHelperAlertMsgTid);
        let elAlertMsg = document.querySelector("#fehelper_alertmsg");
        if (!elAlertMsg) {
            let elWrapper = document.createElement('div');
            elWrapper.innerHTML = '<div id="fehelper_alertmsg" style="position:fixed;top:5px;right:5px;z-index:1000000">' +
                '<p style="background:#000;display:inline-block;color:#fff;text-align:center;' +
                'padding:10px 10px;margin:0 auto;font-size:14px;border-radius:4px;">' + content + '</p></div>';
            elAlertMsg = elWrapper.childNodes[0];
            document.body.appendChild(elAlertMsg);
        } else {
            elAlertMsg.querySelector('p').innerHTML = content;
            elAlertMsg.style.display = 'block';
        }

        window.feHelperAlertMsgTid = window.setTimeout(function () {
            elAlertMsg.style.display = 'none';
        }, 3000);
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
                } else if ((nodes[i].offsetWidth === 0 || nodes[i].offsetHeight === 0 || !html) && ['script', 'link'].indexOf(tagName) === -1) {
                    // 如果用户安装迅雷或者其他的插件，也回破坏页面结构，需要兼容一下
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
     * 获取一个JSON的所有Key数量
     * @param json
     * @returns {number}
     * @private
     */
    let _getAllKeysCount = function (json) {
        let count = 0;

        if (typeof json === 'object') {
            let keys = Object.keys(json);
            count += keys.length;

            keys.forEach(key => {
                if (json[key] && typeof json[key] === 'object') {
                    count += _getAllKeysCount(json[key]);
                }
            });
        }

        return count;
    };

    /**
     * 执行format操作
     * @private
     */
    let _format = function (options) {

        let source = _getJsonText();
        if (!source) {
            return;
        }

        // JSONP形式下的callback name
        let funcName = null;
        let jsonObj = null;
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
                source = matches[2];
            } else {
                reg = /^([\{\[])/;
                if (!reg.test(source)) {
                    return;
                }
            }

            // 这里可能会throw exception
            jsonObj = JSON.parse(source);
        } catch (ex) {

            // new Function的方式，能自动给key补全双引号，但是不支持bigint，所以是下下策，放在try-catch里搞
            try {
                jsonObj = new Function("return " + source)();
            } catch (exx) {
                try {
                    // 再给你一次机会，是不是下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
                    jsonObj = new Function("return '" + source + "'")();
                    if (typeof jsonObj === 'string') {
                        // 最后给你一次机会，是个字符串，老夫给你再转一次
                        jsonObj = new Function("return " + jsonObj)();
                    }
                } catch (exxx) {
                    return;
                }
            }

        }

        // 是json格式，可以进行JSON自动格式化
        if (jsonObj != null && typeof jsonObj === "object") {
            try {
                // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                let jsonStr = JSON.stringify(jsonObj);
                // 如果newSource的长度比原source长度短很多的话，猜测应该是格式化错了，需要撤销操作
                // 这里一定要unicode decode一下，要不然会出现误判
                let len1 = jsonStr.replace(/'|"|\s/g, '').length;
                let len2 = (_uniDecode(source)).replace(/'|"|\s/g, '').length;
                // 误差不允许超过20%
                if (Math.abs(len1 - len2) / ((len1 + len2) / 2) > 0.2) {
                    return;
                }

                source = jsonStr;
            } catch (ex) {
                // 通过JSON反解不出来的，一定有问题
                return;
            }

            // JSON的所有key不能超过预设的值，比如 10000 个，要不然自动格式化会比较卡
            if (options && options['MAX_JSON_KEYS_NUMBER']) {
                let keysCount = _getAllKeysCount(jsonObj);
                if (keysCount > options['MAX_JSON_KEYS_NUMBER']) {
                    let msg = '当前JSON共 <b style="color:red">' + keysCount + '</b> 个Key，大于预设值' + options['MAX_JSON_KEYS_NUMBER'] + '，已取消自动格式化；可到FeHelper设置页调整此配置！';
                    return alert(msg);
                }
            }

            _loadCss();
            $('body').html(_htmlFragment);

            // 格式化
            Tarp.require('../json-format/format-lib').format(source);

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

    return {
        format: _format
    };
})();