/**
 * 注册命名空间：baidu.ed
 */
baidu.namespace.register("baidu.ed");

baidu.ed = (function () {

    /**
     * 转码
     */
    var _convert = function () {
        var srcText = jQuery("#srcText").val();
        jQuery("#rst").show();
        var rstCode = jQuery("#rstCode");

        if (jQuery("#uniEncode").attr("checked") == true) {
            rstCode.val(baidu.endecode.uniEncode(srcText));
        } else if (jQuery("#uniDecode").attr("checked") == true) {
            rstCode.val(baidu.endecode.uniDecode(srcText));
        } else if (jQuery("#utf8Encode").attr("checked") == true) {
            rstCode.val(encodeURIComponent(srcText));
        } else if (jQuery("#utf8Decode").attr("checked") == true) {
            rstCode.val(decodeURIComponent(srcText));
        } else if (jQuery("#base64Encode").attr("checked") == true) {
            rstCode.val(baidu.endecode.base64Encode(baidu.endecode.utf8Encode(srcText)));
        } else if (jQuery("#base64Decode").attr("checked") == true) {
            rstCode.val(baidu.endecode.utf8Decode(baidu.endecode.base64Decode(srcText)));
        } else {
            rstCode.val(hex_md5(srcText));
        }
    };

    /**
     * 绑定按钮的点击事件
     */
    var _bindBtnEvent = function () {
        jQuery("#btnCodeChange").click(function () {
            _convert();
        });

        jQuery("#btnCodeClear").click(function () {
            jQuery("#srcText,#rstCode").val("")
        });
    };

    /**
     * 每个单选按钮被点击时，都自动进行转换
     */
    var _bindRadioEvent = function () {
        jQuery("input[type=radio],label[for]").click(function (evt) {
            $this = jQuery(this);
            setTimeout(function () {
                _convert();
            }, 150);
        });
    };

    /**
     * 鼠标划过结果框，选中
     */
    var _bindRstEvent = function () {
        jQuery("#rstCode").mouseover(function () {
            this.selectionStart = 0;
            this.selectionEnd = this.value.length;
            this.select();
        });
    };

    var _init = function () {
        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        chrome.runtime.onMessage.addListener(function (request, sender, callback) {
            if (request.type == MSG_TYPE.TAB_CREATED_OR_UPDATED && request.event == 'endecode') {
                if (request.content) {
                    document.getElementById('srcText').value = (request.content);
                    _convert();
                }
            }
        });

        jQuery(function () {
            //输入框聚焦
            jQuery("#srcText").focus();
            //绑定按钮的点击事件
            _bindBtnEvent();
            //鼠标划过结果框，选中
            _bindRstEvent();
            //单选按钮的点击事件
            _bindRadioEvent();
        });
    };

    return {
        init: _init
    };
})();

//初始化
baidu.ed.init();
