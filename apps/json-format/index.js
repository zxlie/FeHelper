/**
 * FeHelper Json Format Tools
 */

// 一些全局变量
let editor = {};
let LOCAL_KEY_OF_LAYOUT = 'local-layout-key';
let JSON_LINT = 'jsonformat:json-lint-switch';
let EDIT_ON_CLICK = 'jsonformat:edit-on-click';
let AUTO_DECODE = 'jsonformat:auto-decode';

new Vue({
    el: '#pageContainer',
    data: {
        defaultResultTpl: '<div class="x-placeholder"><img src="../json-format/json-demo.jpg" alt="json-placeholder"></div>',
        placeHolder: '',
        jsonFormattedSource: '',
        errorMsg: '',
        errorJsonCode: '',
        errorPos: '',
        jfCallbackName_start: '',
        jfCallbackName_end: '',
        jsonLintSwitch: true,
        autoDecode: false,
        fireChange: true,
        overrideJson: false,
        isInUSAFlag: false,
        autoUnpackJsonString: false,
        // JSONPath查询相关
        jsonPathQuery: '',
        showJsonPathModal: false,
        showJsonPathExamplesModal: false,
        jsonPathResults: [],
        jsonPathError: '',
        copyButtonState: 'normal', // normal, copying, success, error
        jsonPathExamples: [
            { path: '$', description: '根对象' },
            { path: '$.data', description: '获取data属性' },
            { path: '$.data.*', description: '获取data下的所有属性' },
            { path: '$.data[0]', description: '获取data数组的第一个元素' },
            { path: '$.data[*]', description: '获取data数组的所有元素' },
            { path: '$.data[?(@.name)]', description: '获取data数组中有name属性的元素' },
            { path: '$..name', description: '递归查找所有name属性' },
            { path: '$.data[0:3]', description: '获取data数组的前3个元素' },
            { path: '$.data[-1]', description: '获取data数组的最后一个元素' },
            { path: '$.*.price', description: '获取所有子对象的price属性' }
        ]
    },
    mounted: function () {
        // 自动开关灯控制
        DarkModeMgr.turnLightAuto();

        this.placeHolder = this.defaultResultTpl;

        // 安全获取localStorage值（在沙盒环境中可能不可用）
        this.autoDecode = this.safeGetLocalStorage(AUTO_DECODE) === 'true';

        this.isInUSAFlag = this.isInUSA();

        this.jsonLintSwitch = (this.safeGetLocalStorage(JSON_LINT) !== 'false');
        this.overrideJson = (this.safeGetLocalStorage(EDIT_ON_CLICK) === 'true');
        this.changeLayout(this.safeGetLocalStorage(LOCAL_KEY_OF_LAYOUT));

        editor = CodeMirror.fromTextArea(this.$refs.jsonBox, {
            mode: "text/javascript",
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            lineWrapping: true
        });

        //输入框聚焦
        editor.focus();

        // 格式化以后的JSON，点击以后可以重置原内容
        window._OnJsonItemClickByFH = (jsonTxt) => {
            if (this.overrideJson) {
                this.disableEditorChange(jsonTxt);
            }
        };
        editor.on('change', (editor, changes) => {
            this.jsonFormattedSource = editor.getValue().replace(/\n/gm, ' ');
            this.fireChange && this.format();
        });

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        if (location.protocol === 'chrome-extension:') {
            chrome.tabs.query({currentWindow: true,active: true, }, (tabs) => {
                let activeTab = tabs.filter(tab => tab.active)[0];
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'request-page-content',
                    tabId: activeTab.id
                }).then(resp => {
                    if(!resp || !resp.content) return ;
                    editor.setValue(resp.content || '');
                    this.format();
                });
            });
        }

        // 页面加载时自动获取并注入json-format页面的补丁
        this.loadPatchHotfix();
    },
    methods: {
        // 安全获取localStorage值（在沙盒环境中可能不可用）
        safeGetLocalStorage(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage不可用，使用默认值:', key);
                return null;
            }
        },

        // 安全设置localStorage值（在沙盒环境中可能不可用）
        safeSetLocalStorage(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn('localStorage不可用，跳过保存:', key);
            }
        },

        loadPatchHotfix() {
            // 页面加载时自动获取并注入页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'json-format'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js) {
                        try {
                            if (window.evalCore && window.evalCore.getEvalInstance) {
                                window.evalCore.getEvalInstance(window)(patch.js);
                            }
                        } catch (e) {
                            console.error('json-format补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        isInUSA: function () {
            // 通过时区判断是否在美国
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const isUSTimeZone = /^America\/(New_York|Chicago|Denver|Los_Angeles|Anchorage|Honolulu)/.test(timeZone);

            // 通过语言判断
            const language = navigator.language || navigator.userLanguage;
            const isUSLanguage = language.toLowerCase().indexOf('en-us') > -1;

            // 如果时区和语言都符合美国特征,则认为在美国
            return (isUSTimeZone && isUSLanguage);
        },

        format: function () {
            this.errorMsg = '';
            this.placeHolder = this.defaultResultTpl;
            this.jfCallbackName_start = '';
            this.jfCallbackName_end = '';

            let source = editor.getValue().replace(/\n/gm, ' ');
            if (!source) {
                return false;
            }

            // JSONP形式下的callback name
            let funcName = null;
            // json对象
            let jsonObj = null;

            // 下面校验给定字符串是否为一个合法的json
            try {
                // 再看看是不是jsonp的格式
                let reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/igm;
                let matches = reg.exec(source);
                if (matches != null) {
                    funcName = matches[1];
                    source = matches[2];
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
                        this.errorMsg = exxx.message;
                    }
                }
            }

            try{
                // 这里多做一个动作，给没有携带双引号的Key都自动加上，防止Long类型失真
                const regex = /([{,]\s*)(\w+)(\s*:)/g;
                source = source.replace(regex, '$1"$2"$3');
                jsonObj = JSON.parse(source);
            }catch(e){
                // 这里什么动作都不需要做，这种情况下转换失败的，肯定是Value被污染了，抛弃即可
            }

            // 新增：自动解包嵌套JSON字符串
            if (this.autoUnpackJsonString && jsonObj != null && typeof jsonObj === 'object') {
                jsonObj = deepParseJSONStrings(jsonObj);
                source = JSON.stringify(jsonObj);
            }

            // 是json格式，可以进行JSON自动格式化
            if (jsonObj != null && typeof jsonObj === "object" && !this.errorMsg.length) {
                try {
                    let sortType = document.querySelectorAll('[name=jsonsort]:checked')[0].value;
                    if (sortType !== '0') {
                        jsonObj = JsonABC.sortObj(jsonObj, parseInt(sortType), true);
                    }
                    source = JSON.stringify(jsonObj);
                } catch (ex) {
                    // 通过JSON反解不出来的，一定有问题
                    this.errorMsg = ex.message;
                }

                if (!this.errorMsg.length) {

                    if (this.autoDecode) {
                        (async () => {
                            let txt = await JsonEnDecode.urlDecodeByFetch(source);
                            source = JsonEnDecode.uniDecode(txt);
                            await Formatter.format(source);
                        })();
                    } else {
                        (async () => {
                            await Formatter.format(source);
                        })();
                    }

                    this.placeHolder = '';
                    this.jsonFormattedSource = source;

                    // 如果是JSONP格式的，需要把方法名也显示出来
                    if (funcName != null) {
                        this.jfCallbackName_start = funcName + '(';
                        this.jfCallbackName_end = ')';
                    } else {
                        this.jfCallbackName_start = '';
                        this.jfCallbackName_end = '';
                    }

                    this.$nextTick(() => {
                        this.updateWrapperHeight();
                    })
                }
            }

            if (this.errorMsg.length) {
                if (this.jsonLintSwitch) {
                    return this.lintOn();
                } else {
                    this.placeHolder = '<span class="x-error">' + this.errorMsg + '</span>';
                    return false;
                }
            }

            return true;
        },

        compress: function () {
            if (this.format()) {
                let jsonTxt = this.jfCallbackName_start + this.jsonFormattedSource + this.jfCallbackName_end;
                this.disableEditorChange(jsonTxt);
            }
        },

        autoDecodeFn: function () {
            this.$nextTick(() => {
                this.safeSetLocalStorage(AUTO_DECODE, this.autoDecode);
                this.format();
            });
        },

        uniEncode: function () {
            editor.setValue(JsonEnDecode.uniEncode(editor.getValue()));
        },

        uniDecode: function () {
            editor.setValue(JsonEnDecode.uniDecode(editor.getValue()));
        },

        urlDecode: function () {
            JsonEnDecode.urlDecodeByFetch(editor.getValue()).then(text => editor.setValue(text));
        },

        updateWrapperHeight: function () {
            let curLayout = this.safeGetLocalStorage(LOCAL_KEY_OF_LAYOUT);
            let elPc = document.querySelector('#pageContainer');
            if (curLayout === 'up-down') {
                elPc.style.height = 'auto';
            } else {
                elPc.style.height = Math.max(elPc.scrollHeight, document.body.scrollHeight) + 'px';
            }
        },

        changeLayout: function (type) {
            let elPc = document.querySelector('#pageContainer');
            if (type === 'up-down') {
                elPc.classList.remove('layout-left-right');
                elPc.classList.add('layout-up-down');
                this.$refs.btnLeftRight.classList.remove('selected');
                this.$refs.btnUpDown.classList.add('selected');
            } else {
                elPc.classList.remove('layout-up-down');
                elPc.classList.add('layout-left-right');
                this.$refs.btnLeftRight.classList.add('selected');
                this.$refs.btnUpDown.classList.remove('selected');
            }
            this.safeSetLocalStorage(LOCAL_KEY_OF_LAYOUT, type);
            this.updateWrapperHeight();
        },

        setCache: function () {
            this.$nextTick(() => {
                this.safeSetLocalStorage(EDIT_ON_CLICK, this.overrideJson);
            });
        },

        lintOn: function () {
            this.$nextTick(() => {
                this.safeSetLocalStorage(JSON_LINT, this.jsonLintSwitch);
            });
            if (!editor.getValue().trim()) {
                return true;
            }
            this.$nextTick(() => {
                if (!this.jsonLintSwitch) {
                    return;
                }
                let lintResult = JsonLint.lintDetect(editor.getValue());
                if (!isNaN(lintResult.line)) {
                    this.placeHolder = '<div id="errorTips">' +
                        '<div id="tipsBox">错误位置：' + (lintResult.line + 1) + '行，' + (lintResult.col + 1) + '列；缺少字符或字符不正确</div>' +
                        '<div id="errorCode">' + lintResult.dom + '</div></div>';
                }
            });
            return false;
        },

        disableEditorChange: function (jsonTxt) {
            this.fireChange = false;
            this.$nextTick(() => {
                editor.setValue(jsonTxt);
                this.$nextTick(() => {
                    this.fireChange = true;
                })
            })
        },

        openOptionsPage: function(event){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },

        openDonateModal: function(event){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'json-format' }
            });
        },

        setDemo: function () {
            let demo = '{"BigIntSupported":995815895020119788889,"date":"20180322","url":"https://www.baidu.com?wd=fehelper","img":"http://gips0.baidu.com/it/u=1490237218,4115737545&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=720","message":"Success !","status":200,"city":"北京","count":632,"data":{"shidu":"34%","pm25":73,"pm10":91,"quality":"良","wendu":"5","ganmao":"极少数敏感人群应减少户外活动","yesterday":{"date":"21日星期三","sunrise":"06:19","high":"高温 11.0℃","low":"低温 1.0℃","sunset":"18:26","aqi":85,"fx":"南风","fl":"<3级","type":"多云","notice":"阴晴之间，谨防紫外线侵扰"},"forecast":[{"date":"22日星期四","sunrise":"06:17","high":"高温 17.0℃","low":"低温 1.0℃","sunset":"18:27","aqi":98,"fx":"西南风","fl":"<3级","type":"晴","notice":"愿你拥有比阳光明媚的心情"},{"date":"23日星期五","sunrise":"06:16","high":"高温 18.0℃","low":"低温 5.0℃","sunset":"18:28","aqi":118,"fx":"无持续风向","fl":"<3级","type":"多云","notice":"阴晴之间，谨防紫外线侵扰"},{"date":"24日星期六","sunrise":"06:14","high":"高温 21.0℃","low":"低温 7.0℃","sunset":"18:29","aqi":52,"fx":"西南风","fl":"<3级","type":"晴","notice":"愿你拥有比阳光明媚的心情"},{"date":"25日星期日","sunrise":"06:13","high":"高温 22.0℃","low":"低温 7.0℃","sunset":"18:30","aqi":71,"fx":"西南风","fl":"<3级","type":"晴","notice":"愿你拥有比阳光明媚的心情"},{"date":"26日星期一","sunrise":"06:11","high":"高温 21.0℃","low":"低温 8.0℃","sunset":"18:31","aqi":97,"fx":"西南风","fl":"<3级","type":"多云","notice":"阴晴之间，谨防紫外线侵扰"}]}}';
            editor.setValue(demo);
            this.$nextTick(() => {
                this.format();
            })
        },

        autoUnpackJsonStringFn: function () {
            this.$nextTick(() => {
                this.safeSetLocalStorage('jsonformat:auto-unpack-json-string', this.autoUnpackJsonString);
                this.format();
            });
        },

        // JSONPath查询功能
        executeJsonPath: function() {
            this.jsonPathError = '';
            this.jsonPathResults = [];

            if (!this.jsonPathQuery.trim()) {
                this.jsonPathError = '请输入JSONPath查询表达式';
                return;
            }

            let source = this.jsonFormattedSource || editor.getValue();
            if (!source.trim()) {
                this.jsonPathError = '请先输入JSON数据';
                return;
            }

            try {
                let jsonObj = JSON.parse(source);
                this.jsonPathResults = this.queryJsonPath(jsonObj, this.jsonPathQuery.trim());
                this.showJsonPathModal = true;
            } catch (error) {
                this.jsonPathError = 'JSON格式错误：' + error.message;
                this.showJsonPathModal = true;
            }
        },

        // JSONPath查询引擎
        queryJsonPath: function(obj, path) {
            let results = [];
            
            try {
                // 简化的JSONPath解析器
                if (path === '$') {
                    results.push({ path: '$', value: obj });
                    return results;
                }

                // 移除开头的$
                if (path.startsWith('$.')) {
                    path = path.substring(2);
                } else if (path.startsWith('$')) {
                    path = path.substring(1);
                }

                // 执行查询
                this.evaluateJsonPath(obj, path, '$', results);
                
            } catch (error) {
                throw new Error('JSONPath表达式错误：' + error.message);
            }

            return results;
        },

        // 递归评估JSONPath
        evaluateJsonPath: function(current, path, currentPath, results) {
            if (!path) {
                results.push({ path: currentPath, value: current });
                return;
            }

            // 处理递归搜索 ..
            if (path.startsWith('..')) {
                let remainPath = path.substring(2);
                this.recursiveSearch(current, remainPath, currentPath, results);
                return;
            }

            // 解析下一个路径片段
            let match;
            
            // 处理数组索引 [index] 或 [*] 或 [start:end]
            if ((match = path.match(/^\[([^\]]+)\](.*)$/))) {
                let indexExpr = match[1];
                let remainPath = match[2];
                
                if (!Array.isArray(current)) {
                    return;
                }

                if (indexExpr === '*') {
                    // 通配符：所有元素
                    current.forEach((item, index) => {
                        this.evaluateJsonPath(item, remainPath, currentPath + '[' + index + ']', results);
                    });
                } else if (indexExpr.includes(':')) {
                    // 数组切片 [start:end]
                    let [start, end] = indexExpr.split(':').map(s => s.trim() === '' ? undefined : parseInt(s));
                    let sliced = current.slice(start, end);
                    sliced.forEach((item, index) => {
                        let actualIndex = (start || 0) + index;
                        this.evaluateJsonPath(item, remainPath, currentPath + '[' + actualIndex + ']', results);
                    });
                } else if (indexExpr.startsWith('?(')) {
                    // 过滤表达式 [?(@.prop)]
                    current.forEach((item, index) => {
                        if (this.evaluateFilter(item, indexExpr)) {
                            this.evaluateJsonPath(item, remainPath, currentPath + '[' + index + ']', results);
                        }
                    });
                } else {
                    // 具体索引
                    let index = parseInt(indexExpr);
                    if (index < 0) {
                        index = current.length + index; // 负索引
                    }
                    if (index >= 0 && index < current.length) {
                        this.evaluateJsonPath(current[index], remainPath, currentPath + '[' + index + ']', results);
                    }
                }
                return;
            }

            // 处理属性访问 .property 或直接属性名
            if ((match = path.match(/^\.?([^.\[]+)(.*)$/))) {
                let prop = match[1];
                let remainPath = match[2];
                
                if (prop === '*') {
                    // 通配符：所有属性
                    if (typeof current === 'object' && current !== null) {
                        Object.keys(current).forEach(key => {
                            this.evaluateJsonPath(current[key], remainPath, currentPath + '.' + key, results);
                        });
                    }
                } else {
                    // 具体属性
                    if (typeof current === 'object' && current !== null && current.hasOwnProperty(prop)) {
                        this.evaluateJsonPath(current[prop], remainPath, currentPath + '.' + prop, results);
                    }
                }
                return;
            }

            // 处理方括号属性访问 ['property']
            if ((match = path.match(/^\['([^']+)'\](.*)$/))) {
                let prop = match[1];
                let remainPath = match[2];
                
                if (typeof current === 'object' && current !== null && current.hasOwnProperty(prop)) {
                    this.evaluateJsonPath(current[prop], remainPath, currentPath + "['" + prop + "']", results);
                }
                return;
            }

            // 如果没有特殊符号，当作属性名处理
            if (typeof current === 'object' && current !== null && current.hasOwnProperty(path)) {
                results.push({ path: currentPath + '.' + path, value: current[path] });
            }
        },

        // 递归搜索
        recursiveSearch: function(current, targetProp, currentPath, results) {
            if (typeof current === 'object' && current !== null) {
                // 检查当前对象的属性
                if (current.hasOwnProperty(targetProp)) {
                    results.push({ path: currentPath + '..' + targetProp, value: current[targetProp] });
                }
                
                // 递归搜索子对象
                Object.keys(current).forEach(key => {
                    if (Array.isArray(current[key])) {
                        current[key].forEach((item, index) => {
                            this.recursiveSearch(item, targetProp, currentPath + '.' + key + '[' + index + ']', results);
                        });
                    } else if (typeof current[key] === 'object' && current[key] !== null) {
                        this.recursiveSearch(current[key], targetProp, currentPath + '.' + key, results);
                    }
                });
            }
        },

        // 简单的过滤器评估
        evaluateFilter: function(item, filterExpr) {
            // 简化的过滤器实现，只支持基本的属性存在性检查
            // 如 ?(@.name) 检查是否有name属性
            let match = filterExpr.match(/^\?\(@\.(\w+)\)$/);
            if (match) {
                let prop = match[1];
                return typeof item === 'object' && item !== null && item.hasOwnProperty(prop);
            }
            
            // 支持简单的比较 ?(@.age > 18)
            match = filterExpr.match(/^\?\(@\.(\w+)\s*([><=!]+)\s*(.+)\)$/);
            if (match) {
                let prop = match[1];
                let operator = match[2];
                let value = match[3];
                
                if (typeof item === 'object' && item !== null && item.hasOwnProperty(prop)) {
                    let itemValue = item[prop];
                    let compareValue = isNaN(value) ? value.replace(/['"]/g, '') : parseFloat(value);
                    
                    switch (operator) {
                        case '>': return itemValue > compareValue;
                        case '<': return itemValue < compareValue;
                        case '>=': return itemValue >= compareValue;
                        case '<=': return itemValue <= compareValue;
                        case '==': return itemValue == compareValue;
                        case '!=': return itemValue != compareValue;
                    }
                }
            }
            
            return false;
        },

        // 显示JSONPath示例
        showJsonPathExamples: function() {
            this.showJsonPathExamplesModal = true;
        },

        // 使用JSONPath示例
        useJsonPathExample: function(path) {
            this.jsonPathQuery = path;
            this.closeJsonPathExamplesModal();
        },

        // 打开JSONPath查询模态框
        openJsonPathModal: function() {
            this.showJsonPathModal = true;
            // 清空之前的查询结果
            this.jsonPathResults = [];
            this.jsonPathError = '';
            this.copyButtonState = 'normal';
        },

        // 关闭JSONPath结果模态框
        closeJsonPathModal: function() {
            this.showJsonPathModal = false;
            this.copyButtonState = 'normal'; // 重置复制按钮状态
        },

        // 关闭JSONPath示例模态框
        closeJsonPathExamplesModal: function() {
            this.showJsonPathExamplesModal = false;
        },

        // 格式化JSONPath查询结果
        formatJsonPathResult: function(value) {
            if (typeof value === 'object') {
                return JSON.stringify(value, null, 2);
            }
            return String(value);
        },

        // 复制JSONPath查询结果
        copyJsonPathResults: function() {
            let resultText = this.jsonPathResults.map(result => {
                return `路径: ${result.path}\n值: ${this.formatJsonPathResult(result.value)}`;
            }).join('\n\n');
            
            // 设置复制状态
            this.copyButtonState = 'copying';
            
            navigator.clipboard.writeText(resultText).then(() => {
                this.copyButtonState = 'success';
                setTimeout(() => {
                    this.copyButtonState = 'normal';
                }, 2000);
            }).catch(() => {
                // 兼容旧浏览器
                try {
                    let textArea = document.createElement('textarea');
                    textArea.value = resultText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    this.copyButtonState = 'success';
                    setTimeout(() => {
                        this.copyButtonState = 'normal';
                    }, 2000);
                } catch (error) {
                    this.copyButtonState = 'error';
                    setTimeout(() => {
                        this.copyButtonState = 'normal';
                    }, 2000);
                }
            });
        },

        // 下载JSONPath查询结果
        downloadJsonPathResults: function() {
            let resultText = this.jsonPathResults.map(result => {
                return `路径: ${result.path}\n值: ${this.formatJsonPathResult(result.value)}`;
            }).join('\n\n');
            
            // 基于JSONPath生成文件名
            let filename = this.generateFilenameFromPath(this.jsonPathQuery);
            
            let blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = filename + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },

        // 根据JSONPath生成文件名
        generateFilenameFromPath: function(path) {
            if (!path || path === '$') {
                return 'jsonpath_root';
            }
            
            // 移除开头的$和.
            let cleanPath = path.replace(/^\$\.?/, '');
            
            // 替换特殊字符为下划线，保留数字、字母、点号、中划线
            let filename = cleanPath
                .replace(/[\[\]]/g, '_')  // 方括号替换为下划线
                .replace(/[^\w\u4e00-\u9fa5.-]/g, '_')  // 特殊字符替换为下划线，保留中文
                .replace(/_{2,}/g, '_')   // 多个连续下划线合并为一个
                .replace(/^_|_$/g, '');   // 移除开头和结尾的下划线
            
            // 如果处理后为空，使用默认名称
            if (!filename) {
                return 'jsonpath_query';
            }
            
            // 限制文件名长度
            if (filename.length > 50) {
                filename = filename.substring(0, 50) + '_truncated';
            }
            
            return 'jsonpath_' + filename;
        },

        jumpToMockDataTool: function(event) {
            event.preventDefault();
            // 1. 先判断mock-data工具是否已安装
            // 方案：直接读取chrome.storage.local，判断DYNAMIC_TOOL:mock-data是否存在
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get('DYNAMIC_TOOL:mock-data', result => {
                    if (result && result['DYNAMIC_TOOL:mock-data']) {
                        // 已安装，直接打开mock-data工具
                        window.open('/mock-data/index.html', '_blank');
                    } else {
                        // 未安装，跳转到原href
                        window.open('/options/index.html?query=数据Mock工具', '_blank');
                    }
                });
            } else {
                // 兜底：如果无法访问chrome.storage，直接跳原href
                window.open('/options/index.html?query=数据Mock工具', '_blank');
            }
        }
    }
});

// 新增：递归解包嵌套JSON字符串的函数
function deepParseJSONStrings(obj) {
    if (Array.isArray(obj)) {
        return obj.map(deepParseJSONStrings);
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            const val = obj[key];
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    // 只递归对象或数组，且排除BigInt结构（如{s,e,c}）和纯数字
                    if (
                        typeof parsed === 'object' &&
                        parsed !== null &&
                        (Array.isArray(parsed) || Object.prototype.toString.call(parsed) === '[object Object]') &&
                        !(
                            parsed &&
                            typeof parsed.s === 'number' &&
                            typeof parsed.e === 'number' &&
                            Array.isArray(parsed.c) &&
                            Object.keys(parsed).length === 3
                        )
                    ) {
                        newObj[key] = deepParseJSONStrings(parsed);
                        continue;
                    }
                } catch (e) {}
            }
            newObj[key] = deepParseJSONStrings(val);
        }
        return newObj;
    }
    return obj;
}

