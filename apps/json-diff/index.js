let jsonBox = null;

const JSON_EXAMPLES = {
    userInfo: {
        label: '用户信息',
        left: {
            id: 1001,
            name: '张三',
            age: 28,
            email: 'zhangsan@example.com',
            address: {
                city: '北京',
                district: '朝阳区',
                street: '建国路88号'
            },
            tags: ['前端', 'JavaScript', 'Vue'],
            isActive: true,
            lastLogin: '2023-01-15T08:30:00Z'
        },
        right: {
            id: 1001,
            name: '张三',
            age: 30,
            email: 'zhangsan@example.com',
            address: {
                city: '上海',
                district: '浦东新区',
                street: '建国路88号'
            },
            tags: ['前端', 'JavaScript', 'React'],
            isActive: true,
            lastLogin: '2023-02-20T10:45:00Z'
        }
    },
    productData: {
        label: '商品数据',
        left: {
            products: [
                {
                    id: 'p001',
                    name: '智能手机',
                    price: 4999,
                    inventory: 100,
                    category: '电子产品',
                    specs: {
                        brand: '小米',
                        model: 'Mi 11',
                        color: '黑色',
                        storage: '128GB'
                    }
                },
                {
                    id: 'p002',
                    name: '笔记本电脑',
                    price: 6999,
                    inventory: 50,
                    category: '电子产品',
                    specs: {
                        brand: '联想',
                        model: 'ThinkPad',
                        color: '银色',
                        storage: '512GB'
                    }
                }
            ]
        },
        right: {
            products: [
                {
                    id: 'p001',
                    name: '智能手机',
                    price: 5299,
                    inventory: 85,
                    category: '电子产品',
                    specs: {
                        brand: '小米',
                        model: 'Mi 11 Pro',
                        color: '蓝色',
                        storage: '256GB'
                    }
                },
                {
                    id: 'p002',
                    name: '笔记本电脑',
                    price: 6999,
                    inventory: 50,
                    category: '电子产品',
                    specs: {
                        brand: '联想',
                        model: 'ThinkPad',
                        color: '银色',
                        storage: '512GB'
                    }
                }
            ]
        }
    },
    configOptions: {
        label: '配置选项',
        left: {
            appConfig: {
                theme: 'light',
                language: 'zh-CN',
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                },
                security: {
                    twoFactorAuth: true,
                    passwordExpiry: 90,
                    ipRestriction: false
                },
                performance: {
                    cacheEnabled: true,
                    compressionLevel: 'high',
                    preload: ['home', 'dashboard']
                }
            }
        },
        right: {
            appConfig: {
                theme: 'dark',
                language: 'zh-CN',
                notifications: {
                    email: true,
                    push: false,
                    sms: true
                },
                security: {
                    twoFactorAuth: true,
                    passwordExpiry: 60,
                    ipRestriction: true
                },
                performance: {
                    cacheEnabled: true,
                    compressionLevel: 'medium',
                    preload: ['home', 'profile', 'dashboard']
                }
            }
        }
    },
    apiResponse: {
        label: 'API响应',
        left: {
            status: 'success',
            code: 200,
            data: {
                users: [
                    { id: 1, name: '李明', role: 'admin' },
                    { id: 2, name: '王芳', role: 'user' },
                    { id: 3, name: '赵强', role: 'editor' }
                ],
                pagination: {
                    total: 25,
                    page: 1,
                    limit: 10
                },
                timestamp: 1642558132,
                version: '1.0.0'
            }
        },
        right: {
            status: 'success',
            code: 200,
            data: {
                users: [
                    { id: 1, name: '李明', role: 'admin' },
                    { id: 2, name: '王芳', role: 'user' },
                    { id: 3, name: '赵强', role: 'moderator' }
                ],
                pagination: {
                    total: 28,
                    page: 1,
                    limit: 10
                },
                timestamp: 1652558132,
                version: '1.2.0'
            }
        }
    }
};

const TEXT_EXAMPLES = {
    markdownDoc: {
        label: 'Markdown',
        left: '# 发布说明\n\n- 支持 JSON 自动格式化\n- 支持 URL 解码\n- 支持 BigInt\n\n> 如需升级，请重新打开扩展。',
        right: '# 发布说明\n\n- 支持 JSON 自动格式化\n- 支持 URL / Unicode 解码\n- 支持 BigInt\n- 新增任意文本对比\n\n> 如需升级，请重新打开扩展。'
    },
    nginxConfig: {
        label: '配置文件',
        left: 'server {\n    listen 80;\n    server_name fehelper.local;\n    location /api {\n        proxy_pass http://127.0.0.1:3000;\n    }\n}',
        right: 'server {\n    listen 443 ssl;\n    server_name fehelper.local;\n    location /api {\n        proxy_pass http://127.0.0.1:3100;\n        proxy_set_header X-Env preview;\n    }\n}'
    },
    htmlSnippet: {
        label: 'HTML片段',
        left: '<section class=\"hero\">\n  <h1>FeHelper</h1>\n  <p>JSON 比对工具</p>\n</section>',
        right: '<section class=\"hero hero-compact\">\n  <h1>FeHelper</h1>\n  <p>内容比对工具</p>\n  <button>立即试用</button>\n</section>'
    },
    logOutput: {
        label: '日志输出',
        left: '2026-06-12 10:01:22 INFO boot start\n2026-06-12 10:01:23 INFO cache warmup done\n2026-06-12 10:01:24 WARN fallback to legacy parser',
        right: '2026-06-12 10:01:22 INFO boot start\n2026-06-12 10:01:23 INFO cache warmup done\n2026-06-12 10:01:24 INFO switch to runtime parser\n2026-06-12 10:01:25 INFO boot success'
    }
};

