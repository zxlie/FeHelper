# FeHelper（开放平台版）

![FeHelper](https://user-images.githubusercontent.com/865735/75407628-7399c580-594e-11ea-8ef2-00adf39d61a8.jpg)

## 一、序言
鉴于Google Chrome官方强制要求的`插件单一用原则`，老版本（V2019.12）接到chrome webstore的整改通知；为保证用户能继续正常使用FeHelper，并且以后也尽可能少的对FeHelper进行提审，索性启动FeHelper的一次大升级，`支持所有工具热更新`。
先了解一下啥是Google的单一用途原则，直接看Google官方的说明吧：https://developer.chrome.com/extensions/single_purpose

## 二、新版思路
- 原来的功能：可参加老版本Readme中的介绍 https://github.com/zxlie/FeHelper
- 新版本功能：
    - 包内仅保留JSON格式化工具，包含JSON页面自动检测并格式化、JSON内容手动格式化工具；以确保工具完全符合官方要求的「插件单一用途」原则
    - 将FeHelper新版按`开放平台`的思路进行设计：插件平台化，其他老版本的所有工具，可在插件配置页面`选择性安装/更新/卸载`

## 三、新版界面
![FeHelper新版](https://user-images.githubusercontent.com/865735/75334978-b5315e80-58c3-11ea-9af0-e593149b0f7c.png)

## 四、开放平台实现
### 4.1 如何将插件配置页打造成`工具市场`，满足工具的上架、更新、卸载等操作？
- 配置页增加远程服务接口，从服务器 https://www.baidufe.com 获取相关配置，用配置直接生成工具列表，配置格式如：
```javascript
{
    newTools: { // 这里维护新上架、有更新的工具
        'color-picker': {
            name: '页面取色工具',      // 工具的名称
            tips: '将光标移动到页面上需要取色的位置，单击确定即可取色', // 工具描述
            noPage: true,            // true表示此工具无独立页面
            contentScript: true,     // 是否有内容注入的脚本
            contentScriptCss: false, // 是否注入Css
            minVersion: '2020.02.0718', // 工具从FeHelper的哪个版本开始支持
            menuConfig: [{          // 可以配置多个右键菜单
                icon: '✑',          // 右键菜单的icon，也是工具的默认icon
                text: '页面取色工具', // 右键菜单中的工具名称
                onClick: function (info, tab) { // 右键菜单点以后的动作
                    chrome.DynamicToolRunner({
                        query: 'tool=color-picker',
                        noPage: true
                    });
                }
            }]
        },
        ...
    },
    
    removeTools: [ // 需要下架的工具，直接在这里配置即可
        'code-standards' 
    ]
}
```
- 每次进入到配置页/工具市场，都会从服务器端拉取最新配置，该配置与本地已存储的配置进行比对，可检测到每个工具是否有更新、是否需下架等
- 针对已安装的工具，会从服务器端再次检测html模板内容与本地是否一致，不一致则`小红点提示`此工具有更新；这里有个细节，无论html、js、还是css文件发生过变更，都能通过只检测html模板的方式发现，因为html模板中引用js/css文件url后，都增加了文件`md5戳`，如此可做到只更新实际发生变更的文件
    
### 4.2 通过市场安装的工具，如何解决`资源存储`的问题，并确保存储空间足够大？
- 下载的工具包，包含html、js、css文件资源，所有内容都需要在本地进行存储，如果工具越来越多，本地存储占用的空间会越来越大
- 即便是在chrome-extension中，`localStorage`的存储上限也是`5M`，所以不能用它来存储已下载/安装的工具资源
- 最终选择`chrome.storage.local`，搭配`unlimitedStorage`权限，可很好的解决资源存储问题，且突破存储空间的限制

### 4.3 如何突破插件对`包外资源加载并执行`的限制，以实现动态安装的工具可在Chrome插件中正常运行？
- 由于`content-security-policy`的限制，chrome-extension不允许执行包外资源，也严格不允许出现`inline`的脚本执行
- 也不能无节制的去调整`content-security-policy`，将权限一再放大，这样确实会带来安全性的问题，审核也不容易通过
- 最终方案，是用一个`dynamic/index.html`页面作为载体，通过`url-query`从本地存储中获取工具内容、加载并运行
- 以加载`二维码/解码`工具为例，FeHelper最终会打开`chrome-extension://{id}/dynamic/index.html?tool=qr-code`
- dynamic/index.html页面本身的内容很简单，就是一行代码`<script src="index.js" type="text/javascript"></script>`，在这个`index.js`文件中来加载数据，参考核心代码：
```javascript
(() => {
    // 从本地存储获取工具资源进行渲染执行
    let renderMyTool = (toolName, Awesome) => {

        Awesome.getToolTpl(toolName).then(html => {
            
            // 回执html界面
            document.write(html);

            // 分析并获取静态文件列表
            let allJs = [], allCss = [];
            document.querySelectorAll('dynamic[data-source]').forEach(elm => {
               let fileType = elm.getAttribute('data-type');
               let files = (elm.getAttribute('data-source') || '').split(',');

               if (fileType === 'js') {
                   allJs = allJs.concat(files);
               } else {
                   allCss = allCss.concat(files);
               } 
            });

            // 从本地存储中获取静态资源进行注入 & 执行
            Promise.all([Awesome.StorageMgr.get(allCss), Awesome.StorageMgr.get(allJs)]).then(values => {
                allCss = allCss.map(f => values[0][f]).join(' ');
                if (allCss.length) {            // css内容可以直接inline注入
                    let node = document.createElement('style');
                    node.textContent = allCss;
                    document.head.appendChild(node);
                }
                allJs = allJs.map(f => values[1][f]).join(';');
                allJs.length && eval(allJs);    // js内容不能注入，可通过eval或者new Function的方式执行
            });
        });
    };

    // 从URL中获取工具名称
    let toolName = new URL(location.href).searchParams.get('tool');
    if (toolName) {
        import('./awesome.js').then(dynamicModule => {
            renderMyTool(toolName, dynamicModule.default);
        });
    } else {
        chrome.runtime.openOptionsPage() && window.close();
    }
})();
```
- 如此，用户安装的二维码工具便可在FeHelper中正常运行 

### 4.4 市场内工具包含`不同形式`：有独立界面形式、纯content-script形式、混合模式，平台如何支持？
- 这里涉及到的是不同的工具表现形式，资源加载方式都不一样，`4.3`中讲到了独立界面形式的工具资源加载，下面说一下`content-script`的资源加载
- 正常情况下，`content-script`的资源加载，都是`明码形式`在manifest.json中进行配置，如：
```javascript
"content_scripts": [{
  "matches": [
    "http://*/*",
    "https://*/*",
    "file://*/*"
  ],
  "js": [
    "static/vendor/jquery/jquery-3.3.1.min.js",
    "content-script/index.js",
    ...
  ],
  "css": [
      ...
  ],
  "run_at": "document_end",
  "all_frames": false
}]
```
- 如上，需要将js和css文件列表全都列出来，但是针对工具市场安装的应用，所有资源都属于`包外资源`，也非独立文件形式，这里就完全满足不了了
- 最终解决思路：在`content_scripts`配置项中，只列出一个核心js文件`content-script/index.js`，其他动态安装的工具脚本，都通过它来动态载入：
```javascript
/* content-script/index.js 文件内容 */
(() => {
    chrome.runtime.sendMessage({
        type: 'fh-dynamic-any-thing',
        params: {
            tabId: window.__FH_TAB_ID__ || null
        },
        func: ((params, callback) => {
            Awesome.getInstalledTools().then(tools => {
                let list = Object.keys(tools).filter(tool => tools[tool].contentScript);
                let promiseArr = list.map(tool => Awesome.getContentScript(tool));
                Promise.all(promiseArr).then(values => {
                    let installedTools = {};
                    values.forEach((v, i) => { installedTools[list[i]] = v; });
                    return installedTools;
                }).then(tools => {
                    let jsCodes = [];
                    Object.keys(tools).forEach(tool => {
                        jsCodes.push(`(()=>{ ${tools[tool]} ; let f = window['${tool}ContentScript'];f&&f();})()`);
                    });

                    chrome.tabs.executeScript(params.tabId, { code: jsCodes.join(';') });
                });
            });
            callback && callback();
            return true;
        }).toString()
    });
})();
```
- 对上面的代码实现做几个原理解释：
    - content-script首先通过sendMessage的方式，告知`background`，当前tab需要获取content-script
    - background收到消息并处理，遍历`获取所有已安装应用`的content-script内容
    - 为保证每个应用独有的content-script不发生变量冲突，一律通过`闭包代码块`进行独立执行
    - 所有content-script，通过`chrome.tabs.executeScript`一次性安全注入当前Tab，自动执行
- 另外，这里没有提到`content-script-css`如何注入，其实这个工作交给了各自content-script-js自行完成，具体方法：
```javascript
chrome.runtime.sendMessage({
    type: 'fh-dynamic-any-thing',
    func: ((params, callback) => {
        Awesome.getContentScriptCss('qr-code').then(css => chrome.tabs.insertCSS({code: css}));
        callback && callback();
        return true;
    }).toString()
});
```
- 以此，所有动态安装的工具，其内容脚本content-script都能完美的得到运行

### 4.5 市场内工具与插件background之间的`消息通信`种类多样，如何提供统一接口进行支持？
- chrome extension的核心，其实就是`消息通信`，包括background、popup、content-script之间的各种消息互通
- 尤其content-script中，因为chrome-extension的限制，权限不足，很多操作必须由background来完成
- 所以这里需要一个巧妙的设计，`能将操作虚拟的交给content-script`，原理简单，就是让background接受某一个固定类型的消息，执行`sender`传递过来的function-body：
```javascript
chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    // 从消息中获取 func 参数，转换成function实体，执行
    if (request.type === 'fh-dynamic-any-thing') {
        let func = new Function(`return ${request.func}`)();
        typeof func === 'function' && func(request.params, callback);
    }
    
    return true;
});
```
- 有了这样一个Bridge，在各自的`content-script`中就可以编写任意的代码，直接执行（其实最终的执行还是background，只不过代码不用再hardcode到background中了），比如4.4中qr-code工具的css加载示例：
```javascript
chrome.runtime.sendMessage({
    type: 'fh-dynamic-any-thing',
    func: ((params, callback) => {
        Awesome.getContentScriptCss('qr-code').then(css => chrome.tabs.insertCSS({code: css}));
        callback && callback();
        return true;
    }).toString()
});
```
- 或者更高级点儿的用法，把callback用起来（这里需要注意：func中的操作如果是异步的，则callback是拿不到参数的）
```javascript
chrome.runtime.sendMessage({
    type: 'fh-dynamic-any-thing',
    func: ((params, callback) => {
        // 这里可以做任何事情 
        let manifest = chrome.runtime.getManifest();
        
        // 最终结果在这里通知callback
        callback && callback(manifest);
        return true;
    }).toString()
}, manifest => {
    // 这里已经拿到background中执行的结果，直接使用
    alert(`当前插件版本号为：${manifest.version}`);    
});
```
- 上面`func`参数指定的function，其实最终就是在background中执行的，只不过`background部分的代码可以由工具自己来管理`


### 4.6 工具的`使用方式`分两种：Toolbar-Popup-Page模式、Page-Context-Menu模式，如何统一管理？
- Toolbar-Popup-Page的模式，是直接在浏览器工具栏点击插件icon进行使用
- Page-Context-Menu的模式，是通过右键菜单进行使用
- 两种模式的渲染和执行过程完全不一样，需要一个统一的`任务管理器`进行管理，其实就是前面示例中已经提到的`chrome.DynamicToolRunner`，我们来看方法定义：
```javascript
/**
 * 任务管理器，通过它，统一实现FeHelper工具的任务分配和运行
 * @param  {Object}  configs      启动任务管理器所需要的配置项
 * @config {String}  tool         要打开的工具名称，默认就是dynamic
 * @config {String}  withContent  默认携带的内容，在打开工具以后可读取
 * @config {String}  query        请求参数，访问页面可以携带一些默认参数
 * @config {Boolean} noPage       是否无页面模式（默认false，即独立页面）
 * @constructor
 */
chrome.DynamicToolRunner = async function (configs) {

    let tool = configs.tool || MSG_TYPE.DYNAMIC_TOOL;
    let withContent = configs.withContent;
    let query = configs.query;

    // 如果是noPage模式，则表名只完成content-script的工作，直接发送命令即可
    if (configs.noPage) {
        tool = new URL(`http://f.h?${query}`).searchParams.get('tool').replace(/-/g, '');
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            if (/^(http(s)?|file):\/\//.test(tabs[0].url)) {
                chrome.tabs.executeScript(tabs[0].id, {
                    code: `window['${tool}NoPage'] && window['${tool}NoPage'](${JSON.stringify(tabs[0])});`
                });
            } else {
                notifyText({
                    message:'抱歉，此工具无法在当前页面使用！'
                });
            }
        });
        return;
    }

    chrome.tabs.create({
        url: `${tool}/index.html?${query}`,
        active: true
    }, tab => {
        withContent && setTimeout(function () {
            chrome.tabs.sendMessage(tab.id, {
                type: MSG_TYPE.TAB_CREATED_OR_UPDATED,
                content: withContent,
                event: tool
            });
        }, 300);
    });
};
```
- 上面是任务管理器的核心代码部分，举两个使用场景的例子：
```javascript
// test case 1: popup-page中唤起image-base64工具，并传递一个需要进行base64的图片地址
chrome.DynamicToolRunner({
    query : 'tool=image-base64',
    withContent : 'https://www.baidu.com/img/bd_logo1.png'
});

