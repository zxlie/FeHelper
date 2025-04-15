/**
 * 网页涂鸦油猴：可以针对任何网页进行任何涂鸦
 * @author zhaoxianlie
 */


Date.prototype.format = function (pattern) {
    let pad = function (source, length) {
        let pre = "",
            negative = (source < 0),
            string = String(Math.abs(source));

        if (string.length < length) {
            pre = (new Array(length - string.length + 1)).join('0');
        }

        return (negative ? "-" : "") + pre + string;
    };

    if ('string' !== typeof pattern) {
        return this.toString();
    }

    let replacer = function (patternPart, result) {
        pattern = pattern.replace(patternPart, result);
    };

    let year = this.getFullYear(),
        month = this.getMonth() + 1,
        date2 = this.getDate(),
        hours = this.getHours(),
        minutes = this.getMinutes(),
        seconds = this.getSeconds(),
        milliSec = this.getMilliseconds();

    replacer(/yyyy/g, pad(year, 4));
    replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
    replacer(/MM/g, pad(month, 2));
    replacer(/M/g, month);
    replacer(/dd/g, pad(date2, 2));
    replacer(/d/g, date2);

    replacer(/HH/g, pad(hours, 2));
    replacer(/H/g, hours);
    replacer(/hh/g, pad(hours % 12, 2));
    replacer(/h/g, hours % 12);
    replacer(/mm/g, pad(minutes, 2));
    replacer(/m/g, minutes);
    replacer(/ss/g, pad(seconds, 2));
    replacer(/s/g, seconds);
    replacer(/SSS/g, pad(milliSec, 3));
    replacer(/S/g, milliSec);

    return pattern;
};

// 本地开发用，简单模拟实现chrome.storage.local
if (new URL(location.href).protocol.startsWith('http')) {
    window.chrome = window.chrome || {};
    window.chrome.storage = {
        local: {
            get(key, callback) {
                let obj = [];
                [].concat(key).forEach(k => {
                    obj[k] = localStorage.getItem(k);
                });
                callback && callback(obj);
            },
            set(obj, callback) {
                Object.keys(obj).forEach(key => localStorage.setItem(key, obj[key]));
                callback && callback();
            }
        }
    };
}

!RegExp.prototype.toJSON && Object.defineProperty(RegExp.prototype, "toJSON", {
    value: RegExp.prototype.toString
});


////////////////////////////////////////////////////////////////////////////////////////////
let editor = null;
const PAGE_MONKEY_LOCAL_STORAGE_KEY = 'PAGE-MODIFIER-LOCAL-STORAGE-KEY';

