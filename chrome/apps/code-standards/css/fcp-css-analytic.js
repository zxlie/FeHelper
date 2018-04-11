/**
 * 注册命名空间：baidu.cssAnalytic
 */
baidu.namespace.register("baidu.cssAnalytic");

/**
 * 
 * css分析器
 * 支持一下css规则：
 * css规则
 * 	1、@charset "utf-8"; //设置字符集
 * 	2、@import url("a.css"); //import
 * 	3、_property:value //ie6
 * 	4、*property:value //ie6,7
 * 	5、property:value\9; //ie6,7,8,9
 * 	6、property//:value  //非ie6
 * 	7、* html selector{} //各种选择符
 * 	8、@media all and (-webkit-min-device-pixel-ratio:10000),not all and (-webkit-min-device-pixel-ratio:0) { ... } //设备
 * 	9、@-moz-xxx  //firefox
 * 	10、property:value !important; //important
 * 	11、property:expression(onmouseover=function(){})  //expression，值里有可能有 { 和 } 
 * 	12、-webkit-border-radious:value //浏览器私有，减号开头
 * 	13、filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="ds_laby.png", sizingMethod='crop')  //ie下的filter，有（和)
 * 
 * @author lichengyin （FCP：PHP代码）
 * @cover zhaoxianlie （FCPHelper：将PHP代码重写为Javascript代码）
 */
