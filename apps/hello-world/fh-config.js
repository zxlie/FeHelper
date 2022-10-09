(function () {
    return {
        "hello-world": {
            "name": "Hello world!",      // 工具的名称
            "tips": "这是一个FH自定义工具的入门示例！一切都从Hello world开始，大家可体验，或下载后学习！", // 工具描述
            "noPage": true,             // true表示此工具无独立页面
            "contentScript": true,      // 是否有内容注入的脚本
            "contentScriptCss": false,  // 是否注入Css
            "minVersion": "2020.02.0718", // 工具从FeHelper的哪个版本开始支持
            "menuConfig": [{            // 可以配置多个右键菜单
                "icon": "웃",            // 右键菜单的icon，也是工具的默认icon
                "text": "Hello world",  // 右键菜单中的工具名称
                "onClick": function (info, tab) {
                    alert('你好，我是Hello world；这是一个无独立页面的功能，我的内容已经输出到控制台了哦！');
                    chrome.DynamicToolRunner({
                        query: "tool=hello-world",
                        noPage: true
                    });
                }
            }]
        }
    };
})();