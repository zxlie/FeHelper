/**
 * FeHelper 多维度工具组合
 */
new Vue({
    el: '#pageContainer',
    data: {
        radix: {
            fromArray: [2, 4, 8, 10, 16],
            fromSelected: 10,
            toArray: [2, 4, 8, 10, 16],
            toSelected: 16,
            srcValue: 100,
            rstValue: 0
        },

        color: {
            fromHEX: '#43ad7f7f',
            toRGB: '',
            fromRGB: 'rgba(190,20,128,0.5)',
            toHEX: ''
        }
    },

    mounted: function () {
        jQuery('#tabs').tabs();

        // 进制转换的初始化
        this.radixConvert();

        // 初始化颜色转换
        this.colorHexToRgb();
        this.colorRgbToHex();
    },

    methods: {
        getId: (type, id) => [type, id].join('_'),

        radixRadioClicked: function (type, n) {
            if (type === 1) {
                this.radix.fromSelected = n;
            } else {
                this.radix.toSelected = n;
            }
            this.radixConvert();
        },

        radixConvert: function () {
            this.$nextTick(() => {
                this.radix.rstValue = parseInt(this.radix.srcValue, this.radix.fromSelected).toString(this.radix.toSelected);
            });
        },

        colorHexToRgb: function () {
            let hex = this.color.fromHEX.trim().replace(/^#/, '');
            let rgb = [];
            switch (hex.length) {
                case 3:
                case 4:
                    rgb.push(parseInt(hex[0] + '' + hex[0], 16).toString(10));                       // r
                    rgb.push(parseInt(hex[1] + '' + hex[1], 16).toString(10));                       // g
                    rgb.push(parseInt(hex[2] + '' + hex[2], 16).toString(10));                       // b
                    hex.length === 4 && rgb.push((parseInt(parseInt(hex[3] + '' + hex[3], 16).toString(10)) / 256).toFixed(2));   // a
                    break;
                case 6:
                case 8:
                    rgb.push(parseInt(hex[0] + '' + hex[1], 16).toString(10));                       // r
                    rgb.push(parseInt(hex[2] + '' + hex[3], 16).toString(10));                       // g
                    rgb.push(parseInt(hex[4] + '' + hex[5], 16).toString(10));                       // b
                    hex.length === 8 && rgb.push((parseInt(parseInt(hex[6] + '' + hex[7], 16).toString(10)) / 256).toFixed(2));   // a
                    break;
            }
            if (rgb.length === 3) {
                this.color.toRGB = 'rgb(' + rgb.join(', ') + ')';
            } else if (rgb.length === 4) {
                this.color.toRGB = 'rgba(' + rgb.join(', ') + ')';
            } else {
                this.color.toRGB = '';
            }
        },

        colorRgbToHex: function () {
            let rgb = this.color.fromRGB.trim().replace(/\s+/g, '').replace(/[^\d,\.]/g, '').split(',').filter(n => {
                return n.length && parseInt(n, 10) <= 255;
            });
            let hex = [];
            if (rgb.length === 3 || rgb.length === 4) {
                hex.push(parseInt(rgb[0], 10).toString(16).padStart(2, '0'));                       // r
                hex.push(parseInt(rgb[1], 10).toString(16).padStart(2, '0'));                       // g
                hex.push(parseInt(rgb[2], 10).toString(16).padStart(2, '0'));                       // b
                rgb.length === 4 && hex.push(Math.floor(parseFloat(rgb[3], 10) * 256).toString(16).padStart(2, '0'));   // a
            }
            if (hex.length) {
                this.color.toHEX = '#' + hex.join('');
            } else {
                this.color.toHEX = '';
            }
        }
    }
});