/**
 * 加载指示器助手
 * 解决CSP安全策略问题，将内联脚本提取到外部文件
 */

// 为了确保加载指示器始终可用，添加一个全局函数
window.showLoading = function(message) {
    // 尝试使用Vue的方式
    try {
        if (window.vueApp && window.vueApp.isProcessing !== undefined) {
            window.vueApp.isProcessing = true;
            window.vueApp.processingMessage = message || '正在处理，请稍候...';
        } else {
            throw new Error('Vue实例不可用');
        }
    } catch (e) {
        // 如果Vue方式失败，使用静态指示器
        var loadingEl = document.getElementById('static-loading');
        var messageEl = document.getElementById('static-loading-message');
        if (messageEl) messageEl.textContent = message || '正在处理，请稍候...';
        if (loadingEl) loadingEl.style.display = 'flex';
    }
};

window.hideLoading = function() {
    // 尝试使用Vue的方式
    try {
        if (window.vueApp && window.vueApp.isProcessing !== undefined) {
            window.vueApp.isProcessing = false;
        } else {
            throw new Error('Vue实例不可用');
        }
    } catch (e) {
        // 如果Vue方式失败，使用静态指示器
        var loadingEl = document.getElementById('static-loading');
        if (loadingEl) loadingEl.style.display = 'none';
    }
};

// 暴露Vue实例到全局，以便于调试和访问
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        try {
            var vueInstance = document.getElementById('pageContainer').__vue__;
            if (vueInstance) {
                window.vueApp = vueInstance;
            }
        } catch (e) {
            console.warn('无法获取Vue实例:', e);
        }
    }, 500);
}); 