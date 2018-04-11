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

// FL常量
baidu.FlConst = {};
//首先配一个DTD中的白名单
baidu.FlConst.PUBLIC_ID_WHITE_LIST = {
    '': {
        systemIds: {
            '': true
        }
    },
    '-//W3C//DTD HTML 3.2 Final//EN': {
        systemIds: {
            '': true
        }
    },
    '-//W3C//DTD HTML 4.0//EN': {
        systemIds: {
            '': true,
            'http://www.w3.org/TR/html4/strict.dtd': true
        }
    },
    '-//W3C//DTD HTML 4.01//EN': {
        systemIds: {
            '': true,
            'http://www.w3.org/TR/html4/strict.dtd': true
        }
    },
    '-//W3C//DTD HTML 4.0 Transitional//EN': {
        systemIds: {
            '': true,
            'http://www.w3.org/TR/html4/loose.dtd': true
        }
    },
    '-//W3C//DTD HTML 4.01 Transitional//EN': {
        systemIds: {
            '': true,
            'http://www.w3.org/TR/html4/loose.dtd': true,
            'http://www.w3.org/TR/1999/REC-html401-19991224/loose.dtd': true
        }
    },
    '-//W3C//DTD XHTML 1.1//EN': {
        systemIds: {
            'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd': true
        }
    },
    '-//W3C//DTD XHTML Basic 1.0//EN': {
        systemIds: {
            'http://www.w3.org/TR/xhtml-basic/xhtml-basic10.dtd': true
        }
    },
    '-//W3C//DTD XHTML 1.0 Strict//EN': {
        systemIds: {
            'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd': true
        }
    },
    '-//W3C//DTD XHTML 1.0 Transitional//EN': {
        systemIds: {
            'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd': true
        }
    },
    'ISO/IEC 15445:1999//DTD HyperText Markup Language//EN': {
        systemIds: {
            '': true
        }
    },
    'ISO/IEC 15445:2000//DTD HTML//EN': {
        systemIds: {
            '': true
        }
    },
    'ISO/IEC 15445:1999//DTD HTML//EN': {
        systemIds: {
            '': true
        }
    }
};

/**
 * IE和Webkit对Doctype的解析差异
 */
baidu.FlConst.COMPAT_MODE_DIFF_PUBLIC_ID_MAP = {
    '-//W3C//DTD HTML 4.0 Transitional//EN': {
        systemIds: {
            'http://www.w3.org/TR/html4/loose.dtd': {
                IE: 'S',
                WebKit: 'Q'
            }
        }
    },
    'ISO/IEC 15445:2000//DTD HTML//EN': {
        systemIds: {
            '': {
                IE: 'Q',
                WebKit: 'S'
            }
        }
    },
    'ISO/IEC 15445:1999//DTD HTML//EN': {
        systemIds: {
            '': {
                IE: 'Q',
                WebKit: 'S'
            }
        }
    }
};


/**
 * 过时的HTML标签，HTML5已经不再支持
 */
baidu.FlConst.HTML_DEPRECATED_TAGS = {
    acronym: "定义首字母缩写",
    applet: "定义Java Applet",
    basefont: "定义Font定义",
    big: "定义大号文本",
    center: "定义居中的文本",
    dir: "定义目录列表",
    font: "定义文字相关",
    frame: "定义框架",
    frameset: "定义框架集",
    isindex: "定义单行的输入域",
    noframes: "定义noframe 部分",
    s: "定义加删除线的文本",
    strike: "定义加删除线的文本",
    tt: "定义打字机文本",
    u: "定义下划线文本",
    xmp: "定义预格式文本",
    layer: "定义层"
};

/**
 * 过时的HTML属性，HTML5已经不再支持
 */
baidu.FlConst.HTML_DEPRECATED_ATTRIBUTES = {
    align: {
        iframe: true,
        img: true,
        object: true,
        table: true
    },
    color: {
        font: true
    },
    height: {
        td: true,
        th: true
    },
    language: {
        script: true
    },
    noshade: {
        hr: true
    },
    nowrap: {
        td: true,
        th: true
    },
    size: {
        hr: true,
        font: true,
        basefont: true
    }
};

/**
 * 块级元素
 */
baidu.FlConst.BLOCK_HTML_ELEMENT = [
    'address','blockquote','center','dir',
    'div','dl','fieldset','form','h1','h2',
    'h3','h4','h5','h6','hr','isindex','menu',
    'noframes','noscript','ol','p','pre','table','ul'
];

/**
 * 内联元素
 */
baidu.FlConst.INLINE_HTML_ELEMENT = [
    'a','acronym','b','bdo','big','br','cite','code',
    'dfn','em','font','i','img','input','kbd','label',
    'q','s','samp','select','small','span','strike','strong',
    'sub','sup','textarea','tt','u','var'
];


/**
 * 可变元素：为根据上下文语境决定该元素为块元素或者内联元素。
 */
baidu.FlConst.CHANGE_ABLE_HTML_ELEMENT = [
    'applet','button','del','iframe',
    'ins','map','object','script'
];

//关于IE的条件注释，可以参考这里：http://msdn.microsoft.com/en-us/library/ms537512(v=vs.85).aspx

//条件注释的正则匹配规则
baidu.FlConst.CONDITIONAL_COMMENT_REGEXP = /\[\s*if\s+[^\]][\s\w]*\]/i;

// 非IE条件注释开始：<![if !IE]> or <![if false]>
baidu.FlConst.NOT_IE_REVEALED_OPENING_CONDITIONAL_COMMENT_REGEXP = /^\[if\s+(!IE|false)\]$/i;

// IE条件注释结束：<![endif]>
baidu.FlConst.REVEALED_CLOSING_CONDITIONAL_COMMENT_REGEXP = /^\[endif\s*\]$/i;

// 非IE的条件注释整体：  <!--[if !IE]> HTML <![endif]--> or  <!--[if false]> HTML <![endif]-->
baidu.FlConst.NOT_IE_HIDDEN_CONDITIONAL_COMMENT_REGEXP = /^\[if\s+(!IE|false)\]>.*<!\[endif\]$/i;


/* 正则 */
baidu.FlConst.REG = {
    //script标签
    SCRIPT: /<script[^>]*>[\s\S]*?<\/[^>]*script>/gi,
    //注释
    COMMENT: /<!--[\s\S]*?--\>/g,
    //cssExpression
    CSS_EXPRESSION: /expression[\s\r\n ]?\(/gi,
    //textarea
    TEXTAREA:/<textarea[^>]*>[\s\S]*?<\/[^>]*textarea>/gi,
    //不合法的标签
    INVALID_TAG:/<\W+>/gi
};

/**
 * 能够自动闭合的标签，就算不闭合也不影响兄弟节点的布局
 */
baidu.FlConst.SELF_CLOSING_TAGS = [
    'meta','link','area','base',
    'col','input','img','br',
    'hr','param','embed'
];