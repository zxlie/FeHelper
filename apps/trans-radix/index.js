/**
 * FeHelper 进制转换工具
 */
new Vue({
    el: '#pageContainer',
    data: {
        fromArray: [2, 4, 8, 10, 16],
        fromSelected: 10,
        toArray: [2, 4, 8, 10, 16],
        toSelected: 16,
        srcValue: 100,
        rstValue: 0
    },

    mounted: function () {
        // 进制转换的初始化
        this.radixConvert();
    },

    methods: {

        loadPatchHotfix() {
            // 页面加载时自动获取并注入页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'trans-radix'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js) {
                        try {
                            if (window.evalCore && window.evalCore.getEvalInstance) {
                                window.evalCore.getEvalInstance(window)(patch.js);
                            }
                        } catch (e) {
                            console.error('trans-radix补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        getId: (type, id) => [type, id].join('_'),

        switchInput: function () {
            [this.fromSelected, this.toSelected] = [this.toSelected, this.fromSelected];
            [this.srcValue, this.rstValue] = [this.rstValue, this.srcValue];
        },

        radixRadioClicked: function (type, n) {
            if (type === 1) {
                this.fromSelected = n;
            } else {
                this.toSelected = n;
            }
            this.radixConvert();
        },

        radixConvert: function () {
            this.$nextTick(() => {
                this.rstValue = parseInt(this.srcValue, this.fromSelected).toString(this.toSelected);
            });
        },

        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'trans-radix' }
            });
        },

        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        }   
        
        
    }
});