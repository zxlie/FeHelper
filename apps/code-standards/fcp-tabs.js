/**
 * 注册命名空间
 */
baidu.namespace.register("baidu.fcptabs");

/**
 * tab相关处理
 * @author zhaoxianlie 
 */
baidu.fcptabs = (function(){
	
	/**
	 * 存储临时变量
	 */
	var _tempvar = {};
	
	/**
	 * 创建主面板
	 */
	var _createMainTab = function(){
		//首先检测面板箱是否存在
		var $tabBox = jQuery("#fe-helper-box");
		var $mainTab = jQuery("#fe-helper-main-tab");
		
		//有了则删掉
		if($tabBox[0]){
			$tabBox.remove();
		}
		
		$tabBox = jQuery('<div id="fe-helper-box" class="fe-helper-hide"></div>').appendTo("body");
		jQuery('<iframe id="fe-helper-main-ifr" src="about:blank" frameborder="0"></iframe>').appendTo($tabBox);
		$mainTab = jQuery('<div id="fe-helper-main-tab"></div>').appendTo($tabBox).html('\
		<ul id="fe-helper-main-ul">\
			<li id="fe-helper-closethick"><span class="ui-icon ui-icon-closethick" title="关闭面板">Close</span></li>\
			<li id="fe-helper-plusthick" class="fe-helper-hide"><span class="ui-icon ui-icon-plusthick" title="最大化面板">Maximun</span></li>\
			<li id="fe-helper-minusthick"><span class="ui-icon ui-icon-minusthick" title="最小化面板">Minimun</span></li>\
		</ul>\
		');
		
		//最大化显示
		$tabBox.css({
			height : jQuery(window).height()
		});
	
		// 初始化mainTab，并增加tab方法
		$mainTab.tabs({
			tabTemplate: "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>",
			add: function( event, ui ) {
							
				//设置子面板大小
				jQuery('#fe-helper-tab-' + _tempvar.type).css({
					height : jQuery(window).height() - 80
				});
				
				var _t_id = 'fe-helper-acc-' + _tempvar.type;
				
				jQuery( ui.panel ).append( "<div id='" + _t_id + "'>" + _tempvar.tabContent + "</div>" );
									
				//设置子面板大小
				jQuery('#' + _t_id).css({
					height : jQuery(window).height() - 80
				});
						
				//是否需要将内容部分以Accordion形式展现
				if(_tempvar.isAccordion) {
					jQuery("#" + _t_id).accordion({
						collapsible: true,
						active:false
					});
					
					//.rst-content
					var _rst_content = jQuery("#" + _t_id + " .rst-content");
					var _height = jQuery(window).height() - 120 - _rst_content.length * 30;
					_rst_content.css({
						height : _height
					});
				}
			}
		});
		
		//对新产生的tab，增加移除事件
		jQuery( "#fe-helper-main-ul span.ui-icon-close" ).on( "click", function() {
			var $allTabs = jQuery( "#fe-helper-main-ul li");
			var index = $allTabs.index( jQuery( this ).parent() ) - 3;
			$mainTab.tabs( "remove", index );
			
			//如果所有tab都关闭了，则关闭整个tabBox
			if($allTabs.length == 4) {
				_tempvar.tabBox.remove();
			}
		});
		
		//三个按钮的事件
		jQuery("#fe-helper-closethick").click(function(e){
			_tempvar.tabBox.hide("slide");
		});
		jQuery("#fe-helper-plusthick").click(function(e){
			_tempvar.tabBox.css({
				height : jQuery(window).height()
			});
			jQuery(this).hide().next().show();
		});
		jQuery("#fe-helper-minusthick").click(function(e){
			_tempvar.tabBox.css({
				height : 38
			});
			jQuery(this).hide().prev().show();
		});
		
		//window大小改变时候
		jQuery(window).resize(function(e){
			_tempvar.tabBox.css({
				height : jQuery(window).height()
			});
		});
	
		//保存mainTab
		_tempvar.tabBox = $tabBox;
		_tempvar.mainTab = $mainTab;
		
		return $tabBox;
	};
	
	/**
	 * 根据不同的标题，在页面上增加面板
	 * @param {Object} type 面板的类型：HTML，CSS，Javascript
	 * @param {Object} tabTitle 面板标题
	 * @param {Object} tabContent 面板内容
	 * @param {Object} isAccordion 是否生成Accordion
	 */
	var _addTab = function(type,tabTitle,tabContent,isAccordion) {
		//保存这个值，创建tab时用到
		_tempvar.type = type;
		_tempvar.tabContent = tabContent;
		_tempvar.isAccordion = isAccordion;
		
		//创建新的面板
		return _tempvar.mainTab.tabs(
			"add",
			"#fe-helper-tab-" + _tempvar.type,
			tabTitle);
	};
	
	/**
	 * 根据不同的标题，在页面上增加HTML面板
	 * @param {Object} type 面板的类型：HTML，CSS，Javascript
	 * @param {Object} tabContent HTML面板内容
	 */
	var _addIssueSuggestionTab = function(type,tabContent) {
		//创建面板
		return _addTab(type + '-issue-sug',baidu.i18n.getMessage('msg0061',[type]),tabContent,false);
	};
	
	/**
	 * 根据不同的标题，在页面上增加HTML面板
	 * @param {Object} tabContent HTML面板内容
	 */
	var _addHtmlTab = function(tabContent) {
		//创建面板
		return _addTab('html',baidu.i18n.getMessage('msg0001'),tabContent,true);
	};
	
	/**
	 * 在页面上创建Javascript面板
	 * @param {Object} tabContent HTML面板内容
	 */
	var _addJavascriptTab = function(tabContent) {
		//创建新的面板
		return _addTab('js',baidu.i18n.getMessage('msg0003'),tabContent,true);
	};
	
	/**
	 * 根据不同的标题，在页面上增加CSS面板
	 * @param {Object} tabTitle 面板标题
	 * @param {Object} tabContent 面板内容
	 */
	var _addCssTab = function(tabTitle,tabContent) {
		//保存这个值，创建tab时用到
		_tempvar.cssTabContent = tabContent;
		_tempvar.cssTabCount = _tempvar.cssTabCount || 0;
		_tempvar.cssTabCount++
		
		_tempvar.cssTab = jQuery('#fe-helper-tab-css');
		
		if(!_tempvar.cssTab[0]) {
			//创建面板
			_addTab('css',baidu.i18n.getMessage('msg0002'),'',false);
			_tempvar.cssTab = jQuery('#fe-helper-tab-css').html('<ul id="fe-helper-css-ul"></ul>');
			
			// 初始化mainTab，并增加tab方法
			_tempvar.cssTab.tabs({
				tabTemplate: "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>",
				add: function( event, ui ) {
					var _t_id = 'fe-helper-css-acc-' + _tempvar.cssTabCount;
					jQuery( ui.panel ).append( "<div id='" + _t_id + "'>" + _tempvar.cssTabContent + "</div>" );
					jQuery("#" + _t_id).accordion({
						collapsible: true,
						active:false
					});
					
					//.rst-content
					var _rst_content = jQuery("#" + _t_id + " .rst-content");
					var _height = jQuery(window).height() - 180 - _rst_content.length * 30;
					_rst_content.css({
						height : _height
					});
				}
			});
				
			//对新产生的tab，增加移除事件
			jQuery( "#fe-helper-css-ul span.ui-icon-close" ).on( "click", function() {
				var $allTabs = jQuery( "#fe-helper-css-ul li");
				var index = $allTabs.index( jQuery( this ).parent() );
				_tempvar.cssTab.tabs( "remove", index );
			});
		}
		
		//创建新的面板
		return _tempvar.cssTab.tabs(
			"add",
			"#fe-helper-tab-css-" + _tempvar.cssTabCount,
			tabTitle);
	};
	
	/**
	 * 创建进度条
	 */
	var _createProgressBar = function(){
		
		var _startTime = new Date();

		//先创建主面板
		baidu.fcptabs.createMainTab();
		
		if(_tempvar.progressbar) {
			_tempvar.mask.remove();
		}
		//创建遮罩面板
		_tempvar.mask = jQuery('<div id="fe-helper-pb-mask">' +
									'<div id="f-h-p-m"></div>' +
									'<div id="fe-helper-progress-bar-img">正在进行页面检测，请稍后...</div>' +
									'<div id="fe-helper-progress-bar"></div>' +
								'</div>').appendTo('body');
		//遮罩层大小
		jQuery('#f-h-p-m').css({
			height : jQuery(window).height(),
			width : jQuery(window).width()
		});
		
		//进度条背景
		var pbarGif = chrome.extension.getURL('code-standards/pbar-ani.gif');
		jQuery('#fe-helper-progress-bar-img').css({
			'background' : 'url(' + pbarGif + ') repeat-x'
		});
		
		//产生滚动条，初始化进度为0
		_tempvar.progressbar = jQuery('#fe-helper-progress-bar')
				.progressbar({
					value : 0,
					complete : function(event,ui){
						var _pbImg = jQuery('#fe-helper-progress-bar-img').html('页面检测完成，共计耗时：' + (new Date() - _startTime) / 1000 + ' s');
						//完成以后展示检测结果
						_tempvar.tabBox.show('slide',{},500);
						jQuery('#f-h-p-m').fadeOut(500);
						_pbImg.fadeOut(3000);
					}
				});
		jQuery('#fe-helper-progress-bar-img').css({
					top : jQuery(window).height() / 2 - 40,
					left : ( jQuery(window).width() - 800) / 2
				});
	};
	
	/**
	 * 更新进度条
	 * @param {Object} _value
	 */
	var _updateProgressBar = function(_value){
		_tempvar.progressbar.progressbar('value',_value);
	};
	
	
	return {
		createMainTab : _createMainTab,
		addHtmlTab : _addHtmlTab,
		addJavascriptTab : _addJavascriptTab,
		addCssTab : _addCssTab,
		addIssueSuggestionTab : _addIssueSuggestionTab,
		createProgressBar : _createProgressBar,
		updateProgressBar : _updateProgressBar
	};
	
})();

