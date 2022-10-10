/**
 * Json Page Automatic Format Via FeHelper
 * @author zhaoxianlie
 */

// 留100ms时间给静态文件加载，当然，这个代码只是留给未开发过程中用的
let pleaseLetJsLoaded = 0;
let __importScript = (filename) => {
    pleaseLetJsLoaded = 100;
    let url = filename;

    if (location.protocol === 'chrome-extension:' || chrome.runtime && chrome.runtime.getURL) {
        url = chrome.runtime.getURL(filename);
    }
    fetch(url).then(resp => resp.text()).then(jsText => {
        if(window.evalCore && window.evalCore.getEvalInstance){
            return window.evalCore.getEvalInstance(window)(jsText);
        }
        let el = document.createElement('script');
        el.textContent = jsText;
        document.head.appendChild(el);
    });
};

__importScript('json-bigint.js');
__importScript('format-lib.js');
__importScript('json-abc.js');
__importScript('json-decode.js');

window.JsonAutoFormat = (() => {

    "use strict";

    const JSON_SORT_TYPE_KEY = 'json_sort_type_key';
    const JSON_AUTO_DECODE = 'json_auto_decode';
    const JSON_TOOL_BAR_ALWAYS_SHOW = 'JSON_TOOL_BAR_ALWAYS_SHOW';

    // 用于记录最原始的json串
    let originalJsonStr = '';
    let curSortType = 0;
    // JSONP形式下的callback name
    let funcName = null;
    let jsonObj = null;
    let fnTry = null;
    let fnCatch = null;

    let autoDecode = false;

    let _getHtmlFragment = () => {
        return [
            '<div class="x-toolbar" style="display:none">' +
            '    <a href="http://www.baidufe.com/fehelper/feedback.html" target="_blank" class="x-a-title">' +
            '        <img src="' + chrome.runtime.getURL('static/img/fe-16.png') + '" alt="fehelper"/> FeHelper</a>' +
            '        <span class="x-b-title"></span>' +
            '        <span class="x-split">|</span>\n' +
            '        <input type="checkbox" id="json_endecode"><label for="json_endecode">自动解码</label>' +
            '        <span class="x-sort">' +
            '            <span class="x-split">|</span>' +
            '            <span class="x-stitle">排序：</span>' +
            '            <label for="sort_null">默认</label><input type="radio" name="jsonsort" id="sort_null" value="0" checked>' +
            '            <label for="sort_asc">升序</label><input type="radio" name="jsonsort" id="sort_asc" value="1">' +
            '            <label for="sort_desc">降序</label><input type="radio" name="jsonsort" id="sort_desc" value="-1">' +
            '        </span>' +
            '    <span class="x-split">|</span>\n' +
            '    <button class="xjf-btn" id="jsonGetCorrectCnt">乱码修正</button>' +
            '    <span id="optionBar"></span>' +
            '    <span class="fe-feedback">' +
            '        <a id="toggleBtn" title="展开或收起工具栏">隐藏&gt;&gt;</a>' +
            '    </span>' +
            '</div>',
            '<div id="formattingMsg"><span class="x-loading"></span>格式化中...</div>',
            '<div class="mod-json mod-contentscript"><div class="rst-item">',
            '<div id="jfCallbackName_start" class="callback-name"></div>',
            '<div id="jfContent"></div>',
            '<pre id="jfContent_pre"></pre>',
            '<div id="jfCallbackName_end" class="callback-name"></div>',
            '</div></div>'
        ].join('')
    };

    /**
     * 从页面提取JSON文本
     * @returns {string}
     * @private
     */
    let _getJsonText = function () {

        let pre = document.querySelectorAll('body>pre')[0] || {textContent: ""};
        let source = pre.textContent.trim();

        if (!source) {
            source = (document.body.textContent || '').trim()
        }
        if (!source) {
            return false;
        }

        // 1、如果body的内容还包含HTML标签，肯定不是合法的json了
        // 2、如果是合法的json，也只可能有一个text节点
        // 3、但是要兼容一下其他插件对页面的破坏情况
        // 4、对于content-type是application/json的页面可以做宽松处理
        let nodes = document.body.childNodes;
        let jsonText = '';
        let isJsonContentType = document.contentType === 'application/json';
        for (let i = 0, len = nodes.length; i < len; i++) {
            let elm = nodes[i];
            if (elm.nodeType === Node.TEXT_NODE) {
                jsonText += (elm.textContent || '').trim();
            } else if (isJsonContentType) {
                if ((elm.offsetHeight + elm.offsetWidth !== 0) && elm.textContent.length > jsonText.length) {
                    jsonText = elm.textContent;
                }
            } else {
                if (nodes[i].nodeType === Node.ELEMENT_NODE) {
                    let tagName = elm.tagName.toLowerCase();
                    let text = (elm.textContent || '').trim();
                    // 如果是pre标签，则看内容是不是和source一样，一样则continue
                    if (!((tagName === 'pre' && text === source)
                            || ((elm.offsetWidth + elm.offsetHeight === 0 || !text)
                                && !['script', 'link'].includes(tagName)))) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        return (jsonText || '').trim() || source;
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

        // 下面校验给定字符串是否为一个合法的json
        try {

            // 再看看是不是jsonp的格式
            let reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/gm;
            let reTry = /^(try\s*\{\s*)?/g;
            let reCatch = /([;\s]*\}\s*catch\s*\(\s*\S+\s*\)\s*\{([\s\S])*\})?[;\s]*$/g;

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
                        try {
                            // 确保bigint不会失真
                            jsonObj = JSON.parse(jsonObj);
                        } catch (ie) {
                            // 最后给你一次机会，是个字符串，老夫给你再转一次
                            jsonObj = new Function("return " + jsonObj)();
                        }
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
                source = JSON.stringify(jsonObj);
            } catch (ex) {
                // 通过JSON反解不出来的，一定有问题
                return;
            }

            // JSON的所有key不能超过预设的值，比如 10000 个，要不然自动格式化会比较卡
            if (options && options['MAX_JSON_KEYS_NUMBER']) {
                let keysCount = _getAllKeysCount(jsonObj);
                if (keysCount > options['MAX_JSON_KEYS_NUMBER']) {
                    let msg = '当前JSON共 <b style="color:red">' + keysCount + '</b> 个Key，大于预设值' + options['MAX_JSON_KEYS_NUMBER'] + '，已取消自动格式化；可到FeHelper设置页调整此配置！';
                    return toast(msg);
                }
            }

            let preLength = $('body>pre').hide().length;
            $('body').prepend(_getHtmlFragment());
            if (!preLength) {
                Array.prototype.slice.call(document.body.childNodes).forEach(node => {
                    (node.nodeType === Node.TEXT_NODE) && node.remove();
                });
            }

            originalJsonStr = source;

            // 获取上次记录的排序方式
            curSortType = parseInt(localStorage.getItem(JSON_SORT_TYPE_KEY) || 0);
            _didFormat(curSortType);

            // 排序选项初始化
            $('[name=jsonsort][value=' + curSortType + ']').attr('checked', 1);

            // 自动解码选项初始化
            autoDecode = localStorage.getItem(JSON_AUTO_DECODE);
            if (autoDecode === null) {
                autoDecode = (options && options['AUTO_TEXT_DECODE']);
            } else {
                autoDecode = autoDecode === 'true';
            }
            $('#json_endecode').prop('checked', autoDecode);

            _bindEvent();
        }
    };

    let _didFormat = function (sortType) {
        sortType = sortType || 0;
        let source = originalJsonStr;

        if (sortType !== 0) {
            let jsonObj = JsonABC.sortObj(JSON.parse(originalJsonStr), parseInt(sortType), true);
            source = JSON.stringify(jsonObj);
        }

        if (autoDecode) {
            (async () => {
                let txt = await JsonEnDecode.urlDecodeByFetch(source);
                source = JsonEnDecode.uniDecode(txt);

                // 格式化
                Formatter.format(source);
                $('.x-toolbar').fadeIn(500);
            })();
        } else {
            // 格式化
            Formatter.format(source);
            $('.x-toolbar').fadeIn(500);
        }


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
    };

    let _getCorrectContent = function () {
        fetch(location.href).then(res => res.text()).then(text => {
            originalJsonStr = text;
            _didFormat(curSortType);
        });
    };

    let _bindEvent = function () {
        $('[name=jsonsort]').click(function (e) {
            let sortType = parseInt(this.value);
            if (sortType !== curSortType) {
                _didFormat(sortType);
                curSortType = sortType;
            }
            localStorage.setItem(JSON_SORT_TYPE_KEY, sortType);
        });

        $('#json_endecode').click(function (e) {
            autoDecode = this.checked;
            localStorage.setItem(JSON_AUTO_DECODE, autoDecode);
            _didFormat(curSortType);
        });

        let tgBtn = $('.fe-feedback #toggleBtn').click(function (e) {
            e.preventDefault();
            e.stopPropagation();

            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing'
            }, (params) => {
                let show = String(localStorage.getItem(JSON_TOOL_BAR_ALWAYS_SHOW)) !== 'false';
                localStorage.setItem(JSON_TOOL_BAR_ALWAYS_SHOW, !show);

                let toolBarClassList = document.querySelector('div.x-toolbar').classList;
                if (!show) {
                    toolBarClassList.remove('t-collapse');
                    tgBtn.html('隐藏&gt;&gt;');
                } else {
                    toolBarClassList.add('t-collapse');
                    tgBtn.html('&lt;&lt;');
                }
            });
        });

        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing'
        }, params => {
            let show = String(localStorage.getItem(JSON_TOOL_BAR_ALWAYS_SHOW)) !== 'false';
            let toolBarClassList = document.querySelector('div.x-toolbar').classList;
            if (show) {
                toolBarClassList.remove('t-collapse');
                tgBtn.html('隐藏&gt;&gt;');
            } else {
                toolBarClassList.add('t-collapse');
                tgBtn.html('&lt;&lt;');
            }
        });

        $('#jsonGetCorrectCnt').click(function (e) {
            _getCorrectContent();
        });

        $('#capturePage').click(function (e) {
            chrome.runtime.sendMessage({
                type: 'capture-visible-page'
            }, uri => {
                window.open(uri);
            });
            e.preventDefault();
            e.stopPropagation();
        });
    };

    return {
        format: (options) => {
            setTimeout(() => {
                _format(options);
            }, pleaseLetJsLoaded);
        }
    };
})();

if(location.protocol !== 'chorme-extension:') {
    window.JsonAutoFormat.format({JSON_PAGE_FORMAT: true});
}
