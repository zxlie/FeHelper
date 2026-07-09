/**
 * FeHelper 密码随机生成工具
 */
const DEFAULT_SPECIAL_CHARS = '~!@#$%^&*()[{]}-_=+\|;:\'\",<.>/?`';
const PASSWORD_SPECIAL_CHARS_KEY = 'password:special-chars';

new Vue({
    el: '#pageContainer',
    data: {
        number: true,
        lowerLetter: true,
        upperLetter: true,
        specialChar: false,
        length: 20,
        count: 1,
        defaultSpecialChar: DEFAULT_SPECIAL_CHARS,
        customSpecialChar: DEFAULT_SPECIAL_CHARS,
        chars: {
            number: '0123456789',
            lowerLetter: 'abcdefghijklmnopqrstuvwxyz',
            upperLetter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            specialChar: DEFAULT_SPECIAL_CHARS
        },
        resultContent: '',
        showToast: false,
        toastMsg: ''
    },

    mounted: function () {
        const savedSpecialChars = this.safeGetLocalStorage(PASSWORD_SPECIAL_CHARS_KEY);
        if (savedSpecialChars) {
            this.customSpecialChar = savedSpecialChars;
            this.chars.specialChar = savedSpecialChars;
        }
        this.loadPatchHotfix();
    },

    methods: {
        safeGetLocalStorage: function(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage不可用，使用默认值:', key);
                return null;
            }
        },

        safeSetLocalStorage: function(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn('localStorage不可用，跳过保存:', key);
            }
        },

        safeRemoveLocalStorage: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('localStorage不可用，跳过删除:', key);
            }
        },

        getSelectedCharPool: function() {
            return ['number', 'lowerLetter', 'upperLetter', 'specialChar']
                .filter(item => this[item])
                .map(item => this.chars[item])
                .join('');
        },

        normalizeInteger: function(value, fallback, minimum) {
            const numberValue = parseInt(value, 10);
            return Number.isFinite(numberValue) && numberValue >= minimum ? numberValue : fallback;
        },

        convert: function () {
            this.$nextTick(() => {
                this.chars.specialChar = this.customSpecialChar;
                let exceptedChars = this.getSelectedCharPool();
                let passwordLength = this.normalizeInteger(this.length, 20, 0);
                let passwordCount = this.normalizeInteger(this.count, 1, 1);
                this.length = passwordLength;
                this.count = passwordCount;

                if (!exceptedChars.length) {
                    this.resultContent = '';
                    this.showToastMsg(this.specialChar ? '请先配置特殊符号集合' : '请至少选择一种字符');
                    return;
                }

                // 生成指定数量的密码
                let passwords = [];
                for (let i = 0; i < passwordCount; i++) {
                    let password = [], rands = [], rand = 0;
                    for (let index = 0; index < passwordLength; index++) {
                        // 尽可能不让字符重复
                        do {
                            rand = Math.floor(Math.random() * exceptedChars.length);
                        } while (rands.includes(rand) && rands.length < exceptedChars.length);

                        rands.push(rand);
                        password.push(exceptedChars[rand]);
                    }
                    passwords.push(password.join(''));
                }
                this.resultContent = passwords.join('\n');
            });
        },

        updateSpecialChars: function() {
            this.chars.specialChar = this.customSpecialChar;
            if (this.customSpecialChar) {
                this.safeSetLocalStorage(PASSWORD_SPECIAL_CHARS_KEY, this.customSpecialChar);
            } else {
                this.safeRemoveLocalStorage(PASSWORD_SPECIAL_CHARS_KEY);
            }
            if (this.specialChar) {
                this.convert();
            }
        },

        resetSpecialChars: function() {
            this.customSpecialChar = this.defaultSpecialChar;
            this.chars.specialChar = this.defaultSpecialChar;
            this.safeRemoveLocalStorage(PASSWORD_SPECIAL_CHARS_KEY);
            if (this.specialChar) {
                this.convert();
            }
        },

        getResult: function () {
            this.$refs.rstCode.select();
        },


        copyResult: async function () {
            // 选中要复制的内容
            this.getResult();

            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(this.resultContent);
                    this.showToastMsg('复制成功！');
                    return;
                } catch (err) {
                    // 权限受限时继续走传统复制兜底。
                }
            }

            try {
                const ok = document.execCommand('copy');
                this.showToastMsg(ok ? '复制成功！' : '复制失败，请手动复制');
            } catch (err) {
                this.showToastMsg('复制失败，请手动复制');
            }
        },
        showToastMsg: function(msg) {
            this.toastMsg = msg;
            this.showToast = true;
            setTimeout(() => {
                this.showToast = false;
            }, 1500);
        },
        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },
        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'password' }
            });
        },
        
        loadPatchHotfix() {
            // 页面加载时自动获取并注入页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'password'
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
                            console.error('password补丁JS执行失败', e);
                        }
                    }
                }
            });
        },
    }
});
