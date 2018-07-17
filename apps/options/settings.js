/**
 * FeHelper Settings Tools
 */
module.exports = (() => {

    // 页面json格式化强制开启
    let MSG_TYPE = Tarp.require('../static/js/msg_type');

    // 默认值：JSON格式化支持的最大key数量
    let maxJsonKeysNumber = 10000;

    // 所有配置项
    let optionItems = [
        'opt_item_contextMenus',
        'JSON_PAGE_FORMAT',
        'EN_DECODE',
        'CODE_BEAUTIFY',
        'CODE_COMPRESS',
        'JSON_FORMAT',
        'JSON_COMPARE',
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
        'PAGE_CAPTURE',
        'RANDOM_PASSWORD',
        'FORBID_OPEN_IN_NEW_TAB',
        'MAX_JSON_KEYS_NUMBER'
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
                if (item === 'MAX_JSON_KEYS_NUMBER') {
                    rst[item] = opt || maxJsonKeysNumber;
                } else if (typeof(opt) === 'number') {
                    rst[item] = opt;
                } else if (opt !== 'false') {
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
            let found = items.some(it => {
                if (typeof(it) === 'string' && it === opt) {
                    localStorage.setItem(opt, 'true');
                    return true;
                }
                else if (typeof(it) === 'object' && it.hasOwnProperty(opt)) {
                    localStorage.setItem(opt, it[opt]);
                    return true;
                }
                return false;
            });
            if (!found) {
                localStorage.setItem(opt, 'false');
            }
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