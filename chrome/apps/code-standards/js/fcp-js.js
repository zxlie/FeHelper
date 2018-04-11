/**
 * 注册命名空间：baidu.js
 */
baidu.namespace.register("baidu.js");

/**
 * js相关处理
 * @author zhaoxianlie
 */
baidu.js = (function(){
	
	var _readyQueen = null;
	var _asyncInterface = 0;
	var _scriptBlockCount  = 0;
	
	/**
	 * js源代码
	 * @item {fileName:'',fileContent:''}
	 */
	var _rawJsSource = [];
	
	/**
	 * 页面cookies
	 */
	_cookies =  [];
	
	/**
	 * 结果集
	 */
	var _summaryInformation = null;
	
	/**
	 * 初始化js文件的读取队列
	 * @param {Object} isFinished 是否读取完成
	 */
	var _initReadyQueen = function(isFinished){
		_readyQueen = {
			curIndex : 0,	//当前正处于读取的index
			queen : [],	//js文件队列，格式为：{src:"",block:""}，其中src和block不可能同时有值
			callback : new Function(),	//回调方法
			finished : isFinished	//是否读取完成
		};
	};
		
	/**
	 * 增加一项读取项
	 * @param {Object} readyItem 格式为：{src:Object,block:Object}
	 */
	var _addReadyItem = function(readyItem){
		_readyQueen.queen.push(readyItem);
	};
	
	/**
	 * 获取当前正在解析的script块
	 */
	var _getCurrentReadyItem = function(){
		return _readyQueen.queen[_readyQueen.curIndex];
	};
	
	/**
	 * 判断当前读取的是否为最后一个script块
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
	 * 根据文件路径，提取文件名
	 * @param {Object} path 文件url
	 */
	var _getFileName = function(path){
		var reg = /(.*\/)([^\/]+\.js)/;
		var p = reg.exec((path || '').replace(/\?.*/,''));
		return p ? p[2] : path ? ('异步接口' + ++_asyncInterface) : ('script块' + ++_scriptBlockCount);
	};
	
	/**
	 * 初始化侦测结果
	 */
	var _initSummaryInformation = function(){
	    _summaryInformation = {
			cookies:  [],						//有效的cookie，[{key:'',value:''}]
			scriptTag : {
				scriptBlock:0,					//页面上的<script type="text/javascript"></script>数量
				scriptSrc:0						//页面上的<script type="text/javascript" src=""></script>数量
			},
			domain : false,						//document是否设置了domain，设置了则domain值为document.domain
			jsMinified : {						//js文件是否被压缩
				files : [],
				count : 0
			},
			tangram : [],						//页面上引用的tangram
			duplicatedFiles : []				//重复的文件
	    };
	};
	
	/**
	 * 保存JS代码
	 * @param {Object} _filePath 文件完整路径
	 * @param {Object} _fileContent 内容
	 */
	var _saveJsSource = function(_filePath,_fileContent){
		
		//过滤CSS注释
		_fileContent = _fileContent.replace(/\/\*[\S\s]*?\*\//g,'');
		
		//提取文件名
		var _fileName = _getFileName(_filePath);
		
		_rawJsSource.push({
			href : _filePath ? _filePath : '#',
			fileName : _fileName,
			fileContent : _fileContent
		});
	};
	
	/**
	 * 将scripts归类进行检测
	 * @param {Array} scripts Script对象数组
	 */
	var _getJsData = function(scripts){
		//从页面上获取<script src> 或者 <script> 内容
		var jsdata = (function(){
			var ss = {src:[],block:[]};
			jQuery.each(scripts,function(i,script){
				//通过 <script src> 标签引用的js
				if(!!script.src) { ss.src.push(script); }
				//通过 <script> 标签定义的js
				else if(!!script.innerHTML) { ss.block.push(script); }
			});
			return ss;
		})();

		return jsdata;
	};
	
	/**
	 * 提取JS文件内容
	 * @param {String} src 需要读取的js文件
	 * @see 具体可参见network.js文件中定义的Function： _readFileContent
	 */
	var _getJsSourceByServer = function(link){
		
		//向background发送一个消息，要求其加载并处理js文件内容
		chrome.runtime.sendMessage({
			type : MSG_TYPE.GET_JS,
			link : link.src
		},function(respData){
			//保存源代码
			_saveJsSource(respData.path,respData.content)
			//继续读取（是从就绪队列中进行读取）
			_readRawJs();
		});
	};
	
	
	/**
	 * 读取页面上已经存在的<script>标签内的js
	 * @param {script} script
	 * @return {Undefined} 无返回值 
	 */
	var _readScriptTagContent = function(script){
		//保存源代码
		_saveJsSource('',script.innerHTML)
		
		//继续读取（是从就绪队列中进行读取）
		_readRawJs();
	};
	
	
	/**
	 * 从就绪队列中，逐个加载js
	 */
	var _readRawJs = function(){
		
		//取得当前需要读取的数据
		var curData = _getCurrentReadyItem();

		//是否读取完成
		if(_isDealFinished() || !curData) {
			chrome.runtime.sendMessage({
				type : MSG_TYPE.JS_READY
			});
			return;
		}
	
		//_readyQueen.curIndex是会被累加的
		_moveToNextReadyItem();
		
		//清空队列
		if(_isLastReadyItem()) {
			_initReadyQueen(true);
		}
		
		//如果是<script>标签
		if(!!curData.block) {
			_readScriptTagContent(curData.block);
		}
		//如果是<script src>标签
		else if(!!curData.src){
			_getJsSourceByServer(curData.src);
		}
	};
	
	/**
	 * 初始化JS数据
	 */
	var _initJsData = function(){
		scripts = _getJsData(document.scripts);
		
		//处理<script>定义的样式
		if(scripts.block && scripts.block.length >0) {
			jQuery.each(scripts.block,function(i,script){
				//加入读取队列
				_addReadyItem({src:null,block:script});
			});
		}
		
		//处理<script src>引入的js文件
		if(scripts.src && scripts.src.length >0) {
			jQuery.each(scripts.src,function(i,src){
				//加入读取队列
				_addReadyItem({src:src,block:null});
			});
		}
	
		//开始读取
		_readRawJs();
	};
	
		
	/**
	 * 对以存储的js代码进行解析
	 */
	var _dealJsFile = function(){
		var isStop = false;
		jQuery.each(_rawJsSource,function(i,fileObj){
			_dealJs(fileObj);
		});
		
		_summaryInformation.scriptTag = {
			scriptSrc : jQuery('script[src]').length,
			scriptBlock : jQuery('script:not(script[src])').length
		};
	};
	
	/**
	 * 处理某个js文件内的js
	 * @param {Object} _fileObj
	 * @config {String} fileName
	 * @config {String} fileContent
	 */
	var _dealJs = function(_fileObj){
		var fileName = _fileObj.fileName;
		var fileContent = _fileObj.fileContent;
		
		//检测js是否压缩
		_detectJsMinify(_fileObj);
		
	};
	
	
	/**
	 * 获取浏览器记录的Cookie
	 */
	var _getCookies = function(){
		chrome.runtime.sendMessage({
			type : MSG_TYPE.GET_COOKIE,
			url : location.href
		},function(respData){
			_cookies = respData.cookie;
		});
	};
	
	/**
	 * 侦测页面的cookie
	 */
	var _detectCookies = function(){
		//cookie已经在_getCookies中准备好了
		_summaryInformation.cookies = _cookies;
	};
	
	/**
	 * 检测某个js文件是否被压缩
	 * @param {Object} jsObj js文件对象
	 * @config {String} href 文件路径
	 * @config {String} fileName 文件名
	 * @config {String} fileContent 文件内容
	 */
	var _detectJsMinify = function(jsObj){
		var lines = jsObj.fileContent.split(/\n/);
		var average_length_perline = jsObj.fileContent.length / lines.length;
		if (average_length_perline < 150 && lines.length > 1) {
			_summaryInformation.jsMinified.count++;
			_summaryInformation.jsMinified.files.push({
				href : jsObj.href,
				fileName : jsObj.fileName
			});
		}
	};
	
	/**
	 * 检测tangram
	 */
	var _detectTangram = function(){
		var allScripts = document.querySelectorAll('script[src]');
		var tangram = [];
		
		jQuery.each(allScripts,function(i,item){
			if(!item.src) return true;
			var _fileName = _getFileName(item.src);
			if(_fileName.indexOf('tangram') > -1) {
				tangram.push(_fileName);
			}
		});
		
		_summaryInformation.tangram = tangram;
	};
	
	/**
	 * 检测是否引入的重复的文件
	 */
	var _detectDuplicatedFile = function(){
		scripts = _getJsData(document.scripts);
		
		var files = {};
		var duplicatedFiles = [];
		var dealedFiles = {};
		
		//处理<script>引入的js文件
		if(scripts.src && scripts.src.length >0) {
			
			jQuery.each(scripts.src,function(i,link){
				files[link.src] = parseInt(files[link.src] || 0,10) + 1;
			});
			jQuery.each(files,function(href,count){
				//文件src重复
				if(count > 1) {
					duplicatedFiles.push({
						href : href,
						count : count
					});
				} else {	//href不重复的情况下，检测文件内容是否相同
					var _fileContent = '';
					var _dupFiles = [];
					jQuery.each(_rawJsSource,function(i,file){
						if(file.href == href) {
							_fileContent = file.fileContent.replace(/\s+/g,'');
							return false;
						}
					});
					jQuery.each(_rawJsSource,function(i,file){
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
	 * 检测Js
	 */
	var _detectJS = function(){
		//处理js文件以及script块
		_dealJsFile();
	};
	
	/**
	 * 初始化
	 */
	var _init = function(){
		//初始化就绪队列
		_initReadyQueen(false);
		//初始化JS数据
		_initJsData();
		//初始化cookie
		_getCookies();
	};
	
	/**
	 * js相关的侦测
	 * @param {Function} callback 侦测完毕后的回调方法，形如：function(data){}
	 * @config {Object} data 就是_summaryInformation
	 */
	var _detect = function(callback){
		
		//初始化结果集
		_initSummaryInformation();
		//cookie侦测
		_detectCookies();
		//侦测页面上script标签
		_detectJS();
		//tangram检测
		_detectTangram();
		//重复文件检测
		_detectDuplicatedFile();
		
		//执行回调
		callback.call(null,_summaryInformation);
	};
	
	
	return {
		init : _init,
		detect : _detect,
		getCookies : _getCookies
	};
	
})();
