/**
 * FeHelper Wpo Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        pageTitle: '无',
        pageUrl: '无',
        dns: 0,
        dnsTotal: 0,
        connect: 0,
        requestTotal: 0,
        response: 0,
        responseTotal: 0,
        responseEnd: 0,
        responseEndTotal: 0,
        contentLoaded: 0,
        contentLoadedTotal: 0,
        domComplete: 0,
        domCompleteTotal: 0,
        loadTotal: 0,

        headerInfo:null
    },
    mounted: function () {
        // 获得wpo信息
        let wpoStr = decodeURIComponent(location.search.substring(1));
        let wpo = JSON.parse(decodeURIComponent(atob(wpoStr)));
        let t = wpo.time;
        let start = t.redirectStart === 0 ? t.fetchStart : t.redirectStart;

        // 页面信息
        this.pageTitle = wpo.pageInfo.title || "无";
        this.pageUrl = wpo.pageInfo.url || "无";
        this.dns = t.domainLookupEnd - t.domainLookupStart;
        this.dnsTotal = t.domainLookupEnd - start;
        this.connect = t.connectEnd - t.connectStart;
        this.requestTotal = t.requestStart - start;
        this.response = t.responseStart - t.requestStart;
        this.responseTotal = t.responseStart - start;
        this.responseEnd = t.responseEnd - t.responseStart;
        this.responseEndTotal = t.responseEnd - start;
        this.contentLoaded = t.domContentLoadedEventEnd - t.domLoading;
        this.contentLoadedTotal = t.domContentLoadedEventEnd - start;
        this.domComplete = t.domComplete - t.domContentLoadedEventEnd;
        this.domCompleteTotal = t.domComplete - start;
        this.loadTotal = t.loadEventEnd - start;

        // HTTP Header
        this.headerInfo = wpo.header;
    }
});