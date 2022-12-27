/**
 * FeHelper 信息编解码
 */
import EncodeUtils from './endecode-lib.js';

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
            chrome.tabs.query({currentWindow: true,active: true, }, (tabs) => {
                let activeTab = tabs.filter(tab => tab.active)[0];
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'request-page-content',
                    tabId: activeTab.id
                }).then(resp => {
                    if(!resp || !resp.content) return ;
                    this.sourceContent = resp.content;
                    this.convert();
                });
            });
        }

        this.$refs.srcText.focus();
    },
    methods: {
        convert: function () {
            this.$nextTick(() => {
                this.urlResult = null;

                if (this.selectedType === 'uniEncode') {

                    this.resultContent = EncodeUtils.uniEncode(this.sourceContent);
                } else if (this.selectedType === 'uniDecode') {

                    this.resultContent = EncodeUtils.uniDecode(this.sourceContent.replace(/\\U/g, '\\u'));
                } else if (this.selectedType === 'utf8Encode') {

                    this.resultContent = encodeURIComponent(this.sourceContent);
                } else if (this.selectedType === 'utf8Decode') {

                    this.resultContent = decodeURIComponent(this.sourceContent);
                } else if (this.selectedType === 'utf16Encode') {

                    this.resultContent = EncodeUtils.utf8to16(encodeURIComponent(this.sourceContent));
                } else if (this.selectedType === 'utf16Decode') {

                    this.resultContent = decodeURIComponent(EncodeUtils.utf16to8(this.sourceContent));
                } else if (this.selectedType === 'base64Encode') {

                    this.resultContent = EncodeUtils.base64Encode(EncodeUtils.utf8Encode(this.sourceContent));
                } else if (this.selectedType === 'base64Decode') {

                    this.resultContent = EncodeUtils.utf8Decode(EncodeUtils.base64Decode(this.sourceContent));
                } else if (this.selectedType === 'md5Encode') {

                    this.resultContent = EncodeUtils.md5(this.sourceContent);
                } else if (this.selectedType === 'hexEncode') {

                    this.resultContent = EncodeUtils.hexEncode(this.sourceContent);
                } else if (this.selectedType === 'hexDecode') {

                    this.resultContent = EncodeUtils.hexDecode(this.sourceContent);
                } else if (this.selectedType === 'html2js') {

                    this.resultContent = EncodeUtils.html2js(this.sourceContent);
                } else if (this.selectedType === 'sha1Encode') {

                    this.resultContent = EncodeUtils.sha1Encode(this.sourceContent);
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
                    let res = EncodeUtils.urlParamsDecode(this.sourceContent);
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
