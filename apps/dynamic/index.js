/**
 * FeHelper动态工具管理器，主要解决新版本向下兼容，为用户按需找回老版本的功能
 * @author zhaoxianlie
 */

let DynamicTool = (() => {
    let Runtime = window.FHDynamicRuntime || {};

    // 工具渲染
    let render = (toolName, Awesome) => {

        Awesome.getToolTpl(toolName).then(html => {
            if (!html) {
                if (confirm('检测到当前指定的工具还未安装，这就去设置页面安装工具！')) {
                    location.replace('../options/index.html');
                } else {
                    window.close();
                }
                return;
            }
            // 页面滤镜：关掉
            DarkModeMgr.turnLightAuto();

            // 更新静态文件。MV3 扩展页不允许 eval / new Function，
            // 因此带脚本的自定义工具统一放到 sandbox 页面中运行。
            let tpl = new DOMParser().parseFromString(html, 'text/html');
            let list = tpl.querySelectorAll('dynamic[data-source]');
            let assets = Runtime.collectAssetKeys ? Runtime.collectAssetKeys(list) : { js: [], css: [] };
            let allJs = assets.js || [];
            let allCss = assets.css || [];

            Promise.all([Awesome.StorageMgr.get(allCss), Awesome.StorageMgr.get(allJs)]).then(values => {
                allCss = allCss.map(f => values[0][f]).filter(Boolean);
                allJs = allJs.map(f => values[1][f]).filter(Boolean);
                if (Runtime.renderInSandbox) {
                    Runtime.renderInSandbox({
                        html,
                        css: allCss,
                        js: allJs
                    }, document);
                    return;
                }
                document.body.style.display = 'block';
                document.write(html);
                if (allCss.length) {
                    let node = document.createElement('style');
                    node.textContent = allCss.join(' ');
                    document.head.appendChild(node);
                }
            });
        });
    };

    // 页面初始化
    let init = () => {
        // 从Query中寻找需要动态渲染的工具名称
        let toolName = new URL(location.href).searchParams.get('tool');
        if (toolName) {
            import('../background/awesome.js').then(dynamicModule => {
                render(toolName, dynamicModule.default);
            });
        } else {
            location.replace('../options/index.html');
        }
    };

    return {init}
})();

DynamicTool.init();
