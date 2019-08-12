/**
 * FeHelper 简易版Postman
 */

// json with bigint supported
Tarp.require('../static/vendor/json-bigint/index');

new Vue({
    el: '#pageContainer',
    data: {
        urlContent: '',
        methodContent: 'GET',
        resultContent: '',
        paramContent: '',
        responseHeaders: [],
        jfCallbackName_start: '',
        jfCallbackName_end: '',
        errorMsgForJson: ''
    },

    mounted: function () {
        this.$refs.url.focus();
    },
    methods: {
        postman: function () {
            this.$nextTick(() => {
                this.sendRequest(this.urlContent, this.methodContent, this.paramContent);
            });
        },

        sendRequest: function (url, method, body) {
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("readystatechange", (resp) => {
                let result = 'Loading...';
                switch (resp.target.readyState) {
                    case resp.target.OPENED:
                        result = 'Senting...';
                        break;
                    case resp.target.HEADERS_RECEIVED:
                        result = 'Headers received';
                        this.responseHeaders = resp.target.getAllResponseHeaders().trim().split('\n').map(item => {
                            return item.split(': ').map(x => x.trim())
                        });
                        break;
                    case resp.target.LOADING:
                        result = 'Loading...';
                        break;
                    case resp.target.DONE:
                        try {
                            result = JSON.stringify(JSON.parse(resp.target.responseText), null, 4);

                        } catch (e) {
                            result = resp.target.responseText;
                        }

                        this.jsonFormat(result);
                        this.renderTab();
                        break;
                }
                this.resultContent = result || '无数据';
            });
            xhr.open(method, url);
            if(method.toLowerCase() === 'post') {
                xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
                xhr.send(body);
            }else{
                xhr.send();
            }
        },

        renderTab: function () {
            jQuery('#tabs').tabs({
                show: (event, ui) => {
                }
            });
            this.$refs.resultContainer.classList.remove('hide');
        },


        jsonFormat: function (source) {
            this.errorMsgForJson = '';
            this.jfCallbackName_start = '';
            this.jfCallbackName_end = '';

            if (!source) {
                return false;
            }

            // JSONP形式下的callback name
            let funcName = null;
            // json对象
            let jsonObj = null;

            // 下面校验给定字符串是否为一个合法的json
            try {
                // 再看看是不是jsonp的格式
                let reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/igm;
                let matches = reg.exec(source);
                if (matches != null) {
                    funcName = matches[1];
                    source = matches[2];
                }
                // 这里可能会throw exception
                jsonObj = JSON.parse(source);
            } catch (ex) {
                // new Function的方式，能自动给key补全双引号，但是不支持bigint，所以是下下策，放在try-catch里搞
                try {
                    jsonObj = new Function("return " + source)();
                } catch (exx) {
                    try {
                        // 再给你一次机会，是不是下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
                        jsonObj = new Function("return '" + source + "'")();
                        if (typeof jsonObj === 'string') {
                            // 最后给你一次机会，是个字符串，老夫给你再转一次
                            jsonObj = new Function("return " + jsonObj)();
                        }
                    } catch (exxx) {
                        this.errorMsgForJson = exxx.message;
                    }
                }
            }

            // 是json格式，可以进行JSON自动格式化
            if (jsonObj != null && typeof jsonObj === "object" && !this.errorMsgForJson.length) {
                try {
                    // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                    source = JSON.stringify(jsonObj);
                } catch (ex) {
                    // 通过JSON反解不出来的，一定有问题
                    this.errorMsgForJson = ex.message;
                }

                if (!this.errorMsgForJson.length) {
                    // 格式化
                    Tarp.require('../json-format/format-lib').format(source);

                    // 如果是JSONP格式的，需要把方法名也显示出来
                    if (funcName != null) {
                        this.jfCallbackName_start = funcName + '(';
                        this.jfCallbackName_end = ')';
                    } else {
                        this.jfCallbackName_start = '';
                        this.jfCallbackName_end = '';
                    }
                }
            }

            // 不是json，都格式化不了，一定会出错
            if (this.errorMsgForJson) {
                let el = document.querySelector('#optionBar');
                el && (el.style.display = 'none');
            }

        },

        setDemo: function (type) {
            if (type === 1) {
                this.urlContent = 'https://www.sojson.com/api/qqmusic/8446666/json';
                this.methodContent = 'GET';
            } else {
                this.urlContent = 'https://www.baidufe.com/test-post.php';
                this.methodContent = 'POST';
                this.paramContent = 'username=postman&password=123456'
            }

        }

    }
});