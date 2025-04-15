/**
 * FeHelper 简易版Postman
 */

const JSON_SORT_TYPE_KEY = 'json_sort_type_key';
new Vue({
    el: '#pageContainer',
    data: {
        urlContent: '',
        methodContent: 'GET',
        resultContent: '',
        funcName: '',
        paramContent: '',
        responseHeaders: [],
        jfCallbackName_start: '',
        jfCallbackName_end: '',
        errorMsgForJson: '',
        originalJsonStr: '',
        headerList: [new Date() * 1],
        urlencodedDefault: 1,
        urlParams: [],
        paramMode:'kv' // kv、json
    },

    watch: {
        urlContent: function (val) {
            let url = val;
            let reg = /[?&]([^?&#]+)=([^?&#]*)/g;
            let params = [];
            let ret = reg.exec(url);
            while (ret) {
                params.push({
                    key: ret[1],
                    value: ret[2],
                });
                ret = reg.exec(url);
            }
            const originStr = this.urlParams2String(params);
            const newStr = this.urlParams2String(this.urlParams);
            if (originStr !== newStr) {
                this.urlParams = params;
            }
        },
        urlParams: {
            handler(val) {
              this.urlContent =
                this.urlContent.substr(0, this.urlContent.indexOf("?") + 1) +
                val.map((item) => `${item.key}=${item.value}`).join("&");
            },
            deep: true,
        },
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

            let isPost = false;
            if (method.toLowerCase() === 'post') {
                isPost = true;
                this.urlencodedDefault && xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }

            // 设置请求头：Header
            this.headerList.forEach(id => {
                let headerKey = $(`#header_key_${id}`).val();
                let headerVal = $(`#header_value_${id}`).val();
                if (headerKey && headerVal) {
                    xhr.setRequestHeader(headerKey, headerVal);
                }
            });

            // 如果body是json格式的，需要转换成k-v格式
            try {
                let obj = JSON.parse(body);
                body = Object.keys(obj).map(k => {
                    let v = JSON.stringify(obj[k]).replace(/"/g,'');
                    return `${k}=${v}`;
                }).join('&');
            } catch (e) {
            }

            xhr.send(isPost && body);
        },

        addHeader() {
            this.headerList.push(new Date() * 1);
        },
        deleteHeader(event) {
            event.target.parentNode.remove();
        },
        transParamMode(){
            if(this.paramMode === 'kv') {
                this.paramMode = 'json';
                let objParam = {};
                this.paramContent.split('&').forEach(p => {
                    let x = p.split('=');
                    objParam[x[0]] = x[1];
                });
                this.paramContent = JSON.stringify(objParam,null,4);
            }else{
                this.paramMode = 'kv';
                try {
                    let obj = JSON.parse(this.paramContent);
                    this.paramContent = Object.keys(obj).map(k => {
                        let v = JSON.stringify(obj[k]).replace(/"/g,'');
                        return `${k}=${v}`;
                    }).join('&');
                } catch (e) {
                }
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

            // json对象
            let jsonObj = null;

            // 下面校验给定字符串是否为一个合法的json
            try {
                this.funcName = '';

                // 再看看是不是jsonp的格式
                let reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/igm;
                let matches = reg.exec(source);
                if (matches != null) {
                    this.funcName = matches[1];
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

                    this.originalJsonStr = source;

                    // 获取上次记录的排序方式
                    let curSortType = parseInt(localStorage.getItem(JSON_SORT_TYPE_KEY) || 0);
                    this.didFormat(curSortType);

                    // 排序选项初始化
                    $('[name=jsonsort][value=' + curSortType + ']').attr('checked', 1);

                    let that = this;
                    $('[name=jsonsort]').click(function (e) {
                        let sortType = parseInt(this.value);
                        if (sortType !== curSortType) {
                            that.didFormat(sortType);
                            curSortType = sortType;
                        }
                        localStorage.setItem(JSON_SORT_TYPE_KEY, sortType);
                    });
                }
            }

            // 不是json，都格式化不了，一定会出错
            if (this.errorMsgForJson) {
                let el = document.querySelector('#optionBar');
                el && (el.style.display = 'none');
            }

        },

        didFormat: function (sortType) {
            sortType = sortType || 0;
            let source = this.originalJsonStr;

            if (sortType !== 0) {
                let jsonObj = JsonABC.sortObj(JSON.parse(this.originalJsonStr), parseInt(sortType), true);
                source = JSON.stringify(jsonObj);
            }

            Formatter.format(source);
            $('.x-toolbar').fadeIn(500);

            // 如果是JSONP格式的，需要把方法名也显示出来
            if (this.funcName) {
                $('#jfCallbackName_start').html(this.funcName + '(');
                $('#jfCallbackName_end').html(')');
            } else {
                this.jfCallbackName_start = '';
                this.jfCallbackName_end = '';
            }
        },

        setDemo: function (type) {
            if (type === 1) {
                this.urlContent = 'http://t.weather.sojson.com/api/weather/city/101030100';
                this.methodContent = 'GET';
            } else {
                this.urlContent = 'https://www.baidufe.com/test-post.php';
                this.methodContent = 'POST';
                this.paramContent = 'username=postman&password=123456'
            }
        },

        urlParams2String: function (params) {
            return params.map((param) => `${param.key}=${param.value}`).join("&")
        }

    }
});
