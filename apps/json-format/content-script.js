/**
 * Json Page Automatic Format Via FeHelper
 * @author zhaoxianlie
 */

// Popup wakeup may re-inject this script into an already formatted page.
if (!window.__FH_JSON_AUTO_FORMAT_SCRIPT_LOADED__) {
    window.__FH_JSON_AUTO_FORMAT_SCRIPT_LOADED__ = true;

window.JsonAutoFormat = (() => {

    // 依赖已在 background 首轮注入，这里无需再次加载
    let pleaseLetJsLoaded = 0;

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
        // 嵌套转义解析
        NESTED_ESCAPE_PARSE: 'NESTED_ESCAPE_PARSE',
        // 紧凑视图
        JSON_FORMAT_COMPACT_MODE: 'JSON_FORMAT_COMPACT_MODE',
        // 全局产品模式
        FH_UI_MODE: 'FH_UI_MODE',
        // JSON 格式化独立模式
        JSON_FORMAT_UI_MODE: 'JSON_FORMAT_UI_MODE',
        // 最大json key数量
        MAX_JSON_KEYS_NUMBER: 'MAX_JSON_KEYS_NUMBER',
        // 自定义皮肤
        JSON_FORMAT_THEME: 'JSON_FORMAT_THEME',
        // 全局夜间模式
        AUTO_DARK_MODE: false,
        ALWAYS_DARK_MODE: false
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
    let fnTry = null;
    let fnCatch = null;

    // 工具栏是否显示
    let showToolBar = true;

    // 格式化的配置
    let formatOptions = {
        JSON_FORMAT_THEME: 0,
        sortType: 0,
        autoDecode: false,
        originalSource: '',
        NESTED_ESCAPE_PARSE: false,
        JSON_FORMAT_COMPACT_MODE: true,
        FH_UI_MODE: 'lite',
        JSON_FORMAT_UI_MODE: 'lite',
        AUTO_DARK_MODE: false,
        ALWAYS_DARK_MODE: false
    };

    let darkModePreferenceBound = false;

    let _isEnabledSetting = value => value === true || value === 'true';

    let _getJsonAutoUtils = () => window.FHJsonAutoUtils || {};

    let _getJsonParseOptions = overrides => Object.assign({
        nestedEscapeParse: !!formatOptions.NESTED_ESCAPE_PARSE
    }, overrides || {});

    let _parseJsonLike = (source, parseOptions) => {
        const utils = _getJsonAutoUtils();
        if (typeof utils.parseJSONLike === 'function') {
            return utils.parseJSONLike(source, _getJsonParseOptions(parseOptions));
        }

        try {
            const value = JSON.parse(String(source || '').trim());
            if (value && typeof value === 'object') {
                return {
                    value,
                    normalizedSource: JSON.stringify(value),
                    funcName: null,
                    fnTry: null,
                    fnCatch: null
                };
            }
        } catch (e) {}
        return null;
    };

    let _stringifyJsonForFormatter = jsonObj => {
        const utils = _getJsonAutoUtils();
        if (typeof utils.safeStringify === 'function') {
            return utils.safeStringify(jsonObj);
        }
        return JSON.stringify(jsonObj);
    };

    let _coerceDecodedJsonSource = (source, decodedSource) => {
        const utils = _getJsonAutoUtils();
        if (typeof utils.coerceDecodedJSONSource === 'function') {
            return utils.coerceDecodedJSONSource(source, decodedSource, _getJsonParseOptions());
        }

        const parsed = _parseJsonLike(decodedSource);
        return parsed ? parsed.normalizedSource : source;
    };

    let _applyCompactMode = () => {
        let body = document.body;
        if (!body) {
            return;
        }
        const forceCompact = _getResolvedUiMode() !== 'omni';
        body.classList.toggle('fh-json-compact', forceCompact || !!formatOptions.JSON_FORMAT_COMPACT_MODE);
    };

    let _getResolvedUiMode = () => {
        return String(formatOptions.JSON_FORMAT_UI_MODE || formatOptions.FH_UI_MODE || '').toLowerCase() === 'omni' ? 'omni' : 'lite';
    };

    let _applyUiMode = () => {
        let body = document.body;
        if (!body) {
            return;
        }
        const isLiteMode = _getResolvedUiMode() !== 'omni';
        body.classList.toggle('fh-ui-mode-lite', isLiteMode);
        body.classList.toggle('fh-ui-mode-omni', !isLiteMode);
    };

    let _applyToolbarDisplayState = () => {
        let toolbar = document.querySelector('#jfToolbar');
        if (!toolbar) {
            return;
        }

        showToolBar = !!formatOptions.JSON_TOOL_BAR_ALWAYS_SHOW;
        toolbar.classList.toggle('t-collapse', !showToolBar);
        $('.fe-feedback #toggleBtn').html(showToolBar ? '收起' : '展开');
        $('#jfToolbar input[name="alwaysShowToolbar"]').prop('checked', showToolBar);
    };

    let _syncFormatterEscapeState = () => {
        if (typeof window.Formatter !== 'undefined' && window.Formatter.setEscapeEnabled) {
            window.Formatter.setEscapeEnabled(!!formatOptions.NESTED_ESCAPE_PARSE);
        }
    };

    let _syncFormatterStatusBarState = () => {
        const enabled = !!formatOptions.STATUS_BAR_ALWAYS_SHOW;
        $('body').toggleClass('hide-status-bar', !enabled);
        if (typeof window.Formatter !== 'undefined' && window.Formatter.setStatusBarEnabled) {
            window.Formatter.setStatusBarEnabled(enabled);
        }
    };

    let _openDonateModal = e => {
        e && e.preventDefault();
        e && e.stopPropagation();
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'open-donate-modal',
            params: { toolName: 'json-format' }
        });
    };

    let _prepareSourceForFormatter = async source => {
        if (!formatOptions.autoDecode) {
            return source;
        }

        try {
            let txt = await JsonEnDecode.urlDecodeByFetch(source);
            let decodedSource = JsonEnDecode.uniDecode(txt);
            return _coerceDecodedJsonSource(source, decodedSource);
        } catch (e) {
            console.warn('URL解码失败，使用原始内容:', e);
            return source;
        }
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

        // 判断当前地区是否在美国
        const isInUSA = () => {
            // 通过时区判断是否在美国
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const isUSTimeZone = /^America\/(New_York|Chicago|Denver|Los_Angeles|Anchorage|Honolulu)/.test(timeZone);

            // 通过语言判断
            const language = navigator.language || navigator.userLanguage;
            const isUSLanguage = language.toLowerCase().indexOf('en-us') > -1;

            // 如果时区和语言都符合美国特征,则认为在美国
            return (isUSTimeZone && isUSLanguage);
        };

        return [
            '<div id="jfToolbar" class="x-toolbar fh-json-viewbar" style="display:none">' +
            '    <div class="fh-viewbar-brand">' +
            '        <a href="https://fehelper.com" target="_blank" class="x-a-title fh-viewbar-logo">' +
            '            <img src="' + chrome.runtime.getURL('static/img/fe-16.png') + '" alt="FeHelper"/><span>FeHelper</span></a>' +
            '        <span class="fh-viewbar-title-divider" aria-hidden="true">｜</span>' +
            '        <span class="x-b-title fh-viewbar-title">JSON 格式化</span>' +
            '    </div>' +
            '    <div class="fh-viewbar-main">' +
            '        <span class="x-sort fh-viewbar-group fh-sort-group">' +
            '            <span class="x-split">|</span>' +
            '            <span class="x-stitle">排序</span>' +
            '            <label class="fh-radio-pill" for="sort_null"><input type="radio" name="jsonsort" id="sort_null" value="0" checked><span>默认</span></label>' +
            '            <label class="fh-radio-pill" for="sort_asc"><input type="radio" name="jsonsort" id="sort_asc" value="1"><span>升序</span></label>' +
            '            <label class="fh-radio-pill" for="sort_desc"><input type="radio" name="jsonsort" id="sort_desc" value="-1"><span>降序</span></label>' +
            '        </span>' +
            '        <span class="x-fix-encoding fh-viewbar-group"><span class="x-split">|</span><button class="xjf-btn" id="jsonGetCorrectCnt">乱码修正</button></span>' +
            '        <span id="optionBar" class="fh-viewbar-group fh-option-bar"></span>' +
            '    </div>' +
            '    <span class="fe-feedback fh-viewbar-actions">' +
            '       <span class="x-settings" title="高级定制"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 14 16" width="14">' +
            '           <path fill-rule="evenodd" d="M14 8.77v-1.6l-1.94-.64-.45-1.09.88-1.84-1.13-1.13-1.81.91-1.09-.45-.69-1.92h-1.6l-.63 1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0 7.23v1.59l1.94.64.45 1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69 1.92h1.59l.63-1.94 1.11-.45 1.84.88 1.13-1.13-.92-1.81.47-1.09L14 8.75v.02zM7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"></path>' +
            '       </svg><span>高级定制</span></span>' +
            '       <a id="toggleBtn" title="展开或收起工具栏">收起</a>' +
            '       <a class="x-other-tools' + (isInUSA() ? ' x-other-tools-us' : '') + '" style="cursor:pointer"><span>工具市场</span></a>' +
            '       <span class="x-donate-link' + (isInUSA() ? ' x-donate-link-us' : '') + '"><a href="#" id="donateLink"><i class="nav-icon">SP</i><span>请作者喝咖啡</span></a></span>' +
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

    let _mountFormatterShell = () => {
        if (document.getElementById('jfToolbar')) {
            return;
        }

        let originalContent = document.getElementById('jfOriginalContent');
        if (!originalContent) {
            originalContent = document.createElement('div');
            originalContent.id = 'jfOriginalContent';
            originalContent.style.display = 'none';

            while (document.body.firstChild) {
                originalContent.appendChild(document.body.firstChild);
            }
            document.body.appendChild(originalContent);
        }

        $('body').prepend(_getHtmlFragment());
    };

    let _createSettingPanel = () => {
        let html = `<div id="jfSettingPanel" class="mod-setting-panel">
            <h4>基本配置项</h4>
            <form action="#">
                <div class="setting-section-title">运行</div>
                <ul>
                    <li><label><input type="checkbox" name="alwaysOn" value="1">总是开启 JSON 自动格式化</label></li>
                    <li><label><input type="checkbox" name="alwaysShowToolbar" value="1">总是显示顶部工具栏</label></li>
               </ul>

                <div class="setting-section-title">解析与排序</div>
                <ul>
                    <li><label><input type="checkbox" name="enableSort" value="1">启用 JSON 键名排序</label></li>
                    <li><label><input type="checkbox" name="nestedParse" value="1">默认启用嵌套解析</label></li>
                    <li><label><input type="checkbox" name="autoDecode" value="1">自动进行 URL / Unicode 解码</label></li>
                    <li><label><input type="checkbox" name="errorEncoding" value="1">显示乱码修正入口</label></li>
                    <li><label><input type="text" name="maxlength" value="10000">最大支持的 JSON Key 数量</label></li>
               </ul>

                <div class="setting-section-title">显示</div>
                <ul>
                    <li><label><input type="checkbox" name="alwaysShowStatusbar" value="1">启用状态栏（复制/下载/删除）</label></li>
                    <li><label><input type="checkbox" name="keepQuote" value="1">保留键值对双引号</label></li>
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

               <div class="setting-support-link">
                    <a href="#" class="setting-donate-link"><span class="setting-donate-badge">SP</span><span>请作者喝咖啡</span></a>
               </div>

               <div class="btns">
                    <input type="submit" class="xjf-btn" name="submit" value="完成">
                    <input type="button" class="xjf-btn" name="close" value="关闭">
               </div>
            </form>
        </div>`;

        let sPanel = $('#jfSettingPanel');
        if (!sPanel.length) {
            sPanel = $(html).appendTo('#jfToolbar');
            let collectPanelOptions = () => ({
                JSON_PAGE_FORMAT: sPanel.find('input[name="alwaysOn"]').prop('checked'),
                JSON_TOOL_BAR_ALWAYS_SHOW: sPanel.find('input[name="alwaysShowToolbar"]').prop('checked'),
                STATUS_BAR_ALWAYS_SHOW: sPanel.find('input[name="alwaysShowStatusbar"]').prop('checked'),
                AUTO_TEXT_DECODE: sPanel.find('input[name="autoDecode"]').prop('checked'),
                FIX_ERROR_ENCODING: sPanel.find('input[name="errorEncoding"]').prop('checked'),
                ENABLE_JSON_KEY_SORT: sPanel.find('input[name="enableSort"]').prop('checked'),
                NESTED_ESCAPE_PARSE: sPanel.find('input[name="nestedParse"]').prop('checked'),
                KEEP_KEY_VALUE_DBL_QUOTE: sPanel.find('input[name="keepQuote"]').prop('checked'),
                MAX_JSON_KEYS_NUMBER: parseInt(sPanel.find('input[name="maxlength"]').val(), 10) || 10000,
                JSON_FORMAT_THEME: parseInt(sPanel.find('input[name="skinId"]:checked').val(), 10) || 0
            });

            let savePanelOptions = params => {
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'save-jsonformat-options',
                    params: params
                });
            };

            let applyPanelOptions = (params, opts = {}) => {
                Object.keys(params).forEach(key => formatOptions[key] = params[key]);
                formatOptions.autoDecode = !!formatOptions.AUTO_TEXT_DECODE;
                formatOptions.NESTED_ESCAPE_PARSE = !!formatOptions.NESTED_ESCAPE_PARSE;
                formatOptions.JSON_FORMAT_COMPACT_MODE = !!formatOptions.JSON_FORMAT_COMPACT_MODE;
                formatOptions.JSON_FORMAT_THEME = parseInt(formatOptions.JSON_FORMAT_THEME, 10) || 0;
                formatOptions.MAX_JSON_KEYS_NUMBER = parseInt(formatOptions.MAX_JSON_KEYS_NUMBER, 10) || 10000;

                _syncFormatterEscapeState();
                _applyToolbarDisplayState();
                _applyUiMode();
                _applyCompactMode();
                _syncFormatterStatusBarState();

                $('body').toggleClass('remove-quote', !formatOptions.KEEP_KEY_VALUE_DBL_QUOTE);
                $('#jfToolbar .x-fix-encoding').toggle(!!formatOptions.FIX_ERROR_ENCODING);

                if (formatOptions.ENABLE_JSON_KEY_SORT) {
                    $('#jfToolbar .x-sort').show();
                } else {
                    formatOptions.sortType = 0;
                    $('[name=jsonsort][value=0]').prop('checked', true);
                    $('#jfToolbar .x-sort').hide();
                    try {
                        localStorage.setItem(JSON_SORT_TYPE_KEY, 0);
                    } catch (e) {}
                }

                if (opts.reformat) {
                    _didFormat();
                }
            };

            const liveCheckboxOptions = {
                alwaysOn: {key: 'JSON_PAGE_FORMAT', reformat: false},
                alwaysShowToolbar: {key: 'JSON_TOOL_BAR_ALWAYS_SHOW', reformat: false},
                alwaysShowStatusbar: {key: 'STATUS_BAR_ALWAYS_SHOW', reformat: false},
                autoDecode: {key: 'AUTO_TEXT_DECODE', reformat: true},
                errorEncoding: {key: 'FIX_ERROR_ENCODING', reformat: false},
                enableSort: {key: 'ENABLE_JSON_KEY_SORT', reformat: true},
                nestedParse: {key: 'NESTED_ESCAPE_PARSE', reformat: true},
                keepQuote: {key: 'KEEP_KEY_VALUE_DBL_QUOTE', reformat: false}
            };

            sPanel.find('input[type="checkbox"]').on('change', function () {
                let config = liveCheckboxOptions[this.name];
                if (!config) {
                    return;
                }
                let params = {};
                params[config.key] = $(this).prop('checked');
                applyPanelOptions(params, {reformat: config.reformat});
                savePanelOptions(params);
            });

            sPanel.find('input[name="maxlength"]').on('change', function () {
                let value = parseInt($(this).val(), 10) || 10000;
                $(this).val(value);
                let params = {MAX_JSON_KEYS_NUMBER: value};
                applyPanelOptions(params);
                savePanelOptions(params);
            });

            sPanel.find('input[name="skinId"]').on('change', function () {
                let params = {JSON_FORMAT_THEME: parseInt(this.value, 10) || 0};
                applyPanelOptions(params, {reformat: true});
                savePanelOptions(params);
            });

            sPanel.find('input[type="submit"]').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                let formData = collectPanelOptions();
                applyPanelOptions(formData, {reformat: true});
                savePanelOptions(formData);
                sPanel.hide();
            });

            sPanel.find('input[name="close"]').on('click', () => sPanel.hide());
            sPanel.find('.setting-donate-link').on('click', _openDonateModal);

        } else if (sPanel[0].offsetHeight) {
            return sPanel.hide();
        } else {
            sPanel.show();
        }

        _getAllOptions(result => {
            sPanel.find('input[name="alwaysOn"]').prop('checked', !!result.JSON_PAGE_FORMAT);
            sPanel.find('input[name="alwaysShowToolbar"]').prop('checked', !!result.JSON_TOOL_BAR_ALWAYS_SHOW);
            sPanel.find('input[name="alwaysShowStatusbar"]').prop('checked', !!result.STATUS_BAR_ALWAYS_SHOW);
            sPanel.find('input[name="autoDecode"]').prop('checked', !!result.AUTO_TEXT_DECODE);
            sPanel.find('input[name="errorEncoding"]').prop('checked', !!result.FIX_ERROR_ENCODING);
            sPanel.find('input[name="enableSort"]').prop('checked', !!result.ENABLE_JSON_KEY_SORT);
            sPanel.find('input[name="nestedParse"]').prop('checked', !!result.NESTED_ESCAPE_PARSE);
            sPanel.find('input[name="keepQuote"]').prop('checked', !!result.KEEP_KEY_VALUE_DBL_QUOTE);
            sPanel.find('input[name="maxlength"]').val(result.MAX_JSON_KEYS_NUMBER || 10000);
            sPanel.find('input[name="skinId"]').prop('checked', false);
            sPanel.find(`input[name="skinId"][value="${result.JSON_FORMAT_THEME || 0}"]`).prop('checked', true);
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
        showToolBar = formatOptions.JSON_TOOL_BAR_ALWAYS_SHOW;
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

        _syncFormatterEscapeState();

        // =============================乱码修正
        if (!formatOptions.FIX_ERROR_ENCODING) {
            $('#jfToolbar .x-fix-encoding').hide();
        }

        // =============================工具栏的显示与隐藏控制
        let tgBtn = $('.fe-feedback #toggleBtn');
        _applyToolbarDisplayState();
        tgBtn.click(function (e) {
            e.preventDefault();
            e.stopPropagation();

            showToolBar = !showToolBar;
            formatOptions.JSON_TOOL_BAR_ALWAYS_SHOW = showToolBar;
            _applyToolbarDisplayState();
        });
        
        $('.fe-feedback .x-other-tools').on('click', function (e) {
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-options-page'
            });
        });

        $('.fe-feedback .x-settings').click(e => _createSettingPanel());
        $('#jsonGetCorrectCnt').click(e => _getCorrectContent());

        $('.x-toolbar .x-donate-link').on('click', _openDonateModal);
        
    };

    let _didFormat = function () {
        let source = formatOptions.originalSource;

        if (formatOptions.sortType !== 0) {
            let parsed = _parseJsonLike(formatOptions.originalSource);
            let jsonObj = JsonABC.sortObj(parsed.value, parseInt(formatOptions.sortType), true);
            source = _stringifyJsonForFormatter(jsonObj);
        }

        let elBody = $('body');

        let theme = _getResolvedTheme();
        Object.values(SKIN_THEME).forEach(th => elBody.removeClass(th));
        elBody.addClass(theme);
        _applyUiMode();
        _applyCompactMode();

        // 控制引号
        if (formatOptions.KEEP_KEY_VALUE_DBL_QUOTE) {
            elBody.removeClass('remove-quote');
        } else {
            elBody.addClass('remove-quote');
        }

        // 控制底部状态栏
        _syncFormatterStatusBarState();

        // 检查是否在受限域名，直接使用同步模式
        const currentUrl = window.location.href;
        const restrictedDomains = ['gitee.com', 'github.com', 'raw.githubusercontent.com'];
        const isRestrictedDomain = restrictedDomains.some(domain => currentUrl.includes(domain));
        
        if (isRestrictedDomain) {
            console.log('检测到受限域名，直接使用同步模式');
            (async () => {
                source = await _prepareSourceForFormatter(source);
                Formatter.formatSync(source, theme, formatOptions.NESTED_ESCAPE_PARSE);
                _syncFormatterStatusBarState();
                $('#jfToolbar').show();
            })();
        } else {
            (async () => {
                source = await _prepareSourceForFormatter(source);
                // 格式化
                try {
                    await Formatter.format(source, theme, formatOptions.NESTED_ESCAPE_PARSE);
                } catch (e) {
                    console.warn('异步格式化失败，使用同步模式:', e);
                    Formatter.formatSync(source, theme, formatOptions.NESTED_ESCAPE_PARSE);
                }
                _syncFormatterStatusBarState();
                $('#jfToolbar').show();
            })();
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
        
        // 埋点：自动触发json-format-auto
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'statistics-tool-usage',
            params: {
                tool_name: 'json-format',
                url: location.href
            }
        });
        
    };

    let _getCorrectContent = function () {
        fetch(location.href).then(res => res.text()).then(text => {
            formatOptions.originalSource = text;
            _didFormat();
        });
    };

    /**
     * 从一个dom节点去获取json内容，这里面有很多的判断
     */
    let _getJsonContentFromDOM = function (dom, parseOptions) {
        if (!document.body) {
            return false;
        }

        let candidates = [];
        let seen = new Set();
        let addCandidate = text => {
            text = (text || '').trim();
            if (text && !seen.has(text)) {
                seen.add(text);
                candidates.push(text);
            }
        };
        let isVisibleElement = elm => elm && elm.nodeType === Node.ELEMENT_NODE && (elm.offsetHeight + elm.offsetWidth !== 0);

        addCandidate(dom && dom.textContent);

        let directText = '';
        Array.from(document.body.childNodes).forEach(elm => {
            if (elm.nodeType === Node.TEXT_NODE) {
                directText += elm.textContent || '';
            }
        });
        addCandidate(directText);

        Array.from(document.querySelectorAll('body>pre')).forEach(elm => addCandidate(elm.textContent));

        if (document.contentType === 'application/json') {
            addCandidate(document.body.innerText);
            Array.from(document.body.children).forEach(elm => {
                const tagName = elm.tagName.toLowerCase();
                if (!['script', 'style', 'link'].includes(tagName) && isVisibleElement(elm)) {
                    addCandidate(elm.innerText || elm.textContent);
                }
            });
        }

        addCandidate(document.body.textContent);

        for (let i = 0; i < candidates.length; i++) {
            if (_parseJsonLike(candidates[i], parseOptions)) {
                return candidates[i];
            }
        }

        return false;
    };

    /**
     * 从页面提取JSON文本
     * @returns {string}
     * @private
     */
    let _getJsonText = function () {
        // 如果是js内容，则不进行json格式化
        let isJs = /\.js$/.test(new URL(location.href).pathname);
        isJs = isJs && document.contentType === 'application/javascript';
        if (isJs) {
            return false;
        }

        // 如果是 HTML 页面，也要看一下内容是不是明显就是个JSON，如果不是，则也不进行 json 格式化
        if (document.contentType === 'text/html' && document.body) {
            // 使用 DOMParser 解析 HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(document.body.outerHTML, "text/html");
            // 移除不需要的标签
            doc.querySelectorAll('style, script').forEach(el => el.remove());
            // 获取清理后的文本
            const cleanText = doc.body.textContent;
            const htmlParseOptions = { allowExtractJSONFragment: false };
            let jsonObj = _getJsonObject(cleanText, htmlParseOptions);
            if(!jsonObj) {
                return false;
            }
            let pre = document.querySelectorAll('body>pre')[0] || {textContent: ""};
            return _getJsonContentFromDOM(pre, htmlParseOptions);
        }

        let pre = document.querySelectorAll('body>pre')[0] || {textContent: ""};
        
        return _getJsonContentFromDOM(pre);
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
        formatOptions.AUTO_DARK_MODE = _isEnabledSetting(formatOptions.AUTO_DARK_MODE);
        formatOptions.ALWAYS_DARK_MODE = _isEnabledSetting(formatOptions.ALWAYS_DARK_MODE);
        if (options.hasOwnProperty('AUTO_TEXT_DECODE')) {
            formatOptions.autoDecode = !!options.AUTO_TEXT_DECODE;
        } else if (formatOptions.hasOwnProperty('AUTO_TEXT_DECODE')) {
            formatOptions.autoDecode = !!formatOptions.AUTO_TEXT_DECODE;
        }
        if (options.hasOwnProperty('NESTED_ESCAPE_PARSE')) {
            formatOptions.NESTED_ESCAPE_PARSE = !!options.NESTED_ESCAPE_PARSE;
        } else if (formatOptions.hasOwnProperty('NESTED_ESCAPE_PARSE')) {
            formatOptions.NESTED_ESCAPE_PARSE = !!formatOptions.NESTED_ESCAPE_PARSE;
        }
        if (options.hasOwnProperty('JSON_FORMAT_COMPACT_MODE')) {
            formatOptions.JSON_FORMAT_COMPACT_MODE = !!options.JSON_FORMAT_COMPACT_MODE;
        } else if (formatOptions.hasOwnProperty('JSON_FORMAT_COMPACT_MODE')) {
            formatOptions.JSON_FORMAT_COMPACT_MODE = !!formatOptions.JSON_FORMAT_COMPACT_MODE;
        }
        if (options.hasOwnProperty('FH_UI_MODE')) {
            formatOptions.FH_UI_MODE = String(options.FH_UI_MODE || '').toLowerCase() === 'omni' ? 'omni' : 'lite';
        } else if (!formatOptions.FH_UI_MODE) {
            formatOptions.FH_UI_MODE = 'lite';
        }
        if (options.hasOwnProperty('JSON_FORMAT_UI_MODE')) {
            formatOptions.JSON_FORMAT_UI_MODE = String(options.JSON_FORMAT_UI_MODE || '').toLowerCase() === 'omni' ? 'omni' : 'lite';
        } else if (!formatOptions.JSON_FORMAT_UI_MODE) {
            formatOptions.JSON_FORMAT_UI_MODE = formatOptions.FH_UI_MODE || 'lite';
        }
    };

    let _prefersColorSchemeDark = () => {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        } catch (e) {
            return false;
        }
    };

    let _shouldUseAutoDarkTheme = () => {
        if (_isEnabledSetting(formatOptions.ALWAYS_DARK_MODE)) {
            return true;
        }
        if (!_isEnabledSetting(formatOptions.AUTO_DARK_MODE)) {
            return false;
        }
        return _prefersColorSchemeDark();
    };

    let _getResolvedTheme = () => {
        let themeKey = String(formatOptions.JSON_FORMAT_THEME || 0);
        if (themeKey === '0' && _shouldUseAutoDarkTheme()) {
            themeKey = '3';
        }
        return SKIN_THEME[themeKey] || SKIN_THEME[0];
    };

    let _bindDarkModePreferenceListener = () => {
        if (darkModePreferenceBound || !window.matchMedia) {
            return;
        }
        darkModePreferenceBound = true;

        try {
            let mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            let refreshTheme = () => {
                if (_isEnabledSetting(formatOptions.AUTO_DARK_MODE) && String(formatOptions.JSON_FORMAT_THEME || 0) === '0') {
                    _didFormat();
                }
            };

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', refreshTheme);
            } else if (mediaQuery.addListener) {
                mediaQuery.addListener(refreshTheme);
            }
        } catch (e) {}
    };


    /**
     * 判断字符串参数是否为一个合法的json，如果是则返回json对象
     * @param {*} source 
     * @returns 
     */
    let _getJsonObject = function (source, parseOptions) {
        let parsed = _parseJsonLike(source, parseOptions);
        if (!parsed) {
            return;
        }
        funcName = parsed.funcName;
        fnTry = parsed.fnTry;
        fnCatch = parsed.fnCatch;
        return parsed.value;
    };

    /**
     * 根据最终拿到的json source，对页面进行格式化操作
     * @param {*} source 
     * @returns 
     */
    let _formatTheSource = function (source) {
        let jsonObj = _getJsonObject(source);

        // 是json格式，可以进行JSON自动格式化
        if (jsonObj != null && typeof jsonObj === "object") {

            // 提前注入css
            if(!cssInjected) {
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing:'inject-content-css',
                    tool: 'json-format'
                });
                cssInjected = true;
            }

            // JSON的所有key不能超过预设的值，比如 10000 个，要不然自动格式化会比较卡
            if (formatOptions['MAX_JSON_KEYS_NUMBER']) {
                let keysCount = _getAllKeysCount(jsonObj);
                if (keysCount > formatOptions['MAX_JSON_KEYS_NUMBER']) {
                    let msg = '当前JSON共 <b style="color:red">' + keysCount + '</b> 个Key，大于预设值' + formatOptions['MAX_JSON_KEYS_NUMBER'] + '，已取消自动格式化；可到FeHelper设置页调整此配置！';
                    return toast(msg);
                }
            }

            document.documentElement.classList.add('fh-jf');
            _mountFormatterShell();

            formatOptions.originalSource = _stringifyJsonForFormatter(jsonObj);

            // 确保从storage加载最新设置
            _getAllOptions(options => {
                _extendsOptions(options);
                _bindDarkModePreferenceListener();
                _initToolbar();
                _didFormat();
            });
        }
    };

    /**
     * 执行format操作
     * @private
     */
    let _format = function () {

        let source = _getJsonText();
        if (source) {
            _formatTheSource(source);
        }
    };

    // 页面加载后自动采集
    try {
        if (window.chrome && chrome.runtime && chrome.runtime.sendMessage && window.Awesome && window.Awesome.collectAndSendClientInfo) {
            window.Awesome.collectAndSendClientInfo();
        } else {
            // fallback: 动态加载Awesome模块
            import(chrome.runtime.getURL('background/awesome.js')).then(module => {
                module.default.collectAndSendClientInfo();
            }).catch(() => {});
        }
    } catch(e) {}

    return {
        format: () => _getAllOptions(options => {
            if(options.JSON_PAGE_FORMAT) {
                let intervalId = setTimeout(() => {
                    if(typeof Formatter !== 'undefined') {
                        clearInterval(intervalId);
                        // 加载所有保存的配置
                        _extendsOptions(options);
                        // 应用格式化
                        _format();
                    }
                },pleaseLetJsLoaded);
            }
        })
    };
})();


if(location.protocol !== 'chrome-extension:') {
    (async () => {
        await window.JsonAutoFormat.format();
    })();
}
}
