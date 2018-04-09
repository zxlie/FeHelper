/**
 * Ajax接口调试功能
 *
 * 原理：
 *
 *  devtools → background-page → content-page → console.*
 *
 * @author xianliezhao@foxmail.com
 */
let AjaxDebugger = (function () {

    let MSG_TYPE = Tarp.require('../static/js/msg_type');

    /**
     * 自定义Console
     */
    let FeHelperConsole = (function () {
        let Types = 'log,debug,info,warn,error,group,groupCollapsed,groupEnd'.split(',');

        let sendMessage = function (type, format, args) {
            chrome.runtime.sendMessage({
                type: MSG_TYPE.AJAX_DEBUGGER_CONSOLE,
                content: escape(JSON.stringify(Array.prototype.slice.call(arguments, 0)))
            });
        };

        let that = new Function();
        Types.forEach(function (tp) {
            that[tp] = sendMessage.bind(that, tp);
        });

        return that;
    })();

    /**
     * 分析Request
     * @param request
     */
    let analyticRequest = function (request) {
        let url = request.request.url || "",
            urlSeparator = (url.indexOf("?") > -1) ? "&" : "?",
            requestParams = (request.request.postData && request.request.postData.params) || [],
            responseStatus = request.response.status + " " + request.response.statusText,
            responseSize = request.response.bodySize + request.response.headersSize;

        let queryString = '';
        requestParams.forEach(function (param, index) {
            queryString += (index === 0 ? urlSeparator : '&') + param.name + '=' + param.value;
        });

        let requestPath = '/' + (url.split('?') || [''])[0].replace('://', '').split('/').splice(1).join('/');
        let responseTime = request.time > 1000 ? Math.ceil(request.time / 1000) + 's' : Math.ceil(request.time) + 'ms';
        responseSize = responseSize > 1024 ? Math.ceil(responseSize / 1024) + 'KB' : Math.ceil(responseSize) + 'B';

        // 获取Response的数据
        request.getContent(function (content, encoding) {

            if (content) {
                try {
                    request.response.responseData = JSON.parse(content);
                }
                catch (e) {
                    request.response.responseData = content;
                }
            }

            let header = "Ajax请求加载完毕 (" + [requestPath, responseStatus, responseTime, responseSize].join(" - ") + ") " + ' -- By FeHelper';

            FeHelperConsole.group(header);
            FeHelperConsole.log('AjaxURL  :', {url: url + queryString});
            FeHelperConsole.log("Request  :", {request: request.request});
            FeHelperConsole.log("Response :", {response: request.response});
            FeHelperConsole.log("OtherInfo:", {
                timeConsuming: responseTime,
                timings: request.timings,
                time: request.startedDateTime,
                server: request.serverIPAddress
            });
            FeHelperConsole.groupEnd();
        });
    };


    /**
     * 监控Network中的请求
     */
    chrome.devtools.network.onRequestFinished.addListener(function (request) {

        let reqUrl = request.request.url.split('?')[0];
        if (/\.js$/.test(reqUrl)) {
            return false;
        }
        let isXHR = /\.json$/.test(reqUrl) || (request.request.headers.concat(request.response.headers)).some(function (header) {
            return (
                (header.name === "X-Requested-With" && header.value === "XMLHttpRequest") ||
                (header.name === "Content-Type" && (
                    header.value === "application/x-www-form-urlencoded" ||
                    /application\/json/.test(header.value) ||
                    /application\/javascript/.test(header.value) ||
                    /text\/javascript/.test(header.value)
                ))
            );
        });

        if (isXHR) {
            chrome.runtime.sendMessage({
                type: MSG_TYPE.AJAX_DEBUGGER_SWITCH
            }, function (debuggerSwitchOn) {
                debuggerSwitchOn && analyticRequest(request);
            });
        }

    });

    // 与background保持心跳
    chrome.runtime.connect({
        name: MSG_TYPE.DEV_TOOLS
    });

})();