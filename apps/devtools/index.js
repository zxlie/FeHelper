import Awesome from '../background/awesome.js';

const DEV_TOOLS_MY_TOOLS = 'DEV-TOOLS:MY-TOOLS';
const TOOL_NAME_TPL = 'DYNAMIC_TOOL:#TOOL-NAME#';
const TOOL_CONTENT_SCRIPT_TPL = 'DYNAMIC_TOOL:CS:#TOOL-NAME#';
const TOOL_CONTENT_SCRIPT_CSS_TPL = 'DYNAMIC_TOOL:CS:CSS:#TOOL-NAME#';
let editor = null;

new Vue({
    el: '#pageContainer',
    data: {
        showGivenIcons: false,
        myTools: {},
        showEditorFlag: false,
        showNewToolForm: false,
        updateUrlMode: false,
        givenIconList: [],
        model: {},
        demo: {
            name: 'hello-world',
            files: ['fh-config.js', 'index.html', 'index.js', 'index.css', 'content-script.js','content-script.css']
        }
    },
    mounted: function () {

        this.getToolConfigs();
    },

    methods: {

        startByDemo() {
            this.loadDemo().then(() => {
                setTimeout(() => this.getToolConfigs(),300);
            });
        },
        toggleEditor(show, toolName) {
            this.showEditorFlag = show;
            if (show && toolName) {

                let toolObj = this.myTools[toolName] || {};
                this.model = {
                    tool: toolName,
                    name: toolObj.name
                };

                this.getToolFilesFromLocal(toolName).then(files => {
                    this.model.files = files;

                    if (!editor) {
                        editor = CodeMirror.fromTextArea(this.$refs.txtEditor, {
                            mode: 'javascript',
                            lineNumbers: true,
                            matchBrackets: true,
                            styleActiveLine: true,
                            lineWrapping: true
                        });
                        editor.on('change', (editor, changes) => {
                            let result = this.saveContentToLocal(this.model.tool, this.model.editingFile, editor.getValue());
                            if (this.model.editingFile === 'fh-config.js' && result) {
                                result.contentScriptJs && !this.model.files.includes('content-script.js') && this.model.files.push('content-script.js');
                                result.contentScriptCss && !this.model.files.includes('content-script.css') && this.model.files.push('content-script.css');
                                this.$forceUpdate();
                            }
                        });
                        editor.on('keydown', (editor, event) => {
                            if (event.metaKey || event.ctrlKey) {
                                if (event.code === 'KeyS') {
                                    this.toast('当前代码是自动保存的，无需Ctrl+S手动保存！');
                                    event.preventDefault();
                                    event.stopPropagation();
                                    return false;
                                }
                            }
                        });
                    }
                    this.$nextTick(() => this.editFile(toolName, files[0]));
                });
            }
        },
        editFile(toolName, fileName) {

            let editorMode = {
                css: 'text/css',
                js: {name: 'javascript', json: true},
                html: 'htmlmixed'
            };
            let mode = editorMode[/\.(js|css|html)$/.exec(fileName)[1]];
            editor.setOption('mode', mode);
            this.model.editingFile = fileName;

            this.getContentFromLocal(toolName, fileName).then(content => {
                editor.setValue(content);
                editor.focus();
                this.$forceUpdate();
            });
        },
        importFile(toolName) {
            let fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = 'multiple';
            fileInput.accept = 'text/javascript,text/css,text/html';
            fileInput.style.cssText = 'position:absolute;top:-100px;left:-100px';
            fileInput.addEventListener('change', (evt) => {
                Array.prototype.slice.call(fileInput.files).forEach(file => {
                    let reader = new FileReader();
                    reader.onload = (evt) => {
                        if (this.model.files.includes(file.name)) {
                            if (!confirm(`文件 ${file.name} 已经存在，是否需要覆盖？`)) {
                                return false;
                            }
                        } else {
                            this.model.files.push(file.name);
                        }
                        this.saveContentToLocal(toolName, file.name, evt.target.result);
                        this.editFile(toolName, file.name);
                    };
                    reader.readAsText(file);
                })
            }, false);

            document.body.appendChild(fileInput);
            fileInput.click();
            window.setTimeout(() => fileInput.remove(), 3000);
        },
        createFile(toolName) {
            let fileName = prompt('请输入你要创建的文件名！注意，只能是 *.html 、*.js 、*.css 类型的文件！').trim();
            let result = /^[\w\-_\.]+\.(html|js|css)$/.exec(fileName);
            if (!result) {
                return alert('文件格式不正确！创建文件失败！');
            }
            if (this.model.files.includes(fileName)) {
                return alert(`文件 ${fileName} 已经存在！`);
            }
            this.model.files.push(fileName);
            this.saveContentToLocal(toolName, fileName, '');
            this.editFile(toolName, fileName);
        },
        deleteFile(toolName, fileName, event) {
            event.preventDefault();
            event.stopPropagation();

            if (['fh-config.js', 'index.html'].includes(fileName)) {
                return alert(`文件 ${fileName} 不允许被删除！`);
            }

            if (confirm(`确定要删除文件 ${fileName} 吗？此操作不可撤销，请三思！`)) {
                this.model.files.splice(this.model.files.indexOf(fileName), 1);
                this.$forceUpdate();

                let key = '';
                switch (fileName) {
                    case 'index.html':
                        key = TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName);
                        break;
                    case 'content-script.js':
                        key = TOOL_CONTENT_SCRIPT_TPL.replace('#TOOL-NAME#', toolName);
                        break;
                    case 'content-script.css':
                        key = TOOL_CONTENT_SCRIPT_CSS_TPL.replace('#TOOL-NAME#', toolName);
                        break;
                    default:
                        key = fileName.startsWith(`../${toolName}/`) ? fileName : `../${toolName}/${fileName}`;
                }

                Awesome.StorageMgr.remove(key);
            }
        },

        addNewTool(localOrUrl) {
            this.showNewToolForm = true;
            this.updateUrlMode = localOrUrl === 'url';

            if (this.updateUrlMode) {
                this.toast('请务必载入自己的Web工具服务！PS：请尽量别把它当成网站原内容的爬取工具，因为别人的网站你爬取过来也不一定完全能运行！');
            }
        },
        newToolAction(event) {
            let toolId = this.$refs.toolId.value;
            let toolName = this.$refs.toolName.value;
            let toolIcon = this.$refs.toolIcon.value;
            let contentScript = this.$refs.hasContentScript.checked;
            let noPage = this.$refs.noPage.checked;
            let updateUrl = '';
            if (this.updateUrlMode) {
                updateUrl = this.$refs.updateUrl.value;
                if (updateUrl.indexOf('baidufe.com') > -1 || updateUrl.indexOf('fehelper.com') > -1) {
                    return this.toast('如果你是要安装FeHelper官网的工具，请到插件配置页直接安装！');
                }
            }

            if (this.myTools[toolId]) {
                this.toast(`ID为 ${toolId} 的工具在本地已存在，请重新命名！`);
                event.preventDefault();
                return false;
            }

            // 关闭Form表单
            this.showNewToolForm = false;

            // 创建文件列表
            let files = ['fh-config.js'];
            (contentScript || noPage) && files.push('content-script.js');

            // 本地创建的模式，需要用模板来初始化
            if (!this.updateUrlMode) {
                files.push('index.html');
                if (!noPage) {
                    files.push('index.css');
                    files.push('index.js');
                }
            }

            // 初始化的文件内容，需要进行存储
            files.forEach(file => {
                let content = FileTpl[file].replace(/#toolName#/gm, toolId)
                    .replace(/#toolFullName#/gm, toolName)
                    .replace(/#toolIcon#/gm, toolIcon)
                    .replace(/#updateUrl#/gm, updateUrl)
                    .replace(/#contentScript#/gm, !!contentScript || !!noPage)
                    .replace(/#noPage#/gm, !!noPage)
                    .replace(/#toolNameLower#/gm, toolId.replace(/[\-_]/g, ''));
                if (noPage && file === 'content-script.js') {
                    content += '\n\n' + FileTpl['noPage.js'].replace(/#toolName#/gm, toolId)
                        .replace(/#toolNameLower#/gm, toolId.replace(/[\-_]/g, ''));
                }

                this.saveContentToLocal(toolId, file, content);
            });

            if (this.updateUrlMode) {
                // 远程下载并安装工具
                this.loadRemoteTool(toolId, updateUrl, this.toast).then(progress => {
                    this.toast(progress);
                    setTimeout(() => this.toggleEditor(true, toolId),300);
                    this.toast('工具创建成功！现在可以进行实时编辑了！');
                });
            } else {
                setTimeout(() => this.toggleEditor(true, toolId),300);
                this.toast('工具创建成功！现在可以进行实时编辑了！');
            }

            event.preventDefault();
            return false;
        },

        loadRemoteTool(toolName, updateUrl, fnProgress) {
            return new Promise((resolve, reject) => {
                fnProgress && fnProgress('开始下载...');
                fetch(updateUrl).then(resp => resp.text()).then(html => {
                    let result = this.htmlTplEncode(toolName, html, updateUrl);
                    html = result.html;
                    let files = result.jsCss;

                    // 获取所有网络文件的总个数，以便于计算进度
                    let total = Object.values(files).reduce((sum, arr) => sum + arr.length, 0) + 1;
                    let loaded = 1;
                    fnProgress && fnProgress(Math.floor(100 * loaded / total) + '%');

                    (async () => {

                        let toolObj = this.myTools[toolName];

                        for (let t in files) {
                            for (let f = 0; f < files[t].length; f++) {
                                let fs = files[t][f];

                                // script-block内识别出来的代码，直接保存
                                if (t === 'js' && fs[0].indexOf('fh-script-block.js') > -1) {
                                    this.saveContentToLocal(toolName, fs[0], fs[2]);
                                    continue;
                                }

                                await fetch(fs[2]).then(resp => resp.text()).then(txt => {
                                    this.saveContentToLocal(toolName, fs[0], txt);

                                    // 保存content-script / background-script
                                    if (toolObj.contentScriptJs && fs[0].indexOf(toolName + '/content-script.js') !== -1) {
                                        this.saveContentToLocal(toolName, 'content-script.js', txt);

                                        // 存储content-script.css文件内容
                                        if (toolObj.contentScriptCss) {
                                            fetch(fs[2].replace('content-script.js', 'content-script.css')).then(resp => resp.text()).then(css => {
                                                this.saveContentToLocal(toolName, 'content-script.css', css);
                                            });
                                        }
                                    }

                                    fnProgress && fnProgress(Math.floor(100 * ++loaded / total) + '%');
                                });
                            }
                        }

                        // 全部下载完成！
                        resolve && resolve('100%');
                    })();

                    this.saveContentToLocal(toolName, 'index.html', html);
                }).catch(e => {
                    this.delToolConfigs(toolName);
                    fnProgress && fnProgress(`糟糕，下载出错，工具远程安装失败！${e.toString()}`);
                });
            });
        },


        loadDemo() {
            let demoName = this.demo.name;
            let files = this.demo.files;
            let site = '.';
            if (window.chrome && chrome.runtime && chrome.runtime.getURL) {
                site = chrome.runtime.getURL('devtools');
            }
            let arrPromise = files.map(file => fetch(`${site}/${demoName}/${file}`).then(resp => resp.text()));
            return Promise.all(arrPromise).then(contents => {
                // fh-config.js
                let json = new Function('return ' + contents[0])();
                this.addToolConfigs(json);

                // index.html
                let result = this.htmlTplEncode(demoName, contents[1]);
                this.saveContentToLocal(demoName, files[1], result.html, true);

                // 其他文件
                for (let i = 2; i < contents.length; i++) {
                    this.saveContentToLocal(demoName, files[i], contents[i]);
                }

                this.toast('你的Hello World已安装成功！');
            });
        },

        downloadTool(tool) {
            let toolName = tool || this.demo.name;

            this.getToolFilesFromLocal(toolName).then(files => {
                let arrPromise = files.map(file => this.getContentFromLocal(toolName, file));

                Promise.all(arrPromise).then(contents => {
                    let zipper = new JSZip();
                    let zipPkg = zipper.folder(toolName);
                    files.forEach((file, index) => zipPkg.file(file, contents[index]));

                    zipper.generateAsync({type: "blob"})
                        .then(function (content) {
                            let elA = document.createElement('a');
                            elA.style.cssText = 'position:absolute;top:-1000px;left:-10000px;';
                            elA.setAttribute('download', `${toolName}.zip`);
                            elA.href = URL.createObjectURL(new Blob([content], {type: 'application/octet-stream'}));
                            document.body.appendChild(elA);
                            elA.click();
                        });
                });
            });
        },

        upgrade(tool, urlMode) {
            if (tool === this.demo.name) {
                this.loadDemo();
            } else if (urlMode) {
                // 远程下载并安装工具
                this.loadRemoteTool(tool, this.myTools[tool].updateUrl, this.toast).then(progress => {
                    this.toast(progress);
                    this.toast('工具更新完成！');
                });
            } else {
                this.loadTool(true, tool);
            }
        },

        loadTool(upgradeMode, upgradeToolName) {
            let Model = (function () {
                zip.useWebWorkers = false;

                return {
                    getEntries: function (file, onend) {
                        zip.createReader(new zip.BlobReader(file), function (zipReader) {
                            zipReader.getEntries(onend);
                        }, function (e) {
                            console.log(e);
                        });
                    },

                    getEntryFile: function (entry, onend, onprogress) {
                        entry.getData(new zip.TextWriter(), function (text) {
                            onend(text);
                        }, onprogress);
                    }
                };
            })();

            let fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'application/zip';
            fileInput.style.cssText = 'position:absolute;top:-100px;left:-100px';
            fileInput.addEventListener('change', (evt) => {
                let toolName = fileInput.files[0].name.replace('.zip', '');
                if (upgradeMode && upgradeToolName !== toolName) {
                    return this.toast(`请确保上传${upgradeToolName}.zip进行更新！`);
                }
                Model.getEntries(fileInput.files[0], (entries) => {
                    entries = entries.filter(entry => !entry.directory && /\.(html|js|css)$/.test(entry.filename));
                    let reg = /(fh-config\.js|index\.html|content-script\.(js|css))$/;
                    let entPart1 = entries.filter(en => reg.test(en.filename));
                    let entPart2 = entries.filter(en => !reg.test(en.filename));

                    entPart1.forEach((entry) => {
                        Model.getEntryFile(entry, (fileContent) => {
                            let fileName = entry.filename.split('/').pop();
                            try {
                                if (fileName === `fh-config.js`) {
                                    let json = JSON.parse(fileContent);
                                    this.addToolConfigs(json);
                                } else if (fileName === 'index.html') {
                                    let result = this.htmlTplEncode(toolName, fileContent);
                                    this.saveContentToLocal(toolName, fileName, result.html, true);

                                    // 所有被引用的静态文件都在这里进行遍历
                                    entPart2.forEach(jcEntry => {
                                        Model.getEntryFile(jcEntry, jcContent => {
                                            Object.keys(result.jsCss).forEach(tp => {
                                                result.jsCss[tp].some(file => {
                                                    if (file[0].indexOf(jcEntry.filename) > -1) {
                                                        this.saveContentToLocal(toolName, file[0].replace(`../${toolName}/`, ''), jcContent);
                                                        return true;
                                                    }
                                                });
                                            });
                                        });
                                    });
                                } else if (['content-script.js', 'content-script.css'].includes(fileName)) {
                                    this.saveContentToLocal(toolName, fileName, fileContent);
                                }
                            } catch (err) {
                                this.toast(`${fileName} 文件发生错误：${err.message}`);
                            }
                        });
                    });
                    this.toast('工具更新成功！');
                });
            }, false);

            document.body.appendChild(fileInput);
            fileInput.click();
            window.setTimeout(() => fileInput.remove(), 3000);
        },

        getToolConfigs() {
            return Awesome.StorageMgr.get(DEV_TOOLS_MY_TOOLS).then(data => {
                this.myTools = JSON.parse(data || localStorage.getItem(DEV_TOOLS_MY_TOOLS) || '{}');
                Object.keys(this.myTools).forEach(t => {
                    if(this.myTools[t].menuConfig) {
                        this.myTools.icon = this.myTools[t].menuConfig[0].icon;
                        delete this.myTools[t].menuConfig;
                    }
                    if(this.myTools[t].contentScript) {
                        this.myTools[t].contentScriptJs = this.myTools[t].contentScript;
                        delete this.myTools[t].contentScript;
                    }
                    if(!this.myTools[t].icon) {
                        this.myTools[t].icon = '◆';
                    }
                });
            });
        },

        setToolConfigs() {
            Awesome.StorageMgr.set(DEV_TOOLS_MY_TOOLS,JSON.stringify(this.myTools));
        },

        addToolConfigs(configs) {
            this.getToolConfigs().then(() => {
                Object.keys(configs).forEach(key => {
                    let config = configs[key];
                    this.myTools[key] = {
                        _devTool: true,
                        _enable: this.myTools[key] && this.myTools[key]._enable,
                        name: config.name,
                        tips: config.tips,
                        icon: config.icon,
                        noPage: !!config.noPage,
                        contentScriptJs: !!config.contentScriptJs || !!config.contentScript,
                        contentScriptCss: !!config.contentScriptCss,
                        updateUrl: config.updateUrl || null
                    }
                });
                this.setToolConfigs();
            });
        },

        delToolConfigs(tools) {
            // 先删除文件
            [].concat(tools).forEach(tool => {
                this.getToolFilesFromLocal(tool).then(files => {
                    Awesome.StorageMgr.remove(files.map(file =>
                        file.startsWith(`../${tool}`) ? file : `../${tool}/${file}` ));
                });

                // 删模板等
                let removeItems = [
                    TOOL_NAME_TPL.replace('#TOOL-NAME#', tool),
                    TOOL_CONTENT_SCRIPT_TPL.replace('#TOOL-NAME#', tool),
                    TOOL_CONTENT_SCRIPT_CSS_TPL.replace('#TOOL-NAME#', tool)
                ];
                Awesome.StorageMgr.remove(removeItems);
            });

            // 再删配置
            [].concat(tools).forEach(tool => {
                delete this.myTools[tool];
            });

            this.setToolConfigs();
            this.$forceUpdate();

            this.toast('工具删除成功！');
        },

        toggleToolEnableStatus(tool) {
            this.myTools[tool]._enable = !this.myTools[tool]._enable;
            this.setToolConfigs();
            this.$forceUpdate();
        },

        getToolFilesFromLocal(toolName) {
            return new Promise(resolve => {
                let files = ['fh-config.js', 'index.html'];
                let toolObj = this.myTools[toolName];
                toolObj.contentScriptJs && files.push('content-script.js');
                toolObj.contentScriptCss && files.push('content-script.css');

                chrome.storage.local.get(null, allDatas => {
                    let fs = Object.keys(allDatas).filter(key => String(key).startsWith(`../${toolName}/`));
                    files = files.concat(fs);
                    resolve(files.map(f => f.replace(`../${toolName}/`, '')));
                });
            });
        },

        saveContentToLocal(toolName, fileName, content, htmlDone) {

            if (fileName === 'fh-config.js') {
                try {
                    let json = JSON.parse(content);
                    this.addToolConfigs(json);
                    this.$forceUpdate();
                    return json[toolName];
                } catch (e) {
                    return null;
                }
            }

            let key = '';
            switch (fileName) {
                case 'index.html':
                    key = TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName);
                    if (!htmlDone) {
                        let result = this.htmlTplEncode(toolName, content);
                        content = result.html;
                    }
                    break;
                case 'content-script.js':
                    key = TOOL_CONTENT_SCRIPT_TPL.replace('#TOOL-NAME#', toolName);
                    break;
                case 'content-script.css':
                    key = TOOL_CONTENT_SCRIPT_CSS_TPL.replace('#TOOL-NAME#', toolName);
                    break;
                default:
                    key = fileName.startsWith(`../${toolName}/`) ? fileName : `../${toolName}/${fileName}`;
            }

            return Awesome.StorageMgr.set(key,content);
        },

        getContentFromLocal(toolName, fileName) {

            return new Promise((resolve, reject) => {
                if (fileName === 'fh-config.js') {
                    let counter = 0;
                    let config = {};
                    config[toolName] = this.myTools[toolName];
                    ['_devTool', '_enable'].forEach(k => delete config[toolName][k]);
                    delete config[toolName].menuConfig;

                    let jsonText = JSON.stringify(config,null,4);

                    resolve(jsonText);
                } else {
                    let key = '';
                    switch (fileName) {
                        case 'index.html':
                            key = TOOL_NAME_TPL.replace('#TOOL-NAME#', toolName);
                            break;
                        case 'content-script.js':
                            key = TOOL_CONTENT_SCRIPT_TPL.replace('#TOOL-NAME#', toolName);
                            break;
                        case 'content-script.css':
                            key = TOOL_CONTENT_SCRIPT_CSS_TPL.replace('#TOOL-NAME#', toolName);
                            break;
                        default:
                            key = fileName.startsWith(`../${toolName}/`) ? fileName : `../${toolName}/${fileName}`;
                    }

                    // 获取到的数据需要做二次加工
                    let _update = (content) => {
                        content = content || '';
                        if (fileName === 'index.html') {
                            content = this.htmlTplDecode(toolName, content);
                        }
                        // 如果noPage为true，但content-script.js中还没有window.xxxNoPage定义的话，就自动加一个
                        else if (fileName === 'content-script.js' && this.myTools[toolName].noPage) {
                            if (content.indexOf(`window.${toolName.replace(/[\-_]/g, '')}NoPage`) === -1) {
                                content += '\n\n' + FileTpl['noPage.js'].replace(/#toolName#/gm, toolName)
                                    .replace(/#toolNameLower#/gm, toolName.replace(/[\-_]/g, ''));
                                this.saveContentToLocal(toolName, fileName, content);
                            }
                        }

                        return content
                    };

                    Awesome.StorageMgr.get(key).then(data => {
                        resolve(_update(data));
                    });
                }
            });
        },

        htmlTplEncode(toolName, html, updateUrl) {
            let jsReg = /<script[^>]*src=['"]([^'"]+)['"][^>]*>\s*?<\/[^>]*script>/igm;
            let csReg = /<link\s+[^>]*[^>]*href=['"]([^'"]+)['"][^>]*[^>]*>/igm;
            let scriptBlockReg = /<script(?:[^>]+|(?!src=))*>([^<]+|<(?!\/script>))+<\/script>/gim;
            let files = {};

            [csReg, jsReg].forEach(reg => {
                html = html.replace(reg, (tag, src) => {

                    let tagName = /<script/.test(tag) ? 'js' : 'css';
                    if (tagName === 'css' && !/stylesheet/i.test(tag)) {
                        return tag;
                    }

                    // 这里必须保留带有md5戳的原地址，要不然会有cdn缓存，更新会失败
                    let originSrc = src;

                    // 这个src是携带了Query的，用于直接存储到html中
                    let withQuerySrc = src;

                    // src 去query处理，用于Storage存储，避免过多冗余key出现
                    if (src.indexOf('?') !== -1) {
                        let x = src.split('?');
                        x.pop();
                        src = x.join('');
                    }

                    if (!/^\./.test(src)) {
                        src = `../${toolName}/${src}`;
                        withQuerySrc = `../${toolName}/${withQuerySrc}`;
                    }

                    // 存储静态文件的内容
                    let filePath = originSrc;
                    if (!/^(http(s)?:)?\/\//.test(originSrc) && updateUrl) {
                        filePath = new URL(originSrc, updateUrl).href;
                    }

                    files[tagName] = files[tagName] || [];
                    files[tagName].push([src, withQuerySrc, filePath]);

                    return '';
                });
            });

            // 识别所有无src属性的script标签
            let blockCodes = [];
            html = html.replace(scriptBlockReg, (tag, codes) => {
                codes = codes.trim();
                codes.length && blockCodes.push(codes);
                return '';
            });
            if (blockCodes.length) {
                let blockName = `../${toolName}/fh-script-block.js`;
                files.js = files.js || [];
                files.js.push([blockName, blockName, blockCodes.join(';\n\n')]);
            }

            // 如果是updateURL模式，需要替换所有相对链接为绝对链接，包括：img、a
            if (updateUrl) {
                let relativePathRegexp = /^(http:\/\/|https:\/\/|\/\/)[^\s'"]+/igm;
                let imgReg = /<img[^>]*src=['"]([^'"]+)['"][^>]*>(\s*?<\/[^>]*img>)?/igm;
                let aReg = /<a[^>]*href=['"]([^'"]+)['"][^>]*>(\s*?<\/[^>]*a>)?/igm;

                html = html.replace(imgReg, (tag, link) => {
                    if (!relativePathRegexp.test(link)) {
                        tag = tag.replace(/src=['"]([^'"]+)['"]/igm, () => ` src="${new URL(link, updateUrl).href}"`);
                    }
                    return tag;
                }).replace(aReg, (tag, link) => {
                    if (!relativePathRegexp.test(link)) {
                        tag = tag.replace(/href=['"]([^'"]+)['"]/igm, () => ` href="${new URL(link, updateUrl).href}"`);
                    }
                    return tag;
                });
            }

            html = html.replace('static/img/favicon.ico', 'static/img/fe-16.png')  // 替换favicon
                .replace(/<\/body>/, () => { // 将静态文件添加到页面最底部
                    return Object.keys(files).map(t => {
                        return `<dynamic data-type="${t}" data-source="${files[t].map(f => f[1]).join(',')}"></dynamic>`;
                    }).join('') + '</body>';
                });
            return {
                html: html,
                jsCss: files
            };
        },

        htmlTplDecode(toolName, html) {
            let reg = /<dynamic\s+data\-type="(js|css)"\s+data\-source=['"]([^'"]+)['"][^>]*>\s*?<\/[^>]*dynamic>/igm;
            return html.replace(reg, (frag, tag, list) => {
                list = list.split(',');
                if (tag === 'js') {
                    return list.map(src => `<script src="${src.replace(`../${toolName}/`, '')}"></script>`).join('');
                } else {
                    return list.map(href => `<link rel="stylesheet" type="text/css" href="${href.replace(`../${toolName}/`, '')}" />`).join('');
                }
            });
        },

        givenIcons(forceClose) {
            if (!this.givenIconList.length) {
                this.givenIconList = FileTpl['given-icons'].replace(/\s/gm, '').split('');
            }

            if (forceClose) {
                this.showGivenIcons = false;
            } else {
                this.showGivenIcons = !this.showGivenIcons;
            }
            this.$forceUpdate();
        },
        selectIcon(icon) {
            if (this.showNewToolForm) {
                this.$refs.toolIcon.value = icon;
                this.givenIcons(true);
            } else {
                this.copyToClipboard(icon);
                this.toast(`图标 ${icon} 复制成功，随处粘贴可用！`);
            }
        },

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
            }, 3000);
        },
        copyToClipboard(text) {
            let input = document.createElement('textarea');
            input.style.position = 'fixed';
            input.style.opacity = 0;
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);
        },
        fhDeveloperDoc() {
            window.open('https://fehelper.com/docs.html?tool=devtools');
        }
    }
});
