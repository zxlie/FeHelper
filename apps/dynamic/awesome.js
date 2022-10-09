/**
 * 工具更新
 * @type {{download}}
 */
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
     * @param detectContent 是否检测内容实际存在
     * @returns {Promise}
     */
    let detectInstall = (toolName, detectMenu, detectContent) => {

        let menuKey = TOOL_MENU_TPL.replace('#TOOL-NAME#', toolName);
        let toolKey = TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName);

        if (toolName === 'json-format' && !detectContent) {
            if (detectMenu) {
                return StorageMgr.get(menuKey).then(value => String(value) !== '0');
            } else {
                return Promise.resolve(true);
            }
        }

        return Promise.all([StorageMgr.get(toolKey), StorageMgr.get(menuKey)]).then(values => {
            if (detectMenu) {
                return values[0] && String(values[1]) === '1';
            }
            return detectContent ? values[0] : !!values[0];
        });
    };

    let log = (txt) => {
        // console.log(String(new Date(new Date() * 1 - (new Date().getTimezoneOffset()) * 60 * 1000).toJSON()).replace(/T/i, ' ').replace(/Z/i, '') + '>', txt);
    };

    /**
     * 从服务器下载得到的HTML需要进行加工，得到干净并且适用于插件的HTML，同时剥离出静态文件列表
     * @param toolName
     * @param html
     * @returns {{html: *, jsCss: {}}}
     * @private
     */
    let _tplHandler = (toolName, html) => {
        let jsReg = /<script[^>]*src=['"]([^'"]+)['"][^>]*>\s*?<\/[^>]*script>/igm;
        let csReg = /<link\s+[^>]*stylesheet[^>]*href=['"]([^'"]+)['"][^>]*>/igm;
        let files = {};

        [csReg, jsReg].forEach(reg => {
            html = html.replace(reg, (tag, src) => {

                // 这里必须保留带有md5戳的原地址，要不然会有cdn缓存，更新会失败
                let originSrc = src;

                // 这个src是携带了Query的，用于直接存储到html中
                let withQuerySrc = src;

                // src 去query处理，用于Storage存储，避免过多冗余key出现
                if (src.indexOf('?') !== -1) {
                    let x = src.split('?');
                    x.pop();
                    src = x.join('');
                }

                if (!/^\./.test(src)) {
                    src = `../${toolName}/${src}`;
                    withQuerySrc = `../${toolName}/${withQuerySrc}`;
                }

                if (src !== '../static/js/navbar.js') {
                    // 存储静态文件的内容
                    let filePath = `${SERVER_SITE}/${toolName}/${originSrc}`;
                    let tagName = /<script/.test(tag) ? 'js' : 'css';

                    files[tagName] = files[tagName] || [];
                    files[tagName].push([src, withQuerySrc, filePath]);
                }

                return '';

            });
        });

        html = html.replace('static/img/favicon.ico', 'static/img/fe-16.png')  // 替换favicon
            .replace(/<body/gm, '<body browser-extension') // 给body添加属性
            .replace(/<div\s+class="mod-pageheader">.*<\/div>\s*<div\sclass="panel\spanel-default"/gm, '<div class="panel panel-default"') // 去掉mod-pageheader
            .replace(/<div\sid="pageFooter"\s+[^>]+>\s*<script\s.*<\/script>\s*<\/div>/gm, '') // 去除底部footer
            .replace(/<\/body>/, () => { // 将静态文件添加到页面最底部
                return Object.keys(files).map(t => {
                    return `<dynamic data-type="${t}" data-source="${files[t].map(f => f[1]).join(',')}"></dynamic>`;
                }).join('') + '</body>';
            });
        return {
            html: html,
            jsCss: files
        };
    };

    /**
     * 安装/更新工具，支持显示安装进度
     * @param toolName
     * @param fnProgress
     * @returns {Promise<any>}
     */
    let install = (toolName, fnProgress) => {

        log(toolName + '工具开始安装/更新...');

        return new Promise((resolve, reject) => {
            fetch(URL_TOOL_TPL.replace('#TOOL-NAME#', toolName)).then(resp => {
                if (resp.ok) {
                    fnProgress && fnProgress('1%');
                    return resp.text();
                } else {
                    reject && reject({
                        status: resp.status,
                        statusText: resp.statusText
                    });
                }
            }).then(html => {

                // 请求回来的数据需要做一些加工
                let result = _tplHandler(toolName, html);
                html = result.html;
                let files = result.jsCss;

                // 获取所有网络文件的总个数，以便于计算进度
                let total = window.evalCore.getEvalInstance(window)(Object.values(files).map(a => a.length).join('+')) + 1;
                let loaded = 1;
                fnProgress && fnProgress(Math.floor(100 * loaded / total) + '%');

                (async () => {

                    let allTools = getAllTools(true);

                    for (let t in files) {
                        for (let f = 0; f < files[t].length; f++) {
                            let fs = files[t][f];
                            await fetch(fs[2]).then(resp => resp.text()).then(txt => {
                                StorageMgr.set(fs[0], txt);

                                // 保存content-script / background-script
                                if (allTools[toolName].contentScript && fs[0].indexOf(toolName + '/content-script.js') !== -1) {
                                    StorageMgr.set(TOOL_CONTENT_SCRIPT_TPL.replace('#TOOL-NAME#', toolName), txt);

                                    // 存储content-script.css文件内容
                                    if (allTools[toolName].contentScriptCss) {
                                        fetch(fs[2].replace('content-script.js', 'content-script.css')).then(resp => resp.text()).then(css => {
                                            StorageMgr.set(TOOL_CONTENT_SCRIPT_CSS_TPL.replace('#TOOL-NAME#', toolName), css);
                                        });
                                    }
                                }

                                log(`${toolName}工具静态文件${fs[0]}安装/更新成功！`);
                                fnProgress && fnProgress(Math.floor(100 * ++loaded / total) + '%');
                            });
                        }
                    }

                    log(toolName + '工具安装/更新成功！');

                    // 全部下载完成！
                    resolve && resolve('100%');
                })();

                // 存储html文件
                StorageMgr.set(TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName), html || '&nbsp;');
                log(toolName + '工具html模板安装/更新成功！');
            }).catch(error => reject && reject(error));
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

    /**
     * 检查看本地已安装过哪些工具
     * @returns {Promise}
     */
    let getInstalledTools = () => getAllTools().then(tools => {
        let istTolls = {};
        Object.keys(tools).filter(tool => {
            if (tools[tool].installed) {
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

    let getAllTools = (declareOnly) => {
        let toolMap = {
            'json-format': {
                name: 'JSON美化工具',
                tips: '页面自动检测并格式化、手动格式化、乱码解码、排序、BigInt、编辑、下载、皮肤定制等',
                contentScript: true,
                contentScriptCss: true,
                offloadForbid: true,
                menuConfig: [{
                    icon: '⒥',
                    text: 'JSON格式化',
                    contexts: ['page', 'selection', 'editable']
                }]
            },
            'json-diff': {
                name: 'JSON比对工具',
                tips: '支持两个JSON内容的自动键值比较，并高亮显示差异点，同时也能判断JSON是否合法',
                menuConfig: [{
                    icon: '☷',
                    text: 'JSON比对器'
                }]
            },
            'qr-code': {
                name: '二维码/解码',
                tips: '支持自定义颜色和icon的二维码生成器，并且支持多种模式的二维码解码，包括截图后粘贴解码',
                contentScript: true,
                menuConfig: [{
                    icon: '▣',
                    text: '二维码生成器',
                    contexts: ['page', 'selection', 'editable', 'link', 'image']
                }, {
                    icon: '◈',
                    text: '二维码解码器',
                    contexts: ['image']
                }]
            },
            'image-base64': {
                name: '图片转Base64',
                tips: '支持多种模式的图片转Base64格式，比如链接粘贴/截图粘贴等，也支持Base64数据逆转图片',
                menuConfig: [{
                    icon: '▤',
                    text: '图片与base64',
                    contexts: ['image']
                }]
            },
            'sticky-notes': {
                name: '我的便签笔记',
                tips: '方便快捷的浏览器便签笔记工具，支持创建目录对笔记进行分类管理，笔记支持一键导出/导入',
                menuConfig: [{
                    icon: '✐',
                    text: '我的便签笔记'
                }]
            },
            'en-decode': {
                name: '信息编码转换',
                tips: '支持多格式的信息编解码，如Unicode、UTF-8、UTF-16、URL、Base64、MD5、Hex、Gzip等',
                menuConfig: [{
                    icon: '♨',
                    text: '字符串编解码',
                    contexts: ['page', 'selection', 'editable']
                }]
            },
            'code-beautify': {
                name: '代码美化工具',
                tips: '支持多语言的代码美化，包括 Javascript、CSS、HTML、XML、SQL，且会陆续支持更多格式',
                menuConfig: [{
                    icon: '✡',
                    text: '代码美化工具',
                    contexts: ['page', 'selection', 'editable']
                }]
            },
            'timestamp': {
                name: '时间(戳)转换',
                tips: '本地化时间与时间戳之间的相互转换，支持秒/毫秒、支持世界时区切换、各时区时钟展示等',
                menuConfig: [{
                    icon: '♖',
                    text: '时间(戳)转换'
                }]
            },
            'password': {
                name: '随机密码生成',
                tips: '将各种字符进行随机组合生成密码，可以由数字、大小写字母、特殊符号组成，支持指定长度',
                menuConfig: [{
                    icon: '♆',
                    text: '随机密码生成'
                }]
            },
            'html2markdown': {
                name: 'Markdown转换',
                tips: 'Markdown编写/预览工具，支持HTML片段直接转Markdown，支持将内容以PDF格式进行下载',
                menuConfig: [{
                    icon: 'ⓜ',
                    text: 'markown工具'
                }]
            },
            'postman': {
                name: '简易版Postman',
                tips: '开发过程中的接口调试工具，支持GET/POST/HEAD请求方式，且支持JSON内容自动格式化',
                menuConfig: [{
                    icon: '☯',
                    text: '简易Postman'
                }]
            },
            'regexp': {
                name: 'JS正则表达式',
                tips: '正则校验工具，默认提供一些工作中常用的正则表达式，支持内容实时匹配并高亮显示结果',
                menuConfig: [{
                    icon: '✙',
                    text: 'JS正则表达式'
                }]
            },
            'trans-radix': {
                name: '进制转换工具',
                tips: '支持2进制到36进制数据之间的任意转换，比如：10进制转2进制，8进制转16进制，等等',
                menuConfig: [{
                    icon: '❖',
                    text: '进制转换工具'
                }]
            },
            'trans-color': {
                name: '颜色转换工具',
                tips: '支持HEX颜色到RGB格式的互转，比如HEX颜色「#43ad7f」转RGB后为「rgb(67, 173, 127)」',
                menuConfig: [{
                    icon: '▶',
                    text: '颜色转换工具'
                }]
            },
            'crontab': {
                name: 'Crontab工具',
                tips: '一个简易的Crontab生成工具，支持随机生成Demo，编辑过程中，分时日月周会高亮提示',
                menuConfig: [{
                    icon: '½',
                    text: 'Crontab生成'
                }]
            },
            'loan-rate': {
                name: '贷(还)款利率',
                tips: '贷款或还款利率的计算器，按月呈现还款计划；并支持按还款额反推贷款实际利率',
                menuConfig: [{
                    icon: '$',
                    text: '贷(还)款利率'
                }]
            },
            'devtools': {
                name: 'FH开发者工具',
                tips: '以开发平台的思想，FeHelper支持用户进行本地开发，将自己的插件功能集成进FH工具市场',
                menuConfig: [{
                    icon: '㉿',
                    text: 'FH开发者工具'
                }]
            }
        };
        Object.keys(toolMap).forEach(tool => {
            toolMap[tool].installed = toolMap[tool].offloadForbid;
            toolMap[tool].menu = toolMap[tool].offloadForbid;
            toolMap[tool].upgrade = false;

            // context-menu
            switch (tool) {
                case 'json-format':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.scripting.executeScript({
                            target: {tabId:tab.id,allFrames:false},
                            func: () => info.selectionText
                        }, txt => chrome.DynamicToolRunner({
                            tool: 'json-format',
                            withContent: txt[0]
                        }));

                        // chrome.tabs.executeScript(tab.id, {
                        //     code: '(' + (function (pInfo) {
                        //         return pInfo.selectionText;
                        //     }).toString() + ')(' + JSON.stringify(info) + ')',
                        //     allFrames: false
                        // }, function (txt) {
                        //     chrome.DynamicToolRunner({
                        //         tool: 'json-format',
                        //         withContent: txt[0]
                        //     });
                        // });
                    };
                    break;

                case 'code-beautify':
                case 'en-decode':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.tabs.executeScript(tab.id, {
                            code: '(' + (function (pInfo) {
                                let linkUrl = pInfo.linkUrl;
                                let pageUrl = pInfo.pageUrl;
                                let imgUrl = pInfo.srcUrl;
                                let selection = pInfo.selectionText;

                                return linkUrl || imgUrl || selection || pageUrl;
                            }).toString() + ')(' + JSON.stringify(info) + ')',
                            allFrames: false
                        }, function (txt) {
                            chrome.DynamicToolRunner({
                                withContent: txt[0],
                                query: `tool=${tool}`
                            });
                        });
                    };
                    break;


                case 'qr-code':
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.tabs.executeScript(tab.id, {
                            code: '(' + (function (pInfo) {
                                let linkUrl = pInfo.linkUrl;
                                let pageUrl = pInfo.pageUrl;
                                let imgUrl = pInfo.srcUrl;
                                let selection = pInfo.selectionText;

                                return linkUrl || imgUrl || selection || pageUrl;
                            }).toString() + ')(' + JSON.stringify(info) + ')',
                            allFrames: false
                        }, function (txt) {
                            chrome.DynamicToolRunner({
                                withContent: txt[0],
                                query: `tool=qr-code`
                            });
                        });
                    };
                    toolMap[tool].menuConfig[1].onClick = function (info, tab) {

                        // V2020.2.618之前的版本都用这个方法
                        let funForLowerVer = function () {
                            chrome.tabs.executeScript(tab.id, {
                                code: '(' + (function (pInfo) {
                                    function loadImage(src) {
                                        return new Promise(resolve => {
                                            let image = new Image();
                                            image.setAttribute('crossOrigin', 'Anonymous');
                                            image.src = src;
                                            image.onload = function () {
                                                let width = this.naturalWidth;
                                                let height = this.naturalHeight;
                                                let canvas = document.createElement('canvas');
                                                canvas.style.cssText = 'position:absolute;top:-10000px;left:-10000px';
                                                document.body.appendChild(canvas);
                                                canvas.setAttribute('id', 'qr-canvas');
                                                canvas.height = height + 100;
                                                canvas.width = width + 100;
                                                let context = canvas.getContext('2d');
                                                context.fillStyle = 'rgb(255,255,255)';
                                                context.fillRect(0, 0, canvas.width, canvas.height);
                                                context.drawImage(image, 0, 0, width, height, 50, 50, width, height);
                                                resolve(canvas.toDataURL());
                                            };
                                            image.onerror = function () {
                                                resolve(src);
                                            };
                                        });
                                    }

                                    let tempDataUrl = '__TEMP_DATA_URL_FOR_QRDECODE_';
                                    loadImage(pInfo.srcUrl).then(dataUrl => {
                                        window[tempDataUrl] = dataUrl;
                                    });

                                    return tempDataUrl;

                                }).toString() + ')(' + JSON.stringify(info) + ')',
                                allFrames: false
                            }, function (resp) {
                                let tempDataUrl = resp[0];
                                let intervalId = -1;
                                let repeatTime = 0;
                                let loop = function () {
                                    repeatTime++;
                                    intervalId = setInterval(function () {
                                        chrome.tabs.executeScript(tab.id, {
                                            code: '(' + (function (tempDataUrl) {
                                                return window[tempDataUrl];
                                            }).toString() + ')(' + JSON.stringify(tempDataUrl) + ')',
                                            allFrames: false
                                        }, function (arr) {
                                            if (arr[0] === null && repeatTime <= 10) {
                                                loop();
                                            } else {
                                                clearInterval(intervalId);
                                                chrome.DynamicToolRunner({
                                                    withContent: arr[0] || info.srcUrl,
                                                    query: `tool=qr-code&mode=decode`
                                                });
                                            }
                                        });
                                    }, 200);
                                };
                                loop();
                            });
                        };

                        chrome.tabs.executeScript(tab.id, {
                            code: '(' + (function (pInfo) {
                                try {
                                    if (typeof window.qrcodeContentScript === 'function') {
                                        let qrcode = window.qrcodeContentScript();
                                        if (typeof qrcode.decode === 'function') {
                                            // 直接解码
                                            qrcode.decode(pInfo.srcUrl);
                                            return 1;
                                        }
                                    }
                                } catch (e) {
                                    return 0;
                                }
                                return 0;
                            }).toString() + ')(' + JSON.stringify(info) + ')',
                            allFrames: false
                        }, function (resp) {
                            (resp[0] === 0) && funForLowerVer();
                        });

                    };
                    break;

                default:
                    toolMap[tool].menuConfig[0].onClick = function (info, tab) {
                        chrome.DynamicToolRunner({
                            withContent: tool === 'image-base64' ? info.srcUrl : '',
                            query: `tool=${tool}`
                        });
                    };
                    break;
            }
        });

        // Merge本地存储的工具（远程获取而来的）
        try {
            let jsText = CodeCacheMgr.get();
            jsText && window.evalCore.getEvalInstance(window)(jsText);
            Object.keys(RemoteAwesome.newTools).forEach(tool => {
                if (!toolMap[tool]) {
                    toolMap[tool] = RemoteAwesome.newTools[tool];
                } else {
                    toolMap[tool].name = RemoteAwesome.newTools[tool].name || toolMap[tool].name;
                    toolMap[tool].tips = RemoteAwesome.newTools[tool].tips || toolMap[tool].tips;
                    toolMap[tool].menuConfig = RemoteAwesome.newTools[tool].menuConfig || toolMap[tool].menuConfig;
                    if (RemoteAwesome.newTools[tool].contentScript !== undefined) {
                        toolMap[tool].contentScript = RemoteAwesome.newTools[tool].contentScript;
                    }
                    if (RemoteAwesome.newTools[tool].contentScriptCss !== undefined) {
                        toolMap[tool].contentScriptCss = RemoteAwesome.newTools[tool].contentScriptCss;
                    }
                    if (RemoteAwesome.newTools[tool].offloadForbid !== undefined) {
                        toolMap[tool].offloadForbid = RemoteAwesome.newTools[tool].offloadForbid;
                    }
                }
            });

            // 下面是需要下架掉的旧工具
            RemoteAwesome.removedTools.forEach(tool => {
                delete toolMap[tool];
            });
        } catch (e) {
        }

        // 获取本地开发的插件，也拼接进来
        // TODO ..
        // try {
        //     const DEV_TOOLS_MY_TOOLS = 'DEV-TOOLS:MY-TOOLS';
        //     let _tools = await StorageMgr.getSync(DEV_TOOLS_MY_TOOLS);
        //     let localDevTools = JSON.parse(_tools || '{}', (key, val) => {
        //         return String(val).indexOf('function') > -1 ? new Function(`return ${val}`)() : val;
        //     });
        //     Object.keys(localDevTools).forEach(tool => {
        //         toolMap[tool] = localDevTools[tool];
        //     });
        // } catch (e) {
        // }

        if (declareOnly) {
            return toolMap;
        } else {
            let tools = Object.keys(toolMap);
            let promises = [];
            tools.forEach(tool => {
                promises = promises.concat([detectInstall(tool), detectInstall(tool, true)])
            });
            return Promise.all(promises).then(values => {
                values.forEach((v, i) => {
                    let tool = tools[Math.floor(i / 2)];
                    let key = i % 2 === 0 ? 'installed' : 'menu';
                    toolMap[tool][key] = v;
                    // 本地工具，还需要看是否处于开启状态
                    if (toolMap[tool].hasOwnProperty('_devTool')) {
                        toolMap[tool][key] = toolMap[tool][key] && toolMap[tool]._enable;
                    }
                });
                let sortArr = SortToolMgr.get();
                if (sortArr && sortArr.length) {
                    let map = {};
                    sortArr.forEach(tool => {
                        map[tool] = toolMap[tool];
                    });
                    Object.keys(toolMap).forEach(tool => {
                        if (!map[tool]) {
                            map[tool] = toolMap[tool];
                        }
                    });
                    return map;
                }
                return toolMap;
            });
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
        SortToolMgr,
        CodeCacheMgr
    }
})();

export default Awesome;
