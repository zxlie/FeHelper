// 创建Vue实例并暴露到全局供事件处理使用
window.vueApp = new Vue({
    el: '#pageContainer',
    data: {
        errorMessage: '',
        tipMessage: 'Tips：',
        errorHighlight: false,
        hasErrorClass: false,
        leftSideError: false,
        rightSideError: false,
        differenceCount: 0,
        isDifferent: false,
        jsonExamples: {
            userInfo: {
                left: {
                    "id": 1001,
                    "name": "张三",
                    "age": 28,
                    "email": "zhangsan@example.com",
                    "address": {
                        "city": "北京",
                        "district": "朝阳区",
                        "street": "建国路88号"
                    },
                    "tags": ["前端", "JavaScript", "Vue"],
                    "isActive": true,
                    "lastLogin": "2023-01-15T08:30:00Z"
                },
                right: {
                    "id": 1001,
                    "name": "张三",
                    "age": 30,
                    "email": "zhangsan@example.com",
                    "address": {
                        "city": "上海",
                        "district": "浦东新区",
                        "street": "建国路88号"
                    },
                    "tags": ["前端", "JavaScript", "React"],
                    "isActive": true,
                    "lastLogin": "2023-02-20T10:45:00Z"
                }
            },
            productData: {
                left: {
                    "products": [
                        {
                            "id": "p001",
                            "name": "智能手机",
                            "price": 4999,
                            "inventory": 100,
                            "category": "电子产品",
                            "specs": {
                                "brand": "小米",
                                "model": "Mi 11",
                                "color": "黑色",
                                "storage": "128GB"
                            }
                        },
                        {
                            "id": "p002",
                            "name": "笔记本电脑",
                            "price": 6999,
                            "inventory": 50,
                            "category": "电子产品",
                            "specs": {
                                "brand": "联想",
                                "model": "ThinkPad",
                                "color": "银色",
                                "storage": "512GB"
                            }
                        }
                    ]
                },
                right: {
                    "products": [
                        {
                            "id": "p001",
                            "name": "智能手机",
                            "price": 5299,
                            "inventory": 85,
                            "category": "电子产品",
                            "specs": {
                                "brand": "小米",
                                "model": "Mi 11 Pro",
                                "color": "蓝色",
                                "storage": "256GB"
                            }
                        },
                        {
                            "id": "p002",
                            "name": "笔记本电脑",
                            "price": 6999,
                            "inventory": 50,
                            "category": "电子产品",
                            "specs": {
                                "brand": "联想",
                                "model": "ThinkPad",
                                "color": "银色",
                                "storage": "512GB"
                            }
                        }
                    ]
                }
            },
            configOptions: {
                left: {
                    "appConfig": {
                        "theme": "light",
                        "language": "zh-CN",
                        "notifications": {
                            "email": true,
                            "push": true,
                            "sms": false
                        },
                        "security": {
                            "twoFactorAuth": true,
                            "passwordExpiry": 90,
                            "ipRestriction": false
                        },
                        "performance": {
                            "cacheEnabled": true,
                            "compressionLevel": "high",
                            "preload": ["home", "dashboard"]
                        }
                    }
                },
                right: {
                    "appConfig": {
                        "theme": "dark",
                        "language": "zh-CN",
                        "notifications": {
                            "email": true,
                            "push": false,
                            "sms": true
                        },
                        "security": {
                            "twoFactorAuth": true,
                            "passwordExpiry": 60,
                            "ipRestriction": true
                        },
                        "performance": {
                            "cacheEnabled": true,
                            "compressionLevel": "medium",
                            "preload": ["home", "profile", "dashboard"]
                        }
                    }
                }
            },
            apiResponse: {
                left: {
                    "status": "success",
                    "code": 200,
                    "data": {
                        "users": [
                            {"id": 1, "name": "李明", "role": "admin"},
                            {"id": 2, "name": "王芳", "role": "user"},
                            {"id": 3, "name": "赵强", "role": "editor"}
                        ],
                        "pagination": {
                            "total": 25,
                            "page": 1,
                            "limit": 10
                        },
                        "timestamp": 1642558132,
                        "version": "1.0.0"
                    }
                },
                right: {
                    "status": "success",
                    "code": 200,
                    "data": {
                        "users": [
                            {"id": 1, "name": "李明", "role": "admin"},
                            {"id": 2, "name": "王芳", "role": "user"},
                            {"id": 3, "name": "赵强", "role": "moderator"}
                        ],
                        "pagination": {
                            "total": 28,
                            "page": 1,
                            "limit": 10
                        },
                        "timestamp": 1652558132,
                        "version": "1.2.0"
                    }
                }
            }
        }
    },
    computed: {
        // 显示的消息，计算属性替代v-html
        displayMessage: function() {
            return this.tipMessage + this.errorMessage;
        }
    },
    methods: {
        fillExample: function(exampleType) {
            if (this.jsonExamples[exampleType]) {
                const example = this.jsonExamples[exampleType];
                jsonBox.left.setValue(JSON.stringify(example.left, null, 4));
                jsonBox.right.setValue(JSON.stringify(example.right, null, 4));
                
                // 触发比对
                setTimeout(() => {
                    jsonBox.left.refresh();
                    jsonBox.right.refresh();
                    this.compareJson(); // 使用Vue实例的方法进行比对
                }, 100);
            }
        },
        // 添加比对JSON的方法
        compareJson: function() {
            // 使用全局变量中的实例
            let leftText = jsonBox.left.getValue();
            let rightText = jsonBox.right.getValue();
            let leftJson, rightJson;
            
            try {
                if (leftText) {
                    leftJson = JSON.parse(leftText);
                }
                this.errorHandler('left', true);
            } catch (e) {
                console.log('left ==>', e);
                this.errorHandler('left', false);
                return;
            }
            
            try {
                if (rightText) {
                    rightJson = JSON.parse(rightText);
                }
                this.errorHandler('right', true);
            } catch (e) {
                console.log('right ==>', e);
                this.errorHandler('right', false);
                return;
            }
            
            if (!leftJson || !rightJson) {
                if (!leftJson && !rightJson) {
                    this.errorHandler('left-right', false);
                } else if (!leftJson) {
                    this.errorHandler('left', false);
                } else {
                    this.errorHandler('right', false);
                }
                return;
            }
            
            try {
                // 调用jsonpatch的compare方法进行比对
                let diffs = jsonpatch.compare(leftJson, rightJson);
                this.diffHandler(diffs);
                
                // 清除所有之前的标记
                this.clearMarkers();
                
                // 高亮差异
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
            }
        },
        // 清除所有标记
        clearMarkers: function() {
            jsonBox.left.getAllMarks().forEach(function(marker) {
                marker.clear();
            });
            jsonBox.right.getAllMarks().forEach(function(marker) {
                marker.clear();
            });
        },
        // 高亮差异
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
        // 高亮删除
        highlightRemoval: function(editor, diff) {
            this._highlight(editor, diff, '#DD4444');
        },
        // 高亮添加
        highlightAddition: function(editor, diff) {
            this._highlight(editor, diff, '#4ba2ff');
        },
        // 高亮修改
        highlightChange: function(editor, diff) {
            this._highlight(editor, diff, '#E5E833');
        },
        // 高亮辅助方法
        _highlight: function(editor, diff, color) {
            try {
                let textValue = editor.getValue();
                // 使用全局jsonSourceMap对象
                let result = jsonSourceMap.parse(textValue);
                let pointers = result.pointers;
                let path = diff.path;
                
                if (!pointers[path]) {
                    console.warn('找不到路径的指针:', path);
                    return;
                }
                
                let start = {
                    line: pointers[path].key ? pointers[path].key.line : pointers[path].value.line,
                    ch: pointers[path].key ? pointers[path].key.column : pointers[path].value.column
                };
                let end = {
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
        // 错误处理
        errorHandler: function(which, ok) {
            if (ok) {
                this.errorMessage = '两侧JSON比对完成！';
                this.errorHighlight = false;
                this.leftSideError = false;
                this.rightSideError = false;
            } else {
                let side = {'left': '左', 'right': '右', 'left-right': '两'}[which];
                if(!jsonBox.left.getValue().trim().length) {
                    this.errorMessage = '请在左侧填入待比对的JSON内容！';
                    this.leftSideError = true;
                    this.rightSideError = false;
                }else if(!jsonBox.right.getValue().trim().length) {
                    this.errorMessage = '请在右侧填入待比对的JSON内容！';
                    this.leftSideError = false;
                    this.rightSideError = true;
                }else{
                    this.errorMessage = side + '侧JSON不合法！';
                    if (which === 'left') {
                        this.leftSideError = true;
                        this.rightSideError = false;
                    } else if (which === 'right') {
                        this.leftSideError = false;
                        this.rightSideError = true;
                    } else {
                        this.leftSideError = true;
                        this.rightSideError = true;
                    }
                }
                this.errorHighlight = true;
            }
        },
        // diff处理器
        diffHandler: function(diffs) {
            if (!this.errorHighlight) {
                this.differenceCount = diffs.length;
                this.isDifferent = diffs.length > 0;
                if (diffs.length) {
                    this.errorMessage += '共有 ' + diffs.length + ' 处不一致！';
                } else {
                    this.errorMessage += '且JSON内容一致！';
                }
            }
        },

        // 打开工具市场页面
        openOptionsPage: function(event){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },

        openDonateModal: function(event){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'json-diff' }
            });
        },
    },
    mounted: function () {
        // 初始化JSON编辑器
        let jsonBox = JsonDiff.init(this.$refs.srcLeft, this.$refs.srcRight, 
            this.errorHandler.bind(this), 
            this.diffHandler.bind(this)
        );
        
        // 添加比较方法
        jsonBox.compare = this.compareJson.bind(this);
        
        // 初始化文本变更监听
        jsonBox.left.on('change', () => {
            setTimeout(() => this.compareJson(), 300);
        });
        jsonBox.right.on('change', () => {
            setTimeout(() => this.compareJson(), 300);
        });
        
        // 暴露到全局，供示例数据使用
        window.jsonBox = jsonBox;
    }
});