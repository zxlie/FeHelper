/**
 * 本库提供几个常用方法：
 * 1、enDecodeTools.uniEncode(text);    将中文进行Unicode编码并输出
 * 2、enDecodeTools.base64Encode(text); 将文字进行base64编码并输出
 * 3、enDecodeTools.base64Decode(text); 将经过base64编码的文字进行base64解码并输出
 * 4、enDecodeTools.utf8Encode(text); 将文字进行utf-8编码并输出
 * 5、enDecodeTools.utf8Decode(text); 将经过utf-8编码的文字进行utf-8解码并输出
 */

import Md5Utils from './md5.js';

let EncodeUtils = (() => {
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
        text = text = text.replace(/(\\)?\\u/gi, "%u").replace('%u0025', '%25');
        text = unescape(text.toString().replace(/%2B/g, "+"));

        let matches = text.match(/(%u00([0-9A-F]{2}))/gi);
        if (matches) {
            for (let matchid = 0; matchid < matches.length; matchid++) {
                let code = matches[matchid].substring(1, 3);
                let x = Number("0x" + code);
                if (x >= 128) {
                    text = text.replace(matches[matchid], code);
                }
            }
        }
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
        return str.replace(/\\x/g, '%');
    };

    let _utf8to16 = function (str) {
        return str.replace(/%/g, '\\x');
    };

    /**
     * md5加密
     * @param str
     */
    let md5 = (str) => {
        return Md5Utils.md5(str);
    };

    /**
     * 字符串与Hex编码互转
     * @param input
     * @returns {string}
     */
    let hexTools = (function (input) {
        let utf8encode = function (str, isGetBytes) {
            let back = [];
            let byteSize = 0;
            for (let i = 0; i < str.length; i++) {
                let code = str.charCodeAt(i);
                if (0x00 <= code && code <= 0x7f) {
                    byteSize += 1;
                    back.push(code);
                } else if (0x80 <= code && code <= 0x7ff) {
                    byteSize += 2;
                    back.push((192 | (31 & (code >> 6))));
                    back.push((128 | (63 & code)))
                } else if ((0x800 <= code && code <= 0xd7ff)
                    || (0xe000 <= code && code <= 0xffff)) {
                    byteSize += 3;
                    back.push((224 | (15 & (code >> 12))));
                    back.push((128 | (63 & (code >> 6))));
                    back.push((128 | (63 & code)))
                }
            }
            for (let i = 0; i < back.length; i++) {
                back[i] &= 0xff;
            }
            if (isGetBytes) {
                return back
            }
            if (byteSize <= 0xff) {
                return [0, byteSize].concat(back);
            } else {
                return [byteSize >> 8, byteSize & 0xff].concat(back);
            }
        };


        let utf8decode = function (arr) {
            if (typeof arr === 'string') {
                return arr;
            }
            let UTF = '', _arr = arr;
            for (let i = 0; i < _arr.length; i++) {
                let one = _arr[i].toString(2),
                    v = one.match(/^1+?(?=0)/);
                if (v && one.length === 8) {
                    let bytesLength = v[0].length;
                    let store = _arr[i].toString(2).slice(7 - bytesLength);
                    for (let st = 1; st < bytesLength; st++) {
                        store += _arr[st + i].toString(2).slice(2)
                    }
                    UTF += String.fromCharCode(parseInt(store, 2));
                    i += bytesLength - 1
                } else {
                    UTF += String.fromCharCode(_arr[i])
                }
            }
            return UTF
        };


        let hexEncode = function (str) {
            let charBuf = utf8encode(str, true);
            let re = '';

            for (let i = 0; i < charBuf.length; i++) {
                let x = (charBuf[i] & 0xFF).toString(16);
                if (x.length === 1) {
                    x = '0' + x;
                }
                re += x;
            }
            return re;
        };


        let hexDecode = function (str) {
            let buf = [];
            for (let i = 0; i < str.length; i += 2) {
                buf.push(parseInt(str.substring(i, i + 2), 16));
            }
            return utf8decode(buf);
        };

        return {hexEncode, hexDecode};
    })();


    /**
     * html代码转换成js
     * @param txt
     * @returns {string}
     */
    let _html2js = function (txt) {
        let htmlArr = txt.replace(/\\/g, "\\\\").replace(/\\/g, "\\/").replace(/\'/g, "\\\'").split('\n');
        let len = htmlArr.length;
        let outArr = [];
        outArr.push("let htmlCodes = [\n");
        htmlArr.forEach((value, index) => {
            if (value !== "") {
                if (index === len - 1) {
                    outArr.push("\'" + value + "\'");
                } else {
                    outArr.push("\'" + value + "\',\n");
                }
            }

        });
        outArr.push("\n].join(\"\");");
        return outArr.join("");
    };


    /**
     * URL 参数解析
     * @param url
     * @returns {{url: *, params: Array}}
     * @private
     */
    let _urlParamsDecode = function (url) {
        let res = {};
        try {
            let params = [];
            let urlObj = new URL(url);
            for (let item of urlObj.searchParams) {
                params.push(item);
            }
            res = {
                url: urlObj.href,
                params: params,
                protocol: urlObj.protocol,
                pathname: urlObj.pathname,
                hostname: urlObj.hostname
            }
        } catch (e) {
            res.error = '这不是一个合法的URL！无法完成解析！'
        }
        return res;
    };

    // sha1加密
    let _sha1Encode = function (str) {
        function encodeUTF8(s) {
            let i, r = [], c, x;
            for (i = 0; i < s.length; i++)
                if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
                else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
                else {
                    if ((x = c ^ 0xD800) >> 10 == 0)
                        c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
                            r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
                    else r.push(0xE0 + (c >> 12 & 0xF));
                    r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
                }
            return r;
        }

        var data = new Uint8Array(encodeUTF8(str))
        var i, j, t;
        var l = ((data.length + 8) >>> 6 << 4) + 16, s = new Uint8Array(l << 2);
        s.set(new Uint8Array(data.buffer)), s = new Uint32Array(s.buffer);
        for (t = new DataView(s.buffer), i = 0; i < l; i++)s[i] = t.getUint32(i << 2);
        s[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
        s[l - 1] = data.length << 3;
        var w = [], f = [
                function () { return m[1] & m[2] | ~m[1] & m[3]; },
                function () { return m[1] ^ m[2] ^ m[3]; },
                function () { return m[1] & m[2] | m[1] & m[3] | m[2] & m[3]; },
                function () { return m[1] ^ m[2] ^ m[3]; }
            ], rol = function (n, c) { return n << c | n >>> (32 - c); },
            k = [1518500249, 1859775393, -1894007588, -899497514],
            m = [1732584193, -271733879, null, null, -1009589776];
        m[2] = ~m[0], m[3] = ~m[1];
        for (i = 0; i < s.length; i += 16) {
            var o = m.slice(0);
            for (j = 0; j < 80; j++)
                w[j] = j < 16 ? s[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1),
                    t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0,
                    m[1] = rol(m[1], 30), m.pop(), m.unshift(t);
            for (j = 0; j < 5; j++)m[j] = m[j] + o[j] | 0;
        };
        t = new DataView(new Uint32Array(m).buffer);
        for (var i = 0; i < 5; i++)m[i] = t.getUint32(i << 2);

        var hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function (e) {
            return (e < 16 ? "0" : "") + e.toString(16);
        }).join("");
        return hex;
    };

    return {
        uniEncode: _uniEncode,
        uniDecode: _uniDecode,
        base64Encode: _base64Encode,
        base64Decode: _base64Decode,
        utf8Encode: _utf8Encode,
        utf8Decode: _utf8Decode,
        utf16to8: _utf16to8,
        utf8to16: _utf8to16,
        md5: md5,
        hexEncode: hexTools.hexEncode,
        hexDecode: hexTools.hexDecode,
        html2js: _html2js,
        urlParamsDecode: _urlParamsDecode,
        sha1Encode: _sha1Encode
    };
})();

export default EncodeUtils;
