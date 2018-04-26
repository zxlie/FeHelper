/**
 * FeHelper Settings Tools
 */
module.exports = (() => {

    // 页面json格式化强制开启
    let MSG_TYPE = Tarp.require('../static/js/msg_type');

    // 所有配置项
    let optionItems = [
        'opt_item_contextMenus',
        'JSON_PAGE_FORMAT',
        'EN_DECODE',
        'CODE_BEAUTIFY',
        'CODE_COMPRESS',
        'JSON_FORMAT',
        'QR_CODE',
        'COLOR_PICKER',
        'REGEXP_TOOL',
        'TIME_STAMP',
        'IMAGE_BASE64',
        'FCP_HELPER_DETECT',
        'SHOW_PAGE_LOAD_TIME',
        'AJAX_DEBUGGER',
        'JS_CSS_PAGE_BEAUTIFY',
        'HTML_TO_MARKDOWN',
        'PAGE_CAPTURE'
    ];

    /**
     * 获取全部配置项
     * @returns {string[]}
     * @private
     */
    let _getAllOpts = () => optionItems;


    /**
     * 向background-page发送请求，提取配置项
     * @param {Function} callback 回调方法
     */
    let _getOptions = function (callback) {
        chrome.runtime.sendMessage({
            type: MSG_TYPE.GET_OPTIONS
        }, callback);
    };

    /**
     * 向background-page发送请求，保存配置项
     * @param {Object} items
     */
    let _setOptions = function (items) {
        chrome.runtime.sendMessage({
            type: MSG_TYPE.SET_OPTIONS,
            items: items
        });
    };

    /**
     * 由background-page触发
     * @param {Object} callback
     */
    let _getOptsFromBgPage = function (callback) {
        if (callback && typeof callback === 'function') {
            let rst = {};
            optionItems.forEach((item) => {
                let opt = localStorage.getItem(item);
                if (opt !== 'false') {
                    rst[item] = 'true';
                }
            });
            callback.call(null, rst);
        }
    };

    /**
     * 由background-page触发
     * @param {Object} items
     */
    let _setOptsFromBgPage = function (items) {
        optionItems.forEach((opt) => {
            localStorage.setItem(opt, items.indexOf(opt) > -1 ? 'true' : 'false');
        });
    };

    return {
        getAllOpts: _getAllOpts,
        setOptsFromBgPage: _setOptsFromBgPage,
        getOptsFromBgPage: _getOptsFromBgPage,
        getOptions: _getOptions,
        setOptions: _setOptions
    };
})();