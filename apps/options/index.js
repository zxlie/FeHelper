/**
 * FeHelper Options Page
 */

let Settings = Tarp.require('./settings');

new Vue({
    el: '#pageContainer',
    data: {
        selectedOpts: [],
        maxJsonKeysNumber: 0,
        auto_text_decode:false,
        manifest: {}
    },

    created: function () {

        Settings.getOptions((opts) => {
            this.selectedOpts = Object.keys(opts).filter(k => {
                return typeof(opts[k]) === 'string' && !['MAX_JSON_KEYS_NUMBER','AUTO_TEXT_DECODE'].includes(k)
            });
            this.maxJsonKeysNumber = opts['MAX_JSON_KEYS_NUMBER'];
            this.auto_text_decode = opts['AUTO_TEXT_DECODE'] === 'true';
        });
        this.manifest = chrome.runtime.getManifest();
    },

    methods: {

        close: () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.remove(tabs[0].id);
            });
        },

        cancel: function () {
            this.close();
        },

        save: function () {

            Settings.setOptions(this.selectedOpts.concat([
                {MAX_JSON_KEYS_NUMBER: parseInt(this.maxJsonKeysNumber, 10)},
                {AUTO_TEXT_DECODE: String(this.auto_text_decode)},
            ]));

            setTimeout(() => {
                this.close();
            }, 1000);
        }
    }
});