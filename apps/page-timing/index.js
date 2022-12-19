/**
 * FeHelper Wpo Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        pageTitle: '无',
        pageUrl: '无',
        timing: null,
        headerInfo: null,
        tmDefination: {
            lookupDomainTime: 'DNS查询耗时',
            connectTime: 'TCP连接耗时',
            requestTime: '网络请求耗时',
            firstPaintTime: '白屏时间',
            readyStart: '构建文档流耗时',
            domReadyTime: 'DOM树构建耗时',
            redirectTime: '重定向耗时',
            appcacheTime: '数据缓存耗时',
            unloadEventTime: '卸载文档耗时',
            initDomTreeTime: '请求完成到可交互',
            loadEventTime: '加载事件耗时',
            loadTime: '加载总耗时'
        }
    },
    mounted: function () {
        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        if (location.protocol === 'chrome-extension:') {
            chrome.tabs.query({currentWindow: true,active: true, }, (tabs) => {
                let activeTab = tabs.filter(tab => tab.active)[0];
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'request-page-content',
                    tabId: activeTab.id
                }).then(resp => {
                    console.log(resp)
                    if(!resp && !resp.content) return ;
                    sessionStorage.setItem('wpo-data', JSON.stringify(resp.content));
                    this.showTiming(resp.content);
                });
            });
        }

        let wpo = JSON.parse(sessionStorage.getItem('wpo-data'));
        wpo && this.showTiming(wpo);
    },

    methods: {
        showTiming(wpo) {
            this.pageTitle = wpo.pageInfo.title || "无";
            this.pageUrl = wpo.pageInfo.url || "无";

            this.timing = wpo.time;
            this.headerInfo = wpo.header;
        },
    }
});
