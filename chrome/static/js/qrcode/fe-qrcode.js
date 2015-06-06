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
     * 获取要用来生成二维码的文本数据
     * @private
     */
    var _createText = function () {
        $("#preview > img").attr("src", "");
        var current_tab = $("#tabs").tabs('option', 'selected');
        switch (current_tab) {
            case 0 :
                text = $.trim($("#tabs-1 #tab1_text").attr("value"));
                break;
            case 1 :
                text = "tel:" + $.trim($("#tabs-2 #tab2_telno").attr("value"));
                break;
            case 2 :
                text = $("#tabs-3 [name=tab3_type]:checked").attr("value") + ":" + $.trim($("#tabs-3 #tab3_telno").attr("value")) + ":" + $.trim($("#tabs-3 #tab3_message").attr("value"));
                break;
            case 3 :
                text = "mailto:" + $.trim($("#tabs-4 #tab4_email").attr("value"));
                break;
            case 4 :
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
        return text;
    };

    /**
     * 创建二维码生成的参数
     * @private
     */
    var _createOptions = function () {
        var width = $("#opt_width").val();
        var foreground = $('#opt_fc').val();
        var defaultOptions = {
            // render method: 'canvas', 'image' or 'div'
            render: 'canvas',

            // version range somewhere in 1 .. 40
            minVersion: 1,
            maxVersion: 40,

            // error correction level: 'L', 'M', 'Q' or 'H'
            ecLevel: 'L',

            // offset in pixel if drawn onto existing canvas
            left: 0,
            top: 0,

            // size in pixel
            size: +width || 200,

            // code color or image element
            fill: foreground,

            // background color or image element, null for transparent background
            background: null,

            // corner radius relative to module width: 0.0 .. 0.5
            radius: 0,

            // quiet zone in modules
            quiet: 0,
            text: text,

            // modes
            // 0: normal
            // 1: label strip
            // 2: label box
            // 3: image strip
            // 4: image box
            mode: 0,

            mSize: 0.15,
            mPosX: 0.5,
            mPosY: 0.5,

            label: 'FH',
            fontname: 'sans',
            fontcolor: '#f00',

            image: false
        };

        // 判断是否需要设置icon
        var iconType = $('input[name=qr_icon]:checked').val();
        if (iconType == 1) {
            defaultOptions.mode = 4;
            defaultOptions.image = $('#logo_default')[0];
        } else if (iconType == 2) {
            defaultOptions.mode = 4;
            defaultOptions.image = $('#logo')[0];
        }

        return defaultOptions;
    };

    /**
     * 创建二维码
     */
    var _createQrCode = function () {
        text = _createText();
        if (text) {
            $('#preview').html('').qrcode(_createOptions());
        } else {
            $('#preview').html('再在输入框里输入一些内容，就能生成二维码了哦~')
        }
        $('#fieldset_qr').show();
    };

    /**
     * 设置ICON
     * @param file
     * @private
     */
    var _drawIcon = function (file) {
        if (/image\//.test(file.type)) {
            var reader = new FileReader();
            reader.onload = function (evt) {
                $('#logo').attr('src', evt.target.result);
                _createQrCode();
            };
            reader.readAsDataURL(file);
        } else {
            alert('请选择图片文件！');
        }
    };

    /**
     * 可以拖拽一张图片上来，生成小icon
     * @private
     */
    var _dragAndDrop = function () {
        $(document).bind('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var files = e.originalEvent.dataTransfer.files;
            if (files.length) {
                _drawIcon(files[0]);
            }
        }).bind('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
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
            _createQrCode();
        });

        $("#opt_fc").colorpicker({
            fillcolor: true,
            success: function (obj, color) {
                _createQrCode();
            }
        });

        $('#remove_icon,#default_icon').click(function (e) {
            _createQrCode();
        });

        $('#upload_icon').click(function (e) {
            $('#file').trigger('click');
        });
        $('#file').change(function (e) {
            if (this.files.length) {
                _drawIcon(this.files[0]);
                this.value = '';
            }
        });

        _dragAndDrop();
    };

    var _init = function () {
        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        chrome.runtime.onMessage.addListener(function (request, sender, callback) {
            if (request.type == MSG_TYPE.TAB_CREATED_OR_UPDATED && request.event == 'qrcode') {
                if (request.content) {
                    document.getElementById('tab1_text').value = (request.content);
                    setTimeout(_createQrCode, 50);
                }
            }
        });

        $(function () {
            _bindEvents();
            $('#tab1_text').focus();
        });
    };

    return {
        init: _init
    };
})();

baidu.qrcode.init();