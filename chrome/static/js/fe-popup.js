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
     * 初始化Fdp菜单项
     */
    var _initFdpMenu = function(){
        if(bgPage.baidu.feOption.getOptionItem('opt_item_showfdpmenu') == "true"){
            jQuery("li.-x-fdp").removeClass("fe-hide");
        }
    };

    /**
     * 绑定弹出菜单的点击事件
     * @private
     */
    var _bindPopMenuEvent = function(){
        jQuery('ul.fe-function-list li').click(function(e){
            var msgType = $(this).attr('data-msgtype');
            var isUseFile = $(this).attr('data-usefile');
            window.close();
            bgPage.BgPageInstance.runHelper({
                msgType : MSG_TYPE[msgType],
                useFile : isUseFile
            });
        });
    };
	
	/**
	 * 初始化页面，包括事件的绑定等
	 */
	var _doInit = function(){
		_initFdpMenu();
        _bindPopMenuEvent();
	};

    var _init = function(){
        bgPage = chrome.extension.getBackgroundPage();
        _doInit();
    };
	
	return {
		init : _init
	};
})();

$(function(){
    baidu.fePopup.init();
});



