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
            $('#txtDesDate').val((new Date(parseInt(stamp,10))).toLocaleString());
        });

        $('#btnLocaleToStamp').click(function(e) {
            var year = $.trim($('#txtSrcYear').val());
            var month = $.trim($('#txtSrcMonth').val());
            var day = $.trim($('#txtSrcDay').val());
            var hour = $.trim($('#txtSrcHour').val());
            var minute = $.trim($('#txtSrcMinute').val());
            var second = $.trim($('#txtSrcSecond').val());
            if(year.length == 0 || month.length == 0 || day.length == 0 ||
                hour.length == 0 || minute.length == 0 || second.length == 0 ) {
                alert('年月日时分秒均不能为空！');
                return;
            }
            if(!parseInt(year,10) || !parseInt(month,10) || !parseInt(day,10) ||
                !parseInt(hour,10) || !parseInt(minute,10) || !parseInt(second,10)) {
                alert('请输入合法的时间！');
                return;
            }
            var dateString = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
            $('#txtDesStamp').val(Date.parse(dateString));
        });
	};

    var _initNowStamp = function(){
        var txtNowDate = $('#txtNowDate');
        var txtNowStamp = $('#txtNow');
        window.setInterval(function(){
            txtNowDate.val((new Date()).toLocaleString());
            txtNowStamp.val(Math.round((new Date()).getTime()));
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