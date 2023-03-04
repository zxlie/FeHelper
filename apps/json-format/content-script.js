/**
 * Json Page Automatic Format Via FeHelper
 * @author zhaoxianlie
 */

window.JsonAutoFormat = (() => {

    // 留100ms时间给静态文件加载，当然，这个代码只是留给未开发过程中用的
    let pleaseLetJsLoaded = 0;
    let __importScript = (filename) => {
        pleaseLetJsLoaded = 100;
        let url = filename;

        if (location.protocol === 'chrome-extension:' || chrome.runtime && chrome.runtime.getURL) {
            url = chrome.runtime.getURL('json-format/' + filename);
        }
        fetch(url).then(resp => resp.text()).then(jsText => {
            if(window.evalCore && window.evalCore.getEvalInstance){
                return window.evalCore.getEvalInstance(window)(jsText);
            }
            let el = document.createElement('script');
            el.textContent = jsText;
            document.head.appendChild(el);
        });
    };

    __importScript('json-bigint.js');
    __importScript('format-lib.js');
    __importScript('json-abc.js');
    __importScript('json-decode.js');

    const JSON_SORT_TYPE_KEY = 'json_sort_type_key';

    // 本地永久存储的key
    const STORAGE_KEYS = {
        // 总是开启JSON自动格式化功能
        JSON_PAGE_FORMAT: 'JSON_PAGE_FORMAT',
        // 总是显示顶部工具栏
        JSON_TOOL_BAR_ALWAYS_SHOW: 'JSON_TOOL_BAR_ALWAYS_SHOW',
        // 启用底部状态栏
        STATUS_BAR_ALWAYS_SHOW: 'STATUS_BAR_ALWAYS_SHOW',
        // 自动进行URL、Unicode解码
        AUTO_TEXT_DECODE: 'AUTO_TEXT_DECODE',
        // 修正乱码
        FIX_ERROR_ENCODING: 'FIX_ERROR_ENCODING',
        // 启用JSON key排序功能
        ENABLE_JSON_KEY_SORT: 'ENABLE_JSON_KEY_SORT',
        // 保留键值双引号
        KEEP_KEY_VALUE_DBL_QUOTE: 'KEEP_KEY_VALUE_DBL_QUOTE',
        // 最大json key数量
        MAX_JSON_KEYS_NUMBER: 'MAX_JSON_KEYS_NUMBER',
        // 自定义皮肤
        JSON_FORMAT_THEME: 'JSON_FORMAT_THEME'
    };

    // 皮肤定义
    const SKIN_THEME = {
        '0': 'theme-default',
        '1': 'theme-simple',
        '2': 'theme-light',
        '3': 'theme-dark',
        '4': 'theme-vscode',
        '5': 'theme-github',
        '6': 'theme-vegetarian'
    };

    let cssInjected = false;

    // JSONP形式下的callback name
    let funcName = null;
    let jsonObj = null;
    let fnTry = null;
    let fnCatch = null;

    // 格式化的配置
    let formatOptions = {
        JSON_FORMAT_THEME: 0,
        sortType: 0,
        autoDecode: false,
        originalSource: ''
    };

    // 获取JSON格式化的配置信息
    let _getAllOptions = (success) => {
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing:'request-jsonformat-options',
            params: STORAGE_KEYS
        }, result => success(result));
    };

    let _getHtmlFragment = () => {
        return [
            '<div id="jfToolbar" class="x-toolbar" style="display:none">' +
            '    <a href="https://www.baidufe.com/fehelper/feedback.html" target="_blank" class="x-a-title">' +
            '        <img src="' + chrome.runtime.getURL('static/img/fe-16.png') + '" alt="fehelper"/> FeHelper</a>' +
            '    <span class="x-b-title"></span>' +
            '    <span class="x-sort">' +
            '        <span class="x-split">|</span>' +
            '        <span class="x-stitle">排序：</span>' +
            '        <label for="sort_null">默认</label><input type="radio" name="jsonsort" id="sort_null" value="0" checked>' +
            '        <label for="sort_asc">升序</label><input type="radio" name="jsonsort" id="sort_asc" value="1">' +
            '        <label for="sort_desc">降序</label><input type="radio" name="jsonsort" id="sort_desc" value="-1">' +
            '    </span>' +
            '    <span class="x-fix-encoding"><span class="x-split">|</span><button class="xjf-btn" id="jsonGetCorrectCnt">乱码修正</button></span>' +
            '    <span id="optionBar"></span>' +
            '    <span class="fe-feedback">' +
            '       <span class="x-settings"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 14 16" width="14">' +
            '           <path fill-rule="evenodd" d="M14 8.77v-1.6l-1.94-.64-.45-1.09.88-1.84-1.13-1.13-1.81.91-1.09-.45-.69-1.92h-1.6l-.63 1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0 7.23v1.59l1.94.64.45 1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69 1.92h1.59l.63-1.94 1.11-.45 1.84.88 1.13-1.13-.92-1.81.47-1.09L14 8.75v.02zM7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"></path>' +
            '       </svg>高级定制</span>' +
            '       <a id="toggleBtn" title="展开或收起工具栏">隐藏&gt;&gt;</a>' +
            '    </span>' +
            '</div>',
            '<div id="formattingMsg"><span class="x-loading"></span>格式化中...</div>',
            '<div class="mod-json mod-contentscript"><div class="rst-item">',
            '<div id="jfCallbackName_start" class="callback-name"></div>',
            '<div id="jfContent"></div>',
            '<pre id="jfContent_pre"></pre>',
            '<div id="jfCallbackName_end" class="callback-name"></div>',
            '</div></div>'
        ].join('')
    };

    let _createSettingPanel = () => {
        let html = `<div id="jfSettingPanel" class="mod-setting-panel">
            <h4>基本配置项</h4>
            <form action="#">
                <ul>
                    <li><label><input type="checkbox" name="alwaysOn" value="1">总是开启JSON自动格式化功能</label></li>
                    <li><label><input type="checkbox" name="alwaysShowToolbar" value="1">总是显示顶部工具栏</label></li>
                    <li><label><input type="checkbox" name="alwaysShowStatusbar" value="1">启用状态栏（包含复制/下载/删除）</label></li>
                    <li><label><input type="checkbox" name="autoDecode" value="1">自动进行URL、Unicode解码</label></li>
                    <li><label><input type="checkbox" name="errorEncoding" value="1">乱码修正（需手动操作，一键修正）</label></li>
                    <li><label><input type="checkbox" name="enableSort" value="1">启用JSON键名排序功能</label></li>
                    <li><label><input type="checkbox" name="keepQuote" value="1">格式化后保留键值对的双引号</label></li>
                    <li><label><input type="text" name="maxlength" value="10000">最大支持的JSON Key数量</label></li>
               </ul>

               <h4>自定义皮肤</h4>
               <ul>
                    <li><label><input type="radio" name="skinId" value="0">默认模式（简约风格）</label></li>
                    <li><label><input type="radio" name="skinId" value="1">极简模式（纯源码）</label></li>
                    <li><label><input type="radio" name="skinId" value="2">清爽模式（明亮、跳跃）</label></li>
                    <li><label><input type="radio" name="skinId" value="3">暗黑模式（安静、忧郁）</label></li>
                    <li><label><input type="radio" name="skinId" value="4">vscode模式（醒目、专注）</label></li>
                    <li><label><input type="radio" name="skinId" value="5">github模式（纵享丝滑）</label></li>
                    <li><label><input type="radio" name="skinId" value="6">素人模式（清心寡欲）</label></li>
               </ul>

               <div class="btns">
                    <input type="submit" class="xjf-btn" name="submit" value="确定">
                    <input type="reset" class="xjf-btn" name="reset" value="取消">
               </div>
            </form>
        </div>`;

        let sPanel = $('#jfSettingPanel');
        if (!sPanel.length) {
            sPanel = $(html).appendTo('#jfToolbar');
            // 表单提交时，保存数据
            sPanel.find('input[type="submit"]').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                let formData = {};
                formData.JSON_PAGE_FORMAT = sPanel.find('input[name="alwaysOn"]').prop('checked');
                formData.JSON_TOOL_BAR_ALWAYS_SHOW = sPanel.find('input[name="alwaysShowToolbar"]').prop('checked');
                formData.STATUS_BAR_ALWAYS_SHOW = sPanel.find('input[name="alwaysShowStatusbar"]').prop('checked');
                formData.AUTO_TEXT_DECODE = sPanel.find('input[name="autoDecode"]').prop('checked');
                formData.FIX_ERROR_ENCODING = sPanel.find('input[name="errorEncoding"]').prop('checked');
                formData.ENABLE_JSON_KEY_SORT = sPanel.find('input[name="enableSort"]').prop('checked');
                formData.KEEP_KEY_VALUE_DBL_QUOTE = sPanel.find('input[name="keepQuote"]').prop('checked');
                formData.MAX_JSON_KEYS_NUMBER = sPanel.find('input[name="maxlength"]').val();
                formData.JSON_FORMAT_THEME = sPanel.find('input[name="skinId"]:checked').val();

                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'save-jsonformat-options',
                    params: formData
                }, result => sPanel.hide());
            });

            sPanel.find('input[name="alwaysShowToolbar"]').on('click', function (e) {
                $('.fe-feedback #toggleBtn').trigger('click');
            });

            sPanel.find('input[name="errorEncoding"]').on('click', function (e) {
                let el = $('#jfToolbar').find('.x-fix-encoding');
                $(this).prop('checked') ? el.show() : el.hide();
            });

            sPanel.find('input[name="enableSort"]').on('click', function (e) {
                let el = $('#jfToolbar').find('.x-sort');
                $(this).prop('checked') ? el.show() : el.hide();
            });

            sPanel.find('input[type="reset"]').on('click', (e) => sPanel.hide());

            sPanel.find('input[name="skinId"]').on('click', function (e) {
                formatOptions.JSON_FORMAT_THEME = this.value;
                _didFormat();
            });

            sPanel.find('input[name="alwaysShowStatusbar"]').on('click', function (e) {
                formatOptions.STATUS_BAR_ALWAYS_SHOW = $(this).prop('checked');
                let elBody = $('body');
                if (formatOptions.STATUS_BAR_ALWAYS_SHOW) {
                    elBody.removeClass('hide-status-bar');
                } else {
                    elBody.addClass('hide-status-bar');
                }
            });

            sPanel.find('input[name="keepQuote"]').on('click', function (e) {
                formatOptions.KEEP_KEY_VALUE_DBL_QUOTE = $(this).prop('checked');
                let elBody = $('body');
                if (formatOptions.KEEP_KEY_VALUE_DBL_QUOTE) {
                    elBody.removeClass('remove-quote');
                } else {
                    elBody.addClass('remove-quote');
                }
            });
        } else if (sPanel[0].offsetHeight) {
            return sPanel.hide();
        } else {
            sPanel.show();
        }

        _getAllOptions(result => {
            result.JSON_PAGE_FORMAT && sPanel.find('input[name="alwaysOn"]').prop('checked', true);
            result.JSON_TOOL_BAR_ALWAYS_SHOW && sPanel.find('input[name="alwaysShowToolbar"]').prop('checked', true);
            result.STATUS_BAR_ALWAYS_SHOW && sPanel.find('input[name="alwaysShowStatusbar"]').prop('checked', true);
            result.AUTO_TEXT_DECODE && sPanel.find('input[name="autoDecode"]').prop('checked', true);
            result.FIX_ERROR_ENCODING && sPanel.find('input[name="errorEncoding"]').prop('checked', true);
            result.ENABLE_JSON_KEY_SORT && sPanel.find('input[name="enableSort"]').prop('checked', true);
            result.KEEP_KEY_VALUE_DBL_QUOTE && sPanel.find('input[name="keepQuote"]').prop('checked', true);
            sPanel.find('input[name="maxlength"]').attr('value', result.MAX_JSON_KEYS_NUMBER || 10000);
            sPanel.find(`input[name="skinId"][value="${result.JSON_FORMAT_THEME || 0}"]`).attr('checked', true);
        });
    };


    // 检测当前页面的CSP，防止出现这种情况：
    // DOMException: Failed to read the 'localStorage' property from 'Window': The document is sandboxed and lacks the 'allow-same-origin' flag.
    let _checkContentSecurityPolicy = () => {
        try {
            localStorage.getItem(1);
        } catch (e) {
            return false;
        }
        return true;
    };

    let _initToolbar = () => {

        let cspSafe = _checkContentSecurityPolicy();
        if (cspSafe) {
            // =============================排序：获取上次记录的排序方式
            if (formatOptions.ENABLE_JSON_KEY_SORT) {
                formatOptions.sortType = parseInt(localStorage.getItem(JSON_SORT_TYPE_KEY) || 0);
                // 排序选项初始化
                $('[name=jsonsort][value=' + formatOptions.sortType + ']').attr('checked', 1);
            } else {
                formatOptions.sortType = 0;
                $('#jfToolbar .x-sort').hide();
            }

            // =============================事件初始化
            $('[name=jsonsort]').click(function (e) {
                let sortType = parseInt(this.value);
                if (sortType !== formatOptions.sortType) {
                    formatOptions.sortType = sortType;
                    _didFormat();
                }
                localStorage.setItem(JSON_SORT_TYPE_KEY, sortType);
            });
        } else {
            $('#jfToolbar .x-sort').hide();
        }


        // =============================乱码修正
        if (!formatOptions.FIX_ERROR_ENCODING) {
            $('#jfToolbar .x-fix-encoding').hide();
        }

        // =============================工具栏的显示与隐藏控制
        let toolBarClassList = document.querySelector('#jfToolbar').classList;
        let tgBtn = $('.fe-feedback #toggleBtn');
        if (formatOptions.JSON_TOOL_BAR_ALWAYS_SHOW) {
            toolBarClassList.remove('t-collapse');
            tgBtn.html('隐藏&gt;&gt;');
        } else {
            toolBarClassList.add('t-collapse');
            tgBtn.html('&lt;&lt;');
        }
        tgBtn.click(function (e) {
            e.preventDefault();
            e.stopPropagation();

            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'toggle-jsonformat-options'
            }, show => {
                let toolBarClassList = document.querySelector('#jfToolbar').classList;
                if (show) {
                    toolBarClassList.remove('t-collapse');
                    tgBtn.html('隐藏&gt;&gt;');
                } else {
                    toolBarClassList.add('t-collapse');
                    tgBtn.html('&lt;&lt;');
                }
                $('#jfToolbar input[name="alwaysShowToolbar"]').prop('checked', show);
            });
        });

        $('.fe-feedback .x-settings').click(e => _createSettingPanel());
        $('#jsonGetCorrectCnt').click(e => _getCorrectContent());
    };

    let _didFormat = function () {
        let source = formatOptions.originalSource;

        if (formatOptions.sortType !== 0) {
            let jsonObj = JsonABC.sortObj(JSON.parse(formatOptions.originalSource), parseInt(formatOptions.sortType), true);
            source = JSON.stringify(jsonObj);
        }

        let elBody = $('body');

        let theme = SKIN_THEME[formatOptions.JSON_FORMAT_THEME || 0];
        Object.values(SKIN_THEME).forEach(th => elBody.removeClass(th));
        elBody.addClass(theme);

        // 控制引号
        if (formatOptions.KEEP_KEY_VALUE_DBL_QUOTE) {
            elBody.removeClass('remove-quote');
        } else {
            elBody.addClass('remove-quote');
        }

        // 控制底部状态栏
        if (formatOptions.STATUS_BAR_ALWAYS_SHOW) {
            elBody.removeClass('hide-status-bar');
        } else {
            elBody.addClass('hide-status-bar');
        }

        if (formatOptions.autoDecode) {
            (async () => {
                let txt = await JsonEnDecode.urlDecodeByFetch(source);
                source = JsonEnDecode.uniDecode(txt);

                // 格式化
                try {
                    Formatter.format(source, theme);
                } catch (e) {
                    Formatter.formatSync(source, theme)
                }
                $('#jfToolbar').fadeIn(500);
            })();
        } else {
            // 格式化
            try {
                Formatter.format(source, theme);
            } catch (e) {
                Formatter.formatSync(source, theme)
            }

            $('#jfToolbar').fadeIn(500);
        }


        // 如果是JSONP格式的，需要把方法名也显示出来
        if (funcName != null) {
            if (fnTry && fnCatch) {
                $('#jfCallbackName_start').html('<pre style="padding:0">' + fnTry + '</pre>' + funcName + '(');
                $('#jfCallbackName_end').html(')<br><pre style="padding:0">' + fnCatch + '</pre>');
            } else {
                $('#jfCallbackName_start').html(funcName + '(');
                $('#jfCallbackName_end').html(')');
            }
        }
    };

    let _getCorrectContent = function () {
        fetch(location.href).then(res => res.text()).then(text => {
            formatOptions.originalSource = text;
            _didFormat();
        });
    };


    /**
     * 从页面提取JSON文本
     * @returns {string}
     * @private
     */
    let _getJsonText = function () {

        let pre = document.querySelectorAll('body>pre')[0] || {textContent: ""};
        let source = pre.textContent.trim();

        if (!source) {
            source = (document.body.textContent || '').trim()
        }

        // 如果是js内容，则不进行json格式化
        let isJs = /\.js$/.test(new URL(location.href).pathname);
        isJs = isJs && document.contentType === 'application/javascript';
        if (isJs) {
            source = '';
        }

        if (!source) {
            return false;
        }


        // 1、如果body的内容还包含HTML标签，肯定不是合法的json了
        // 2、如果是合法的json，也只可能有一个text节点
        // 3、但是要兼容一下其他插件对页面的破坏情况
        // 4、对于content-type是application/json的页面可以做宽松处理
        let nodes = document.body.childNodes;
        let jsonText = '';
        let isJsonContentType = document.contentType === 'application/json';
        for (let i = 0, len = nodes.length; i < len; i++) {
            let elm = nodes[i];
            if (elm.nodeType === Node.TEXT_NODE) {
                jsonText += (elm.textContent || '').trim();
            } else if (isJsonContentType) {
                if ((elm.offsetHeight + elm.offsetWidth !== 0) && elm.textContent.length > jsonText.length) {
                    jsonText = elm.textContent;
                }
            } else {
                if (nodes[i].nodeType === Node.ELEMENT_NODE) {
                    let tagName = elm.tagName.toLowerCase();
                    let text = (elm.textContent || '').trim();

                    // 如果包含了script和link标签，需要看标签的src和href属性值，如果不是chrome-extensions注入的，也要跳出
                    if (['script', 'link'].includes(tagName)) {
                        let url = elm.getAttribute('src') || elm.getAttribute('href');
                        if (!!url && !/^chrome\-extension:\/\//.test(url)) {
                            return false;
                        }
                    }

                    // 如果不是pre标签，并且还不是隐藏节点，且内容不为空，也要跳出
                    else if (tagName !== 'pre' && (elm.offsetWidth + elm.offsetHeight !== 0 && !!text)) {
                        return false;
                    }

                    // 如果是pre标签，但当前节点内容与最初body.textContent提取值不一致，都跳出
                    else if (tagName === 'pre' && text !== source) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        return (jsonText || '').trim() || source;
    };

    /**
     * 获取一个JSON的所有Key数量
     * @param json
     * @returns {number}
     * @private
     */
    let _getAllKeysCount = function (json) {
        let count = 0;

        if (typeof json === 'object') {
            let keys = Object.keys(json);
            count += keys.length;

            keys.forEach(key => {
                if (json[key] && typeof json[key] === 'object') {
                    count += _getAllKeysCount(json[key]);
                }
            });
        }

        return count;
    };

    // 用新的options来覆盖默认options
    let _extendsOptions = options => {
        options = options || {};
        Object.keys(options).forEach(opt => formatOptions[opt] = options[opt]);
    };


    /**
     * 执行format操作
     * @private
     */
    let _format = function (options) {

        let source = _getJsonText();
        if (!source) {
            return;
        }

        _extendsOptions(options);

        // 下面校验给定字符串是否为一个合法的json
        try {

            // 再看看是不是jsonp的格式
            let reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/gm;
            let reTry = /^(try\s*\{\s*)?/g;
            let reCatch = /([;\s]*\}\s*catch\s*\(\s*\S+\s*\)\s*\{([\s\S])*\})?[;\s]*$/g;

            // 检测是否有try-catch包裹
            let sourceReplaced = source.replace(reTry, function () {
                fnTry = fnTry ? fnTry : arguments[1];
                return '';
            }).replace(reCatch, function () {
                fnCatch = fnCatch ? fnCatch : arguments[1];
                return '';
            }).trim();

            let matches = reg.exec(sourceReplaced);
            if (matches != null && (fnTry && fnCatch || !fnTry && !fnCatch)) {
                funcName = matches[1];
                source = matches[2];
            } else {
                reg = /^([\{\[])/;
                if (!reg.test(source)) {
                    return;
                }
            }

            // 这里可能会throw exception
            jsonObj = JSON.parse(source);
        } catch (ex) {

            // new Function的方式，能自动给key补全双引号，但是不支持bigint，所以是下下策，放在try-catch里搞
            try {
                jsonObj = new Function("return " + source)();
            } catch (exx) {
                try {
                    // 再给你一次机会，是不是下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
                    jsonObj = new Function("return '" + source + "'")();
                    if (typeof jsonObj === 'string') {
                        try {
                            // 确保bigint不会失真
                            jsonObj = JSON.parse(jsonObj);
                        } catch (ie) {
                            // 最后给你一次机会，是个字符串，老夫给你再转一次
                            jsonObj = new Function("return " + jsonObj)();
                        }
                    }
                } catch (exxx) {
                    return;
                }
            }

        }

        // 是json格式，可以进行JSON自动格式化
        if (jsonObj != null && typeof jsonObj === "object") {

            // 提前注入css
            if(!cssInjected) {
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing:'inject-content-css',
                    tool: 'json-format'
                });
            }

            try {
                // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                source = JSON.stringify(jsonObj);
            } catch (ex) {
                // 通过JSON反解不出来的，一定有问题
                return;
            }

            // JSON的所有key不能超过预设的值，比如 10000 个，要不然自动格式化会比较卡
            if (formatOptions['MAX_JSON_KEYS_NUMBER']) {
                let keysCount = _getAllKeysCount(jsonObj);
                if (keysCount > formatOptions['MAX_JSON_KEYS_NUMBER']) {
                    let msg = '当前JSON共 <b style="color:red">' + keysCount + '</b> 个Key，大于预设值' + formatOptions['MAX_JSON_KEYS_NUMBER'] + '，已取消自动格式化；可到FeHelper设置页调整此配置！';
                    return toast(msg);
                }
            }

            $('html').addClass('fh-jf');
            $('body').prepend(_getHtmlFragment());
            let preLength = $('body>pre').remove().length;
            if (!preLength) {
                Array.prototype.slice.call(document.body.childNodes).forEach(node => {
                    (node.nodeType === Node.TEXT_NODE) && node.remove();
                });
            }

            formatOptions.originalSource = source;

            _initToolbar();
            _didFormat();
        }
    };

    return {
        format: () => _getAllOptions(result => {
            if(result.JSON_PAGE_FORMAT) {
                let intervalId = setInterval(() => {
                    if(typeof Formatter !== 'undefined') {
                        clearInterval(intervalId);
                        _format(result);
                    }
                },pleaseLetJsLoaded);
            }
        })
    };
})();


if(location.protocol !== 'chrome-extension:') {
    window.JsonAutoFormat.format();
}
