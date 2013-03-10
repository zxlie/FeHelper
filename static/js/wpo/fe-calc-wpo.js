/**
 * 计算并保存网页加载时间
 * @author zhaoxianlie
 */
baidu.calcPageLoadTime = (function(){

	var wpoInfo = {};
	/**
	 * 获取页面的http header
	 * @return {[type]}
	 */
	var getHttpHeaders = function(){
		if(wpoInfo.header && wpoInfo.time) {
	    	sendWpoInfo();
		}else{
			$.ajax({
				type: 'GET',
	   			url : window.location.href,
	   			complete: function( xhr,data ){
			    	wpoInfo.header = {
			    		"date" : xhr.getResponseHeader('Date'),
			    		"contentEncoding" : xhr.getResponseHeader('Content-Encoding'),
			    		"connection" : xhr.getResponseHeader('Connection'),
			    		"contentLength" : xhr.getResponseHeader('Content-Length'),
			    		"server" : xhr.getResponseHeader('Server'),
			    		"vary" : xhr.getResponseHeader('Vary'),
			    		"transferEncoding" : xhr.getResponseHeader('Transfer-Encoding'),
			    		"contentType" : xhr.getResponseHeader('Content-Type'),
			    		"cacheControl" : xhr.getResponseHeader('Cache-Control'),
			    		"exprires" : xhr.getResponseHeader('Exprires'),
			    		"lastModified" : xhr.getResponseHeader('Last-Modified')
			    	};
			    	getPageLoadTime();
			    	sendWpoInfo();
			 	}
			});
		}
	};

	/**
	 * 获取网页的加载时间
	 */
	var getPageLoadTime = function(){
	 	wpoInfo.time = performance.timing;
	};

	/**
	 * 发送wpo数据
	 * @return {[type]}
	 */
	var sendWpoInfo = function(){
        chrome.extension.sendMessage({
			type : MSG_TYPE.CALC_PAGE_LOAD_TIME,
			wpo : wpoInfo
		});
	};
	
	var init = function(){
		chrome.extension.onMessage.addListener(function(request,sender,callback){
			// 获取页面相关性能数据
			if(request.type == MSG_TYPE.GET_PAGE_WPO_INFO) {
				(function check() {
			        (document.readyState == "complete") ? getHttpHeaders() : setTimeout(check, 1000);
			    })();				
			}
		});
	};
	
	return {
		init : init
	};
})();

//初始化
baidu.calcPageLoadTime.init();



