/**
 * 计算并保存网页加载时间
 * @author zhaoxianlie
 */
window.pagetimingContentScript = function () {

    let __importScript = (filename) => {
        pleaseLetJsLoaded = 100;
        let url = filename;

        if (location.protocol === 'chrome-extension:' || chrome.runtime && chrome.runtime.getURL) {
            url = chrome.runtime.getURL('page-timing/' + filename);
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

    __importScript('timing.js');

    window.pagetimingNoPage = function() {

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
                thing: 'set-page-timing-data',
                wpoInfo: wpoInfo
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

        detect();
    };

};
