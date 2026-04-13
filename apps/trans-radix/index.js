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
                            new Function(patch.js)();
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
                try {
                    const src = String(this.srcValue).trim();
                    if (!src) { this.rstValue = '0'; return; }
                    const from = this.fromSelected;
                    const to = this.toSelected;
                    let decimal;
                    if (from === 10) {
                        decimal = BigInt(src);
                    } else {
                        decimal = BigInt(0);
                        const digits = src.toLowerCase();
                        const base = BigInt(from);
                        for (let i = 0; i < digits.length; i++) {
                            const d = parseInt(digits[i], from);
                            if (isNaN(d)) throw new Error('Invalid digit');
                            decimal = decimal * base + BigInt(d);
                        }
                    }
                    if (to === 10) {
                        this.rstValue = decimal.toString();
                    } else {
                        if (decimal === 0n) { this.rstValue = '0'; return; }
                        const base = BigInt(to);
                        const chars = '0123456789abcdef';
                        let result = '';
                        let n = decimal < 0n ? -decimal : decimal;
                        while (n > 0n) {
                            result = chars[Number(n % base)] + result;
                            n = n / base;
                        }
                        this.rstValue = (decimal < 0n ? '-' : '') + result;
                    }
                } catch (e) {
                    this.rstValue = 'NaN';
                }
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