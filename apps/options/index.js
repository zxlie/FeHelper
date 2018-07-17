/**
 * FeHelper Options Page
 */

let Settings = Tarp.require('./settings');

new Vue({
    el: '#pageContainer',
    data: {
        selectedOpts: [],
        maxJsonKeysNumber: 0,
        manifest: {}
    },

    created: function () {

        Settings.getOptions((opts) => {
            this.selectedOpts = Object.keys(opts).filter(k => {
                return typeof(opts[k]) === 'string' && k !== 'MAX_JSON_KEYS_NUMBER'
            });
            this.maxJsonKeysNumber = opts['MAX_JSON_KEYS_NUMBER'];
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

            Settings.setOptions(this.selectedOpts.concat({MAX_JSON_KEYS_NUMBER: parseInt(this.maxJsonKeysNumber, 10)}));

            setTimeout(() => {
                this.close();
            }, 1000);
        }
    }
});