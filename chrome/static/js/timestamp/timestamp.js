/**
 * 时间戳转换工具
 * @author zhaoxianlie
 */
var Timestamp = (function(){

	"use strict";

	var _bindEvents = function(){
        $('#btnStampToLocale').click(function(e) {
            var stamp = $.trim($('#txtSrcStamp').val());
            if(stamp.length == 0) {
                alert('请先填写你需要转换的Unix时间戳');
                return;
            }
            if(!parseInt(stamp,10)) {
                alert('请输入合法的Unix时间戳');
                return;
            }
            $('#txtDesDate').val((new Date(parseInt(stamp,10) * 1000)).format('yyyy-MM-dd HH:mm:ss'));
        });

        $('#btnLocaleToStamp').click(function(e) {
            var locale = $.trim($('#txtLocale').val());
            locale = Date.parse(locale);
            if(isNaN(locale)) {
                alert('请输入合法的时间格式，如：2014-04-01 10:01:01，或：2014-01-01');
            }
            $('#txtDesStamp').val(locale / 1000);
        });
	};

    var _initNowStamp = function(){
        var txtNowDate = $('#txtNowDate');
        var txtNowStamp = $('#txtNow');
        window.setInterval(function(){
            txtNowDate.val((new Date()).toLocaleString());
            txtNowStamp.val(Math.round((new Date()).getTime() / 1000));
        },1000);
    };

	var _init = function(){
		$(function(){
            _initNowStamp();
			_bindEvents();
            $('#tab0_url').focus();
		});
	};

	return {
		init : _init
	};
})();

Timestamp.init();