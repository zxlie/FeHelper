new Vue({
    el: '#mainContainer',
    data: {
        unSavedNaotuKey: 'NAOTU-UN-SAVED-KEY',
        mySavedNaotuListKey: 'NAOTU-MY-SAVED-KEY',
        mySavedNaotuList: [],
        curNaotu: {},
        oldMinderData: null,
        showSavedNaotuList: false,
        naotuTips: ''
    },
    mounted: function () {
    },
    methods: {

        exportNaotu: function (protocal) {
            // 导出JSON
            let blob = null;
            let fileName = `FeHelper-Naotu-${new Date * 1}.json`;
            blob = new Blob([JSON.stringify(this.mySavedNaotuList)], {type: 'application/octet-stream'});
            let elm = document.createElement('a');
            elm.setAttribute('download', fileName);
            elm.setAttribute('href', URL.createObjectURL(blob));
            elm.style.cssText = 'position:absolute;top:-1000px;left:-1000px;';
            document.body.appendChild(elm);
            elm.click();
            elm.remove();
        },
        myNaotu: function () {
            this.showSavedNaotuList = !this.showSavedNaotuList;
        },

        deleteNaotu: function (id) {
            this.mySavedNaotuList.some((naotu, index) => {
                if (naotu.id === id) {
                    this.mySavedNaotuList.splice(index, 1);
                    return true;
                }
                return false;
            });
            localStorage.setItem(this.mySavedNaotuListKey, JSON.stringify(this.mySavedNaotuList));
        },

        dateFormat: function (date) {
            let pattern = 'yyyy-MM-dd HH:mm:ss';
            date = new Date(date);

            let pad = function (source, length) {
                let pre = "",
                    negative = (source < 0),
                    string = String(Math.abs(source));

                if (string.length < length) {
                    pre = (new Array(length - string.length + 1)).join('0');
                }

                return (negative ? "-" : "") + pre + string;
            };

            let replacer = function (patternPart, result) {
                pattern = pattern.replace(patternPart, result);
            };

            let year = date.getFullYear(),
                month = date.getMonth() + 1,
                date2 = date.getDate(),
                hours = date.getHours(),
                minutes = date.getMinutes(),
                seconds = date.getSeconds(),
                milliSec = date.getMilliseconds();

            replacer(/yyyy/g, pad(year, 4));
            replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
            replacer(/MM/g, pad(month, 2));
            replacer(/M/g, month);
            replacer(/dd/g, pad(date2, 2));
            replacer(/d/g, date2);

            replacer(/HH/g, pad(hours, 2));
            replacer(/H/g, hours);
            replacer(/hh/g, pad(hours % 12, 2));
            replacer(/h/g, hours % 12);
            replacer(/mm/g, pad(minutes, 2));
            replacer(/m/g, minutes);
            replacer(/ss/g, pad(seconds, 2));
            replacer(/s/g, seconds);
            replacer(/SSS/g, pad(milliSec, 3));
            replacer(/S/g, milliSec);

            return pattern;
        },
    }
});
