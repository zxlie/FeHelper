/**
 * ****************************************************
 *
 * 此文件非常重要！！！！
 * 用于FeHelper一系列工具的远程上架、下架，无需再提升
 *
 * @author zhaoxianlie
 * @date 2020.01.16
 *
 * ****************************************************
 */
window.RemoteAwesome = (() => {

    // 新上架的工具
    let newTools = (() => {
        let toolMap = {
            'json-format':{
                tips:'页面自动检测并格式化、手动格式化、乱码解码、排序、BigInt、编辑、下载、皮肤定制等'
            },
            'qr-code': {
                contentScript: true
            },
            'postman': {
                name: '简易Postman'
            },
            'page-monkey': {
                name: '网页油猴工具',
                tips: '自行配置页面匹配规则、编写Hack脚本，实现网页Hack，如页面自动刷新、自动抢票等',
                contentScript: true,
                menuConfig: [{
                    icon: '♀',
                    text: '网页油猴工具',
                    onClick: function (info, tab) {
                        chrome.DynamicToolRunner({
                            query: 'tool=page-monkey'
                        });
                    }
                }]
            },
            'code-beautify': {
                contentScript: true,
                contentScriptCss: true
            },
            'screenshot': {
                name: '网页截屏工具',
                tips: '可对任意网页进行截屏，支持可视区域截屏、全网页滚动截屏，最终结果可预览后再保存',
                contentScript: true,
                menuConfig: [{
                    icon: '✂',
                    text: '网页截屏工具',
                    onClick: function (info, tab) {
                        let captureWhole = confirm('取消(否)：可视区域截屏！\n确定(是)：网页滚动截屏！');
                        chrome.tabs.executeScript(tab.id, {
                            code: '(' + (function (tabInfo, captureInfo) {
                                let func = window['screenshotContentScript'];
                                func && func({
                                    tabInfo: tabInfo,
                                    captureInfo: captureInfo
                                })();
                            }).toString() + ')(' + JSON.stringify(tab) + ',' + JSON.stringify({
                                captureType: captureWhole ? 'whole' : 'visible'
                            }) + ')',
                            allFrames: false
                        });
                    }
                }]
            },
            'color-picker': {
                name: '页面取色工具',
                tips: '可直接在网页上针对任意元素进行色值采集，将光标移动到需要取色的位置，单击确定即可',
                noPage: true,
                contentScript: true,
                minVersion: '2020.02.0718',
                menuConfig: [{
                    icon: '✑',
                    text: '页面取色工具',
                    onClick: function (info, tab) {
                        chrome.DynamicToolRunner({
                            query: 'tool=color-picker',
                            noPage: true
                        });
                    }
                }]
            },
            'naotu': {
                name: '便捷思维导图',
                tips: '轻量便捷，随想随用，支持自动保存、本地数据存储、批量数据导入导出、图片格式下载等',
                menuConfig: [{
                    icon: 'Ψ',
                    text: '便捷思维导图',
                    onClick: function (info, tab) {
                        chrome.DynamicToolRunner({
                            query: 'tool=naotu'
                        });
                    }
                }]
            },
            'html2markdown': {
                name:'Markdown工具',
                tips:'Markdown编辑器，支持在线编写、预览、下载等，并支持HTML内容到Markdown格式的转换'
            },
            'grid-ruler': {
                name: '网页栅格标尺',
                tips: 'Web开发用，横竖两把尺子，以10px为单位，用以检测&校准当前网页的栅格对齐率',
                contentScript:true,
                contentScriptCss:true,
                noPage:true,
                menuConfig: [{
                    icon: 'Ⅲ',
                    text: '网页栅格标尺',
                    onClick: function (info, tab) {
                        chrome.DynamicToolRunner({
                            query: 'tool=grid-ruler',
                            noPage:true
                        });
                    }
                }]
            },
            'code-compress': {
                name: '代码压缩工具',
                tips: 'Web开发用，提供简单的代码压缩功能，支持HTML、Javascript、CSS代码压缩',
                menuConfig: [{
                    icon: '♯',
                    text: '代码压缩工具',
                    onClick: function (info, tab) {
                        chrome.DynamicToolRunner({
                            query: 'tool=code-compress',
                            noPage:true
                        });
                    }
                }]
            },
            'page-timing': {
                name: '网页性能检测',
                tips: '检测网页加载性能，包括握手、响应、渲染等各阶段耗时，同时提供Response Headers以便分析',
                contentScript:true,
                noPage:true,
                menuConfig: [{
                    icon: 'Σ',
                    text: '网页性能检测',
                    onClick: function (info, tab) {
                        chrome.DynamicToolRunner({
                            query: 'tool=page-timing',
                            noPage:true
                        });
                    }
                }]
            },
            'excel2json': {
                name: 'Excel转JSON',
                tips: '将Excel或CVS中的数据，直接转换成为结构化数据，如JSON、XML、MySQL、PHP等（By @hpng）',
                menuConfig: [{
                    icon: 'Ⓗ',
                    text: 'Excel转JSON',
                    onClick: function (info, tab) {
                        chrome.DynamicToolRunner({
                            query: 'tool=excel2json',
                            noPage:true
                        });
                    }
                }]
            },
        };

        Object.keys(toolMap).forEach(tool => {
            toolMap[tool].installed = false;
            toolMap[tool].upgrade = false;
            toolMap[tool].menu = false;
        });

        try {
            let getAbsNum = num => parseInt(num.split(/\./).map(n => n.padStart(4, '0')).join(''), 10);
            // 对新增的工具，进行版本控制
            let curVersion = getAbsNum(chrome.runtime.getManifest().version);
            Object.keys(toolMap).forEach(tool => {
                if (toolMap[tool].minVersion) {
                    let minV = getAbsNum(toolMap[tool].minVersion);
                    if (minV > curVersion) {
                        delete toolMap[tool];
                    }
                }
            });
        } catch (e) {
        }

        // 在这里可以临时删除/屏蔽工具
        // delete toolMap['color-picker'];

        return toolMap;
    })();

    // 下架掉的旧版工具，value格式为：'ruler','code-standard'
    let removedTools = [];

    return {newTools, removedTools};
})();
