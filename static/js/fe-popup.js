/**
 * FeHelper弹出（下拉）页面
 * @author zhaoxianlie
 */
baidu.fePopup = (function(){
	/**
	 * 获取后台页面，返回window对象
	 */
	var bgPage = null;

	/**
	 * 绑定FeHelper标签的点击事件
	 */
	var _bindFcpHelperEvent = function(){
		jQuery('.fe-function-list .-x-fcp').click(function(e){
			//统计
			baidu.log.track(LOG.popup_page_fcp);
			
			window.close();
			bgPage.BgPageInstance.runHelperByType(MSG_TYPE.FCP_HELPER_DETECT);
		});
	};
	
	/**
	 * 绑定栅格检测标签的点击事件
	 */
	var _bindGridEvent = function(){
		jQuery('.fe-function-list .-x-grid').click(function(e){
			//统计
			baidu.log.track(LOG.popup_page_grid);
			
			window.close();
			bgPage.BgPageInstance.runHelperByType(MSG_TYPE.GRID_DETECT);
		});
	};
	
	/**
	 * 绑定栅格检测标签的点击事件
	 */
	var _bindFdpEvent = function(){
		jQuery('.fe-function-list .-x-fdp').click(function(e){
			//统计
			baidu.log.track(LOG.popup_page_fdp);
			
			window.close();
			bgPage.BgPageInstance.runHelperByType(MSG_TYPE.FDP_HELPER);
		});
	};
	
	/**
	 * 绑定字符串编解码标签的点击事件
	 */
	var _bindEndecodeEvent = function(){
		jQuery('.fe-function-list .-x-endecode').click(function(e){
			//统计
			baidu.log.track(LOG.popup_page_endecode);
			
			window.close();
			bgPage.BgPageInstance.runHelperByType(MSG_TYPE.EN_DECODE);
		});
	};
	
	/**
	 * JSON查看器
	 */
	var _bindJsonFormatEvent = function(){
		jQuery('.fe-function-list .-x-jsonformat').click(function(e){
			window.close();
			bgPage.BgPageInstance.runHelperByType(MSG_TYPE.JSON_FORMAT);
		});
	};
	
	/**
	 * QR码
	 */
	var _bindQrcodeEvent = function(){
		jQuery('.fe-function-list .-x-qrcode').click(function(e){
			window.close();
			bgPage.BgPageInstance.runHelperByType(MSG_TYPE.QR_CODE);
		});
	};
	
	/**
	 * 初始化Fdp菜单项 
	 */
	var _initFdpMenu = function(){
		if(bgPage.baidu.feOption.getOptionItem('opt_item_showfdpmenu') == "true"){
			jQuery("li.-x-fdp").removeClass("fe-hide");
			_bindFdpEvent();
		}
	};
	
	/**
	 * 查看网页wpo标签的点击事件
	 */
	var _bindPageWpoEvent = function(){
		jQuery('.fe-function-list .-x-loadtime').click(function(e){
			//统计
			baidu.log.track(LOG.popup_page_loadtime);
			
			window.close();
			bgPage.BgPageInstance.runHelperByType(MSG_TYPE.SHOW_PAGE_LOAD_TIME);
		});
	};
	
	/**
	 * 初始化页面，包括事件的绑定等
	 */
	var _doInit = function(){
		_bindFcpHelperEvent();
		_bindGridEvent();
		_initFdpMenu();
		_bindEndecodeEvent();
		_bindPageWpoEvent();
		_bindJsonFormatEvent();
		_bindQrcodeEvent();
	};

    var _init = function(){
        chrome.runtime.getBackgroundPage(function(theBgPage){
            bgPage = theBgPage;
            _doInit();
        });
    };
	
	return {
		init : _init
	};
})();

$(function(){
    baidu.fePopup.init();
});



