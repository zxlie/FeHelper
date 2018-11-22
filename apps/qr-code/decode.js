/**
 * FeHelper QR码解码
 */
module.exports = (() => {

    "use strict";

    let _show = (text) => {
        let el = $('#__fehelper_qr_decode__');
        if (!el[0]) {
            el = $('<div id="__fehelper_qr_decode__" style="z-index:999999;position: fixed;left:0;top:0;right: 0;bottom: 0;display: none;">' +
                '<div style="position: fixed;left:0;top:0;right: 0;bottom: 0;background: #000;opacity: 0.5;"></div>' +
                '<div style="position: relative;top: 100px;left: ' + ($('body').width() / 2 - 200) + 'px;border:1px solid #000;background:#fff;width:420px;padding:15px;border-radius:5px 5px;box-shadow:2px 2px 5px #000;">' +
                '<div style="margin: 0 0 10px 0;font-size: 14px;font-weight: bold;">二维码解码结果：</div>' +
                '<textarea style="display:block;border-radius:5px 5px;width:398px;border:1px solid #aaa;min-height:80px;resize:none;box-shadow:2px 2px 5px #aaa;padding:10px;font-size:14px;color:#888;"></textarea>' +
                '<div style="margin-top:10px;font-size:0">' +
                '<span id="__fehelper_qr_msg_" style="float: right;color:#f00;display:none;">复制成功！</span>' +
                '<a id="__fehelper_qr_open_" style="margin-right:20px;color: #00f;text-decoration: underline;display: inline;font-size:12px" href="#">打开</a>' +
                '<a id="__fehelper_qr_copy_" style="margin-right:20px;color: #00f;text-decoration: underline;display: inline;font-size:12px" href="#">复制</a>' +
                '<a id="__fehelper_qr_close_" style="margin-top:10px;color: #00f;text-decoration: underline;display: inline;font-size:12px" href="#">关闭</a>' +
                '</div></div>' +
                '</div>').appendTo('body');


            el.find('a#__fehelper_qr_open_').click(function (e) {
                e.preventDefault();
                window.open(el.find('textarea').val());
            });

            el.find('a#__fehelper_qr_copy_').click(function (e) {
                e.preventDefault();

                el.find('textarea').select();
                document.execCommand('Copy');

                el.find('#__fehelper_qr_msg_').show().delay(2000).hide('slow');
            });
            el.find('a#__fehelper_qr_close_').click(function (e) {
                e.preventDefault();
                el.hide('slow');
            });
        }

        if (text === 'error decoding QR Code') {
            text = '抱歉，二维码识别失败！';
        }

        el.show('slow').find('textarea').val(text);
    };

    return {
        show: _show
    };
})();