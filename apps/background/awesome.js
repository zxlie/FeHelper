/**
 * 工具更新
 * @type {{download}}
 */
import toolMap from './tools.js';
import MSG_TYPE from '../static/js/common.js';

let Awesome = (() => {

    let manifest = chrome.runtime.getManifest();

    const SERVER_SITE = manifest.homepage_url;
    const URL_TOOL_TPL = `${SERVER_SITE}/#TOOL-NAME#/index.html`;
    const TOOL_NAME_TPL = 'DYNAMIC_TOOL:#TOOL-NAME#';
    const TOOL_CONTENT_SCRIPT_TPL = 'DYNAMIC_TOOL:CS:#TOOL-NAME#';
    const TOOL_CONTENT_SCRIPT_CSS_TPL = 'DYNAMIC_TOOL:CS:CSS:#TOOL-NAME#';
    const TOOL_MENU_TPL = 'DYNAMIC_MENU:#TOOL-NAME#';

    /**
     * 管理本地存储
     */
    let StorageMgr = (() => {

        let get = keyArr => {
            return new Promise((resolve, reject) => {
                chrome.storage.local.get(keyArr, result => {
                    resolve(typeof keyArr === 'string' ? result[keyArr] : result);
                });
            });
        };


        let getSync = async (keyArr) => {
            return await (new Promise((resolve, reject) => {
                chrome.storage.local.get(keyArr, result => {
                    resolve(typeof keyArr === 'string' ? result[keyArr] : result);
                });
            }));
        };

        let set = (items, values) => {
            return new Promise((resolve, reject) => {
                if (typeof items === 'string') {
                    let tmp = {};
                    tmp[items] = values;
                    items = tmp;
                }
                chrome.storage.local.set(items, () => {
                    resolve();
                });
            });
        };

        let remove = keyArr => {
            return new Promise((resolve, reject) => {
                keyArr = [].concat(keyArr);
                chrome.storage.local.remove(keyArr, () => {
                    resolve();
                });
            });
        };

        return {get, set, remove,getSync};
    })();

    /**
     * 检测工具是否已被成功安装
     * @param toolName 工具名称
     * @param detectMenu 是否进一步检测Menu的设置情况
     * @returns {Promise}
     */
    let detectInstall = (toolName, detectMenu) => {

        let menuKey = TOOL_MENU_TPL.replace('#TOOL-NAME#', toolName);
        let toolKey = TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName);

        return Promise.all([StorageMgr.get(toolKey), StorageMgr.get(menuKey)]).then(values => {
            let toolInstalled = !!values[0];
            // 系统预置的功能，是强制 installed 状态的
            if(toolMap[toolName] && toolMap[toolName].systemInstalled) {
                toolInstalled = true;
            }
            if (detectMenu) {
                return toolInstalled && String(values[1]) === '1';
            }
            return toolInstalled;
        });
    };

    let log = (txt) => {
        // console.log(String(new Date(new Date() * 1 - (new Date().getTimezoneOffset()) * 60 * 1000).toJSON()).replace(/T/i, ' ').replace(/Z/i, '') + '>', txt);
    };

    /**
     * 安装/更新工具，支持显示安装进度
     * @param toolName
     * @param fnProgress
     * @returns {Promise<any>}
     */
    let install = (toolName, fnProgress) => {
        return new Promise((resolve, reject) => {
            // 存储html文件
            StorageMgr.set(TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName), '&nbsp;');
            log(toolName + '工具html模板安装/更新成功！');
            resolve();
        });
    };

    let offLoad = (toolName) => {
        let items = [];
        items.push(TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName));
        items.push(TOOL_CONTENT_SCRIPT_TPL.replace('#TOOL-NAME#', toolName));
        items.push(TOOL_CONTENT_SCRIPT_CSS_TPL.replace('#TOOL-NAME#', toolName));

        // 删除所有静态文件
        chrome.storage.local.get(null, allDatas => {
            StorageMgr.remove(Object.keys(allDatas).filter(key => String(key).startsWith(`../${toolName}/`)));
        });

        log(toolName + ' 卸载成功！');

        return StorageMgr.remove(items);
    };

    /**
     * 有些工具其实已经卸载过了，但是本地还有冗余的静态文件，都需要统一清理一遍
     */
    let gcLocalFiles = () => getAllTools().then(tools => Object.keys(tools).forEach(tool => {
        if (!tools[tool]._devTool && !tools[tool].installed) {
            offLoad(tool);
        }
    }));

    let getAllTools = async () => {

        // 获取本地开发的插件，也拼接进来
        try {
            const DEV_TOOLS_MY_TOOLS = 'DEV-TOOLS:MY-TOOLS';
            let _tools = await StorageMgr.getSync(DEV_TOOLS_MY_TOOLS);
            let localDevTools = JSON.parse(_tools || '{}');
            Object.keys(localDevTools).forEach(tool => {
                toolMap[tool] = localDevTools[tool];
            });
        } catch (e) {
        }

        let tools = Object.keys(toolMap);
        let promises = [];
        tools.forEach(tool => {
            promises = promises.concat([detectInstall(tool), detectInstall(tool, true)])
        });
        let pAll = Promise.all(promises).then(values => {
            values.forEach((v, i) => {
                let tool = tools[Math.floor(i / 2)];
                let key = i % 2 === 0 ? 'installed' : 'menu';
                toolMap[tool][key] = v;
                // 本地工具，还需要看是否处于开启状态
                if (toolMap[tool].hasOwnProperty('_devTool')) {
                    toolMap[tool][key] = toolMap[tool][key] && toolMap[tool]._enable;
                }
            });
            return toolMap;
        });
        let pSort = SortToolMgr.get();

        return Promise.all([pAll,pSort]).then(vs => {
            let allTools = vs[0];
            let sortTools = vs[1];

            if (sortTools && sortTools.length) {
                let map = {};
                sortTools.forEach(tool => {
                    map[tool] = allTools[tool];
                });
                Object.keys(allTools).forEach(tool => {
                    if (!map[tool]) {
                        map[tool] = allTools[tool];
                    }
                });
                return map;
            }else{
                return allTools;
            }
        });
    };

    /**
     * 检查看本地已安装过哪些工具
     * @returns {Promise}
     */
    let getInstalledTools = () => getAllTools().then(tools => {
        let istTolls = {};
        Object.keys(tools).filter(tool => {
            if (tools[tool] && tools[tool].installed) {
                istTolls[tool] = tools[tool];
            }
        });
        return istTolls;
    });

    /**
     * 获取工具的content-script
     * @param toolName
     * @param cssMode
     */
    let getContentScript = (toolName, cssMode) => {
        return StorageMgr.get(cssMode ? TOOL_CONTENT_SCRIPT_CSS_TPL.replace('#TOOL-NAME#', toolName)
            : TOOL_CONTENT_SCRIPT_TPL.replace('#TOOL-NAME#', toolName));
    };

    /**
     * 获取工具的html模板
     * @param toolName
     * @returns {*}
     */
    let getToolTpl = (toolName) => StorageMgr.get(TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName));

    /**
     * 从服务器检查，看本地已安装的工具，有哪些又已经升级过了
     * @param tool
     */
    let checkUpgrade = (tool) => {
        let getOnline = (toolName) => fetch(URL_TOOL_TPL.replace('#TOOL-NAME#', toolName)).then(resp => resp.text());
        let getOffline = (toolName) => StorageMgr.get(TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName));
        return Promise.all([getOnline(tool), getOffline(tool)]).then(values => {
            let onlineData = _tplHandler(tool, values[0]);
            let local = values[1];
            return local !== onlineData.html;
        });
    };

    /**
     * 管理右键菜单
     * @param toolName
     * @param action 具体动作install/offload/get
     * @returns {Promise<any>}
     */
    let menuMgr = (toolName, action) => {
        let menuKey = TOOL_MENU_TPL.replace('#TOOL-NAME#', toolName);
        switch (action) {
            case 'get':
                return StorageMgr.get(menuKey);
            case 'offload':
                // 必须用setItem模式，而不是removeItem，要处理 0/1/null三种结果
                log(toolName + ' 卸载成功！');
                return StorageMgr.set(menuKey, 0);
            case 'install':
                log(toolName + ' 安装成功！');
                return StorageMgr.set(menuKey, 1);
        }
    };

    /**
     * 远程获取的代码管理器
     * @type {{get, set}}
     */
    let CodeCacheMgr = (() => {
        const TOOLS_FROM_REMOTE = 'TOOLS_FROM_REMOTE';

        let get = () => {
            return StorageMgr.getSync(TOOLS_FROM_REMOTE);
        };

        let set = (remoteCodes) => {
            let obj = {};
            obj[TOOLS_FROM_REMOTE]=remoteCodes;
            chrome.storage.local.set(obj);
        };

        return {get, set};
    })();

    /**
     * 工具排序管理器
     * @type {{get, set}}
     */
    let SortToolMgr = (() => {
        const TOOLS_CUSTOM_SORT = 'TOOLS_CUSTOM_SORT';

        let get = async () => {
            let cache = await StorageMgr.getSync(TOOLS_CUSTOM_SORT);

            return [].concat(JSON.parse(cache || '[]')).filter(t => !!t);
        };

        let set = (newSortArray) => {
            let obj = {};
            obj[TOOLS_CUSTOM_SORT] = JSON.stringify([].concat(newSortArray || []).filter(t => !!t));
            chrome.storage.local.set(obj);
        };

        return {get, set};
    })();


    return {
        StorageMgr,
        detectInstall,
        install,
        offLoad,
        getInstalledTools,
        menuMgr,
        checkUpgrade,
        getContentScript,
        getToolTpl,
        gcLocalFiles,
        getAllTools,
        SortToolMgr,
        CodeCacheMgr
    }
})();

export default Awesome;
