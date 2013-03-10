/**
 * 注册命名空间：baidu.jsAnalytic
 */
baidu.namespace.register("baidu.jsAnalytic");

/**
 * Javascript代码词法分析
 * @author lichengyin （FCP：PHP代码）
 * @cover zhaoxianlie （FCPHelper：将PHP代码重写为Javascript代码）
 */
baidu.jsAnalytic = function(){
	
	this.parsePos = 0;
	
	this.content = '';
	
	this.contentLength = 0;
	
	this._output = [];
	
	this._whitespace = /[\n\r\t\s]/g;
	
	this._wordchar = /[a-zA-Z0-9_\$]/g;
	
	this._digits = /[0-9]/g;
	
	this._punct = /\+|-|\*|\/|%|&|\+\+|\-\-|=|\+=|\-=|\*=|\/=|%=|==|===|!=|!==|>|<|>=|<=|>>|<<|>>>|>>>=|>>=|<<=|&&|&=|\||\|\||!|!!|,|:|\?|\^|\^=|_|\|=|::/g;
	
	/**
	 * 主方法
	 * @param {Object} $content
	 */
	this.run = function($content){
		
		this.content = $content.trim().replace(/\r\n/g, "\n");
		this.contentLength = this.content.length;
		this.tokenAnalytic();
		return this._output;
	};
	
	/**
	 * 此法分析器
	 */
	this.tokenAnalytic = function(){
		while (true){
			$token = this.getNextToken();
			if ($token){
				if ($token[1] === baidu.FL.FL_EOF) break;
				this._output.push($token);
			}
		}
	};
	
	/**
	 * 检测$char是否在$array中
	 * @param {Object} $char
	 * @param {Object} $array
	 */
	this._is_match = function($char,$reg){
		return $reg.test($char);
	};
	
	/**
	 * 单个此法分析
	 */
	this.getNextToken = function(){
		if (this.parsePos >= this.contentLength){
			return ['', baidu.FL.FL_EOF];
		}
		var $char = this.content[this.parsePos];
		var $result,$tokenCount,$lastText,$lastType;
		this.parsePos++;
		
		while (this._is_match($char, this._whitespace)){
			if (this.parsePos >= this.contentLength){
				return ['', baidu.FL.FL_EOF];
			}
			if ($char === "\x0d") return '';
			if ($char === "\x0a"){
				return [$char, baidu.FL.FL_NEW_LINE];
			}
			$char = this.content[this.parsePos];
			this.parsePos++;
		}
		
		//处理正常的字符
		if (this._is_match($char, this._wordchar)){
			$result = this._getWordToken($char);
			if ($result) return $result;
		}
		switch (true){
			case $char === '(' || $char === '[' : return [$char, baidu.FL.JS_START_EXPR];
			case $char === ')' || $char === ']' : return [$char, baidu.FL.JS_END_EXPR];
			case $char === '{' : return [$char, baidu.FL.JS_START_BLOCK];
			case $char === '}' : return [$char, baidu.FL.JS_END_BLOCK];
			case $char === ';' : return [$char, baidu.FL.JS_SEMICOLON];
		}
		//注释或者正则
		if ($char === '/'){
			//注释
			$result = this._getCommentToken($char);
			if ($result) return $result;
			
			//正则
			$tokenCount = this._output.length;
			if ($tokenCount){
				var _tem = this._output[$tokenCount - 1];
				$lastText = _tem[0];
				$lastType = _tem[1];
			}else {
				$lastType = baidu.FL.JS_START_EXPR;
			}
			if (($lastType === baidu.FL.JS_WORD && ($lastText === 'return' || $lastText === 'to'))
				|| ($lastType === baidu.FL.JS_START_EXPR
					|| $lastType === baidu.FL.JS_START_BLOCK
					|| $lastType === baidu.FL.JS_END_BLOCK
					|| $lastType === baidu.FL.JS_OPERATOR
					|| $lastType === baidu.FL.JS_EQUALS 
					|| $lastType === baidu.FL.JS_SEMICOLON
					|| $lastType === baidu.FL.FL_EOF
					)){
						
				$result = this._getRegexpToken($char);
				if ($result) return $result;
			}
		}
		//引号
		if ($char === '"' || $char === "'"){
			$result = this._getQuoteToken($char);
			if ($result) return $result;	
		}
		//sharp variables
		if ($char === '#'){
			$result = this._getSharpVariblesToken($char);
			if ($result) return $result;
		}
		//操作符
		if (this._is_match($char, this._punct)){
			$result = this._getPunctToken($char);
			if ($result) return $result;
		}
		
		return [$char, baidu.FL.FL_NORMAL];
	};
	
	/**
	 * 正常的字符
	 * @param {Object} $char
	 */
	this._getWordToken = function($char){
		var $sign,$t;
		
		while (this._is_match(this.content[this.parsePos], this._wordchar) 
			&& this.parsePos < this.contentLength){

			$char += this.content[this.parsePos];
			this.parsePos++;
		}
		//处理带E的数字，如：20010E+10,0.10E-10
		if ((this.content[this.parsePos] === '+' || this.content[this.parsePos] === '-')
			&& /^[0-9]+[Ee]$/.test()
			&& this.parsePos < this.contentLength){
				
			$sign = this.content[this.parsePos];
			this.parsePos++;
			$t = this.getNextToken();
			$char += $sign . $t[0];
			return [$char, baidu.FL.JS_WORD];
		}
		//for in operator
		if ($char === 'in'){
			return [$char , baidu.FL.JS_OPERATOR];
		}
		return [$char, baidu.FL.JS_WORD];
	};
	
	/**
	 * 注释
	 * @param {Object} $char
	 */
	this._getCommentToken = function($char){
		var $comment = '';
		var $lineComment = true;
		var $c = this.content[this.parsePos];
		var $cc,$lineComment;
		//单行或者多行注释
		if($c === '*'){
			this.parsePos++;
			while (!(this.content[this.parsePos] === '*' 
					&& this.content[this.parsePos + 1] 
					&& this.content[this.parsePos + 1] === '/') 
					&& this.parsePos < this.contentLength){
						
				$cc = this.content[this.parsePos];
				$comment += $cc;
				//\x0d为\r, \x0a为\n
				if ($cc === "\x0d" || $cc === "\x0a"){
					$lineComment = false;
				}
				this.parsePos++;
			}
			
			this.parsePos += 2;
			//ie下的条件编译
			if ($comment.indexOf('@cc_on') === 0){
				return ['/*' + $comment + '*/', baidu.FL.JS_IE_CC];
			}
			if ($lineComment){
				return ['/*' + $comment + '*/', baidu.FL.JS_INLINE_COMMENT];
			}else{
				return ['/*' + $comment + '*/', baidu.FL.JS_BLOCK_COMMENT];
			}
		}
		//单行注释
		if ($c === '/'){
			$comment = $char;
			//\x0d为\r, \x0a为\n
			while (this.content[this.parsePos] !== "\x0d" 
					&& this.content[this.parsePos] !== "\x0a"
					&& this.parsePos < this.contentLength){
				
				$comment += this.content[this.parsePos];
				this.parsePos++;
			}
			this.parsePos++;
			return [$comment, baidu.FL.JS_COMMENT];
		}
	};
	
	/**
	 * 引号
	 * @param {Object} $char
	 */
	this._getQuoteToken = function($char){
		var $sep = $char;
		var $escape = false;
		var $resultString = $char;
		while (this.content[this.parsePos] !== $sep || $escape){
			$resultString += this.content[this.parsePos];
			$escape = !$escape ? (this.content[this.parsePos] === "\\") : false;
			this.parsePos++;
			if (this.parsePos >= this.contentLength){
				return [$resultString, baidu.FL.JS_STRING];
			}
		}
		this.parsePos++;
		$resultString += $sep;
		return [$resultString, baidu.FL.JS_STRING];
	};
	
	/**
	 * 正则
	 * @param {Object} $char
	 */
	this._getRegexpToken = function($char){
		var $sep = $char;
		var $escape = false;
		var $resultString = $char;
		var $inCharClass = false;
		while ($escape || $inCharClass || this.content[this.parsePos] !== $sep){
			$resultString += this.content[this.parsePos];
			if (!$escape){
				$escape = (this.content[this.parsePos] === "\\");
				if (this.content[this.parsePos] === '['){
					$inCharClass = true;
				}else if(this.content[this.parsePos] === ']'){
					$inCharClass = false;
				}
			}else {
				$escape = false;
			}
			this.parsePos++;
			if (this.parsePos >= this.contentLength){
				return [$resultString, baidu.FL.JS_REGEXP];
			}
		}
		this.parsePos++;
		$resultString += $sep;
		while (this._is_match(this.content[this.parsePos], this._wordchar) 
			&& this.parsePos < this.contentLength ) {
				
			$resultString += this.content[this.parsePos];
			this.parsePos++;
		}
		return [$resultString, baidu.FL.JS_REGEXP];
	};
	
	/**
	 * sharp varibles
	 * @param {Object} $char
	 */
	this._getSharpVariblesToken = function($char){
		var $sharp = $char;
		var $c,$next;
		if (this._is_match(this.content[this.parsePos], this._digits)){
			do{
				$c = this.content[this.parsePos];
				$sharp += $c;
				this.parsePos++;
			}while ($c !== '#' && $c !== '=' && this.parsePos < this.contentLength);
			$next = this.content.substr( this.parsePos, 2);
			if ($next === '[]' || $next === '{}'){
				$sharp += $next;
				this.parsePos += 2;
			}
			return [$sharp, baidu.FL.JS_WORD];
		}
	};
	
	/**
	 * 操作符
	 * @param {Object} $char
	 */
	this._getPunctToken = function($char){
		while (this._is_match($char + this.content[this.parsePos], this._punct) 
			&& this.parsePos < this.contentLength){
				
			$char += this.content[this.parsePos];
			this.parsePos++;
		}
		return [$char, $char === '=' ? baidu.FL.JS_EQUALS : baidu.FL.JS_OPERATOR];
	};
	
}
