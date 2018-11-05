/**
 * 日期时间formatter
 */

// get current date and time
let getDateTime = function () {
    let currentTime = new Date();
    let month = currentTime.getMonth() + 1;
    let day = currentTime.getDate();
    let year = currentTime.getFullYear();
    let hours = currentTime.getHours();
    let minutes = currentTime.getMinutes();
    let seconds = currentTime.getSeconds();

    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = '0' + seconds;

    return 'Y-m-d H:i:s'.replace('Y', year)
        .replace('m', month)
        .replace('d', day)
        .replace('H', hours)
        .replace('i', minutes)
        .replace('s', seconds);

};

// get ISO 8601 date and time
let getISODateTime = function (d) {

    function pad(n) {
        return n < 10 ? '0' + n : n
    }

    return d.getUTCFullYear() + '-'
        + pad(d.getUTCMonth() + 1) + '-'
        + pad(d.getUTCDate()) + 'T'
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds()) + 'Z'
};

/**
 * 日期格式化
 * @param date_str
 *
 * @example prettyDate("2010-08-28T20:24:17Z")
 * @returns {*}
 */
let prettyDate = function (date_str) {
    let time_formats = [
        [60, '刚刚'],
        [90, '1分钟'], // 60*1.5
        [3600, '分钟', 60], // 60*60, 60
        [5400, '1小时'], // 60*60*1.5
        [86400, '小时', 3600], // 60*60*24, 60*60
        [129600, '1天'], // 60*60*24*1.5
        [604800, '天', 86400], // 60*60*24*7, 60*60*24
        [907200, '1周'], // 60*60*24*7*1.5
        [2628000, '周', 604800], // 60*60*24*(365/12), 60*60*24*7
        [3942000, '1月'], // 60*60*24*(365/12)*1.5
        [31536000, '月', 2628000], // 60*60*24*365, 60*60*24*(365/12)
        [47304000, '1年'], // 60*60*24*365*1.5
        [3153600000, '年', 31536000], // 60*60*24*365*100, 60*60*24*365
        [4730400000, '1世纪'] // 60*60*24*365*100*1.5
    ];

    let time = ('' + date_str).replace(/-/g, "/").replace(/[TZ]/g, " "),
        dt = new Date,
        seconds = ((dt - new Date(time)) / 1000),
        token = '前',
        i = 0,
        format;

    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = '后';
    }

    while (format = time_formats[i++]) {
        if (seconds < format[0]) {
            if (format.length === 2) {
                return format[1] + (i > 1 ? token : '');
            } else {
                return Math.round(seconds / format[2]) + format[1] + (i > 1 ? token : '');
            }
        }
    }

    // overflow for centuries
    if (seconds > 4730400000)
        return Math.round(seconds / 4730400000) + '世纪' + token;

    return date_str;
};
