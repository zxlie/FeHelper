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
		 function set(id, value) {
            try{
	           document.getElementById(id).innerHTML = value + ' ms';
            }catch(e){}
	     }
		 var wpoStr = decodeURIComponent(location.search.substring(1));
         var wpo = JSON.parse(wpoStr);
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

         var h = wpo.header;
         for(var key in h) {
            try{
              document.getElementById(key).innerHTML = h[key] || ' - ';
            }catch(e){}
         }
	};
	return {
		init : init
	};
})();

//初始化
baidu.pageLoadTime.init();


