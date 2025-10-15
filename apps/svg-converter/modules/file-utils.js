/**
 * 文件处理工具类
 * 提供文件读取、下载等通用功能
 */
(function(window) {
    'use strict';

    class FileUtils {
        /**
         * 读取文件内容为DataURL
         * @param {File} file - 要读取的文件对象
         * @param {Function} callback - 回调函数，接收读取的数据
         */
        static readAsDataURL(file, callback) {
            const reader = new FileReader();
            reader.onload = function(e) {
                callback(e.target.result);
            };
            reader.onerror = function(e) {
                console.error('文件读取失败:', e);
                callback(null, e);
            };
            reader.readAsDataURL(file);
        }

        /**
         * 读取文件内容为文本
         * @param {File} file - 要读取的文件对象
         * @param {Function} callback - 回调函数，接收读取的文本
         */
        static readAsText(file, callback) {
            const reader = new FileReader();
            reader.onload = function(e) {
                callback(e.target.result);
            };
            reader.onerror = function(e) {
                console.error('文件读取失败:', e);
                callback(null, e);
            };
            reader.readAsText(file);
        }

        /**
         * 下载数据为文件
         * @param {string} content - 要下载的内容
         * @param {string} fileName - 文件名
         * @param {string} mimeType - MIME类型
         */
        static download(content, fileName, mimeType) {
            // 创建blob对象
            const blob = new Blob([content], { type: mimeType });
            
            // 创建用于下载的元素
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            
            // 触发点击
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
            }, 100);
        }

        /**
         * 下载DataURL为文件
         * @param {string} dataUrl - 数据URL
         * @param {string} fileName - 文件名
         */
        static downloadDataURL(dataUrl, fileName) {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = fileName;
            
            // 触发点击
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
        }

        /**
         * 从URL获取文件名
         * @param {string} url - URL
         * @returns {string} 文件名
         */
        static getFileNameFromUrl(url) {
            try {
                const urlObj = new URL(url);
                const pathSegments = urlObj.pathname.split('/');
                return pathSegments[pathSegments.length - 1] || 'downloaded-file';
            } catch (e) {
                return 'downloaded-file';
            }
        }

        /**
         * 格式化字节大小为可读的字符串
         * @param {number} bytes - 字节数
         * @returns {string} 格式化后的字符串
         */
        static formatFileSize(bytes) {
            if (isNaN(bytes)) {
                return '未知大小';
            }
            
            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            let unitIndex = 0;
            let size = bytes;
            
            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }
            
            return size.toFixed(2) + ' ' + units[unitIndex];
        }
    }

    window.FileUtils = FileUtils;
})(window); 