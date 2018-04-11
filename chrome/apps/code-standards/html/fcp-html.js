
/**
 * 注册命名空间
 */
baidu.namespace.register("baidu.html");

/**
 * html相关处理
 * @author zhaoxianlie 
 */
baidu.html = (function(){
	/**
	 * 页面源代码
	 */
	var _pageSource = '';					
	
	/**
	 * 结果集
	 */
	var _summaryInformation = null;
	
	/**
	 * 初始化侦测结果
	 */
	var _initSummaryInformation = function(){
	    _summaryInformation = {
	        HTMLBase: {	
	            HTMLDeprecatedAttribute: {},	//过期的属性
	            HTMLDeprecatedTag: {}			//过期的标签
	        },
	        documentMode: {
	            hasDocType: false,				//是否设置了doctype
	            compatMode: {
	                IE: 'Q',					//IE中的compatMode
	                WebKit: 'Q'					//Webkit中的compatMode
	            },
	            publicId: '',					//doctype中的publicId
	            hasComment: false,				//doctype前是否有注释
	            hasConditionalComment: false,	//doctype前是否有条件注释
	            isUnusualDocType: false			//是否为怪异的doctype
	        },
	        DOM: {
	            IECondComm: [],					//所有的IE条件注释
	            FFNotSptComm: [],				//Firefox中不支持的注释：不能出现‘--’
				allComm:[],						//所有的注释
				count : 0,						//所有节点的数量
				invalidInput:{			
					count:0,					//不合法的input数量
					input:[]					//不合法的input集合
				},
				maxDepth : {
					xpath : '',					//xpath
					depth : 1					//深度
				}
	        },
	        title: [],							//HTML的title检测
	        LINK: {
	            notInHead: []					//不在Head标签内部的Link标签
	        },
			ID: {
				ids: {},						//重复的ID
				count : 0						//出现重复ID的个数
			},
			tagInclude : [],					//标签的包含关系
			unClosedTags : [],					//未闭合的标签
			htmlMinified : true	,				//HTML是否压缩过
			imgTag : []							//Img标签的检测，src为空否
	    };
	};
	
	/**
	 * 检测某个标签是否为过时的标签
	 * @param {Object} tagName
	 */
	var _isHTMLDeprecatedTag = function(tagName) {
	  return baidu.FlConst.HTML_DEPRECATED_TAGS[tagName.toLowerCase()];
	};
	
	/**
	 * 判断某个属性是否已过时
	 * @param {Object} tagName 待检测的标签
	 * @param {Object} attrName 待检测的属性
	 */
	var _isHTMLDeprecatedAttribute = function(tagName, attrName){
		tagName = tagName.toLowerCase();
		attrName = attrName.toLowerCase();
	    return (baidu.FlConst.HTML_DEPRECATED_ATTRIBUTES[attrName] && baidu.FlConst.HTML_DEPRECATED_ATTRIBUTES[attrName][tagName]);
	};
	
	
	/**
	 * 将检测到的过时标签记录到结果集中
	 * @param {Object} element
	 */
	var _detectDeprecatedTag = function(element){
	    var tagName = element.tagName.toLowerCase();
	    
        if (_isHTMLDeprecatedTag(tagName)) {
		    var HTMLDeprecatedTag = _summaryInformation.HTMLBase.HTMLDeprecatedTag;
		    if (!HTMLDeprecatedTag[tagName]) {
		        HTMLDeprecatedTag[tagName] = 0;
		    }
		    HTMLDeprecatedTag[tagName]++;
        }
	};
	
	
	/**
	 * 将检测到的过时属性记录到结果集中
	 * @param {Object} element
	 */
	var _detectDeprecatedAttribute = function(element){
        var tagName = element.tagName.toLowerCase();
        var attributes = element.attributes;
	    var HTMLDeprecatedAttribute = _summaryInformation.HTMLBase.HTMLDeprecatedAttribute;
        for (var j = 0, c = attributes.length; j < c; ++j) {
            var attrName = attributes[j].name;
            if (_isHTMLDeprecatedAttribute(tagName, attrName)) {
			    if (!HTMLDeprecatedAttribute[attrName]) {
			        HTMLDeprecatedAttribute[attrName] = {};
			    }
				if(!HTMLDeprecatedAttribute[attrName][tagName]) {
					HTMLDeprecatedAttribute[attrName][tagName] = 0;
				}
				HTMLDeprecatedAttribute[attrName][tagName]++;
            }
        }
        
	   
	};
	
	/**
	 * 获取页面上的符合过滤条件的所有节点，可以是TEXT、COMMENT、HTMLELEMENT等
	 * @param {Object} rootNode 以该节点作为根节点开始进行搜索
	 * @param {Integer} nodeFilter	过滤器，从NodeFilter中获得
	 */
	var _getNodes = function(rootNode, nodeFilter){
	    var nodeIterator = document.createNodeIterator(rootNode, nodeFilter, null, false);
	    var nodes = [];
	    var node = nodeIterator.nextNode();
	    while (node) {
	        nodes.push(node);
	        node = nodeIterator.nextNode();
	    }
	    return nodes;
	};
	
	/**
	 * 侦测IE条件注释
	 */
	var _detectIECondComm = function(){
	    var nodes = _getNodes(document.documentElement, NodeFilter.SHOW_COMMENT);
		//仅IE支持的注释
	    var ieCondCommRegExp = /\[\s*if\s*[^\]][\s\w]*\]/i;
		//FF的注释中不能出现'--'
		var ffNotSupportComReg = /--/g;
	    for (var i = 0, c = nodes.length; i < c; ++i) {
	        var currentNode = nodes[i];
	        if (ieCondCommRegExp.test(currentNode.nodeValue)) {
	            _summaryInformation.DOM.IECondComm.push(currentNode.nodeValue);
	        }
			if(ffNotSupportComReg.test(currentNode.nodeValue)) {
	            _summaryInformation.DOM.FFNotSptComm.push(currentNode.nodeValue);
			}
	        _summaryInformation.DOM.allComm.push(currentNode.nodeValue);
	    }
	};
	
	/**
	 * 侦测documentMode
	 */
	var _detectCompatMode = function() {
		_summaryInformation.documentMode = baidu.doctype.getDocMode();
	};
	
	/**
	 * 检测重复的ID
	 */
	var _detectDuplicatedID = function(ids){
		var ID = _summaryInformation.ID;
		for(var id in ids) {
			if(ids[id] > 1) {
				ID.ids[id] = ids[id];
				ID['count']++;
			}
		}
	};
	
	/**
	 * 检测页面DOM节点的最大深度
	 */
	var _detectDomMaxDepth = function(dom){
		//如果不是html节点，则直接退出
		if(dom.nodeType !== 1 || !dom.tagName) return;
		
		//扩展屏蔽
		if(dom.id === 'fe-helper-tab-box' || dom.id === 'fe-helper-pb-mask') return;
		
		//最大深度记录
		var maxDepth = _summaryInformation.DOM.maxDepth;
		var depth = 0;
		var curTag , xpath = [];

		//深度遍历
		do {
			//扩展屏蔽
			if(dom.id === 'fe-helper-tab-box' || dom.id === 'fe-helper-pb-mask') return;
            //忽略SVG节点
            if(dom.tagName.toLowerCase() == 'svg') continue;

            try{
                if(dom.id) {	//如果该节点有id，则拼接id
                    curTag = dom.tagName.toLowerCase() + '<span style="color:red;">#' + dom.id + '</span>';
                } else if(dom.className) {	//没有id，但有class，则拼接class
                    curTag = dom.tagName.toLowerCase() + '<span style="color:green;">.' + dom.className.split(/\s+/).join('.') + '</span>';
                } else {		//没有id也没有class，就只要标签名
                    curTag = dom.tagName.toLowerCase();
                }
            }catch(e){
                continue;
            }
			
			depth++;
			xpath.unshift(curTag);
		} while((dom = dom.parentNode) && dom.nodeType === 1);
		
		//判断当前这个dom节点是否为最大深度
		if(depth > maxDepth.depth) {
			maxDepth.depth = depth;
			maxDepth.xpath = xpath.join('<span style="color:gray;">&gt;</span>');
		}
	};
	
	/**
	 * 扫描整个页面的所有元素，侦测并记录结果
	 */
	var _scanAllElements = function(){
		//所有节点
	    var elementList = _getNodes(document.documentElement, NodeFilter.SHOW_ELEMENT);
	    //所有节点个数
	    _summaryInformation.DOM.count = elementList.length;
		
		//定义一个对象，用来标记节点的ID，当某一个节点的ID值大于1时，表示ID重复
		var objDomId = {};
	    
		//页面扫描
	    for (var i = 0, len = elementList.length; i < len; ++i) {
	        var element = elementList[i];
			//侦测过时的标签
	        _detectDeprecatedTag(element);
	        
			//侦测过时的属性
	        _detectDeprecatedAttribute(element);
			
			//最大深度检测
			_detectDomMaxDepth(element);
			
			//ID记录
			if(!!element.id) {
				if(!objDomId[element.id]) objDomId[element.id] = 0;
				objDomId[element.id]++;
			}
	    }
		
		//侦测重复的ID
		_detectDuplicatedID(objDomId);
	};
	
	/**
	 * 检测页面上的link标签
	 */
	var _detectLink = function(){
	    //获取页面上所有的link标签
	    var allLink = document.querySelectorAll('link');
	    //获取head标签内的link标签
	    var inHeadLink = document.querySelectorAll('head link');
		
		//不在Head标签内的Link
		var notInHeadLink = [];
		jQuery.each(allLink,function(i,link){
			var isNotInHead = true;
			jQuery.each(inHeadLink,function(j,temp){
				if(link.href == temp.href) {
					isNotInHead = false;
				}
			});
			isNotInHead ? notInHeadLink.push(link) : false;
		});
	    //记录未标记在head标签中的link
	    _summaryInformation.LINK.notInHead = notInHeadLink;
	};
	
	/**
	 * 侦测页面上的title标签
	 */
	var _detectTitle = function(){
		var allTitle = document.querySelectorAll('title');
		var inHeadTitle = document.querySelectorAll('head title');
		var flag = false;
		
		var titles = [];
		jQuery.each(allTitle,function(i,t){
			flag = false;
			jQuery.each(inHeadTitle,function(j,k){
				if(t == k) {
					flag = true;
					return false;
				}
			});
			titles.push({
				dom : t,
				isInHead : flag
			});
		});
		 _summaryInformation.title = titles;
	};
	
	/**
	 * 检测页面上是否存在src未空的img标签
	 */
	var _detectImgTags = function(){
		//这里只检测src属性为空的img标签，如果img标签没有设置src属性，如<img />，则跳过检测
		var allImgTags = document.querySelectorAll('img[src]');
		
		var imgTags = [];
		var reg = /.*src=\"(.*)\".*/;
		var arr = [];
		jQuery.each(allImgTags,function(i,k){
			arr = reg.exec(k.outerHTML);
			if(!arr || arr[1].trim() == '') {
				imgTags.push(k);
			}
		});
		_summaryInformation.imgTag = imgTags;
	};
	
	/**
	 * 对input[type=text],input[type=password]进行监测
	 * 不能以size属性来确定其尺寸
	 */
	var _detectInputBox = function(){
		var inputBoxs = document.querySelectorAll('input[type=text],input[type=password]');
		var invalidInput = _summaryInformation.DOM.invalidInput;
		jQuery.each(inputBoxs,function(i,input){
			if(input.getAttribute('size')) {
				invalidInput.count++;
				invalidInput.input.push(input);
			}
		});
	};

    /**
     * 获取某个节点的outerhtml，超过40个字符，则以...代替
     * @param {} elm
     */
    var getOuterHtmlEllipsis = function(elm) {
        var reg = /(<[^>]+>)/g;
        var arr = reg.exec(elm.outerHTML);
        var rst = arr ? arr[1] : elm.outerHTML;
        rst = rst.length > 40 ? rst.substr(0,40) + '...' : rst;
        return rst.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    };
	
	/**
	 * 检测标签的包含情况：是否有inline-tag包含了block-tag
	 */
	var _detectTagIncludeCase = function(){
		var tagInclude = _summaryInformation.tagInclude;
		var tempArr = null;
		var inlineElm = null;
		//遍历inline-tag
		jQuery.each(baidu.FlConst.INLINE_HTML_ELEMENT,function(i,inlineTag){
			//遍历block-tag
			jQuery.each(baidu.FlConst.BLOCK_HTML_ELEMENT,function(j,blockTag){
				tempArr = document.querySelectorAll(inlineTag + '>' + blockTag); 
				if(tempArr.length > 0) {
					inlineElm = getOuterHtmlEllipsis(tempArr[0].parentNode);
					jQuery.each(tempArr,function(k,item){
						tagInclude.push({
							inline : inlineElm,						//包含了block-tag的inline-tag
							block : getOuterHtmlEllipsis(item)		//被包含的block-tag
						});
					});
				}
			});
		});
	};
	
	
	/**
	 * 检测页面上是否有没有闭合的标签
	 * Chrome会自动补全未闭合的标签，所以通过innerHTML获取到的HTML内容已经是闭合的了
	 */
	var _detectTagUnClosed = function(){
		var html = _pageSource;
		
		//开始进行html代码词法分析
		var htmlInstance = new baidu.htmlAnalytic();
		var rst = htmlInstance.getUnclosedTags(html);
		for(var i = 0;i < rst.length;i++){
			_summaryInformation.unClosedTags.push(rst[i].outerHTML.replace(/</g,'&lt;').replace(/>/g,'&gt;'));
		}
	};
	
	/**
	 * 检测HTML代码是否压缩过
	 */
	var _detectHtmlMinify = function(){
		var lines = _pageSource.split(/\n/);
		var average_length_perline = _pageSource.length / lines.length;
		if (average_length_perline < 150) {
			_summaryInformation.htmlMinified = false;
		}
	};
	
	/**
	 * 获取本页面的源代码
	 */
	var _getPageSource = function(callback){
		chrome.runtime.sendMessage({
			type : MSG_TYPE.GET_HTML,
			link : location.href.split('#')[0]
		},function(respData){
			//保存源代码
			_pageSource = respData.content;
			
			//html就绪	
			chrome.runtime.sendMessage({
				type : MSG_TYPE.HTML_READY
			});

			callback && callback();
		});
	};
	
	/**
	 * 初始化
	 */
	var _init = function(callback){
		
		//获取本页源代码
		_getPageSource(callback);
	};
	
	
	/**
	 * 执行html侦测
	 * @param {Function} callback 侦测完毕后的回调方法，形如：function(data){}
	 * @config {Object} data 就是_summaryInformation
	 */
	var _detect = function (callback){
		//初始化结果集
		_initSummaryInformation();
		//扫描整个页面
	    _scanAllElements();
		//侦测title标签
		_detectTitle();
		//侦测link标签
	    _detectLink();
		//检测页面上的img标签是否src=''
		_detectImgTags();
		//侦测compatmode
	    _detectCompatMode();
		//侦测IE条件注释
	    _detectIECondComm();
		//问题Input，使用了size来确定其尺寸，不合法
		_detectInputBox();
		//检测是否有inline-tag包含了block-tag
		_detectTagIncludeCase();
		//检测未闭合的标签
		_detectTagUnClosed();
		//检测HTML代码是否压缩过
		_detectHtmlMinify();
		
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

