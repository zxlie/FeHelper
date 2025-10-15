/**
 * 工具更新
 * @type {{download}}
 */
import toolMap from './tools.js';

let Awesome = (() => {

    let manifest = chrome.runtime ? chrome.runtime.getManifest() : {};

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

        // 获取chrome.storage.local中的内容，返回Promise，可直接await
        let get = keyArr => {
            return new Promise((resolve, reject) => {
                chrome.storage.local.get(keyArr, result => {
                    resolve(typeof keyArr === 'string' ? result[keyArr] : result);
                });
            });
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

        return {get, set, remove};
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
            StorageMgr.set(TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName), new Date().getTime());
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
            if (allDatas) {
                StorageMgr.remove(Object.keys(allDatas).filter(key => String(key).startsWith(`../${toolName}/`)));
            }
        });

        log(toolName + ' 卸载成功！');

        return StorageMgr.remove(items);
    };

    /**
     * 有些工具其实已经卸载过了，但是本地还有冗余的静态文件，都需要统一清理一遍
     */
    let gcLocalFiles = () => getAllTools().then(tools => {
        if (!tools) return;
        Object.keys(tools).forEach(tool => {
            if (!tools[tool] || !tools[tool]._devTool && !tools[tool].installed) {
                offLoad(tool);
            }
        });
    });

    let getAllTools = async () => {

        // 获取本地开发的插件，也拼接进来
        try {
            const DEV_TOOLS_MY_TOOLS = 'DEV-TOOLS:MY-TOOLS';
            let _tools = await StorageMgr.get(DEV_TOOLS_MY_TOOLS);
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
        return Promise.all(promises).then(values => {
            (values || []).forEach((v, i) => {
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
    };

    /**
     * 检查看本地已安装过哪些工具 - 性能优化版本
     * @returns {Promise}
     */
    let getInstalledTools = async () => {
        try {
            // 一次性获取所有存储数据，避免多次访问
            const allStorageData = await new Promise((resolve, reject) => {
                chrome.storage.local.get(null, result => {
                    resolve(result || {});
                });
            });

            // 获取本地开发的插件
            const DEV_TOOLS_MY_TOOLS = 'DEV-TOOLS:MY-TOOLS';
            let localDevTools = {};
            try {
                localDevTools = JSON.parse(allStorageData[DEV_TOOLS_MY_TOOLS] || '{}');
                Object.keys(localDevTools).forEach(tool => {
                    toolMap[tool] = localDevTools[tool];
                });
            } catch (e) {
                // 忽略解析错误
            }

            let installedTools = {};
            
            // 遍历所有工具，从存储数据中检查安装状态
            Object.keys(toolMap).forEach(toolName => {
                const toolKey = TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName);
                const menuKey = TOOL_MENU_TPL.replace('#TOOL-NAME#', toolName);
                
                // 检查工具是否已安装
                let toolInstalled = !!allStorageData[toolKey];
                // 系统预置的功能，是强制 installed 状态的
                if (toolMap[toolName] && toolMap[toolName].systemInstalled) {
                    toolInstalled = true;
                }
                
                // 检查菜单状态
                let menuInstalled = String(allStorageData[menuKey]) === '1';
                
                // 本地工具，还需要看是否处于开启状态
                if (toolMap[toolName].hasOwnProperty('_devTool')) {
                    toolInstalled = toolInstalled && toolMap[toolName]._enable;
                    menuInstalled = menuInstalled && toolMap[toolName]._enable;
                }
                
                // 只收集已安装的工具
                if (toolInstalled) {
                    installedTools[toolName] = {
                        ...toolMap[toolName],
                        installed: true,
                        menu: menuInstalled,
                        installTime: parseInt(allStorageData[toolKey]) || 0
                    };
                }
            });

            // 按安装时间排序
            const sortedToolNames = Object.keys(installedTools).sort((a, b) => {
                return installedTools[a].installTime - installedTools[b].installTime;
            });

            let sortedToolMap = {};
            sortedToolNames.forEach(toolName => {
                sortedToolMap[toolName] = installedTools[toolName];
            });
            
            return sortedToolMap;
        } catch (error) {
            console.error('getInstalledTools error:', error);
            // 发生错误时返回空对象，避免popup完全无法加载
            return {};
        }
    };

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
     * 采集客户端信息并发送给background
     */
    let collectAndSendClientInfo = () => {
        try {
            const nav = navigator;
            const screenInfo = window.screen;
            const lang = nav.language || nav.userLanguage || '';
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const ua = nav.userAgent;
            const platform = nav.platform;
            const vendor = nav.vendor;
            const colorDepth = screenInfo.colorDepth;
            const screenWidth = screenInfo.width;
            const screenHeight = screenInfo.height;
            const deviceMemory = nav.deviceMemory || '';
            const hardwareConcurrency = nav.hardwareConcurrency || '';
            const connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
            const screenOrientation = screenInfo.orientation ? screenInfo.orientation.type : '';
            const touchSupport = ('ontouchstart' in window) || (nav.maxTouchPoints > 0);
            let memoryJSHeapSize = '';
            if (window.performance && window.performance.memory) {
                memoryJSHeapSize = window.performance.memory.jsHeapSizeLimit;
            }
            const clientInfo = {
                language: lang,
                timezone,
                userAgent: ua,
                platform,
                vendor,
                colorDepth,
                screenWidth,
                screenHeight,
                deviceMemory,
                hardwareConcurrency,
                networkType: connection.effectiveType || '',
                downlink: connection.downlink || '',
                rtt: connection.rtt || '',
                online: nav.onLine,
                touchSupport,
                cookieEnabled: nav.cookieEnabled,
                doNotTrack: nav.doNotTrack,
                appVersion: nav.appVersion,
                appName: nav.appName,
                product: nav.product,
                vendorSub: nav.vendorSub,
                screenOrientation,
                memoryJSHeapSize
            };
            chrome.runtime.sendMessage({ type: 'clientInfo', data: clientInfo });
        } catch (e) {
            // 忽略采集异常
        }
    };

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
        collectAndSendClientInfo
    }
})();

export default Awesome;

