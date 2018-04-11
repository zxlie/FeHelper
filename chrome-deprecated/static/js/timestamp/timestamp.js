/**
 * 时间戳转换工具
 * @author zhaoxianlie
 */
var Timestamp = (function(){

	"use strict";

	var intervalId = 0;

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

        $('#btnToggle').click(function(e){
            var model = $(this).data('model') || 0;
            if(model) {
                $(this).data('model',0).val('暂停');
                _initNowStamp();
            }else{
                $(this).data('model',1).val('开始');
                window.clearInterval(intervalId);
            }
        });
	};

    var _initNowStamp = function(){
        var txtNowDate = $('#txtNowDate');
        var txtNowStamp = $('#txtNow');
        intervalId = window.setInterval(function(){
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