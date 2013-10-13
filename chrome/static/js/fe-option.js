/**
 * FeHelper配置项
 * @author zhaoxianlie
 */
baidu.feOption = (function(){
	/**
	 * 将这些配置项保存到background-page，这样才能对每个页面生效
	 * @param {Object} items {key:value}
	 */
	var _saveOptionItemByBgPage = function(items){
		for(var key in items){
			window.localStorage.setItem(key,items[key]);
		}
	};
	
	/**
	 * 从background-page获取配置项
	 * @param {Object} items ["",""]
	 * @return {key:value}
	 */
	var _getOptionItemByBgPage = function(items){
		var rst = {};
		for(var i = 0,len = items.length;i < len;i++){
			rst[items[i]] = window.localStorage.getItem(items[i]);
		}
		return rst;
	};
	
	/**
	 * 向background-page发送请求，提取配置项
	 * @param {Object} items
	 * @param {Function} 回调方法
	 */
	var _goGetOptions = function(items,callback){
		chrome.extension.sendMessage({
			type : MSG_TYPE.GET_OPTIONS,
			items : items
		},callback);
	};
	
	/**
	 * 向background-page发送请求，保存配置项
	 * @param {Object} items
	 * @param {Object} callback
	 */
	var _goSetOptions = function(items){
		chrome.extension.sendMessage({
			type : MSG_TYPE.SET_OPTIONS,
			items : items
		});
	};
	
	/**
	 * 由background-page触发
	 * @param {Object} items
	 * @param {Object} callback
	 */
	var _doGetOptions = function(items,callback){
		if(callback && typeof callback == 'function'){
			callback.call(null,_getOptionItemByBgPage(items));
		}
	};
	
	/**
	 * 由background-page触发
	 * @param {Object} items
	 * @param {Object} callback
	 */
	var _doSetOptions = function(items){
		_saveOptionItemByBgPage(items);
	};
	
	/**
	 * 获取某一项配置
	 * @param {String} optName 配置参数名
	 */
	var _getOptionItem = function(optName){
		return _getOptionItemByBgPage([optName])[optName];
	};
	
	/**
	 * 保存启动项
	 */
	var _save_opt_form_start = function(){
		var items = {};
		items['opt_item_contextMenus'] = $('#opt_item_contextMenus').attr('checked');
		items['opt_item_showfdpmenu'] = $('#opt_item_showfdpmenu').attr('checked');
		items['opt_item_notification'] = $('#opt_item_notification').val();
		_goSetOptions(items);
	};
	
	/**
	 * 显示启动项
	 */
	var _show_opt_form_start = function(){
		var optItems = ['opt_item_contextMenus',"opt_item_showfdpmenu","opt_item_notification"];
		_goGetOptions(optItems,function(opts){
			$.each(optItems,function(i,item){
				if(i == 2) {
					$('#' + item).val(opts[item]);
				} else if(opts[item] === 'true') {
					$('#' + item).attr('checked','checked');
				}
			});
		})
	};
	
	/**
	 * 保存相应的表单配置
	 * @param {Object} form_id
	 */
	var _save = function(form_id){
		switch(form_id){
			case 'opt_form_start':
				_save_opt_form_start();
				break;
			case '':
				
				break;
		}
	};
	
	/**
	 * 关闭配置页面
	 */
	var _closeTab = function(){
		chrome.tabs.getSelected(null,function(tab){
			chrome.tabs.remove(tab.id);
		});
	};
	
	/**
	 * 事件绑定
	 */
	var _bindEvent = function(){
		//左边的可选项
		$('#fe-opt-list-item>li').click(function(e){
			var $this = $(this).siblings().removeClass('selected').end().addClass('selected');
			$($this.attr('data-content')).siblings().removeClass('selected').addClass('fe-hide').end().removeClass('fe-hide').addClass('selected');
		});
		
		//为每个表单注册submit事件
		$('.right form').submit(function(e){
	
			//保存各个值
			_save($(this).attr('id'));
			
			//关闭当前tab
			_closeTab();
			
			e.preventDefault();
			e.stopPropagation();
		});
		
		//给保存按钮注册事件
		$('#btn_close').click(function(){
			//关闭当前tab
			_closeTab();
		});
		
		//给保存按钮注册事件
		$('#btn_save').click(function(){
			$('.right div.selected form').submit();				
		});
	};
	
	/**
	 * 初始化各个配置项
	 */
	var _initOptions = function(){
		_show_opt_form_start();
	};
	
	/**
	 * 初始化
	 */
	var _init = function(){
		_bindEvent();
		_initOptions();
	};
	
	return {
		init : _init,
		doSetOptions : _doSetOptions,
		doGetOptions : _doGetOptions,
		getOptionItem : _getOptionItem
	};
})();