function stringifyExample(value) {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 4);
}

window.vueApp = new Vue({
    el: '#pageContainer',
    data: {
        compareMode: 'json',
        errorMessage: '',
        tipMessage: 'Tips：',
        errorHighlight: false,
        leftSideError: false,
        rightSideError: false,
        differenceCount: 0,
        isDifferent: false,
        lineHighlights: {
            left: [],
            right: []
        },
        jsonExamples: JSON_EXAMPLES,
        textExamples: TEXT_EXAMPLES
    },
    computed: {
        activeExamples: function() {
            const source = this.compareMode === 'json' ? this.jsonExamples : this.textExamples;
            return Object.keys(source).map((key) => ({
                key,
                label: source[key].label
            }));
        }
    },
    methods: {
        fillExample: function(exampleType) {
            const source = this.compareMode === 'json' ? this.jsonExamples : this.textExamples;
            const example = source[exampleType];
            if (!example || !jsonBox) return;

            jsonBox.left.setValue(stringifyExample(example.left));
            jsonBox.right.setValue(stringifyExample(example.right));

            setTimeout(() => {
                jsonBox.left.refresh();
                jsonBox.right.refresh();
                this.compareContent();
            }, 100);
        },

        setCompareMode: function(mode) {
            if (this.compareMode === mode) return;
            this.compareMode = mode;
            this.clearMarkers();
            this.resetFeedback();
            this.applyEditorPlaceholders();
            this.errorMessage = mode === 'json'
                ? '已切换到 JSON 对比，可继续使用结构化高亮。'
                : '已切换到任意文本模式，支持按行比对代码、日志、Markdown 等内容。';
            this.compareContent();
        },

        compareContent: function() {
            if (!jsonBox) return;
            if (this.compareMode === 'json') {
                this.compareJson();
            } else {
                this.compareText();
            }
        },

        compareJson: function() {
            const leftText = jsonBox.left.getValue();
            const rightText = jsonBox.right.getValue();
            let leftJson;
            let rightJson;
            let leftOk = true;
            let rightOk = true;

            this.clearMarkers();

            if (!leftText.trim().length) {
                this.setInputError('left', '请在左侧填入待比对的 JSON 内容！');
                return;
            }
            if (!rightText.trim().length) {
                this.setInputError('right', '请在右侧填入待比对的 JSON 内容！');
                return;
            }

            try {
                leftJson = JSON.parse(leftText);
            } catch (e) {
                leftOk = false;
            }

            try {
                rightJson = JSON.parse(rightText);
            } catch (e) {
                rightOk = false;
            }

            if (!leftOk && !rightOk) {
                this.setInputError('left-right', '两侧 JSON 都不合法，请检查后重试。');
                return;
            }
            if (!leftOk) {
                this.setInputError('left', '左侧 JSON 不合法！');
                return;
            }
            if (!rightOk) {
                this.setInputError('right', '右侧 JSON 不合法！');
                return;
            }

            this.resetFeedback();

            try {
                const diffs = jsonpatch.compare(leftJson, rightJson);
                this.differenceCount = diffs.length;
                this.isDifferent = diffs.length > 0;
                this.errorMessage = diffs.length
                    ? '两侧 JSON 比对完成，共有 ' + diffs.length + ' 处不一致！'
                    : '两侧 JSON 比对完成，内容一致！';

                diffs.forEach((diff) => {
                    try {
                        if (diff.op === 'remove') {
                            this.highlightDiff(diff, 'remove');
                        } else if (diff.op === 'add') {
                            this.highlightDiff(diff, 'add');
                        } else if (diff.op === 'replace') {
                            this.highlightDiff(diff, 'replace');
                        }
                    } catch (e) {
                        console.warn('error while trying to highlight diff', e);
                    }
                });
            } catch (e) {
                console.error('比对过程出错:', e);
                this.setInputError('left-right', 'JSON 比对过程出错，请确认输入内容是否可解析。');
            }
        },

        compareText: function() {
            const leftText = jsonBox.left.getValue();
            const rightText = jsonBox.right.getValue();
            const diffUtils = window.JsonDiffUtils;

            this.clearMarkers();

            if (!leftText.trim().length) {
                this.setInputError('left', '请在左侧填入待比对内容！');
                return;
            }
            if (!rightText.trim().length) {
                this.setInputError('right', '请在右侧填入待比对内容！');
                return;
            }
            if (!diffUtils || typeof diffUtils.compareTextByLine !== 'function') {
                this.setInputError('left-right', '文本比对模块加载失败，请刷新后重试。');
                return;
            }

            this.resetFeedback();

            const result = diffUtils.compareTextByLine(leftText, rightText);
            this.applyLineHighlights('left', result.changedLeftLines, 'fh-diff-line-left');
            this.applyLineHighlights('right', result.changedRightLines, 'fh-diff-line-right');

            this.differenceCount = result.changeCount;
            this.isDifferent = result.isDifferent;
            this.errorMessage = result.isDifferent
                ? '两侧文本比对完成，共有 ' + result.changeCount + ' 行不一致！'
                : '两侧文本比对完成，内容一致！';
        },

        clearMarkers: function() {
            if (!jsonBox) return;
            jsonBox.left.getAllMarks().forEach(function(marker) {
                marker.clear();
            });
            jsonBox.right.getAllMarks().forEach(function(marker) {
                marker.clear();
            });
            this.clearLineHighlights('left');
            this.clearLineHighlights('right');
        },

        clearLineHighlights: function(side) {
            if (!jsonBox || !jsonBox[side]) return;
            this.lineHighlights[side].forEach((item) => {
                jsonBox[side].removeLineClass(item.line, 'background', item.className);
            });
            this.lineHighlights[side] = [];
        },

        applyLineHighlights: function(side, lines, className) {
            if (!jsonBox || !jsonBox[side]) return;
            lines.forEach((line) => {
                jsonBox[side].addLineClass(line, 'background', className);
                this.lineHighlights[side].push({ line, className });
            });
        },

        highlightDiff: function(diff, op) {
            if (op === 'remove') {
                this.highlightRemoval(jsonBox.left, diff);
            } else if (op === 'add') {
                this.highlightAddition(jsonBox.right, diff);
            } else if (op === 'replace') {
                this.highlightChange(jsonBox.left, diff);
                this.highlightChange(jsonBox.right, diff);
            }
        },

        highlightRemoval: function(editor, diff) {
            this._highlight(editor, diff, '#DD4444');
        },

        highlightAddition: function(editor, diff) {
            this._highlight(editor, diff, '#4ba2ff');
        },

        highlightChange: function(editor, diff) {
            this._highlight(editor, diff, '#E5E833');
        },

        _highlight: function(editor, diff, color) {
            try {
                const textValue = editor.getValue();
                const result = jsonSourceMap.parse(textValue);
                const pointers = result.pointers;
                const path = diff.path;

                if (!pointers[path]) {
                    console.warn('找不到路径的指针:', path);
                    return;
                }

                const start = {
                    line: pointers[path].key ? pointers[path].key.line : pointers[path].value.line,
                    ch: pointers[path].key ? pointers[path].key.column : pointers[path].value.column
                };
                const end = {
                    line: pointers[path].valueEnd.line,
                    ch: pointers[path].valueEnd.column
                };

                editor.markText(start, end, {
                    css: 'background-color: ' + color
                });
            } catch (e) {
                console.error('高亮过程出错:', e);
            }
        },

        resetFeedback: function() {
            this.errorHighlight = false;
            this.leftSideError = false;
            this.rightSideError = false;
            this.differenceCount = 0;
            this.isDifferent = false;
            this.errorMessage = '';
        },

        setInputError: function(which, message) {
            this.errorMessage = message;
            this.errorHighlight = true;
            this.leftSideError = which === 'left' || which === 'left-right';
            this.rightSideError = which === 'right' || which === 'left-right';
            this.differenceCount = 0;
            this.isDifferent = false;
        },

        applyEditorPlaceholders: function() {
            if (!jsonBox) return;
            const placeholders = this.compareMode === 'json'
                ? {
                    left: '在这里粘贴 JSON 代码',
                    right: '在这里粘贴 JSON 代码'
                }
                : {
                    left: '在这里粘贴任意文本、代码、日志、Markdown…',
                    right: '在这里粘贴任意文本、代码、日志、Markdown…'
                };
            jsonBox.left.setOption('placeholder', placeholders.left);
            jsonBox.right.setOption('placeholder', placeholders.right);
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
                params: { toolName: 'json-diff' }
            });
        },

        loadPatchHotfix: function() {
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'json-diff'
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
                            console.error('json-diff补丁JS执行失败', e);
                        }
                    }
                }
            });
        }
    },
    mounted: function () {
        jsonBox = JsonDiff.init(this.$refs.srcLeft, this.$refs.srcRight);

        jsonBox.left.on('change', () => {
            setTimeout(() => this.compareContent(), 300);
        });
        jsonBox.right.on('change', () => {
            setTimeout(() => this.compareContent(), 300);
        });

        this.applyEditorPlaceholders();
        window.jsonBox = jsonBox;
        this.loadPatchHotfix();
    }
});
