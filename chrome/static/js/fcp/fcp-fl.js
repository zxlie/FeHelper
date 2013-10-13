/**
 * 注册命名空间：baidu.FL
 */
baidu.namespace.register("baidu.FL");


/**
 * FL常量
 * @author lichengyin （FCP：PHP代码）
 * @cover zhaoxianlie （FCPHelper：将PHP代码重写为Javascript代码）
 */
baidu.FL = new (function() {
	this.FL_EOF 						= 1;   //结束
	this.FL_TPL_DELIMITER 				= 2;   //模板语法
	this.FL_NEW_LINE 					= 3;   //new line
	this.FL_NORMAL 						= 4;   //normal,一般很少出现这个
	
	this.HTML_CONTENT 					= 111; //文本
	this.HTML_TAG 						= 112; //一般标签
	this.HTML_JS_START 					= 113; //js start
	this.HTML_JS_CONTENT 				= 114; //js content,要手工调用js analytic
	this.HTML_JS_END 					= 115; //js end
	this.HTML_CSS_START 				= 116; //css start
	this.HTML_CSS_CONTENT 				= 117; //css content,要手工调用css analytic
	this.HTML_CSS_END 					= 118; //css end
	this.HTML_IE_HACK_START 			= 119; //ie hack start
	this.HTML_IE_HACK_EDN 				= 120; //ie hack end
	this.HTML_DOC_TYPE 					= 121; //doc type
	this.HTML_COMMENT 					= 122; //html comment
	this.HTML_STATUS_OK					= 123; //status ok
	this.HTML_TAG_START					= 124; //tag start
	this.HTML_TAG_END					= 125; //tag end
	this.HTML_TPL_ATTR_NAME				= 126; //tpl attributes name
	this.HTML_XML						= 127; //is xml
	this.HTML_TEXTAREA_START			= 128; //textarea tag start
	this.HTML_TEXTAREA_CONTENT			= 129; //textarea tag end
	this.HTML_TEXTAREA_END				= 130; //textarea tag end
	this.HTML_PRE_START					= 131; //pre tag start
	this.HTML_PRE_CONTENT				= 132; //pre tag end
	this.HTML_PRE_END					= 133; //pre tag end
	
	this.JS_START_EXPR 					= 211; //start expression
	this.JS_END_EXPR 					= 212; //end expression
	this.JS_START_BLOCK 				= 213; //start block
	this.JS_END_BLOCK 					= 214; //end block
	this.JS_SEMICOLON 					= 215; //分号
	this.JS_WORD						= 216; //单词
	this.JS_OPERATOR					= 217; //操作符
	this.JS_EQUALS						= 218; //等号
	this.JS_INLINE_COMMENT				= 219; //行内注释
	this.JS_BLOCK_COMMENT				= 220; //跨级注释
	this.JS_COMMENT						= 221; //注释
	this.JS_STRING						= 222; //字符串	
	this.JS_IE_CC						= 223; //条件编译	
	this.JS_REGEXP						= 224; //正则
	
	this.JS_MODE_EXPRESSION				= 250; //
	this.JS_MODE_INDENT_EXPRESSION		= 251; //
	this.JS_MODE_DO_BLOCK				= 252; //
	this.JS_MODE_BLOCK					= 253; //
	this.JS_MODE_ARRAY					= 254;
	

	this.CSS_AT							= 311; //@
	this.CSS_NORMAL						= 312; //
	this.CSS_DEVICE_DESC				= 313; //设备描述内容
	this.CSS_DEVICE_START				= 314; //设备开始符,为{
	this.CSS_DEVICE_END					= 315; //设备结束符，为}
	this.CSS_SELECTOER					= 316; //选择器
	this.CSS_SELECTOER_START			= 317; //选择器开始符，为{
	this.CSS_SELECTOER_END				= 318; //选择器结束符，为}
	this.CSS_COMMENT					= 319; //评论
	this.CSS_PROPERTY					= 320; //属性
	this.CSS_VALUE						= 321; //值
	this.CSS_SEMICOLON 					= 322; //分号
	this.CSS_COLON						= 323; //冒号
})();