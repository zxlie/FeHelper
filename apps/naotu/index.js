new Vue({
    el: '#mainContainer',
    data: {
        unSavedNaotuKey: 'NAOTU-UN-SAVED-KEY',
        mySavedNaotuListKey: 'NAOTU-MY-SAVED-KEY',
        mySavedNaotuList: [],
        curNaotu: {},
        oldMinderData: null,
        showSavedNaotuList: false,
        naotuTips: ''
    },
    mounted: function () {
        let that = this;
        angular.module('kityminderContainer', ['kityminderEditor'])
            .controller("MainController", ['$scope', function ($scope) {
                $scope.initEditor = function (editor, minder) {
                    window.editor = editor;
                    window.minder = minder;
                    that.listenChange();
                };
            }]);
        angular.bootstrap(document.body,['kityminderContainer']);

        this.mySavedNaotuList = JSON.parse(localStorage.getItem(this.mySavedNaotuListKey) || '[]');
        let unSaved = localStorage.getItem(this.unSavedNaotuKey) || '';
        if (unSaved) {
            unSaved = JSON.parse(unSaved);
            if (unSaved.data.root.children.length) {
                this.naotuTips = `上次有一个编辑未保存的脑图【${unSaved.title}】，可以<span class="x-load">继续编辑</span>`;
            }
        }

        // 监听保存快捷键
        window.addEventListener('keydown', e => {
            if ((e.metaKey || e.ctrlKey) && e.keyCode === 83) {
                this.saveNaotu();
                e.preventDefault();
                e.stopPropagation();
            }
        }, false);
    },
    methods: {

        listenChange: function () {
            window.editor.minder.on("contentchange", () => {
                const newMinderData = editor.minder.exportJson();
                const diffPatches = json_diff(this.oldMinderData, newMinderData);
                if (diffPatches.length > 0 && newMinderData.root.children.length) {
                    this.oldMinderData = newMinderData;
                    localStorage.setItem(this.unSavedNaotuKey, JSON.stringify(this.getCurrentNaotu()));
                    this.naotuTips = `自动保存于 ${this.dateFormat(new Date * 1)}`;
                }
            });
        },

        loadUnSaved: function () {
            let elmLoad = this.$refs.tipsBar.querySelector('span.x-load');
            if (elmLoad) {
                this.curNaotu = JSON.parse(localStorage.getItem(this.unSavedNaotuKey) || '{}');
                editor.minder.importJson(this.curNaotu.data);
                this.naotuTips = '';
            }
        },

        getCurrentNaotu: function () {
            return {
                id: this.curNaotu.id || `fh_${new Date * 1}`,
                created_at: this.curNaotu.created_at || new Date * 1,
                updated_at: new Date * 1,
                title: editor.minder.getMinderTitle(),
                data: editor.minder.exportJson()
            };
        },

        newNaotu: function () {
            let title = editor.minder.getMinderTitle();
            editor.minder.importData('text', '中心主题');
        },
        saveNaotu: function () {
            this.curNaotu = this.getCurrentNaotu();
            let found = this.mySavedNaotuList.some(naotu => {
                if (naotu.id === this.curNaotu.id) {
                    naotu.title = this.curNaotu.title;
                    naotu.data = this.curNaotu.data;
                    naotu.updated_at = this.curNaotu.updated_at;
                    return true;
                }
                return false;
            });
            if (!found) {
                this.mySavedNaotuList.unshift(this.curNaotu);
            }
            localStorage.setItem(this.mySavedNaotuListKey, JSON.stringify(this.mySavedNaotuList));
            localStorage.removeItem(this.unSavedNaotuKey);
            this.naotuTips = `脑图【${this.curNaotu.title}】已保存成功！`;
        },
        importNaotu: function () {
            let fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'application/json';
            fileInput.style.cssText = 'position:absolute;top:-100px;left:-100px';
            fileInput.addEventListener('change', (evt) => {
                let reader = new FileReader();
                reader.onload = (evt) => {
                    let content = evt.target.result;
                    try {
                        let list = JSON.parse(content);
                        if (!(list instanceof Array)) {
                            list = [list];
                        }
                        let replaceNum = 0;
                        let newNum = 0;
                        list.map(naotu => {
                            this.mySavedNaotuList.some(sn => {
                                if (sn.id === naotu.id) {
                                    if (sn.updated_at < naotu.updated_at) {
                                        sn = naotu;
                                        replaceNum++;
                                    }
                                    naotu._replaced = true;
                                    return true;
                                }
                                return false;
                            });
                            return naotu;
                        }).filter(naotu => !naotu._replaced).map(naotu => {
                            this.mySavedNaotuList.unshift(naotu);
                            newNum++;
                        });
                        this.naotuTips = `文件累计${list.length}条，共导入${replaceNum + newNum}条，其中替换${replaceNum}条，新增${newNum}条`;

                        this.curNaotu = list[0];
                        editor.minder.importJson(this.curNaotu.data);
                    } catch (e) {
                    }
                };
                reader.readAsText(evt.target.files[0]);
            }, false);

            document.body.appendChild(fileInput);
            fileInput.click();
        },
        exportNaotu: function (protocal, which) {
            if (protocal === 'png') {
                // 导出图片
                editor.minder.exportData('png').then(uri => {
                    let elm = document.createElement('a');
                    elm.setAttribute('download', `FH-${editor.minder.getMinderTitle()}.png`);
                    elm.setAttribute('href', uri);
                    elm.style.cssText = 'position:absolute;top:-1000px;left:-1000px;';
                    document.body.appendChild(elm);
                    elm.click();
                    elm.remove();
                });
            } else if (protocal === 'json') {
                // 导出JSON
                let blob = null;
                let fileName = `FeHelper-Naotu-${new Date * 1}.json`;
                if (which === 'all') {
                    blob = new Blob([JSON.stringify(this.mySavedNaotuList)], {type: 'application/octet-stream'});
                } else {
                    let naotu = this.getCurrentNaotu();
                    blob = new Blob([JSON.stringify(naotu)], {type: 'application/octet-stream'});
                    fileName = `FeHelper-Naotu-${naotu.title}.json`;
                }
                let elm = document.createElement('a');
                elm.setAttribute('download', fileName);
                elm.setAttribute('href', URL.createObjectURL(blob));
                elm.style.cssText = 'position:absolute;top:-1000px;left:-1000px;';
                document.body.appendChild(elm);
                elm.click();
                elm.remove()
            }
        },
        myNaotu: function () {
            this.showSavedNaotuList = !this.showSavedNaotuList;
        },

        editNaotu: function (id) {
            this.mySavedNaotuList.some(naotu => {
                if (naotu.id === id) {
                    this.curNaotu = naotu;
                    editor.minder.importJson(naotu.data);
                    this.showSavedNaotuList = false;
                    return true;
                }
                return false;
            });
        },
        deleteNaotu: function (id) {
            this.mySavedNaotuList.some((naotu, index) => {
                if (naotu.id === id) {
                    this.mySavedNaotuList.splice(index, 1);
                    return true;
                }
                return false;
            });
            localStorage.setItem(this.mySavedNaotuListKey, JSON.stringify(this.mySavedNaotuList));
        },

        dateFormat: function (date) {
            let pattern = 'yyyy-MM-dd HH:mm:ss';
            date = new Date(date);

            let pad = function (source, length) {
                let pre = "",
                    negative = (source < 0),
                    string = String(Math.abs(source));

                if (string.length < length) {
                    pre = (new Array(length - string.length + 1)).join('0');
                }

                return (negative ? "-" : "") + pre + string;
            };

            let replacer = function (patternPart, result) {
                pattern = pattern.replace(patternPart, result);
            };

            let year = date.getFullYear(),
                month = date.getMonth() + 1,
                date2 = date.getDate(),
                hours = date.getHours(),
                minutes = date.getMinutes(),
                seconds = date.getSeconds(),
                milliSec = date.getMilliseconds();

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
        },
    }
});