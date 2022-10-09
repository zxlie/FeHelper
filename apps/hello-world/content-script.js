/**
 * 注意这里的方法名称，其实是：window[`${toolName.replace(/[-_]/g,'')}ContentScript`];
 * @author 阿烈叔
 */
window.helloworldContentScript = function () {
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

    // background 示例：获取当前浏览器的所有tab
    chrome.runtime.sendMessage({
        type: 'fh-dynamic-any-thing',
        params: {
            tabId: window.__FH_TAB_ID__ // 这是FH的内置变量，表示当前Tab的id
        },
        func: ((params, callback) => {
            // TODO: 这里可以调用 chrome.* 的API，随便用。。。

            // Case1：获取当前窗口的全部tab
            chrome.tabs.query({currentWindow: true}, tabs => {
                let jsonInfo = JSON.stringify(tabs);

                // 注入到页面，注意看这里如何读取外面传进来的参数
                chrome.tabs.executeScript(params.tabId, {
                    code: 'console.log(' + jsonInfo + ');'
                });
            });

            callback && callback();
            return true;
        }).toString()
    });
};