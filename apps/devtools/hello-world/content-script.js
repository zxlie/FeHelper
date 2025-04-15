
let cssInjected = false;
/**
 * 注意这里的方法名称，其实是：window[`${toolName.replace(/[-_]/g,'')}ContentScript`];
 * @author 阿烈叔
 */
window.helloworldContentScript = function () {
    // 动态注入css
    if(!cssInjected) {
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing:'inject-content-css',
            devTool: true,
            tool: 'hello-world'
        });
    }

    console.log('你好，我是来自FeHelper的工具Demo：hello world！');
};

/**
 * 如果在 fh-config.js 中指定了 noPage参数为true，则这里必须定义noPage的接口方法，如：
 * 注意这里的方法名称，其实是：window[`${toolName.replace(/[-_]/g,'')}NoPage`];
 * @author 阿烈叔
 */
window.helloworldNoPage = function (tabInfo) {
    alert('你好，我是来自FeHelper的工具Demo：hello world！你可以打开控制台看Demo的输出！');
    console.log('你好，我是来自FeHelper的工具Demo：', tabInfo);
};
