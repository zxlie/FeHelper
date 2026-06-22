(function () {
    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function renderError(error) {
        let message = error && error.message ? error.message : String(error || '未知错误');
        let stack = error && error.stack ? String(error.stack) : '';
        let detail = stack ? stack.split('\n').slice(0, 4).join('\n') : message;
        document.body.style.display = 'block';
        document.body.innerHTML = [
            '<div class="fh-devtool-runtime-error" style="max-width:960px;margin:24px auto;padding:20px 24px;border-radius:12px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;font:14px/1.6 Menlo, Monaco, Consolas, monospace;">',
            '<h2 style="margin:0 0 12px;font:600 20px/1.3 sans-serif;color:#7c2d12;">自定义工具运行失败</h2>',
            '<p style="margin:0 0 12px;font:14px/1.6 sans-serif;">FeHelper 已在隔离沙箱中运行此工具，但脚本仍然报错。请检查脚本依赖、全局变量或浏览器 API 使用方式。</p>',
            '<pre style="margin:0;padding:14px;background:#ffedd5;border-radius:10px;white-space:pre-wrap;word-break:break-word;">',
            escapeHtml(detail),
            '</pre>',
            '</div>'
        ].join('');
    }

    function appendStyles(cssList) {
        (cssList || []).filter(Boolean).forEach(function (cssText) {
            let node = document.createElement('style');
            node.textContent = cssText;
            document.head.appendChild(node);
        });
    }

    function executeScripts(jsList) {
        (jsList || []).filter(Boolean).forEach(function (code) {
            Function('window', 'document', 'globalThis', 'self', String(code || ''))(window, document, window, window);
        });
    }

    window.addEventListener('message', function (event) {
        let data = event && event.data;
        if (!data || data.type !== 'fh-dynamic-render') return;

        let payload = data.payload || {};
        try {
            document.open();
            document.write(payload.html || '<!doctype html><html><head></head><body></body></html>');
            document.close();
            appendStyles(payload.css);
            executeScripts(payload.js);
        } catch (error) {
            renderError(error);
        }
    });
})();