// test case 2: popup-page中唤起color-picker工具，此工具无独立页面
chrome.DynamicToolRunner({
    query : 'tool=color-picker',
    noPage : true
});

// test case 3: context-menu中唤起qr-code工具，并将需要生成二维码的内容传递到页面
chrome.contextMenus.create({
    title: '二维码生成器',
    contexts: ['all'],
    parentId: FeJson.contextMenuId,
    onclick: function (info, tab) {
        chrome.tabs.executeScript(tab.id, {
            code: '(' + (function (pInfo) {
                let linkUrl = pInfo.linkUrl;
                let pageUrl = pInfo.pageUrl;
                let imgUrl = pInfo.srcUrl;
                let selection = pInfo.selectionText;
                
                return linkUrl || imgUrl || selection || pageUrl;
                }).toString() + ')(' + JSON.stringify(info) + ')',
            allFrames: false
        }, function (contents) {
            chrome.DynamicToolRunner({
                withContent: contents[0],
                query: `tool=qr-code`
            });
        });
    }
});

```

### 4.7 除作者外，第三方`开发者如何发布自己的应用`到FeHelper工具市场？
- FeHelper工具市场内一个完整的工具（zip包），需要包含如下几个部分：
```text
- ${tool}文件夹              `必选`
    - fh-config.js          `必选，具体配置项参考下文`
    - index.html            `必选，要去双击可独立运行`
    - index.js              `必选`
    - index.css             `可选`
    - content-script.js     `可选，除非config中配置了true`
    - content-script.css    `可选，除非config中配置了true`
    - other js/css files    `可选，需在index.html中显式引用`
    - images                `禁止，如果需要可用base64替代`
    - font                  `禁止，如果需要可用base64替代`
