/**
 * FeHelper Full Page Capture
 * @author FeHelper
 * @version 1.0.1
 */
window.screenshotContentScript = function () {
    // 存储截图数据的数组
    let screenshots = [];
    // 定义最大尺寸限制常量
    const MAX_PRIMARY_DIMENSION = 50000 * 2,
        MAX_SECONDARY_DIMENSION = 20000 * 2,
        MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;
    // 保存原始页面标题
    const pageOriginalTitle = document.title;
    // 是否正在截图中
    let isCapturing = false;
    // 取消截图的标志
    let isCancelled = false;

    // 定义全局变量以存储原始滚动位置
    let originalScrollLeft = 0;
    let originalScrollTop = 0;

    /**
     * URL合法性校验
     * @param {string} url - 要检查的URL
     * @returns {boolean} - URL是否合法
     */
    function isValidUrl(url) {
        // 允许的URL模式
        const matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'];
        // 不允许的URL模式
        const noMatches = [/^https?:\/\/chrome\.google\.com\/.*$/];

        // 先检查不允许的URL
        for (let i = 0; i < noMatches.length; i++) {
            if (noMatches[i].test(url)) {
                return false;
            }
        }
        
        // 再检查允许的URL
        for (let i = 0; i < matches.length; i++) {
            const pattern = matches[i].replace(/\*/g, '.*');
            const regex = new RegExp('^' + pattern + '$');
            if (regex.test(url)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 释放canvas资源
     * @param {Array} canvasList - 要释放的canvas列表
     */
    function releaseCanvasResources(canvasList) {
        if (!canvasList || !canvasList.length) return;
        
        canvasList.forEach(item => {
            if (item.ctx) {
                item.ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
            }
            if (item.canvas) {
                item.canvas.width = 0;
                item.canvas.height = 0;
            }
        });
    }

    /**
     * 初始化截图canvas
     * @param {number} totalWidth - 总宽度
     * @param {number} totalHeight - 总高度
     * @returns {Array} - 初始化的canvas数组
     * @private
     */
    function _initScreenshots(totalWidth, totalHeight) {
        // 检查尺寸是否超过限制
        const badSize = (totalHeight > MAX_PRIMARY_DIMENSION ||
            totalWidth > MAX_PRIMARY_DIMENSION ||
            totalHeight * totalWidth > MAX_AREA);
        const biggerWidth = totalWidth > totalHeight;
        
        // 计算每个分块的最大尺寸
        const maxWidth = (!badSize ? totalWidth :
            (biggerWidth ? MAX_PRIMARY_DIMENSION : MAX_SECONDARY_DIMENSION));
        const maxHeight = (!badSize ? totalHeight :
            (biggerWidth ? MAX_SECONDARY_DIMENSION : MAX_PRIMARY_DIMENSION));
        
        // 计算分块数量
        const numCols = Math.ceil(totalWidth / maxWidth);
        const numRows = Math.ceil(totalHeight / maxHeight);
        
        // 创建结果数组
        const result = [];
        let canvasIndex = 0;

        // 创建所有需要的canvas
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const canvas = document.createElement('canvas');
                canvas.width = (col === numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth);
                canvas.height = (row === numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight);

                const left = col * maxWidth;
                const top = row * maxHeight;

                result.push({
                    canvas: canvas,
                    ctx: canvas.getContext('2d'),
                    index: canvasIndex,
                    left: left,
                    right: left + canvas.width,
                    top: top,
                    bottom: top + canvas.height
                });

                canvasIndex++;
            }
        }

        return result;
    }

    /**
     * 从截屏中筛选有效数据
     * @param {number} imgLeft - 图像左边界
     * @param {number} imgTop - 图像上边界
     * @param {number} imgWidth - 图像宽度
     * @param {number} imgHeight - 图像高度
     * @param {Array} screenshotList - 截图列表
     * @returns {Array} - 筛选后的截图列表
     * @private
     */
    function _filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshotList) {
        // 计算图像边界
        const imgRight = imgLeft + imgWidth;
        const imgBottom = imgTop + imgHeight;
        
        // 筛选与当前区域重叠的截图
        return screenshotList.filter(screenshot => 
            imgLeft < screenshot.right &&
            imgRight > screenshot.left &&
            imgTop < screenshot.bottom &&
            imgBottom > screenshot.top
        );
    }

    /**
     * 添加截图到canvas
     * @param {Object} data - 截图数据
     * @param {string} uri - 图片URI
     */
    function addScreenShot(data, uri) {
        // 如果已取消截图，不处理
        if (isCancelled) return;
        
        const image = new Image();
        
        // 图片加载错误处理
        image.onerror = function() {
            captureConfig.fail('图片加载失败');
            releaseResources();
        };

        image.onload = function() {
            try {
                data.image = {width: image.width, height: image.height};

                // 调整缩放比例
                if (data.windowWidth !== image.width) {
                    const scale = image.width / data.windowWidth;
                    data.x *= scale;
                    data.y *= scale;
                    data.totalWidth *= scale;
                    data.totalHeight *= scale;
                }

                // 如果是第一张截图，初始化canvas
                if (!screenshots.length) {
                    screenshots = _initScreenshots(data.totalWidth, data.totalHeight);
                }

                // 获取与当前区域重叠的canvas并绘制图像
                const matchingScreenshots = _filterScreenshots(
                    data.x, data.y, image.width, image.height, screenshots
                );
                
                matchingScreenshots.forEach(screenshot => {
                    screenshot.ctx.drawImage(
                        image,
                        data.x - screenshot.left,
                        data.y - screenshot.top
                    );
                });

                // 如果是最后一步，调用成功回调
                if (data.complete === 1) {
                    captureConfig.success(data);
                    isCapturing = false;
                }
            } catch (e) {
                captureConfig.fail('处理截图时出错: ' + e.message);
                releaseResources();
            }
        };
        
        // 设置图片源
        image.src = uri;
    }

    /**
     * 释放所有资源
     */
    function releaseResources() {
        releaseCanvasResources(screenshots);
        screenshots = [];
        isCapturing = false;
        isCancelled = false;
    }

    /**
     * 创建截图进度UI
     * @param {string} [text='正在截取网页...'] 显示的文本
     * @returns {HTMLElement} 创建的进度UI元素
     */
    function createProgressUI(text = '正在截取网页...') {
        // 先检查是否已存在
        let progressContainer = document.getElementById('fehelper-screenshot-progress');
        if (progressContainer) {
            progressContainer.querySelector('.fh-progress-text').textContent = text;
            progressContainer.style.display = 'flex';
            return progressContainer;
        }

        // 创建进度UI容器
        progressContainer = document.createElement('div');
        progressContainer.id = 'fehelper-screenshot-progress';
        progressContainer.setAttribute('data-fh-ui', 'true');
        progressContainer.className = 'fehelper-ui-element';
        progressContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000000;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            width: 300px;
        `;

        // 创建文本元素
        const textElement = document.createElement('div');
        textElement.className = 'fh-progress-text';
        textElement.textContent = text;
        textElement.style.cssText = 'margin-bottom: 10px; width: 100%; text-align: center;';
        progressContainer.appendChild(textElement);

        // 创建进度条容器
        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.cssText = `
            width: 100%;
            height: 10px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            overflow: hidden;
            margin-bottom: 10px;
        `;
        progressContainer.appendChild(progressBarContainer);

        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.className = 'fh-progress-bar';
        progressBar.style.cssText = `
            height: 100%;
            width: 0%;
            background-color: #4CAF50;
            border-radius: 5px;
            transition: width 0.3s;
        `;
        progressBarContainer.appendChild(progressBar);

        // 创建百分比文本
        const percentText = document.createElement('div');
        percentText.className = 'fh-progress-percent';
        percentText.textContent = '0%';
        percentText.style.cssText = 'margin-bottom: 10px; font-size: 12px;';
        progressContainer.appendChild(percentText);

        // 创建取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.className = 'fh-progress-cancel';
        cancelButton.style.cssText = `
            background-color: #f44336;
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        `;
        cancelButton.onclick = () => {
            if (window._fh_screenshot_cancel_callback && typeof window._fh_screenshot_cancel_callback === 'function') {
                window._fh_screenshot_cancel_callback();
            }
            progressContainer.style.display = 'none';
        };
        progressContainer.appendChild(cancelButton);

        document.body.appendChild(progressContainer);
        return progressContainer;
    }
    
    /**
     * 更新截图进度UI
     * @param {number} percent 进度百分比(0-1)
     * @param {string} [text] 可选的文本更新
     */
    function updateProgressUI(percent, text) {
        const progressContainer = document.getElementById('fehelper-screenshot-progress');
        if (!progressContainer) return;

        const progressBar = progressContainer.querySelector('.fh-progress-bar');
        const percentText = progressContainer.querySelector('.fh-progress-percent');
        
        if (progressBar) {
            const percentage = Math.min(Math.max(percent * 100, 0), 100);
            progressBar.style.width = `${percentage}%`;
        }
        
        if (percentText) {
            percentText.textContent = `${Math.round(percent * 100)}%`;
        }

        if (text) {
            const textElement = progressContainer.querySelector('.fh-progress-text');
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }
    
    /**
     * 取消截图操作
     */
    function cancelCapture() {
        if (isCapturing) {
            isCancelled = true;
            isCapturing = false;
            
            // 移除进度UI
            const progressContainer = document.getElementById('fehelper-screenshot-progress');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
            
            // 恢复原始状态
            cleanup && typeof cleanup === 'function' && cleanup();
            
            return true;
        }
        return false;
    }

    /**
     * 隐藏所有FeHelper UI元素
     * 隐藏所有带有 fehelper-ui-element 类或 data-fh-ui 属性的元素
     * @returns {Object} 隐藏元素的原始显示状态
     */
    function hideFeHelperUI() {
        const uiElements = document.querySelectorAll('.fehelper-ui-element, [data-fh-ui="true"]');
        const originalDisplays = {};

        uiElements.forEach((element, index) => {
            // Ensure unique ID for lookup later
            if (!element.id) {
                // Assign a temporary, identifiable ID
                element.id = `fh-temp-id-${Math.random().toString(36).substring(2, 9)}`;
            }
            const id = element.id;
            originalDisplays[id] = element.style.display;
            element.style.display = 'none';
        });

        window._fh_original_displays = originalDisplays; // Store globally
        return originalDisplays; // Keep return for compatibility if needed elsewhere
    }
    
    /**
     * 显示所有FeHelper UI元素
     * 恢复所有带有 fehelper-ui-element 类或 data-fh-ui 属性的元素的显示状态
     * @param {Object} originalDisplays 原始显示状态对象
     */
    function showFeHelperUI(originalDisplays) { // Accept argument
        originalDisplays = originalDisplays || window._fh_original_displays || {}; // Use passed or global
        const uiElements = document.querySelectorAll('.fehelper-ui-element, [data-fh-ui="true"]');

        uiElements.forEach((element) => {
            const id = element.id;
            if (id && id in originalDisplays) {
                element.style.display = originalDisplays[id];
            } else {
                // Default restoration if ID mismatch or not found (less reliable)
                element.style.display = '';
            }
            // Remove temporary ID if added and it wasn't originally present
            if (id && id.startsWith('fh-temp-id-') && !(id in (window._fh_original_displays || {}))) {
                 element.removeAttribute('id');
            }
        });
    }

    /**
     * 隐藏固定定位和粘性定位的元素
     * @returns {Array} 被隐藏元素的原始样式信息，用于恢复
     */
    function hideFixedElements() {
        const fixedElements = [];
        
        // 查找所有fixed和sticky定位的元素
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style && (style.position === 'fixed' || style.position === 'sticky')) {
                // 排除FeHelper自己的UI元素
                if (el.classList.contains('fehelper-ui-element') || 
                    el.hasAttribute('data-fh-ui') || 
                    el.id === 'fehelper-screenshot-progress' ||
                    el.closest('#fehelper_screenshot_container')) {
                    return;
                }
                
                // 保存原始样式
                fixedElements.push({
                    element: el,
                    originalDisplay: el.style.display,
                    originalVisibility: el.style.visibility,
                    originalOpacity: el.style.opacity
                });
                
                // 隐藏元素
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
            }
        });
        
        window._fh_fixed_elements = fixedElements;
        return fixedElements;
    }

    /**
     * 恢复之前隐藏的固定定位和粘性定位元素
     */
    function showFixedElements() {
        const fixedElements = window._fh_fixed_elements || [];

        fixedElements.forEach(item => {
            const el = item.element;
            if (el) {
                // 恢复原始样式 - 修正：恢复 visibility 和 opacity
                el.style.visibility = item.originalVisibility !== undefined ? item.originalVisibility : '';
                el.style.opacity = item.originalOpacity !== undefined ? item.originalOpacity : '';
                // Display 属性通常不需要在隐藏/显示 fixed 元素时修改，注释掉以防干扰
                // if (item.originalDisplay !== undefined) {
                //     el.style.display = item.originalDisplay;
                // }
            }
        });

        window._fh_fixed_elements = null; // 清理存储的元素
    }

    // 定义全局的 cleanup 函数
    function cleanup() {
        // 恢复滚动位置
        window.scrollTo(originalScrollLeft, originalScrollTop);

        // 恢复UI显示 - 传递存储的原始状态
        showFeHelperUI(window._fh_original_displays || {});
        showFixedElements();

        // 隐藏进度UI
        const progressContainer = document.getElementById('fehelper-screenshot-progress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }

        // 重新显示工具条
        const screenshotContainer = document.getElementById('fehelper_screenshot_container');
        if (screenshotContainer) {
            screenshotContainer.style.display = 'block';
        }

        window._fh_screenshot_in_progress = false;
        window._fh_screenshot_cancel_callback = null;
        window._fh_fixed_elements = null; // Clear fixed elements cache
        window._fh_original_displays = null; // Clear UI display cache
    }

    // 配置项
    const captureConfig = {
        // 成功回调
        success: function(data) {
            try {
                // 构造正确的数据格式
                const screenshotData = {
                    filename: buildFilenameFromUrl(),
                    screenshots: screenshots.map(ss => {
                        // 确保使用toDataURL生成png格式的图像
                        const dataUri = ss.canvas.toDataURL('image/png');
                        
                        return {
                            dataUri: dataUri,  // 保持与showResult函数期望的属性名一致
                            index: ss.index,
                            row: Math.floor(ss.top / (ss.bottom - ss.top || 1)), 
                            col: Math.floor(ss.left / (ss.right - ss.left || 1)),
                            left: ss.left,
                            top: ss.top,
                            right: ss.right,
                            bottom: ss.bottom,
                            width: ss.right - ss.left,
                            height: ss.bottom - ss.top
                        };
                    }),
                    totalWidth: data.totalWidth,
                    totalHeight: data.totalHeight
                };
                
                // 使用正确的消息类型和thing
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'page-screenshot-done',
                    params: screenshotData
                }, function(response) {
                    // 恢复页面标题并移除进度条
                    document.title = pageOriginalTitle;
                    const progressBar = document.getElementById('fehelper_screenshot_progress');
                    if (progressBar) {
                        progressBar.remove();
                    }
                    
                    // 释放资源
                    setTimeout(() => {
                        releaseResources();
                    }, 1000);
                });
            } catch (e) {
                captureConfig.fail('处理截图结果时出错: ' + e.message);
            }
        },

        // 失败回调
        fail: function(reason) {
            // 恢复页面标题
            document.title = pageOriginalTitle;
            
            // 移除进度条
            const progressBar = document.getElementById('fehelper_screenshot_progress');
            if (progressBar) {
                progressBar.remove();
            }
            
            // 显示错误消息
            const errorMsg = reason && reason.message || reason || '截图失败，请刷新页面重试!';
            
            // 创建错误提示UI
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position:fixed;left:20%;top:20%;right:20%;z-index:1000001;padding:20px;background:rgba(255,0,0,0.7);color:#fff;text-align:center;border-radius:5px;';
            errorDiv.textContent = errorMsg;
            
            // 添加关闭按钮
            const closeButton = document.createElement('button');
            closeButton.textContent = '关闭';
            closeButton.style.cssText = 'margin-top:10px;padding:5px 15px;background:#fff;color:#000;border:none;border-radius:3px;cursor:pointer;';
            closeButton.onclick = function() { 
                errorDiv.remove(); 
            };
            
            errorDiv.appendChild(document.createElement('br'));
            errorDiv.appendChild(closeButton);
            document.body.appendChild(errorDiv);
            
            // 自动关闭
            setTimeout(() => {
                if (document.body.contains(errorDiv)) {
                    errorDiv.remove();
                }
            }, 5000);
            
            // 释放资源
            releaseResources();
        },

        // 进度回调
        progress: function(complete) {
            if (isCancelled) return false;
            
            // 更新进度条
            updateProgressUI(complete);
            
            // 更新页面标题
            const percent = parseInt(complete * 100, 10) + '%';
            document.title = `截图进度：${percent}...`;

            if (percent === '100%') {
                setTimeout(() => {
                    document.title = pageOriginalTitle;
                }, 800);
            }

            return true;
        }
    };

    /**
     * 计算数组中的最大值
     * @param {Array} nums - 数字数组
     * @returns {number} - 最大值
     */
    function max(nums) {
        return Math.max(...nums.filter(Boolean));
    }

    /**
     * 执行可视区域截图
     */
    async function captureVisible() {
        if (window._fh_screenshot_in_progress) {
            return;
        }
        
        window._fh_screenshot_in_progress = true;
        
        // 保存原始滚动位置
        originalScrollTop = window.scrollY || document.documentElement.scrollTop;
        originalScrollLeft = window.scrollX || document.documentElement.scrollLeft;
        
        // 隐藏工具条
        let screenshotContainer = document.getElementById('fehelper_screenshot_container');
        if (screenshotContainer) {
            screenshotContainer.style.display = 'none';
        }
        
        const progressUI = createProgressUI('正在截取可视区域...');
        
        window._fh_screenshot_cancel_callback = cleanup;
        
        // 隐藏干扰UI
        hideFeHelperUI();
        hideFixedElements();
        
        // 等待DOM更新
        setTimeout(() => {
            updateProgressUI(0.3, '正在截取可视区域...');
            
            // 从background.js导入MSG_TYPE不现实，这里直接使用特定值
            chrome.runtime.sendMessage({
                type: 'fh-screenshot-capture-visible'
            }, response => {
                if (response) {
                    // 加载截图并处理
                    const img = new Image();
                    img.onload = function() {
                        updateProgressUI(0.8, '正在处理截图...');
                        
                        // 创建与index.js中showResult函数期望的格式一致的数据
                        const screenshotData = {
                            filename: buildFilenameFromUrl(),
                            screenshots: [{
                                dataUri: response,
                                index: 0,
                                row: 0,
                                col: 0,
                                left: 0,
                                top: 0,
                                right: img.width,
                                bottom: img.height,
                                width: img.width,
                                height: img.height
                            }],
                            totalWidth: img.width,
                            totalHeight: img.height
                        };
                        
                        // 使用统一的消息格式发送数据，确保只发送一次
                        chrome.runtime.sendMessage({
                            type: 'fh-dynamic-any-thing',
                            thing: 'page-screenshot-done',
                            params: screenshotData
                        }, function(resp) {
                            updateProgressUI(1, '截图完成');
                            setTimeout(cleanup, 500);
                        });
                    };
                    
                    img.onerror = function(e) {
                        updateProgressUI(1, '截图加载失败');
                        setTimeout(cleanup, 500);
                    };
                    
                    img.src = response;
                    
                    // 如果图片加载时间过长，设置超时
                    setTimeout(() => {
                        if (!img.complete) {
                            cleanup();
                        }
                    }, 3000);
                } else {
                    const errorMessage = '截图失败，请刷新页面重试!';
                    updateProgressUI(1, '截图失败');
                    setTimeout(() => {
                        alert(errorMessage);
                        cleanup();
                    }, 500);
                }
            });
        }, 100);
    }

    /**
     * 执行全页面截图
     */
    async function captureFullPage() {
        if (window._fh_screenshot_in_progress) {
            return;
        }

        window._fh_screenshot_in_progress = true;
        window._fh_screenshot_canceled = false; // 重命名 cancel 标志以避免冲突

        // 保存原始滚动位置
        originalScrollTop = window.scrollY || document.documentElement.scrollTop;
        originalScrollLeft = window.scrollX || document.documentElement.scrollLeft;

        // 计算页面尺寸
        const pageWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
            document.documentElement.offsetWidth,
            document.body.offsetWidth
        );

        const pageHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.offsetHeight
        );

        // 获取视窗尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 使用视窗尺寸作为滚动步长，并计算大致步数用于UI显示
        const totalSteps = Math.ceil(pageHeight / windowHeight) * Math.ceil(pageWidth / windowWidth);

        // 隐藏工具条
        let screenshotContainer = document.getElementById('fehelper_screenshot_container');
        if (screenshotContainer) {
            screenshotContainer.style.display = 'none';
        }

        // 创建进度UI和取消回调
        const progressUI = createProgressUI(`正在截取全页面 (共${totalSteps}步)...`);
        window._fh_screenshot_cancel_callback = () => {
             window._fh_screenshot_canceled = true; // Set the cancel flag
             cleanup(); // Execute cleanup
        };

        // 隐藏其他干扰UI（但不隐藏固定元素）
        hideFeHelperUI(); // 保存原始UI状态

        // 创建存储截图数据的数组和已捕获位置的集合
        const screenshots = [];
        const capturedPositions = new Set();
        let currentStep = 0; // 用于进度显示

        // 使用异步函数和循环进行截图
        setTimeout(async () => {
            try {
                // 垂直滚动循环
                for (let y = 0; ; y += windowHeight) {
                    // 水平滚动循环
                    for (let x = 0; ; x += windowWidth) {
                        if (window._fh_screenshot_canceled) { cleanup(); return; }

                        // 计算目标滚动位置，限制在页面边界内
                        const targetX = Math.min(x, pageWidth - windowWidth);
                        const targetY = Math.min(y, pageHeight - windowHeight);

                        // 滚动到目标位置
                        window.scrollTo(targetX, targetY);

                        // 等待滚动和页面重绘完成
                        await new Promise(resolve => setTimeout(resolve, 300));

                        if (window._fh_screenshot_canceled) { cleanup(); return; }

                        // 获取滚动后的实际位置
                        const actualX = window.scrollX || document.documentElement.scrollLeft;
                        const actualY = window.scrollY || document.documentElement.scrollTop;
                        const posKey = `${actualX},${actualY}`;

                        // 如果这个精确位置已经截取过，则跳过
                        if (capturedPositions.has(posKey)) {
                            // 如果已到达水平末端，跳出内层循环
                            if (x >= pageWidth - windowWidth) break;
                            continue; // 继续内层循环的下一个x值
                        }
                        capturedPositions.add(posKey); // 记录新的已截取位置

                        // 判断是否为首屏（实际滚动位置为0,0）
                        const isFirstScreen = (actualX === 0 && actualY === 0);

                        // 非首屏时隐藏固定元素
                        if (!isFirstScreen) {
                            hideFixedElements();
                            // 等待隐藏生效
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }

                        currentStep++;
                        updateProgressUI(Math.min(0.9, currentStep / totalSteps), `正在截取第 ${currentStep}/${totalSteps} 部分...`);

                        // 执行截图API调用
                        let response;
                        try {
                            response = await new Promise((resolve, reject) => {
                                chrome.runtime.sendMessage({ type: 'fh-screenshot-capture-visible' }, res => {
                                    if (chrome.runtime.lastError) {
                                        reject(new Error(chrome.runtime.lastError.message || '截图通讯错误'));
                                    } else if (res) {
                                        resolve(res);
                                    } else {
                                        reject(new Error('截图失败，未收到数据'));
                                    }
                                });
                                // 添加超时处理
                                setTimeout(() => reject(new Error('截图超时')), 5000);
                            });
                        } catch (error) {
                             // 非首屏时尝试恢复固定元素
                             if (!isFirstScreen && window._fh_fixed_elements) {
                                 showFixedElements();
                             }
                             captureFailureHandler(error.message || '截图API调用失败');
                             return; // 中断截图流程
                        }


                        if (window._fh_screenshot_canceled) {
                            if (!isFirstScreen) showFixedElements(); // Make sure to show elements if cancelled here
                            cleanup();
                            return;
                        }

                        // 非首屏时恢复固定元素显示
                        if (!isFirstScreen) {
                            showFixedElements();
                        }

                        console.log(`截图成功 [${currentStep}]: 位置(${actualX},${actualY}), 数据长度: ${response.length}`);
                        screenshots.push({
                            dataUrl: response,
                            x: actualX,
                            y: actualY,
                            width: windowWidth, // 截图是基于视窗尺寸的
                            height: windowHeight,
                            // 保留 row/col 供可能的调试或兼容性需求，但去重和排序基于 x, y
                            row: Math.round(actualY / windowHeight),
                            col: Math.round(actualX / windowWidth)
                        });

                        // 如果当前水平位置已覆盖页面宽度，结束内层循环
                        if (x >= pageWidth - windowWidth) break;
                    } // 结束内层循环 (x)

                    // 如果当前垂直位置已覆盖页面高度，结束外层循环
                    if (y >= pageHeight - windowHeight) break;
                } // 结束外层循环 (y)

                // 所有截图完成后，滚动回页面顶部
                window.scrollTo(0, 0);
                await new Promise(resolve => setTimeout(resolve, 100)); // 等待滚动完成

                // 调用完成处理函数
                finishCapture(screenshots, pageWidth, pageHeight);

            } catch (error) {
                // 捕获循环中的意外错误
                captureFailureHandler(error.message || '截图过程中断');
            }

        }, 200); // 初始延迟，等待UI隐藏生效

        /**
         * 完成所有截图后处理 - 修改为接受参数
         * @param {Array} capturedScreenshots 捕获到的截图数组
         * @param {number} finalWidth 最终页面宽度
         * @param {number} finalHeight 最终页面高度
         */
        function finishCapture(capturedScreenshots, finalWidth, finalHeight) {
            if (window._fh_screenshot_canceled) {
                 return; // 如果在 finishCapture 前取消，则不继续
            }
            updateProgressUI(0.95, '正在处理截图...');

            if (!capturedScreenshots || capturedScreenshots.length === 0) {
                updateProgressUI(1, '截图失败: 没有截取到任何内容');
                setTimeout(cleanup, 1000);
                return;
            }

            console.log(`处理截图，共 ${capturedScreenshots.length} 张，页面尺寸: ${finalWidth}x${finalHeight}`);

            // 基于精确的捕获滚动坐标 (x, y) 进行去重
            const screenshotMap = new Map();
            capturedScreenshots.forEach(ss => {
                const key = `${ss.x},${ss.y}`;
                if (!screenshotMap.has(key)) {
                    screenshotMap.set(key, ss);
                } else {
                    console.log(`发现重复精确位置的截图: (${ss.x},${ss.y})，保留第一个`);
                }
            });

            // 将 Map 转换回数组，并按 Y 坐标优先，然后 X 坐标排序
            const uniqueScreenshots = Array.from(screenshotMap.values()).sort((a, b) => {
                if (a.y !== b.y) return a.y - b.y;
                return a.x - b.x;
            });

            console.log(`去重后共 ${uniqueScreenshots.length} 张有效截图（原 ${capturedScreenshots.length} 张）`);

            // 准备发送到后台的数据格式
            let mappedScreenshots = uniqueScreenshots.map((ss, index) => ({
                dataUri: ss.dataUrl, // 确保属性名是 dataUri
                x: ss.x,
                y: ss.y,
                width: ss.width, // 使用捕获时的视窗尺寸
                height: ss.height,
                index: index, // 添加索引供后台使用
                // 添加兼容性字段（如果后台拼接逻辑需要）
                row: ss.row,
                col: ss.col,
                left: ss.x,
                top: ss.y,
                right: ss.x + ss.width,
                bottom: ss.y + ss.height
            }));

            console.log('准备发送所有截图分片到后台:', {
                screenshots: mappedScreenshots.length,
                pageWidth: finalWidth,
                pageHeight: finalHeight
            });

            const screenshotData = {
                filename: buildFilenameFromUrl(),
                screenshots: mappedScreenshots,
                totalWidth: finalWidth,
                totalHeight: finalHeight
            };

            // 发送消息到后台处理
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'page-screenshot-done',
                params: screenshotData
            }, function(resp) {
                if (chrome.runtime.lastError) {
                     updateProgressUI(1, '发送结果失败');
                } else {
                     updateProgressUI(1, '截图完成');
                }
                // 确保滚动位置在 cleanup 前恢复
                window.scrollTo(originalScrollLeft, originalScrollTop);
                setTimeout(cleanup, 500);
            });
        }
    }

    /**
     * 执行截图操作
     * @param {Object} params
     * @param {String} params.captureType 截图类型：'visible'或'whole'
     */
    function goCapture(params) {
        // 如果正在截图中，则忽略新的请求
        if (isCapturing) {
            return;
        }

        // 如果不是http/https，就不处理
        if (!isValidUrl(location.href)) {
            alert('截图功能仅支持HTTP/HTTPS协议的网页！');
            return;
        }

        isCapturing = true;
        isCancelled = false;
        
 // console.log('开始执行截图，模式：' + params.captureType);
        
        // 根据截图模式执行不同的操作
        if (params.captureType === 'visible') {
            captureVisible()
                .then(result => {
                    if (result && result.success) {
                        // console.log('可视区域截图完成');
                    }
                })
                .catch(error => {
                    // console.error('截图失败:', error);
                    alert('截图失败: ' + (error.message || '未知错误'));
                })
                .finally(() => {
                    // 确保截图状态重置
                    isCapturing = false;
                    
                    // 确保进度UI被移除
                    const progressUI = document.getElementById('fehelper_screenshot_progress');
                    if (progressUI) {
                        progressUI.remove();
                    }
                });
        } else {
            captureFullPage()
                .then(result => {
                    if (result && result.success) {
                        // console.log('全页面截图完成');
                    }
                })
                .catch(error => {
                    // console.error('截图失败:', error);
                    alert('截图失败: ' + (error.message || '未知错误'));
                })
                .finally(() => {
                    // 确保截图状态重置
                    isCapturing = false;
                    
                    // 确保进度UI被移除
                    const progressUI = document.getElementById('fehelper_screenshot_progress');
                    if (progressUI) {
                        progressUI.remove();
                    }
                });
        }
    }

    /**
     * 创建截图选择UI
     */
    window.screenshotNoPage = function() {
        // console.log('FeHelper: 截图工具触发');
        // 如果正在截图，不创建新UI
        if (isCapturing) {
            alert('正在截图中，请等待当前操作完成');
            return;
        }
        
        try {
            // 先检查是否已存在截图UI
            const existingUI = document.getElementById('fehelper_screenshot');
            if (existingUI) {
                existingUI.remove();
            }
            
            // 创建一个独立的div作为容器
            const container = document.createElement('div');
            container.id = 'fehelper_screenshot_container';
            container.className = 'fehelper-ui-element'; // 添加类名，便于统一隐藏
            container.style.cssText = 'position:fixed;left:0;top:0;right:0;z-index:10000000;';
            
            // 设置内部HTML
            container.innerHTML = `
                <div id="fehelper_screenshot" style="position:fixed;left:0;top:0;right:0;z-index:1000000;padding:15px;background:rgba(0,0,0,0.8);color:#fff;text-align:center;">
                    <h3 style="margin:0 0 10px 0;font-size:16px;">FeHelper 网页截图工具</h3>
                    <button id="btnVisible" style="margin:0 10px;padding:8px 15px;border-radius:4px;border:none;background:#4CAF50;color:#fff;cursor:pointer;font-size:14px;">可视区域截图</button>
                    <button id="btnWhole" style="margin:0 10px;padding:8px 15px;border-radius:4px;border:none;background:#2196F3;color:#fff;cursor:pointer;font-size:14px;">全网页截图</button>
                    <button id="btnClose" style="margin:0 10px;padding:8px 15px;border-radius:4px;border:none;background:#f44336;color:#fff;cursor:pointer;font-size:14px;">关闭</button>
                </div>
            `;
            
            // 确保DOM已准备好
            if (!document.body) {
                // console.error('FeHelper截图：document.body不存在，无法添加截图UI');
                // 尝试等待DOM加载完成
                const checkBodyInterval = setInterval(() => {
                    if (document.body) {
                        clearInterval(checkBodyInterval);
                        document.body.appendChild(container);
                        bindEvents(container);
                    }
                }, 100);
                
                // 超时处理
                setTimeout(() => {
                    clearInterval(checkBodyInterval);
                    alert('页面DOM未准备好，无法启动截图工具');
                }, 5000);
                
                return;
            }
            
            // 添加到document.body
            document.body.appendChild(container);
            
            // 绑定事件
            bindEvents(container);
            
            // console.log('FeHelper截图UI已添加到页面');
            
        } catch (error) {
            // console.error('FeHelper截图UI创建失败：', error);
            alert('截图工具启动失败：' + error.message);
        }
    };
    
    /**
     * 绑定截图UI的事件
     */
    function bindEvents(container) {
        const btnVisible = document.getElementById('btnVisible');
        const btnWhole = document.getElementById('btnWhole');
        const btnClose = document.getElementById('btnClose');
        
        if (btnVisible) {
            btnVisible.onclick = function() {
                container.remove();
                goCapture({captureType: 'visible'});
            };
        }
        
        if (btnWhole) {
            btnWhole.onclick = function() {
                container.remove();
                goCapture({captureType: 'whole'});
            };
        }
        
        if (btnClose) {
            btnClose.onclick = function() {
                container.remove();
            };
        }
        
        // 添加自动关闭
        setTimeout(() => {
            if (container && document.body.contains(container)) {
                container.remove();
            }
        }, 30000);
    }

    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        // ESC键取消截图
        if (e.key === 'Escape' && isCapturing) {
            cancelCapture();
        }
    });
    
    // 添加消息监听，支持通过消息触发截图功能
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === 'fh-screenshot-start') {
            // console.log('FeHelper: 收到截图请求');
            window.screenshotNoPage();
            sendResponse({success: true});
            return true;
        }
    });
    
    // 初始化
    // console.log('FeHelper: 截图功能已加载');

    /**
     * 根据网页URL生成默认文件名
     * @returns {string} - 生成的文件名
     */
    function buildFilenameFromUrl() {
        let name = location.href.split('?')[0].split('#')[0];
        if (name) {
            name = name
                .replace(/^https?:\/\//, '')
                .replace(/[^A-z0-9]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^[_\-]+/, '')
                .replace(/[_\-]+$/, '');
            name = '-' + name;
        } else {
            name = '';
        }
        return 'fehelper' + name + '-' + Date.now() + '.png';
    }

    // 在截图失败的回调中，确保错误信息被正确记录，并释放资源
    function captureFailureHandler(reason) {
        // console.error('截图失败:', reason);
        updateProgressUI(1, '截图失败');
        setTimeout(() => {
            const errorMsg = reason && reason.message || reason || '截图失败，请刷新页面重试!';
            alert(errorMsg);
            cleanup();
        }, 500);
    }
};
