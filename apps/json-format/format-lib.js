/**
 * 日期格式化
 * @param {Object} pattern
 */
Date.prototype.format = function (pattern) {
    let pad = function (source, length) {
        let pre = "",
            negative = (source < 0),
            string = String(Math.abs(source));

        if (string.length < length) {
            pre = (new Array(length - string.length + 1)).join('0');
        }

        return (negative ? "-" : "") + pre + string;
    };

    if ('string' !== typeof pattern) {
        return this.toString();
    }

    let replacer = function (patternPart, result) {
        pattern = pattern.replace(patternPart, result);
    };

    let year = this.getFullYear(),
        month = this.getMonth() + 1,
        date2 = this.getDate(),
        hours = this.getHours(),
        minutes = this.getMinutes(),
        seconds = this.getSeconds(),
        milliSec = this.getMilliseconds();

    replacer(/yyyy/g, pad(year, 4));
    replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
    replacer(/MM/g, pad(month, 2));
    replacer(/M/g, month);
    replacer(/dd/g, pad(date2, 2));
    replacer(/d/g, date2);

    replacer(/HH/g, pad(hours, 2));
    replacer(/H/g, hours);
    replacer(/hh/g, pad(hours % 12, 2));
    replacer(/h/g, hours % 12);
    replacer(/mm/g, pad(minutes, 2));
    replacer(/m/g, minutes);
    replacer(/ss/g, pad(seconds, 2));
    replacer(/s/g, seconds);
    replacer(/SSS/g, pad(milliSec, 3));
    replacer(/S/g, milliSec);

    return pattern;
};

/**
 * 自动消失的Alert弹窗
 * @param content
 */
window.toast = function (content) {
    window.clearTimeout(window.feHelperAlertMsgTid);
    let elAlertMsg = document.querySelector("#fehelper_alertmsg");
    if (!elAlertMsg) {
        let elWrapper = document.createElement('div');
        elWrapper.innerHTML = '<div id="fehelper_alertmsg" style="position:fixed;bottom:25px;left:5px;z-index:1000000">' +
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
    }, 1000);
};


/**
 * FeHelper Json Format Lib，入口文件
 * @example
 *  Formatter.format(jsonString)
 */