new Vue({
    el: '#pageContainer',
    data: {
        editing: false,
        editCM: {},
        editWithUI: true,
        cachedMonkeys: []
    },
    mounted: function () {
        this.editCM = this.getANewCM();

        // 退出的时候检测是否有未保存的数据
        window.onbeforeunload = (e) => {
            if (this.editCM.unSaved) {
                (e || window.event).returnValue = '当前还有未保存的数据，确定要离开么？';
            }
        };

        // 初始化获取数据
        this.getPageMonkeyConfigs((cmList) => {
            this.cachedMonkeys = (cmList || []).filter(cm => cm.mName && cm.mPattern);
        });
    },

    methods: {
        getPageMonkeyConfigs: function (callback) {

            chrome.storage.local.get(PAGE_MONKEY_LOCAL_STORAGE_KEY, (resps) => {
                let cacheMonkeys, storageMode = false;
                if (!resps || !resps[PAGE_MONKEY_LOCAL_STORAGE_KEY]) {
                    cacheMonkeys = localStorage.getItem(PAGE_MONKEY_LOCAL_STORAGE_KEY) || '[]';
                    storageMode = true;
                } else {
                    cacheMonkeys = resps[PAGE_MONKEY_LOCAL_STORAGE_KEY] || '[]';
                }

                callback && callback(JSON.parse(cacheMonkeys));

                // 本地存储的内容，需要全部迁移到chrome.storage.local中，以确保unlimitedStorage
                if (storageMode) {
                    let storageData = {};
                    storageData[PAGE_MONKEY_LOCAL_STORAGE_KEY] = cacheMonkeys;
                    chrome.storage.local.set(storageData);
                }
            });
        },
        /**
         * 存储 网页涂鸦油猴 的配置
         * @param monkeys
         * @param callback
         * @private
         */
        savePageMonkeyConfigs: function (monkeys, callback) {
            let storageData = {};
            storageData[PAGE_MONKEY_LOCAL_STORAGE_KEY] = JSON.stringify(monkeys);
            chrome.storage.local.set(storageData);
            callback && callback();
        },

        getANewCM: function () {
            return {
                id: 'mf_' + new Date() * 1,
                mName: '',
                mPattern: '',
                mScript: '',
                mRefresh: 0,
                mDisabled: false,
                mRequireJs: '',
                mUpdatedAt: new Date().format('yyyy-MM-dd HH:mm:ss')
            };
        },

        initEditor() {
            if (!editor) {
                // 编辑器初始化
                editor = CodeMirror.fromTextArea(this.$refs.mScript, {
                    mode: "text/javascript",
                    lineNumbers: true,
                    matchBrackets: true,
                    styleActiveLine: true,
                    lineWrapping: true
                });

                editor.on('keydown', (editor, event) => {
                    if (event.metaKey || event.ctrlKey) {
                        if (event.code === 'KeyS') {
                            this.saveMonkey();
                            event.preventDefault();
                            event.stopPropagation();
                            return false;
                        }
                    }
                });
            }
        },

        toggleEditMode() {
            let unSaved = this.editCM.unSaved;
            if (this.editWithUI) { // UI界面模式
                editor.setValue(this.deflateMonkey(this.getEditMonkey()));
            } else { // 纯代码编辑模式
                let curMonkey = this.inflateMonkey(editor.getValue());
                this.editCM = {...curMonkey};
                this.$nextTick(() => {
                    editor.setValue(this.editCM.mScript);
                })
            }
            this.editCM.unSaved = unSaved;
            this.editWithUI = !this.editWithUI;
        },

        createMonkey: function () {
            this.editing = true;
            this.editCM.unSaved = true;
            this.editCM = this.getANewCM();
            this.initEditor();

            this.$nextTick(() => {
                editor.setValue(window.MonkeyNewGuide);
            });
        },

        selectMonkey: function (cm) {
            this.editing = true;
            // 把数据呈现到编辑面板
            this.editCM = cm;
            this.initEditor();

            this.$nextTick(() => {
                editor.setValue(this.editWithUI ? cm.mScript : this.deflateMonkey(cm));
            });
        },

        getEditMonkey() {
            if (this.editWithUI) {
                this.editCM.mScript = editor && editor.getValue() || this.editCM.mScript;
                this.editCM.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
                this.editCM.mDisabled = !!this.editCM.mDisabled;
                return this.editCM;
            } else {
                return this.inflateMonkey(editor.getValue());
            }
        },

        saveMonkey: function () {
            let curMonkey = this.getEditMonkey();

            let found = this.cachedMonkeys.some((cm, index) => {
                if (cm.id === curMonkey.id) {
                    this.cachedMonkeys[index] = curMonkey;
                    return true;
                }
            });
            if (!found && curMonkey.mName && curMonkey.mPattern) this.cachedMonkeys.push(curMonkey);

            this.savePageMonkeyConfigs(this.cachedMonkeys, () => {
                this.editCM.unSaved = false;
                this.toast('恭喜，您的操作已成功并生效！');
            });
        },

        closeEditor() {
            if (this.editCM.unSaved) {
                if (confirm('检测到当前猴子有修改，是否先保存？')) {
                    this.savePageMonkeyConfigs(this.cachedMonkeys, () => {
                        this.toast('恭喜，您的操作已成功并生效！');
                    });
                }
            }
            this.editing = false;
            this.editCM.unSaved = false;
        },

        loadMonkeys(monkeys) {
            if (monkeys && Array.isArray(monkeys) && monkeys.length) {
                let keys = 'mName,mPattern,mRefresh,mScript,mDisabled,mRequireJs,mUpdatedAt'.split(',');
                let result = monkeys.filter(item => {
                    if (typeof item === 'object') {
                        Object.keys(item).forEach(k => {
                            !keys.includes(k) && k !== 'id' && delete(item[k]);
                        });
                        if (!item.mUpdatedAt) {
                            item.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
                        }
                        if (Object.keys(item).length) {
                            return true;
                        }
                    }
                    return false;
                });
                if (result.length) {
                    let merge = null;
                    // 配置合并，如果有重复的，则弹框确认
                    result.forEach(r => {
                        let found = this.cachedMonkeys.some(cm => {
                            if (r.id === cm.id || r.mName === cm.mName || r.mPattern === cm.mPattern) {
                                if (merge === null) {
                                    merge = confirm('发现有相同名称或规则的油猴，是否选择覆盖？');
                                }
                                if (merge) {
                                    keys.forEach(k => {
                                        cm[k] = r[k];
                                    });
                                    cm.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
                                }
                                return true;
                            }
                        });
                        if (!found || merge === false) {
                            let newCm = {...r};
                            newCm.id = this.getANewCM().id;
                            newCm.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
                            this.cachedMonkeys.push(newCm);
                        }
                    });

                    this.savePageMonkeyConfigs(this.cachedMonkeys, () => {
                        this.toast('恭喜，您的操作已成功并生效！');
                    });
                }
            }
        },

        // 将Monkey内容打平后输出
        deflateMonkey(monkey) {
            let strPad = (str, place) => {
                return String(str).padEnd(20, place || ' ');
            };

            let jsCode = [];

            // 注释头部分
            jsCode.push('// ==FeHelperMonkey==');
            jsCode.push(strPad('// @reminder') + '请不要删除这部分代码注释，这是FeHelper油猴脚本能正常工作的基本条件！当然，你可以按需修改这里的内容！');
            jsCode.push(strPad('// @id') + monkey.id);
            jsCode.push(strPad('// @name') + monkey.mName);
            jsCode.push(strPad('// @url-pattern') + monkey.mPattern);
            jsCode.push(strPad('// @enable') + !monkey.mDisabled);
            let jsFiles = (monkey.mRequireJs || '').split(/[\s,，]+/).filter(js => js.length);
            jsFiles = Array.from(new Set(jsFiles));
            jsFiles.forEach(js => {
                jsCode.push(strPad('// @require-js') + js);
            });
            if (!jsFiles.length) {
                jsCode.push(strPad('// @require-js'));
            }
            jsCode.push(strPad('// @auto-refresh') + monkey.mRefresh);
            jsCode.push(strPad('// @updated') + monkey.mUpdatedAt);
            jsCode.push('// ==/FeHelperMonkey==\n\n');

            // 代码部分
            jsCode.push(monkey.mScript);

            // 输出
            return jsCode.join('\n');
        },

        // 从一个js文件内容中，提取并解析为monkey对象
        inflateMonkey(jsCode) {
            if (jsCode.indexOf('// ==FeHelperMonkey==') !== 0) throw new Error('wrong file header');
            if (jsCode.indexOf('// ==/FeHelperMonkey==') === -1) throw new Error('wrong file header');

            let [comments, scripts] = jsCode.split('// ==/FeHelperMonkey==');
            let monkey = this.getANewCM();
            monkey.mScript = (scripts || '').trim();
            comments.split('\n').forEach(cmt => {
                if (cmt.startsWith('// @id')) {
                    monkey.id = cmt.split('// @id')[1].trim();
                } else if (cmt.startsWith('// @name')) {
                    monkey.mName = cmt.split('// @name')[1].trim();
                } else if (cmt.startsWith('// @url-pattern')) {
                    monkey.mPattern = cmt.split('// @url-pattern')[1].trim();
                } else if (cmt.startsWith('// @enable')) {
                    monkey.mDisabled = cmt.split('// @enable')[1].trim() === 'false';
                } else if (cmt.startsWith('// @auto-refresh')) {
                    monkey.mRefresh = parseInt(cmt.split('// @auto-refresh')[1].trim());
                } else if (cmt.startsWith('// @updated')) {
                    monkey.mUpdatedAt = cmt.split('// @updated')[1].trim();
                } else if (cmt.startsWith('// @require-js')) {
                    let jsFiles = (monkey.mRequireJs || '').split(/[\s,，]+/).filter(js => js.length);
                    jsFiles = Array.from(new Set(jsFiles));
                    jsFiles.push(cmt.split('// @require-js')[1].trim());
                    monkey.mRequireJs = jsFiles.join(',');
                }
            });

            if (!monkey.mName || !monkey.mPattern) {
                throw new Error('wrong file format,no name or url-pattern');
            }

            return monkey;
        },

        // 导入配置
        importMonkey: function () {
            let that = this;
            let fileInput = document.getElementById('fileInput');
            if (!fileInput) {
                fileInput = document.createElement('input');
                fileInput.id = 'fileInput';
                fileInput.type = 'file';
                fileInput.accept = 'application/json,text/javascript';
                fileInput.style.cssText = 'position:relative;top:-1000px;left:-1000px;';
                fileInput.onchange = (event) => {
                    let reader = new FileReader();
                    reader.readAsText(fileInput.files[0], 'utf-8');
                    reader.onload = (evt) => {
                        let content = evt.target.result;
                        if (/\.js$/.test(fileInput.files[0].name)) {
                            // 新版本，导出的是一个js文件，直接读取
                            try {
                                let monkey = this.inflateMonkey(content);
                                this.loadMonkeys([monkey]);
                            } catch (e) {
                                this.toast('当前选择的js文件不符合FeHelper Monkey脚本文件格式！');
                            }
                        } else if (/\.json$/.test(fileInput.files[0].name)) {
                            // 老版本，导出的是json格式，做向下兼容
                            try {
                                // 过滤掉文件头部所有注释，然后转化成json
                                let list = JSON.parse(content.replace(/^\/\*[^\*]*\*\//, ''));
                                this.loadMonkeys(list);
                            } catch (e) {
                                this.toast('当前选择的JSON配置文件格式不正确！');
                            }
                        }
                    };
                };
                document.body.appendChild(fileInput);
            }
            fileInput.click();
        },

        // 导出配置
        exportMonkey: function (theCM) {

            let exportHandler = monkey => {
                let blob = new Blob([this.deflateMonkey(monkey)], {type: 'application/octet-stream'});

                if (typeof chrome === 'undefined' || !chrome.permissions) {
                    let aLink = document.getElementById('btnDownloadMonkey');
                    if (!aLink) {
                        aLink = document.createElement('a');
                        aLink.setAttribute('id', 'btnDownloadMonkey');
                        aLink.style.cssText = 'position:absolute;top:-1000px;left:-1000px';
                        document.body.appendChild(aLink);
                    }
                    aLink.setAttribute('download', `FhMonkey-${monkey.mName}.js`);
                    aLink.setAttribute('href', URL.createObjectURL(blob));
                    aLink.click();
                } else {
                    chrome.permissions.request({
                        permissions: ['downloads']
                    }, (granted) => {
                        if (granted) {
                            chrome.downloads.download({
                                url: URL.createObjectURL(blob),
                                saveAs: true,
                                conflictAction: 'overwrite',
                                filename: `FhMonkey-${monkey.mName}.js`
                            });
                        } else {
                            this.toast('必须接受授权，才能正常导出！');
                        }
                    });
                }
            };

            exportHandler(theCM);
        },

        // 清空油猴
        removeMonkey: function (theCM) {
            if (confirm('你确定要删除所有的油猴吗，此操作不可撤销！')) {
                if (theCM) {
                    this.cachedMonkeys = this.cachedMonkeys.filter(cm => {
                        return cm.id !== theCM.id;
                    });
                } else {
                    this.cachedMonkeys = [];
                }

                this.savePageMonkeyConfigs(this.cachedMonkeys, () => {
                    this.toast('恭喜，您的操作已成功并生效！');
                });
            }
        },

        // 停用油猴
        disableMonkey: function (theCM) {
            if (theCM) {
                this.cachedMonkeys.some(cm => {
                    if (cm.id === theCM.id) {
                        cm.mDisabled = !theCM.mDisabled;
                        cm.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
                        return true;
                    }
                });
                this.savePageMonkeyConfigs(this.cachedMonkeys, () => {
                    this.toast(`猴子「 ${theCM.mName} 」相关配置已修改成功！`);
                });
            } else {
                if (confirm('停用油猴后，可单独编辑启用；是否继续此操作？')) {
                    this.cachedMonkeys.forEach(cm => {
                        cm.mDisabled = true;
                        cm.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
                    });
                    this.savePageMonkeyConfigs(this.cachedMonkeys, () => {
                        this.toast('所有猴子均已停用！');
                    });
                }
            }
        },

        // 引入Demo
        loadDemo() {
            if(confirm('郑重声明：这个Demo是在你打开百度网站时，自动搜索FeHelper，这就是一个用于演示油猴的示例！！！' +
                '所以，请记得体验完以后自行停用这个Demo！！！！！！！要不然，你一定会误会作者耍流氓，那作者就真的心凉了。。。')) {
                this.loadMonkeys(MonkeyTpl);    
            }
        },


        /**
         * 自动消失的Alert弹窗
         * @param content
         */
        toast(content) {
            window.clearTimeout(window.feHelperAlertMsgTid);
            let elAlertMsg = document.querySelector("#fehelper_alertmsg");
            if (!elAlertMsg) {
                let elWrapper = document.createElement('div');
                elWrapper.innerHTML = '<div id="fehelper_alertmsg">' + content + '</div>';
                elAlertMsg = elWrapper.childNodes[0];
                document.body.appendChild(elAlertMsg);
            } else {
                elAlertMsg.innerHTML = content;
                elAlertMsg.style.display = 'block';
            }

            window.feHelperAlertMsgTid = window.setTimeout(function () {
                elAlertMsg.style.display = 'none';
            }, 1000);
        }

    }
});