baidu.cssAnalytic = function(){
	/**
	 * 当前解析到的位置
	 * @var int
	 */
	this.parsePos = 0;
	
	this.content = '';
	
	this.contentLength = 0;
	
	this._output = [];
	
	this._pre_type = ''; //上一个特殊类型
	
	this.run = function($content){
		this.content = $content.trim().replace(/\n/g, "\n");
		this.contentLength = this.content.length;
		this.tokenAnalytic();
		return this._output;
	};
	this.tokenAnalytic = function(){
		var $token;
		while (true){
			$token = this.getNextToken();
			if ($token){
				if ($token[1] === baidu.FL.FL_EOF) break;
				this._output.push($token);
				if ($token[1] === baidu.FL.CSS_PROPERTY) {
					this._output.push([':', baidu.FL.CSS_COLON]);
				} else if ($token[1] === baidu.FL.CSS_VALUE) {
					this._output.push([';', baidu.FL.CSS_SEMICOLON]);
				}
			}
		}
	};
	this.getNextToken = function(){
		if (this.parsePos >= this.contentLength){
			return ['', baidu.FL.FL_EOF];
		}
		$char = this.content[this.parsePos];
		this.parsePos++;
		
		if ($char === "\x0d") return ''; //\r
		if ($char === "\x0a") return [$char, baidu.FL.FL_NEW_LINE];
		//避免出现多个空格在一起的情况
		if ($char.trim() === '' || $char === ';') return '';
		
		var $result ;
		
		//处理@开头的；如：@charset "utf-8";@import url("a.css"), @media xxx{}
		if ($char === '@'){
			$result = this._getAtToken($char);
			if ($result) return $result;
		}else if ($char === '{'){
			switch (this._pre_type){
				case baidu.FL.CSS_DEVICE_DESC : 
					this._pre_type = baidu.FL.CSS_DEVICE_START;
					return [$char, baidu.FL.CSS_DEVICE_START];
				default : 
					this._pre_type = baidu.FL.CSS_SELECTOER_START;
					return [$char, baidu.FL.CSS_SELECTOER_START];
			}
		}else if ($char === '}'){
			switch (this._pre_type){
				case baidu.FL.CSS_SELECTOER_END:
					this._pre_type = baidu.FL.CSS_DEVICE_END;
					return [$char, baidu.FL.CSS_DEVICE_END];
				default: 
					for(var $i=this._output.length-1;$i>=0;$i--){
						var $item = this._output[$i];
						if($item[1] === baidu.FL.CSS_SELECTOER_START){
							this._pre_type = baidu.FL.CSS_SELECTOER_END;
							return [$char, baidu.FL.CSS_SELECTOER_END];
						}else if($item[1] === baidu.FL.CSS_DEVICE_START){
							this._pre_type = baidu.FL.CSS_DEVICE_END;
							return [$char, baidu.FL.CSS_DEVICE_END];
						}
					}
					this._pre_type = baidu.FL.CSS_SELECTOER_END;
					return [$char, baidu.FL.CSS_SELECTOER_END];
			}
		}else if (this.content.substr( this.parsePos - 1, 2) === '/*'){
			$result = this._getCommentToken($char);
			if ($result) return $result;
		}else if ($char === "\x0d" || $char === "\x0a"){
			return [$char, baidu.FL.FL_NEW_LINE];
		}

		switch (this._pre_type){
			case baidu.FL.CSS_SELECTOER_START : 
			case baidu.FL.CSS_VALUE : 
				$result = this._getPropertyToken($char);
				this._pre_type = baidu.FL.CSS_PROPERTY;
				return $result;
			case baidu.FL.CSS_PROPERTY : 
				$result = this._getValueToken($char);
				this._pre_type = baidu.FL.CSS_VALUE;
				return $result;
			case baidu.FL.CSS_DEVICE_START:
				var $pos = this.parsePos;
				$result = this._getPropertyToken($char);
				var $str = $result[0];
				if($str.indexOf('{') > -1){
					this.parsePos = $pos;
					$result = this._getSelectorToken($char);
					this._pre_type = baidu.FL.CSS_DEVICE_START;
					if ($result) return $result;
				}else{
					this._pre_type = baidu.FL.CSS_PROPERTY;
					return $result;
				}
			default:
				$result = this._getSelectorToken($char);
				if ($result) return $result;
			
		}
		return [$char, baidu.FL.CSS_NORMAL];
	};
	
	/**
	 * 处理@开头的；如：@charset "utf-8";@import url("a.css"), @media xxx{}
	 * @param {Object} $char
	 */
	this._getAtToken = function($char){
		$resultString = $char;
		while (this.content[this.parsePos] !== ';' 
			&& this.content[this.parsePos] !== '{' 
			&& this.parsePos < this.contentLength){
			
			$resultString += this.content[this.parsePos];
			this.parsePos++;
		}
		if (this.content[this.parsePos] === ';'){
			$resultString += ';';
			this.parsePos++;
			return [$resultString.trim(), baidu.FL.CSS_AT];
		}
		this._pre_type = baidu.FL.CSS_DEVICE_DESC;
		return [$resultString.trim(), baidu.FL.CSS_DEVICE_DESC];
	};

	/**
	 * comment
	 * @param {Object} $char
	 * @param {Object} $fromSelector=false
	 */
	this._getCommentToken = function($char, $fromSelector){
		this.parsePos++;
		$resultString = '';
		while (!(this.content[this.parsePos] === '*' 
			&& this.content[this.parsePos + 1] 
			&& this.content[this.parsePos + 1] === '/') 
			&& this.parsePos < this.contentLength){
			
			$resultString += this.content[this.parsePos];
			this.parsePos++;
		}
		this.parsePos += 2;
		if ($fromSelector){
			return '/*' + $resultString + '*/';
		}
		return ['/*' + $resultString + '*/' , baidu.FL.CSS_COMMENT];
	};
	
	/**
	 * selector content
	 * 选择符里可能还有注释，注释里可能含有{}等字符
	 */
	this._getSelectorToken = function($char){
		var $resultString = $char;
		while (this.content[this.parsePos] !== '{' 
				&& this.content[this.parsePos] !== '}' 
				&& this.parsePos < this.contentLength){
			//如果选择符中含有注释
			if (this.content[this.parsePos] === '/' &&
				this.content[this.parsePos+1] &&
				this.content[this.parsePos+1] === '*'){
				$resultString += this._getCommentToken('/', true);
			}else{
				$resultString += this.content[this.parsePos];
				this.parsePos++;
			}
		}
		return [$resultString.trim(), baidu.FL.CSS_SELECTOER];
	};
	
	/**
	 * css property
	 * @param {Object} $char
	 */
	this._getPropertyToken = function($char){
		$resultString = $char;
		while (this.content[this.parsePos] !== ':' && 
				this.content[this.parsePos] !== ';' && 
				this.content[this.parsePos] !== '}' && 
				this.parsePos < this.contentLength){
			$resultString += this.content[this.parsePos];
			this.parsePos++;
		}
		//增加对div{color}的容错机制
		if (this.content[this.parsePos] !== '}'){
			this.parsePos++;
		}
		return [$resultString.trim().toLowerCase(), baidu.FL.CSS_PROPERTY];
	};
	
	/**
	 * css value
	 * @param {Object} $char
	 */
	this._getValueToken = function($char){
		var $resultString = $char;
		var $isExpression = false;
		while (this.content[this.parsePos] !== ';' 
			&& this.content[this.parsePos] !== '}' 
			&& this.parsePos < this.contentLength){
			
			$char = this.content[this.parsePos];
			this.parsePos++;
			$resultString += $char;
			if (!$isExpression && $resultString.toLowerCase() === 'expression('){
				$isExpression = true;
				$resultString += this._getJSToken();
			}
		}
		if (this.content[this.parsePos] === ';'){
			this.parsePos++;
		}
		//将多个空格变成一个空格
		$resultString = $resultString.trim().replace(/\s+/ig, " ");
		return [$resultString, baidu.FL.CSS_VALUE];
	};
	
	/**
	 * 处理expression里的javascript
	 */
	this._getJSToken = function(){
		var $string = '',$char;
		while (this.parsePos < this.contentLength){
			$char = this.content[this.parsePos];
			this.parsePos++;
			$string += $char;
			//这里使用js分析器，然后判断（和） 个数是否相等
			if ($char === ')' && this._checkJSToken('(' + $string)){
				break;
			}
		}
		return $string;
	};
	
	/**
	 * check js for expression
	 * @param array $output
	 */
	this._checkJSToken = function($output){
		var $expr_start = 0;
		var $expr_end = 0;
		for (var $i=0,$count=$output.length;$i<$count;$i++){
			var $item = $output[$i];
			if ($item[0] === '(') $expr_start++;
			else if ($item[0] === ')') $expr_end++;
		}
		return $expr_start === $expr_end;
	};
};