/**
 * 注册命名空间：baidu.grid
 */
baidu.namespace.register("baidu.grid");

/**
 * 栅格相关处理
 * @author zhaoxianlie 
 */
baidu.grid = (function(){
	
	/**
	 * 创建栅格
	 */
	var _createGrid = function(){
		
		var box = jQuery('#fe-helper-box');
		if(box[0]) {	//已经有栅格，则移除
			box.remove();
		} 
		//没有栅格，则创建
		var gridPng = chrome.extension.getURL('static/img/grid.png');
		var $win =  jQuery(window);
		var $body = jQuery('body');
		jQuery('<div id="fe-helper-box"></div>').appendTo('body').css({
			position:'static'
		});
		jQuery('<div id="fe-helper-grid"></div>').appendTo('#fe-helper-box').css({
			'background' : 'url(' + gridPng + ') repeat',
			width : $body.width(),
			height : Math.max($win.height() , $body.height())
		}).mousemove(function(e){
			var pos = {};
			try{
				pos = document.getElementsByTagName('body')[0].getBoundingClientRect();
			}catch(err){
				pos = {left:0,top:0};
			}
			//虚线框
			jQuery('#fe-helper-g-pos').show().css({
				width : e.pageX - pos.left,
				height : e.pageY
			});
			
			var _t = Math.min(e.pageY,jQuery(window).height() + jQuery('body').scrollTop() - 40) ;
			var _l = Math.min(e.pageX,jQuery(window).width() + jQuery('body').scrollLeft() - 200) + 5 - pos.left;
			
			//坐标tooltip
			jQuery('#fe-helper-gp-info').show().css({
				top : _t,
				left : _l
			}).html('top = ' + e.pageY + ' px ,left = ' + e.pageX + ' px');
		}).mouseout(function(e){
			jQuery('#fe-helper-g-pos,#fe-helper-gp-info').hide();
		})
		
		//为页面注册按键监听
		jQuery('body').keydown(function(e){
			if(jQuery('#fe-helper-box')[0]) {
				if(e.which == 27) { //ESC
					jQuery('#fe-helper-box').remove();
				}
			}
		});
		
		//window.onresize
		jQuery(window).resize(function(){
			if(jQuery('#fe-helper-box')[0]) {
				jQuery('#fe-helper-grid').css({
					width : Math.max($win.width() , $body.width()),
					height : Math.max($win.height() , $body.height())
				})
			}
		});
		
		jQuery('<div id="fe-helper-g-pos"></div><div id="fe-helper-gp-info"></div>').appendTo('#fe-helper-box');
		jQuery('<span id="fe-helper-btn-close-grid">关闭栅格层</span>')
			.appendTo('#fe-helper-box').click(function(){
				jQuery('#fe-helper-box').remove();
			});
		
		//创建页面标尺	
		_createPageRuler();
	};
	
	/**
	 * 创建页面标尺
	 */
	var _createPageRuler = function(){
		if(!jQuery('#fe-helper-box')[0]) {
			jQuery('<div id="fe-helper-box"></div>').appendTo('body');
		}
		jQuery('<div id="fe-helper-ruler-top"></div><div id="fe-helper-ruler-left"></div>').appendTo('#fe-helper-box');
		var _t = 0,_h = 20,_w = 20;
		
		var $win =  jQuery(window);
		var $body = jQuery('body');
		var $width = Math.max($win.width() , $body.width());
		var $height = Math.max($win.height() , $body.height());
		
		for(var i = 30;i <= $width;i += 10) {
			_t = (i % 50) ? 10 : 0;
			jQuery('<div class="h-line"></div>').appendTo('#fe-helper-ruler-top').css({
				left : i - 1,
				top : _t + 5,
				height : _h - _t - 5
			});
			if(_t == 0) {
				jQuery('<div class="h-text">' + i + '</div>').appendTo('#fe-helper-ruler-top').css({
					left : i + 2
				});
			}
		}
		for(var i = 0;i <= $height;i += 10) {
			_l = (i % 50) ? 10 : 0;
			jQuery('<div class="v-line"></div>').appendTo('#fe-helper-ruler-left').css({
				left : _l + 5,
				top : i - 1,
				width : _w - _l - 5
			});
			if(_l == 0) {
				jQuery('<div class="v-text">' + i + '</div>').appendTo('#fe-helper-ruler-left').css({
					top : i + 2
				});
			}
		}
		
		//处理scroll的时候，标尺跟着移动
		jQuery(window).scroll(function(e){
			if(jQuery('#fe-helper-box')[0]) {
				//水平标尺定位
				jQuery('#fe-helper-ruler-top').css('left',0 - jQuery('body').scrollLeft());
				//垂直标尺
				jQuery('#fe-helper-ruler-left').css('top',0 - jQuery('body').scrollTop());
			}
		});
	
	};
	
	/**
	 * 执行栅格系统检测
	 */
	var _detect = function(callback){
		
		//创建栅格
		_createGrid();
		
		//执行回调
		if(callback && typeof callback == "function") {
			callback.call(null);
		}
	};
	
	return {
		detect : _detect
	};
})();