/**
 * 注册命名空间：baidu.htmlAnalytic
 */
baidu.namespace.register("baidu.htmlAnalytic");

/**
 * 
 * html词法分析类
 * 
 * @author lichengyin （FCP：PHP代码）
 * @cover zhaoxianlie （FCPHelper：将PHP代码重写为Javascript代码）
 */
baidu.htmlAnalytic = function(){
	
	/**
	 * 
	 * 当前解析到的位置
	 * @var int
	 */
	this.parsePos = 0;
	
	/**
	 * 
	 * 要解析的内容
	 * @var string
	 */
	this.content = '';
	/**
	 * 
	 * 要解析的内容长度
	 * @var int
	 */
	this.contentLength = 0;
	
	/**
	 * 
	 * 单个标签
	 * @var array
	 */
	this.singleTag = [
		"br", "input", "link", "meta", "!doctype", "basefont", "base", "col",
		"area", "hr", "wbr", "param", "img", "isindex", "?xml", "embed"
	];
	
	/**
	 * 闭合标签检测时候的白名单
	 */
	this.closeTagWhiteList = [
		'html','body','li','tr','td'
	];
	
	/**
	 * 
	 * 解析后的token存放处
	 * @var array
	 */
	this._output = [];
	
	this.__construct = function(){
		
	};
	
	/**
	 * 
	 * 默认是进行html分析
	 * type不为1的时候进行tag属性分析
	 * @param string $content
	 * @param int $type
	 */
	this.run = function($content, $type){
		if($type == undefined) $type = 1;
		this.content = $content.trim().replace(/\r\n/g, "\n");
		if (this.content.indexOf('<?xml') > -1){
			return [[$content, baidu.FL.HTML_XML]];
		}
		this.contentLength = this.content.length;
		if ($type === 1){
			this.tokenAnalytic();
			return this._output;
		}
		return this.getTagAttributes($content);
	};
	
	/**
	 * 
	 * 使用特征值进行分析
	 */
	this.tokenAnalytic = function(){
		var $token;
		while (true){
			$token = this.getNextToken();
			if ($token){
				if ($token[1] === baidu.FL.FL_EOF) break;
				this._output.push($token);
			}
		}
	};
	
	/**
	 * 
	 * 解析下一个特征值
	 */
	this.getNextToken = function(){
		if (this.parsePos >= this.contentLength){
			return ['', baidu.FL.FL_EOF];
		}
		
		var $char = this.content[this.parsePos];
		this.parsePos++;
		var $outputCount = this._output.length;
		var $result;
		if ($outputCount){
			var $tokenType = this._output[$outputCount - 1][1];
			if ( $tokenType === baidu.FL.HTML_JS_START){
				//js标签里任何内容都直接通过，不做任何处理
				$result = this._getScriptOrStyleContent($char, 1);
				if ($result) return $result;
			}else if ($tokenType === baidu.FL.HTML_CSS_START){
				//style标签里任何内容都直接通过，不做任何处理
				$result = this._getScriptOrStyleContent($char, 2);
				if ($result) return $result;
			}else if($tokenType === baidu.FL.HTML_TEXTAREA_START){
				//textarea标签里任何内容都直接通过，不做任何处理
				$result = this._getTextareaOrPreContent($char, 1);
				if ($result) return $result;
			}else if($tokenType === baidu.FL.HTML_PRE_START){
				//pre标签里任何内容都直接通过，不做任何处理
				$result = this._getTextareaOrPreContent($char, 2);
				if ($result) return $result;
			}
		}
		if ($char === "\x0d") return ''; // \r
		if ($char === "\x0a"){
			return [$char, baidu.FL.FL_NEW_LINE];
		}
		
		//处理一般性的标签,当前字符为<并且下一个字符不为<
		if ($char === '<' && this.content[this.parsePos] !== '<'){
			$result = this._getTagToken($char);
			if ($result) return $result;
		}
		$result = this._getContentToken($char);
		if ($result) return $result;
		return [$char, baidu.FL.FL_NORMAL];
	};
	
	/**
	 * 标签
	 * @param {Object} $char
	 */
	this._getTagToken = function($char){
		var $resultString = $char;
		do {
			if (this.parsePos >= this.contentLength){
				break;
			}
			$char = this.content[this.parsePos];
			this.parsePos++;
			
			if ($char === '"' || $char === "'"){
				if ($resultString[1] !== '!'){
					$resultString += $char;
					$resultString += this._getUnformated($char);
				}
			}else {
				$resultString += $char;
			}
		}while ($char !== '>');
		//注释或者ie hack
		if ($resultString[1] === '!'){
			if ($resultString.indexOf('[if') > -1){
				if ($resultString.indexOf('!IE') > -1){
					$resultString += this._getUnformated('-->', $resultString);
				}
				return [$resultString, baidu.FL.HTML_IE_HACK_START];
			}else if ($resultString.indexOf('[[endif') > -1){
				return [$resultString, baidu.FL.HTML_IE_HACK_EDN];
			}else if (this._checkEqual($resultString, 2, 7, 'doctype')){
				return [$resultString, baidu.FL.HTML_DOC_TYPE];
			}else if(this._checkEqual($resultString, 4, 6, 'status')){
				$resultString += this._getUnformated('-->', $resultString);
				return [$resultString, baidu.FL.HTML_STATUS_OK];
			}else {
				$resultString += this._getUnformated('-->', $resultString);
				return [$resultString, baidu.FL.HTML_COMMENT];
			}
		}
		if (this._checkEqual($resultString, 0, 7, '<script')){
			return [$resultString, baidu.FL.HTML_JS_START];
		}else if (this._checkEqual($resultString, 0, 9, '</script>')){
			return [$resultString, baidu.FL.HTML_JS_END];
		}else if (this._checkEqual($resultString, 0, 6, '<style')){
			return [$resultString, baidu.FL.HTML_CSS_START];
		}else if (this._checkEqual($resultString, 0, 8, '</style>')){
			return [$resultString, baidu.FL.HTML_CSS_END];
		}else if (this._checkEqual($resultString, 0, 9, '<textarea')){
			return [$resultString, baidu.FL.HTML_TEXTAREA_START];
		}else if (this._checkEqual($resultString, 0, 11, '</textarea>')){
			return [$resultString, baidu.FL.HTML_TEXTAREA_END];
		}else if (this._checkEqual($resultString, 0, 4, '<pre')){
			return [$resultString, baidu.FL.HTML_PRE_START];
		}else if (this._checkEqual($resultString, 0, 6, '</pre>')){
			return [$resultString, baidu.FL.HTML_PRE_END];
		}
		if (this._checkEqual($resultString, 0, 2, '</')){
			return [$resultString, baidu.FL.HTML_TAG_END];
		}
		return [$resultString, baidu.FL.HTML_TAG_START];
	};
	
	/**
	 * 
	 * 检测一个字符串的截取部分是否等于一个特定的字符串
	 * @param string $str
	 * @param int $start
	 * @param int $len
	 * @param string $result
	 */
	this._checkEqual = function($str, $start, $len, $result){
		return $str.substr($start, $len).toLowerCase() === $result.toLowerCase();
	};
	
	/**
	 * 
	 * 解析文本节点
	 * @param string $char
	 */
	this._getContentToken = function($char){
		var $resultString = $char;
		while (true){
			if (this.parsePos >= this.contentLength){
				break;
			}
			//增加对<a href=""><<<</a>的兼容，此时内容为<<<
			if (this.content[this.parsePos] === '<' 
				&& this.content[this.parsePos+1] 
				&& this.content[this.parsePos+1] !== '<' && this.content[this.parsePos+1] !== '>'){
				break;
			}
			$resultString += this.content[this.parsePos];
			this.parsePos++;
		}
		return [$resultString, baidu.FL.HTML_CONTENT];
	};
	
	/**
	 * 获取需要的字符
	 * @param {Object} $char
	 * @param {Object} $orign
	 */
	this._getUnformated = function($char, $orign){
		if($orign == undefined) $orign = '';
		if ($orign.indexOf($char) > -1) return '';
		var $resultString = '';
		do {
			if (this.parsePos >= this.contentLength){
				break;
			}
			$c = this.content[this.parsePos];
			$resultString += $c;
			this.parsePos++;
		}while ($resultString.indexOf($char) == -1);
		//增加一个字符的容错机制,如：value="""，这里一不小心多写了个引号
		if ($char.length === 1){
			while ($char === this.content[this.parsePos]){
				$resultString += this.content[this.parsePos];
				this.parsePos++;
			}
		}
		return $resultString;
	};
	
	/**
	 * 获取script或者style里的内容
	 * @param {String} $char
	 * @param {Integer} $type 0:script，1：style
	 */
	this._getScriptOrStyleContent = function($char, $type){
		var $tokenText = $type == 1 ? '</script>' : '</style>';
		var $tokenLength = $tokenText.length;
		if (this.content.substr( this.parsePos - 1, $tokenLength).toLowerCase() === $tokenText){
			return '';
		}
		var $resultString = $char;
		while (this.parsePos < this.contentLength){
			if (this.content.substr( this.parsePos, $tokenLength).toLowerCase() === $tokenText){
				break;
			}else {
				$resultString += this.content[this.parsePos];
				this.parsePos++;
			}
		}
		$resultString = $resultString.trim();
		var $startEscape = ['<!--', '/*<![CDATA[*/', '//<![CDATA['];
		var $endEscape = ['//-->', '/*]]>*/', '//]]>'];
		for (var $escape in $startEscape){
			if ($resultString.indexOf($escape) === 0){
				$resultString = $resultString.substr($escape.length);
				break;
			}
		}
		for (var $escape in $endEscape ){
			if ($resultString.indexOf($escape) === ($resultString.length - $escape.length)){
				$resultString = $resultString.substr(0, $resultString.length - $escape.length);
				break;
			}
		}
		return [$resultString.trim(), $type === 1 ? baidu.FL.HTML_JS_CONTENT : baidu.FL.HTML_CSS_CONTENT];
	};
	
	/**
	 * 获取Textarea或者pre标签的内容
	 * @param {String} $char
	 * @param {Integer} $type 0:textarea，1：pre
	 */
	this._getTextareaOrPreContent = function($char, $type){
		var $tokenText = $type == 1 ? '</textarea>' : '</pre>';
		var $tokenLength = $tokenText.length;
		if (this.content.substr( this.parsePos - 1, $tokenLength).toLowerCase() === $tokenText){
			return '';
		}
		var $resultString = $char;
		while (this.parsePos < this.contentLength){
			if (this.content.substr( this.parsePos, $tokenLength).toLowerCase() === $tokenText){
				break;
			}else {
				$resultString += this.content[this.parsePos];
				this.parsePos++;
			}
		}
		
		return [$resultString.trim(), $type === 1 ? baidu.FL.HTML_TEXTAREA_CONTENT : baidu.FL.HTML_PRE_CONTENT];
	};
	
	/**
	 * 
	 * 分析tag标签的属性名和属性值
	 * @param string $tagContent
	 */
	this.getTagAttributes = function($tagContent){
		//tag end
		var $tagContent = $tagContent.trim();
		if ($tagContent.substr( 0, 2) === '</') {
			return [
				baidu.FL.HTML_TAG_END, 
				$tagContent.substr(2, $tagContent.length - 3).trim()
			];
		}
		//tag start
		var $result = [baidu.FL.HTML_TAG_START, '', []];

		this.parsePos = 1;
		this.contentLength = $tagContent.replace(/^>\/|>\/$/g,'').length;
		var $tagName = '';
		while (true){
			if (this.parsePos >= this.contentLength){
				break;
			}
			$char = this.content[this.parsePos];
			this.parsePos++;
			if (!/^[a-z0-9]{1}$/g.test($char)){
				this.parsePos--;
				break;
			}else{
				$tagName += $char;
			}
		}
		//get tag name
		$result[1] = $tagName;
		var $attr = $name = '';
		while (true){
			if (this.parsePos >= this.contentLength){
				break;
			}
			$char = this.content[this.parsePos];
			this.parsePos++;
			var $re;
			if ($char === '"' || $char === "'"){
				$re = $char + this._getUnformated($char);
				$result[2].push([$name, $re]);
			}else if ($char === '='){
				$name = $attr;
				$attr = '';
			}else if ($char === ' '){
				if ($attr){
					if ($name){
						$result[2].push([$name, $attr]);
					}else{
						$result[2].push([$attr, '']);
					}
				}
				$name = $attr = '';
			}else{
				if ($char !== ' ' && $char != "\n" && $char != "\r" && $char != "\t") $attr += $char;
			}
		}
		if ($attr){
			if ($name){
				$result[2].push([$name, $attr]);
			}else{
				$result[2].push([$attr, '']);
			}
		}
		return $result;
	};
	
	/**
	 * 模拟PHP中的in_array
	 * @param {Object} $tag
	 */
	this._in_array = function($array,$tag){
		for(var i = 0,len = $array.length;i < len;i++){
			if($tag.trim() == $array[i]) return true;
		}
		return false;
	};
	
	/**
	 * 从给定的html代码中提取tagName
	 * @param {Object} $tagOuterHtml
	 * @param {Object} $type 0:开始标签，1：结束标签
	 */
	this._getTagName = function($tagOuterHtml,$type){
		var reg_start = /^<([^\s\/>]+)\s*\/?/g;
		var reg_end = /^<\/([^\s]+)>/g;
		var tagAttrs = ($type == 0 ? reg_start : reg_end).exec($tagOuterHtml);
		return tagAttrs ? tagAttrs[1] : '';
	};
	
	/**
	 * 获取某段html中未闭合的标签
	 * @param {Object} str 待检测的html片段
	 */
	this.getUnclosedTags = function(str){
		
		//给Array增加remove方法
	    Array.prototype.remove = function(str){
	        for (var index = this.length - 1; index >= 0; index--) {
	            if (str == this[index].tagName) {
	                this.splice(index,1);
	                return true;
	            }
	        }
	        return false;
	    };
	    
	    //HTML词法分析
	    var analyticRst = this.run(str);
	    var rawHtml = [];
	    for(var i = 0,len = analyticRst.length;i < len;i++){
	    	if(analyticRst[i][1] === baidu.FL.HTML_PRE_START ||
	    		analyticRst[i][1] === baidu.FL.HTML_PRE_END ||
	    		analyticRst[i][1] === baidu.FL.HTML_TEXTAREA_START ||
	    		analyticRst[i][1] === baidu.FL.HTML_TEXTAREA_END ||
	    		analyticRst[i][1] === baidu.FL.HTML_TAG_START ||
	    		analyticRst[i][1] === baidu.FL.HTML_TAG_END ||
	    		analyticRst[i][1] === baidu.FL.HTML_XML) {
	    			rawHtml.push(analyticRst[i]);
	    		}
	    }
	    
	    var tag = ''; // 标签
	    var startUncloseTags = []; // "开始标签栈"，前不闭合，如有</div>而前面没有<div>
	    var endUncloseTags = []; // "结束标签栈"，后不闭合，如有<div>而后面没有</div>
	    
	    //开始分析
	    for(var i = 0,len = rawHtml.length;i < len;i++) {
	    	//开始标签
	    	if(rawHtml[i][1] !== baidu.FL.HTML_PRE_END && 
	    			rawHtml[i][1] !== baidu.FL.HTML_TEXTAREA_END && 
	    			rawHtml[i][1] !== baidu.FL.HTML_TAG_END) {
		    	tag = this._getTagName(rawHtml[i][0],0);
	    		endUncloseTags.push({
					tagName : tag,
					outerHTML : rawHtml[i][0],
					type : 1			//1表示标签后不闭合
				});
	    	} 
	    	//结束标签
	    	else {
		    	tag = this._getTagName(rawHtml[i][0],1);
	    		// 从"结束标签栈"移除一个闭合的标签
                if (!endUncloseTags.remove(tag)) { // 若移除失败，说明前面没有需要闭合的标签
                    startUncloseTags.push({ 	// 此标签需要前闭合
						tagName : tag,
						outerHTML : rawHtml[i][0],
						type : 0			//0表示标签前不闭合
					});
                }
	    	}
	    }
	    
		//结果	    
		var rst = [],temp = endUncloseTags.concat(startUncloseTags);
		//后不闭合\前不闭合，此处过滤自动闭合的标签
		for(var i = 0,len = temp.length;i < len;i++) {
			if((!this._in_array(this.singleTag ,temp[i].tagName.toLowerCase()) || temp[i].type == 0)
				&& !this._in_array(this.closeTagWhiteList ,temp[i].tagName.toLowerCase())) {
				rst.push(temp[i]);
			}
		}
		
	    return rst;
	};
	
};
