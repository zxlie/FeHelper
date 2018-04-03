/**
 * FeHelper Options Page
 */

let Settings = Tarp.require('./settings');

new Vue({
    el: '#pageContainer',
    data: {
        selectedOpts: []
    },

    created: function () {
        Settings.getOptions((opts) => {
            this.selectedOpts = Object.keys(opts);
        })
    },

    methods: {

        close: () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.remove(tabs[0].id);
            });
        },

        cancel: () => {
            this.close();
        },

        save: function () {

            Settings.setOptions(this.selectedOpts);

            alert('恭喜，FeHelper配置修改成功!');
            this.close();
        }
    }
});