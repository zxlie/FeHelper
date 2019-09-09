/**
 * 网页涂鸦精灵：可以针对任何网页进行任何涂鸦
 * @author zhaoxianlie
 */

let editor = null;

new Vue({
    el: '#pageContainer',
    data: {
        editing: false,
        editCM: {},

        unSavedCMID: 0,

        cachedModifiers: []
    },
    mounted: function () {
        this.editCM = this.getANewCM();

        // 编辑器初始化
        editor = CodeMirror.fromTextArea(this.$refs.mScript, {
            mode: "text/javascript",
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            lineWrapping: true
        });

        // 退出的时候检测是否有未保存的数据
        window.onbeforeunload = function (e) {
            if (this.editing) {
                (e || window.event).returnValue = '当前还有未保存的数据，确定要离开么？';
            }
        };

        // 初始化获取数据
        chrome.runtime.sendMessage({
            type: MSG_TYPE.GET_PAGE_MODIFIER_CONFIG
        }, (cmList) => {
            this.cachedModifiers = cmList || [];
        });
    },

    methods: {
        getANewCM: function () {
            return {
                mName: '',
                mPattern: '',
                mFilter: '0',
                mScript: '',
                mRefresh: 0,
                mDisabled: null
            };
        },

        createModifier: function () {
            if (this.editing) {
                return alert('当前还有未保存的数据，无法继续创建！');
            }
            this.editing = true;

            this.editCM = this.getANewCM();
            this.editCM.id = 'mf_' + new Date() * 1;
            this.cachedModifiers.push(this.editCM);

            // 右侧面板，进行表单项编辑
            this.$refs.mForm.reset();
            $('.m-mask').slideUp();
            $('.m-form').removeClass('x-masked');
        },

        selectModifier: function (cm) {
            // 在编辑中，并且确定还要当前这个数据，就设定为选择无效
            if (this.editing) {
                if (confirm('当前还有未保存的数据，确定不要这个数据了吗？')) {
                    this.editing = false;
                    this.cachedModifiers.pop();
                } else {
                    return false;
                }
            }

            // 如果当前数据还没保存，也点击无效
            if (this.editCM.id === cm.id) {
                return false;
            }

            // 把数据呈现到编辑面板
            this.editCM = cm;
            editor.setValue(cm.mScript);
            $('.m-mask').slideUp();
            $('.m-form').removeClass('x-masked');
        },

        saveModifier: function (isEditMode) {
            if (isEditMode) {
                // 必须填写一个名称
                if (!this.editCM.mName || !this.editCM.mName.trim()) {
                    alert('网页精灵名称 不能为空，起一个自己看得懂的名字吧！');
                    return false;
                }

                // 首先校验规则是否是一个合法正则表达式
                let matchs = this.editCM.mPattern.trim().match(/\/(.*)\/([igm]*)?$/);
                if (!matchs || !matchs.length) {
                    alert('网页匹配规则 必须是一个正确的Javascript正则表达式！');
                    return false;
                }

                this.editCM.mScript = editor.getValue();
                this.cachedModifiers.some(cm => {
                    if (cm.id === this.editCM.id) {
                        cm.mName = this.editCM.mName.trim();
                        cm.mPattern = this.editCM.mPattern.trim();
                        cm.mFilter = this.editCM.mFilter;
                        cm.mRefresh = this.editCM.mRefresh;
                        cm.mScript = editor.getValue();
                        cm.mDisabled = !!cm.mDisabled;
                        return true;
                    }
                });
            }

            chrome.runtime.sendMessage({
                type: MSG_TYPE.SAVE_PAGE_MODIFIER_CONFIG,
                params: this.cachedModifiers
            }, () => {
                alert('数据操作成功！');
                this.editCM = this.getANewCM();
                editor.setValue('');
                this.editing = false;

                this.$refs.mForm.reset();
                $('.m-mask').slideDown();
                $('.m-form').addClass('x-masked');
            });
        },

        // 导入配置
        importModifier: function () {
            let that = this;
            let fileInput = document.getElementById('fileInput');
            if (!fileInput) {
                fileInput = document.createElement('input');
                fileInput.id = 'fileInput';
                fileInput.type = 'file';
                fileInput.accept = 'application/json';
                fileInput.style.cssText = 'position:relative;top:-1000px;left:-1000px;';
                fileInput.onchange = function (event) {
                    let reader = new FileReader();
                    reader.readAsText(fileInput.files[0], 'utf-8');
                    reader.onload = (evt) => {
                        let content = evt.target.result;
                        try {
                            // 过滤掉文件头部所有注释，然后转化成json
                            let list = JSON.parse(content.replace(/^\/\*[^\*]*\*\//, ''));
                            if (list && Array.isArray(list) && list.length) {
                                let keys = 'id,mName,mPattern,mFilter,mRefresh,mScript,mDisabled'.split(',');
                                let result = list.filter(item => {
                                    if (typeof item === 'object') {
                                        Object.keys(item).forEach(k => {
                                            !keys.includes(k) && delete(item[k]);
                                        });
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
                                        let found = that.cachedModifiers.some(cm => {
                                            if (r.id === cm.id || r.mName === cm.mName || r.mPattern === cm.mPattern) {
                                                if (merge === null) {
                                                    merge = confirm('发现有相同名称或规则的精灵，是否选择覆盖？');
                                                }
                                                if (merge) {
                                                    keys.forEach(k => {
                                                        cm[k] = r[k];
                                                    });
                                                } else {
                                                    r.id += '_';
                                                }
                                                return merge;
                                            }
                                        });
                                        if (!found) {
                                            that.cachedModifiers.push(r);
                                        }
                                    });
                                    return that.saveModifier();
                                }
                            }
                            throw new Error();
                        } catch (e) {
                            alert('当前选择的JSON配置文件格式不正确！');
                        }
                    };
                };
                document.body.appendChild(fileInput);
            }
            fileInput.click();
        },

        // 导出配置
        exportModifier: function () {
            chrome.runtime.sendMessage({
                type: MSG_TYPE.GET_PAGE_MODIFIER_CONFIG
            }, (cmList) => {
                if (cmList && cmList.length) {
                    let timestamp = new Date() * 1;
                    let exportPrefix = '/* Page modifier config, exported from FeHelper, timestamp:' + timestamp + ' */\n\n';
                    let exportContent = JSON.stringify(cmList, null, 4);

                    let blob = new Blob([exportPrefix + exportContent], {type: 'application/octet-stream'});

                    // 请求权限
                    chrome.permissions.request({
                        permissions: ['downloads']
                    }, (granted) => {
                        if (granted) {
                            chrome.downloads.download({
                                url: URL.createObjectURL(blob),
                                saveAs: true,
                                conflictAction: 'overwrite',
                                filename: 'FeHelper-PM-' + timestamp + '.json'
                            }, () => {
                                alert('数据导出成功！');
                            });
                        } else {
                            alert('必须接受授权，才能正常导出！');
                        }
                    });
                } else {
                    alert('没有已保存/可使用的精灵，不可导出！');
                }
            });
        },

        // 清空精灵
        removeModifier: function (theCM) {
            if (confirm('你确定要删除所有的精灵吗，此操作不可撤销！')) {
                if (theCM) {
                    this.cachedModifiers = this.cachedModifiers.filter(cm => {
                        return cm.id !== theCM.id;
                    });
                } else {
                    this.cachedModifiers = [];
                }
                this.saveModifier();
            }
        },

        // 停用精灵
        disableModifier: function (theCM) {
            if (theCM) {
                if (confirm('请再次确认是否需要' + (theCM.mDisabled ? '启用' : '停用') + '此精灵？')) {
                    this.editCM.mDisabled = !theCM.mDisabled;
                    this.saveModifier(true);
                }
            } else {
                if (confirm('停用精灵后，可单独编辑启用；是否继续此操作？')) {
                    this.cachedModifiers.forEach(cm => {
                        cm.mDisabled = true;
                    });
                    this.saveModifier();
                }
            }
        }
    }
});