```        
- 附`fh-config.js`配置项说明，以FeHelper中默认提供的`hello-world`为例：
```javascript
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
```
- 此工具在开发者自行测试通过后，可打zip包后，邮件给我（`阿烈叔`），格式：
```text
收件：xianliezhao@foxmail.com
标题：【FeHelper新工具提审】+ 新工具名称
正文：描述新工具的使用场景、使用方法，最好附操作gif图或者视频教程
附件：工具zip包，可增加其他使用教程
```
- `工具提审在线化`：目前规划中，可取代邮件提审的形式

## 五、FH开发者工具
### 5.1 无图无真相
![FH开发者工具预览](https://user-images.githubusercontent.com/865735/75334554-0b51d200-58c3-11ea-98bf-56cd74c2309a.png)
![FH自带编辑器](https://user-images.githubusercontent.com/865735/75334604-1dcc0b80-58c3-11ea-8cd5-d7f3190c53c4.png)

### 5.2 工具介绍
- FH开发者工具能干什么？
    - 简单说就是：你基本可以`零基础`、`1分钟`搞定一个FH工具！
    - 可以直接开启并体验`Hello world！`工具，也可以直接`下载示例zip包`进行学习！
    - 可以直接通过开发者工具的`界面向导`操作，创建一个简单/复杂的FH工具！
    - 已经创建好的工具，可以`下载zip包`继续在本地开发！
    - 你也可以直接下载zip包后，`分享`给其他小伙伴儿！
    - 当然，如果你觉得你的工具很实用，你也可以下载zip包，直接`邮件提审`给我（阿烈叔）！
- FH开发者工具的一些贴心功能
    - 在线创建、在线Coding、`自动保存`、`实时生效`
    - 在线编辑`fh-config`配置时，整个工具的文件列表也会自动实时生效
    - 图标不好找？FH给你提供了一批`现成的字符图标`，点一下就能用！

## 六、Open API
> 建议安装`FH开发者工具`以后，直接拿`hello-world`示例来学习！

### 6.1 chrome.* API
- 官方提供的Api基本都可以用，可以直接去官网看： https://developer.chrome.com/extensions/devguide
- 如果访问不了`chrome.com`，你可以用`360的插件开发者Api`来学习使用，也基本够用： http://open.chrome.360.cn/extension_dev/overview.html
- 如果也不行看`360`的Api，你还可以看`baidu浏览器插件的开发者Api`，也差不多够用： https://chajian.baidu.com/developer/extensions/api_index.html

### 6.2 在工具独立页面使用chrome.* API
- 如果你的工具没有配置`noPage: true`，那么你可以在`index.html`引用的js文件中直接使用`chrome.*`API

### 6.3 content-script.js
- 只要你配置了`contentScript: true`，工具就一定需要有content-script.js脚本文件
- content-script.js文件中，一定要显示的在window上绑定一个方法，以`hello-world`为例：
```javascript
/**
 * 注意这里的方法名称，其实是：window[`${toolName.replace(/[-_]/g,'')}ContentScript`];
 * @author 阿烈叔
 */
