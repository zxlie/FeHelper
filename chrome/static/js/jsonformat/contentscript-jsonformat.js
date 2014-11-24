/**
 * content_scripts中如果被检测到当前页面内容为json数据，则自动进行JSON格式化
 */
baidu.csJsonFormat = (function () {

    "use strict";

    var _htmlFragment = [
        '<div class="mod-json mod-contentscript"><div class="rst-item">',
        '<div id="formatTips">本页JSON数据由FeHelper进行自动格式化，若有任何问题，点击这里提交 ',
        '<a href="http://www.baidufe.com/item/889639af23968ee688b9.html#comment" target="_blank">意见反馈</a>',
        '</div>',
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
        var fcpCss = chrome.extension.getURL('static/css/fe-jsonformat.css');
        jQuery('<link id="_fehelper_fcp_css_" href="' + fcpCss + '" rel="stylesheet" type="text/css" />').appendTo('head');
    };

    /**
     * 从页面提取JSON文本
     * @return {*}
     * @private
     */
    var _getJsonText = function () {
        var pre = $('body>pre:eq(0)')[0] || {textContent:""};
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
        var json_text_detected = false;
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (nodes[i].nodeType == Node.TEXT_NODE) {
                if (!json_text_detected) {
                    source = nodes[i].textContent;
                    json_text_detected = true;
                } else {
                    return;
                }
            } else if (nodes[i].nodeType == Node.ELEMENT_NODE) {
                var tagName = nodes[i].tagName.toLowerCase();
                var html = $.trim(nodes[i].textContent);
                // 如果是pre标签，则看内容是不是和source一样，一样则continue
                if (tagName === 'pre' && html === source) {
                    continue;
                }
                // 如果用户安装迅雷或者其他的插件，也回破坏页面结构，需要兼容一下
                else if (tagName === 'embed' && nodes[i].offsetWidth === 0) {
                    continue;
                } else {
                    return;
                }
            } else {
                return;
            }
        }
        return source;
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

        // 下面校验给定字符串是否为一个合法的json
        try {
            jsonObj = new Function("return " + source)();

            // 还要防止下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
            if (typeof jsonObj == "string") {
                // 再来一次
                jsonObj = new Function("return " + jsonObj)();
            }
        } catch (ex) {
            // 再看看是不是jsonp的格式
            var reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/igm;
            var matches = reg.exec(source);
            if (matches == null) {
                return;
            }

            funcName = matches[1];
            source = matches[2];
            try {
                jsonObj = new Function("return " + source)();
            } catch (e) {
                return;
            }
        }

        // 是json格式，可以进行JSON自动格式化
        if (typeof jsonObj == "object") {
            try {
                // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                source = JSON.stringify(jsonObj);
            } catch (ex) {
                // 通过JSON反解不出来的，一定有问题
                return;
            }

            $('body').html(_htmlFragment);
            _loadCss();

            // 点击区块高亮
            $('#jfContent').delegate('.kvov', 'click',function (e) {
                $('#jfContent .kvov').removeClass('x-outline');
                $(this).removeClass('x-hover').addClass('x-outline');
                if (!$(e.target).is('.kvov .e')) {
                    e.stopPropagation();
                } else {
                    $(e.target).parent().trigger('click');
                }
            }).delegate('.kvov', 'mouseover',function (e) {
                    $(this).addClass('x-hover');
                    return false;
                }).delegate('.kvov', 'mouseout', function (e) {
                    $(this).removeClass('x-hover');
                });

            JsonFormatEntrance.clear();
            JsonFormatEntrance.format(source);

            // 如果是JSONP格式的，需要把方法名也显示出来
            if (funcName != null) {
                $('#jfCallbackName_start').html(funcName + '(');
                $('#jfCallbackName_end').html(')');
            }
        }
    };

    var _init = function () {
        $(function () {
            _format();
        });
    };

    return {
        init:_init
    };
})();

baidu.csJsonFormat.init();