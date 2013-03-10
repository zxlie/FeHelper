/**
 * FE-Helper后台运行程序
 * @author zhaoxianlie@baidu.com
 */
var BgPageInstance = (function(){

	//各种元素的就绪情况	
	var _readyState = {
		css : false,
		js : false,
		html : true,
		allDone : false
	};
	
	//侦测的interval
	var _detectInterval = null;
	
	//侦测就绪情况
	var _detectReadyState = function(){
		_detectInterval = window.setInterval(function(){
			if(_readyState.css && _readyState.js && _readyState.html) {
				_readyState.allDone = true;
				window.clearInterval(_detectInterval);
			}
		},100);
	};
	
	
	/**
	 * 执行前端FCPHelper检测
	 */
	var _doFcpDetect = function(tab){
		//所有元素都准备就绪
		if(_readyState.allDone) {
            chrome.tabs.sendMessage(tab.id, {
                type: MSG_TYPE.BROWSER_CLICKED,
				event : MSG_TYPE.FCP_HELPER_DETECT
            });
		} else {
			//正在准备数据，请稍等...
			//显示桌面提醒
			baidu.feNotification.notifyText({
				message : "\u6B63\u5728\u51C6\u5907\u6570\u636E\uFF0C\u8BF7\u7A0D\u7B49..."
			});	
		}
	};
	
	/**
	 * 执行栅格检测
	 */
	var _doGridDetect = function(tab){
        chrome.tabs.sendMessage(tab.id, {
            type: MSG_TYPE.BROWSER_CLICKED,
			event : MSG_TYPE.GRID_DETECT
        });
	};
	
	/**
	 * FDP文档检索助手
	 */
	var _doFdpDocSearch = function(tab){
		chrome.tabs.getAllInWindow(null,function(tabs){
			var isOpened = false;
			var tabId ;
			for(var i = 0,len = tabs.length;i < len;i++){
				if(/^chrome.*fdp.html$/.test(tabs[i].url)) {
					isOpened = true;
					tabId = tabs[i].id;
					break;
				}
			}
			if(!isOpened) {
		        chrome.tabs.create({
		            url : 'template/fehelper_fdp.html',
					selected : true
		        });
			} else {
				chrome.tabs.update(tabId,{selected : true});
				//显示桌面提醒
				baidu.feNotification.notifyText({
					message : "FE\u6587\u6863\u68C0\u7D22\u5DE5\u5177\u5DF2\u542F\u52A8"
				});
			}
		});
	};
	
	/**
	 * 字符串编解码
	 */
	var _doStringEnDecode = function(tab){
		chrome.tabs.getAllInWindow(null,function(tabs){
			var isOpened = false;
			var tabId ;
			for(var i = 0,len = tabs.length;i < len;i++){
				if(/^chrome.*endecode.html$/.test(tabs[i].url)) {
					isOpened = true;
					tabId = tabs[i].id;
					break;
				}
			}
			if(!isOpened) {
		        chrome.tabs.create({
		            url : 'template/fehelper_endecode.html',
					selected : true
		        });
			} else {
				chrome.tabs.update(tabId,{selected : true});
				
				//显示桌面提醒
				baidu.feNotification.notifyText({
					message : "\u5B57\u7B26\u4E32\u7F16\u89E3\u7801\u5DE5\u5177\u5DF2\u542F\u52A8"
				});
			}
		});
	};
	
	/**
	 * JSON查看器
	 */
	var _doJsonFormat = function(tab){
		chrome.tabs.getAllInWindow(null,function(tabs){
			var isOpened = false;
			var tabId ;
			for(var i = 0,len = tabs.length;i < len;i++){
				if(/^chrome.*jsonformat.html$/.test(tabs[i].url)) {
					isOpened = true;
					tabId = tabs[i].id;
					break;
				}
			}
			if(!isOpened) {
		        chrome.tabs.create({
		            url : 'template/fehelper_jsonformat.html',
					selected : true
		        });
			} else {
				chrome.tabs.update(tabId,{selected : true});
			}
		});
	};
	
	/**
	 * QR码生成器
	 */
	var _doQrcode = function(tab){
		chrome.tabs.getAllInWindow(null,function(tabs){
			var isOpened = false;
			var tabId ;
			for(var i = 0,len = tabs.length;i < len;i++){
				if(/^chrome.*qrcode.html$/.test(tabs[i].url)) {
					isOpened = true;
					tabId = tabs[i].id;
					break;
				}
			}
			if(!isOpened) {
		        chrome.tabs.create({
		            url : 'template/fehelper_qrcode.html',
					selected : true
		        });
			} else {
				chrome.tabs.update(tabId,{selected : true});
			}
		});
	};

	/**
	 * 提醒层 缓存
	 * @type {Array}
	 */
	var _notificationCache = [];
	
	/**
	 * 查看页面wpo信息
	 */
	var _showPageWpoInfo = function(wpoInfo){
		chrome.tabs.getSelected(null,function(tab){
			_notificationCache[tab.id].cancel();	
			if(!wpoInfo) {
				baidu.feNotification.notifyText({
					message : "\u5BF9\u4E0D\u8D77\uFF0C\u68C0\u6D4B\u5931\u8D25"
				});	
			}else{
				baidu.feNotification.notifyHtml("template/fehelper_wpo.html?" + JSON.stringify(wpoInfo));
			}
		});
	};

	/**
	 * 获取页面wpo信息
	 * @return {[type]}
	 */
	var _getPageWpoInfo = function(){
		chrome.tabs.getSelected(null,function(tab){	
			//显示桌面提醒
			_notificationCache[tab.id] = baidu.feNotification.notifyText({
					message : "\u6B63\u5728\u7EDF\u8BA1\uFF0C\u8BF7\u7A0D\u540E...",
					autoClose : false
				});	
	        chrome.tabs.sendMessage(tab.id,{
				type : MSG_TYPE.GET_PAGE_WPO_INFO
			});
		});
	};
	
	/**
	 * 根据不同的type运行Helper
	 */
	var _runHelperByType = function(type){
		chrome.tabs.getSelected(null,function(tab){
			switch(type) {
				//fcphelper检测
				case MSG_TYPE.FCP_HELPER_DETECT:
					_doFcpDetect(tab);
					break;
				//栅格检测
				case MSG_TYPE.GRID_DETECT:
					_doGridDetect(tab);
					break;
				//fdp文档检索
				case MSG_TYPE.FDP_HELPER:
					_doFdpDocSearch(tab);
					break;
				//对字符串进行编解码操作
				case MSG_TYPE.EN_DECODE:
					_doStringEnDecode(tab);
					break;
				//json查看器
				case MSG_TYPE.JSON_FORMAT:
					_doJsonFormat(tab);
					break;
				//QR生成器
				case MSG_TYPE.QR_CODE:
					_doQrcode(tab);
					break;
				//查看网页加载时间
				case MSG_TYPE.SHOW_PAGE_LOAD_TIME:
					_getPageWpoInfo();
					break;
			}
		});
	};
	
	
	/**
	 * 创建扩展专属的右键菜单
	 */
	var _createContextMenu = function(){
		_removeContextMenu();
		baidu.contextMenuId = chrome.contextMenus.create({
			title : "FeHelper-FE\u52A9\u624B"
		});
		chrome.contextMenus.create({
			title : "\u7F16\u7801\u68C0\u6D4B",
			parentId : baidu.contextMenuId,
			onclick : function(info,tab) {
				//编码检测
				_doFcpDetect(tab);
			}
		});
		chrome.contextMenus.create({
			title : "\u6805\u683C\u68C0\u6D4B",
			parentId : baidu.contextMenuId,
			onclick : function(info,tab) {
				//执行栅格检测
				_doGridDetect(tab);
			}
		});
		if(baidu.feOption.getOptionItem('opt_item_showfdpmenu') === 'true') {
			chrome.contextMenus.create({
				title : "FE\u6587\u6863\u68C0\u7D22",
				parentId : baidu.contextMenuId,
				onclick : function(info,tab) {
					//执行FDP文档检索
					_doFdpDocSearch(tab);
				}
			});
		}
		chrome.contextMenus.create({
			title : "\u5B57\u7B26\u4E32\u7F16\u89E3\u7801",
			parentId : baidu.contextMenuId,
			onclick : function(info,tab) {
				//字符串编解码
				_doStringEnDecode(tab);
			}
		});
		chrome.contextMenus.create({
			title : "\u7F51\u9875\u52A0\u8F7D\u8017\u65F6",
			parentId : baidu.contextMenuId,
			onclick : function(info,tab) {
				//网页加载耗时
				_getPageWpoInfo();
			}
		});
	};
	
	/**
	 * 移除扩展专属的右键菜单
	 */
	var _removeContextMenu = function(){
		if(!baidu.contextMenuId) return;
		chrome.contextMenus.remove(baidu.contextMenuId);
		baidu.contextMenuId = null;
	};
	
	/**
	 * 创建或移除扩展专属的右键菜单
	 */
	var _createOrRemoveContextMenu = function(){

		//管理右键菜单
		if(baidu.feOption.getOptionItem('opt_item_contextMenus') === 'true') {
			_createContextMenu();
		} else {
			_removeContextMenu();
		}
	};
	
	/**
	 * 接收来自content_scripts发来的消息
	 */
	var _addExtensionListener = function(){
		chrome.extension.onMessage.addListener(function(request,sender,callback){
			//处理CSS的请求
			if(request.type == MSG_TYPE.GET_CSS) {
				//直接AJAX获取CSS文件内容
				baidu.network.readFileContent(request.link,callback);
			}
			//处理JS的请求
			else if(request.type == MSG_TYPE.GET_JS) {
				//直接AJAX获取JS文件内容
				baidu.network.readFileContent(request.link,callback);
			}
			//处理HTML的请求
			else if(request.type == MSG_TYPE.GET_HTML) {
				//直接AJAX获取JS文件内容
				baidu.network.readFileContent(request.link,callback);
			}
			//处理cookie
			else if(request.type == MSG_TYPE.GET_COOKIE) {
				baidu.network.getCookies(request,callback);
			}
			//移除cookie
			else if(request.type == MSG_TYPE.REMOVE_COOKIE) {
				baidu.network.removeCookie(request,callback);
			}
			//设置cookie
			else if(request.type == MSG_TYPE.SET_COOKIE) {
				baidu.network.setCookie(request,callback);
			}
			//CSS准备就绪
			else if(request.type == MSG_TYPE.CSS_READY) {
				_readyState.css = true;
			}
			//JS准备就绪
			else if(request.type == MSG_TYPE.JS_READY) {
				_readyState.js = true;
			}
			//HTML准备就绪
			else if(request.type == MSG_TYPE.HTML_READY) {
				_readyState.html = true;
			}
			//提取配置项
			else if(request.type == MSG_TYPE.GET_OPTIONS){
				baidu.feOption.doGetOptions(request.items,callback);
			}
			//保存配置项
			else if(request.type == MSG_TYPE.SET_OPTIONS){
				baidu.feOption.doSetOptions(request.items,callback);
				//管理右键菜单
				_createOrRemoveContextMenu();
			}
			//保存当前网页加载时间
			else if(request.type == MSG_TYPE.CALC_PAGE_LOAD_TIME){
				_showPageWpoInfo(request.wpo);
			}

            return true;
		});
	};
	
	/**
	 * 粗略统计每天使用人数
	 */
	var _logUserCount = function(){
		var oDate = new Date();
		var year = oDate.getFullYear();
		var month = oDate.getMonth();
		var day = oDate.getDate();
		var isLog = false;
		var logedDate = window.localStorage.getItem("fehelper_user_count");
		if(!logedDate){
			isLog = true;
		}else{
			logedDate = JSON.parse(logedDate);
			if(logedDate.year > year || 
				(logedDate.year === year && logedDate.month > month) ||
				(logedDate.year === year && logedDate.month === month && logedDate.day > day) ) {
					isLog = true;
				}
		}
		if(isLog) {
			window.localStorage.setItem("fehelper_user_count",JSON.stringify({
				year	: year,
				month	: month,
				day		: day
			}));
			baidu.log.track(LOG.fehelper_user_count);
		}
	};

	
	/**
	 * 初始化
	 */
	var _init = function(){
		_logUserCount();
		_addExtensionListener();
		_detectReadyState();
		_createOrRemoveContextMenu();
	};
	
	return {
		init			: _init,
		runHelperByType	: _runHelperByType
	};
})();	

//初始化
BgPageInstance.init();
