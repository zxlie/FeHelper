/**
 * FeHelper动态工具管理器，主要解决新版本向下兼容，为用户按需找回老版本的功能
 * @author zhaoxianlie
 */

let DynamicTool = (() => {

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
            // 生成界面
            document.write(html);

            // 页面滤镜：关掉
            DarkModeMgr.turnLightAuto();

            // 更新静态文件
            let list = document.querySelectorAll('dynamic[data-source]');
            if (!list.length) return;
            let allJs = [];
            let allCss = [];
            for (let i = 0; i < list.length; i++) {
                let elm = list[i];
                let fileType = elm.getAttribute('data-type');
                let sources = elm.getAttribute('data-source') || '';
                let files = sources.split(',').map(source => {
                    // 去query处理，获得干净的local key
                    if (source.indexOf('?') !== -1) {
                        let x = source.split('?');
                        x.pop();
                        source = x.join('');
                    }
                    return source;
                });

                if (fileType === 'js') {
                    allJs = allJs.concat(files);
                } else {
                    allCss = allCss.concat(files);
                }
            }

            Promise.all([Awesome.StorageMgr.get(allCss), Awesome.StorageMgr.get(allJs)]).then(values => {
                document.body.style.display = 'block';
                allCss = allCss.map(f => values[0][f]).join(' ');
                if (allCss.length) {
                    let node = document.createElement('style');
                    node.textContent = allCss;
                    document.head.appendChild(node);
                }
                allJs = allJs.map(f => values[1][f]).join(';');
                allJs.length && window.evalCore.getEvalInstance(window)(allJs);
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