window.Formatter = (function () {

    "use strict";

    let jfContent,
        jfPre,
        jfStyleEl,
        jfStatusBar,
        formattingMsg;

    let lastItemIdGiven = 0;
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

        try {
            jfContent.html('').show();
            jfPre.html('').hide();
            jfStatusBar && jfStatusBar.hide();
            formattingMsg.hide();
        } catch (e) {
        }
    };

    /**
     * HTML特殊字符格式化
     * @param str
     * @returns {*}
     */
    let htmlspecialchars = function (str) {
        str = str.replace(/&/g, '&amp;');
        str = str.replace(/</g, '&lt;');
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/"/g, '&quot;');
        str = str.replace(/'/g, '&#039;');
        return str;
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

        let button = $('<button class="xjf-btn xjf-btn-right">下载JSON</button>').appendTo('#optionBar');

        if (typeof chrome === 'undefined' || !chrome.permissions) {
            button.click(function (e) {
                let aLink = $('#aLinkDownload');
                if (!aLink[0]) {
                    aLink = $('<a id="aLinkDownload" target="_blank" title="保存到本地">下载JSON数据</a>').appendTo('body');
                    aLink.attr('download', 'FeHelper-' + dt + '.json');
                    aLink.attr('href', URL.createObjectURL(blob));
                }
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
                        toast('必须接受授权，才能正常下载！');
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

        toast('Json片段复制成功，随处粘贴可用！')
    };


    /**
     * 从el中获取json文本
     * @param el
     * @returns {string}
     */
    let getJsonText = function (el) {

        let txt = el.text().replace(/复制\|下载\|删除/gm,'').replace(/":\s/gm, '":').replace(/,$/, '').trim();
        if (!(/^{/.test(txt) && /\}$/.test(txt)) && !(/^\[/.test(txt) && /\]$/.test(txt))) {
            txt = '{' + txt + '}';
        }
        try {
            txt = JSON.stringify(JSON.parse(txt), null, 4);
        } catch (err) {
        }

        return txt;
    };

    // 添加json路径
    let _showJsonPath = function (curEl) {
        let keys = [];
        do {
            if (curEl.hasClass('item-block')) {
                if (!curEl.hasClass('rootItem')) {
                    keys.unshift('[' + curEl.prevAll('.item').length + ']');
                } else {
                    break;
                }
            } else {
                keys.unshift(curEl.find('>.key').text());
            }

            if (curEl.parent().hasClass('rootItem') || curEl.parent().parent().hasClass('rootItem')) {
                break;
            }

            curEl = curEl.parent().parent();

        } while (curEl.length && !curEl.hasClass('rootItem'));

        let path = keys.join('#@#').replace(/#@#\[/g, '[').replace(/#@#/g, '.');

        let jfPath = $('#jsonPath');
        if (!jfPath.length) {
            jfPath = $('<span id="jsonPath"/>').prependTo(jfStatusBar);
        }
        jfPath.html('当前节点：JSON.' + path);
    };

    // 给某个节点增加操作项
    let _addOptForItem = function (el, show) {

        // 下载json片段
        let fnDownload = function (event) {
            event.stopPropagation();

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
                        toast('必须接受授权，才能正常下载！');
                    }
                });
            }

        };

        // 复制json片段
        let fnCopy = function (event) {
            event.stopPropagation();
            _copyToClipboard(getJsonText(el));
        };

        // 删除json片段
        let fnDel = function (event) {
            event.stopPropagation();
            if (el.parent().is('#formattedJson')) {
                toast('如果连最外层的Json也删掉的话，就没啥意义了哦！');
                return false;
            }
            toast('节点已删除成功！');
            el.remove();
            jfStatusBar && jfStatusBar.hide();
        };

        $('.boxOpt').hide();
        if (show) {
            let jfOptEl = el.children('.boxOpt');
            if (!jfOptEl.length) {
                jfOptEl = $('<b class="boxOpt">' +
                    '<a class="opt-copy" title="复制当前选中节点的JSON数据">复制</a>|' +
                    '<a class="opt-download" target="_blank" title="下载当前选中节点的JSON数据">下载</a>|' +
                    '<a class="opt-del" title="删除当前选中节点的JSON数据">删除</a></b>').appendTo(el);
            } else {
                jfOptEl.show();
            }

            jfOptEl.find('a.opt-download').unbind('click').bind('click', fnDownload);
            jfOptEl.find('a.opt-copy').unbind('click').bind('click', fnCopy);
            jfOptEl.find('a.opt-del').unbind('click').bind('click', fnDel);
        }

    };

    // 显示当前节点的Key
    let _toogleStatusBar = function (curEl, show) {
        if (!jfStatusBar) {
            jfStatusBar = $('<div id="statusBar"/>').appendTo('body');
        }

        if (!show) {
            jfStatusBar.hide();
            return;
        } else {
            jfStatusBar.show();
        }

        _showJsonPath(curEl);
    };


    /**
     * 折叠所有
     * @param elements
     */
    function collapse(elements) {
        let el;

        $.each(elements, function (i) {
            el = $(this);
            if (el.children('.kv-list').length) {
                el.addClass('collapsed');

                if (!el.attr('id')) {
                    el.attr('id', 'item' + (++lastItemIdGiven));

                    let count = el.children('.kv-list').eq(0).children().length;
                    // Generate comment text eg "4 items"
                    let comment = count + (count === 1 ? ' item' : ' items');
                    // Add CSS that targets it
                    jfStyleEl[0].insertAdjacentHTML(
                        'beforeend',
                        '\n#item' + lastItemIdGiven + '.collapsed:after{color: #aaa; content:" // ' + comment + '"}'
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
        if (optionBar.length) {
            optionBar.html('');
        } else {
            optionBar = $('<span id="optionBar" />').appendTo(jfContent.parent());
        }

        $('<span class="x-split">|</span>').appendTo(optionBar);
        let buttonFormatted = $('<button class="xjf-btn xjf-btn-left">元数据</button>').appendTo(optionBar);
        let buttonCollapseAll = $('<button class="xjf-btn xjf-btn-mid">折叠所有</button>').appendTo(optionBar);
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

            jfStatusBar && jfStatusBar.hide();
        });

        buttonCollapseAll.bind('click', function (e) {
            // 如果内容还没有格式化过，需要再格式化一下
            if (plainOn) {
                buttonFormatted.trigger('click');
            }

            if (buttonCollapseAll.text() === '折叠所有') {
                buttonCollapseAll.text('展开所有');
                collapse($('.item-object,.item-block'));
            } else {
                buttonCollapseAll.text('折叠所有');
                $('.item-object,.item-block').removeClass('collapsed');
            }
            jfStatusBar && jfStatusBar.hide();
        });

    };

    // 附加操作
    let _addEvents = function () {

        // 折叠、展开
        $('#jfContent span.expand').bind('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();

            let parentEl = $(this).parent();
            parentEl.toggleClass('collapsed');

            if (parentEl.hasClass('collapsed')) {
                collapse(parentEl);
            }
        });

        // 点击选中：高亮
        $('#jfContent .item').bind('click', function (e) {

            let el = $(this);

            if (el.hasClass('x-selected')) {
                _toogleStatusBar(el, false);
                _addOptForItem(el, false);
                el.removeClass('x-selected');
                e.stopPropagation();
                return true;
            }

            $('.x-selected').removeClass('x-selected');
            el.addClass('x-selected');

            // 显示底部状态栏
            _toogleStatusBar(el, true);
            _addOptForItem(el, true);

            if (!$(e.target).is('.item .expand')) {
                e.stopPropagation();
            } else {
                $(e.target).parent().trigger('click');
            }

            // 触发钩子
            if (typeof window._OnJsonItemClickByFH === 'function') {
                window._OnJsonItemClickByFH(getJsonText(el));
            }
        });

    };

    /**
     * 执行代码格式化
     */
    let format = function (jsonStr, skin) {
        cachedJsonString = JSON.stringify(JSON.parse(jsonStr), null, 4);

        _initElements();
        jfPre.html(htmlspecialchars(cachedJsonString));

        // 用webwork的方式来进行格式化，效率更高
        let worker = new Worker(URL.createObjectURL(new Blob(["(" + JsonFormatWebWorker.toString() + ")()"], {type: 'text/javascript'})));
        worker.onmessage = function (evt) {
            let msg = evt.data;
            switch (msg[0]) {
                case 'FORMATTING' :
                    formattingMsg.show();
                    break;

                case 'FORMATTED' :
                    formattingMsg.hide();
                    jfContent.html(msg[1]);

                    _buildOptionBar();
                    // 事件绑定
                    _addEvents();
                    // 支持文件下载
                    _downloadSupport(cachedJsonString);

                    break;
            }
        };
        worker.postMessage({
            jsonString: jsonStr,
            skin: skin
        });
    };

    // 同步的方式格式化
    let formatSync = function (jsonStr, skin) {
        cachedJsonString = JSON.stringify(JSON.parse(jsonStr), null, 4);

        _initElements();
        jfPre.html(htmlspecialchars(cachedJsonString));
        let worker = new JsonFormatWebWorker(true);
        worker.getFormattedHtml({
            data: {
                jsonString: jsonStr,
                skin: skin
            },
            onFormatting: function (msg) {
                formattingMsg.show();
            },
            onFormatted: function (msg) {
                formattingMsg.hide();
                jfContent.html(msg[1]);

                _buildOptionBar();
                // 事件绑定
                _addEvents();
                // 支持文件下载
                _downloadSupport(cachedJsonString);
            }
        });
    };

    return {
        format: format,
        formatSync: formatSync
    }
})();


/*============================================== web worker =========================================================*/

/**
 * 用webworker的形式来进行json格式化，在应对大json的时候，效果会非常明显
 * @constructor
 */
var JsonFormatWebWorker = function (isUnSupportWorker = false) {

    // 引入big-json.js解决大数字的问题
    let __importScript = (filename) => {
        this.compress && fetch(filename).then(resp => resp.text()).then(jsText => eval(jsText));
    };
    __importScript('json-bigint.js');

    // Constants
    let
        TYPE_STRING = 1,
        TYPE_NUMBER = 2,
        TYPE_OBJECT = 3,
        TYPE_ARRAY = 4,
        TYPE_BOOL = 5,
        TYPE_NULL = 6;

    /**
     * HTML特殊字符格式化
     * @param str
     * @returns {*}
     */
    let htmlspecialchars = function (str) {
        str = str.replace(/&/g, '&amp;');
        str = str.replace(/</g, '&lt;');
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/"/g, '&quot;');
        str = str.replace(/'/g, '&#039;');
        return str;
    };

    /**
     * FH 虚拟DOM
     * @constructor
     */
    let FhVDom = function () {

        this._id = 'fhvd_' + (new Date * 1);
        this.tag = '';
        this.innerText = '';
        this.textContent = '';
        this.childNodes = [];
        this.className = '';
        this.attributes = [];
        this.classList = [];
        this.classList.__proto__.add = this.classList.__proto__.push;

        this.createElement = tag => {
            this.tag = tag;
            return this;
        };

        this.setAttribute = (attr, value) => {
            this.attributes.push([attr, value]);
        };

        this.appendChild = child => {
            this.childNodes.push(child);
            return this;
        };

        this.getOuterHTML = () => {
            let outerHtml = [];
            if (this.tag) {
                outerHtml.push(`<${this.tag}`);
                let clsName = (this.className || '') + ' ' + this.classList.join(' ');
                clsName.replace(/\s/g, '').length && outerHtml.push(` class="${clsName}"`);
                this.attributes.length && outerHtml.push(this.attributes.map(attr => ` ${attr[0]}="${attr[1]}"`).join(''));
                outerHtml.push(`>`);
                if (('' + this.innerText).length) {
                    outerHtml.push(this.innerText);
                } else if (('' + this.textContent).length) {
                    outerHtml.push(this.textContent);
                } else {
                    outerHtml.push(this.childNodes.map(node => node.getOuterHTML()).join(''))
                }
                outerHtml.push(`</${this.tag}>`);
            } else {
                if (('' + this.innerText).length) {
                    outerHtml.push(this.innerText);
                } else if (('' + this.textContent).length) {
                    outerHtml.push(this.textContent);
                }
            }
            return outerHtml.join('');
        };

        this.cloneNode = (deep) => {
            let newDom = FhVDom.getInstance();
            newDom.tag = this.tag;
            if (deep || !this.tag) {
                newDom.innerText = this.innerText;
                newDom.textContent = this.textContent;
            } else {
                newDom.innerText = '';
                newDom.textContent = '';
            }
            newDom.className = this.className;
            newDom.classList = Array.from(this.classList);
            newDom.attributes = Array.from(this.attributes);
            return newDom;
        };
    };

    // 构造器
    FhVDom.getInstance = () => new FhVDom();

    function createSpanNode(innerText, className) {
        let span = FhVDom.getInstance().createElement('span');
        span.className = className || '';
        span.innerText = innerText || '';
        return span;
    }

    function createDivNode(className) {
        let div = FhVDom.getInstance().createElement('div');
        div.className = className || '';
        return div;
    }

    // Create template nodes
    let templatesObj = {
        t_item: createDivNode('item'),
        t_key: createSpanNode('', 'key'),
        t_string: createSpanNode('', 'string'),
        t_number: createSpanNode('', 'number'),
        t_exp: createSpanNode('', 'expand'),

        t_null: createSpanNode('null', 'null'),
        t_true: createSpanNode('true', 'bool'),
        t_false: createSpanNode('false', 'bool'),

        t_oBrace: createSpanNode('{', 'brace'),
        t_cBrace: createSpanNode('}', 'brace'),
        t_oBracket: createSpanNode('[', 'brace'),
        t_cBracket: createSpanNode(']', 'brace'),

        t_ellipsis: createSpanNode('', 'ellipsis'),
        t_kvList: createDivNode('kv-list'),

        t_colonAndSpace: createSpanNode(':\u00A0', 'colon'),
        t_commaText: createSpanNode(',', 'comma'),
        t_dblqText: createSpanNode('"', 'quote')
    };

    // Core recursive DOM-building function
    function getItemDOM(value, keyName) {
        let type,
            item,
            nonZeroSize,
            templates = templatesObj,
            objKey,
            keySpan,
            valueElement;

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

        item = templates.t_item.cloneNode(false);

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
                    item.appendChild(templates.t_exp.cloneNode(true));
            }
        }

        // If there's a key, add that before the value
        if (keyName !== false) { // NB: "" is a legal keyname in JSON
            item.classList.add(type === TYPE_OBJECT ? 'item-object' : type === TYPE_ARRAY ? 'item-array' : 'item-line');
            keySpan = templates.t_key.cloneNode(false);
            keySpan.textContent = JSON.stringify(keyName).slice(1, -1); // remove quotes
            item.appendChild(templates.t_dblqText.cloneNode(true));
            item.appendChild(keySpan);
            item.appendChild(templates.t_dblqText.cloneNode(true));
            item.appendChild(templates.t_colonAndSpace.cloneNode(true));
        }
        else {
            item.classList.add('item-block');
        }

        let kvList, childItem;
        switch (type) {
            case TYPE_STRING:
                let innerStringEl = FhVDom.getInstance().createElement('span'),
                    escapedString = JSON.stringify(value);
                escapedString = escapedString.substring(1, escapedString.length - 1); // remove quotes
                let isLink = false;
                if (/^[\w]+:\/\//.test(value)) {
                    try {
                        let url = new URL(value);
                        let innerStringA = FhVDom.getInstance().createElement('A');
                        innerStringA.setAttribute('href', url.href);
                        innerStringA.setAttribute('target', '_blank');
                        innerStringA.innerText = htmlspecialchars(escapedString);
                        innerStringEl.appendChild(innerStringA);
                        isLink = true;
                    } catch (e) {
                    }
                }

                if (!isLink) {
                    innerStringEl.innerText = htmlspecialchars(escapedString);
                }
                valueElement = templates.t_string.cloneNode(false);
                valueElement.appendChild(templates.t_dblqText.cloneNode(true));
                valueElement.appendChild(innerStringEl);
                valueElement.appendChild(templates.t_dblqText.cloneNode(true));
                item.appendChild(valueElement);
                break;

            case TYPE_NUMBER:
                valueElement = templates.t_number.cloneNode(false);
                valueElement.innerText = value;
                item.appendChild(valueElement);
                break;

            case TYPE_OBJECT:
                // Add opening brace
                item.appendChild(templates.t_oBrace.cloneNode(true));
                if (nonZeroSize) {
                    item.appendChild(templates.t_ellipsis.cloneNode(false));
                    kvList = templates.t_kvList.cloneNode(false);
                    let keys = Object.keys(value).filter(k => value.hasOwnProperty(k));
                    keys.forEach((k, index) => {
                        childItem = getItemDOM(value[k], k);
                        if (index < keys.length - 1) {
                            childItem.appendChild(templates.t_commaText.cloneNode(true));
                        }
                        kvList.appendChild(childItem);
                    });
                    item.appendChild(kvList);
                }

                // Add closing brace
                item.appendChild(templates.t_cBrace.cloneNode(true));
                break;

            case TYPE_ARRAY:
                item.appendChild(templates.t_oBracket.cloneNode(true));
                if (nonZeroSize) {
                    item.appendChild(templates.t_ellipsis.cloneNode(false));
                    kvList = templates.t_kvList.cloneNode(false);
                    for (let i = 0, length = value.length, lastIndex = length - 1; i < length; i++) {
                        childItem = getItemDOM(value[i], false);
                        if (i < lastIndex)
                            childItem.appendChild(templates.t_commaText.cloneNode(true));
                        kvList.appendChild(childItem);
                    }
                    item.appendChild(kvList);
                }
                // Add closing bracket
                item.appendChild(templates.t_cBracket.cloneNode(true));
                break;

            case TYPE_BOOL:
                if (value)
                    item.appendChild(templates.t_true.cloneNode(true));
                else
                    item.appendChild(templates.t_false.cloneNode(true));
                break;

            case TYPE_NULL:
                item.appendChild(templates.t_null.cloneNode(true));
                break;
        }

        return item;
    }

    // Listen for requests from content pages wanting to set up a port
    // isUnSupportWorker 为true时，表示不支持webworker，不需要监听消息
    if (!isUnSupportWorker) {
        self.onmessage = function (event) {
            // 插件在乎的是json字符串，所以只有json字符串时才进行格式化
            if (event.data.jsonString) {
                self.postMessage(['FORMATTING']);
                let rootItem;
                if (event.data.skin && event.data.skin === 'theme-simple') {
                    rootItem = createDivNode('rootItem');
                    rootItem.textContent = JSON.stringify(JSON.parse(event.data.jsonString), null, 4);
                } else {
                    rootItem = getItemDOM(JSON.parse(event.data.jsonString), false);
                    rootItem.classList.add('rootItem');
                }
                let formattedHtml = `<div id="formattedJson">${rootItem.getOuterHTML()}</div>`;
                self.postMessage(['FORMATTED', formattedHtml]);
            }
        };
    }

    // 针对不支持webworker的情况，允许直接调用
    this.getFormattedHtml = function (options) {
        options.onFormatting && options.onFormatting(['FORMATTING']);
        let rootItem;
        if (options.data.skin && options.data.skin === 'theme-simple') {
            rootItem = createDivNode('rootItem');
            rootItem.textContent = JSON.stringify(JSON.parse(options.data.jsonString), null, 4);
        } else {
            rootItem = getItemDOM(JSON.parse(options.data.jsonString), false);
            rootItem.classList.add('rootItem');
        }
        let formattedHtml = `<div id="formattedJson">${rootItem.getOuterHTML()}</div>`;
        options.onFormatted && options.onFormatted(['FORMATTED', formattedHtml]);
    };
};
