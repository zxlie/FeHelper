/**
 * 注册命名空间
 */
baidu.namespace.register("baidu.pageLoadTime");

/**
 * 统计网页加载时间
 * @author zhaoxianlie
 */
baidu.pageLoadTime = (function(){
	/**
	 * 获取网页的加载时间
	 */
	var init = function(){
        // 获得wpo信息
        var wpoStr = decodeURIComponent(location.search.substring(1));
        var wpo = JSON.parse(decodeURIComponent(atob(wpoStr)));

        // 页面信息
        document.getElementById("pageTitle").innerHTML = wpo.pageInfo.title || "无";
        document.getElementById("pageUrl").innerHTML = wpo.pageInfo.url || "无";

        // 各阶段加载时间
		 function set(id, value) {
            try{
	           document.getElementById(id).innerHTML = value + ' ms';
            }catch(e){}
	     }
         var t = wpo.time;
         var start = t.redirectStart == 0 ? t.fetchStart : t.redirectStart;
         set('dns', t.domainLookupEnd - t.domainLookupStart);
         set('dnsTotal', t.domainLookupEnd - start);
         set('connect', t.connectEnd - t.connectStart);
         set('requestTotal', t.requestStart - start);
         set('response', t.responseStart - t.requestStart);
         set('responseTotal', t.responseStart - start);
         set('responseEnd', t.responseEnd - t.responseStart);
         set('responseEndTotal', t.responseEnd - start);
         set('contentLoaded', t.domContentLoadedEventEnd - t.domLoading);
         set('contentLoadedTotal' , t.domContentLoadedEventEnd - start);
         set('domComplete', t.domComplete - t.domContentLoadedEventEnd);
         set('domCompleteTotal' , t.domComplete - start);
         set('loadTotal' , t.loadEventEnd - start);

        // HTTP Header
         var h = wpo.header;
         if(!h) {
             document.getElementById("pageHeaderInfo").style.display = "none";
         }else{
             for(var key in h) {
                 try{
                     document.getElementById(key).innerHTML = h[key] || ' - ';
                 }catch(e){}
             }
         }
	};
	return {
		init : init
	};
})();

//初始化
baidu.pageLoadTime.init();


