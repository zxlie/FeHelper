/**
 * 注册命名空间：baidu.css
 */
baidu.namespace.register("baidu.css");

/**
 * css相关处理
 * @author zhaoxianlie 
 */
baidu.css = (function(){
	
	var _readyQueen = null;
	var _localdata = null;
	var _stats = null;
	var _styleBlockCount  = 0;
	var _rootPath = null;
	
	/**
	 * 存储页面上的css源代码
	 * @item {fileName:'',fileContent:''}
	 */
	var _rawCssSource = [];
		
	var _summaryInformation = null;
	
	
	/**
	 * 初始化css文件的读取队列
	 * @param {Object} isFinished 是否读取完成
	 */
	var _initReadyQueen = function(isFinished){
		_readyQueen = {
			curIndex : 0,	//当前正处于读取的index
			queen : [],	//css文件队列，格式为：{link:"",style:""}，其中link和style不可能同时有值
			callback : new Function(),	//回调方法
			finished : isFinished	//是否读取完成
		};
		_localdata = {};
	};
	
	
	/**
	 * 初始化侦测结果
	 */
	var _initSummaryInformation = function(){		
	    _summaryInformation = {
			styles : [],				//所有的style标签和所有的link[rel=stylesheet]
			cssMinified : {				//css文件是否被压缩
				files : [],
				count : 0
			},
			backgroundImages : [],		//css背景图片统计
			expressions : [],			//css expression统计
			duplicatedFiles : []		//重复引入的文件
	    };
		
	};
	
	/**
	 * 初始化Stats
	 */
	var _initStats = function(){
	    _stats = {
	        matched: {count:0,selectors:[]},	//匹配上的
	        unmatched: {count:0,selectors:[]},	//未匹配上的
	        ignored: {count:0,selectors:[]}		//忽略的
	    };
	};
	
	/**
	 * 增加一项读取项
	 * @param {Object} readyItem 格式为：{link:Object,style:Object}
	 */
	var _addReadyItem = function(readyItem){
		_readyQueen.queen.push(readyItem);
	};
	
	/**
	 * 获取当前正在解析的Style块
	 */
	var _getCurrentReadyItem = function(){
		return _readyQueen.queen[_readyQueen.curIndex];
	};
	
	/**
	 * 判断当前读取的是否为最后一个Style块
	 */
	var _isLastReadyItem = function(){
		return (_readyQueen.curIndex == _readyQueen.queen.length);
	};
	
	/**
	 * 读取队列移动到下一个元素
	 */
	var _moveToNextReadyItem = function(){
		_readyQueen.curIndex += 1;
	};
	
	/**
	 * 判断当前队列是否读取完毕
	 */
	var _isDealFinished = function(){
		return _readyQueen.finished;
	};
	
	/**
	 * 设置当前文件的根路径
	 * @param {Object} path
	 */
	var _setCurRootPath = function(path) {
		var reg = /(.*\/)([^\/]+\.css)/;
		var p = reg.exec((path || '').replace(/\?.*/,''));
		_rootPath = p ? p[1] : '';
	};
	
	/**
	 * 获取当前正在解析的文件的根路径
	 */
	var _getCurRootPath = function(){
		return _rootPath || '';
	};
	
	/**
	 * 根据文件路径，提取文件名
	 * @param {Object} path 文件url
	 */
	var _getFileName = function(path){
		var reg = /(.*\/)([^\/]+\.css)/;
		var p = reg.exec((path || '').replace(/\?.*/,''));
		return p ? p[2] : "style块" + ++_styleBlockCount;
	};
	
	/**
	 * 保存CSS代码
	 * @param {Object} _filePath 文件完整路径
	 * @param {Object} _fileContent 内容
	 */
	var _saveCssSource = function(_filePath,_fileContent){
		
		//过滤CSS注释
		_fileContent = _fileContent.replace(/\/\*[\S\s]*?\*\//g,'');
		
		//提取文件名
		var _fileName = _getFileName(_filePath);
		
		_rawCssSource.push({
			href : _filePath ? _filePath : '#',
			fileName : _fileName,
			fileContent : _fileContent
		});
		
		//对@import处理
		try{
			var reg = /@import\s+url\(\s*(\"|\')(.*)\1\s*\)(\s*;)?/ig;
			_fileContent.replace(reg,function($0,$1,$2){
				_addReadyItem({link:{href:_getCurRootPath() + $2},style:null});
			});
		}catch(err){
		}
	};
	
	/**
	 * 获取一个比较标准的图片地址
	 * @param {Object} bgUrl
	 */
	var _getBgImageUrl = function(bgUrl){
		if(bgUrl.indexOf('http://') != 0) {
			bgUrl = bgUrl.replace(/['"]/g,"");
			var __rp = _getCurRootPath();
			if(bgUrl.indexOf('/') == 0){
				__rp = '';
			} else if(bgUrl.indexOf('./') == 0) {
				bgUrl = bgUrl.substr(2);
			} else if(bgUrl.indexOf('../') == 0) {
				bgUrl = bgUrl.substr(3);
				if(__rp.lastIndexOf('/') == __rp.length - 1) {
					__rp = __rp.substr(0,__rp.length - 1);
				}
				__rp = __rp.substr(0,__rp.lastIndexOf('/') + 1);
			}
			bgUrl = __rp + bgUrl
		}
		return bgUrl;
	};
	
	/**
	 * 寻找并统计CSS背景图片
	 * @param {Object} _fileName
	 * @param {Object} _fileContent
	 */
	var _findBackgroundImage = function(_fileName,_fileContent){

		var reg = /(background|background-image):(?:[\#\w]+\s+)?url\(([^\)]*)\)/ig;
		var arr = [];
		
		_fileContent.replace(/\/\*[\S\s]*?\*\//g,'').replace(/\r?\n/,'')
			.replace(/\s+\'|\"/g,'').replace(reg,function($0,$1,$2){
				$2 = $2.replace(/\?.*/,'');
				arr.push(_getBgImageUrl($2));
		});
		if(arr.length) {
			_summaryInformation.backgroundImages.push({
				fileName:_fileName,
				bgImages : arr
			});
		}
	};
	
	/**
	 * 寻找并统计css中的expression
	 * @param {Object} _fileName
	 * @param {Object} _fileContent
	 */
	var _findExpression = function(_fileName,_fileContent){
		var reg = /:expression\(/ig;
		var arr = _fileContent.replace(/\/\*[\S\s]*?\*\//g,'').replace(/\r?\n/,'')
			.replace(/\s+/g,'').split(reg);
		if(arr.length - 1) {
			_summaryInformation.expressions.push({
				fileName : _fileName,
				count : arr.length - 1
			});
		}
	};
	
	/**
	 * 检测某个css文件是否被压缩
	 * @param {Object} cssObj css文件对象
	 * @config {String} href 文件路径
	 * @config {String} fileName 文件名
	 * @config {String} fileContent 文件内容
	 */
	var _detectCssMinify = function(cssObj){
		var lines = cssObj.fileContent.split(/\n/);
		var average_length_perline = cssObj.fileContent.length / lines.length;
		if (average_length_perline < 150 && lines.length > 1) {
			_summaryInformation.cssMinified.count++;
			_summaryInformation.cssMinified.files.push({
				href : cssObj.href,
				fileName : cssObj.fileName
			});
		}
	};
	
	/**
	 * 将stylesheet归类进行检测
	 * @param {Array} styleheets CSSstyleheet对象数组
	 */
	var _getCssData = function(styleheets){
		//从页面上获取<link> 或者 <style> 内容
		var cssdata = (function(){
			var ss = {link:[],style:[]};
			jQuery.each(styleheets,function(i,styleheet){
				//通过 <link> 标签引用的css样式
				if(!!styleheet.href) { ss.link.push(styleheet); }
				//通过 <style> 标签定义的css
				else { ss.style.push(styleheet); }
			});
			return ss;
		})();
		
		return cssdata;
	};
	
	/**
	 * 提取CSS文件内容
	 * @param {String} link 需要读取的css文件
	 * @see 具体可参见css-background.js文件中定义的Function： _readFileContent
	 */
	var _getCssSourceByServer = function(link){
		_setCurRootPath(link.href);

		//向background发送一个消息，要求其加载并处理css文件内容
		chrome.runtime.sendMessage(null,{
			type : MSG_TYPE.GET_CSS,
			link : link.href
		},function(respData){
			//保存源代码
			_saveCssSource(respData.path,respData.content)
			//继续读取（是从就绪队列中进行读取）
			_readRawCss();
		});
	};
	
	
	/**
	 * 读取页面上已经存在的<style>标签内的样式
	 * @param {StyleSheet} stylesheet 样式
	 * @return {Undefined} 无返回值 
	 */
	var _readStyleTagContent = function(stylesheet){
		//保存源代码
		_saveCssSource('',stylesheet.ownerNode.innerText)
		
		//继续读取（是从就绪队列中进行读取）
		_readRawCss();
	};
	
	
	/**
	 * 从就绪队列中，逐个加载css
	 */
	var _readRawCss = function(){
		
		//取得当前需要读取的数据
		var curData = _getCurrentReadyItem();

		//是否读取完成
		if(_isDealFinished() || !curData) {
			chrome.runtime.sendMessage({
				type : MSG_TYPE.CSS_READY
			});
			return;
		}
	
		//_readyQueen.curIndex是会被累加的
		_moveToNextReadyItem();
		
		//清空队列
		if(_isLastReadyItem()) {
			_initReadyQueen(true);
		}
		
		//如果是<style>标签
		if(!!curData.style) {
			_readStyleTagContent(curData.style);
		}
		//如果是<link>标签
		else if(!!curData.link){
			_getCssSourceByServer(curData.link);
		}
	};
	
	/**
	 * 初始化CSS数据
	 */
	var _initCssData = function(){
		styleheets = _getCssData(document.styleSheets);
		
		//处理<style>定义的样式
		if(styleheets.style && styleheets.style.length >0) {
			jQuery.each(styleheets.style,function(i,style){
				//加入读取队列
				_addReadyItem({link:null,style:style});
			});
		}
		
		//处理<link>引入的css文件
		if(styleheets.link && styleheets.link.length >0) {
			jQuery.each(styleheets.link,function(i,link){
				//加入读取队列
				_addReadyItem({link:link,style:null});
			});
		}

		//开始读取
		_readRawCss();
	};
	
	/**
	 * 输出结果
	 */
	var _outputResult = function(){
		
	    return [{
				type : 0,	//"冗余的CSS选择器"
				count : _stats.unmatched.count,
				content : _stats.unmatched.selectors
			}, {
				type : 1,	//"可能用到的CSS伪类选择器"
				count : _stats.ignored.count,
				content : _stats.ignored.selectors
			}, {
				type : 2,	//"实际用到的CSS选择器"
				count : _stats.matched.count,
				content : _stats.matched.selectors
			}];
	};
	
	/**
	 * 对以存储的css代码进行解析
	 */
	var _dealCssFile = function(){
		var isStop = false;
		jQuery.each(_rawCssSource,function(i,fileObj){
			_dealCssRule(fileObj);
		});
	};
	
	/**
	 * 处理某个css文件内的css rules
	 * @param {Object} _fileObj
	 * @config {String} fileName
	 * @config {String} fileContent
	 */
	var _dealCssRule = function(_fileObj){
		var fileName = _fileObj.fileName;
		var fileContent = _fileObj.fileContent;
		
		//检测css是否压缩
		_detectCssMinify(_fileObj);
		
		//检测css expression
		_findExpression(fileName,fileContent);
		
		//检测css background-image
		_findBackgroundImage(fileName,fileContent);
		
		//css源码分析
		var _cssAnalyticRst = (new baidu.cssAnalytic()).run(fileContent);
		//获得所有选择器
		var _selectors = _getSelectors(_cssAnalyticRst);
		
		//初始化结果集
		_initStats();
		
		//检测
		jQuery.each(_selectors,function(i,item){
			if(item.selector) {
				_detectSelector(item.selector,item.csstext);
			}
		});
	
		_summaryInformation.styles.push({
			path : fileName,
			content : _outputResult()
	    });
	};
	
	/**
	 * 从css分析结果中汇总每个独立的selector和rule的对应关系
	 * @param {Object} _cssAnalyticRst
	 */
	var _getSelectors = function(_cssAnalyticRst){
		var rst = [],_selector='',_csstext = [],_pre_type_start;
		for(var i = 0,len = _cssAnalyticRst.length;i < len;i++){
			var item = _cssAnalyticRst[i];
			//new line
			if(item[1] == baidu.FL.FL_NEW_LINE) {
				continue;
			}
			//device description
			else if(item[1] == baidu.FL.CSS_DEVICE_DESC) {
				_selector = item[0];
				_pre_type_start = baidu.FL.CSS_DEVICE_START;
				continue;
			}
			//selector
			else if(item[1] == baidu.FL.CSS_SELECTOER) {
				_selector = item[0];
				_pre_type_start = baidu.FL.CSS_SELECTOER_START;
				continue;
			} 
			//@import、@charset
			else if(item[1] == baidu.FL.CSS_AT) {
				_selector = item[0];
			}
			//csstext
			else {
				var j = i ;
				for(;j < len;j++) {
					var jtem = _cssAnalyticRst[j];
					//@import、@charset
					if(item[1] == baidu.FL.CSS_AT) {
						j--;
						break;
					} 
					//device description
					else if(jtem[1] == baidu.FL.CSS_DEVICE_END && _pre_type_start == baidu.FL.CSS_DEVICE_START) {
						_csstext.push(jtem[0]);
						break;
					}
					//selector
					else if(jtem[1] == baidu.FL.CSS_SELECTOER_END && _pre_type_start == baidu.FL.CSS_SELECTOER_START) {
						_csstext.push(jtem[0]);
						break;
					}
					//csstext 
					else {
						_csstext.push(jtem[0]);
					}
				}
				i = j ;
			}
		
			//结果记录
			rst.push({
				selector : _selector,
				csstext : _csstext.join('')
			});
			//清空结果集
			_csstext = [];
			_pre_type_start = '';
		}
		return rst;
	};
	
	/**
	 * 检测某个selector是否用到
	 * @param {Object} _selector
	 * @param {Object} _csstext
	 */
	var _detectSelector = function(_selector,_csstext){
		
		//用‘,’分割多个selector
		var _selectors = _selector.replace(/\r?\n/g,'').trim().split(',');
		
		var rawSelector = '',arr;
		var reg = /^([\*\+]+[^ ]+)[ ]+(.*)$/;
		var vreg = /([^:]+)(:hover|:focus|:visited|:link|:active|:before|:after|::)/;
		var type;
		
		jQuery.each(_selectors,function(i,currSelector){
			rawSelector = currSelector;
			arr = reg.exec(currSelector);
			if(arr && arr[1] && arr[2]) {
				currSelector = arr[2];
			}
			
			//是否为CSS伪类
			var isVirtual = false;
			if(currSelector.indexOf('@') > -1 || currSelector.indexOf('-moz-') > -1) {
	            _localdata[currSelector] = 1;
			} else if (!_localdata[currSelector]) {
				//检测是否是伪类
		        var virtualCss = vreg.exec(currSelector);
				if(virtualCss && virtualCss[1]) {
					isVirtual = true;
					currSelector = virtualCss[1];
				}
				try{
					//核心：试图根据该选择器去渲染节点，看能找到几个节点，如果没有找到，则表示匹配失败
		            _localdata[currSelector] = jQuery(currSelector + ':not("[id^=fe-helper-],[id^=fe-helper-] ' + currSelector + '")').length;
				}catch(err){
					_localdata[currSelector] = 0;
				}
	        }
			
			type = _localdata[currSelector] ? isVirtual ? "ignored" : "matched" : "unmatched";
			
			//记录结果
	        _stats[type].count++;
			_stats[type].selectors.push({
				selector : rawSelector,
				cssText : _csstext
			});
		});
	};
	
	/**
	 * 检测css选择器
	 */
	var _detectCSS = function(){
		//处理css文件以及style块
		_dealCssFile();
	};
	
	/**
	 * 检测是否引入的重复的文件
	 */
	var _detectDuplicatedFile = function(){
		styleheets = _getCssData(document.styleSheets);
		
		var files = {};
		var duplicatedFiles = [];
		var dealedFiles = {};
		
		//处理<link>引入的css文件
		if(styleheets.link && styleheets.link.length >0) {
			
			jQuery.each(styleheets.link,function(i,link){
				files[link.href] = parseInt(files[link.href] || 0,10) + 1;
			});
			jQuery.each(files,function(href,count){
				//文件href重复
				if(count > 1) {
					duplicatedFiles.push({
						href : href,
						count : count
					});
				} else {	//href不重复的情况下，检测文件内容是否相同
					var _fileContent = '';
					var _dupFiles = [];
					jQuery.each(_rawCssSource,function(i,file){
						if(file.href == href) {
							_fileContent = file.fileContent.replace(/\s+/g,'');
							return false;
						}
					});
					jQuery.each(_rawCssSource,function(i,file){
						if(_fileContent == file.fileContent.replace(/\s+/g,'') && !dealedFiles[file.href] && _dupFiles.join(',').indexOf(file.href) == -1) {
							_dupFiles.push(file.href);
						}
					});
					if(_dupFiles.length > 1) {
						duplicatedFiles.push({
							href : href,
							dupFiles : _dupFiles
						});
						dealedFiles[href] = true;
					}
				}
			});
		}
		
		_summaryInformation.duplicatedFiles = duplicatedFiles;
	};
	
	/**
	 * 初始化
	 */
	var _init = function(){
		//初始化就绪队列
		_initReadyQueen(false);
		//初始化CSS数据
		_initCssData();
	};
	
	/**
	 * css相关处理
	 * @param {Function} callback 侦测完毕后的回调方法，形如：function(data){}
	 * @config {Object} data 就是_summaryInformation
	 */
	var _detect = function(callback){
		
		//初始化结果集
		_initSummaryInformation();
		
		//执行侦测
		_detectCSS();
		
		//检测重复引入的文件
		_detectDuplicatedFile();
		
		//执行回调
		if(callback && typeof callback == "function") {
			callback.call(null,_summaryInformation);
		}
	};
	
	
	return {
		init : _init,
		detect : _detect
	};
	
})();

