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
        'CONTENT_SCRIPT_ALLOW_ALL_FRAMES': false,
        'FORBID_STATISTICS': false
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
            // 确保objs是一个对象
            objs = objs || {};
            
            // 遍历所有配置项，确保每个配置项都有值
            _getAllOpts().forEach(item => {
                if (objs.hasOwnProperty(item) && objs[item] !== null) {
                    rst[item] = objs[item];
                } else {
                    // 使用默认值
                    rst[item] = optionItemsWithDefaultValue[item];
                }
            });
            
            callback && callback.call(null, rst);
        });
    };

    /**
     * 保存配置
     * @param items
     * @param callback
     * @private
     */
    let _setOptions = function (items, callback) {
        // 确保items是数组类型
        if (!Array.isArray(items)) {
            // 如果传入的是对象类型，转换为数组形式
            if (typeof items === 'object' && items !== null) {
                let tempItems = [];
                Object.keys(items).forEach(key => {
                    let obj = {};
                    obj[key] = items[key];
                    tempItems.push(obj);
                });
                items = tempItems;
            } else {
                items = [];
            }
        }

        _getAllOpts().forEach((opt) => {
            try {
                let found = items.some(it => {
                    if (!it) return false;
                    
                    if (typeof(it) === 'string' && it === opt) {
                        chrome.storage.local.set({[opt]: 'true'});
                        return true;
                    }
                    else if (typeof(it) === 'object' && it !== null && it.hasOwnProperty(opt)) {
                        chrome.storage.local.set({[opt]: it[opt]});
                        return true;
                    }
                    return false;
                });
                if (!found) {
                    chrome.storage.local.set({[opt]: 'false'});
                }
            } catch (e) {
                console.error('保存设置出错:', e, opt);
                // 出错时设置为默认值
                chrome.storage.local.set({
                    [opt]: optionItemsWithDefaultValue[opt] === true ? 'true' : 'false'
                });
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

