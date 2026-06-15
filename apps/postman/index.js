/**
 * FeHelper 简易版Postman
 */
import {
    copyInlineAiResult,
    createInlineAiState,
    getInlineAiTaskFromUrl,
    renderInlineMarkdown,
    resetInlineAiState,
    runInlineToolAi,
    setInlineAiGuide
} from '../aiagent/fh.ai-inline.js';

const JSON_SORT_TYPE_KEY = 'json_sort_type_key';
new Vue({
    el: '#pageContainer',
    data: {
        urlContent: '',
        methodContent: 'GET',
        resultContent: '',
        funcName: '',
        paramContent: '',
        responseHeaders: [],
        responseStatus: '',
        jfCallbackName_start: '',
        jfCallbackName_end: '',
        errorMsgForJson: '',
        originalJsonStr: '',
        headerList: [new Date() * 1],
        urlencodedDefault: 1,
        urlParams: [],
        paramMode:'kv', // kv、json
        aiPanel: createInlineAiState()
    },

    computed: {
        // 计算属性：根据当前参数内容格式返回按钮文字
        paramModeText() {
            return this.detectParamFormat() === 'kv' ? 'JSON' : 'URL-KV';
        },
        aiPanelResultHtml() {
            return renderInlineMarkdown(this.aiPanel.result);
        }
    },

    watch: {
        urlContent: function (val) {
            let url = val;
            let reg = /[?&]([^?&#]+)=([^?&#]*)/g;
            let params = [];
            let ret = reg.exec(url);
            while (ret) {
                params.push({
                    key: ret[1],
                    value: ret[2],
                });
                ret = reg.exec(url);
            }
            const originStr = this.urlParams2String(params);
            const newStr = this.urlParams2String(this.urlParams);
            if (originStr !== newStr) {
                this.urlParams = params;
            }
        },
        urlParams: {
            handler(val) {
              this.urlContent =
                this.urlContent.substr(0, this.urlContent.indexOf("?") + 1) +
                val.map((item) => `${item.key}=${item.value}`).join("&");
            },
            deep: true,
        },
        // 监听参数内容变化，自动更新按钮文字
        paramContent: function() {
            // 触发计算属性重新计算
            this.$forceUpdate();
        }
    },

    mounted: function () {
        this.$refs.url.focus();
        this.loadPatchHotfix();
        this.initMockServer();
        this.handleInlineAiLaunch();
    },
    methods: {

        loadPatchHotfix() {
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
                return;
            }
            // 页面加载时自动获取并注入页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'postman'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js && typeof patch.js === 'string' && patch.js.length < 50000) {
                        try {
                            new Function(patch.js)();
                        } catch (e) {
                            console.error('postman补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        initMockServer() {
            // 注册Service Worker用于Mock服务器
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./sw.js')
                        .then((registration) => {
                            console.log('已启用 FeHelper Mock Server 已注册:', registration.scope);
                            // 通知Vue组件Mock服务器已就绪
                            window.dispatchEvent(new CustomEvent('mockServerReady'));
                        })
                        .catch((error) => {
                            console.warn('未通过 Mock Server 注册失败:', error);
                        });
                });
            } else {
                console.warn('未通过 当前浏览器不支持Service Worker');
            }
            
            // 监听Mock服务器就绪事件
            window.addEventListener('mockServerReady', () => {
                console.log('Mock服务器已就绪，可以测试POST请求了！');
                // 可以在这里添加一些UI提示
            });
        },

        postman: function () {
            this.$nextTick(() => {
                this.sendRequest(this.urlContent, this.methodContent, this.paramContent);
            });
        },

        getHeaderEntriesForAi() {
            return this.headerList.map(id => {
                const key = ($(`#header_key_${id}`).val() || '').trim();
                const value = ($(`#header_value_${id}`).val() || '').trim();
                return key ? { key, value } : null;
            }).filter(Boolean);
        },

        getRequestHeadersForAi() {
            return this.getHeaderEntriesForAi()
                .map(header => `${header.key}: ${header.value}`)
                .join('\n');
        },

        getQueryParamsForAi() {
            const params = [];
            try {
                const base = window.location && window.location.origin ? window.location.origin : 'https://fehelper.local';
                const url = new URL(this.urlContent || '', base);
                url.searchParams.forEach((value, key) => {
                    params.push(`${key}=${value}`);
                });
            } catch (e) {
                this.urlParams.forEach(item => {
                    if (item.key || item.value) {
                        params.push(`${item.key || ''}=${item.value || ''}`);
                    }
                });
            }
            return params.join('\n');
        },

        getEffectiveContentTypeForAi() {
            const contentTypeHeader = this.getHeaderEntriesForAi()
                .find(header => header.key.toLowerCase() === 'content-type');
            if (contentTypeHeader) {
                return `${contentTypeHeader.value}（手动设置）`;
            }
            if (this.methodContent.toLowerCase() === 'post' && this.urlencodedDefault) {
                return 'application/x-www-form-urlencoded（FeHelper POST 默认携带）';
            }
            return '未设置';
        },

        getBodyFormatForAi() {
            const content = (this.paramContent || '').trim();
            if (!content) return '无请求体';
            if (/^[\[{]/.test(content)) {
                try {
                    JSON.parse(content);
                    return 'JSON（语法合法）';
                } catch (e) {
                    return `疑似 JSON，但解析失败：${e.message}`;
                }
            }
            if (content.includes('=') && (content.includes('&') || content.split('=').length === 2)) {
                return 'URL-KV / x-www-form-urlencoded';
            }
            return '原始文本';
        },

        buildAiRequestInfo() {
            const requestHeaders = this.getRequestHeadersForAi();
            const queryParams = this.getQueryParamsForAi();
            return [
                `Method & URL:\n${this.methodContent} ${this.urlContent || '(未填写 URL)'}`,
                queryParams ? `Query Params:\n${queryParams}` : '',
                requestHeaders ? `Request Headers:\n${requestHeaders}` : 'Request Headers:\n(未设置)',
                `Effective Content-Type:\n${this.getEffectiveContentTypeForAi()}`,
                `Body Format:\n${this.getBodyFormatForAi()}`,
                this.paramContent ? `Body:\n${this.paramContent}` : ''
            ].filter(Boolean).join('\n\n');
        },

        buildAiResponseInfo() {
            const responseHeaders = this.responseHeaders
                .filter(item => item && item[0])
                .map(item => `${item[0]}: ${item[1] || ''}`)
                .join('\n');
            return [
                this.responseStatus ? `Status:\n${this.responseStatus}` : '',
                this.resultContent ? `Body:\n${this.resultContent}` : '',
                responseHeaders ? `Response Headers:\n${responseHeaders}` : '',
                this.errorMsgForJson ? `JSON 解析错误:\n${this.errorMsgForJson}` : ''
            ].filter(Boolean).join('\n\n');
        },

        handleInlineAiLaunch() {
            const task = getInlineAiTaskFromUrl();
            if (!task) return;
            setInlineAiGuide(this.aiPanel, {
                taskKey: task,
                title: 'AI辅助调试',
                subtitle: '围绕请求、响应和解析状态定位接口问题。',
                result: '填写 URL、方法、Headers 和 Body 后，可以直接用“AI辅助调试”检查 Content-Type、Body 格式、鉴权、CORS 和可复现示例。请求返回后，再用“诊断响应”结合响应头、响应体和 JSON 解析错误定位问题。'
            });
        },

        closeAiPanel() {
            resetInlineAiState(this.aiPanel);
        },

        copyAiResult() {
            copyInlineAiResult(this.aiPanel);
        },

        applyAiPanelResult() {
            this.aiPanel.statusText = '当前任务只提供接口建议，不自动修改请求';
        },

        askAiForRequest() {
            if (!this.urlContent.trim() && !this.paramContent.trim()) {
                setInlineAiGuide(this.aiPanel, {
                    taskKey: 'assist-debug',
                    title: 'AI辅助调试',
                    subtitle: '请先填写 URL 或请求参数。',
                    result: 'AI 会检查请求方法、URL 参数、Headers、Content-Type、Body 格式、鉴权信息和可复现样例，不会在没有响应时编造服务端返回。'
                });
                return;
            }
            runInlineToolAi(this.aiPanel, {
                toolKey: 'postman',
                taskKey: 'assist-debug',
                title: 'AI辅助调试',
                subtitle: '检查请求配置并给出可执行调试方案。',
                instruction: [
                    '请作为 FeHelper 简易 Postman 的接口调试助手，基于当前请求现场给出可执行排查方案。',
                    '必须检查：URL/查询参数、HTTP 方法、Headers、Content-Type、Body 格式、鉴权信息、CORS 可能性、Mock Server 适用性。',
                    '如果没有响应，不要编造服务端返回；输出可以直接复制的 curl 或 fetch 示例，必要时给出建议 Header/Body。'
                ].join('\n'),
                inputLabel: '当前请求',
                input: this.buildAiRequestInfo(),
                resultLabel: '当前响应',
                result: '',
                outputHint: '用 Markdown 输出，结构为：结论、需要改的请求、可复制示例、下一步。保持紧凑。',
                meta: {
                    请求方式: this.methodContent,
                    参数格式: this.getBodyFormatForAi(),
                    默认表单Header: this.urlencodedDefault ? '开启' : '关闭'
                }
            });
        },

        askAiForPostman() {
            if (!this.resultContent) {
                setInlineAiGuide(this.aiPanel, {
                    taskKey: 'diagnose-response',
                    title: '诊断响应',
                    subtitle: '请先发送请求获得响应。',
                    result: '请求完成后，AI 会结合请求、响应头、响应体和 JSON 解析错误给出排查路径。'
                });
                return;
            }
            runInlineToolAi(this.aiPanel, {
                toolKey: 'postman',
                taskKey: 'diagnose-response',
                title: '诊断响应',
                subtitle: '根据请求和响应定位接口问题。',
                instruction: [
                    '请基于 FeHelper 简易 Postman 的请求和响应现场做接口调试诊断。',
                    '必须结合状态码、响应头、响应体、JSON 解析错误、请求 Headers、Content-Type 和 Body 格式判断问题。',
                    '优先指出最可能的根因；如果证据不足，明确还缺哪项信息；不要泛泛解释 HTTP。'
                ].join('\n'),
                inputLabel: '当前请求',
                input: this.buildAiRequestInfo(),
                resultLabel: '当前响应',
                result: this.buildAiResponseInfo(),
                outputHint: '用 Markdown 输出，结构为：结论、证据、请求修正、下一步。给出可复制的 Header/Body/curl/fetch 片段时使用代码块。',
                meta: {
                    请求方式: this.methodContent,
                    参数格式: this.getBodyFormatForAi(),
                    默认表单Header: this.urlencodedDefault ? '开启' : '关闭'
                }
            });
        },

        sendRequest: function (url, method, body) {
            this.responseStatus = '';
            this.responseHeaders = [];
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("readystatechange", (resp) => {
                let result = 'Loading...';
                switch (resp.target.readyState) {
                    case resp.target.OPENED:
                        result = 'Senting...';
                        break;
                    case resp.target.HEADERS_RECEIVED:
                        result = 'Headers received';
                        this.responseStatus = `${resp.target.status || ''} ${resp.target.statusText || ''}`.trim();
                        {
                            const rawHeaders = resp.target.getAllResponseHeaders().trim();
                            this.responseHeaders = rawHeaders
                                ? rawHeaders.split('\n').map(item => item.split(': ').map(x => x.trim()))
                                : [];
                        }
                        break;
                    case resp.target.LOADING:
                        result = 'Loading...';
                        break;
                    case resp.target.DONE:
                        try {
                            result = JSON.stringify(JSON.parse(resp.target.responseText), null, 4);
                        } catch (e) {
                            result = resp.target.responseText;
                        }

                        this.responseStatus = `${resp.target.status || ''} ${resp.target.statusText || ''}`.trim();
                        this.jsonFormat(result);
                        this.renderTab();
                        break;
                }
                this.resultContent = result || '无数据';
            });
            try {
                xhr.open(method, url);
            } catch (e) {
                this.showRequestError('请求地址无效：' + e.message);
                return;
            }

            let isPost = false;
            let hasContentTypeHeader = false;
            
            if (method.toLowerCase() === 'post') {
                isPost = true;
            }

            // 设置请求头：Header
            let requestHeaders = [];
            for (const id of this.headerList) {
                let headerKey = ($(`#header_key_${id}`).val() || '').trim();
                let headerVal = ($(`#header_value_${id}`).val() || '').trim();
                if (headerKey && headerVal) {
                    if (!this.isValidHeaderName(headerKey)) {
                        this.showRequestError('请求头名称无效：' + headerKey);
                        return;
                    }
                    requestHeaders.push({ key: headerKey, value: headerVal });
                }
            }

            for (const header of requestHeaders) {
                try {
                    xhr.setRequestHeader(header.key, header.value);
                } catch (e) {
                    this.showRequestError('请求头设置失败：' + e.message);
                    return;
                }
                if (header.key.toLowerCase() === 'content-type') {
                    hasContentTypeHeader = true;
                }
            }

            // 如果没有手动设置Content-Type，且启用了默认的urlencoded，则设置默认的Content-Type
            if (isPost && !hasContentTypeHeader && this.urlencodedDefault) {
                try {
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                } catch (e) {
                    this.showRequestError('默认请求头设置失败：' + e.message);
                    return;
                }
            }

            // 根据Content-Type处理请求体
            let requestBody = null;
            if (isPost && body) {
                // 获取Content-Type
                let contentType = '';
                requestHeaders.forEach(header => {
                    // 检查是否已经设置了Content-Type
                    if (header.key.toLowerCase() === 'content-type') {
                        contentType = header.value;
                    }
                });
                
                if (contentType.includes('application/json')) {
                    // JSON格式：直接发送JSON字符串
                    requestBody = body;
                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                    // URL编码格式：将JSON转换为key=value&key=value格式
                    try {
                        const jsonObj = JSON.parse(body);
                        requestBody = Object.keys(jsonObj).map(key => 
                            encodeURIComponent(key) + '=' + encodeURIComponent(jsonObj[key])
                        ).join('&');
                    } catch (e) {
                        // 如果解析失败，直接使用原始body
                        requestBody = body;
                    }
                } else {
                    // 其他格式：直接发送
                    requestBody = body;
                }
            }

            try {
                xhr.send(requestBody);
            } catch (e) {
                this.showRequestError('请求发送失败：' + e.message);
            }
        },

        isValidHeaderName(name) {
            return /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name);
        },

        showRequestError(message) {
            this.resultContent = message;
            this.errorMsgForJson = message;
            this.responseStatus = '请求未发送';
            this.responseHeaders = [];
            this.$nextTick(() => {
                if (this.$refs.resultContainer) {
                    this.$refs.resultContainer.classList.remove('hide');
                }
            });
        },

        addHeader() {
            this.headerList.push(new Date() * 1);
        },
        deleteHeader(event) {
            event.target.parentNode.remove();
        },
        // 检测当前参数内容的数据格式
        detectParamFormat() {
            if (!this.paramContent || !this.paramContent.trim()) {
                return 'kv'; // 默认为KV格式
            }
            
            const content = this.paramContent.trim();
            
            // 检测是否为JSON格式
            try {
                JSON.parse(content);
                return 'json';
            } catch (e) {
                // 检测是否为KV格式（包含=号且用&分隔）
                if (content.includes('=') && (content.includes('&') || content.split('=').length === 2)) {
                    return 'kv';
                }
                // 如果都不符合，默认为KV格式
                return 'kv';
            }
        },

        transParamMode(){
            // 先检测当前格式
            const currentFormat = this.detectParamFormat();
            
            if(currentFormat === 'kv') {
                this.paramMode = 'json';
                let objParam = {};
                
                // 检查是否有内容
                if (this.paramContent && this.paramContent.trim()) {
                    this.paramContent.split('&').forEach(p => {
                        if (p.trim()) {
                            let x = p.split('=');
                            if (x.length >= 2) {
                                objParam[x[0].trim()] = x[1].trim();
                            }
                        }
                    });
                }
                
                // 如果没有任何参数，提供默认示例
                if (Object.keys(objParam).length === 0) {
                    objParam = {
                        "key1": "value1",
                        "key2": "value2",
                        "key3": "value3"
                    };
                }
                
                this.paramContent = JSON.stringify(objParam, null, 4);
            }else{
                this.paramMode = 'kv';
                try {
                    if (this.paramContent && this.paramContent.trim()) {
                        let obj = JSON.parse(this.paramContent);
                        this.paramContent = Object.keys(obj).map(k => {
                            let v = JSON.stringify(obj[k]).replace(/"/g,'');
                            return `${k}=${v}`;
                        }).join('&');
                    } else {
                        // 如果JSON为空，提供默认示例
                        this.paramContent = 'key1=value1&key2=value2&key3=value3';
                    }
                } catch (e) {
                    // JSON解析失败时，提供默认示例
                    this.paramContent = 'key1=value1&key2=value2&key3=value3';
                }
            }
        },

        renderTab: function () {
            jQuery('#tabs').tabs({
                show: (event, ui) => {
                }
            });
            this.$refs.resultContainer.classList.remove('hide');
        },


        jsonFormat: function (source) {
            this.errorMsgForJson = '';
            this.jfCallbackName_start = '';
            this.jfCallbackName_end = '';

            if (!source) {
                return false;
            }

            // json对象
            let jsonObj = null;

            // 下面校验给定字符串是否为一个合法的json
            try {
                this.funcName = '';

                // 再看看是不是jsonp的格式
                let reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/igm;
                let matches = reg.exec(source);
                if (matches != null) {
                    this.funcName = matches[1];
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
                            // 最后给你一次机会，是个字符串，老夫给你再转一次
                            jsonObj = new Function("return " + jsonObj)();
                        }
                    } catch (exxx) {
                        this.errorMsgForJson = exxx.message;
                    }
                }
            }

            // 是json格式，可以进行JSON自动格式化
            if (jsonObj != null && typeof jsonObj === "object" && !this.errorMsgForJson.length) {
                try {
                    // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                    source = JSON.stringify(jsonObj);
                } catch (ex) {
                    // 通过JSON反解不出来的，一定有问题
                    this.errorMsgForJson = ex.message;
                }

                if (!this.errorMsgForJson.length) {

                    this.originalJsonStr = source;

                    // 获取上次记录的排序方式
                    let curSortType = parseInt(localStorage.getItem(JSON_SORT_TYPE_KEY) || 0);
                    this.didFormat(curSortType);

                    // 排序选项初始化
                    $('[name=jsonsort][value=' + curSortType + ']').attr('checked', 1);

                    let that = this;
                    $('[name=jsonsort]').click(function (e) {
                        let sortType = parseInt(this.value);
                        if (sortType !== curSortType) {
                            that.didFormat(sortType);
                            curSortType = sortType;
                        }
                        localStorage.setItem(JSON_SORT_TYPE_KEY, sortType);
                    });
                }
            }

            // 不是json，都格式化不了，一定会出错
            if (this.errorMsgForJson) {
                let el = document.querySelector('#optionBar');
                el && (el.style.display = 'none');
            }

        },

        didFormat: function (sortType) {
            sortType = sortType || 0;
            let source = this.originalJsonStr;

            if (sortType !== 0) {
                let jsonObj = JsonABC.sortObj(JSON.parse(this.originalJsonStr), parseInt(sortType), true);
                source = JSON.stringify(jsonObj);
            }

            Formatter.format(source);
            $('.x-toolbar').fadeIn(500);

            // 如果是JSONP格式的，需要把方法名也显示出来
            if (this.funcName) {
                $('#jfCallbackName_start').html(this.funcName + '(');
                $('#jfCallbackName_end').html(')');
            } else {
                this.jfCallbackName_start = '';
                this.jfCallbackName_end = '';
            }
        },

        setDemo: function (type) {
            if (type === 1) {
                // GET示例
                this.urlContent = 'http://t.weather.sojson.com/api/weather/city/101030100';
                this.methodContent = 'GET';
                this.paramContent = '';
                this.headerList = [new Date() * 1];
            } else if (type === 2) {
                // 基础Mock API
                this.urlContent = window.location.origin + '/api/mock';
                this.methodContent = 'POST';
                this.paramContent = JSON.stringify({
                    username: 'fehelper_user',
                    password: '123456',
                    email: 'test@fehelper.com',
                    action: 'login',
                    timestamp: new Date().toISOString()
                }, null, 2);
                
                // 自动设置Content-Type为application/json
                this.headerList = [new Date() * 1];
                this.$nextTick(() => {
                    $(`#header_key_${this.headerList[0]}`).val('Content-Type');
                    $(`#header_value_${this.headerList[0]}`).val('application/json');
                });
            } else if (type === 3) {
                // Mock登录API
                this.urlContent = window.location.origin + '/api/user/login';
                this.methodContent = 'POST';
                this.paramContent = JSON.stringify({
                    username: 'admin',
                    password: 'admin123',
                    remember: true
                }, null, 2);
                
                this.headerList = [new Date() * 1];
                this.$nextTick(() => {
                    $(`#header_key_${this.headerList[0]}`).val('Content-Type');
                    $(`#header_value_${this.headerList[0]}`).val('application/json');
                });
            } else if (type === 4) {
                // Mock数据创建API
                this.urlContent = window.location.origin + '/api/data/create';
                this.methodContent = 'POST';
                this.paramContent = JSON.stringify({
                    title: '测试数据',
                    content: '这是一个通过FeHelper Mock服务器创建的测试数据',
                    category: 'test',
                    tags: ['mock', 'test', 'fehelper']
                }, null, 2);
                
                this.headerList = [new Date() * 1];
                this.$nextTick(() => {
                    $(`#header_key_${this.headerList[0]}`).val('Content-Type');
                    $(`#header_value_${this.headerList[0]}`).val('application/json');
                });
            }
        },

        urlParams2String: function (params) {
            return params.map((param) => `${param.key}=${param.value}`).join("&")
        },

        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'postman' }
            });
        },

        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();    
            chrome.runtime.openOptionsPage();
        }
    }
});
