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

        let path = keys.join('#@#').replace(/#@#\[/g, '[').replace(/#@#/g, '.');

        let jfPath = $('#jsonPath');
        if (!jfPath.length) {
            jfPath = $('<span id="jsonPath"/>').prependTo(jfStatusBar);
        }
        jfPath.html('当前节点：JSON.' + path);
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

    };
    
    /**
     * 初始化或获取Worker实例
     * 使用单例模式确保只创建一个Worker
     */
    let _getWorkerInstance = function() {
        if (workerInstance) {
            return workerInstance;
        }
        
        try {
            // 创建内联Worker
            // 这个版本包含基本的JSON格式化功能
            let workerCode = `
                // 创建一个处理BigInt的JSON解析器
                const JSONBigInt = {
                    // 自定义的parse方法，处理大数字
                    parse: function(text) {
                        // 先尝试预处理字符串，将可能的大整数标记出来
                        // 以更精确的方式匹配JSON中的大整数
                        const preparedText = this._markBigInts(text);
                        
                        try {
                            // 使用标准JSON解析，同时使用reviver函数还原BigInt
                            return JSON.parse(preparedText, this._reviver);
                        } catch (e) {
                            // 如果处理失败，尝试原始解析方式
                            console.error('BigInt处理失败，回退到标准解析', e);
                            return JSON.parse(text);
                        }
                    },
                    
                    // 将JSON字符串中的大整数标记为特殊格式
                    _markBigInts: function(text) {
                        // 这个正则匹配JSON中的数字，但需要避免匹配到引号内的字符串
                        // 匹配模式: 找到数字前面是冒号或左方括号的情况（表示这是个值而不是键名）
                        return text.replace(
                            /([:,\\[]\\s*)(-?\\d{16,})([,\\]\\}])/g, 
                            function(match, prefix, number, suffix) {
                                // 将大数字转换为特殊格式的字符串
                                return prefix + '"__BigInt__' + number + '"' + suffix;
                            }
                        );
                    },
                    
                    // 恢复函数，将标记的BigInt字符串转回BigInt类型
                    _reviver: function(key, value) {
                        // 检查是否是我们标记的BigInt字符串
                        if (typeof value === 'string' && value.startsWith('__BigInt__')) {
                            // 提取数字部分
                            const numStr = value.substring(10);
                            try {
                                // 尝试转换为BigInt
                                return BigInt(numStr);
                            } catch (e) {
                                // 如果转换失败，保留原始字符串
                                console.warn('无法转换为BigInt:', numStr);
                                return numStr;
                            }
                        }
                        return value;
                    }
                };
                
                // 处理主线程消息
                self.onmessage = function(event) {
                    // 处理设置bigint路径的消息
                    if (event.data.type === 'SET_BIGINT_PATH') {
                        // 现在内部支持BigInt处理
                        return;
                    }
                    
                    // 格式化JSON
                    if (event.data.jsonString) {
                        // 发送格式化中的消息
                        self.postMessage(['FORMATTING']);
                        
                        try {
                            // 先预处理JSON字符串，防止大整数丢失精度
                            let jsonObj;
                            
                            try {
                                // 尝试使用自定义的BigInt解析器
                                jsonObj = JSONBigInt.parse(event.data.jsonString);
                            } catch (e) {
                                // 如果解析失败，回退到标准解析
                                console.error('BigInt解析失败，回退到标准解析', e);
                                jsonObj = JSON.parse(event.data.jsonString);
                            }
                            
                            // 如果是简单主题，直接返回格式化的JSON
                            if (event.data.skin && event.data.skin === 'theme-simple') {
                                // 处理BigInt特殊情况
                                let formatted = JSON.stringify(jsonObj, function(key, value) {
                                    if (typeof value === 'bigint') {
                                        // 移除n后缀，只显示数字本身
                                        return value.toString();
                                    }
                                    // 处理普通数字，避免科学计数法
                                    if (typeof value === 'number' && value.toString().includes('e')) {
                                        // 大数字转为字符串以避免科学计数法
                                        return value.toLocaleString('fullwide', {useGrouping: false});
                                    }
                                    return value;
                                }, 4);
                                
                                let html = '<div id="formattedJson"><pre class="rootItem">' + 
                                    formatted.replace(/&/g, '&amp;')
                                        .replace(/</g, '&lt;')
                                        .replace(/>/g, '&gt;')
                                        .replace(/"/g, '&quot;')
                                        .replace(/'/g, '&#039;') + 
                                    '</pre></div>';
                                
                                self.postMessage(['FORMATTED', html]);
                                return;
                            }
                            
                            // 默认主题 - 创建更丰富的HTML结构
                            let html = '<div id="formattedJson">' +
                                formatJsonToHtml(jsonObj) +
                                '</div>';
                            
                            self.postMessage(['FORMATTED', html]);
                        } catch (e) {
                            // 处理错误情况
                            self.postMessage(['FORMATTED', '<div id="formattedJson"><div class="error">格式化失败: ' + e.message + '</div></div>']);
                        }
                    }
                };
                
                // HTML特殊字符格式化
                function htmlspecialchars(str) {
                    str = str.replace(/&/g, '&amp;');
                    str = str.replace(/</g, '&lt;');
                    str = str.replace(/>/g, '&gt;');
                    str = str.replace(/"/g, '&quot;');
                    str = str.replace(/'/g, '&#039;');
                    return str;
                }
                
                // 格式化JSON为HTML
                function formatJsonToHtml(json) {
                    return createNode(json).getHTML();
                }
                
                // 创建节点
                function createNode(value) {
                    let node = {
                        type: getType(value),
                        value: value,
                        children: [],
                        
                        getHTML: function() {
                            switch(this.type) {
                                case 'string':
                                    return '<div class="item item-line"><span class="string">"' + 
                                        htmlspecialchars(this.value) + 
                                        '"</span></div>';
                                case 'number':
                                    // 确保大数字不使用科学计数法
                                    let numStr = typeof this.value === 'number' && this.value.toString().includes('e') 
                                        ? this.value.toLocaleString('fullwide', {useGrouping: false})
                                        : this.value;
                                    return '<div class="item item-line"><span class="number">' + 
                                        numStr + 
                                        '</span></div>';
                                case 'bigint':
                                    // 对BigInt类型特殊处理，只显示数字，不添加n后缀
                                    return '<div class="item item-line"><span class="number">' + 
                                        this.value.toString() + 
                                        '</span></div>';
                                case 'boolean':
                                    return '<div class="item item-line"><span class="bool">' + 
                                        this.value + 
                                        '</span></div>';
                                case 'null':
                                    return '<div class="item item-line"><span class="null">null</span></div>';
                                case 'object':
                                    return this.getObjectHTML();
                                case 'array':
                                    return this.getArrayHTML();
                                default:
                                    return '';
                            }
                        },
                        
                        getObjectHTML: function() {
                            if (!this.value || Object.keys(this.value).length === 0) {
                                return '<div class="item item-object"><span class="brace">{</span><span class="brace">}</span></div>';
                            }
                            
                            let html = '<div class="item item-object">' +
                                '<span class="expand"></span>' +
                                '<span class="brace">{</span>' +
                                '<span class="ellipsis"></span>' +
                                '<div class="kv-list">';
                                
                            let keys = Object.keys(this.value);
                            keys.forEach((key, index) => {
                                let prop = this.value[key];
                                let childNode = createNode(prop);
                                
                                html += '<div class="item">' + 
                                    '<span class="quote">"</span>' +
                                    '<span class="key">' + htmlspecialchars(key) + '</span>' +
                                    '<span class="quote">"</span>' +
                                    '<span class="colon">: </span>';
                                
                                // 添加值
                                if (childNode.type === 'object' || childNode.type === 'array') {
                                    html += childNode.getHTML();
                                } else {
                                    html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\\/div>$/, '');
                                }
                                
                                // 如果不是最后一个属性，添加逗号
                                if (index < keys.length - 1) {
                                    html += '<span class="comma">,</span>';
                                }
                                
                                html += '</div>';
                            });
                            
                            html += '</div><span class="brace">}</span></div>';
                            return html;
                        },
                        
                        getArrayHTML: function() {
                            if (!this.value || this.value.length === 0) {
                                return '<div class="item item-array"><span class="brace">[</span><span class="brace">]</span></div>';
                            }
                            
                            let html = '<div class="item item-array">' +
                                '<span class="expand"></span>' +
                                '<span class="brace">[</span>' +
                                '<span class="ellipsis"></span>' +
                                '<div class="kv-list">';
                                
                            this.value.forEach((item, index) => {
                                let childNode = createNode(item);
                                
                                html += '<div class="item item-block">';
                                
                                // 添加值
                                if (childNode.type === 'object' || childNode.type === 'array') {
                                    html += childNode.getHTML();
                                } else {
                                    html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\\/div>$/, '');
                                }
                                
                                // 如果不是最后一个元素，添加逗号
                                if (index < this.value.length - 1) {
                                    html += '<span class="comma">,</span>';
                                }
                                
                                html += '</div>';
                            });
                            
                            html += '</div><span class="brace">]</span></div>';
                            return html;
                        }
                    };
                    
                    return node;
                }
                
                // 获取值类型
                function getType(value) {
                    if (value === null) return 'null';
                    if (value === undefined) return 'undefined';
                    
                    let type = typeof value;
                    // 特别处理BigInt类型
                    if (type === 'bigint') return 'bigint';
                    if (type === 'object') {
                        if (Array.isArray(value)) return 'array';
                    }
                    return type;
                }
            `;
            
            // 创建Blob URL并实例化Worker
            let blob = new Blob([workerCode], {type: 'application/javascript'});
            let workerUrl = URL.createObjectURL(blob);
            
            workerInstance = new Worker(workerUrl);
            
            // 添加错误处理
            workerInstance.onerror = function(e) {
                // 如果Worker出错，清空实例允许下次重试
                workerInstance = null;
                
                // 避免URL内存泄漏
                URL.revokeObjectURL(workerUrl);
            };
            
            return workerInstance;
        } catch (e) {
            // 出现任何错误，返回null
            workerInstance = null;
            return null;
        }
    };

    /**
     * 执行代码格式化
     */
    let format = function (jsonStr, skin) {
        cachedJsonString = JSON.stringify(JSON.parse(jsonStr), null, 4);

        _initElements();
        jfPre.html(htmlspecialchars(cachedJsonString));

        // 获取Worker实例
        let worker = _getWorkerInstance();
        
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
            
            // 添加bigint.js的路径信息
            let bigintPath = '';
            if (chrome && chrome.runtime && chrome.runtime.getURL) {
                bigintPath = chrome.runtime.getURL('json-format/json-bigint.js');
            }
            
            // 第一条消息发送bigint.js的路径
            worker.postMessage({
                type: 'SET_BIGINT_PATH',
                path: bigintPath
            });
            
            // 发送格式化请求
            worker.postMessage({
                jsonString: jsonStr,
                skin: skin
            });
        } else {
            // Worker创建失败，回退到同步方式
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


