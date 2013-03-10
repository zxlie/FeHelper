/**
 * JSON格式化
 */
baidu.jsonformat = (function(){

	"use strict";

	var _bindEvents = function(){
		$('#btnFormat').click(function(e){
			var source = $.trim($('#jsonSource').val());
			JsonFormatEntrance.clear();
			JsonFormatEntrance.format(source);
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

baidu.jsonformat.init();