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
        getId: (type, id) => [type, id].join('_'),

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
        }
    }
});