/**
 * FeHelper Timestamp Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        txtNow: Math.round((new Date()).getTime() / 1000),
        txtNowDate: (new Date()).toLocaleString(),
        txtSrcStamp: '',
        txtDesDate: '',
        txtLocale: '',
        txtDesStamp: ''
    },
    mounted: function () {
        this.startTimestamp();
    },
    methods: {
        startTimestamp: function () {
            window.intervalId = window.setInterval(() => {
                this.txtNowDate = (new Date()).toLocaleString();
                this.txtNow = Math.round((new Date()).getTime() / 1000);
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
            Tarp.require('../static/js/utils');
            if (this.txtSrcStamp.length === 0) {
                alert('请先填写你需要转换的Unix时间戳');
                return;
            }
            if (!parseInt(this.txtSrcStamp, 10)) {
                alert('请输入合法的Unix时间戳');
                return;
            }
            this.txtDesDate = (new Date(parseInt(this.txtSrcStamp, 10) * 1000)).format('yyyy-MM-dd HH:mm:ss');
        },
        localeToStamp: function () {
            if(this.txtLocale && !/\s\d+:\d+:\d+/.test(this.txtLocale)) {
                this.txtLocale += ' 00:00:00';
            }
            let locale = Date.parse(this.txtLocale);
            if (isNaN(locale)) {
                alert('请输入合法的时间格式，如：2014-04-01 10:01:01，或：2014-01-01');
            }
            this.txtDesStamp = locale / 1000;
        }
    }
});