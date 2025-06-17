/**
 * 日期格式化
 * @param {Object} pattern
 */
Date.prototype.format = function (pattern) {
    let pad = function (source, length) {
        let pre = "",
            negative = (source < 0),
            string = String(Math.abs(source));

        if (string.length < length) {
            pre = (new Array(length - string.length + 1)).join('0');
        }

        return (negative ? "-" : "") + pre + string;
    };

    if ('string' !== typeof pattern) {
        return this.toString();
    }

    let replacer = function (patternPart, result) {
        pattern = pattern.replace(patternPart, result);
    };

    let year = this.getFullYear(),
        month = this.getMonth() + 1,
        date2 = this.getDate(),
        hours = this.getHours(),
        minutes = this.getMinutes(),
        seconds = this.getSeconds(),
        milliSec = this.getMilliseconds();

    replacer(/yyyy/g, pad(year, 4));
    replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
    replacer(/MM/g, pad(month, 2));
    replacer(/M/g, month);
    replacer(/dd/g, pad(date2, 2));
    replacer(/d/g, date2);

    replacer(/HH/g, pad(hours, 2));
    replacer(/H/g, hours);
    replacer(/hh/g, pad(hours % 12, 2));
    replacer(/h/g, hours % 12);
    replacer(/mm/g, pad(minutes, 2));
    replacer(/m/g, minutes);
    replacer(/ss/g, pad(seconds, 2));
    replacer(/s/g, seconds);
    replacer(/SSS/g, pad(milliSec, 3));
    replacer(/S/g, milliSec);

    return pattern;
};

/**
 * 自动消失的Alert弹窗
 * @param content
 */
window.toast = function (content) {
    window.clearTimeout(window.feHelperAlertMsgTid);
    let elAlertMsg = document.querySelector("#fehelper_alertmsg");
    if (!elAlertMsg) {
        let elWrapper = document.createElement('div');
        elWrapper.innerHTML = '<div id="fehelper_alertmsg" style="position:fixed;bottom:25px;left:5px;z-index:1000000">' +
            '<p style="background:#000;display:inline-block;color:#fff;text-align:center;' +
            'padding:10px 10px;margin:0 auto;font-size:14px;border-radius:4px;">' + content + '</p></div>';
        elAlertMsg = elWrapper.childNodes[0];
        document.body.appendChild(elAlertMsg);
    } else {
        elAlertMsg.querySelector('p').innerHTML = content;
        elAlertMsg.style.display = 'block';
    }

    window.feHelperAlertMsgTid = window.setTimeout(function () {
        elAlertMsg.style.display = 'none';
    }, 1000);
};


/**
 * FeHelper Json Format Lib，入口文件
 * @example
 *  Formatter.format(jsonString)
 */
