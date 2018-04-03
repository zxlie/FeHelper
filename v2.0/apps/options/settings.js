/**
 * FeHelper Settings Tools
 */
module.exports = (() => {

    // 页面json格式化强制开启
    let pageJsonMustFormat = false;

    /**
     * 将这些配置项保存到background-page，这样才能对每个页面生效
     * @param {Object} items {key:value}
     */
    let _saveOptionItemByBgPage = function (items) {
        for (let key in items) {
            window.localStorage.setItem(key, items[key]);
        }
    };

    /**
     * 从background-page获取配置项
     * @param {Object} items ["",""]
     * @return {key:value}
     */
    let _getOptionItemByBgPage = function (items) {
        let rst = {};
        for (let i = 0, len = items.length; i < len; i++) {
            rst[items[i]] = window.localStorage.getItem(items[i]);
        }
        return rst;
    };

    /**
     * 向background-page发送请求，提取配置项
     * @param {Object} items
     * @param {Function} 回调方法
     */
    let _goGetOptions = function (items, callback) {
        chrome.extension.sendMessage({
            type: MSG_TYPE.GET_OPTIONS,
            items: items
        }, callback);
    };

    /**
     * 向background-page发送请求，保存配置项
     * @param {Object} items
     */
    let _goSetOptions = function (items) {
        chrome.extension.sendMessage({
            type: MSG_TYPE.SET_OPTIONS,
            items: items
        });
    };

    /**
     * 由background-page触发
     * @param {Object} items
     * @param {Object} callback
     */
    let _doGetOptions = function (items, callback) {
        if (callback && typeof callback == 'function') {
            callback.call(null, _getOptionItemByBgPage(items));
        }
    };

    /**
     * 由background-page触发
     * @param {Object} items
     */
    let _doSetOptions = function (items) {
        _saveOptionItemByBgPage(items);
    };

    /**
     * 获取某一项配置
     * @param {String} optName 配置参数名
     */
    let _getOptionItem = function (optName) {
        return _getOptionItemByBgPage([optName])[optName];
    };

    // 所有配置项
    let optionItems = [
        'opt_item_contextMenus',
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
        'AJAX_DEBUGGER'
    ];
    if (!pageJsonMustFormat) {
        optionItems.push('JSON_PAGE_FORMAT');
    }

    /**
     * 保存启动项
     */
    let _save_opt_form_start = function () {
        let items = {};
        $.each(optionItems, function (i, item) {
            items[item] = $('#' + item).attr('checked');
        });

        _goSetOptions(items);
    };

    return {
        pageJsonMustFormat: pageJsonMustFormat,
        optionItems: optionItems,
        doSetOptions: _doSetOptions,
        doGetOptions: _doGetOptions,
        getOptionItem: _getOptionItem,
        getOptions: _goGetOptions,
        setOptions: _goSetOptions
    };
})();