/**
 * 桌面提醒
 * @author zhaoxianlie
 */
baidu.feNotification = (function(){
	
	/**
	 * html式，可以简单的用查询变量传递参数
	 * @param {string} notify_file 提醒页面路径：相对路径
	 */
	var notifyHtml = function(notify_file) {
	    var encode = encodeURIComponent;
	    var notification = webkitNotifications.createHTMLNotification(
	        chrome.extension.getURL(notify_file)
	    );
	    notification.show();

	    return notification;
	};

	/**
	 * 文本格式，可以设置一个图标和标题
	 * @param {Object} options
	 * @config {string} type notification的类型，可选值：html、text
	 * @config {string} icon 图标
	 * @config {string} title 标题
	 * @config {string} message 内容
	 */
	var notifyText = function(options){
		if(!options.icon) {
			options.icon = "static/img/fe-48.png";
		}
		if(!options.title) {
			options.title = "\u5C0F\u63D0\u793A";
		}
		//创建提醒
	    var notification = webkitNotifications.createNotification(
	        chrome.runtime.getURL(options.icon),
	        options.title,
	        options.message
	    );
	    notification.show();

	    //是否配置了自动关闭
	    if(options.autoClose !== false) {
		    // 显示完之后默认5秒关闭，具体还要看用户是否进行了自定义配置
		    notification.ondisplay = function(e) {
				var userComstomNotificationTime = localStorage.getItem("opt_item_notification");
		        setTimeout(function() { notification.cancel(); }, userComstomNotificationTime || 5000);
		    }
	    }

	    return notification;
	};
	
	return {
		notifyHtml : notifyHtml,
		notifyText : notifyText
	};
})();




