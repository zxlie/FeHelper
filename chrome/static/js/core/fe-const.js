
/**
 * 常量定义
 * @author zhaoxianlie 
 */

/**
 * 各个模块进行信息交互时的消息类型
 */
const MSG_TYPE = {
	//browserAction被点击
	BROWSER_CLICKED : "browser-clicked",
	//提取CSS
	GET_CSS : "get-css",
	//提取JS
	GET_JS : "get-js",
	//提取HTML
	GET_HTML : "get-html",
	//cookie
	GET_COOKIE : 'get-cookie',
	//remvoe cookie
	REMOVE_COOKIE : 'remove-cookie',
	//set cookie
	SET_COOKIE : 'set-cookie',
	//get options
	GET_OPTIONS : 'get_options',
	//set options
	SET_OPTIONS : 'set_options',

    FCP_HELPER_INIT:'fcp_helper_init',
	
	//css ready...
	CSS_READY : 'css-ready',
	
	//js ready...
	JS_READY : 'js-ready',
	
	//html ready...
	HTML_READY : 'html-ready',
    //all ready...
    ALL_READY : 'all-ready',
	
	//启动项
	START_OPTION : 'start-option',
	//启动FCPHelper
	OPT_START_FCP : 'opt-item-fcp',
	//启动栅格检测
	OPT_START_GRID : 'opt-item-grid',
	
	//计算网页加载时间
	CALC_PAGE_LOAD_TIME : "calc-page-load-time",
    //页面相关性能数据
    GET_PAGE_WPO_INFO : 'get_page_wpo_info',

	//查看加载时间
	SHOW_PAGE_LOAD_TIME : "show-page-load-time",
	//执行FCP Helper检测
	FCP_HELPER_DETECT : 'fcp-helper-detect',
	//执行栅格检测
	GRID_DETECT : 'grid-detect',
    //执行JS嗅探：Tracker，from 志龙（http://ucren.com)
    JS_TRACKER : 'js_tracker',

    CODE_COMPRESS : 'code_compress',

    FROM_POPUP : 'from_popup_action',

    TAB_CREATED_OR_UPDATED: 'tab_created_or_updated',

    ////////////////////如下是popup中的menu，value和filename相同///////////////////
    REGEXP_TOOL : 'regexp',
    //字符串编解码
    EN_DECODE : 'endecode',
    //json查看器
    JSON_FORMAT : 'jsonformat',
    //QR生成器
    QR_CODE : 'qrcode',
    //代码美化
    CODE_BEAUTIFY : 'codebeautify',
    // 时间转换
    TIME_STAMP : 'timestamp',
    // 图片base64
    IMAGE_BASE64 : 'imagebase64',
    // 二维码解码
    QR_DECODE : 'qr_decode',

    //页面json代码自动格式化
    AUTO_FORMART_PAGE_JSON : "opt_item_autojson",

    //页面取色器
    COLOR_PICKER : "color-picker:newImage",

    // ajax debugger
    AJAX_DEBUGGER : "ajax-debugger",
    AJAX_DEBUGGER_CONSOLE : "ajax-debugger-console",
    AJAX_DEBUGGER_SWITCH : "ajax-debugger-switch"
};

/**
 * 文件类型
 */
const FILE = {
	//css的<style>标签
	STYLE : "style",
	//css的<link>标签
	LINK : "link",
	//js：通过script定义的内联js
	SCRIPT : "script-block"
};

//首先配一个DTD中的白名单
const PUBLIC_ID_WHITE_LIST = {
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
const COMPAT_MODE_DIFF_PUBLIC_ID_MAP = {
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
const HTML_DEPRECATED_TAGS = {
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
const HTML_DEPRECATED_ATTRIBUTES = {
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
const BLOCK_HTML_ELEMENT = [
	'address','blockquote','center','dir',
	'div','dl','fieldset','form','h1','h2',
	'h3','h4','h5','h6','hr','isindex','menu',
	'noframes','noscript','ol','p','pre','table','ul'
];

/**
 * 内联元素
 */
const INLINE_HTML_ELEMENT = [
	'a','acronym','b','bdo','big','br','cite','code',
	'dfn','em','font','i','img','input','kbd','label',
	'q','s','samp','select','small','span','strike','strong',
	'sub','sup','textarea','tt','u','var'
];


/**
 * 可变元素：为根据上下文语境决定该元素为块元素或者内联元素。
 */
const CHANGE_ABLE_HTML_ELEMENT = [
	'applet','button','del','iframe',
	'ins','map','object','script'
];

//关于IE的条件注释，可以参考这里：http://msdn.microsoft.com/en-us/library/ms537512(v=vs.85).aspx

//条件注释的正则匹配规则
const CONDITIONAL_COMMENT_REGEXP = /\[\s*if\s+[^\]][\s\w]*\]/i;

// 非IE条件注释开始：<![if !IE]> or <![if false]>
const NOT_IE_REVEALED_OPENING_CONDITIONAL_COMMENT_REGEXP = /^\[if\s+(!IE|false)\]$/i;

// IE条件注释结束：<![endif]>
const REVEALED_CLOSING_CONDITIONAL_COMMENT_REGEXP = /^\[endif\s*\]$/i;

// 非IE的条件注释整体：  <!--[if !IE]> HTML <![endif]--> or  <!--[if false]> HTML <![endif]-->
const NOT_IE_HIDDEN_CONDITIONAL_COMMENT_REGEXP = /^\[if\s+(!IE|false)\]>.*<!\[endif\]$/i;


/* 正则 */
const REG = {
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
const SELF_CLOSING_TAGS = [
	'meta','link','area','base',
	'col','input','img','br',
	'hr','param','embed'
];