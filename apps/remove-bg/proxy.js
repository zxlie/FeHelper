/**
 * 站点 remove.bg 设置了X-Frame-Options的Header，不能被嵌入到iframe，这里加个proxy来delete header
 * @type {{addBackgroundRemoveListener}}
 * @author zhaoxianlie
 */
let BgProxy = (() => {

    let listenerAddedFlag = false;

    /**
     * web请求截获，重置response Headers
     * @param callback
     */
    let addListener = (callback) => {

        if (listenerAddedFlag) {
            callback && callback();
            return false;
        }

        chrome.webRequest.onHeadersReceived.addListener((info) => {
                let headers = info.responseHeaders;
                for (let i = headers.length - 1; i >= 0; --i) {
                    let header = headers[i].name.toLowerCase();
                    if (header === 'x-frame-options' || header === 'frame-options') {
                        headers.splice(i, 1);
                    }
                }
                return {responseHeaders: headers};
            },
            {
                urls: ['https://www.remove.bg/'],
                types: ['sub_frame']
            },
            ['blocking', 'responseHeaders']
        );
        listenerAddedFlag = true;
    };

    return {
        addBackgroundRemoveListener: addListener
    };
})();

module.exports = BgProxy;