/**
 * FeHelper Json Format Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        defaultResultTpl: '<div class="x-placeholder"><img src="./json-demo.jpg" alt="json-placeholder"></div>',
        resultContent: '',
        jsonSource: '',
        errorMsg: '',
        jfCallbackName_start: '',
        jfCallbackName_end: ''
    },
    mounted: function () {
        this.resultContent = this.defaultResultTpl;

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        chrome.runtime.onMessage.addListener((request, sender, callback) => {
            let MSG_TYPE = Tarp.require('../static/js/msg_type');
            if (request.type === MSG_TYPE.TAB_CREATED_OR_UPDATED && request.event === MSG_TYPE.JSON_FORMAT) {
                if (request.content) {
                    this.jsonSource = request.content || this.defaultResultTpl;
                    this.format();
                }
            }
        });

        //输入框聚焦
        this.$refs.jsonBox.focus();

    },
    methods: {
        format: function () {
            this.errorMsg = '';
            this.resultContent = this.defaultResultTpl;

            let source = this.jsonSource.replace(/\n/gm, ' ');
            if (!source) {
                return;
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
                    let newSource = matches[2];
                    jsonObj = new Function("return " + newSource)();
                }

                if (jsonObj == null || typeof jsonObj !== 'object') {
                    jsonObj = new Function("return " + source)();

                    // 还要防止下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
                    if (typeof jsonObj === "string") {
                        // 再来一次
                        jsonObj = new Function("return " + jsonObj)();
                    }
                }
            } catch (ex) {
                this.errorMsg = ex.message;
                return;
            }

            // 是json格式，可以进行JSON自动格式化
            if (jsonObj != null && typeof jsonObj === "object") {
                try {
                    // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                    source = JSON.stringify(jsonObj);
                } catch (ex) {
                    // 通过JSON反解不出来的，一定有问题
                    return;
                }

                // 格式化
                Tarp.require('./format-lib').format(source);

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
    }
});