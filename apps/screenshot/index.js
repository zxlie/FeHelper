/**
 * FeHelper，截图后的保存界面
 */
new Vue({
    el: '#pageContainer',
    data: {
        tabList: [],
        capturedImage: '',
        imageHTML: '',
        defaultFilename: Date.now() + '.png'
    },
    mounted: function () {

        this.updateTabList();
        this.bindEvent();

    },
    methods: {

        bindEvent: function () {
            chrome.tabs.onCreated.addListener(tab => {
                if (/^http(s)?:\/\//.test(tab.url)) {
                    this.tabList.push({
                        id: tab.id,
                        title: tab.title,
                        url: tab.url
                    });
                }
            });
            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                this.tabList.some((t, index) => {
                    if (t.id === tabId) {
                        t.title = tab.title;
                        t.url = tab.url;
                        return true;
                    }
                    return false;
                });
            });
            chrome.tabs.onRemoved.addListener(tabId => {
                this.tabList.some((tab, index) => {
                    if (tab.id === tabId) {
                        this.tabList.splice(index, 1);
                        return true;
                    }
                    return false;
                });
            });

            chrome.runtime.onMessage.addListener((request, sender, callback) => {
                if (request.type === 'page-screenshot-done') {
                    let capturedData = request.data;
                    if (capturedData && capturedData.fileSystemUrl) {
                        this.capturedImage = capturedData.fileSystemUrl;
                        this.imageHTML = `<img class="img-result" src="${this.capturedImage}" />`;
                        this.defaultFilename = capturedData.filename;

                        this.$nextTick(() => {
                            this.$refs.resultBox.scrollIntoView();
                        });

                        chrome.tabs.get(capturedData.pageInfo.id, tab => {
                            this.tabList.some(t => {
                                if (t.id === tab.id) {
                                    t.title = tab.title;
                                    return true;
                                }
                                return false;
                            });
                        });
                    }
                }
                callback && callback();
                return true;
            });
        },

        updateTabList: function () {
            chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT}, tabs => {
                this.tabList = tabs.filter(tab => {
                    return /^http(s)?:\/\//.test(tab.url)
                }).map(tab => {
                    return {
                        id: tab.id,
                        title: tab.title,
                        url: tab.url
                    };
                });
            });
        },

        goCapture: function (tabId, captureType) {
            chrome.tabs.getCurrent(curTab => {
                chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT}, (tabs) => {
                    let found = tabs.some(tab => tab.id === tabId);

                    if (found) {
                        chrome.tabs.update(tabId, {highlighted: true, active: true}, tab => {

                            chrome.tabs.executeScript(tab.id, {
                                code: '(' + (function (tabInfo, captureInfo) {
                                    chrome.runtime.sendMessage({
                                        type: 'fh-dynamic-any-thing',
                                        params: {
                                            tabInfo: tabInfo,
                                            captureInfo: captureInfo
                                        },
                                        func: ((params, callback) => {
                                            try {
                                                callback && callback(params);
                                            } catch (e) {
                                                callback && callback(null);
                                            }
                                            return true;
                                        }).toString()
                                    }, (params) => {
                                        let func = window['screenshotContentScript'];
                                        func && func(params)();
                                    });
                                }).toString() + ')(' + JSON.stringify(tab) + ',' + JSON.stringify({
                                    resultTab: curTab.id,
                                    captureType: captureType
                                }) + ')',
                                allFrames: false
                            });
                        });
                    } else {
                        alert('页面已关闭');
                    }
                });
            });
        },

        save: function () {
            // 请求权限
            chrome.permissions.request({
                permissions: ['downloads']
            }, (granted) => {
                if (granted) {
                    chrome.downloads.download({
                        url: this.capturedImage,
                        saveAs: true,
                        conflictAction: 'overwrite',
                        filename: this.defaultFilename
                    });
                } else {
                    alert('必须接受授权，才能正常下载！');
                }
            });
        }
    }
});
