/**
 * JSON格式化
 */
baidu.jsonformat = (function () {

    "use strict";

    /**
     * 执行format操作
     * @private
     */
    var _format = function () {
        $('#errorMsg').html('');
        $('#modJsonResult').hide();
        var source = $('#jsonSource').val().replace(/\n/gm,' ');
        if (!source) {
            return;
        }

        // JSONP形式下的callback name
        var funcName = null;
        // json对象
        var jsonObj = null;

        // 下面校验给定字符串是否为一个合法的json
        try {
            // 再看看是不是jsonp的格式
            var reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/igm;
            var matches = reg.exec(source);
            if (matches != null) {
                funcName = matches[1];
                var newSource = matches[2];
                jsonObj = new Function("return " + newSource)();
            }
        } catch (ex) {
            $('#errorMsg').html(ex.message);
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
        } catch (ex) {
            $('#errorMsg').html(ex.message);
            return;
        }

        // 是json格式，可以进行JSON自动格式化
        if (jsonObj != null && typeof jsonObj == "object") {
            try {
                // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                source = JSON.stringify(jsonObj);
            } catch (ex) {
                // 通过JSON反解不出来的，一定有问题
                return;
            }

            JsonFormatEntrance.clear();
            JsonFormatEntrance.format(source);

            $('#modJsonResult').show();

            // 如果是JSONP格式的，需要把方法名也显示出来
            if (funcName != null) {
                $('#jfCallbackName_start').html(funcName + '(');
                $('#jfCallbackName_end').html(')');
            }
        }
    };

    /**
     * 事件绑定
     * @private
     */
    var _bindEvents = function () {
        $('#btnFormat').click(function (e) {
            _format();
        });

        // 点击区块高亮
        $('#jfContent').delegate('.kvov', 'click', function (e) {
            $('#jfContent .kvov').removeClass('x-outline');
            $(this).removeClass('x-hover').addClass('x-outline');
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

    var _init = function () {
        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        chrome.runtime.onMessage.addListener(function (request, sender, callback) {
            if (request.type == MSG_TYPE.TAB_CREATED_OR_UPDATED && request.event == 'jsonformat') {
                if (request.content) {
                    document.getElementById('jsonSource').value = (request.content);
                    _format();
                }
            }
        });

        $(function () {
            //输入框聚焦
            jQuery("#jsonSource").focus();
            _bindEvents();
        });
    };

    return {
        init: _init
    };
})();

baidu.jsonformat.init();