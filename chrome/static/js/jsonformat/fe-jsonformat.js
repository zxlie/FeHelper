/**
 * JSON格式化
 */
baidu.jsonformat = (function () {

    "use strict";

    /**
     * chrome 下复制到剪贴板
     * @param text
     */
    var _copyToClipboard = function(text) {
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
    var _addOptForItem = function(el){

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