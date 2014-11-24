/**
 * JSON格式化
 */
baidu.jsonformat = (function () {

    "use strict";

    var _bindEvents = function () {
        $('#btnFormat').click(function (e) {
            var source = $.trim($('#jsonSource').val());
            JsonFormatEntrance.clear();
            JsonFormatEntrance.format(source);
        });

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
    };

    var _init = function () {
        $(function () {
            //输入框聚焦
            jQuery("#jsonSource").focus();
            _bindEvents();
        });
    };

    return {
        init:_init
    };
})();

baidu.jsonformat.init();