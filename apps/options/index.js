/**
 * FeHelper Options Page
 */

let Settings = Tarp.require('./settings');

new Vue({
    el: '#pageContainer',
    data: {
        selectedOpts: [],
        manifest: {}
    },

    created: function () {
        Settings.getOptions((opts) => {
            this.selectedOpts = Object.keys(opts);
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

            Settings.setOptions(this.selectedOpts);

            setTimeout(() => {
                this.close();
            }, 1000);
        }
    }
});