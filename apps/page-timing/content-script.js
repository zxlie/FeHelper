/**
 * 计算并保存网页加载时间
 * @author zhaoxianlie
 */
window.pagetimingContentScript = function () {

    let __importScript = (filename) => {
        fetch(filename).then(resp => resp.text()).then(jsText => eval(jsText));
    };

    __importScript('timing.js');

    let DetectMgr = (() => {

        let wpoInfo = {
            pageInfo: {
                title: document.title,
                url: location.href
            },
            time: window.timing.getTimes({simple: true})
        };

        let sendWpoInfo = function () {
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                params: {
                    tabId: window.__FH_TAB_ID__ || null,
                    wpoInfo: wpoInfo
                },
                func: ((params, callback) => {
                    chrome.DynamicToolRunner({
                        query: 'tool=page-timing',
                        withContent: params.wpoInfo
                    });
                    callback && callback();
                    return true;
                }).toString()
            });
        };

        let getHttpHeaders = function () {
            if (wpoInfo.header && wpoInfo.time && wpoInfo.pageInfo) {
                sendWpoInfo();
            } else {
                fetch(location.href).then(resp => {
                    let header = {};
                    for (let pair of resp.headers.entries()) {
                        header[pair[0]] = pair[1];
                    }
                    return header;
                }).then(header => {
                    wpoInfo.header = header;
                    sendWpoInfo();
                }).catch(console.log);
            }
        };

        let detect = function () {
            // 如果是网络地址，才去获取header
            if (/^((http)|(https)):\/\//.test(location.href)) {
                getHttpHeaders();
            } else {
                sendWpoInfo();
            }
        };

        return {
            detect: detect
        };
    })();


    window.pagetimingNoPage = function () {
        DetectMgr.detect();
    };
};