/**
 * FeHelper Timestamp Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        txtNowS: Math.round((new Date()).getTime() / 1000),
        txtNowMs: (new Date()).getTime(),
        txtNowDate: (new Date()).toLocaleString(),
        txtSrcStamp: '',
        txtDesDate: '',
        txtLocale: '',
        txtDesStamp: '',
        secFrom: 's',
        secTo: 's',
        worldTime: {},
        curGMT: (new Date()).getTimezoneOffset() / 60 * -1
    },
    mounted: function () {
        this.startTimestamp();
    },
    methods: {
        startTimestamp: function () {
            let formatter = 'yyyy-MM-dd HH:mm:ss';
            window.intervalId = window.setInterval(() => {
                let localDate = new Date();
                let gmtTime = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);

                let nowDate = new Date(gmtTime.getTime() + this.curGMT * 60 * 60000);
                this.txtNowDate = nowDate.format(formatter);

                this.txtNowS = Math.round(nowDate.getTime() / 1000);
                this.txtNowMs = nowDate.getTime();

                this.worldTime['local'] = this.txtNowDate;
                this.worldTime['gmt'] = gmtTime.format(formatter);

                for (let offset = -12; offset <= 12; offset++) {
                    this.worldTime[offset > 0 ? ('+' + offset) : offset] = new Date(gmtTime.getTime() + offset * 60 * 60000).format(formatter);
                }

            }, 1000);
        },
        unixToggle: function () {
            window.toggleModel = window.toggleModel || 0;
            if (window.toggleModel) {
                this.$refs.btnToggle.value = '暂停';
                window.toggleModel = 0;
                this.startTimestamp();
            } else {
                this.$refs.btnToggle.value = '开始';
                window.toggleModel = 1;
                window.clearInterval(window.intervalId);
            }
        },
        stampToLocale: function () {
            if (this.txtSrcStamp.length === 0) {
                alert('请先填写你需要转换的Unix时间戳');
                return;
            }
            if (!parseInt(this.txtSrcStamp, 10)) {
                alert('请输入合法的Unix时间戳');
                return;
            }

            let base = this.secFrom === 's' ? 1000 : 1;
            let format = 'yyyy-MM-dd HH:mm:ss' + (this.secFrom === 's' ? '' : '.SSS');

            this.txtDesDate = (new Date(parseInt(this.txtSrcStamp, 10) * base + ((new Date()).getTimezoneOffset() + this.curGMT * 60) * 60000)).format(format);
        },
        localeToStamp: function () {
            if (this.txtLocale && !/\s\d+:\d+:\d+/.test(this.txtLocale)) {
                this.txtLocale += ' 00:00:00';
            }
            let locale = (new Date(Date.parse(this.txtLocale) - ((new Date()).getTimezoneOffset() + this.curGMT * 60) * 60000)).getTime();
            if (isNaN(locale)) {
                alert('请输入合法的时间格式，如：2014-04-01 10:01:01，或：2014-01-01');
            }
            let base = this.secTo === 's' ? 1000 : 1;
            this.txtDesStamp = Math.round(locale / base);
        },
        copyToClipboard(text) {
            if (!text || !(text || '').trim().length) return;
            let input = document.createElement('textarea');
            input.style.position = 'fixed';
            input.style.opacity = 0;
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);

            this.toast('已复制到剪贴板，随处粘贴可用：[ ' + text + ' ]');
        },
        toast(content) {
            window.clearTimeout(window.feHelperAlertMsgTid);
            let elAlertMsg = document.querySelector("#fehelper_alertmsg");
            if (!elAlertMsg) {
                let elWrapper = document.createElement('div');
                elWrapper.innerHTML = '<div id="fehelper_alertmsg">' + content + '</div>';
                elAlertMsg = elWrapper.childNodes[0];
                document.body.appendChild(elAlertMsg);
            } else {
                elAlertMsg.innerHTML = content;
                elAlertMsg.style.display = 'block';
            }

            window.feHelperAlertMsgTid = window.setTimeout(function () {
                elAlertMsg.style.display = 'none';
            }, 3000);
        }
    }
});
