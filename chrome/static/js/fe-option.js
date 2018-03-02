/**
 * FeHelper配置项
 * @author zhaoxianlie
 */
baidu.feOption = (function () {

    // 页面json格式化强制开启
    var pageJsonMustFormat = false;

    /**
     * 将这些配置项保存到background-page，这样才能对每个页面生效
     * @param {Object} items {key:value}
     */
    var _saveOptionItemByBgPage = function (items) {
        for (var key in items) {
            window.localStorage.setItem(key, items[key]);
        }
    };

    /**
     * 从background-page获取配置项
     * @param {Object} items ["",""]
     * @return {key:value}
     */
    var _getOptionItemByBgPage = function (items) {
        var rst = {};
        for (var i = 0, len = items.length; i < len; i++) {
            rst[items[i]] = window.localStorage.getItem(items[i]);
        }
        return rst;
    };

    /**
     * 向background-page发送请求，提取配置项
     * @param {Object} items
     * @param {Function} 回调方法
     */
    var _goGetOptions = function (items, callback) {
        chrome.extension.sendMessage({
            type: MSG_TYPE.GET_OPTIONS,
            items: items
        }, callback);
    };

    /**
     * 向background-page发送请求，保存配置项
     * @param {Object} items
     */
    var _goSetOptions = function (items) {
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
    var _doGetOptions = function (items, callback) {
        if (callback && typeof callback == 'function') {
            callback.call(null, _getOptionItemByBgPage(items));
        }
    };

    /**
     * 由background-page触发
     * @param {Object} items
     */
    var _doSetOptions = function (items) {
        _saveOptionItemByBgPage(items);
    };

    /**
     * 获取某一项配置
     * @param {String} optName 配置参数名
     */
    var _getOptionItem = function (optName) {
        return _getOptionItemByBgPage([optName])[optName];
    };

    // 所有配置项
    var optionItems = [
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
    var _save_opt_form_start = function () {
        var items = {};
        $.each(optionItems, function (i, item) {
            items[item] = $('#' + item).attr('checked');
        });

        _goSetOptions(items);
    };

    /**
     * 显示启动项
     */
    var _show_opt_form_start = function () {
        _goGetOptions(optionItems, function (opts) {
            $.each(optionItems, function (i, item) {
                if (opts[item] === 'false') {
                    $('#' + item).removeAttr('checked');
                }
            });
        })
    };

    /**
     * 关闭配置页面
     */
    var _closeTab = function () {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            var tab = tabs[0];
            chrome.tabs.remove(tab.id);
        });
    };

    /**
     * 事件绑定
     */
    var _bindEvent = function () {

        //给保存按钮注册事件
        $('#btn_close').click(function () {
            //关闭当前tab
            _closeTab();
        });

        //给保存按钮注册事件
        $('#btn_save').click(function () {

            //保存各个值
            _save_opt_form_start();

            alert('恭喜，FeHelper配置修改成功!');

            //关闭当前tab
            _closeTab();

            e.preventDefault();
            e.stopPropagation();
        });
    };

    /**
     * 初始化各个配置项
     */
    var _initOptions = function () {
        _show_opt_form_start();
    };

    /**
     * 初始化
     */
    var _init = function () {
        _bindEvent();
        _initOptions();
    };

    return {
        pageJsonMustFormat: pageJsonMustFormat,
        optionItems: optionItems,
        init: _init,
        doSetOptions: _doSetOptions,
        doGetOptions: _doGetOptions,
        getOptionItem: _getOptionItem,
        getOptions: _goGetOptions,
        setOptions: _goSetOptions
    };
})();




