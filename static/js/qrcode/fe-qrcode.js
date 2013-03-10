/**
 * QR码生成器
 */
baidu.qrcode = (function(){

	"use strict";

	var _bindEvents = function(){
		$('#btnQR').click(function(e){
			var url = $.trim($('#source').val().replace(/\n/gm,' '));
			var size = parseInt($('#size').val() ,10) || 4;
			var img = new Image();
			var src = "http://www.baidufe.com/qrcode?url=" + encodeURIComponent(url) + "&size=" + size;
			img.onload = function(){
				$('#qrResult').html('<img src="' + src + '" alt="QR" title="QR码">');
			};
			img.src = src;
			$('#qrResult').html('QR码生成中，请稍后...');
		});

		$('#btnDemo').click(function(e){
			$('#demo').toggle();
			e.preventDefault();
		});

		$('#demo a.test').click(function(e){
			$('#source').val($(this).prev('.content').html().trim());
			e.preventDefault();
		});
	};

	var _init = function(){
		$(function(){
			_bindEvents();
		});
	};

	return {
		init : _init
	};
})();

baidu.qrcode.init();