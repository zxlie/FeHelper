/**
 * QR码生成器
 */
baidu.qrcode = (function () {

    "use strict";

    /**
     * 二维码上携带的文字
     * @type {String}
     */
    var text = '';

    /**
     * 创建二维码
     */
    var createQrCode = function() {
        var width = $("#opt_width").val();
        var height = $("#opt_height").val();
        var foreground = $('#opt_fc').val();
        $('#preview').html('').qrcode({
            width:width,
            height:height,
            foreground : foreground,
            text:baidu.endecode.utf16to8(text)
        });
        $('#fieldset_qr').show();
    };

    /**
     * 绑定事件
     * @private
     */
    var _bindEvents = function () {
        var current_tab_id = 'tabs-1';

        $("#tabs").tabs()
            .bind("tabsselect", function (event, ui) {
                current_tab_id = ui.panel.id;
            })
            .tabs("select", 0);
        $("#confirm_button").button().click(function () {
            $("#preview > img").attr("src", "");
            var current_tab = $("#tabs").tabs('option', 'selected');
            switch (current_tab) {
                case 0 :
                    text = $.trim($("#tabs-0 #tab0_url").attr("value"));
                    break;
                case 1 :
                    text = $.trim($("#tabs-1 #tab1_text").attr("value"));
                    break;
                case 2 :
                    text = "tel:" + $.trim($("#tabs-2 #tab2_telno").attr("value"));
                    break;
                case 3 :
                    text = $("#tabs-3 [name=tab3_type]:checked").attr("value") + ":" + $.trim($("#tabs-3 #tab3_telno").attr("value")) + ":" + $.trim($("#tabs-3 #tab3_message").attr("value"));
                    break;
                case 4 :
                    text = "mailto:" + $.trim($("#tabs-4 #tab4_email").attr("value"));
                    break;
                case 5 :
                    text = "BEGIN:VCARD\nVERSION:3.0\n";
                    var v = $.trim($("#tabs-5 #tab5_FormattedName").attr("value"));
                    text += v ? ("FN:" + v + "\n") : "";

                    v = $.trim($("#tabs-5 #tab5_Telephone").attr("value"));
                    text += v ? ("TEL:" + v + "\n") : "";

                    v = $.trim($("#tabs-5 #tab5_Email").attr("value"));
                    text += v ? ("EMAIL:" + v + "\n") : "";

                    v = $.trim($("#tabs-5 #tab5_X-MSN").attr("value"));
                    text += v ? ("X-MSN:" + v + "\n") : "";

                    v = $.trim($("#tabs-5 #tab5_Organization").attr("value"));
                    text += v ? ("ORG:" + v + "\n") : "";

                    v = $.trim($("#tabs-5 #tab5_Title").attr("value"));
                    text += v ? ("TITLE:" + v + "\n") : "";

                    v = $.trim($("#tabs-5 #tab5_Address").attr("value"));
                    text += v ? ("ADR:" + v + "\n") : "";

                    v = $.trim($("#tabs-5 #tab5_URL").attr("value"));
                    text += v ? ("URL:" + v + "\n") : "";
                    text += "END:VCARD";
                    break;
            }
            createQrCode();
        });

        $("#opt_fc").colorpicker({
            fillcolor:true,
            success : function(obj,color) {
                if(text) {
                    createQrCode();
                }
            }
        });
    };

    var _init = function () {
        $(function () {
            _bindEvents();
            $('#tab0_url').focus();
        });
    };

    return {
        init:_init
    };
})();

baidu.qrcode.init();