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

        // 检查是否在沙盒化iframe中
        function isSandboxed() {
            try {
                return window !== window.top || window.parent !== window;
            } catch (e) {
                return true;
            }
        }
        
        // 在沙盒模式下显示JSON内容
        function showJsonContentInSandbox() {
            // 查找 #formattedJson 节点
            let formattedJsonDiv = document.getElementById('formattedJson');
            if (!formattedJsonDiv) {
                console.error('未找到 #formattedJson 节点');
                return;
            }
            
            // 清空 #formattedJson 的内容
            formattedJsonDiv.innerHTML = '';
            
            // 创建下载提示和内容显示区域
            let downloadInfo = document.createElement('div');
            downloadInfo.style.cssText = `
                background: #e3f2fd;
                border: 1px solid #2196f3;
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 15px;
                font-family: Arial, sans-serif;
            `;
            downloadInfo.innerHTML = `
                <div style="color: #1976d2; font-weight: bold; margin-bottom: 8px;">📋 沙盒模式 - JSON内容</div>
                <div style="color: #666; font-size: 14px; margin-bottom: 10px;">由于浏览器安全限制，无法直接下载。请复制以下内容并保存为 .json 文件：</div>
                <button onclick="
                    let textarea = this.parentElement.nextElementSibling;
                    textarea.select();
                    document.execCommand('copy');
                    alert('已复制到剪贴板！');
                " style="
                    background: #2196f3;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">复制全部内容</button>
            `;
            
            // 创建文本区域
            let textarea = document.createElement('textarea');
            textarea.style.cssText = `
                width: 100%;
                height: 300px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 4px;
                resize: vertical;
                box-sizing: border-box;
                background: #f8f9fa;
            `;
            textarea.value = content;
            textarea.readOnly = true;
            
            // 将内容添加到 #formattedJson 节点
            formattedJsonDiv.appendChild(downloadInfo);
            formattedJsonDiv.appendChild(textarea);
            
            console.log('JSON内容已显示在 #formattedJson 节点中');
        }
        
        // 显示JSON内容模态框（非沙盒模式）
        function showJsonContent() {
            let modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 90%;
                    max-height: 90%;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    position: relative;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">JSON内容</h3>
                    <p style="color: #666; font-size: 14px; margin: 0 0 15px 0;">请复制以下内容并保存为 .json 文件：</p>
                    <textarea readonly style="
                        width: 100%;
                        height: 400px;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        border: 1px solid #ddd;
                        padding: 15px;
                        border-radius: 4px;
                        resize: vertical;
                        box-sizing: border-box;
                    ">${content}</textarea>
                    <div style="margin-top: 15px; text-align: right;">
                        <button onclick="this.closest('div').parentElement.remove()" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 10px;
                            font-size: 14px;
                        ">关闭</button>
                        <button onclick="
                            this.previousElementSibling.previousElementSibling.select();
                            document.execCommand('copy');
                            alert('已复制到剪贴板！');
                        " style="
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                        ">复制全部</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 点击背景关闭
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
        
        // 尝试下载
        function tryDownload() {
            try {
                let aLink = document.createElement('a');
                aLink.download = 'FeHelper-' + dt + '.json';
                aLink.href = URL.createObjectURL(blob);
                aLink.style.display = 'none';
                
                document.body.appendChild(aLink);
                aLink.click();
                
                setTimeout(() => {
                    if (document.body.contains(aLink)) {
                        document.body.removeChild(aLink);
                    }
                    URL.revokeObjectURL(aLink.href);
                }, 100);
                
                return true;
            } catch (error) {
                console.error('下载失败:', error);
                return false;
            }
        }
        
        // 下载按钮点击事件
        button.click(function (e) {
            e.preventDefault();
            
            // 如果在沙盒化环境中，在 #formattedJson 中显示内容
            if (isSandboxed()) {
                console.log('检测到沙盒化环境，在 #formattedJson 中显示内容');
                showJsonContentInSandbox();
                return;
            }
            
            // 尝试Chrome扩展API
            if (typeof chrome !== 'undefined' && chrome.downloads) {
                try {
                    chrome.downloads.download({
                        url: URL.createObjectURL(blob),
                        saveAs: true,
                        conflictAction: 'overwrite',
                        filename: 'FeHelper-' + dt + '.json'
                    }, (downloadId) => {
                        if (chrome.runtime.lastError) {
                            console.error('Chrome下载失败:', chrome.runtime.lastError);
                            showJsonContent();
                        } else {
                            console.log('Chrome下载成功，ID:', downloadId);
                        }
                    });
                } catch (error) {
                    console.error('Chrome下载API调用失败:', error);
                    showJsonContent();
                }
            } else {
                // 尝试标准下载
                if (!tryDownload()) {
                    showJsonContent();
                }
            }
        });

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
        let current = curEl;
        
        // 处理当前节点
        if (current.hasClass('item') && !current.hasClass('rootItem')) {
            if (current.hasClass('item-array-element')) {
                // 这是数组元素，使用data-array-index属性
                let index = current.attr('data-array-index');
                if (index !== undefined) {
                    keys.unshift('[' + index + ']');
                }
            } else {
                // 这是对象属性，获取key
                let keyText = current.find('>.key').text();
                if (keyText) {
                    keys.unshift(keyText);
                }
            }
        }
        
        // 向上遍历所有祖先节点
        current.parents('.item').each(function() {
            let $this = $(this);
            
            // 跳过根节点
            if ($this.hasClass('rootItem')) {
                return false; // 终止遍历
            }
            
            if ($this.hasClass('item-array-element')) {
                // 这是数组元素，使用data-array-index属性
                let index = $this.attr('data-array-index');
                if (index !== undefined) {
                    keys.unshift('[' + index + ']');
                }
            } else if ($this.hasClass('item-object') || $this.hasClass('item-array')) {
                // 这是容器节点，寻找它的key
                let $container = $this.parent().parent(); // 跳过 .kv-list
                if ($container.length && !$container.hasClass('rootItem')) {
                    if ($container.hasClass('item-array-element')) {
                        // 容器本身是数组元素
                        let index = $container.attr('data-array-index');
                        if (index !== undefined) {
                            keys.unshift('[' + index + ']');
                        }
                    } else {
                        // 容器是对象属性
                        let keyText = $container.find('>.key').text();
                        if (keyText) {
                            keys.unshift(keyText);
                        }
                    }
                }
            } else {
                // 普通item节点，获取key
                let keyText = $this.find('>.key').text();
                if (keyText) {
                    keys.unshift(keyText);
                }
            }
        });

        // 过滤掉空值和无效的key
        let validKeys = keys.filter(key => key && key.trim() !== '');
        
        // 创建或获取语言选择器和路径显示区域
        let jfPathContainer = $('#jsonPathContainer');
        if (!jfPathContainer.length) {
            jfPathContainer = $('<div id="jsonPathContainer"/>').prependTo(jfStatusBar);
            
            // 创建语言选择下拉框
            let langSelector = $('<select id="jsonPathLangSelector" title="选择编程语言格式">' +
                '<option value="javascript">JavaScript</option>' +
                '<option value="php">PHP</option>' +
                '<option value="python">Python</option>' +
                '<option value="java">Java</option>' +
                '<option value="csharp">C#</option>' +
                '<option value="golang">Go</option>' +
                '<option value="ruby">Ruby</option>' +
                '<option value="swift">Swift</option>' +
                '</select>').appendTo(jfPathContainer);
            
            // 创建路径显示区域
            let jfPath = $('<span id="jsonPath"/>').appendTo(jfPathContainer);
            
            // 绑定语言切换事件
            langSelector.on('change', function() {
                // 保存选择的语言到本地存储（如果可用）
                try {
                    localStorage.setItem('fehelper_json_path_lang', $(this).val());
                } catch (e) {
                    // 在沙盒环境中忽略localStorage错误
                    console.warn('localStorage不可用，跳过保存语言选择');
                }
                // 从容器中获取当前保存的keys，而不是使用闭包中的validKeys
                let currentKeys = jfPathContainer.data('currentKeys') || [];
                _updateJsonPath(currentKeys, $(this).val());
            });
            
            // 从本地存储恢复语言选择（如果可用）
            let savedLang = 'javascript';
            try {
                savedLang = localStorage.getItem('fehelper_json_path_lang') || 'javascript';
            } catch (e) {
                // 在沙盒环境中使用默认值
                console.warn('localStorage不可用，使用默认语言选择');
            }
            langSelector.val(savedLang);
        }
        
        // 保存当前的keys到容器的data属性中，供语言切换时使用
        jfPathContainer.data('currentKeys', validKeys);
        
        // 获取当前选择的语言
        let selectedLang = $('#jsonPathLangSelector').val() || 'javascript';
        _updateJsonPath(validKeys, selectedLang);
    };

    // 根据不同编程语言格式化JSON路径
    let _updateJsonPath = function(keys, language) {
        let path = _formatJsonPath(keys, language);
        $('#jsonPath').html('当前节点：' + path);
    };

    // 格式化JSON路径为不同编程语言格式
    let _formatJsonPath = function(keys, language) {
        if (!keys.length) {
            return _getLanguageRoot(language);
        }

        let path = '';
        
        switch (language) {
            case 'javascript':
                path = '$';
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key.startsWith('[') && key.endsWith(']')) {
                        // 数组索引
                        path += key;
                    } else {
                        // 对象属性
                        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
                            // 有效的标识符，使用点语法
                            path += '.' + key;
                        } else {
                            // 包含特殊字符，使用方括号语法
                            path += '["' + key.replace(/"/g, '\\"') + '"]';
                        }
                    }
                }
                break;
                
            case 'php':
                path = '$data';
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key.startsWith('[') && key.endsWith(']')) {
                        // 数组索引
                        path += key;
                    } else {
                        // 对象属性
                        path += '["' + key.replace(/"/g, '\\"') + '"]';
                    }
                }
                break;
                
            case 'python':
                path = 'data';
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key.startsWith('[') && key.endsWith(']')) {
                        // 数组索引
                        path += key;
                    } else {
                        // 对象属性
                        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) && !/^(and|as|assert|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|not|or|pass|print|raise|return|try|while|with|yield)$/.test(key)) {
                            // 有效的标识符且不是关键字，可以使用点语法
                            path += '.' + key;
                        } else {
                            // 使用方括号语法
                            path += '["' + key.replace(/"/g, '\\"') + '"]';
                        }
                    }
                }
                break;
                
            case 'java':
                path = 'jsonObject';
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key.startsWith('[') && key.endsWith(']')) {
                        // 数组索引
                        let index = key.slice(1, -1);
                        path += '.get(' + index + ')';
                    } else {
                        // 对象属性
                        path += '.get("' + key.replace(/"/g, '\\"') + '")';
                    }
                }
                break;
                
            case 'csharp':
                path = 'jsonObject';
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key.startsWith('[') && key.endsWith(']')) {
                        // 数组索引
                        path += key;
                    } else {
                        // 对象属性
                        path += '["' + key.replace(/"/g, '\\"') + '"]';
                    }
                }
                break;
                
            case 'golang':
                path = 'data';
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key.startsWith('[') && key.endsWith(']')) {
                        // 数组索引
                        let index = key.slice(1, -1);
                        path += '.(' + index + ')';
                    } else {
                        // 对象属性
                        path += '["' + key.replace(/"/g, '\\"') + '"]';
                    }
                }
                break;
                
            case 'ruby':
                path = 'data';
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key.startsWith('[') && key.endsWith(']')) {
                        // 数组索引
                        path += key;
                    } else {
                        // 对象属性
                        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                            // 可以使用符号访问
                            path += '[:"' + key + '"]';
                        } else {
                            // 字符串键
                            path += '["' + key.replace(/"/g, '\\"') + '"]';
                        }
                    }
                }
                break;
                
            case 'swift':
                path = 'jsonObject';
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key.startsWith('[') && key.endsWith(']')) {
                        // 数组索引
                        path += key;
                    } else {
                        // 对象属性
                        path += '["' + key.replace(/"/g, '\\"') + '"]';
                    }
                }
                break;
                
            default:
                // 默认使用JavaScript格式
                return _formatJsonPath(keys, 'javascript');
        }
        
        return path;
    };

    // 获取不同语言的根对象表示
    let _getLanguageRoot = function(language) {
        switch (language) {
            case 'javascript': return '$';
            case 'php': return '$data';
            case 'python': return 'data';
            case 'java': return 'jsonObject';
            case 'csharp': return 'jsonObject';
            case 'golang': return 'data';
            case 'ruby': return 'data';
            case 'swift': return 'jsonObject';
            default: return '$';
        }
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
     * 递归折叠所有层级的对象和数组节点
     * @param elements
     */
    function collapse(elements) {
        elements.each(function () {
            var el = $(this);
            if (el.children('.kv-list').length) {
                el.addClass('collapsed');

                // 只给没有id的节点分配唯一id，并生成注释
                if (!el.attr('id')) {
                    el.attr('id', 'item' + (++lastItemIdGiven));
                    let count = el.children('.kv-list').eq(0).children().length;
                    let comment = count + (count === 1 ? ' item' : ' items');
                    jfStyleEl[0].insertAdjacentHTML(
                        'beforeend',
                        '\n#item' + lastItemIdGiven + '.collapsed:after{color: #aaa; content:" // ' + comment + '"}'
                    );
                }

                // 递归对子节点继续折叠，确保所有嵌套层级都被处理
                collapse(el.children('.kv-list').children('.item-object, .item-block'));
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
                // 递归折叠所有层级的对象和数组，确保所有内容都被折叠
                collapse($('#jfContent .item-object, #jfContent .item-block'));
            } else {
                buttonCollapseAll.text('折叠所有');
                // 展开所有内容
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

        // 图片预览功能：针对所有data-is-link=1的a标签
        let $imgPreview = null;
        // 加载缓存
        function getImgCache() {
            try {
                return JSON.parse(sessionStorage.getItem('fehelper-img-preview-cache') || '{}');
            } catch (e) { return {}; }
        }
        function setImgCache(url, isImg) {
            let cache = getImgCache();
            cache[url] = isImg;
            sessionStorage.setItem('fehelper-img-preview-cache', JSON.stringify(cache));
        }
        $('#jfContent').on('mouseenter', 'a[data-is-link="1"]', function(e) {
            const url = $(this).attr('data-link-url');
            if (!url) return;
            let cache = getImgCache();
            if (cache.hasOwnProperty(url)) {
                if (cache[url]) {
                    $imgPreview = getOrCreateImgPreview();
                    $imgPreview.find('img').attr('src', url);
                    $imgPreview.show();
                    $(document).on('mousemove.fhimg', function(ev) {
                        $imgPreview.css({
                            left: ev.pageX + 20 + 'px',
                            top: ev.pageY + 20 + 'px'
                        });
                    });
                    $imgPreview.css({
                        left: e.pageX + 20 + 'px',
                        top: e.pageY + 20 + 'px'
                    });
                }
                return;
            }
            // 创建图片对象尝试加载
            const img = new window.Image();
            img.src = url;
            img.onload = function() {
                setImgCache(url, true);
                $imgPreview = getOrCreateImgPreview();
                $imgPreview.find('img').attr('src', url);
                $imgPreview.show();
                $(document).on('mousemove.fhimg', function(ev) {
                    $imgPreview.css({
                        left: ev.pageX + 20 + 'px',
                        top: ev.pageY + 20 + 'px'
                    });
                });
                $imgPreview.css({
                    left: e.pageX + 20 + 'px',
                    top: e.pageY + 20 + 'px'
                });
            };
            img.onerror = function() {
                setImgCache(url, false);
            };
        }).on('mouseleave', 'a[data-is-link="1"]', function(e) {
            if ($imgPreview) $imgPreview.hide();
            $(document).off('mousemove.fhimg');
        });

        // 新增：全局监听，防止浮窗残留
        $(document).on('mousemove.fhimgcheck', function(ev) {
            let $target = $(ev.target).closest('a[data-is-link="1"]');
            if ($target.length === 0) {
                if ($imgPreview) $imgPreview.hide();
                $(document).off('mousemove.fhimg');
            }
        });

    };
    
    /**
     * 检测CSP限制
     * @returns {boolean}
     */
    let _checkCSPRestrictions = function() {
        // 检查是否在iframe中且被沙盒化
        if (window !== window.top) {
            try {
                // 尝试访问父窗口，如果被沙盒化会抛出异常
                window.parent.document;
            } catch (e) {
                console.warn('检测到沙盒化iframe，跳过Worker创建');
                return true;
            }
        }
        
        // 检查URL是否包含已知的CSP限制域名
        const currentUrl = window.location.href;
        const restrictedDomains = ['gitee.com', 'github.com', 'raw.githubusercontent.com'];
        
        for (let domain of restrictedDomains) {
            if (currentUrl.includes(domain)) {
                console.warn(`检测到受限域名 ${domain}，跳过Worker创建`);
                return true;
            }
        }
        
        return false;
    };

    /**
     * 初始化或获取Worker实例（异步，兼容Chrome/Edge/Firefox）
     * @returns {Promise<Worker|null>}
     */
    let _getWorkerInstance = async function() {
        if (workerInstance) {
            return workerInstance;
        }
        
        // 检查CSP限制
        if (_checkCSPRestrictions()) {
            console.log('由于CSP限制，跳过Worker创建，使用同步模式');
            return null;
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
        _initElements();

        try {
            // 先验证JSON是否有效（使用与worker一致的BigInt安全解析）
            let parsedJson = _parseWithBigInt(jsonStr);
            // 使用replacer保证bigint与大数字不丢精度
            cachedJsonString = JSON.stringify(parsedJson, function(key, value) {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                if (typeof value === 'number' && value.toString().includes('e')) {
                    return value.toLocaleString('fullwide', {useGrouping: false});
                }
                return value;
            }, 4);
            jfPre.html(htmlspecialchars(cachedJsonString));
        } catch (e) {
            console.error('JSON解析失败:', e);
            jfContent.html(`<div class="error">JSON解析失败: ${e.message}</div>`);
            return;
        }

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
        _initElements();
        
        // 显示格式化进度
        formattingMsg.show();
        
        try {
            // 先验证JSON是否有效（使用与worker一致的BigInt安全解析）
            let parsedJson = _parseWithBigInt(jsonStr);
            cachedJsonString = JSON.stringify(parsedJson, function(key, value) {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                if (typeof value === 'number' && value.toString().includes('e')) {
                    return value.toLocaleString('fullwide', {useGrouping: false});
                }
                return value;
            }, 4);
            
            // 设置原始JSON内容到jfPre（用于元数据按钮）
            jfPre.html(htmlspecialchars(cachedJsonString));
            
            // 使用完整的JSON美化功能
            let formattedHtml = formatJsonToHtml(parsedJson, skin);
            
            // 创建正确的HTML结构：jfContent > formattedJson
            let formattedJsonDiv = $('<div id="formattedJson"></div>');
            formattedJsonDiv.html(formattedHtml);
            jfContent.html(formattedJsonDiv);
            
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
            console.error('JSON格式化失败:', e);
            jfContent.html(`<div class="error">JSON格式化失败: ${e.message}</div>`);
            
            // 隐藏进度提示
            formattingMsg.hide();
        }
    };

    // 与 worker 保持一致的 BigInt 安全解析：
    // 1) 给可能的大整数加标记；2) 使用reviver还原为原生BigInt
    let _parseWithBigInt = function(text) {
        // 允许数字后存在可选空白，再跟 , ] }
        const marked = text.replace(/([:,\[]\s*)(-?\d{16,})(\s*)(?=(?:,|\]|\}))/g, function(match, prefix, number, spaces) {
            return prefix + '"__BigInt__' + number + '"' + spaces;
        });
        return JSON.parse(marked, function(key, value) {
            if (typeof value === 'string' && value.indexOf('__BigInt__') === 0) {
                try {
                    return BigInt(value.slice(10));
                } catch (e) {
                    return value.slice(10);
                }
            }
            return value;
        });
    };

    // 工具函数：获取或创建唯一图片预览浮窗节点
    function getOrCreateImgPreview() {
        let $img = $('#fh-img-preview');
        if (!$img.length) {
            $img = $('<div id="fh-img-preview" style="position:absolute;z-index:999999;border:1px solid #ccc;background:#fff;padding:4px;box-shadow:0 2px 8px #0002;pointer-events:none;"><img style="max-width:300px;max-height:200px;display:block;"></div>').appendTo('body');
        }
        return $img;
    }

    // 格式化JSON为HTML（同步版本）
    function formatJsonToHtml(json, skin) {
        return createNode(json).getHTML();
    }

    // 创建节点 - 直接复用webworker中的完整逻辑
    function createNode(value) {
        let node = {
            type: getType(value),
            value: value,
            children: [],
            
            getHTML: function() {
                switch(this.type) {
                    case 'string':
                        // 判断原始字符串是否为URL
                        if (isUrl(this.value)) {
                            // 用JSON.stringify保证转义符显示，内容包裹在<a>里
                            return '<div class="item item-line"><span class="string"><a href="'
                                + htmlspecialchars(this.value) + '" target="_blank" rel="noopener noreferrer" data-is-link="1" data-link-url="' + htmlspecialchars(this.value) + '">' 
                                + htmlspecialchars(JSON.stringify(this.value)) + '</a></span></div>';
                        } else {
                            return '<div class="item item-line"><span class="string">' + formatStringValue(JSON.stringify(this.value)) + '</span></div>';
                        }
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
                    // 判断子节点是否为对象或数组，决定是否加item-block
                    let itemClass = (childNode.type === 'object' || childNode.type === 'array') ? 'item item-block' : 'item';
                    html += '<div class="' + itemClass + '">';
                    // 如果值是对象或数组，在key前面添加展开按钮
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += '<span class="expand"></span>';
                    }
                    html += '<span class="quote">"</span>' +
                        '<span class="key">' + htmlspecialchars(key) + '</span>' +
                        '<span class="quote">"</span>' +
                        '<span class="colon">: </span>';
                    // 添加值
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += childNode.getInlineHTMLWithoutExpand();
                    } else {
                        html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
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
                    '<div class="kv-list item-array-container">';
                    
                this.value.forEach((item, index) => {
                    let childNode = createNode(item);
                    
                    html += '<div class="item item-block item-array-element" data-array-index="' + index + '">';
                    
                    // 如果数组元素是对象或数组，在前面添加展开按钮
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += '<span class="expand"></span>';
                        html += childNode.getInlineHTMLWithoutExpand();
                    } else {
                        html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                    }
                    
                    // 如果不是最后一个元素，添加逗号
                    if (index < this.value.length - 1) {
                        html += '<span class="comma">,</span>';
                    }
                    
                    html += '</div>';
                });
                
                html += '</div><span class="brace">]</span></div>';
                return html;
            },
            
            // 新增内联HTML方法，用于在同一行显示开始大括号/方括号
            getInlineHTML: function() {
                switch(this.type) {
                    case 'object':
                        return this.getInlineObjectHTML();
                    case 'array':
                        return this.getInlineArrayHTML();
                    default:
                        return this.getHTML();
                }
            },
            
            // 新增不包含展开按钮的内联HTML方法
            getInlineHTMLWithoutExpand: function() {
                switch(this.type) {
                    case 'object':
                        return this.getInlineObjectHTMLWithoutExpand();
                    case 'array':
                        return this.getInlineArrayHTMLWithoutExpand();
                    default:
                        return this.getHTML();
                }
            },
            
            getInlineObjectHTML: function() {
                if (!this.value || Object.keys(this.value).length === 0) {
                    return '<span class="brace">{</span><span class="brace">}</span>';
                }
                let html = '<span class="brace">{</span>' +
                    '<span class="expand"></span>' +
                    '<span class="ellipsis"></span>' +
                    '<div class="kv-list">';
                let keys = Object.keys(this.value);
                keys.forEach((key, index) => {
                    let prop = this.value[key];
                    let childNode = createNode(prop);
                    // 判断子节点是否为对象或数组，决定是否加item-block
                    let itemClass = (childNode.type === 'object' || childNode.type === 'array') ? 'item item-block' : 'item';
                    html += '<div class="' + itemClass + '">';
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += '<span class="expand"></span>';
                    }
                    html += '<span class="quote">"</span>' +
                        '<span class="key">' + htmlspecialchars(key) + '</span>' +
                        '<span class="quote">"</span>' +
                        '<span class="colon">: </span>';
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += childNode.getInlineHTMLWithoutExpand();
                    } else {
                        html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                    }
                    if (index < keys.length - 1) {
                        html += '<span class="comma">,</span>';
                    }
                    html += '</div>';
                });
                html += '</div><span class="brace">}</span>';
                return html;
            },
            
            getInlineArrayHTML: function() {
                if (!this.value || this.value.length === 0) {
                    return '<span class="brace">[</span><span class="brace">]</span>';
                }
                
                let html = '<span class="brace">[</span>' +
                    '<span class="expand"></span>' +
                    '<span class="ellipsis"></span>' +
                    '<div class="kv-list item-array-container">';
                    
                this.value.forEach((item, index) => {
                    let childNode = createNode(item);
                    
                    html += '<div class="item item-block item-array-element" data-array-index="' + index + '">';
                    
                    // 如果数组元素是对象或数组，在前面添加展开按钮
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += '<span class="expand"></span>';
                        html += childNode.getInlineHTMLWithoutExpand();
                    } else {
                        html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                    }
                    
                    // 如果不是最后一个元素，添加逗号
                    if (index < this.value.length - 1) {
                        html += '<span class="comma">,</span>';
                    }
                    
                    html += '</div>';
                });
                
                html += '</div><span class="brace">]</span>';
                return html;
            },
            
            getInlineObjectHTMLWithoutExpand: function() {
                if (!this.value || Object.keys(this.value).length === 0) {
                    return '<span class="brace">{</span><span class="brace">}</span>';
                }
                let html = '<span class="brace">{</span>' +
                    '<span class="ellipsis"></span>' +
                    '<div class="kv-list">';
                let keys = Object.keys(this.value);
                keys.forEach((key, index) => {
                    let prop = this.value[key];
                    let childNode = createNode(prop);
                    // 判断子节点是否为对象或数组，决定是否加item-block
                    let itemClass = (childNode.type === 'object' || childNode.type === 'array') ? 'item item-block' : 'item';
                    html += '<div class="' + itemClass + '">';
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += '<span class="expand"></span>';
                    }
                    html += '<span class="quote">"</span>' +
                        '<span class="key">' + htmlspecialchars(key) + '</span>' +
                        '<span class="quote">"</span>' +
                        '<span class="colon">: </span>';
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += childNode.getInlineHTMLWithoutExpand();
                    } else {
                        html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                    }
                    if (index < keys.length - 1) {
                        html += '<span class="comma">,</span>';
                    }
                    html += '</div>';
                });
                html += '</div><span class="brace">}</span>';
                return html;
            },
            
            getInlineArrayHTMLWithoutExpand: function() {
                if (!this.value || this.value.length === 0) {
                    return '<span class="brace">[</span><span class="brace">]</span>';
                }
                
                let html = '<span class="brace">[</span>' +
                    '<span class="ellipsis"></span>' +
                    '<div class="kv-list item-array-container">';
                    
                this.value.forEach((item, index) => {
                    let childNode = createNode(item);
                    
                    html += '<div class="item item-block item-array-element" data-array-index="' + index + '">';
                    
                    // 确保所有类型的数组元素都能正确处理
                    if (childNode.type === 'object' || childNode.type === 'array') {
                        html += '<span class="expand"></span>';
                        html += childNode.getInlineHTMLWithoutExpand();
                    } else {
                        html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                    }
                    
                    // 如果不是最后一个元素，添加逗号
                    if (index < this.value.length - 1) {
                        html += '<span class="comma">,</span>';
                    }
                    
                    html += '</div>';
                });
                
                html += '</div><span class="brace">]</span>';
                return html;
            }
        };
        
        return node;
    }

    // 获取值的类型
    function getType(value) {
        if (value === null) return 'null';
        if (typeof value === 'bigint') return 'bigint';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    // 判断是否为URL
    function isUrl(str) {
        if (typeof str !== 'string') return false;
        const urlRegex = /^(https?:\/\/|ftp:\/\/)[^\s<>"'\\]+$/i;
        return urlRegex.test(str);
    }

    // 格式化字符串值，如果是URL则转换为链接
    function formatStringValue(str) {
        // URL正则表达式，匹配 http/https/ftp 协议的URL
        const urlRegex = /^(https?:\/\/|ftp:\/\/)[^\s<>"'\\]+$/i;
        
        if (urlRegex.test(str)) {
            // 如果是URL，转换为链接
            const escapedUrl = htmlspecialchars(str);
            return '<a href="' + escapedUrl + '" target="_blank" rel="noopener noreferrer" data-is-link="1" data-link-url="' + escapedUrl + '">' + htmlspecialchars(str) + '</a>';
        } else {
            // 直接显示解析后的字符串内容，不需要重新转义
            // 这样可以保持用户原始输入的意图
            return htmlspecialchars(str);
        }
    }

    return {
        format: format,
        formatSync: formatSync
    }
})();