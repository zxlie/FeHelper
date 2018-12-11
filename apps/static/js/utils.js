window.baidu = {
    namespace: {

        /**
         * 注册命名空间
         * @param {String} fullNS 完整的命名空间字符串，如baidu.libs.Firefox
         * @example baidu.namespace.register("baidu.libs.Firefox");
         */
        register: function (fullNS) {
            //命名空间合法性校验依据
            var reg = /^[_$a-z]+[_$a-z0-9]*/i;

            // 将命名空间切成N部分, 比如baidu.libs.Firefox等
            var nsArray = fullNS.split('.');
            var sEval = "";
            var sNS = "";
            var _tmpObj = [window];
            for (var i = 0; i < nsArray.length; i++) {
                //命名空间合法性校验
                if (!reg.test(nsArray[i])) {
                    throw new Error("Invalid namespace:" + nsArray[i] + "");
                    return;
                }

                _tmpObj[i + 1] = _tmpObj[i][nsArray[i]];
                if (typeof _tmpObj[i + 1] == 'undefined') {
                    _tmpObj[i + 1] = new Object();
                }
            }
        }
    },

    i18n: {
        getMessage: function (msgId, arr) {
            if (arr) {
                for (var i = 0, len = arr.length; i < len; i++) {
                    arr[i] = '' + arr[i];
                }
                return chrome.i18n.getMessage(msgId, arr);
            } else {
                return chrome.i18n.getMessage(msgId);
            }
        }
    }
};

/**
 * 获取某字符串的字节数
 */
String.prototype.getBytes = function () {
    var stream = this.replace(/\n/g, 'xx').replace(/\t/g, 'x');
    var escapedStr = encodeURIComponent(stream);
    return escapedStr.replace(/%[A-Z0-9][A-Z0-9]/g, 'x').length;
}

/**
 * 让所有字符串支持空白过滤功能：trim
 * @retrn {String} 返回两端无空白的字符串
 */
String.prototype.trim = function () {
    return this.replace(/^\s*|\s*$/g, "");
};

/**
 * 日期格式化
 * @param {Object} pattern
 */
Date.prototype.format = function (pattern) {
    let pad = function (source, length) {
        let pre = "",
            negative = (source < 0),
            string = String(Math.abs(source));

        if (string.length < length) {
            pre = (new Array(length - string.length + 1)).join('0');
        }

        return (negative ? "-" : "") + pre + string;
    };

    if ('string' !== typeof pattern) {
        return this.toString();
    }

    let replacer = function (patternPart, result) {
        pattern = pattern.replace(patternPart, result);
    };

    let year = this.getFullYear(),
        month = this.getMonth() + 1,
        date2 = this.getDate(),
        hours = this.getHours(),
        minutes = this.getMinutes(),
        seconds = this.getSeconds(),
        milliSec = this.getMilliseconds();

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
    replacer(/SSS/g, pad(milliSec,3));
    replacer(/S/g, milliSec);

    return pattern;
};

/**
 * 自动消失的Alert弹窗
 * @param content
 */
window.alert = function (content) {
    window.clearTimeout(window.feHelperAlertMsgTid);
    let elAlertMsg = document.querySelector("#fehelper_alertmsg");
    if (!elAlertMsg) {
        let elWrapper = document.createElement('div');
        elWrapper.innerHTML = '<div id="fehelper_alertmsg" style="position:fixed;top:5px;right:5px;z-index:1000000">' +
            '<p style="background:#000;display:inline-block;color:#fff;text-align:center;' +
            'padding:10px 10px;margin:0 auto;font-size:14px;border-radius:4px;">' + content + '</p></div>';
        elAlertMsg = elWrapper.childNodes[0];
        document.body.appendChild(elAlertMsg);
    } else {
        elAlertMsg.querySelector('p').innerHTML = content;
        elAlertMsg.style.display = 'block';
    }

    window.feHelperAlertMsgTid = window.setTimeout(function () {
        elAlertMsg.style.display = 'none';
    }, 3000);
};

/**
 * 获取当前脚本的绝对路径
 * @returns {string}
 */
module.exports.getCurrAbsPath = function () {
    let rExtractUri = /((?:http|https|file|chrome-extension):\/\/.*?\/[^:]+)(?::\d+)?:\d+/;
    let stack;
    try {
        a.b();
    }
    catch (e) {
        stack = e.fileName || e.sourceURL || e.stack || e.stacktrace;
    }
    if (stack) {
        return rExtractUri.exec(stack)[1];
    }
};