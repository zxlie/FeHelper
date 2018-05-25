/**
 * FeHelper Json Format Lib
 */

var JsonFormatEntrance = (function () {

    "use strict";

    var jfContent,
        pre,
        jfStyleEl,
        formattingMsg,
        slowAnalysisTimeout,
        isJsonTime,
        exitedNotJsonTime,
        displayedFormattedJsonTime
    ;

    // Add listener to receive response from BG when ready
    var postMessage = function (msg) {
        // console.log('Port msg received', msg[0], (""+msg[1]).substring(0,30)) ;

        switch (msg[0]) {
            case 'NOT JSON' :
                pre.style.display = "";
                // console.log('Unhidden the PRE') ;
                jfContent.innerHTML = '<span class="x-json-tips">JSON不合法，请检查：</span>';
                exitedNotJsonTime = +(new Date());
                break;

            case 'FORMATTING' :
                isJsonTime = +(new Date());

                // It is JSON, and it's now being formatted in the background worker.

                // Clear the slowAnalysisTimeout (if the BG worker had taken longer than 1s to respond with an answer to whether or not this is JSON, then it would have fired, unhiding the PRE... But now that we know it's JSON, we can clear this timeout, ensuring the PRE stays hidden.)
                clearTimeout(slowAnalysisTimeout);

                // Create option bar
                var optionBar = document.getElementById('optionBar');
                if (optionBar) {
                    optionBar.parentNode.removeChild(optionBar);
                }
                optionBar = document.createElement('div');
                optionBar.id = 'optionBar';

                // Create toggleFormat button
                var buttonFormatted = document.createElement('button'),
                    buttonCollapseAll = document.createElement('button');
                buttonFormatted.id = 'buttonFormatted';
                buttonFormatted.innerText = '元数据';
                buttonFormatted.classList.add('selected');
                buttonCollapseAll.id = 'buttonCollapseAll';
                buttonCollapseAll.innerText = '折叠所有';

                var plainOn = false;
                buttonFormatted.addEventListener('click', function () {
                    // When formatted button clicked...
                    if (plainOn) {
                        plainOn = false;
                        pre.style.display = "none";
                        jfContent.style.display = "block";
                        $(this).text('元数据');
                    } else {
                        plainOn = true;
                        pre.style.display = "block";
                        jfContent.style.display = "none";
                        $(this).text('格式化');
                    }

                    $(this).parent().find('button').removeClass('selected');
                    $(this).addClass('selected');
                    $('#boxOpt').hide();
                }, false);

                buttonCollapseAll.addEventListener('click', function () {
                    // 如果内容还没有格式化过，需要再格式化一下
                    if (plainOn) {
                        buttonFormatted.click();
                    }
                    // When collapaseAll button clicked...
                    if (!plainOn) {
                        if (buttonCollapseAll.innerText === '折叠所有') {
                            buttonCollapseAll.innerText = '展开所有';
                            collapse(document.getElementsByClassName('objProp'));
                        } else {
                            buttonCollapseAll.innerText = '折叠所有';
                            expand(document.getElementsByClassName('objProp'));
                        }

                        $(this).parent().find('button').removeClass('selected');
                        $(this).addClass('selected');
                    }
                    $('#boxOpt').hide();
                }, false);

                // Put it in optionBar
                optionBar.appendChild(buttonFormatted);
                optionBar.appendChild(buttonCollapseAll);

                // Attach event handlers
                document.addEventListener('click', generalClick, false);


                // Put option bar in DOM
                jfContent.parentNode.appendChild(optionBar);
                break;

            case 'FORMATTED' :
                // Insert HTML content
                formattingMsg.style.display = "";
                jfContent.innerHTML = msg[1];

                displayedFormattedJsonTime = +(new Date());

                break;

            default :
                throw new Error('Message not understood: ' + msg[0]);
        }
    };

    // console.timeEnd('established port') ;

    var lastKvovIdGiven = 0;

    function collapse(elements) {
        var el, i, blockInner, count;

        for (i = elements.length - 1; i >= 0; i--) {
            el = elements[i];
            el.classList.add('collapsed');

            // (CSS hides the contents and shows an ellipsis.)

            // Add a count of the number of child properties/items (if not already done for this item)
            if (!el.id) {
                el.id = 'kvov' + (++lastKvovIdGiven);

                // Find the blockInner
                blockInner = el.firstElementChild;
                while (blockInner && !blockInner.classList.contains('blockInner')) {
                    blockInner = blockInner.nextElementSibling;
                }
                if (!blockInner)
                    continue;

                // See how many children in the blockInner
                count = blockInner.children.length;

                // Generate comment text eg "4 items"
                var comment = count + (count === 1 ? ' item' : ' items');
                // Add CSS that targets it
                jfStyleEl.insertAdjacentHTML(
                    'beforeend',
                    '\n#kvov' + lastKvovIdGiven + '.collapsed:after{color: #aaa; content:" // ' + comment + '"}'
                );
            }
        }
    }

    function expand(elements) {
        for (var i = elements.length - 1; i >= 0; i--)
            elements[i].classList.remove('collapsed');
    }

    var mac = navigator.platform.indexOf('Mac') !== -1,
        modKey;
    if (mac)
        modKey = function (ev) {
            return ev.metaKey;
        };
    else
        modKey = function (ev) {
            return ev.ctrlKey;
        };

    function generalClick(ev) {
        // console.log('click', ev) ;

        if (ev.which === 1) {
            var elem = ev.target;

            if (elem.className === 'e') {
                // It's a click on an expander.

                ev.preventDefault();

                var parent = elem.parentNode,
                    div = jfContent,
                    prevBodyHeight = document.body.offsetHeight,
                    scrollTop = document.body.scrollTop,
                    parentSiblings
                ;

                // Expand or collapse
                if (parent.classList.contains('collapsed')) {
                    // EXPAND
                    if (modKey(ev))
                        expand(parent.parentNode.children);
                    else
                        expand([parent]);
                }
                else {
                    // COLLAPSE
                    if (modKey(ev))
                        collapse(parent.parentNode.children);
                    else
                        collapse([parent]);
                }

                // Restore scrollTop somehow
                // Clear current extra margin, if any
                div.style.marginBottom = 0;

                // No need to worry if all content fits in viewport
                if (document.body.offsetHeight < window.innerHeight) {
                    // console.log('document.body.offsetHeight < window.innerHeight; no need to adjust height') ;
                    return;
                }

                // And no need to worry if scrollTop still the same
                if (document.body.scrollTop === scrollTop) {
                    // console.log('document.body.scrollTop === scrollTop; no need to adjust height') ;
                    return;
                }

                // console.log('Scrolltop HAS changed. document.body.scrollTop is now '+document.body.scrollTop+'; was '+scrollTop) ;

                // The body has got a bit shorter.
                // We need to increase the body height by a bit (by increasing the bottom margin on the jfContent div). The amount to increase it is whatever is the difference between our previous scrollTop and our new one.

                // Work out how much more our target scrollTop is than this.
                var difference = scrollTop - document.body.scrollTop + 8; // it always loses 8px; don't know why

                // Add this difference to the bottom margin
                //var currentMarginBottom = parseInt(div.style.marginBottom) || 0 ;
                div.style.marginBottom = difference + 'px';

                // Now change the scrollTop back to what it was
                document.body.scrollTop = scrollTop;

                return;
            }
        }
    }

    /**
     * 执行代码格式化
     * @param  {[type]} jsonStr [description]
     * @return {[type]}
     */
    var format = function (jsonStr) {

        try {
            jfContent.innerHTML = '';
            pre.innerHTML = '';
            document.querySelector('#boxOpt').remove();
        } catch (e) {
        }

        // Send the contents of the PRE to the BG script
        // Add jfContent DIV, ready to display stuff
        jfContent = document.getElementById('jfContent');
        if (!jfContent) {
            jfContent = document.createElement('div');
            jfContent.id = 'jfContent';
            document.body.appendChild(jfContent);
        }
        jfContent.style.display = '';

        pre = document.getElementById('jfContent_pre');
        if (!pre) {
            pre = document.createElement('pre');
            pre.id = 'jfContent_pre';
            document.body.appendChild(pre);
        }
        pre.innerHTML = JSON.stringify(JSON.parse(jsonStr), null, 4);
        pre.style.display = "none";

        jfStyleEl = document.getElementById('jfStyleEl');
        if (!jfStyleEl) {
            jfStyleEl = document.createElement('style');
            document.head.appendChild(jfStyleEl);
        }

        formattingMsg = document.getElementById('formattingMsg');
        if (!formattingMsg) {
            formattingMsg = document.createElement('pre');
            formattingMsg.id = 'formattingMsg';
            formattingMsg.innerHTML = '<svg id="spinner" width="16" height="16" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" version="1.1">' +
                '<path d="M 150,0 a 150,150 0 0,1 106.066,256.066 l -35.355,-35.355 a -100,-100 0 0,0 -70.711,-170.711 z" fill="#3d7fe6"></path></svg> 格式化中...';
            document.body.appendChild(formattingMsg);
        }

        // Post the contents of the PRE
        JsonFormatDealer.postMessage({
            type: "SENDING TEXT",
            text: jsonStr,
            length: jsonStr.length
        });

        _loadJs();
        // 事件绑定
        _addEvents();
        // 支持文件下载
        _downloadSupport(JSON.stringify(JSON.parse(jsonStr), null, 4));
    };

    var _loadJs = function () {
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
    var _downloadSupport = function (content) {

        // 下载链接
        var localUrl = location.href;
        var dt = (new Date()).format('yyyyMMddHHmmss');
        content = ['/* ', localUrl, ' */', '\n', content].join('');
        var blob = new Blob([content], {type: 'application/octet-stream'});

        var button = $('<button id="btnDownload">下载JSON</button>').appendTo('#optionBar');

        if (typeof chrome === 'undefined' || !chrome.permissions) {
            button.click(function (e) {
                var aLink = $('<a id="btnDownload" target="_blank" title="保存到本地">下载JSON数据</a>');
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
    var _copyToClipboard = function (text) {
        var input = document.createElement('textarea');
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
    var getJsonText = function (el) {

        var txt = el.text().replace(/":\s/gm, '":').replace(/,$/, '').trim();
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
    var _addOptForItem = function (el) {

        // 下载json片段
        var fnDownload = function (ec) {

            var txt = getJsonText(el);
            // 下载片段
            var dt = (new Date()).format('yyyyMMddHHmmss');
            var blob = new Blob([txt], {type: 'application/octet-stream'});

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
        var fnCopy = function (ec) {
            _copyToClipboard(getJsonText(el));
        };

        // 删除json片段
        var fnDel = function (ed) {
            if (el.parent().is('#formattedJson')) {
                alert('如果连最外层的Json也删掉的话，就没啥意义了哦！');
                return false;
            }
            alert('节点已删除成功！');
            el.remove();
            boxOpt.css('top', -1000).hide();
        };

        var boxOpt = $('#boxOpt');
        if (!boxOpt.length) {
            boxOpt = $('<div id="boxOpt"><a class="opt-download" target="_blank">下载</a>|<a class="opt-copy">复制</a>|<a class="opt-del">删除</a></div>').appendTo('body');
        }

        boxOpt.find('a.opt-download').unbind('click').bind('click', fnDownload);
        boxOpt.find('a.opt-copy').unbind('click').bind('click', fnCopy);
        boxOpt.find('a.opt-del').unbind('click').bind('click', fnDel);

        boxOpt.css({
            left: el.offset().left + el.width() - 90,
            top: el.offset().top
        }).show();
    };

    // 附加操作
    var _addEvents = function () {
        $('#jfContent .kvov').bind('click', function (e) {
            if ($(this).hasClass('x-outline')) {
                $('#boxOpt').remove();
                $(this).removeClass('x-outline');
                return false;
            }

            $('.x-outline').removeClass('x-outline');
            var el = $(this).removeClass('x-hover').addClass('x-outline');

            // 增加复制、删除功能
            _addOptForItem(el);

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

var JsonFormatDealer = (function () {

    "use strict";

    // Constants
    var
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
        var mode = {
            singleQuote: false,
            doubleQuote: false,
            regex: false,
            blockComment: false,
            lineComment: false,
            condComp: false
        };
        for (var i = 0, l = str.length; i < l; i++) {
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

    // function spin(seconds) {
    //   // spin - Hog the CPU for the specified number of seconds
    //   // (for simulating long processing times in development)
    //   var stop = +new Date() + (seconds*1000)  ;
    //   while (new Date() < stop) {}
    //   return true ;
    // }

    // Record current version (in case future update wants to know)
    localStorage.jfVersion = '0.5.6';

    // Template elements
    var templates,
        baseDiv = document.createElement('div'),
        baseSpan = document.createElement('span');

    function getSpanBoth(innerText, className) {
        var span = baseSpan.cloneNode(false);
        span.className = className;
        span.innerText = innerText;
        return span;
    }

    function getSpanText(innerText) {
        var span = baseSpan.cloneNode(false);
        span.innerText = innerText;
        return span;
    }

    function getSpanClass(className) {
        var span = baseSpan.cloneNode(false);
        span.className = className;
        return span;
    }

    function getDivClass(className) {
        var span = baseDiv.cloneNode(false);
        span.className = className;
        return span;
    }

    // Create template nodes
    var templatesObj = {
        t_kvov: getDivClass('kvov'),
        t_exp: getSpanClass('e'),
        t_key: getSpanClass('k'),
        t_string: getSpanClass('s'),
        t_number: getSpanClass('n'),

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
        var type,
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
                    kvov.appendChild(templates.t_exp.cloneNode(false));
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
        var blockInner, childKvov;
        switch (type) {
            case TYPE_STRING:
                // If string is a URL, get a link, otherwise get a span
                var innerStringEl = baseSpan.cloneNode(false),
                    escapedString = JSON.stringify(value);
                escapedString = escapedString.substring(1, escapedString.length - 1); // remove quotes
                if (value[0] === 'h' && value.substring(0, 4) === 'http') { // crude but fast - some false positives, but rare, and UX doesn't suffer terribly from them.
                    var innerStringA = document.createElement('A');
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
                    var count = 0, k, comma;
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
                    for (var i = 0, length = value.length, lastIndex = length - 1; i < length; i++) {
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
        var rootKvov = getKvovDOM(obj, false);

        // The whole DOM is now built.

        // Set class on root node to identify it
        rootKvov.classList.add('rootKvov');

        // Make div#formattedJson and append the root kvov
        var divFormattedJson = document.createElement('DIV');
        divFormattedJson.id = 'formattedJson';
        divFormattedJson.appendChild(rootKvov);

        // Convert it to an HTML string (shame about this step, but necessary for passing it through to the content page)
        var returnHTML = divFormattedJson.outerHTML;

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
    var postMessage = function (msg) {
        var jsonpFunctionName = null;

        if (msg.type === 'SENDING TEXT') {
            // Try to parse as JSON
            var obj,
                text = msg.text;
            try {
                obj = JSON.parse(text);
            }
            catch (e) {
                // Not JSON; could be JSONP though.

                // Try stripping 'padding' (if any), and try parsing it again
                text = text.trim();
                // Find where the first paren is (and exit if none)
                var indexOfParen;
                if (!(indexOfParen = text.indexOf('('))) {
                    JsonFormatEntrance.postMessage(['NOT JSON', 'no opening parenthesis']);
                    return;
                }

                // Get the substring up to the first "(", with any comments/whitespace stripped out
                var firstBit = removeComments(text.substring(0, indexOfParen)).trim();
                if (!firstBit.match(/^[a-zA-Z_$][\.\[\]'"0-9a-zA-Z_$]*$/)) {
                    // The 'firstBit' is NOT a valid function identifier.
                    JsonFormatEntrance.postMessage(['NOT JSON', 'first bit not a valid function name']);
                    return;
                }

                // Find last parenthesis (exit if none)
                var indexOfLastParen;
                if (!(indexOfLastParen = text.lastIndexOf(')'))) {
                    JsonFormatEntrance.postMessage(['NOT JSON', 'no closing paren']);
                    return;
                }

                // Check that what's after the last parenthesis is just whitespace, comments, and possibly a semicolon (exit if anything else)
                var lastBit = removeComments(text.substring(indexOfLastParen + 1)).trim();
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

            // And send it the message to confirm that we're now formatting (so it can show a spinner)
            JsonFormatEntrance.postMessage(['FORMATTING' /*, JSON.stringify(localStorage)*/]);

            // Do formatting
            var html = jsonObjToHTML(obj, jsonpFunctionName);

            // Post the HTML string to the content script
            JsonFormatEntrance.postMessage(['FORMATTED', html]);

        }
    };

    return {
        postMessage: postMessage
    };
})();

module.exports = {
    format: JsonFormatEntrance.format
};