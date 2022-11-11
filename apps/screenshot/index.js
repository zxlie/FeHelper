/**
 * FeHelper，截图后的保存界面
 */
new Vue({
    el: '#pageContainer',
    data: {
        tabList: [],
        capturedImage: '',
        imageHTML: '',
        defaultFilename: Date.now() + '.png',
        totalWidth: 100,
        totalHeight: 100
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
                    if(!resp || !resp.content) return ;
                    this.showResult(resp.content);
                });
            });
        }
    },
    methods: {

        showResult: function(data){
            if (data && data.screenshots) {
                this.totalWidth = data.totalWidth;
                this.totalHeight = data.totalHeight;
                let canvas = document.querySelector('#imageEditor>canvas');
                let ctx  = canvas.getContext('2d');

                data.screenshots.forEach((ss) => {
                    let img = new Image();
                    img.dx = ss.left;
                    img.dy = ss.top;
                    img.onload = function(event){
                        ctx.drawImage(this,this.dx,this.dy,this.width,this.height);
                    };
                    img.src = ss.dataUri;
                });
                this.defaultFilename = data.filename;

                this.$nextTick(() => {
                    this.$refs.resultBox.scrollIntoView();
                });
            }
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
