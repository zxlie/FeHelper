/**
 * FeHelper 密码随机生成工具
 */
new Vue({
    el: '#pageContainer',
    data: {
        number: true,
        lowerLetter: true,
        upperLetter: true,
        specialChar: false,
        length: 16,
        chars: {
            number: '0123456789',
            lowerLetter: 'abcdefghijklmnopqrstuvwxyz',
            upperLetter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            specialChar: '~!@#$%^&*()[{]}-_=+\|;:\'\",<.>/?`'
        },
        resultContent: '',
        showToast: false,
        toastMsg: ''
    },

    methods: {
        convert: function () {
            this.$nextTick(() => {
                let exceptedChars = ['number', 'lowerLetter', 'upperLetter', 'specialChar'].filter(item => this[item]).map(item => this.chars[item]).join('');

                let password = [], rands = [], rand = 0;
                for (let index = 0; index < this.length; index++) {

                    // 尽可能不让字符重复
                    do {
                        rand = Math.floor(Math.random() * exceptedChars.length);
                    } while (rands.includes(rand) && rands.length < exceptedChars.length);

                    rands.push(rand);
                    password.push(exceptedChars[rand]);
                }

                this.resultContent = password.join('');
            });
        },

        getResult: function () {
            this.$refs.rstCode.select();
        },


        copyResult: function () {
            // 选中要复制的内容
            this.getResult();

            if ('clipboard' in navigator) {
                navigator.clipboard.writeText(this.resultContent)
                .then(() => {
                    this.showToastMsg('复制成功！');
                })
                .catch(err => {
                    console.error('复制失败: ', err);
                });
            }else{
                alert("您的浏览器不支持 clipboard API, 请手动复制")
            }
        },
        showToastMsg: function(msg) {
            this.toastMsg = msg;
            this.showToast = true;
            setTimeout(() => {
                this.showToast = false;
            }, 1500);
        },
        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },
        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'password' }
            });
        } 
    }
});
