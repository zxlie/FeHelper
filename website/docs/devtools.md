# 开发者工具

FeHelper 开发者工具用于创建和维护本地自定义 FH 工具。当前支持两类工具：

- 页面工具：点击后打开 FeHelper 的动态工具页，适合表单、转换器、可视化面板等有独立 UI 的工具。
- noPage 工具：点击右键菜单或弹窗入口后直接在当前网页执行，适合页面取数、页面标记、快捷操作等不需要打开新页的工具。

本文示例已经按当前 MV3 版本验证：页面工具会运行在 `dynamic/sandbox.html` 隔离沙箱里，noPage 工具会从 `chrome.storage.local` 读取 `content-script.js` 后注入当前网页。

## 工具包结构

一个自定义工具建议使用独立目录，例如：

```text
fh-doc-qa/
  fh-config.js
  index.html
  index.css
  index.js
  content-script.js
  content-script.css
```

最少需要 `fh-config.js` 和 `index.html`。只有 noPage 或页面注入能力需要 `content-script.js` / `content-script.css`。

## 配置文件

`fh-config.js` 使用纯 JSON，键名就是工具 ID。工具 ID 建议使用小写字母、数字、连字符或下划线。

```json
{
  "fh-doc-qa": {
    "name": "文档验收工具",
    "tips": "验证自定义 FH 工具开发流程",
    "icon": "验",
    "noPage": false,
    "contentScriptJs": false,
    "contentScriptCss": false,
    "updateUrl": ""
  }
}
```

字段说明：

- `name`：显示在弹窗、配置页和右键菜单里的工具名。
- `tips`：工具描述。
- `icon`：工具图标，可以使用单个文字或符号。
- `noPage`：`false` 表示打开独立页面；`true` 表示直接在当前网页执行。
- `contentScriptJs`：是否需要 `content-script.js`。
- `contentScriptCss`：是否需要 `content-script.css`。
- `contentScript`：旧字段别名，仍兼容；新工具建议使用 `contentScriptJs`。
- `updateUrl`：远程更新入口；本地工具可留空。

安装后 FeHelper 会把配置保存到 `DEV-TOOLS:MY-TOOLS`，并自动追加内部字段 `_devTool` / `_enable`。

## 页面工具

页面工具适合有独立 UI 的工具。`fh-config.js` 中保持：

```json
{
  "fh-doc-qa": {
    "name": "文档验收工具",
    "tips": "验证自定义 FH 工具开发流程",
    "icon": "验",
    "noPage": false,
    "contentScriptJs": false,
    "contentScriptCss": false,
    "updateUrl": ""
  }
}
```

`index.html`：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>FH 文档验收工具</title>
  <link rel="stylesheet" href="index.css">
</head>
<body>
  <main id="fh-doc-qa">加载中</main>
  <script src="index.js"></script>
</body>
</html>
```

`index.css`：

```css
#fh-doc-qa {
  color: rgb(17, 112, 64);
  font-weight: 700;
}
```

`index.js`：

```js
document.getElementById('fh-doc-qa').textContent = 'FH_CUSTOM_TOOL_OK';
window.__FH_DOC_QA_TOOL_RAN__ = true;
```

运行方式：

1. 打开 FeHelper 配置页里的“开发者工具”。
2. 创建本地工具，或导入包含上述文件的 zip 包。
3. 在弹窗或配置页安装并打开 `fh-doc-qa`。
4. 页面应显示 `FH_CUSTOM_TOOL_OK`。

实现细节：保存或导入时，FeHelper 会把 `index.html` 中的外链 CSS/JS 转成内部 `<dynamic>` 标记，并把内容保存到 `DYNAMIC_TOOL:<toolId>`、`../<toolId>/index.css`、`../<toolId>/index.js`。运行时 `dynamic/index.html?tool=<toolId>` 会读取这些内容，再放入 sandbox iframe。

## noPage 工具

noPage 工具不会打开独立页面，而是在当前网页执行 `content-script.js` 中的函数。

`fh-config.js`：

```json
{
  "fh-doc-nopage": {
    "name": "文档 noPage 验收",
    "tips": "在当前页面直接执行的 FH 工具",
    "icon": "验",
    "noPage": true,
    "contentScriptJs": true,
    "contentScriptCss": true,
    "updateUrl": ""
  }
}
```

`content-script.js`：

```js
window.fhdocnopageContentScript = function () {
  window.__FH_DOC_NOPAGE_READY__ = true;
};

window.fhdocnopageNoPage = function (tabInfo) {
  window.__FH_DOC_NOPAGE_TAB_URL__ = tabInfo && tabInfo.url;
  document.body.dataset.fhDocNoPage = 'FH_NOPAGE_OK';
};
```

函数命名规则：

- 先把工具 ID 中的 `-` 和 `_` 删除。
- 再拼接 `ContentScript` 和 `NoPage`。
- 例如 `fh-doc-nopage` 对应 `window.fhdocnopageContentScript` 和 `window.fhdocnopageNoPage`。

`content-script.css` 可选：

```css
body[data-fh-doc-no-page="FH_NOPAGE_OK"] {
  outline: 3px solid rgb(17, 112, 64);
}
```

运行方式：

1. 安装并启用该工具。
2. 在普通网页中从 FeHelper 弹窗或右键菜单触发该工具。
3. 页面 DOM 应出现 `data-fh-doc-no-page="FH_NOPAGE_OK"`。

## 运行限制

- 页面工具运行在 MV3 sandbox 中，可以操作自己的 DOM，也可以使用普通浏览器 API。
- 页面工具的 sandbox 不能直接调用 `chrome.*` 扩展 API；需要扩展能力时，优先拆成 noPage/content-script 逻辑。
- `index.js` 请使用普通脚本格式；不要直接写 ESM `import/export`，需要依赖时先打包成单文件脚本。
- noPage 工具只能在可注入页面执行，不能在 `chrome://`、Chrome Web Store、扩展商店页等受限页面执行。
- noPage 的 `tabInfo` 来自当前激活 tab，可读取 `tabInfo.url`、`tabInfo.title` 等基础信息。

## 常见问题

**加载扩展时报 sandbox CSP 错误**

MV3 的 sandbox CSP 必须写在 `content_security_policy.sandbox`，`sandbox` 字段只放页面列表：

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'self'",
    "sandbox": "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
  },
  "sandbox": {
    "pages": ["dynamic/sandbox.html"]
  }
}
```

**页面工具打开后空白**

检查 `index.html` 是否引用了实际存在的 `index.js` / `index.css`，并确认导入或保存后 storage 中有 `DYNAMIC_TOOL:<toolId>` 和 `../<toolId>/index.js`。

**noPage 没有反应**

优先检查三点：

- `fh-config.js` 中 `noPage: true` 且 `contentScriptJs: true`。
- `content-script.js` 函数名是否按规则删除了 `-` 和 `_`。
- 当前页面是否允许扩展注入脚本。

**提示 `xxxNoPage is not a function`**

通常是工具 ID 和函数名不匹配。例如工具 ID 是 `my-tool`，函数必须是 `window.mytoolNoPage`，不能写成 `window.myToolNoPage` 或 `window.my_toolNoPage`。
