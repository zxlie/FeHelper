/**
 * 计算并保存网页加载时间
 * @author zhaoxianlie
 */
module.exports = (() => {

    let wpoInfo = {};
    /**
     * 获取页面的http header
     * @return {[type]}
     */
    let getHttpHeaders = function () {
        if (wpoInfo.header && wpoInfo.time && wpoInfo.pageInfo) {
            sendWpoInfo();
        } else {
            $.ajax({
                type: 'GET',
                url: window.location.href,
                complete: function (xhr, data) {
                    wpoInfo.header = {
                        "date": xhr.getResponseHeader('Date'),
                        "connection": xhr.getResponseHeader('Connection'),
                        "contentEncoding": xhr.getResponseHeader('Content-Encoding'),
                        "contentLength": xhr.getResponseHeader('Content-Length'),
                        "server": xhr.getResponseHeader('Server'),
                        "lety": xhr.getResponseHeader('lety'),
                        "transferEncoding": xhr.getResponseHeader('Transfer-Encoding'),
                        "contentType": xhr.getResponseHeader('Content-Type'),
                        "cacheControl": xhr.getResponseHeader('Cache-Control'),
                        "exprires": xhr.getResponseHeader('Exprires'),
                        "lastModified": xhr.getResponseHeader('Last-Modified')
                    };

                    getPageInfo();
                    getPageLoadTime();
                    sendWpoInfo();
                }
            });
        }
    };

    /**
     * 页面相关信息
     */
    let getPageInfo = function () {
        wpoInfo.pageInfo = {
            title: document.title,
            url: location.href
        };
    };

    /**
     * 获取网页的加载时间
     */
    let getPageLoadTime = function () {
        wpoInfo.time = performance.timing;
    };

    /**
     * 发送wpo数据
     * @return {[type]}
     */
    let sendWpoInfo = function () {
        let MSG_TYPE = Tarp.require('../static/js/msg_type');
        chrome.runtime.sendMessage({
            type: MSG_TYPE.CALC_PAGE_LOAD_TIME,
            wpo: wpoInfo
        });
    };

    /**
     * 提取wpo信息
     */
    let getWpoInfo = function () {
        // 如果是网络地址，才去获取header
        if (/^((http)|(https))\:\/\//.test(location.href)) {
            getHttpHeaders();
        }
        // 否则只提取performance信息
        else {
            getPageInfo();
            getPageLoadTime();
            sendWpoInfo();
        }
    };

    return {
        getWpoInfo: getWpoInfo
    };
})();



