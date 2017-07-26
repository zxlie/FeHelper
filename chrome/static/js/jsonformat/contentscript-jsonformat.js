/**
 * content_scripts中如果被检测到当前页面内容为json数据，则自动进行JSON格式化
 */
baidu.csJsonFormat = (function () {

    "use strict";

    var _htmlFragment = [
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

    var _loadCss = function () {
        var fcpCss = chrome.extension.getURL('static/css/fe-jsonformat-content.css');
        jQuery('<link id="_fehelper_fcp_css_" href="' + fcpCss + '" rel="stylesheet" type="text/css" />').appendTo('head');
    };

    /**
     * 从页面提取JSON文本
     * @returns {string}
     * @private
     */
    var _getJsonText = function () {

        var pre = $('body>pre:eq(0)')[0] || {textContent: ""};
        var source = $.trim(pre.textContent);
        if (!source) {
            source = $.trim(document.body.textContent || '')
        }
        if (!source) {
            return false;
        }

        // 如果body的内容还包含HTML标签，肯定不是合法的json了
        // 如果是合法的json，也只可能有一个text节点
        var nodes = document.body.childNodes;
        var newSource = '';
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (nodes[i].nodeType == Node.TEXT_NODE) {
                newSource += nodes[i].textContent;
            } else if (nodes[i].nodeType == Node.ELEMENT_NODE) {
                var tagName = nodes[i].tagName.toLowerCase();
                var html = $.trim(nodes[i].textContent);
                // 如果是pre标签，则看内容是不是和source一样，一样则continue
                if (tagName === 'pre' && html === source) {
                    continue;
                } else if ((nodes[i].offsetWidth === 0 || nodes[i].offsetHeight === 0 || !html) && ['script','link'].indexOf(tagName) == -1) {
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
    var _uniDecode = function (text) {
        text = text.replace(/\\/g, "%").replace('%U', '%u').replace('%u0025', '%25');

        text = unescape(text.toString().replace(/%2B/g, "+"));
        var matches = text.match(/(%u00([0-9A-F]{2}))/gi);
        if (matches) {
            for (var matchid = 0; matchid < matches.length; matchid++) {
                var code = matches[matchid].substring(1, 3);
                var x = Number("0x" + code);
                if (x >= 128) {
                    text = text.replace(matches[matchid], code);
                }
            }
        }
        text = unescape(text.toString().replace(/%2B/g, "+"));

        return text;
    };

    /**
     * chrome 下复制到剪贴板
     * @param text
     */
    var _copyToClipboard = function (text) {
        const input = document.createElement('textarea');
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
     * 给某个节点增加操作项
     * @param el
     * @private
     */
    var _addOptForItem = function (el) {

        // 复制json片段
        var fnCopy = function (ec) {
            var txt = el.text().replace(/":\s/gm, '":').replace(/,$/, '').trim();
            if (!(/^{/.test(txt) && /\}$/.test(txt)) && !(/^\[/.test(txt) && /\]$/.test(txt))) {
                txt = '{' + txt + '}';
            }
            try {
                txt = JSON.stringify(JSON.parse(txt), null, 4);
            } catch (err) {
            }
            _copyToClipboard(txt);
        };

        // 删除json片段
        var fnDel = function (ed) {
            if (el.parent().is('#formattedJson')) {
                alert('如果连最外层的Json也删掉的话，就没啥意义了哦！');
                return false;
            }
            el.remove();
            boxOpt.css('top', -1000);
        };

        var boxOpt = $('#boxOpt');
        if (!boxOpt.length) {
            boxOpt = $('<div id="boxOpt"><a class="opt-copy">复制</a>|<a class="opt-del">删除</a></div>').appendTo('body');
        }
        boxOpt.find('a.opt-copy').unbind('click').bind('click', fnCopy);
        boxOpt.find('a.opt-del').unbind('click').bind('click', fnDel);

        boxOpt.css({
            left: el.offset().left + el.width() - 50,
            top: el.offset().top
        });
    };

    /**
     * 事件绑定
     * @private
     */
    var _bindEvent = function () {

        // 点击区块高亮
        $('#jfContent').delegate('.kvov', 'click', function (e) {
            $('#jfContent .kvov').removeClass('x-outline');
            var el = $(this).removeClass('x-hover').addClass('x-outline');

            // 增加复制、删除功能
            _addOptForItem(el);

            if (!$(e.target).is('.kvov .e')) {
                e.stopPropagation();
            } else {
                $(e.target).parent().trigger('click');
            }

        }).delegate('.kvov', 'mouseover', function (e) {
            $(this).addClass('x-hover');
            return false;
        }).delegate('.kvov', 'mouseout', function (e) {
            $(this).removeClass('x-hover');
        });
    };

    /**
     * 执行format操作
     * @private
     */
    var _format = function () {
        var source = _getJsonText();
        if (!source) {
            return;
        }

        // JSONP形式下的callback name
        var funcName = null;
        // json对象
        var jsonObj = null;
        var newSource = '';

        // 下面校验给定字符串是否为一个合法的json
        try {
            // 再看看是不是jsonp的格式
            var reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/igm;
            var matches = reg.exec(source);
            if (matches != null) {
                funcName = matches[1];
                newSource = matches[2];
                jsonObj = new Function("return " + newSource)();
            } else {
                reg = /^([\{\[])/;
                if (!reg.test(source)) {
                    return;
                }
            }

        } catch (ex) {
            return;
        }

        try {
            if (jsonObj == null || typeof jsonObj != 'object') {
                jsonObj = new Function("return " + source)();

                // 还要防止下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
                if (typeof jsonObj == "string") {
                    // 再来一次
                    jsonObj = new Function("return " + jsonObj)();
                }
            }
        } catch (e) {
            return;
        }

        // 是json格式，可以进行JSON自动格式化
        if (jsonObj != null && typeof jsonObj == "object") {
            try {
                // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                newSource = JSON.stringify(jsonObj);
                // 如果newSource的长度比原source长度短很多的话，猜测应该是格式化错了，需要撤销操作
                // 这里一定要unicode decode一下，要不然会出现误判
                if (newSource.length * 2 < (_uniDecode(source)).length) {
                    return;
                }
            } catch (ex) {
                // 通过JSON反解不出来的，一定有问题
                return;
            }

            $('body').html(_htmlFragment);
            _loadCss();
            _bindEvent();

            JsonFormatEntrance.clear();
            JsonFormatEntrance.format(newSource);

            // 如果是JSONP格式的，需要把方法名也显示出来
            if (funcName != null) {
                $('#jfCallbackName_start').html(funcName + '(');
                $('#jfCallbackName_end').html(')');
            }
        }
    };

    var _init = function () {

        $(function () {
            if (!/^filesystem\:/.test(location.href)) {
                if (baidu.feOption.pageJsonMustFormat) {
                    _format();
                } else {
                    chrome.extension.sendMessage({
                        type: MSG_TYPE.GET_OPTIONS,
                        items: ['JSON_PAGE_FORMAT']
                    }, function (opts) {
                        if (opts.JSON_PAGE_FORMAT != 'false') {
                            _format();
                        }
                    });
                }
            }
        });
    };

    return {
        init: _init
    };
})();

baidu.csJsonFormat.init();