window.helloworldContentScript = function () {
    console.log('你好，我是来自FeHelper的工具Demo：hello world！');
};
```
- 你完全不必要担心`window对象被污染`，因为content-script是在一个独立的沙箱内运行的，对网页的正常运行毫无影响
- content-script.js文件中，基本是除了`chrome.runtime`API，其他的`chrome.*`是用不了的，如果实在要用，可以参考`6.5`的消息机制
- 在content-script.js中，你可以进行任意的`DOM操作`，就跟你正常的coding一样

### 6.4 关于noPage配置
- 如果你配置了`noPage: true`，那你的工具也一定需要有content-script.js脚本文件
- content-script.js文件中，一定要显示的在window上绑定一个方法，依然以`hello-world`为例：
```javascript
/**
 * 如果在 fh-config.js 中指定了 noPage参数为true，则这里必须定义noPage的接口方法，如：
 * 注意这里的方法名称，其实是：window[`${toolName.replace(/[-_]/g,'')}NoPage`];
 * @author 阿烈叔
 */
window.helloworldNoPage = function (tabInfo) {
    alert('你好，我是来自FeHelper的工具Demo：hello world！你可以打开控制台看Demo的输出！');
    console.log('你好，我是来自FeHelper的工具Demo：', tabInfo);
};
```
- 既然noPage和content-script都一样，那`为什么还要有noPage`这个东西？
    - noPage指明的是：该工具无独立页面
    - 点击下拉列表中的工具入口、或者右键菜单中点击工具入口，会执行`window.xxxNoPage`中的代码
- noPage的应用有没有一些实用的例子？    
    - 比如，FeHelper中提供的`网页取色工具`，就是一个noPage的应用，点击工具，直接在网页上呼出一个取色器
    - 再比如，FeHelper中提供的`二维码解码`工具，在二维码图片上右击，可以直接对该二维码进行解码
    
### 6.5 消息通信
- 消息机制主要是提供给`content-script.js`使用的，它提供了一种`内容脚本使用chrome.* API`的可行性，示例：
```javascript
// background 示例：在content-script.js中获取当前浏览器的所有tab
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
```

### 6.6 content-script.css
- 如果配置了`contentScriptCss: true`，那说明你的FH工具还需要`向页面注入CSS代码`
- FeHelper `v2020.03.1210`版本开始，内容css将有FH自动加载，content-script.js中调用下面方法即可注入
```javascript
// 以页面代码自动美化工具为例，注意这里的方法名：window.${toolName}ContentScriptCssInject()
window.codebeautifyContentScriptCssInject();
```
- 以下为老版本FH的内容css加载方式（向后兼容）
- content-script.css的加载机制，是在content-script.js中通过`6.5`中介绍的消息机制来完成的
- 依然以`hello-world`为例，看代码示例：
```javascript
// 注入css and html fragment
chrome.runtime.sendMessage({
    type: 'fh-dynamic-any-thing',
    func: ((params, callback) => {
        // 通过这个内置方法来获取css内容，并直接注入当前网页
        Awesome.getContentScript('hello-world', true).then(cssText => {
            chrome.tabs.insertCSS({
                code: cssText,
                runAt: 'document_end'
            });
        });
        callback && callback();
        return true;
    }).toString()
});
```
- 当然，要想在content-script中使用自定义的css，办法还有很多，可以定义`contentScriptCss: false`，通过在页面上直接`硬编码插入`的方式来完成，比如：
```javascript
let cssText = `/* Your CSS Codes Here... */`;
let elStyle = document.createElement('style');
elStyle.textContent = cssText;
document.head.appendChild(elStyle);
```

## 七、意见反馈
- 大家可在feedback中反馈、也可加群反馈、或者直接Mail给我
- 最后，欢迎搭建使用 FeHelper ，希望`开放平台`思路的FeHelper能给大家带来快感！