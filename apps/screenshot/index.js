/**
 * FeHelper，截图后的保存界面
 */
new Vue({
    el: '#pageContainer',
    data: {
        tabList: [],
        capturedImage: '',
        imageHTML: '',
        defaultFilename: Date.now() + '.png',
        totalWidth: 100,
        totalHeight: 100
    },
    mounted: function () {
        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        if (location.protocol === 'chrome-extension:') {
            chrome.tabs.query({currentWindow: true,active: true, }, (tabs) => {
                let activeTab = tabs.filter(tab => tab.active)[0];
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'request-page-content',
                    tabId: activeTab.id
                }).then(resp => {
                    if(!resp || !resp.content) return ;
                    this.showResult(resp.content);
                });
            });
        }
    },
    methods: {
        /**
         * 显示结果到Canvas画布
         * @param data
         */
        showResult: function(data){
            if (!data || !data.screenshots || !data.screenshots.length) {
                alert('截图数据无效，请重试！');
                return;
            }
            
            const filename = data.filename || 'fe-helper-screenshot.png';
            const exportFileName = filename.replace(/\.(jpg|jpeg|png|gif|bmp|webp)$/i, '') + '.png';
            this.defaultFilename = exportFileName;
            
            // 处理单张和多张截图的不同情况
            if (data.screenshots.length === 1) {
                // 单张截图 - 使用提供的尺寸
                this._processSingleScreenshot(data);
            } else {
                // 多张截图 - 垂直拼接
                this._processVerticalStitching(data);
            }
        },
        
        /**
         * 处理单张截图
         */
        _processSingleScreenshot: function(data) {
            const screenshot = data.screenshots[0];
            const dataUri = screenshot.dataUri || screenshot.dataUrl;
            
            if (!dataUri) {
                alert('截图数据无效，请重试！');
                return;
            }
            
            // 设置canvas尺寸
            const canvas = document.getElementById('fehelper_resultCanvas');
            if (!canvas) {
                alert('无法找到画布元素，请刷新页面重试！');
                return;
            }
            
            // 使用提供的尺寸或截图的尺寸
            const width = data.totalWidth || screenshot.width || screenshot.right - screenshot.left;
            const height = data.totalHeight || screenshot.height || screenshot.bottom - screenshot.top;
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const img = new Image();
            img.onload = () => {
                // 绘制到画布
                ctx.drawImage(img, 0, 0);
                
                // 显示处理结果
                this._showFinalResult(canvas, this.defaultFilename);
            };
            
            img.onerror = () => {
                alert('加载截图失败，请重试！');
                $('#fehelper_loading').hide();
            };
            
            img.src = dataUri;
        },
        
        /**
         * 垂直拼接多张截图
         */
        _processVerticalStitching: function(data) {
            // 将数据排序，确保按正确顺序垂直拼接
            // 对于垂直拼接，我们主要关注y坐标和row值
            const sortedScreenshots = [...data.screenshots].sort((a, b) => {
                // 优先使用row进行排序
                if (a.row !== undefined && b.row !== undefined) {
                    return a.row - b.row;
                }
                
                // 如果没有row，则使用top或y坐标排序
                if (a.top !== undefined && b.top !== undefined) {
                    return a.top - b.top;
                }
                
                if (a.y !== undefined && b.y !== undefined) {
                    return a.y - b.y;
                }
                
                // 如果以上都没有，则使用索引值
                return (a.index || 0) - (b.index || 0);
            });
            
            // 加载所有图像
            Promise.all(sortedScreenshots.map((screenshot, index) => {
                return new Promise((resolve, reject) => {
                    const dataUri = screenshot.dataUri || screenshot.dataUrl;
                    
                    if (!dataUri) {
                        resolve(null);
                        return;
                    }
                    
                    const img = new Image();
                    img.onload = () => {
                        // 添加图像对象和计算后的尺寸信息
                        screenshot.img = img;
                        screenshot.width = img.width;
                        screenshot.height = img.height;
                        resolve(screenshot);
                    };
                    
                    img.onerror = () => {
                        resolve(null);
                    };
                    
                    img.src = dataUri;
                });
            }))
            .then(loadedScreenshots => {
                const validScreenshots = loadedScreenshots.filter(Boolean);
                
                if (validScreenshots.length === 0) {
                    alert('没有有效的截图数据，请重试！');
                    $('#fehelper_loading').hide();
                    return;
                }
                
                // 计算总宽度和总高度
                // 总宽度取所有截图中的最大宽度
                const totalWidth = Math.max(...validScreenshots.map(s => s.width || s.img.width));
                // 总高度为所有截图高度之和
                const totalHeight = validScreenshots.reduce((sum, s) => sum + (s.height || s.img.height), 0);
                
                // 设置canvas尺寸
                const canvas = document.getElementById('fehelper_resultCanvas');
                if (!canvas) {
                    alert('无法找到画布元素，请刷新页面重试！');
                    $('#fehelper_loading').hide();
                    return;
                }
                
                canvas.width = totalWidth;
                canvas.height = totalHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 垂直拼接图像
                let currentY = 0;
                validScreenshots.forEach((screenshot, index) => {
                    const { img } = screenshot;
                    const width = screenshot.width || img.width;
                    const height = screenshot.height || img.height;
                    
                    // 计算绘制位置，水平居中，垂直方向按顺序拼接
                    const x = (totalWidth - width) / 2;
                    
                    // 绘制图像
                    ctx.drawImage(img, x, currentY);
                    
                    // 更新Y坐标为下一个位置
                    currentY += height;
                });
                
                // 显示处理结果
                this._showFinalResult(canvas, this.defaultFilename);
            })
            .catch(() => {
                alert('处理截图出错，请重试！');
                $('#fehelper_loading').hide();
            });
        },
        
        /**
         * 显示最终结果
         */
        _showFinalResult: function(canvas, filename) {
            // 显示保存按钮
            $('.btn-save').text(`保存为 ${filename}`).show();
            $('.btn-toolbox').show();
            
            // 隐藏img元素，只显示canvas
            const resultImg = document.getElementById('fehelper_resultImg');
            if (resultImg) {
                resultImg.style.display = 'none';
            }
            
            // 显示canvas
            canvas.style.display = 'block';
            
            // 隐藏加载提示
            $('#fehelper_loading').hide();
        },

        save: function () {
            // 请求权限
            chrome.permissions.request({
                permissions: ['downloads']
            }, (granted) => {
                if (granted) {
                    try {
                        const canvas = document.getElementById('fehelper_resultCanvas');
                        if (!canvas) {
                            throw new Error('找不到canvas元素');
                        }
                        
                        chrome.downloads.download({
                            url: canvas.toDataURL('image/png'),
                            saveAs: true,
                            conflictAction: 'overwrite',
                            filename: this.defaultFilename
                        });
                    } catch (e) {
                        alert('保存图片失败: ' + e.message);
                    }
                } else {
                    alert('必须接受授权，才能正常下载！');
                }
            });
        },

        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'screenshot' }
            });
        },

        openOptionsPage: function(event) {  
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        }
    }
});