window.Formatter = (function () {

    "use strict";

    let jfContent,
        jfPre,
        jfStyleEl,
        jfStatusBar,
        formattingMsg;

    let lastItemIdGiven = 0;
    let cachedJsonString = '';
    
    // 单例Worker实例
    let workerInstance = null;

    let _initElements = function () {

        jfContent = $('#jfContent');
        if (!jfContent[0]) {
            jfContent = $('<div id="jfContent" />').appendTo('body');
        }

        jfPre = $('#jfContent_pre');
        if (!jfPre[0]) {
            jfPre = $('<pre id="jfContent_pre" />').appendTo('body');
        }

        jfStyleEl = $('#jfStyleEl');
        if (!jfStyleEl[0]) {
            jfStyleEl = $('<style id="jfStyleEl" />').appendTo('head');
        }

        formattingMsg = $('#formattingMsg');
        if (!formattingMsg[0]) {
            formattingMsg = $('<div id="formattingMsg"><span class="x-loading"></span>格式化中...</div>').appendTo('body');
        }

        try {
            jfContent.html('').show();
            jfPre.html('').hide();
            jfStatusBar && jfStatusBar.hide();
            formattingMsg.hide();
        } catch (e) {
        }
    };

    /**
     * HTML特殊字符格式化
     * @param str
     * @returns {*}
     */
    let htmlspecialchars = function (str) {
        str = str.replace(/&/g, '&amp;');
        str = str.replace(/</g, '&lt;');
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/"/g, '&quot;');
        str = str.replace(/'/g, '&#039;');
        str = str.replace(/\\/g, '&#92;');
        return str;
    };

    /**
     * 直接下载，能解决中文乱码
     * @param content
     * @private
     */
    let _downloadSupport = function (content) {

        // 下载链接
        let dt = (new Date()).format('yyyyMMddHHmmss');
        let blob = new Blob([content], {type: 'application/octet-stream'});

        let button = $('<button class="xjf-btn xjf-btn-right">下载JSON</button>').appendTo('#optionBar');

        if (typeof chrome === 'undefined' || !chrome.permissions) {
            button.click(function (e) {
                let aLink = $('#aLinkDownload');
                if (!aLink[0]) {
                    aLink = $('<a id="aLinkDownload" target="_blank" title="保存到本地">下载JSON数据</a>').appendTo('body');
                    aLink.attr('download', 'FeHelper-' + dt + '.json');
                    aLink.attr('href', URL.createObjectURL(blob));
                }
                aLink[0].click();
            });
        } else {
            button.click(function (e) {
                // 请求权限
                chrome.permissions.request({
                    permissions: ['downloads']
                }, (granted) => {
                    if (granted) {
                        chrome.downloads.download({
                            url: URL.createObjectURL(blob),
                            saveAs: true,
                            conflictAction: 'overwrite',
                            filename: 'FeHelper-' + dt + '.json'
                        });
                    } else {
                        toast('必须接受授权，才能正常下载！');
                    }
                });
            });
        }

    };


    /**
     * chrome 下复制到剪贴板
     * @param text
     */
    let _copyToClipboard = function (text) {
        let input = document.createElement('textarea');
        input.style.position = 'fixed';
        input.style.opacity = 0;
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('Copy');
        document.body.removeChild(input);

        toast('Json片段复制成功，随处粘贴可用！')
    };


    /**
     * 从el中获取json文本
     * @param el
     * @returns {string}
     */
    let getJsonText = function (el) {

        let txt = el.text().replace(/复制\|下载\|删除/gm,'').replace(/":\s/gm, '":').replace(/,$/, '').trim();
        if (!(/^{/.test(txt) && /\}$/.test(txt)) && !(/^\[/.test(txt) && /\]$/.test(txt))) {
            txt = '{' + txt + '}';
        }
        try {
            txt = JSON.stringify(JSON.parse(txt), null, 4);
        } catch (err) {
        }

        return txt;
    };

    // 添加json路径
    let _showJsonPath = function (curEl) {
        let keys = [];
        do {
            if (curEl.hasClass('item-block')) {
                if (!curEl.hasClass('rootItem')) {
                    keys.unshift('[' + curEl.prevAll('.item').length + ']');
                } else {
                    break;
                }
            } else {
                keys.unshift(curEl.find('>.key').text());
            }

            if (curEl.parent().hasClass('rootItem') || curEl.parent().parent().hasClass('rootItem')) {
                break;
            }

            curEl = curEl.parent().parent();

        } while (curEl.length && !curEl.hasClass('rootItem'));

        // 过滤掉空值和无效的key，避免产生多余的点号
        let validKeys = keys.filter(key => key && key.trim() !== '');
        
        // 构建路径：正确处理对象属性和数组索引的连接
        let path = '';
        for (let i = 0; i < validKeys.length; i++) {
            let key = validKeys[i];
            if (key.startsWith('[') && key.endsWith(']')) {
                // 数组索引，直接拼接（前面永远不需要点号）
                path += key;
            } else {
                // 对象属性
                if (i > 0) {
                    // 对象属性前面需要点号（数组索引后面的属性也需要点号）
                    path += '.';
                }
                path += key;
            }
        }

        let jfPath = $('#jsonPath');
        if (!jfPath.length) {
            jfPath = $('<span id="jsonPath"/>').prependTo(jfStatusBar);
        }
        jfPath.html('当前节点：$.' + path);
    };

    // 给某个节点增加操作项
    let _addOptForItem = function (el, show) {

        // 下载json片段
        let fnDownload = function (event) {
            event.stopPropagation();

            let txt = getJsonText(el);
            // 下载片段
            let dt = (new Date()).format('yyyyMMddHHmmss');
            let blob = new Blob([txt], {type: 'application/octet-stream'});

            if (typeof chrome === 'undefined' || !chrome.permissions) {
                // 下载JSON的简单形式
                $(this).attr('download', 'FeHelper-' + dt + '.json').attr('href', URL.createObjectURL(blob));
            } else {
                // 请求权限
                chrome.permissions.request({
                    permissions: ['downloads']
                }, (granted) => {
                    if (granted) {
                        chrome.downloads.download({
                            url: URL.createObjectURL(blob),
                            saveAs: true,
                            conflictAction: 'overwrite',
                            filename: 'FeHelper-' + dt + '.json'
                        });
                    } else {
                        toast('必须接受授权，才能正常下载！');
                    }
                });
            }

        };

        // 复制json片段
        let fnCopy = function (event) {
            event.stopPropagation();
            _copyToClipboard(getJsonText(el));
        };

        // 删除json片段
        let fnDel = function (event) {
            event.stopPropagation();
            if (el.parent().is('#formattedJson')) {
                toast('如果连最外层的Json也删掉的话，就没啥意义了哦！');
                return false;
            }
            toast('节点已删除成功！');
            el.remove();
            jfStatusBar && jfStatusBar.hide();
        };

        $('.boxOpt').hide();
        if (show) {
            let jfOptEl = el.children('.boxOpt');
            if (!jfOptEl.length) {
                jfOptEl = $('<b class="boxOpt">' +
                    '<a class="opt-copy" title="复制当前选中节点的JSON数据">复制</a>|' +
                    '<a class="opt-download" target="_blank" title="下载当前选中节点的JSON数据">下载</a>|' +
                    '<a class="opt-del" title="删除当前选中节点的JSON数据">删除</a></b>').appendTo(el);
            } else {
                jfOptEl.show();
            }

            jfOptEl.find('a.opt-download').unbind('click').bind('click', fnDownload);
            jfOptEl.find('a.opt-copy').unbind('click').bind('click', fnCopy);
            jfOptEl.find('a.opt-del').unbind('click').bind('click', fnDel);
        }

    };

    // 显示当前节点的Key
    let _toogleStatusBar = function (curEl, show) {
        if (!jfStatusBar) {
            jfStatusBar = $('<div id="statusBar"/>').appendTo('body');
        }

        if (!show) {
            jfStatusBar.hide();
            return;
        } else {
            jfStatusBar.show();
        }

        _showJsonPath(curEl);
    };


    /**
     * 折叠所有
     * @param elements
     */
    function collapse(elements) {
        let el;

        $.each(elements, function (i) {
            el = $(this);
            if (el.children('.kv-list').length) {
                el.addClass('collapsed');

                if (!el.attr('id')) {
                    el.attr('id', 'item' + (++lastItemIdGiven));

                    let count = el.children('.kv-list').eq(0).children().length;
                    // Generate comment text eg "4 items"
                    let comment = count + (count === 1 ? ' item' : ' items');
                    // Add CSS that targets it
                    jfStyleEl[0].insertAdjacentHTML(
                        'beforeend',
                        '\n#item' + lastItemIdGiven + '.collapsed:after{color: #aaa; content:" // ' + comment + '"}'
                    );
                }

            }
        });
    }

    /**
     * 创建几个全局操作的按钮，置于页面右上角即可
     * @private
     */
    let _buildOptionBar = function () {

        let optionBar = $('#optionBar');
        if (optionBar.length) {
            optionBar.html('');
        } else {
            optionBar = $('<span id="optionBar" />').appendTo(jfContent.parent());
        }

        $('<span class="x-split">|</span>').appendTo(optionBar);
        let buttonFormatted = $('<button class="xjf-btn xjf-btn-left">元数据</button>').appendTo(optionBar);
        let buttonCollapseAll = $('<button class="xjf-btn xjf-btn-mid">折叠所有</button>').appendTo(optionBar);
        let plainOn = false;

        buttonFormatted.bind('click', function (e) {
            if (plainOn) {
                plainOn = false;
                jfPre.hide();
                jfContent.show();
                buttonFormatted.text('元数据');
            } else {
                plainOn = true;
                jfPre.show();
                jfContent.hide();
                buttonFormatted.text('格式化');
            }

            jfStatusBar && jfStatusBar.hide();
        });

        buttonCollapseAll.bind('click', function (e) {
            // 如果内容还没有格式化过，需要再格式化一下
            if (plainOn) {
                buttonFormatted.trigger('click');
            }

            if (buttonCollapseAll.text() === '折叠所有') {
                buttonCollapseAll.text('展开所有');
                collapse($('.item-object,.item-block'));
            } else {
                buttonCollapseAll.text('折叠所有');
                $('.item-object,.item-block').removeClass('collapsed');
            }
            jfStatusBar && jfStatusBar.hide();
        });

    };

    // 附加操作
    let _addEvents = function () {

        // 折叠、展开
        $('#jfContent span.expand').bind('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();

            let parentEl = $(this).parent();
            parentEl.toggleClass('collapsed');

            if (parentEl.hasClass('collapsed')) {
                collapse(parentEl);
            }
        });

        // 点击选中：高亮
        $('#jfContent .item').bind('click', function (e) {

            let el = $(this);

            if (el.hasClass('x-selected')) {
                _toogleStatusBar(el, false);
                _addOptForItem(el, false);
                el.removeClass('x-selected');
                e.stopPropagation();
                return true;
            }

            $('.x-selected').removeClass('x-selected');
            el.addClass('x-selected');

            // 显示底部状态栏
            _toogleStatusBar(el, true);
            _addOptForItem(el, true);

            if (!$(e.target).is('.item .expand')) {
                e.stopPropagation();
            } else {
                $(e.target).parent().trigger('click');
            }

            // 触发钩子
            if (typeof window._OnJsonItemClickByFH === 'function') {
                window._OnJsonItemClickByFH(getJsonText(el));
            }
        });

        // 行悬停效果：只高亮当前直接悬停的item，避免嵌套冒泡
        let currentHoverElement = null;
        
        $('#jfContent .item').bind('mouseenter', function (e) {
            // 只处理视觉效果，不触发任何其他逻辑
            
            // 清除之前的悬停样式
            if (currentHoverElement) {
                currentHoverElement.removeClass('fh-hover');
            }
            
            // 添加当前悬停样式
            let el = $(this);
            el.addClass('fh-hover');
            currentHoverElement = el;
            
            // 严格阻止事件冒泡和默认行为
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
        });
        
        $('#jfContent .item').bind('mouseleave', function (e) {
            // 只处理视觉效果，不触发任何其他逻辑
            let el = $(this);
            el.removeClass('fh-hover');
            
            // 如果当前移除的元素是记录的悬停元素，清空记录
            if (currentHoverElement && currentHoverElement[0] === el[0]) {
                currentHoverElement = null;
            }
            
            // 严格阻止事件冒泡和默认行为
            e.stopPropagation();
            e.stopImmediatePropagation();
        });
        
        // 为整个jfContent区域添加鼠标离开事件，确保彻底清除悬停样式
        $('#jfContent').bind('mouseleave', function (e) {
            if (currentHoverElement) {
                currentHoverElement.removeClass('fh-hover');
                currentHoverElement = null;
            }
        });

    };
    
    /**
     * 初始化或获取Worker实例（异步，兼容Chrome/Edge/Firefox）
     * @returns {Promise<Worker|null>}
     */
    let _getWorkerInstance = async function() {
        if (workerInstance) {
            return workerInstance;
        }
        let workerUrl = chrome.runtime.getURL('json-format/json-worker.js');
        // 判断是否为Firefox
        const isFirefox = typeof InstallTrigger !== 'undefined' || navigator.userAgent.includes('Firefox');
        try {
            if (isFirefox) {
                workerInstance = new Worker(workerUrl);
                return workerInstance;
            } else {
                // Chrome/Edge用fetch+Blob方式
                const resp = await fetch(workerUrl);
                const workerScript = await resp.text();
                const blob = new Blob([workerScript], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                workerInstance = new Worker(blobUrl);
                return workerInstance;
            }
        } catch (e) {
            console.error('创建Worker失败:', e);
            workerInstance = null;
            return null;
        }
    };

    /**
     * 执行代码格式化
     * 支持异步worker
     */
    let format = async function (jsonStr, skin) {
        cachedJsonString = JSON.stringify(JSON.parse(jsonStr), null, 4);

        _initElements();
        jfPre.html(htmlspecialchars(cachedJsonString));

        try {
            // 获取Worker实例（异步）
            let worker = await _getWorkerInstance();
            if (worker) {
                // 设置消息处理程序
                worker.onmessage = function (evt) {
                    let msg = evt.data;
                    switch (msg[0]) {
                        case 'FORMATTING':
                            formattingMsg.show();
                            break;
                        case 'FORMATTED':
                            formattingMsg.hide();
                            jfContent.html(msg[1]);
                            _buildOptionBar();
                            // 事件绑定
                            _addEvents();
                            // 支持文件下载
                            _downloadSupport(cachedJsonString);
                            break;
                    }
                };
                // 发送格式化请求
                worker.postMessage({
                    jsonString: jsonStr,
                    skin: skin
                });
            } else {
                // Worker创建失败，回退到同步方式
                formatSync(jsonStr, skin);
            }
        } catch (e) {
            console.error('Worker处理失败:', e);
            // 出现任何错误，回退到同步方式
            formatSync(jsonStr, skin);
        }
    };

    // 同步的方式格式化
    let formatSync = function (jsonStr, skin) {
        cachedJsonString = JSON.stringify(JSON.parse(jsonStr), null, 4);

        _initElements();
        jfPre.html(htmlspecialchars(cachedJsonString));
        
        // 显示格式化进度
        formattingMsg.show();
        
        try {
            // 回退方案：使用简单模式直接显示格式化的JSON
            let formattedJson = JSON.stringify(JSON.parse(jsonStr), null, 4);
            jfContent.html(`<div id="formattedJson"><pre class="rootItem">${htmlspecialchars(formattedJson)}</pre></div>`);
            
            // 隐藏进度提示
            formattingMsg.hide();
            
            // 构建操作栏
            _buildOptionBar();
            // 事件绑定
            _addEvents();
            // 支持文件下载
            _downloadSupport(cachedJsonString);
            
            return;
        } catch (e) {
            jfContent.html(`<div class="error">JSON格式化失败: ${e.message}</div>`);
            
            // 隐藏进度提示
            formattingMsg.hide();
        }
    };

    return {
        format: format,
        formatSync: formatSync
    }
})();





