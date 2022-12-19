/**
 * FeHelper 颜色转换工具
 */
new Vue({
    el: '#pageContainer',
    data: {
        fromHEX: '#43ad7f7f',
        toRGB: '',
        fromRGB: 'rgba(190,20,128,0.5)',
        toHEX: ''
    },

    mounted: function () {
        // 初始化颜色转换
        this.colorHexToRgb();
        this.colorRgbToHex();
    },

    methods: {

        colorHexToRgb: function () {
            let hex = this.fromHEX.trim().replace(/^#/, '');
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
                this.toRGB = 'rgb(' + rgb.join(', ') + ')';
            } else if (rgb.length === 4) {
                this.toRGB = 'rgba(' + rgb.join(', ') + ')';
            } else {
                this.toRGB = '';
            }
        },

        colorRgbToHex: function () {
            let rgb = this.fromRGB.trim().replace(/\s+/g, '').replace(/[^\d,\.]/g, '').split(',').filter(n => {
                return n.length && parseInt(n, 10) <= 255;
            });
            let hex = [];
            if (rgb.length === 3 || rgb.length === 4) {
                hex.push(parseInt(rgb[0], 10).toString(16).padStart(2, '0'));                       // r
                hex.push(parseInt(rgb[1], 10).toString(16).padStart(2, '0'));                       // g
                hex.push(parseInt(rgb[2], 10).toString(16).padStart(2, '0'));                       // b
                rgb.length === 4 && hex.push(Math.floor(parseFloat(rgb[3], 10) * 255).toString(16).padStart(2, '0'));   // a
            }
            if (hex.length) {
                this.toHEX = '#' + hex.join('');
            } else {
                this.toHEX = '';
            }
        }
    }
});