/**
 * 注册命名空间：baidu.log
 */
baidu.namespace.register("baidu.log");

/**
 * 百度前端统计
 * @author 赵先烈
 */
baidu.log = (function(){
	/**
     * 空间统计，使用log平台
     * <pre><code>
     * qing.ext.stat.ns_trackerLink("m_20110709_enter","http://hi.baidu.com");
     * </code></pre>
     * @param {String} m m值，区别不同统计项。推荐格式为 m_时期_tag，如 m_20110709_showpop
     * @param {String} url (optional) 统计对应的url，可以不填或为空字符串
     */
    var ns_trackerLink = function(m, url){ 
        var pid = 109,  //space
            type = 2009,    //暂定为普通的统计编号
            srcUrl = 'http://nsclick.baidu.com/v.gif?pid='+pid+'&url='+encodeURIComponent(url)+'&type='+type+'&m='+m+'&_t='+Math.random();  //LOG统计地址
		
        var n = "imglog__"+ (new Date()).getTime(),
            c = window[n] = new Image();
        c.onload=(c.onerror=function(){window[n] = null;});  
        c.src = srcUrl;  //LOG统计地址
        c = null;//释放变量c，避免产生内存泄漏的可能
    };
	
	return {
		track : ns_trackerLink
	};
})();
