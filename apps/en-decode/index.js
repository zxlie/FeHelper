/**
 * FeHelper 信息编解码
 */
new Vue({
    el: '#pageContainer',
    data: {
        selectedType: 'uniEncode',
        sourceContent: '',
        resultContent: '',
        urlResult: null
    },

    mounted: function () {

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        if (location.protocol === 'chrome-extension:') {
            chrome.runtime.onMessage.addListener((request, sender, callback) => {
                if (request.type === 'TAB_CREATED_OR_UPDATED' && request.content && request.event === location.pathname.split('/')[1]) {
                    this.sourceContent = request.content;
                    this.convert();
                }
                callback && callback();
                return true;
            });
        }

        this.$refs.srcText.focus();
    },
    methods: {
        convert: function () {
            this.$nextTick(() => {
                this.urlResult = null;

                let tools = Tarp.require('./endecode-lib');

                if (this.selectedType === 'uniEncode') {

                    this.resultContent = tools.uniEncode(this.sourceContent);
                } else if (this.selectedType === 'uniDecode') {

                    this.resultContent = tools.uniDecode(this.sourceContent.replace(/\\U/g, '\\u'));
                } else if (this.selectedType === 'utf8Encode') {

                    this.resultContent = encodeURIComponent(this.sourceContent);
                } else if (this.selectedType === 'utf8Decode') {

                    this.resultContent = decodeURIComponent(this.sourceContent);
                } else if (this.selectedType === 'utf16Encode') {

                    this.resultContent = tools.utf8to16(encodeURIComponent(this.sourceContent));
                } else if (this.selectedType === 'utf16Decode') {

                    this.resultContent = decodeURIComponent(tools.utf16to8(this.sourceContent));
                } else if (this.selectedType === 'base64Encode') {

                    this.resultContent = tools.base64Encode(tools.utf8Encode(this.sourceContent));
                } else if (this.selectedType === 'base64Decode') {

                    this.resultContent = tools.utf8Decode(tools.base64Decode(this.sourceContent));
                } else if (this.selectedType === 'md5Encode') {

                    this.resultContent = tools.md5(this.sourceContent);
                } else if (this.selectedType === 'hexEncode') {

                    this.resultContent = tools.hexEncode(this.sourceContent);
                } else if (this.selectedType === 'hexDecode') {

                    this.resultContent = tools.hexDecode(this.sourceContent);
                } else if (this.selectedType === 'gzipEncode') {

                    this.resultContent = tools.gzipEncode(this.sourceContent);
                } else if (this.selectedType === 'gzipDecode') {

                    this.resultContent = tools.gzipDecode(this.sourceContent);
                } else if (this.selectedType === 'html2js') {

                    this.resultContent = tools.html2js(this.sourceContent);
                } else if (this.selectedType === 'sha1Encode') {

                    this.resultContent = tools.sha1Encode(this.sourceContent);
                } else if (this.selectedType === 'htmlEntityEncode') {

                    this.resultContent = he.encode(this.sourceContent, {
                        'useNamedReferences': true,
                        'allowUnsafeSymbols': true
                    });
                } else if (this.selectedType === 'htmlEntityFullEncode') {

                    this.resultContent = he.encode(this.sourceContent, {
                        'encodeEverything': true,
                        'useNamedReferences': true,
                        'allowUnsafeSymbols': true
                    });
                } else if (this.selectedType === 'htmlEntityDecode') {

                    this.resultContent = he.decode(this.sourceContent, {
                        'isAttributeValue': false
                    });
                } else if (this.selectedType === 'urlParamsDecode') {
                    let res = tools.urlParamsDecode(this.sourceContent);
                    if (res.error) {
                        this.resultContent = res.error;
                    } else {
                        this.urlResult = res;
                    }
                }
                this.$forceUpdate();
            });
        },

        clear: function () {
            this.sourceContent = '';
            this.resultContent = '';
        },

        getResult: function () {
            this.$refs.rstCode.select();
        }
    }
});