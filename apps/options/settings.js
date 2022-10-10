/**
 * FeHelper Settings Tools
 * @author zhaoxianlie
 */

import Awesome from '../background/awesome.js';

export default (() => {

    // 所有配置项
    let optionItemsWithDefaultValue = {
        'OPT_ITEM_CONTEXTMENUS': true,
        'JSON_PAGE_FORMAT': true,
        'FORBID_OPEN_IN_NEW_TAB': false,
        'AUTO_DARK_MODE': false,
        'ALWAYS_DARK_MODE': false,
        'CONTENT_SCRIPT_ALLOW_ALL_FRAMES': false
    };

    /**
     * 获取全部配置项
     * @returns {string[]}
     * @private
     */
    let _getAllOpts = () => Object.keys(optionItemsWithDefaultValue);


    /**
     * 提取配置项
     * @param {Function} callback 回调方法
     */
    let _getOptions = function (callback) {
        let rst = {};
        chrome.storage.local.get(_getAllOpts(),(objs) => {
            Object.keys(objs).forEach(item => {
                let opt = objs[item];
                if (opt !== null) {
                    rst[item] = opt;
                } else {
                    rst[item] = optionItemsWithDefaultValue[item];
                }
            });
            callback.call(null, rst);
        });
    };

    /**
     * 保存配置
     * @param items
     * @param callback
     * @private
     */
    let _setOptions = function (items, callback) {
        _getAllOpts().forEach((opt) => {
            let found = items.some(it => {
                if (typeof(it) === 'string' && it === opt) {
                    Awesome.StorageMgr.set(opt,'true');
                    return true;
                }
                else if (typeof(it) === 'object' && it.hasOwnProperty(opt)) {
                    Awesome.StorageMgr.set(opt,it[opt]);
                    return true;
                }
                return false;
            });
            if (!found) {
                Awesome.StorageMgr.set(opt,'false');
            }
        });

        callback && callback();
    };

    return {
        getAllOpts: _getAllOpts,
        getOptions: _getOptions,
        setOptions: _setOptions
    };
})();
