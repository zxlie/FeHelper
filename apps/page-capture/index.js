/**
 * FeHelper，截图后的保存界面
 */
new Vue({
    el: '#pageContainer',
    data: {
        capturedImage: '',
        imageHTML: '',
        originPageInfo: '',
        defaultFilename: Date.now() + '.png',
        expand: false,
        btnInfoText: '点击展开'
    },
    mounted: function () {
        let bpInstance = chrome.extension.getBackgroundPage().BgPageInstance;
        let capturedData = bpInstance.getCapturedData();
        if (capturedData && capturedData.imageURI && capturedData.imageURI.length) {
            this.capturedImage = capturedData.imageURI[0];
            this.imageHTML = `<img class="img-result" src="${this.capturedImage}" />`;
            this.originPageInfo = JSON.stringify(capturedData.pageInfo, null, 4);
            this.defaultFilename = capturedData.filename;
        }
    },
    methods: {
        expandInfo: function () {
            this.expand = !this.expand;
            this.btnInfoText = this.expand ? '点击收起' : '点击展开';
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
