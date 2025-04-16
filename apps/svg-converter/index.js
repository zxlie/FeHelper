/**
 * FeHelper SVG转图片工具
 * 实现SVG到图片格式的转换
 */

new Vue({
    el: '#pageContainer',
    data: {
        // 工具类型
        toolName: 'SVG转图片',
        
        // SVG转图片相关
        previewSrc: '',
        convertedSrc: '',
        outputFormat: 'png',
        outputWidth: 0,
        outputHeight: 0,
        imgWidth: 128,
        imgHeight: 128,
        originalWidth: 0,
        originalHeight: 0,
        
        // 通用
        error: '',
        
        // SVG转图片相关数据
        svgSource: '',
        svgPreviewSrc: '',
        svgFile: null,
        svgInfo: {
            dimensions: '0 x 0',
            fileSize: '0 KB',
            fileType: 'SVG'
        },
        
        // 输出图片相关数据
        imgSource: '',
        imgPreviewSrc: '',
        imgInfo: {
            dimensions: '0 x 0',
            fileSize: '0 KB',
            fileType: 'PNG',
            comparison: {
                ratio: 0,
                isIncrease: false
            }
        },
        
        // 错误信息
        errorMsg: '',
        
        // SVG相关状态
        svgDimensions: { width: 0, height: 0 },
        svgFileSize: 0,
        svgFileName: '',
        svgError: '',
        
        // 图片相关状态
        imgDimensions: { width: 0, height: 0 },
        imgFileSize: 0,
        imgFileName: '',
        
        // 转换选项
        outputWidth: 0,
        outputHeight: 0,
        
        // 转换结果
        convertedFileSize: 0,
        
        // 加载状态
        isProcessing: false,
        processingProgress: 0,
        processingMessage: '',
        
        // 文件大小比较
        sizeComparison: {
            difference: 0,
            percentage: 0,
            isIncrease: false
        }
    },

    computed: {
        // 是否展示SVG预览
        showSvgPreview() {
            return this.svgSource && !this.svgError;
        },
        
        // 是否展示图片预览
        showImgPreview() {
            return this.imgSource && !this.imgError;
        },
        
        // 是否展示转换结果
        showResult() {
            return this.convertedSrc && !this.svgError && !this.imgError;
        },
        
        // 是否可以转换
        canConvert() {
            return this.svgSource;
        },
        
        // 下载文件名称
        downloadFileName() {
            const baseName = this.svgFileName.replace(/\.svg$/i, '') || 'converted';
            return `${baseName}.${this.outputFormat}`;
        },
        
        // 格式化后的SVG文件大小
        formattedSvgFileSize() {
            return this.formatFileSize(this.svgFileSize);
        },
        
        // 格式化后的图片文件大小
        formattedImgFileSize() {
            return this.formatFileSize(this.imgFileSize);
        },
        
        // 格式化后的转换结果文件大小
        formattedConvertedFileSize() {
            return this.formatFileSize(this.convertedFileSize);
        },
        
        // 格式化后的文件大小差异
        formattedSizeDifference() {
            return this.formatFileSize(Math.abs(this.sizeComparison.difference));
        },
        
        // 文件大小变化的百分比
        sizeChangeText() {
            if (this.sizeComparison.percentage === 0) return '无变化';
            
            const sign = this.sizeComparison.isIncrease ? '增加' : '减少';
            return `${sign} ${this.sizeComparison.percentage}%`;
        },
        
        // 文件大小变化的CSS类
        sizeChangeClass() {
            if (this.sizeComparison.percentage === 0) return 'size-same';
            return this.sizeComparison.isIncrease ? 'size-increase' : 'size-decrease';
        }
    },

    mounted: function() {
        // 监听paste事件
        document.addEventListener('paste', this.pasteSvg, false);

        // 初始化拖放功能
        this.initDragAndDrop();
        
        // 确保文件上传元素可用 - 使用多层保障确保DOM完全加载
        // 1. 首先使用Vue的nextTick
        this.$nextTick(() => {
            // 2. 然后添加一个短暂的延时确保DOM完全渲染
            setTimeout(() => {
                this.ensureFileInputsAvailable();
            }, 300);
        });
        
        // 3. 添加一个额外的保障，如果页面已完全加载则立即执行，否则等待加载完成
        if (document.readyState === 'complete') {
            this.ensureFileInputsAvailable();
        } else {
            window.addEventListener('load', () => {
                this.ensureFileInputsAvailable();
            });
        }
    },
    
    watch: {
        previewSrc: function(newVal) {
            // 确保DOM元素存在再进行操作
            if (this.$refs.panelBox) {
                if (newVal && newVal.length > 0) {
                    this.$refs.panelBox.classList.add('has-image');
                } else {
                    this.$refs.panelBox.classList.remove('has-image');
                }
            }
        },
        svgPreviewSrc: function(newVal) {
            // 使用选择器直接获取元素，避免依赖ref
            const svgPanel = document.querySelector('.mod-svg-converter .x-panel');
            if (svgPanel) {
                if (newVal && newVal.length > 0) {
                    svgPanel.classList.add('has-image');
                } else {
                    svgPanel.classList.remove('has-image');
                }
            }
        },
        imgPreviewSrc: function(newVal) {
            // 使用选择器直接获取元素
            const imgPanel = document.querySelector('.mod-svg-converter .result-zone img');
            if (imgPanel && imgPanel.parentNode) {
                if (newVal && newVal.length > 0) {
                    imgPanel.parentNode.classList.add('has-image');
                } else {
                    imgPanel.parentNode.classList.remove('has-image');
                }
            }
        }
    },

    methods: {
        /**
         * 重置状态
         */
        resetState: function() {
            this.previewSrc = '';
            this.convertedSrc = '';
            this.imgPreviewSrc = '';
            this.error = '';
            this.outputWidth = 0;
            this.outputHeight = 0;
            this.originalWidth = 0;
            this.originalHeight = 0;
            
            // 移除has-image类
            if (this.$refs.panelBox) {
                this.$refs.panelBox.classList.remove('has-image');
            }

            this.svgSource = '';
            this.svgPreviewSrc = '';
            this.svgFile = null;
            this.imgSource = '';
            this.imgPreviewSrc = '';
            this.errorMsg = '';
            this.svgInfo = {
                dimensions: '0 x 0',
                fileSize: '0 KB',
                fileType: 'SVG'
            };
            this.imgInfo = {
                dimensions: '0 x 0',
                fileSize: '0 KB',
                fileType: this.outputFormat.toUpperCase(),
                comparison: {
                    ratio: 0,
                    isIncrease: false
                }
            };
        },
        
        /**
         * 确保文件输入元素可用并正确绑定
         */
        ensureFileInputsAvailable() {
            // 使用setTimeout确保DOM已经完全加载
            setTimeout(() => {
                // 检查SVG文件上传元素
                let svgFileInput = document.getElementById('svgFile');
                if (!svgFileInput) {
                    // 优先从Vue ref中获取
                    if (this.$refs.svgFile) {
                        svgFileInput = this.$refs.svgFile;
                        console.log('从Vue ref中找到SVG文件上传元素');
                    } else {
                        console.warn('SVG文件上传元素不存在，创建新元素');
                        svgFileInput = document.createElement('input');
                        svgFileInput.type = 'file';
                        svgFileInput.id = 'svgFile';
                        svgFileInput.accept = '.svg';
                        svgFileInput.style.display = 'none';
                        document.body.appendChild(svgFileInput);
                        
                        // 绑定上传事件
                        svgFileInput.addEventListener('change', (event) => {
                            this.uploadSvgFile(event);
                        });
                    }
                }
            }, 100); // 100ms延迟，确保DOM已完全加载
        },
        
        /**
         * 重置SVG文件（SVG转图片模式）
         */
        resetSvgFile() {
            try {
                // 1. 首先尝试使用Vue的refs
                if (this.$refs.svgFile) {
                    this.$refs.svgFile.click();
                    return;
                }
                
                // 2. 然后尝试使用ID查询
                const fileInput = document.getElementById('svgFile');
                if (fileInput) {
                    fileInput.click();
                    return;
                }
                
                // 3. 如果上述方法都失败，确保文件输入元素可用
                this.ensureFileInputsAvailable();
                
                // 4. 再次尝试
                const newFileInput = document.getElementById('svgFile');
                if (newFileInput) {
                    newFileInput.click();
                    return;
                }
                
                // 5. 最后的备用方案
                console.warn('无法找到SVG文件上传元素，使用临时元素');
                this.createTemporaryFileInput('.svg', this.uploadSvgFile.bind(this));
            } catch (error) {
                console.error('SVG文件选择器点击失败:', error);
                this.createTemporaryFileInput('.svg', this.uploadSvgFile.bind(this));
            }
        },
        
        /**
         * 创建临时文件输入元素并触发点击
         * @param {string} acceptType - 接受的文件类型
         * @param {Function} changeHandler - 文件变化处理函数
         */
        createTemporaryFileInput(acceptType, changeHandler) {
            const tempInput = document.createElement('input');
            tempInput.type = 'file';
            tempInput.accept = acceptType;
            tempInput.style.display = 'none';
            
            tempInput.addEventListener('change', (event) => {
                if (changeHandler) {
                    changeHandler(event);
                }
                // 使用后移除临时元素
                document.body.removeChild(tempInput);
            });
            
            document.body.appendChild(tempInput);
            tempInput.click();
        },
        
        /**
         * 弹出文件选择对话框 - SVG
         */
        upload: function(event) {
            event.preventDefault();
            this.$refs.fileBox.click();
        },
        
        /**
         * 加载SVG文件
         */
        loadSvg: function() {
            if (this.$refs.fileBox.files.length) {
                const file = this.$refs.fileBox.files[0];
                this.processSvgFile(file);
                this.$refs.fileBox.value = '';
            }
        },
        
        /**
         * 处理SVG文件
         */
        processSvgFile: function(file) {
            // 检查文件大小
            const MAX_SVG_SIZE = 5 * 1024 * 1024; // 5MB
            if (file.size > MAX_SVG_SIZE) {
                // 显示文件大小警告
                this.showFileSizeWarning(file, 'svg');
                return;
            }
            
            // 显示加载状态
            this.isProcessing = true;
            this.processingMessage = '正在处理SVG文件...';
            this.processingProgress = 20;
            
            // 使用全局加载函数作为备份
            if (window.showLoading) {
                window.showLoading('正在处理SVG文件...');
            }
            
            // 读取文件内容
            FileUtils.readAsText(file, (svgContent, error) => {
                if (error) {
                    this.handleError(error, 'svgUpload');
                    if (window.hideLoading) window.hideLoading();
                    return;
                }
                
                try {
                    // 验证SVG内容
                    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
                        this.handleError('无效的SVG文件，缺少SVG标签', 'svgUpload');
                        if (window.hideLoading) window.hideLoading();
                        return;
                    }
                    
                    this.processingProgress = 50;
                    
                    // 解析SVG获取尺寸
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
                    const parserError = svgDoc.querySelector('parsererror');
                        
                    if (parserError) {
                        this.handleError('SVG解析失败，文件可能损坏或格式不正确', 'svgUpload');
                        if (window.hideLoading) window.hideLoading();
                        return;
                    }
                    
                    // 提取尺寸信息
                    const svgElement = svgDoc.documentElement;
                    let width = svgElement.getAttribute('width');
                    let height = svgElement.getAttribute('height');
                    
                    if (!width || !height || width.includes('%') || height.includes('%')) {
                        const viewBox = svgElement.getAttribute('viewBox');
                        if (viewBox) {
                            const viewBoxValues = viewBox.split(/\s+|,/);
                            if (viewBoxValues.length >= 4) {
                                width = parseFloat(viewBoxValues[2]);
                                height = parseFloat(viewBoxValues[3]);
                            }
                        }
                    } else {
                        width = parseFloat(width);
                        height = parseFloat(height);
                    }
                    
                    // 保存SVG信息
                    this.svgDimensions = {
                        width: width || 300,
                        height: height || 150
                    };
                    this.svgSource = svgContent;
                    this.svgFile = file;
                    this.svgFileName = file.name;
                    this.svgFileSize = file.size;
                    
                    this.processingProgress = 70;
                    
                    // 更新SVG信息
                    this.svgInfo.dimensions = `${this.svgDimensions.width} x ${this.svgDimensions.height}`;
                    this.svgInfo.fileSize = this.formatFileSize(file.size);
                    this.svgInfo.fileType = 'SVG';
                    
                    // 创建DataURL预览
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.svgPreviewSrc = e.target.result;
                        
                        // 完成处理
                        this.processingProgress = 100;
                        setTimeout(() => {
                            this.isProcessing = false;
                            if (window.hideLoading) window.hideLoading();
                        }, 300);
                    };
                    
                    reader.onerror = () => {
                        this.handleError('读取SVG文件失败', 'svgUpload');
                        if (window.hideLoading) window.hideLoading();
                    };
                    
                    reader.readAsDataURL(file);
                } catch (err) {
                    this.handleError(err, 'svgUpload');
                    if (window.hideLoading) window.hideLoading();
                }
            });
        },
        
        /**
         * 粘贴SVG内容
         * @param {ClipboardEvent} event - 粘贴事件对象
         */
        pasteSvg(event) {
            // 显示加载状态
            this.isProcessing = true;
            this.processingMessage = '正在处理粘贴内容...';
            this.processingProgress = 20;
            
            if (event && event.clipboardData) {
                // 从事件中获取剪贴板数据
                const items = event.clipboardData.items || {};
                let hasSvgContent = false;
                
                // 处理文本内容，可能是SVG代码或URL
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    
                    if (item.type === 'text/plain') {
                        item.getAsString((text) => {
                            this.processingProgress = 40;
                            const trimmedText = text.trim();
                            
                            // 检查是否是SVG内容
                            if (trimmedText.startsWith('<svg') || trimmedText.startsWith('<?xml') && trimmedText.includes('<svg')) {
                                hasSvgContent = true;
                                this.processSvgText(trimmedText);
                            } 
                            // 检查是否是URL
                            else if (trimmedText.startsWith('http') && 
                                    (trimmedText.toLowerCase().endsWith('.svg') || 
                                     trimmedText.toLowerCase().includes('.svg?'))) {
                                hasSvgContent = true;
                                this.loadSvgFromUrl();
                            } else {
                                this.handleError('剪贴板中没有SVG内容', 'svgUpload');
                            }
                        });
                        break;
                    }
                }
                
                // 处理SVG图像文件
                if (!hasSvgContent) {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        
                        if (item.type.indexOf('image/svg+xml') !== -1) {
                            const file = item.getAsFile();
                            if (file) {
                                this.processingProgress = 60;
                                hasSvgContent = true;
                                this.uploadSvgFile({ target: { files: [file] } });
                                break;
                            }
                        }
                    }
                }
                
                // 如果没有找到SVG内容
                if (!hasSvgContent) {
                    this.handleError('剪贴板中没有SVG内容或无法访问剪贴板', 'svgUpload');
                }
            } else {
                this.handleError('无法访问剪贴板，请直接选择文件上传', 'svgUpload');
            }
        },
        
        /**
         * 处理粘贴的SVG文本内容
         * @param {string} svgText - SVG文本内容
         */
        processSvgText(svgText) {
            try {
                this.processingProgress = 60;
                
                // 验证SVG内容
                if (!svgText.includes('<svg') || !svgText.includes('</svg>')) {
                    this.handleError('无效的SVG内容，缺少SVG标签', 'svgUpload');
                    return;
                }
                
                // 解析SVG获取尺寸
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const parserError = svgDoc.querySelector('parsererror');
                    
                if (parserError) {
                    this.handleError('SVG解析失败，内容可能损坏或格式不正确', 'svgUpload');
                    return;
                }
                
                // 创建SVG文件
                const blob = new Blob([svgText], {type: 'image/svg+xml'});
                const file = new File([blob], 'pasted.svg', {type: 'image/svg+xml'});
                
                // 计算SVG尺寸
                const svgElement = svgDoc.documentElement;
                let width = svgElement.getAttribute('width');
                let height = svgElement.getAttribute('height');
                
                if (!width || !height || width.includes('%') || height.includes('%')) {
                    const viewBox = svgElement.getAttribute('viewBox');
                    if (viewBox) {
                        const viewBoxValues = viewBox.split(/\s+|,/);
                        if (viewBoxValues.length >= 4) {
                            width = parseFloat(viewBoxValues[2]);
                            height = parseFloat(viewBoxValues[3]);
                        }
                    }
                } else {
                    width = parseFloat(width);
                    height = parseFloat(height);
                }
                
                // 保存SVG信息
                this.svgDimensions = {
                    width: width || 300,
                    height: height || 150
                };
                this.svgSource = svgText;
                this.svgFile = file;
                this.svgFileName = 'pasted.svg';
                this.svgFileSize = blob.size;
                
                // 更新SVG信息
                this.svgInfo.dimensions = `${this.svgDimensions.width} x ${this.svgDimensions.height}`;
                this.svgInfo.fileSize = this.formatFileSize(blob.size);
                
                this.processingProgress = 80;
                
                // 创建SVG预览
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.svgPreviewSrc = e.target.result;
                    
                    // 完成处理
                    this.processingProgress = 100;
                    setTimeout(() => {
                        this.isProcessing = false;
                    }, 300);
                };
                
                reader.onerror = () => {
                    this.handleError('读取SVG内容失败', 'svgUpload');
                };
                
                reader.readAsDataURL(file);
            } catch (err) {
                this.handleError(err, 'svgUpload');
            }
        },
        
        /**
         * 从URL加载SVG
         */
        loadSvgFromUrl() {
            const url = prompt('请输入SVG文件的URL:');
            if (!url) return;
            
            // 显示加载状态
            this.isProcessing = true;
            this.processingMessage = '正在从URL加载SVG...';
            this.processingProgress = 20;
            
            // 验证URL
            if (!url.trim().startsWith('http')) {
                this.handleError('URL格式不正确，请输入以http或https开头的有效URL', 'urlLoad');
                return;
            }
            
            // 模拟进度更新
            const progressInterval = setInterval(() => {
                if (this.processingProgress < 80) {
                    this.processingProgress += 10;
                }
            }, 300);
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`获取文件失败，服务器返回状态码: ${response.status}`);
                    }
                    this.processingProgress = 90;
                    return response.text();
                })
                .then(svgContent => {
                    clearInterval(progressInterval);
                    
                    // 验证是否为SVG内容
                    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
                        throw new Error('URL返回的内容不是有效的SVG格式');
                    }
                    
                    // 创建SVG Blob
                    const blob = new Blob([svgContent], {type: 'image/svg+xml'});
                    const file = new File([blob], 'fromURL.svg', {type: 'image/svg+xml'});
                    
                    // 解析SVG获取尺寸信息
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
                    const svgElement = svgDoc.documentElement;
                    
                    // 获取宽高
                    let width = svgElement.getAttribute('width');
                    let height = svgElement.getAttribute('height');
                    
                    if (!width || !height || width.includes('%') || height.includes('%')) {
                        const viewBox = svgElement.getAttribute('viewBox');
                        if (viewBox) {
                            const viewBoxValues = viewBox.split(/\s+|,/);
                            if (viewBoxValues.length >= 4) {
                                width = parseFloat(viewBoxValues[2]);
                                height = parseFloat(viewBoxValues[3]);
                            }
                        }
                    } else {
                        width = parseFloat(width);
                        height = parseFloat(height);
                    }
                    
                    // 保存宽高信息
                    this.svgDimensions = {
                        width: width || 300,
                        height: height || 150
                    };
                    
                    // 保存文件
                    this.svgFile = file;
                    this.svgFileName = url.split('/').pop() || 'fromURL.svg';
                    this.svgFileSize = blob.size;
                    this.svgSource = svgContent;
                    
                    // 更新SVG信息
                    this.svgInfo.dimensions = `${this.svgDimensions.width} x ${this.svgDimensions.height}`;
                    this.svgInfo.fileSize = this.formatFileSize(blob.size);
                    
                    // 创建预览
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.svgPreviewSrc = e.target.result;
                        
                        // 完成加载
                        this.processingProgress = 100;
                        setTimeout(() => {
                            this.isProcessing = false;
                        }, 300);
                    };
                    
                    reader.onerror = () => {
                        this.handleError('读取SVG文件失败', 'urlLoad');
                    };
                    
                    reader.readAsDataURL(blob);
                })
                .catch(error => {
                    clearInterval(progressInterval);
                    this.handleError('加载SVG失败: ' + error.message, 'urlLoad');
                });
        },
        
        /**
         * 重置输出尺寸为原始尺寸
         */
        resetSize: function() {
            this.outputWidth = this.originalWidth;
            this.outputHeight = this.originalHeight;
        },
        
        /**
         * 将SVG转换为图片
         */
        convertSvg() {
            if (!this.svgPreviewSrc) return;
            
            // 设置处理状态
            this.isProcessing = true;
            this.processingMessage = '正在转换SVG...';
            this.processingProgress = 0;
            
            // 模拟进度更新
            const progressInterval = setInterval(() => {
                if (this.processingProgress < 90) {
                    this.processingProgress += 10;
                }
            }, 200);
            
            // 创建图像对象
            const img = new Image();
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    
                    // 设置输出尺寸
                    canvas.width = this.imgWidth || this.svgDimensions.width || img.width;
                    canvas.height = this.imgHeight || this.svgDimensions.height || img.height;
                    
                    const ctx = canvas.getContext('2d');
                    
                    // 绘制白色背景（对于JPG格式）
                    if (this.outputFormat === 'jpg') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    // 绘制SVG
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // 转换为数据URL
                    const dataURL = canvas.toDataURL('image/' + this.outputFormat, 0.95);
                    this.imgPreviewSrc = dataURL;
                    
                    // 计算转换后文件大小
                    const convertedSize = Math.round(dataURL.length * 0.75);
                    
                    // 进度100%
                    this.processingProgress = 100;
                    
                    // 延迟一点关闭加载状态，让用户看到100%
                    setTimeout(() => {
                        clearInterval(progressInterval);
                        this.isProcessing = false;
                        
                        // 更新图片信息
                        this.imgInfo.dimensions = `${canvas.width} x ${canvas.height}`;
                        this.imgInfo.fileSize = this.formatFileSize(convertedSize);
                        this.imgInfo.fileType = this.outputFormat.toUpperCase();
                        
                        // 计算大小比较
                        if (this.svgFileSize > 0) {
                            const difference = convertedSize - this.svgFileSize;
                            const percentage = Math.round((Math.abs(difference) / this.svgFileSize) * 100);
                            
                            this.imgInfo.comparison.ratio = percentage;
                            this.imgInfo.comparison.isIncrease = difference > 0;
                        }
                    }, 500);
                } catch (error) {
                    clearInterval(progressInterval);
                    this.isProcessing = false;
                    this.errorMsg = '转换失败: ' + error.message;
                }
            };
            
            img.onerror = () => {
                clearInterval(progressInterval);
                this.isProcessing = false;
                this.errorMsg = '加载SVG图像失败，请检查SVG文件是否有效';
            };
            
            img.src = this.svgPreviewSrc;
        },
        
        /**
         * 下载转换后的图片
         */
        downloadImage() {
            if (!this.imgPreviewSrc) {
                return;
            }
            
            // 获取当前时间戳
            const timestamp = new Date().getTime();
            const formattedDate = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
            
            // 创建下载链接
            const link = document.createElement('a');
            
            // 基础文件名（移除.svg扩展名）
            let fileName = this.svgFileName.replace(/\.svg$/i, '') || 'converted';
            
            // 添加时间戳到文件名
            fileName += '_' + formattedDate;
            
            // 添加扩展名
            link.download = fileName + '.' + this.outputFormat;
            link.href = this.imgPreviewSrc;
            link.click();
        },
        
        /**
         * 初始化拖放功能
         */
        initDragAndDrop() {
            const svgDropZone = document.querySelector('.x-panel');
            
            if (svgDropZone) {
                // 监听拖拽 - SVG
                svgDropZone.addEventListener('drop', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    let files = event.dataTransfer.files;
                    if (files.length) {
                        if (/svg/.test(files[0].type)) {
                            this.processSvgFile(files[0]);
                        } else {
                            this.errorMsg = '请选择SVG文件！';
                        }
                    }
                }, false);

                // 监听拖拽阻止默认行为 - SVG
                svgDropZone.addEventListener('dragover', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }, false);
            }
        },
        
        /**
         * 计算并设置SVG文件信息
         */
        calculateSvgInfo(svgContent, fileSize) {
            // 设置文件大小
            this.svgInfo.fileSize = this.formatFileSize(fileSize);
            
            // 尝试从SVG内容解析尺寸
            const widthMatch = svgContent.match(/width="([^"]+)"/);
            const heightMatch = svgContent.match(/height="([^"]+)"/);
            
            if (widthMatch && heightMatch) {
                let width = widthMatch[1];
                let height = heightMatch[1];
                
                // 如果尺寸带有单位，尝试转换为像素
                if (isNaN(parseFloat(width))) {
                    width = '自适应';
                }
                if (isNaN(parseFloat(height))) {
                    height = '自适应';
                }
                
                if (width !== '自适应' && height !== '自适应') {
                    this.svgInfo.dimensions = `${width} x ${height}`;
                } else {
                    // 获取viewBox尺寸作为备选
                    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
                    if (viewBoxMatch) {
                        const viewBox = viewBoxMatch[1].split(' ');
                        if (viewBox.length === 4) {
                            this.svgInfo.dimensions = `${viewBox[2]} x ${viewBox[3]}`;
                        }
                    }
                }
            }
        },
        
        /**
         * 更新图片信息
         */
        updateImageInfo(dataUrl, originalSize) {
            // 计算文件大小
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const img = new Image();
                    img.onload = () => {
                        // 设置尺寸
                        this.imgInfo.dimensions = `${img.width} x ${img.height}`;
                        
                        // 设置文件类型
                        this.imgInfo.fileType = this.outputFormat.toUpperCase();
                        
                        // 设置文件大小
                        const fileSize = blob.size;
                        this.imgInfo.fileSize = this.formatFileSize(fileSize);
                        
                        // 计算大小比较
                        const originalSizeNum = this.parseFileSize(originalSize);
                        if (originalSizeNum > 0) {
                            const ratio = ((fileSize / originalSizeNum) * 100 - 100).toFixed(1);
                            this.imgInfo.comparison.ratio = Math.abs(ratio);
                            this.imgInfo.comparison.isIncrease = ratio > 0;
                        }
                    };
                    img.src = dataUrl;
                });
        },
        
        /**
         * 格式化文件大小
         */
        formatFileSize(bytes) {
            if (bytes === 0) return '0 KB';
            
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        /**
         * 解析文件大小字符串为字节数
         */
        parseFileSize(sizeStr) {
            if (!sizeStr || typeof sizeStr !== 'string') return 0;
            
            const parts = sizeStr.split(' ');
            if (parts.length !== 2) return 0;
            
            const size = parseFloat(parts[0]);
            const unit = parts[1];
            
            switch (unit) {
                case 'Bytes':
                    return size;
                case 'KB':
                    return size * 1024;
                case 'MB':
                    return size * 1024 * 1024;
                case 'GB':
                    return size * 1024 * 1024 * 1024;
                default:
                    return 0;
            }
        },
        
        /**
         * 显示文件大小警告
         */
        showFileSizeWarning: function(file, fileType) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            let warningMessage = '';
            
            const maxSizeLimit = '5MB';
            warningMessage = `您上传的SVG文件大小为 ${fileSizeMB}MB，超过了建议的最大大小 ${maxSizeLimit}。过大的文件可能导致浏览器性能问题或转换失败。是否继续处理？`;
            
            // 创建警告对话框容器
            const warningContainer = document.createElement('div');
            warningContainer.className = 'warning-dialog';
            warningContainer.style.position = 'fixed';
            warningContainer.style.top = '0';
            warningContainer.style.left = '0';
            warningContainer.style.width = '100%';
            warningContainer.style.height = '100%';
            warningContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            warningContainer.style.display = 'flex';
            warningContainer.style.justifyContent = 'center';
            warningContainer.style.alignItems = 'center';
            warningContainer.style.zIndex = '9999';
            
            // 创建对话框内容
            const dialogBox = document.createElement('div');
            dialogBox.className = 'warning-dialog-box';
            dialogBox.style.backgroundColor = '#fff';
            dialogBox.style.borderRadius = '8px';
            dialogBox.style.padding = '20px';
            dialogBox.style.maxWidth = '500px';
            dialogBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            
            // 创建标题
            const title = document.createElement('h3');
            title.textContent = '文件大小警告';
            title.style.color = '#e74c3c';
            title.style.marginTop = '0';
            
            // 创建警告内容
            const content = document.createElement('p');
            content.textContent = warningMessage;
            content.style.marginBottom = '20px';
            
            // 创建按钮容器
            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.justifyContent = 'flex-end';
            btnContainer.style.gap = '10px';
            
            // 取消按钮
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-cancel';
            cancelBtn.textContent = '取消';
            cancelBtn.style.padding = '8px 16px';
            cancelBtn.style.border = 'none';
            cancelBtn.style.borderRadius = '4px';
            cancelBtn.style.backgroundColor = '#e0e0e0';
            cancelBtn.style.cursor = 'pointer';
            cancelBtn.onclick = () => {
                document.body.removeChild(warningContainer);
                this.isProcessing = false;
                this.processingProgress = 0;
            };
            
            // 继续按钮
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn-continue';
            continueBtn.textContent = '继续处理';
            continueBtn.style.padding = '8px 16px';
            continueBtn.style.border = 'none';
            continueBtn.style.borderRadius = '4px';
            continueBtn.style.backgroundColor = '#3498db';
            continueBtn.style.color = '#fff';
            continueBtn.style.cursor = 'pointer';
            continueBtn.onclick = () => {
                document.body.removeChild(warningContainer);
                this.processSvgFile(file);
            };
            
            // 组装对话框
            btnContainer.appendChild(cancelBtn);
            btnContainer.appendChild(continueBtn);
            dialogBox.appendChild(title);
            dialogBox.appendChild(content);
            dialogBox.appendChild(btnContainer);
            warningContainer.appendChild(dialogBox);
            
            // 添加到页面
            document.body.appendChild(warningContainer);
            
            // 播放警告提示音
            this.playSound('warning');
        },
        
        /**
         * 播放提示音
         */
        playSound: function(type) {
            try {
                let soundUrl = '';
                
                if (type === 'error') {
                    soundUrl = chrome.runtime.getURL('static/audio/error.mp3');
                } else if (type === 'warning') {
                    soundUrl = chrome.runtime.getURL('static/audio/warning.mp3');
                } else if (type === 'success') {
                    soundUrl = chrome.runtime.getURL('static/audio/success.mp3');
                }
                
                if (soundUrl) {
                    const audio = new Audio(soundUrl);
                    audio.volume = 0.5;
                    audio.play().catch(e => console.warn('无法播放提示音:', e));
                }
            } catch (err) {
                console.warn('播放提示音失败:', err);
            }
        },
        
        /**
         * 统一错误处理方法
         * @param {Error|string} error - 错误对象或错误消息
         * @param {string} type - 错误类型 'svgConvert'|'imgConvert'
         * @param {Object} options - 额外选项
         */
        handleError(error, type, options = {}) {
            // 默认选项
            const defaultOptions = {
                isWarning: false,
                clearAfter: 0
            };
            
            // 合并选项
            const finalOptions = {...defaultOptions, ...options};
            
            // 获取错误消息
            const message = error instanceof Error ? error.message : error;
            
            // 根据类型设置错误消息
            if (type === 'svgConvert') {
                this.errorMsg = finalOptions.isWarning ? message : '转换失败: ' + message;
            } else {
                this.errorMsg = finalOptions.isWarning ? message : '转换失败: ' + message;
            }
            
            // 记录到控制台
            if (finalOptions.isWarning) {
                console.warn(message);
            } else {
                console.error(message);
            }
            
            // 关闭加载状态
            this.isProcessing = false;
            
            // 如果设置了自动清除
            if (finalOptions.clearAfter > 0) {
                setTimeout(() => {
                    this.errorMsg = '';
                }, finalOptions.clearAfter);
            }
        },
        
        /**
         * 处理SVG文件上传
         * @param {Event} event - 文件上传事件
         */
        uploadSvgFile(event) {
            if (event.target.files && event.target.files.length > 0) {
                const file = event.target.files[0];
                if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
                    this.processSvgFile(file);
                } else {
                    this.errorMsg = '请选择SVG格式的文件';
                }
                // 清空文件输入，确保可以重复上传相同文件
                event.target.value = '';
            }
        },
        
        /**
         * 处理图片文件上传
         * @param {Event} event - 文件上传事件
         */
        uploadImageFile(event) {
            if (event.target.files && event.target.files.length > 0) {
                const file = event.target.files[0];
                if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
                    this.processImageFile(file);
                } else {
                    this.imgError = '请选择非SVG格式的图片文件';
                }
                // 清空文件输入，确保可以重复上传相同文件
                event.target.value = '';
            }
        },
        
        /**
         * 更新SVG结果信息
         * @param {string} svg - 生成的SVG内容
         */
        updateSvgResultInfo(svg) {
            if (!svg) return;
            
            try {
                // 计算SVG大小
                const svgSize = new Blob([svg]).size;
                const formattedSvgSize = this.formatFileSize(svgSize);
                
                // 获取原始图片大小（如果有）
                let origImgSize = 0;
                if (this.originalImgSize) {
                    origImgSize = this.originalImgSize;
                } else if (this.originalImgBlob) {
                    origImgSize = this.originalImgBlob.size;
                }
                
                // 计算大小比较
                let sizeComparison = '';
                if (origImgSize > 0) {
                    const sizeRatio = (svgSize / origImgSize) * 100;
                    if (sizeRatio < 100) {
                        sizeComparison = `SVG比原图小 ${(100 - sizeRatio).toFixed(1)}%`;
                    } else if (sizeRatio > 100) {
                        sizeComparison = `SVG比原图大 ${(sizeRatio - 100).toFixed(1)}%`;
                    } else {
                        sizeComparison = '文件大小相同';
                    }
                }
                
                // 从SVG中提取宽度和高度
                let width = 0;
                let height = 0;
                
                // 提取width和height属性
                const widthMatch = svg.match(/width="([^"]+)"/);
                const heightMatch = svg.match(/height="([^"]+)"/);
                
                if (widthMatch && heightMatch) {
                    width = parseInt(widthMatch[1], 10);
                    height = parseInt(heightMatch[1], 10);
                } else {
                    // 尝试从viewBox提取尺寸
                    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
                    if (viewBoxMatch) {
                        const viewBoxParts = viewBoxMatch[1].split(/\s+/);
                        if (viewBoxParts.length === 4) {
                            width = parseInt(viewBoxParts[2], 10);
                            height = parseInt(viewBoxParts[3], 10);
                        }
                    }
                }
                
                // 更新SVG信息
                this.svgInfo = {
                    size: formattedSvgSize,
                    originalSize: this.formatFileSize(origImgSize),
                    sizeComparison: sizeComparison,
                    dimensions: width && height ? `${width} × ${height}` : '未知'
                };
            } catch (e) {
                console.error('更新SVG信息出错:', e);
                this.svgInfo = {
                    size: this.formatFileSize(new Blob([svg]).size),
                    dimensions: '解析出错'
                };
            }
        }
    }
});