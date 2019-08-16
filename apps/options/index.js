/**
 * FeHelper Options Page
 */

let Settings = Tarp.require('./settings');

new Vue({
    el: '#pageContainer',
    data: {
        defaultKey: 'Alt+Shift+F',
        selectedOpts: [],
        maxJsonKeysNumber: 0,
        auto_text_decode: false,
        manifest: {},
        menuOpts: {},
        selectedMenu: [],
        defaultMenu: Settings.getDefaultContextMenus(),
        isFireFox: window.navigator && /firefox/i.test(navigator.userAgent)
    },

    created: function () {

        // 获取当前热键
        chrome.commands && chrome.commands.getAll && chrome.commands.getAll(keys => {
            keys.some(key => {
                if (key.name === '_execute_browser_action' && key.shortcut) {
                    this.defaultKey = key.shortcut;
                    return true;
                }
            });
        });

        Settings.getOptions((opts) => {
            this.selectedOpts = Object.keys(opts).filter(k => {
                if (this.isFireFox) {
                    if (this.disabledItem(k) || this.disabledItem(k, 'menu')) {
                        return false;
                    }
                }
                if (typeof(opts[k]) === 'string' && /^MENU_/.test(k)) {
                    this.selectedMenu.push(k);
                    return false;
                }
                return typeof(opts[k]) === 'string'
                    && !['MAX_JSON_KEYS_NUMBER', 'AUTO_TEXT_DECODE'].includes(k);
            });

            this.maxJsonKeysNumber = opts['MAX_JSON_KEYS_NUMBER'];
            this.auto_text_decode = opts['AUTO_TEXT_DECODE'] === 'true';

            // 如果还没设置过menu，就用默认的了
            Settings.askMenuSavedOrNot(saved => {
                if (!saved) {
                    this.selectedMenu = this.defaultMenu.filter(m => {
                        return !(this.isFireFox && this.disabledItem(m, 'menu'));
                    });
                }
            });
        });
        this.manifest = chrome.runtime.getManifest();
        this.menuOpts = Settings.getMenuOpts();

    },

    methods: {

        disabledItem: (key, type) => {
            if (!type || type !== 'menu') {
                return ['PAGE_CAPTURE', 'COLOR_PICKER', 'FCP_HELPER_DETECT', 'REMOVE_BG',
                    'SHOW_PAGE_LOAD_TIME', 'GRID_RULER', 'AJAX_DEBUGGER'].includes(key);
            } else {
                return ['MENU_PAGE_CAPTURE', 'MENU_COLOR_PICKER',
                    'MENU_AJAX_DEBUGGER', 'MENU_PAGE_OPTIMI', 'MENU_DOWNLOAD_CRX',
                    'MENU_CODE_STANDARD', 'MENU_GRID_RULER', 'MENU_REMOVE_BG'].includes(key);
            }
        },


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
        },

        setShortcuts: function () {
            if (this.isFireFox) {
                return alert('此功能仅针对Google Chrome浏览器！')
            }
            chrome.tabs.create({
                url: 'chrome://extensions/shortcuts'
            });
            return false;
        },

        donateToggle: function (event) {
            let box = this.$refs.boxDonate;
            if (box.classList.contains('hide')) {
                box.classList.remove('hide');
                box.style.top = (event.target.offsetTop + 30) + 'px';
                box.style.left = event.target.offsetLeft + 'px';
            } else {
                box.classList.add('hide');
            }

        }
    }
});