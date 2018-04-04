/**
 * 让所有字符串支持空白过滤功能：trim
 * @retrn {String} 返回两端无空白的字符串
 */
String.prototype.trim = function(){
    return this.replace(/^\s*|\s*$/g,"");
};

/**
 * 日期格式化
 * @param {Object} pattern
 */
Date.prototype.format = function(pattern){
    var pad = function (source, length) {
        var pre = "",
            negative = (source < 0),
            string = String(Math.abs(source));

        if (string.length < length) {
            pre = (new Array(length - string.length + 1)).join('0');
        }

        return (negative ?  "-" : "") + pre + string;
    };

    if ('string' != typeof pattern) {
        return this.toString();
    }

    var replacer = function(patternPart, result) {
        pattern = pattern.replace(patternPart, result);
    }

    var year    = this.getFullYear(),
        month   = this.getMonth() + 1,
        date2   = this.getDate(),
        hours   = this.getHours(),
        minutes = this.getMinutes(),
        seconds = this.getSeconds();

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

    return pattern;
};

/**
 * 自动消失的Alert弹窗
 * @param content
 */
window.alert = function (content) {
    window.clearTimeout(window.feHelperAlertMsgTid);
    var elAlertMsg = $("#fehelper_alertmsg").hide();
    if(!elAlertMsg.get(0)) {
        elAlertMsg = $('<div id="fehelper_alertmsg" style="position:fixed;top:5px;right:5px;z-index:1000000">' +
            '<p style="background:#000;display:inline-block;color:#fff;text-align:center;' +
            'padding:10px 10px;margin:0 auto;font-size:14px;border-radius:4px;">' + content + '</p></div>').appendTo('body');
    }else{
        elAlertMsg.find('p').text(content).end().show();
    }

    window.feHelperAlertMsgTid = window.setTimeout(function () {
        elAlertMsg.hide(100);
    }, 3000);
};