/**
 * 注册命名空间：baidu.fdp
 */
baidu.namespace.register("baidu.fdphelper");

/**
 * 栅格相关处理
 * @author zhaoxianlie 
 */
baidu.fdphelper = (function(){
	

	/**
	 * 当前的搜索范围，默认为FDP搜索
	 */
	var _G_CUR_DOC_ = 'fdp';
	
	/**
	 * 文档路径
	 */
	var _DOC_PATH = {
		fdp : "http://fe.baidu.com/space/doc/",
		fe : "http://fe.baidu.com/doc/"
	};
	
	/**
	 * 数据缓存
	 */
	var _dataCache = {
		fdp : [],
		fe : []
	};
	
	/**
	 * 获取FDP文档数据
	 */
	var _getFdpDocData = function(){
		if(!_dataCache.fdp.length) {
            var url = 'http://fe.baidu.com/space/static/js/doc_data.js?v=' + (new Date() - 1);

            //向background发送一个消息，要求其加载并处理js文件内容
            chrome.extension.sendMessage({
                type : MSG_TYPE.GET_JS,
                link : url
            },function(respData){
                eval(respData.content);
                _parseFdpDocData(g_docData);
                jQuery('#num-fdp-doc').html(_dataCache.fdp.length);
            });

		}
	};
	
	/**
	 * 获取FE文档数据
	 */
	var _getFeDocData = function(){
		if(!_dataCache.fe.length) {
            var url = 'http://fe.baidu.com/doc/_ADoc/search/Data/docData.js?v=' + (new Date() - 1);

            //向background发送一个消息，要求其加载并处理js文件内容
            chrome.extension.sendMessage({
                type : MSG_TYPE.GET_JS,
                link : url
            },function(respData){
                eval(respData.content);
                _dataCache.fe = docData;
                jQuery('#num-fe-doc').html(docData.length);
            });

		}
	};
	
	/**
	 * 解析Fdp平台文档数据
	 * @param {Object} fdpData
	 */
	var _parseFdpDocData = function(fdpData){
		_dataCache.fdp = [];
		var t;
		for(var url in fdpData) {
			t = fdpData[url];
			_dataCache.fdp.push({
				url : url,
				title : t[0],
				author : t[1],
				mtime : t[2]
			});
		}
	};

	/**
	 * 在data数据中搜索key，分别在title和author中进行模糊匹配
	 * @param {Object} data
	 * @param {Object} key
	 */
	var _searchAdoc = function(data,key) {
		var titleResult = [];
		var authorResult = [];
		var urlResult = [];
		try {
			var reg = new RegExp(key, 'i');
			for (var i = 0, l = data.length; i < l; i++) {
				var item = data[i];
				if (reg.test(item['title'])) {
					titleResult.push(item);
				} else if (reg.test(item['author'])) {
					authorResult.push(item);
				} else if (reg.test(item['url'])) {
					urlResult.push(item);
				}
			}
			return titleResult.concat(authorResult.concat(urlResult));
		} catch (e) {
			return [];
		}
	};
	
	/**
	 * 将关键字进行加粗高亮显示
	 * @param {Object} word
	 * @param {Object} key
	 */
	var _searchLighter = function(word, key) {
		var reg = new RegExp(key, 'ig');
		return word.replace(reg, 
			function ($0) {
				return '<b class="-d-highlight">' + $0 + '</b>';
			}
		);
	};
	
	/**
	 * 执行文档检索
	 */
	var _doDocSearch = function() {
		//获取关键字
		var key = jQuery('#fdp-search-input').val().trim();
		//结果显示
		var $resultEl = jQuery('#fdp-doc-rst-list');
	
		//关键字为空
		if (key.length === 0) {
			$resultEl.html('<div class="-d-no-result">请输入关键字进行检索</div>');
			return;
		}
		
		//执行检索
		var data = _searchAdoc(_dataCache[_G_CUR_DOC_],key);
		if (data.length === 0) {
			$resultEl.html('<div class="-d-no-result">很抱歉，没有结果</div>');
			return;
		}
	
		//搜索结果的显示模板
		var tpl = '<dd>' +
					'<i>[{4}] </i>' +
					'<a href="{1}" target="_blank" title="{2}">{0}</a>' +
					'<span class="-d-author">{3}</span>' +
				'</dd>';
		var html = ['<dt>检索结果：共找到 <b class="-d-highlight">' + data.length + '</b> 个文档</dt>'];
	
		//显示结果
		for (var i = 0, l = data.length; i < l; i++) {
			if (i > 300) {	//超过300个结果，则表示关键字太模糊了
				break;
			}
			var item = data[i];
			var url = item['url'];
			var title = item['title'];
			
			//下面获取文件类型
			var lastDotIndex = url.lastIndexOf('.');
			var fileType = '';
			if (lastDotIndex >= 0) {
				fileType = url.substr(lastDotIndex + 1);
			}
	
			//结果填充
			html.push(
				tpl.format(
					_searchLighter(item['title'], key),
					_DOC_PATH[_G_CUR_DOC_] + url,
					title,
					_searchLighter(item['author'], key),
					fileType.toLowerCase()
				)
			);
		}
		
		//结果显示
		$resultEl.html(html.join(''));
	};
	
	/**
	 * 绑定“FDP文档”和“FE文档”的点击事件
	 */
	var _bindDocSourceEvent = function(){
		jQuery('#fdp-doc-nav .-d-normal').click(function(e){
			var $this = jQuery(this);
			$this.addClass('-d-selected').siblings('li').removeClass('-d-selected');
			if($this.is('#fdp-doc')) {
				_getFdpDocData();
				_G_CUR_DOC_ = 'fdp';
			} else if($this.is('#fe-doc')) {
				_getFeDocData();
				_G_CUR_DOC_ = 'fe';
			}
			_doDocSearch();
		});
	};
	
	
	/**
	 * 绑定“搜索”框的点击事件
	 */
	var _bindSearchInputEvent = function(){
		jQuery('#fdp-search-input').keyup(function(e){
			_doDocSearch();
		});
	};
	
	/**
	 * 绑定“搜索”按钮的点击事件
	 */
	var _bindSearchBtnEvent = function(){
		jQuery('#fdp-search-btn').click(function(e){
			_doDocSearch();
		});
	};
	
	
	/**
	 * 初始化
	 */
	var _init = function(){
		//获取FDP文档数据
		_getFdpDocData();
		//获取FE文档数据
		_getFeDocData();
		
		//绑定“FDP文档”和“FE文档”的点击事件
		_bindDocSourceEvent();
		//绑定“搜索”按钮的点击事件
		_bindSearchBtnEvent();
		//绑定“搜索”框的点击事件
		_bindSearchInputEvent();
		
	};
	
	return {
		init : _init
	};
})();

jQuery(function(){
    baidu.fdphelper.init();
});