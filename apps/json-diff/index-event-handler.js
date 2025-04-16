/**
 * 事件处理器
 * 用于处理所有示例数据的点击事件
 */
(function() {
    window.addEventListener('DOMContentLoaded', function() {
        // 获取所有示例按钮并绑定事件
        document.querySelectorAll('.example-button').forEach(function(button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const exampleType = this.getAttribute('data-example');
                if (window.vueApp && typeof window.vueApp.fillExample === 'function') {
                    window.vueApp.fillExample(exampleType);
                }
            });
        });
    });
})(); 