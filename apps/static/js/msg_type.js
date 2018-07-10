/**
 * FeHelper MSG_TYPE
 */
const MSG_TYPE = {

    // 编码规范检测
    CODE_STANDARDS: "code_standards",
    FCP_HELPER_INIT: "fcp_helper_init",
    FCP_HELPER_DETECT: "fcp_helper_detect",
    //提取CSS
    GET_CSS: "get-css",
    //提取JS
    GET_JS: "get-js",
    //提取HTML
    GET_HTML: "get-html",
    //cookie
    GET_COOKIE: 'get-cookie',
    //remvoe cookie
    REMOVE_COOKIE: 'remove-cookie',
    //set cookie
    SET_COOKIE: 'set-cookie',

    //css ready...
    CSS_READY: 'css-ready',

    //js ready...
    JS_READY: 'js-ready',

    //html ready...
    HTML_READY: 'html-ready',
    //all ready...
    ALL_READY: 'all-ready',

    //get options
    GET_OPTIONS: 'get_options',
    //set options
    SET_OPTIONS: 'set_options',

    //启动项
    START_OPTION: 'start-option',
    //启动FCPHelper
    OPT_START_FCP: 'opt-item-fcp',

    //计算网页加载时间
    CALC_PAGE_LOAD_TIME: "calc-page-load-time",
    //页面相关性能数据
    GET_PAGE_WPO_INFO: 'get_page_wpo_info',

    //查看加载时间
    SHOW_PAGE_LOAD_TIME: "show-page-load-time",

    TAB_CREATED_OR_UPDATED: 'tab_created_or_updated',

    ////////////////////如下是popup中的menu，value和filename相同///////////////////
    REGEXP_TOOL: 'regexp',
    //字符串编解码
    EN_DECODE: 'en-decode',
    //json查看器
    JSON_FORMAT: 'json-format',
    //QR生成器
    QR_CODE: 'qr-code',
    //代码美化
    CODE_BEAUTIFY: 'code-beautify',
    JS_CSS_PAGE_BEAUTIFY:'JS_CSS_PAGE_BEAUTIFY',
    JS_CSS_PAGE_BEAUTIFY_REQUEST:'JS_CSS_PAGE_BEAUTIFY_REQUEST',
    //代码压缩
    CODE_COMPRESS: 'code-compress',
    // 时间转换
    TIME_STAMP: 'timestamp',
    // 图片base64
    IMAGE_BASE64: 'image-base64',
    // 随机密码生成
    RANDOM_PASSWORD:'password',
    // 二维码解码
    QR_DECODE: 'qr-decode',

    // JSON比对
    JSON_COMPARE:'json-diff',
    // JSON页面自动格式化
    JSON_PAGE_FORMAT: 'JSON_PAGE_FORMAT',
    JSON_PAGE_FORMAT_REQUEST: 'JSON_PAGE_FORMAT_REQUEST',
    //页面取色器
    COLOR_PICKER: "color-picker:newImage",
    SHOW_COLOR_PICKER: "show_color_picker",

    // ajax debugger
    AJAX_DEBUGGER: "ajax-debugger",
    AJAX_DEBUGGER_CONSOLE: "ajax-debugger-console",
    AJAX_DEBUGGER_SWITCH: "ajax-debugger-switch",

    HTML_TO_MARKDOWN: "html2markdown",
    PAGE_CAPTURE:'page-capture',
    PAGE_CAPTURE_SCROLL:"page_capture_scroll",
    PAGE_CAPTURE_CAPTURE:"page_capture_capture",

    // dev tools页面
    DEV_TOOLS: 'dev-tools',

    OPEN_OPTIONS_PAGE:'open-options-page'
};

(typeof module === 'object') ? module.exports = MSG_TYPE : '';