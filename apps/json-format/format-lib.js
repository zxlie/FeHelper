/**
 * FeHelper Json Format Lib
 */

let JsonFormatEntrance = (function () {

    "use strict";

    let jfContent,
        jfPre,
        jfStyleEl,
        jfOptEl,
        jfPathEl,
        formattingMsg;

    let lastKvovIdGiven = 0;
    let cachedJsonString = '';

    let _initElements = function () {

        jfContent = $('#jfContent');
        if (!jfContent[0]) {
            jfContent = $('<div id="jfContent" />').appendTo('body');
        }

        jfPre = $('#jfContent_pre');
        if (!jfPre[0]) {
            jfPre = $('<pre id="jfContent_pre" />').appendTo('body');
        }

        jfStyleEl = $('#jfStyleEl');
        if (!jfStyleEl[0]) {
            jfStyleEl = $('<style id="jfStyleEl" />').appendTo('head');
        }

        formattingMsg = $('#formattingMsg');
        if (!formattingMsg[0]) {
            formattingMsg = $('<div id="formattingMsg"><span class="x-loading"></span>格式化中...</div>').appendTo('body');
        }

        jfOptEl = $('#boxOpt');
        if (!jfOptEl.length) {
            jfOptEl = $('<div id="boxOpt"><a class="opt-download" target="_blank">下载</a>|<a class="opt-copy">复制</a>|<a class="opt-del">删除</a></div>').appendTo('body');
        }

        try {
            jfContent.html('').show();
            jfPre.html('').hide();
            jfOptEl.hide();
            jfPathEl.hide();
            formattingMsg.hide();
        } catch (e) {
        }
    };

    // Add listener to receive response from BG when ready
    let postMessage = function (msg) {

        switch (msg[0]) {
            case 'NOT JSON' :
                jfPre.show();
                jfContent.html('<span class="x-json-tips">JSON不合法，请检查：</span>');
                break;

            case 'FORMATTING' :
                formattingMsg.show();
                break;

            case 'FORMATTED' :
                formattingMsg.hide();
                jfContent.html(msg[1]);

                _loadJs();
                _buildOptionBar();
                // 事件绑定
                _addEvents();
                // 支持文件下载
                _downloadSupport(cachedJsonString);

                break;

            default :
                throw new Error('Message not understood: ' + msg[0]);
        }
    };


    /**
     * 执行代码格式化
     * @param  {[type]} jsonStr [description]
     * @return {[type]}
     */
    let format = function (jsonStr) {
        cachedJsonString = JSON.stringify(JSON.parse(jsonStr), null, 4);

        _initElements();
        jfPre.html(cachedJsonString);

        JsonFormatDealer.postMessage({
            type: "SENDING TEXT",
            text: jsonStr,
            length: jsonStr.length
        });

    };

    let _loadJs = function () {
        if (typeof Tarp === 'object') {
            Tarp.require('../static/js/utils.js');
        } else {
            alert('无法加载Tarp.require.js');
        }
    };

    /**
     * 直接下载，能解决中文乱码
     * @param content
     * @private
     */
    let _downloadSupport = function (content) {

        // 下载链接
        let dt = (new Date()).format('yyyyMMddHHmmss');
        let blob = new Blob([content], {type: 'application/octet-stream'});

        let button = $('<button id="btnDownload">下载JSON</button>').appendTo('#optionBar');

        if (typeof chrome === 'undefined' || !chrome.permissions) {
            button.click(function (e) {
                let aLink = $('<a id="btnDownload" target="_blank" title="保存到本地">下载JSON数据</a>');
                aLink.attr('download', 'FeHelper-' + dt + '.json');
                aLink.attr('href', URL.createObjectURL(blob));
                aLink[0].click();
            });
        } else {
            button.click(function (e) {
                // 请求权限
                chrome.permissions.request({
                    permissions: ['downloads']
                }, (granted) => {
                    if (granted) {
                        chrome.downloads.download({
                            url: URL.createObjectURL(blob),
                            saveAs: true,
                            conflictAction: 'overwrite',
                            filename: 'FeHelper-' + dt + '.json'
                        });
                    } else {
                        alert('必须接受授权，才能正常下载！');
                    }
                });
            });
        }

    };


    /**
     * chrome 下复制到剪贴板
     * @param text
     */
    let _copyToClipboard = function (text) {
        let input = document.createElement('textarea');
        input.style.position = 'fixed';
        input.style.opacity = 0;
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('Copy');
        document.body.removeChild(input);

        alert('Json片段复制成功，随处粘贴可用！')
    };


    /**
     * 从el中获取json文本
     * @param el
     * @returns {string}
     */
    let getJsonText = function (el) {

        let txt = el.text().replace(/":\s/gm, '":').replace(/,$/, '').trim();
        if (!(/^{/.test(txt) && /\}$/.test(txt)) && !(/^\[/.test(txt) && /\]$/.test(txt))) {
            txt = '{' + txt + '}';
        }
        try {
            txt = JSON.stringify(JSON.parse(txt), null, 4);
        } catch (err) {
        }

        return txt;
    };

    /**
     * 给某个节点增加操作项
     * @param el
     * @private
     */
    let _addOptForItem = function (el) {

        // 下载json片段
        let fnDownload = function (ec) {

            let txt = getJsonText(el);
            // 下载片段
            let dt = (new Date()).format('yyyyMMddHHmmss');
            let blob = new Blob([txt], {type: 'application/octet-stream'});

            if (typeof chrome === 'undefined' || !chrome.permissions) {
                // 下载JSON的简单形式
                $(this).attr('download', 'FeHelper-' + dt + '.json').attr('href', URL.createObjectURL(blob));
            } else {
                // 请求权限
                chrome.permissions.request({
                    permissions: ['downloads']
                }, (granted) => {
                    if (granted) {
                        chrome.downloads.download({
                            url: URL.createObjectURL(blob),
                            saveAs: true,
                            conflictAction: 'overwrite',
                            filename: 'FeHelper-' + dt + '.json'
                        });
                    } else {
                        alert('必须接受授权，才能正常下载！');
                    }
                });
            }

        };

        // 复制json片段
        let fnCopy = function (ec) {
            _copyToClipboard(getJsonText(el));
        };

        // 删除json片段
        let fnDel = function (ed) {
            if (el.parent().is('#formattedJson')) {
                alert('如果连最外层的Json也删掉的话，就没啥意义了哦！');
                return false;
            }
            alert('节点已删除成功！');
            el.remove();
            jfOptEl.css('top', -1000).hide();
            jfPathEl.hide();
        };

        jfOptEl.find('a.opt-download').unbind('click').bind('click', fnDownload);
        jfOptEl.find('a.opt-copy').unbind('click').bind('click', fnCopy);
        jfOptEl.find('a.opt-del').unbind('click').bind('click', fnDel);

        jfOptEl.css({
            left: el.offset().left + el.width() - 90,
            top: el.offset().top
        }).show();
    };


    /**
     * 折叠所有
     * @param elements
     */
    function collapse(elements) {
        let el;

        $.each(elements, function (i) {
            el = $(this);
            if (el.children('.blockInner').length) {
                el.addClass('collapsed');

                if (!el.attr('id')) {
                    el.attr('id', 'kvov' + (++lastKvovIdGiven));

                    let count = el.children('.blockInner').eq(0).children().length;
                    // Generate comment text eg "4 items"
                    let comment = count + (count === 1 ? ' item' : ' items');
                    // Add CSS that targets it
                    jfStyleEl[0].insertAdjacentHTML(
                        'beforeend',
                        '\n#kvov' + lastKvovIdGiven + '.collapsed:after{color: #aaa; content:" // ' + comment + '"}'
                    );
                }

            }
        });
    }

    /**
     * 创建几个全局操作的按钮，置于页面右上角即可
     * @private
     */
    let _buildOptionBar = function () {

        let optionBar = $('#optionBar');
        if (optionBar) {
            optionBar.remove();
        }
        optionBar = $('<div id="optionBar" />').appendTo(jfContent.parent());

        let buttonFormatted = $('<button id="buttonFormatted" class="selected">元数据</button>').appendTo(optionBar);
        let buttonCollapseAll = $('<button id="buttonCollapseAll">折叠所有</button>').appendTo(optionBar);
        let plainOn = false;

        buttonFormatted.bind('click', function (e) {
            if (plainOn) {
                plainOn = false;
                jfPre.hide();
                jfContent.show();
                buttonFormatted.text('元数据');
            } else {
                plainOn = true;
                jfPre.show();
                jfContent.hide();
                buttonFormatted.text('格式化');
            }

            optionBar.find('button').removeClass('selected');
            buttonFormatted.addClass('selected');
            jfOptEl.hide();
            jfPathEl.hide();
        });

        buttonCollapseAll.bind('click', function (e) {
            // 如果内容还没有格式化过，需要再格式化一下
            if (plainOn) {
                buttonFormatted.trigger('click');
            }

            if (!plainOn) {
                if (buttonCollapseAll.text() === '折叠所有') {
                    buttonCollapseAll.text('展开所有');
                    collapse($('.objProp'));
                } else {
                    buttonCollapseAll.text('折叠所有');
                    $('.objProp').removeClass('collapsed');
                }

                optionBar.find('button').removeClass('selected');
                buttonCollapseAll.addClass('selected');
            }
            jfOptEl.hide();
            jfPathEl.hide();
        });

    };

    // 显示当前节点的Key
    let _showJsonKey = function (curEl) {
        let keys = [];
        do {
            if (curEl.hasClass('arrElem')) {
                if (!curEl.hasClass('rootKvov')) {
                    keys.unshift('[' + curEl.prevAll('.kvov').length + ']');
                }
            } else {
                keys.unshift(curEl.find('>.k').text());
            }

            if(curEl.parent().hasClass('rootKvov') || curEl.parent().parent().hasClass('rootKvov')) {
                break;
            }

            curEl = curEl.parent().parent();

        } while (curEl.length && !curEl.hasClass('rootKvov'));

        let path = keys.join('#@#').replace(/#@#\[/g, '[').replace(/#@#/g, '.');
        if (!jfPathEl) {
            jfPathEl = $('<div/>').css({
                position: 'fixed',
                bottom: 0,
                left: 0,
                background: 'rgb(0, 0, 0,0.6)',
                color: '#ff0',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '2px 10px 2px 2px'
            }).appendTo('body');
        }
        jfPathEl.html('当前路径：' + path).show();
    };

    // 附加操作
    let _addEvents = function () {

        // 折叠、展开
        $('#jfContent span.e').bind('click', function (ev) {
            ev.preventDefault();

            let parentEl = $(this).parent();
            parentEl.toggleClass('collapsed');

            if (parentEl.hasClass('collapsed')) {
                collapse(parentEl);
            }
        });

        // 点击选中：高亮
        $('#jfContent .kvov').bind('click', function (e) {

            if ($(this).hasClass('x-outline')) {
                jfOptEl.hide();
                jfPathEl.hide();
                $(this).removeClass('x-outline');
                e.stopPropagation();
                return true;
            }

            $('.x-outline').removeClass('x-outline');
            let el = $(this).removeClass('x-hover').addClass('x-outline');

            // 增加复制、删除功能
            _addOptForItem(el);
            // 显示key
            _showJsonKey(el);

            if (!$(e.target).is('.kvov .e')) {
                e.stopPropagation();
            } else {
                $(e.target).parent().trigger('click');
            }

            // 触发钩子
            if (typeof window._OnJsonItemClickByFH === 'function') {
                window._OnJsonItemClickByFH(getJsonText(el));
            }
        }).bind('mouseover', function (e) {
            $(this).addClass('x-hover');
            return false;
        }).bind('mouseout', function (e) {
            $(this).removeClass('x-hover');
        });

    };

    return {
        format: format,
        postMessage: postMessage
    }
})();


let JsonFormatDealer = (function () {

    "use strict";

    // Constants
    let
        TYPE_STRING = 1,
        TYPE_NUMBER = 2,
        TYPE_OBJECT = 3,
        TYPE_ARRAY = 4,
        TYPE_BOOL = 5,
        TYPE_NULL = 6
    ;

    // Utility functions
    function removeComments(str) {
        str = ('__' + str + '__').split('');
        let mode = {
            singleQuote: false,
            doubleQuote: false,
            regex: false,
            blockComment: false,
            lineComment: false,
            condComp: false
        };
        for (let i = 0, l = str.length; i < l; i++) {
            if (mode.regex) {
                if (str[i] === '/' && str[i - 1] !== '\\') {
                    mode.regex = false;
                }
                continue;
            }
            if (mode.singleQuote) {
                if (str[i] === "'" && str[i - 1] !== '\\') {
                    mode.singleQuote = false;
                }
                continue;
            }
            if (mode.doubleQuote) {
                if (str[i] === '"' && str[i - 1] !== '\\') {
                    mode.doubleQuote = false;
                }
                continue;
            }
            if (mode.blockComment) {
                if (str[i] === '*' && str[i + 1] === '/') {
                    str[i + 1] = '';
                    mode.blockComment = false;
                }
                str[i] = '';
                continue;
            }
            if (mode.lineComment) {
                if (str[i + 1] === '\n' || str[i + 1] === '\r') {
                    mode.lineComment = false;
                }
                str[i] = '';
                continue;
            }
            if (mode.condComp) {
                if (str[i - 2] === '@' && str[i - 1] === '*' && str[i] === '/') {
                    mode.condComp = false;
                }
                continue;
            }
            mode.doubleQuote = str[i] === '"';
            mode.singleQuote = str[i] === "'";
            if (str[i] === '/') {
                if (str[i + 1] === '*' && str[i + 2] === '@') {
                    mode.condComp = true;
                    continue;
                }
                if (str[i + 1] === '*') {
                    str[i] = '';
                    mode.blockComment = true;
                    continue;
                }
                if (str[i + 1] === '/') {
                    str[i] = '';
                    mode.lineComment = true;
                    continue;
                }
                mode.regex = true;
            }
        }
        return str.join('').slice(2, -2);
    }

    // Template elements
    let templates,
        baseDiv = document.createElement('div'),
        baseSpan = document.createElement('span');

    function getSpanBoth(innerText, className) {
        let span = baseSpan.cloneNode(false);
        span.className = className;
        span.innerText = innerText;
        return span;
    }

    function getSpanText(innerText) {
        let span = baseSpan.cloneNode(false);
        span.innerText = innerText;
        return span;
    }

    function getSpanClass(className) {
        let span = baseSpan.cloneNode(false);
        span.className = className;
        return span;
    }

    function getDivClass(className) {
        let span = baseDiv.cloneNode(false);
        span.className = className;
        return span;
    }

    // Create template nodes
    let templatesObj = {
        t_kvov: getDivClass('kvov'),
        t_key: getSpanClass('k'),
        t_string: getSpanClass('s'),
        t_number: getSpanClass('n'),
        t_exp: getSpanClass('e'),

        t_null: getSpanBoth('null', 'nl'),
        t_true: getSpanBoth('true', 'bl'),
        t_false: getSpanBoth('false', 'bl'),

        t_oBrace: getSpanBoth('{', 'b'),
        t_cBrace: getSpanBoth('}', 'b'),
        t_oBracket: getSpanBoth('[', 'b'),
        t_cBracket: getSpanBoth(']', 'b'),

        t_ellipsis: getSpanClass('ell'),
        t_blockInner: getSpanClass('blockInner'),

        t_colonAndSpace: document.createTextNode(':\u00A0'),
        t_commaText: document.createTextNode(','),
        t_dblqText: document.createTextNode('"')
    };

    // Core recursive DOM-building function
    function getKvovDOM(value, keyName) {
        let type,
            kvov,
            nonZeroSize,
            templates = templatesObj, // bring into scope for tiny speed boost
            objKey,
            keySpan,
            valueElement
        ;

        // Establish value type
        if (typeof value === 'string')
            type = TYPE_STRING;
        else if (typeof value === 'number')
            type = TYPE_NUMBER;
        else if (value === false || value === true)
            type = TYPE_BOOL;
        else if (value === null)
            type = TYPE_NULL;
        else if (value instanceof Array)
            type = TYPE_ARRAY;
        else
            type = TYPE_OBJECT;

        // Root node for this kvov
        kvov = templates.t_kvov.cloneNode(false);

        // Add an 'expander' first (if this is object/array with non-zero size)
        if (type === TYPE_OBJECT || type === TYPE_ARRAY) {

            if (typeof JSON.BigNumber === 'function' && value instanceof JSON.BigNumber) {
                value = JSON.stringify(value);
                type = TYPE_NUMBER;
            } else {
                nonZeroSize = false;
                for (objKey in value) {
                    if (value.hasOwnProperty(objKey)) {
                        nonZeroSize = true;
                        break; // no need to keep counting; only need one
                    }
                }
                if (nonZeroSize)
                    kvov.appendChild(templates.t_exp.cloneNode(true));
            }
        }

        // If there's a key, add that before the value
        if (keyName !== false) { // NB: "" is a legal keyname in JSON
            // This kvov must be an object property
            kvov.classList.add('objProp');
            // Create a span for the key name
            keySpan = templates.t_key.cloneNode(false);
            keySpan.textContent = JSON.stringify(keyName).slice(1, -1); // remove quotes
            // Add it to kvov, with quote marks
            kvov.appendChild(templates.t_dblqText.cloneNode(false));
            kvov.appendChild(keySpan);
            kvov.appendChild(templates.t_dblqText.cloneNode(false));
            // Also add ":&nbsp;" (colon and non-breaking space)
            kvov.appendChild(templates.t_colonAndSpace.cloneNode(false));
        }
        else {
            // This is an array element instead
            kvov.classList.add('arrElem');
        }

        // Generate DOM for this value
        let blockInner, childKvov;
        switch (type) {
            case TYPE_STRING:
                // If string is a URL, get a link, otherwise get a span
                let innerStringEl = baseSpan.cloneNode(false),
                    escapedString = JSON.stringify(value);
                escapedString = escapedString.substring(1, escapedString.length - 1); // remove quotes
                if (value[0] === 'h' && value.substring(0, 4) === 'http') { // crude but fast - some false positives, but rare, and UX doesn't suffer terribly from them.
                    let innerStringA = document.createElement('A');
                    innerStringA.href = value;
                    innerStringA.innerText = escapedString;
                    innerStringEl.appendChild(innerStringA);
                }
                else {
                    innerStringEl.innerText = escapedString;
                }
                valueElement = templates.t_string.cloneNode(false);
                valueElement.appendChild(templates.t_dblqText.cloneNode(false));
                valueElement.appendChild(innerStringEl);
                valueElement.appendChild(templates.t_dblqText.cloneNode(false));
                kvov.appendChild(valueElement);
                break;

            case TYPE_NUMBER:
                // Simply add a number element (span.n)
                valueElement = templates.t_number.cloneNode(false);
                valueElement.innerText = value;
                kvov.appendChild(valueElement);
                break;

            case TYPE_OBJECT:
                // Add opening brace
                kvov.appendChild(templates.t_oBrace.cloneNode(true));
                // If any properties, add a blockInner containing k/v pair(s)
                if (nonZeroSize) {
                    // Add ellipsis (empty, but will be made to do something when kvov is collapsed)
                    kvov.appendChild(templates.t_ellipsis.cloneNode(false));
                    // Create blockInner, which indents (don't attach yet)
                    blockInner = templates.t_blockInner.cloneNode(false);
                    // For each key/value pair, add as a kvov to blockInner
                    let count = 0, k, comma;
                    for (k in value) {
                        if (value.hasOwnProperty(k)) {
                            count++;
                            childKvov = getKvovDOM(value[k], k);
                            // Add comma
                            comma = templates.t_commaText.cloneNode();
                            childKvov.appendChild(comma);
                            blockInner.appendChild(childKvov);
                        }
                    }
                    // Now remove the last comma
                    childKvov.removeChild(comma);
                    // Add blockInner
                    kvov.appendChild(blockInner);
                }

                // Add closing brace
                kvov.appendChild(templates.t_cBrace.cloneNode(true));
                break;

            case TYPE_ARRAY:
                // Add opening bracket
                kvov.appendChild(templates.t_oBracket.cloneNode(true));
                // If non-zero length array, add blockInner containing inner vals
                if (nonZeroSize) {
                    // Add ellipsis
                    kvov.appendChild(templates.t_ellipsis.cloneNode(false));
                    // Create blockInner (which indents) (don't attach yet)
                    blockInner = templates.t_blockInner.cloneNode(false);
                    // For each key/value pair, add the markup
                    for (let i = 0, length = value.length, lastIndex = length - 1; i < length; i++) {
                        // Make a new kvov, with no key
                        childKvov = getKvovDOM(value[i], false);
                        // Add comma if not last one
                        if (i < lastIndex)
                            childKvov.appendChild(templates.t_commaText.cloneNode());
                        // Append the child kvov
                        blockInner.appendChild(childKvov);
                    }
                    // Add blockInner
                    kvov.appendChild(blockInner);
                }
                // Add closing bracket
                kvov.appendChild(templates.t_cBracket.cloneNode(true));
                break;

            case TYPE_BOOL:
                if (value)
                    kvov.appendChild(templates.t_true.cloneNode(true));
                else
                    kvov.appendChild(templates.t_false.cloneNode(true));
                break;

            case TYPE_NULL:
                kvov.appendChild(templates.t_null.cloneNode(true));
                break;
        }

        return kvov;
    }

    // Function to convert object to an HTML string
    function jsonObjToHTML(obj, jsonpFunctionName) {

        // spin(5) ;

        // Format object (using recursive kvov builder)
        let rootKvov = getKvovDOM(obj, false);

        // The whole DOM is now built.

        // Set class on root node to identify it
        rootKvov.classList.add('rootKvov');

        // Make div#formattedJson and append the root kvov
        let divFormattedJson = document.createElement('DIV');
        divFormattedJson.id = 'formattedJson';
        divFormattedJson.appendChild(rootKvov);

        // Convert it to an HTML string (shame about this step, but necessary for passing it through to the content page)
        let returnHTML = divFormattedJson.outerHTML;

        // Top and tail with JSONP padding if necessary
        if (jsonpFunctionName !== null) {
            returnHTML =
                '<div id="jsonpOpener">' + jsonpFunctionName + ' ( </div>' +
                returnHTML +
                '<div id="jsonpCloser">)</div>';
        }

        // Return the HTML
        return returnHTML;
    }

    // Listen for requests from content pages wanting to set up a port
    let postMessage = function (msg) {
        let jsonpFunctionName = null;

        if (msg.type === 'SENDING TEXT') {
            // Try to parse as JSON
            let obj,
                text = msg.text;
            try {
                obj = JSON.parse(text);
            }
            catch (e) {
                // Not JSON; could be JSONP though.

                // Try stripping 'padding' (if any), and try parsing it again
                text = text.trim();
                // Find where the first paren is (and exit if none)
                let indexOfParen;
                if (!(indexOfParen = text.indexOf('('))) {
                    JsonFormatEntrance.postMessage(['NOT JSON', 'no opening parenthesis']);
                    return;
                }

                // Get the substring up to the first "(", with any comments/whitespace stripped out
                let firstBit = removeComments(text.substring(0, indexOfParen)).trim();
                if (!firstBit.match(/^[a-zA-Z_$][\.\[\]'"0-9a-zA-Z_$]*$/)) {
                    // The 'firstBit' is NOT a valid function identifier.
                    JsonFormatEntrance.postMessage(['NOT JSON', 'first bit not a valid function name']);
                    return;
                }

                // Find last parenthesis (exit if none)
                let indexOfLastParen;
                if (!(indexOfLastParen = text.lastIndexOf(')'))) {
                    JsonFormatEntrance.postMessage(['NOT JSON', 'no closing paren']);
                    return;
                }

                // Check that what's after the last parenthesis is just whitespace, comments, and possibly a semicolon (exit if anything else)
                let lastBit = removeComments(text.substring(indexOfLastParen + 1)).trim();
                if (lastBit !== "" && lastBit !== ';') {
                    JsonFormatEntrance.postMessage(['NOT JSON', 'last closing paren followed by invalid characters']);
                    return;
                }

                // So, it looks like a valid JS function call, but we don't know whether it's JSON inside the parentheses...
                // Check if the 'argument' is actually JSON (and record the parsed result)
                text = text.substring(indexOfParen + 1, indexOfLastParen);
                try {
                    obj = JSON.parse(text);
                }
                catch (e2) {
                    // Just some other text that happens to be in a function call.
                    // Respond as not JSON, and exit
                    JsonFormatEntrance.postMessage(['NOT JSON', 'looks like a function call, but the parameter is not valid JSON']);
                    return;
                }

                jsonpFunctionName = firstBit;
            }

            // If still running, we now have obj, which is valid JSON.

            // Ensure it's not a number or string (technically valid JSON, but no point prettifying it)
            if (typeof obj !== 'object' && typeof obj !== 'array') {
                JsonFormatEntrance.postMessage(['NOT JSON', 'technically JSON but not an object or array']);
                return;
            }

            JsonFormatEntrance.postMessage(['FORMATTING']);

            try {
                // 有的页面设置了 安全策略，连localStorage都不能用，setTimeout开启多线程就更别说了
                localStorage.getItem('just test : Blocked script execution in xxx?');

                // 在非UI线程中操作：异步。。。
                setTimeout(function () {
                    // Do formatting
                    let html = jsonObjToHTML(obj, jsonpFunctionName);

                    // Post the HTML string to the content script
                    JsonFormatEntrance.postMessage(['FORMATTED', html]);
                }, 0);
            } catch (ex) {
                // 错误信息类似：Failed to read the 'localStorage' property from 'Window': The document is sandboxed and lacks the 'allow-same-origin' flag.
                let html = jsonObjToHTML(obj, jsonpFunctionName);
                JsonFormatEntrance.postMessage(['FORMATTED', html]);
            }

        }
    };

    return {
        postMessage: postMessage
    };
})();

module.exports = {
    format: JsonFormatEntrance.format
};