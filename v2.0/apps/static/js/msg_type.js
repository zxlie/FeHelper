/**
 * FeHelper MSG_TYPE
 * @type {{BROWSER_CLICKED: string, GET_OPTIONS: string, SET_OPTIONS: string, START_OPTION: string, OPT_START_FCP: string, OPT_START_GRID: string, CALC_PAGE_LOAD_TIME: string, GET_PAGE_WPO_INFO: string, SHOW_PAGE_LOAD_TIME: string, JS_TRACKER: string, FROM_POPUP: string, TAB_CREATED_OR_UPDATED: string, REGEXP_TOOL: string, EN_DECODE: string, JSON_FORMAT: string, QR_CODE: string, CODE_BEAUTIFY: string, CODE_COMPRESS: string, TIME_STAMP: string, IMAGE_BASE64: string, QR_DECODE: string, AUTO_FORMART_PAGE_JSON: string, COLOR_PICKER: string, AJAX_DEBUGGER: string, AJAX_DEBUGGER_CONSOLE: string, AJAX_DEBUGGER_SWITCH: string}}
 */
module.exports = {

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
    //代码压缩
    CODE_COMPRESS: 'code-compress',
    // 时间转换
    TIME_STAMP: 'timestamp',
    // 图片base64
    IMAGE_BASE64: 'image-base64',
    // 二维码解码
    QR_DECODE: 'qr-decode',
    // JSON页面自动格式化
    JSON_PAGE_FORMAT: 'JSON_PAGE_FORMAT',
    //页面取色器
    COLOR_PICKER: "color-picker:newImage",

    // ajax debugger
    AJAX_DEBUGGER: "ajax-debugger",
    AJAX_DEBUGGER_CONSOLE: "ajax-debugger-console",
    AJAX_DEBUGGER_SWITCH: "ajax-debugger-switch",

    // dev tools页面
    DEV_TOOLS: 'dev-tools'
};