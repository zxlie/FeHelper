/**
 * FeHelper Options Page
 */

let Settings = Tarp.require('./settings');

new Vue({
    el: '#pageContainer',
    data: {
        selectedOpts: [],
        maxJsonKeysNumber: 0,
        auto_text_decode: false,
        manifest: {},
        menuOpts: {},
        selectedMenu: [],
        defaultMenu: Settings.getDefaultContextMenus()
    },

    created: function () {

        Settings.getOptions((opts) => {
            this.selectedOpts = Object.keys(opts).filter(k => {
                if (typeof(opts[k]) === 'string' && /^MENU_/.test(k)) {
                    this.selectedMenu.push(k);
                    return false;
                }
                return typeof(opts[k]) === 'string' && !['MAX_JSON_KEYS_NUMBER', 'AUTO_TEXT_DECODE'].includes(k)
            });

            this.maxJsonKeysNumber = opts['MAX_JSON_KEYS_NUMBER'];
            this.auto_text_decode = opts['AUTO_TEXT_DECODE'] === 'true';

            // 如果还没设置过menu，就用默认的了
            Settings.askMenuSavedOrNot(saved => {
                if (!saved) {
                    this.selectedMenu = this.defaultMenu;
                }
            });
        });
        this.manifest = chrome.runtime.getManifest();
        this.menuOpts = Settings.getMenuOpts();
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
            ]).concat(this.selectedMenu));

            setTimeout(() => {
                this.close();
            }, 1000);
        }
    }
});