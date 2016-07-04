/**
 * 注册命名空间
 */
baidu.namespace.register("baidu.fehelper");

/**
 * 编码规范检测、栅格检测的入口
 * @author 赵先烈
 */
baidu.fehelper = (function(){

    /**
     * 动态加载插件相关的css，防止平时对页面的影响
     * @private
     */
    var _loadCss = function(){

        if(!jQuery('#_fehelper_jq_ui_css_')[0]) {
            var jqUiCss = chrome.extension.getURL('static/vendor/jquery-ui-1.8/jquery-ui.hot.css');
            jQuery('<link id="_fehelper_jq_ui_css_" href="' + jqUiCss + '" rel="stylesheet" type="text/css" />').appendTo('head');

            var fcpCss = chrome.extension.getURL('static/css/fe-helper.css');
            jQuery('<link id="_fehelper_fcp_css_" href="' + fcpCss + '" rel="stylesheet" type="text/css" />').appendTo('head');
        }
    };

	/**
	 * 执行FCPHelper检测
	 */
	var _doFcpDetect = function(){
		
		chrome.extension.onMessage.addListener(function(request,sender,callback){
			//browserAction被点击
			if(request.type == MSG_TYPE.BROWSER_CLICKED && request.event == MSG_TYPE.FCP_HELPER_INIT) {
                //////////先做一些准备工作/////////////////////
                baidu.fcphelper.initStaticFile();
			}
            //browserAction被点击
            if(request.type == MSG_TYPE.BROWSER_CLICKED && request.event == MSG_TYPE.FCP_HELPER_DETECT) {
                //加载css
                _loadCss();
                //html
                baidu.fcphelper.initHtml(function(){
                    //fcp相关检测
                    baidu.fcphelper.detect();
                });
            }
		});
	};

	/**
	 * 函数主入口，主要是处理和browserAction之间的message交互
	 */
	var _main = function(){
		//执行FCPHelper检测
		_doFcpDetect();
	};
	
	
	return {
		main : _main
	};
	
})();


//执行主方法
baidu.fehelper.main();

