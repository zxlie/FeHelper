(function (global) {
    function normalizeSourceKey(source) {
        source = String(source || '');
        if (source.indexOf('?') !== -1) {
            let parts = source.split('?');
            parts.pop();
            source = parts.join('?');
        }
        return source;
    }

    function collectAssetKeys(nodes) {
        let js = [];
        let css = [];
        [].slice.call(nodes || []).forEach(node => {
            let fileType = node.getAttribute('data-type');
            let sources = String(node.getAttribute('data-source') || '')
                .split(',')
                .map(normalizeSourceKey)
                .filter(Boolean);

            if (fileType === 'js') {
                js = js.concat(sources);
            } else if (fileType === 'css') {
                css = css.concat(sources);
            }
        });
        return { js, css };
    }

    function recoverNativeFunction(win, doc) {
        win = win || global;
        doc = doc || win.document;

        if (win.__FH_NATIVE_FUNCTION__ && typeof win.__FH_NATIVE_FUNCTION__ === 'function') {
            return win.__FH_NATIVE_FUNCTION__;
        }

        if (!doc || !doc.createElement) {
            return win.Function;
        }

        let iframe = null;
        try {
            iframe = doc.createElement('iframe');
            iframe.style.display = 'none';
            iframe.setAttribute('aria-hidden', 'true');
            iframe.src = 'about:blank';
            (doc.documentElement || doc.body).appendChild(iframe);

            let nativeFunction = iframe.contentWindow && iframe.contentWindow.Function;
            if (typeof nativeFunction === 'function') {
                let bridgedFunction = function (code) {
                    return nativeFunction('window', 'document', 'globalThis', 'self', String(code || '')).bind(win, win, doc, win, win);
                };
                win.__FH_NATIVE_FUNCTION__ = bridgedFunction;
                return bridgedFunction;
            }
        } catch (e) {
            win.console && win.console.warn && win.console.warn('恢复原生Function失败', e);
        } finally {
            if (iframe && iframe.remove) {
                iframe.remove();
            }
        }

        return win.Function;
    }

    function renderRuntimeError(error, doc) {
        doc = doc || global.document;
        if (!doc || !doc.body) return;

        let message = error && error.message ? error.message : String(error || '未知错误');
        let stack = error && error.stack ? String(error.stack) : '';
        let detail = stack ? stack.split('\n').slice(0, 4).join('\n') : message;

        doc.body.style.display = 'block';
        doc.body.innerHTML = [
            '<div class="fh-devtool-runtime-error" style="max-width:960px;margin:24px auto;padding:20px 24px;border-radius:16px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;font:14px/1.6 Menlo, Monaco, Consolas, monospace;">',
            '<h2 style="margin:0 0 12px;font:600 20px/1.3 sans-serif;color:#7c2d12;">自定义工具运行失败</h2>',
            '<p style="margin:0 0 12px;font:14px/1.6 sans-serif;">FeHelper 已尝试用原生执行器加载该工具，但脚本仍然报错。请优先检查依赖包是否要求 ESM import/export、浏览器专属 API 或运行时全局变量。</p>',
            '<pre style="margin:0;padding:14px;background:#ffedd5;border-radius:12px;white-space:pre-wrap;word-break:break-word;">',
            escapeHtml(detail),
            '</pre>',
            '</div>'
        ].join('');
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function executeScripts(scriptContents, opts) {
        opts = opts || {};
        let win = opts.win || global;
        let doc = opts.doc || win.document;
        let allJs = [].concat(scriptContents || []).filter(Boolean).join(';\n');
        if (!allJs) return true;

        let NativeFunction = recoverNativeFunction(win, doc);
        try {
            NativeFunction(allJs)();
            return true;
        } catch (e) {
            win.console && win.console.error && win.console.error('动态工具JS执行失败', e);
            renderRuntimeError(e, doc);
            return false;
        }
    }

    global.FHDynamicRuntime = {
        normalizeSourceKey,
        collectAssetKeys,
        recoverNativeFunction,
        executeScripts,
        renderRuntimeError
    };
})(typeof window !== 'undefined' ? window : globalThis);
