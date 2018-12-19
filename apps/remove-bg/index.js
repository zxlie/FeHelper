new Vue({
    el: '#pageContainer',
    data: {
        iframeHtml: '<iframe src="https://www.remove.bg/" frameborder="0" width="100%" height="100%"></iframe>',
        enter: false
    },

    methods: {
        permission: function (callback) {
            chrome.permissions.request({
                permissions: ['webRequest', 'webRequestBlocking']
            }, (granted) => {
                if (granted) {
                    callback && callback();
                } else {
                    alert('必须接受授权，才能正常使用！');
                }
            });
        },

        loadTools: function () {
            if (this.enter) return;
            this.permission(() => {
                let MSG_TYPE = Tarp.require('../static/js/msg_type');
                chrome.runtime.sendMessage({
                    type: MSG_TYPE.REMOVE_PERSON_IMG_BG
                }, () => {
                    this.enter = true;
                    this.$refs.btnEnter.innerHTML = '正在进入，请稍后......';
                    this.$refs.boxIframe.innerHTML = this.iframeHtml;
                    let opacity = 1;
                    let intervalId = window.setInterval(() => {
                        opacity -= 0.02;
                        if (opacity <= 0) {
                            window.clearInterval(intervalId);
                            this.$refs.overlay.remove();
                        } else {
                            this.$refs.overlay.style.opacity = opacity;
                        }
                    }, 30);
                });
            });
        },
    }
});
