/**
 * Ajax接口调试功能
 *
 * 原理：
 *
 *  devtools → background-page → content-page → console.*
 *
 * @author xianliezhao@foxmail.com
 */
var AjaxDebugger = (function () {

    /**
     * 自定义Console
     */
    var FeHelperConsole = (function () {
        var Types = 'log,debug,info,warn,error,group,groupCollapsed,groupEnd'.split(',');

        var sendMessage = function (type, format, args) {
            chrome.extension.sendMessage({
                type: MSG_TYPE.AJAX_DEBUGGER_CONSOLE,
                content: escape(JSON.stringify(Array.prototype.slice.call(arguments, 0)))
            });
        };

        var that = new Function();
        Types.forEach(function (tp) {
            that[tp] = sendMessage.bind(that, tp);
        });

        return that;
    })();

    /**
     * 分析Request
     * @param request
     */
    var analyticRequest = function (request) {
        var url = request.request.url || "",
            urlSeparator = (url.indexOf("?") > -1) ? "&" : "?",
            requestParams = (request.request.postData && request.request.postData.params) || [],
            responseStatus = request.response.status + " " + request.response.statusText,
            responseSize = request.response.bodySize + request.response.headersSize;

        var queryString = '';
        requestParams.forEach(function (param, index) {
            queryString += (index == 0 ? urlSeparator : '&') + param.name + '=' + param.value;
        });

        var requestPath = '/' + (url.split('?') || [''])[0].replace('://', '').split('/').splice(1).join('/');
        var responseTime = request.time > 1000 ? Math.ceil(request.time / 1000) + 's' : Math.ceil(request.time) + 'ms';
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

            var header = "Ajax请求加载完毕 (" + [requestPath, responseStatus, responseTime, responseSize].join(" - ") + ") " + ' -- By FeHelper';

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

        var reqUrl = request.request.url.split('?')[0] ;
        if (/\.js$/.test(reqUrl)) {
            return false;
        }
        var isXHR = /\.json$/.test(reqUrl) || (request.request.headers.concat(request.response.headers)).some(function (header) {
                return (
                (header.name == "X-Requested-With" && header.value == "XMLHttpRequest") ||
                (header.name == "Content-Type" && (
                        header.value == "application/x-www-form-urlencoded" ||
                        /application\/json/.test(header.value) ||
                        /application\/javascript/.test(header.value) ||
                        /text\/javascript/.test(header.value)
                ))
                );
            });

        if (isXHR) {
            chrome.extension.sendMessage({
                type: MSG_TYPE.AJAX_DEBUGGER_SWITCH
            }, function (debuggerSwitchOn) {
                // 开关
                if (debuggerSwitchOn) {
                    analyticRequest(request);
                }
            });
        }

    });

})();