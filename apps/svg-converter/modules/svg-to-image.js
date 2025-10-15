/**
 * SVG到图片转换工具
 * 负责将SVG转换为PNG、JPEG等格式
 */
(function(window) {
    'use strict';

    class SvgToImage {
        /**
         * 将SVG转换为图像
         * @param {string} svgText - SVG文本内容或者dataURI
         * @param {number} width - 输出图像宽度
         * @param {number} height - 输出图像高度
         * @param {string} format - 输出格式 (png, jpeg, webp)
         * @param {Function} callback - 回调函数，接收数据URL
         */
        static convert(svgText, width, height, format, callback) {
            // 判断是否为SVG Data URI
            let svgContent = svgText;
            if (svgText.startsWith('data:image/svg+xml;')) {
                try {
                    // 从Data URI中提取SVG内容
                    const base64Part = svgText.split(',')[1];
                    svgContent = this._decodeBase64(base64Part);
                } catch (e) {
                    console.error('解析SVG Data URI失败:', e);
                    callback(null, new Error('解析SVG Data URI失败'));
                    return;
                }
            }

            // 创建SVG的安全Blob URL
            try {
                const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);

                // 创建图像元素加载SVG
                const img = new Image();
                img.onload = function() {
                    // SVG加载完成后，在Canvas上绘制
                    const canvas = document.createElement('canvas');
                    
                    // 设置Canvas尺寸
                    canvas.width = width || img.width;
                    canvas.height = height || img.height;
                    
                    const ctx = canvas.getContext('2d');
                    
                    // 绘制白色背景（针对JPEG和WEBP格式，因为它们不支持透明度）
                    if (format === 'jpeg' || format === 'webp') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    // 绘制SVG
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // 释放Blob URL
                    URL.revokeObjectURL(svgUrl);
                    
                    // 转换为data URL并返回
                    let mimeType;
                    switch (format) {
                        case 'jpeg':
                            mimeType = 'image/jpeg';
                            break;
                        case 'webp':
                            mimeType = 'image/webp';
                            break;
                        case 'png':
                        default:
                            mimeType = 'image/png';
                            break;
                    }
                    
                    const dataURL = canvas.toDataURL(mimeType, 0.95);
                    callback(dataURL);
                };
                
                img.onerror = function(err) {
                    URL.revokeObjectURL(svgUrl);
                    console.error('SVG加载失败:', err);
                    callback(null, new Error('SVG加载失败'));
                };
                
                img.src = svgUrl;
            } catch (e) {
                console.error('创建SVG Blob失败:', e);
                callback(null, new Error('创建SVG Blob失败'));
            }
        }

        /**
         * 从SVG的Data URI中提取尺寸信息
         * @param {string} svgDataURI - SVG的Data URI
         * @returns {Object} 包含width和height的对象
         */
        static getSvgDimensions(svgDataURI) {
            try {
                let svgContent;
                if (svgDataURI.startsWith('data:image/svg+xml;')) {
                    const base64Part = svgDataURI.split(',')[1];
                    svgContent = this._decodeBase64(base64Part);
                } else {
                    svgContent = svgDataURI;
                }
                
                // 使用正则表达式提取宽度和高度
                const widthMatch = svgContent.match(/width="([^"]+)"/);
                const heightMatch = svgContent.match(/height="([^"]+)"/);
                
                // 如果找不到特定属性，尝试从viewBox中提取
                if (!widthMatch || !heightMatch) {
                    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
                    if (viewBoxMatch) {
                        const viewBox = viewBoxMatch[1].split(' ');
                        if (viewBox.length >= 4) {
                            return {
                                width: parseFloat(viewBox[2]),
                                height: parseFloat(viewBox[3])
                            };
                        }
                    }
                }
                
                return {
                    width: widthMatch ? parseFloat(widthMatch[1]) : 300,
                    height: heightMatch ? parseFloat(heightMatch[1]) : 150
                };
            } catch (e) {
                console.error('解析SVG尺寸失败:', e);
                return { width: 300, height: 150 }; // 默认尺寸
            }
        }

        /**
         * 安全地解码Base64编码的SVG内容
         * @param {string} base64String - Base64编码的字符串
         * @returns {string} 解码后的SVG内容
         * @private
         */
        static _decodeBase64(base64String) {
            try {
                return atob(base64String);
            } catch (e) {
                // 如果解码失败，尝试URL解码后再解码
                return atob(decodeURIComponent(base64String));
            }
        }
    }

    window.SvgToImage = SvgToImage;
})(window); 