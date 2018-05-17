/**
 * 本库提供几个常用方法：
 * 1、enDecodeTools.uniEncode(text);    将中文进行Unicode编码并输出
 * 2、enDecodeTools.base64Encode(text); 将文字进行base64编码并输出
 * 3、enDecodeTools.base64Decode(text); 将经过base64编码的文字进行base64解码并输出
 * 4、enDecodeTools.utf8Encode(text); 将文字进行utf-8编码并输出
 * 5、enDecodeTools.utf8Decode(text); 将经过utf-8编码的文字进行utf-8解码并输出
 */
module.exports = (() => {
    //base64编码字符集
    let _base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    //base64解码字符集
    let _base64DecodeChars = [
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
        -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
        -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1];


    /**
     * 此方法实现中文向Unicode的转码，与Jre中的"native2ascii"命令一样
     * @param {String} text 需要进行转码的字符串
     * @return {String} Unicode码
     */
    let _uniEncode = function (text) {

        let res = [];
        for (let i = 0; i < text.length; i++) {
            res[i] = ("00" + text.charCodeAt(i).toString(16)).slice(-4);
        }
        return "\\u" + res.join("\\u");
    };

    /**
     * 此方法用于将Unicode码解码为正常字符串
     * @param {Object} text
     */
    let _uniDecode = function (text) {
        text = text.replace(/\\/g, "%").replace('%U', '%u').replace('%u0025', '%25');
        text = unescape(text.toString().replace(/%2B/g, "+"));

        return text;
    };

    /**
     * 此方法用于将文字进行UTF-8编码
     * @param {Object} str 源码
     * @return {String} UTF-8码
     */
    let _utf8Encode = function (str) {
        let out, i, len, c;
        out = "";
        len = str.length;
        for (i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if ((c >= 0x0001) && (c <= 0x007F)) {
                out += str.charAt(i);
            } else if (c > 0x07FF) {
                out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
                out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
            } else {
                out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
            }
        }
        return out;
    };

    /**
     * 此方法用于将文字进行UTF-8解码
     * @param {Object} str
     * @return {String} 原文字
     */
    let _utf8Decode = function (str) {
        let out, i, len, c;
        let char2, char3;
        out = "";
        len = str.length;
        i = 0;
        while (i < len) {
            c = str.charCodeAt(i++);
            switch (c >> 4) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                    // 0xxxxxxx
                    out += str.charAt(i - 1);
                    break;
                case 12:
                case 13:
                    // 110x xxxx　 10xx xxxx
                    char2 = str.charCodeAt(i++);
                    out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                    break;
                case 14:
                    // 1110 xxxx　10xx xxxx　10xx xxxx
                    char2 = str.charCodeAt(i++);
                    char3 = str.charCodeAt(i++);
                    out += String.fromCharCode(((c & 0x0F) << 12) |
                        ((char2 & 0x3F) << 6) |
                        ((char3 & 0x3F) << 0));
                    break;
            }
        }
        return out;
    };

    /**
     * 此方法用于将文字进行base64编码
     * @param {Object} str 源码
     * @return {String} base64码
     */
    let _base64Encode = function (str) {
        let out, i, len;
        let c1, c2, c3;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            c1 = str.charCodeAt(i++) & 0xff;
            if (i == len) {
                out += _base64EncodeChars.charAt(c1 >> 2);
                out += _base64EncodeChars.charAt((c1 & 0x3) << 4);
                out += "==";
                break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len) {
                out += _base64EncodeChars.charAt(c1 >> 2);
                out += _base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                out += _base64EncodeChars.charAt((c2 & 0xF) << 2);
                out += "=";
                break;
            }
            c3 = str.charCodeAt(i++);
            out += _base64EncodeChars.charAt(c1 >> 2);
            out += _base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += _base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
            out += _base64EncodeChars.charAt(c3 & 0x3F);
        }
        return out;
    };

    /**
     * 此方法用于将文字进行base64解码
     * @param {Object} str 源码
     * @return {String} 源码
     */
    let _base64Decode = function (str) {
        let c1, c2, c3, c4;
        let i, len, out;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            /* c1 */
            do {
                c1 = _base64DecodeChars[str.charCodeAt(i++) & 0xff];
            }
            while (i < len && c1 == -1);
            if (c1 == -1)
                break;
            /* c2 */
            do {
                c2 = _base64DecodeChars[str.charCodeAt(i++) & 0xff];
            }
            while (i < len && c2 == -1);
            if (c2 == -1)
                break;
            out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
            /* c3 */
            do {
                c3 = str.charCodeAt(i++) & 0xff;
                if (c3 == 61)
                    return out;
                c3 = _base64DecodeChars[c3];
            }
            while (i < len && c3 == -1);
            if (c3 == -1)
                break;
            out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
            /* c4 */
            do {
                c4 = str.charCodeAt(i++) & 0xff;
                if (c4 == 61)
                    return out;
                c4 = _base64DecodeChars[c4];
            }
            while (i < len && c4 == -1);
            if (c4 == -1)
                break;
            out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
        }

        return out;
    };

    /**
     * 中文，一般情况下Unicode是UTF-16实现，长度2位，而UTF-8编码是3位
     * @param str
     * @return {String}
     */
    let _utf16to8 = function (str) {
        let out, i, len, c;
        out = "";
        len = str.length;
        for (i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if ((c >= 0x0001) && (c <= 0x007F)) {
                out += str.charAt(i);
            } else if (c > 0x07FF) {
                out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
                out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
            } else {
                out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
            }
        }
        return out;
    };

    /**
     * md5加密
     * @param str
     */
    let md5 = (str) => {
        let md5 = Tarp.require('./md5');
        return md5(str);
    };

    return {
        uniEncode: _uniEncode,
        uniDecode: _uniDecode,
        base64Encode: _base64Encode,
        base64Decode: _base64Decode,
        utf8Encode: _utf8Encode,
        utf8Decode: _utf8Decode,
        utf16to8: _utf16to8,
        md5: md5
    };
})();

