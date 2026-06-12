import { BYTE_UNITS, formatConvertedValue, getAllConversions, convertBytes } from './byte-utils.js';

new Vue({
    el: '#pageContainer',
    data: {
        units: BYTE_UNITS,
        inputValue: '',
        fromUnit: 'MB',
        toUnit: 'KB',
        resultText: '',
        errorMsg: '',
        conversionRows: []
    },
    watch: {
        inputValue: function (value) {
            if (!String(value || '').trim()) {
                this.resetResult();
                return;
            }
            this.convert();
        },
        fromUnit: function () {
            if (!String(this.inputValue || '').trim()) {
                return;
            }
            this.convert();
        },
        toUnit: function () {
            if (!String(this.inputValue || '').trim()) {
                return;
            }
            this.convert();
        }
    },
    mounted: function () {
        this.loadPatchHotfix();
    },
    methods: {
        resetResult: function () {
            this.errorMsg = '';
            this.resultText = '';
            this.conversionRows = [];
        },
        convert: function () {
            this.resetResult();

            try {
                const converted = convertBytes(this.inputValue, this.fromUnit, this.toUnit);
                const formatted = formatConvertedValue(converted);
                this.resultText = `${this.inputValue} ${this.fromUnit} = ${formatted} ${this.toUnit}`;
                this.conversionRows = getAllConversions(this.inputValue, this.fromUnit);
            } catch (error) {
                this.errorMsg = error.message || '换算失败，请检查输入内容';
            }
        },
        fillExample: function () {
            this.inputValue = '2048';
            this.fromUnit = 'MB';
            this.toUnit = 'GB';
            this.convert();
        },
        clearAll: function () {
            this.inputValue = '';
            this.fromUnit = 'MB';
            this.toUnit = 'KB';
            this.resetResult();
        },
        applyPreset: function (value, fromUnit, toUnit) {
            this.inputValue = String(value);
            this.fromUnit = fromUnit;
            this.toUnit = toUnit;
            this.convert();
        },
        swapUnits: function () {
            const nextUnit = this.fromUnit;
            this.fromUnit = this.toUnit;
            this.toUnit = nextUnit;
            if (this.inputValue) {
                this.convert();
            }
        },
        copyResult: function () {
            this.copyToClipboard(this.resultText);
        },
        openOptionsPage: function (event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            chrome.runtime.openOptionsPage();
        },
        openDonateModal: function (event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'byte-unit' }
            });
        },
        copyToClipboard(text) {
            if (!text || !String(text).trim()) return;
            const input = document.createElement('textarea');
            input.style.position = 'fixed';
            input.style.opacity = 0;
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);
            this.toast('已复制到剪贴板：' + text);
        },
        toast(content) {
            window.clearTimeout(window.feHelperAlertMsgTid);
            const safe = String(content).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            let elAlertMsg = document.querySelector('#fehelper_alertmsg');
            if (!elAlertMsg) {
                const elWrapper = document.createElement('div');
                elWrapper.innerHTML = '<div id="fehelper_alertmsg">' + safe + '</div>';
                elAlertMsg = elWrapper.childNodes[0];
                document.body.appendChild(elAlertMsg);
            } else {
                elAlertMsg.innerHTML = safe;
                elAlertMsg.style.display = 'block';
            }

            window.feHelperAlertMsgTid = window.setTimeout(function () {
                elAlertMsg.style.display = 'none';
            }, 2500);
        },
        loadPatchHotfix() {
            if (!window.chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
                return;
            }
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'byte-unit'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js && typeof patch.js === 'string' && patch.js.length < 50000) {
                        try {
                            new Function(patch.js)();
                        } catch (e) {
                            console.error('byte-unit补丁JS执行失败', e);
                        }
                    }
                }
            });
        }
    }
});
