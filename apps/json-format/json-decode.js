/**
 * 此方法用于将Json内容的Unicode编解码
 * @param {Object} text
 */
window.JsonEnDecode = {
    uniEncode: function (str) {
        return escape(str)
            .replace(/%u/gi, '\\u')
            .replace(/%7b/gi, '{')
            .replace(/%7d/gi, '}')
            .replace(/%3a/gi, ':')
            .replace(/%2c/gi, ',')
            .replace(/%27/gi, '\'')
            .replace(/%22/gi, '"')
            .replace(/%5b/gi, '[')
            .replace(/%5d/gi, ']')
            .replace(/%3D/gi, '=')
            .replace(/%08/gi, '\b')
            .replace(/%0D/gi, '\r')
            .replace(/%0C/gi, '\f')
            .replace(/%09/gi, '\t')
            .replace(/%20/gi, ' ')
            .replace(/%0A/gi, '\n')
            .replace(/%3E/gi, '>')
            .replace(/%3C/gi, '<')
            .replace(/%3F/gi, '?');
    },
    uniDecode: function (text) {
        text = text.replace(/(\\)?\\u/gi, "%u").replace('%u0025', '%25');
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
    },

    urlDecode: function (str) {
        try {
            return decodeURIComponent(str);
        } catch (e) {
            return str;
        }
    },

    // 此种模式，随便用
    urlDecodeByFetch: function (str) {
        return new Promise((resolve, reject) => {
            try {
                fetch(`data:text/javascript;charset=utf8,${str.replace(/"/g, '%22').replace(/#/g, '%23')}`)
                    .then(res => res.text(), error => {
                        reject && reject(error);
                    })
                    .then(text => {
                        resolve && resolve(text);
                    });
            } catch (e) {
                resolve && resolve(str);
            }
        });
    },

    // 此种形式需要在manifest中增加csp策略，暂且不用
    urlDecodeByIframe: function (str, charset) {
        charset = charset || 'utf8';
        return new Promise((resolve, reject) => {
            let iframe = document.querySelector('#_urlDecode_iframe_');
            if (iframe) {
                iframe.remove();
            }
            iframe = document.createElement('iframe');
            iframe.setAttribute('id', '_urlDecode_iframe_');
            iframe.style.display = 'none';
            iframe.width = "0";
            iframe.height = "0";
            iframe.scrolling = "no";
            iframe.allowtransparency = "true";
            iframe.frameborder = "0";
            iframe.src = 'about:blank';
            document.body.appendChild(iframe);
            window._urlDecodeCallback = window._urlDecodeCallback || function (e) {
                resolve && resolve(e.data);
                iframe.remove();
            };
            window.removeEventListener('message', window._urlDecodeCallback);
            window.addEventListener('message', window._urlDecodeCallback, false);
            try {
                iframe.contentWindow.document.write('<html><scrip' + `t charset="${charset}" src="data:text/javascript;charset=${charset},parent.postMessage(\`${str.replace(/"/g, '%22').replace(/#/g, '%23')}\`)"></scrip` + 't></html>');
            } catch (e) {
                reject && reject(e);
            }
        });
    }
};