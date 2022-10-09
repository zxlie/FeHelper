var DemoTpl = {
    'markdown': `# 欢迎使用 Markdown在线编辑器

**Markdown是一种轻量级的「标记语言」**

> Markdown是一种可以使用普通文本编辑器编写的标记语言，通过简单的标记语法，它可以使普通文本内容具有一定的格式。它允许人们使用易读易写的纯文本格式编写文档，然后转换成格式丰富的HTML页面，Markdown文件的后缀名便是“.md”

## MdEditor的功能列表演示

# 标题H1
## 标题H2
### 标题H3
#### 标题H4
##### 标题H5
###### 标题H5
### 字符效果和横线等
----

~~删除线~~ <s>删除线（开启识别HTML标签时）</s>

*斜体字*      _斜体字_

**粗体**  __粗体__

***粗斜体*** ___粗斜体___

上标：X<sub>2</sub>，下标：O<sup>2</sup>

**缩写(同HTML的abbr标签)**

> 即更长的单词或短语的缩写形式，前提是开启识别HTML标签时，已默认开启

The <abbr title="Hyper Text Markup Language">HTML</abbr> specification is maintained by the <abbr title="World Wide Web Consortium">W3C</abbr>.
### 引用 Blockquotes

> 引用文本 Blockquotes

引用的行内混合 Blockquotes

> 引用：如果想要插入空白换行\`即<br />标签\`，在插入处先键入两个以上的空格然后回车即可，[普通链接](https://www.mdeditor.com/)。

### 锚点与链接 Links
[普通链接](https://www.mdeditor.com/)
[普通链接带标题](https://www.mdeditor.com/ "普通链接带标题")
直接链接：<https://www.mdeditor.com>
[锚点链接][anchor-id]
[anchor-id]: https://www.mdeditor.com/
[mailto:test.test@gmail.com](mailto:test.test@gmail.com)
GFM a-tail link @pandao
邮箱地址自动链接 test.test@gmail.com  www@vip.qq.com
> @pandao

### 多语言代码高亮 Codes

#### 行内代码 Inline code


执行命令：\`npm install marked\`


#### JS代码
\`\`\`javascript
function test() {
	console.log("Hello world!");
}
\`\`\`

#### HTML 代码 HTML codes
\`\`\`html
<!DOCTYPE html>
<html>
    <head>
        <mate charest="utf-8" />
        <meta name="keywords" content="Editor.md, Markdown, Editor" />
        <title>Hello world!</title>
        <style type="text/css">
            body{font-size:14px;color:#444;font-family: "Microsoft Yahei", Tahoma, "Hiragino Sans GB", Arial;background:#fff;}
            ul{list-style: none;}
            img{border:none;vertical-align: middle;}
        </style>
    </head>
    <body>
        <h1 class="text-xxl">Hello world!</h1>
        <p class="text-green">Plain text</p>
    </body>
</html>
\`\`\`
### 图片 Images

图片加链接 (Image + Link)：


![](https://www.baidu.com/img/bd_logo1.png "markdown")

> Follow your heart.

----
### 列表 Lists

#### 无序列表（减号）Unordered Lists (-)

- 列表一
- 列表二
- 列表三

#### 无序列表（星号）Unordered Lists (*)

* 列表一
* 列表二
* 列表三

#### 无序列表（加号和嵌套）Unordered Lists (+)
+ 列表一
+ 列表二
    + 列表二-1
    + 列表二-2
    + 列表二-3
+ 列表三
    * 列表一
    * 列表二
    * 列表三

#### 有序列表 Ordered Lists (-)

1. 第一行
2. 第二行
3. 第三行

----

### 绘制表格 Tables

| 项目        | 价格   |  数量  |
| --------   | -----:  | :----:  |
| 计算机      | $1600   |   5     |
| 手机        |   $12   |   12   |
| 管线        |    $1    |  234  |


First Header  | Second Header
------------- | -------------
Content Cell  | Content Cell
Content Cell  | Content Cell


| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |

| Function name | Description                    |
| ------------- | ------------------------------ |
| \`help()\`      | Display the help window.       |
| \`destroy()\`   | **Destroy your computer!**     |

| Left-Aligned  | Center Aligned  | Right Aligned |
| :------------ |:---------------:| -----:|
| col 3 is      | some wordy text | $1600 |
| col 2 is      | centered        |   $12 |
| zebra stripes | are neat        |    $1 |

| Item      | Value |
| --------- | -----:|
| Computer  | $1600 |
| Phone     |   $12 |
| Pipe      |    $1 |

`,

    html: `<h2 class="fe-function-title">FE助手</h2>
<ul class="fe-function-list">
    <li class="-x-endecode" >
        <span>字符串编解码</span></li>
    <li class="-x-jsonformat">
        <span><code>Json</code>串格式化</span></li>
    <li class="-x-codebeautify">
        <span>代码美化工具</span></li>
    <li class="-x-codecompress">
        <span>代码压缩工具</span></li>
    <li class="-x-qrcode">
        <span>二维码生成器</span></li>
    <li class="-x-colorpicker">
        <span>页面取色工具</span></li>
    <li class="-x-regexp">
        <span>Js正则表达式</span></li>
    <li class="-x-timestamp">
        <span>时间(戳)转换</span></li>
    <li class="-x-base64">
        <span>图片Base64</span></li>
    <li class="-x-fcp">
        <span>编码规范检测</span></li>
    <li class="-x-loadtime">
        <span>页面性能检测</span></li>
    <li class="-x-markdown">
        <span>Html转<code>Markdown</code></span></li>
    <li class="-x-ajax-debugger">
        <span>Ajax调试:<strong>关</strong></span></li>
</ul>`,

    exportHtml: `<!DOCTYPE HTML><html lang="zh-CN"><head><title>#title#</title><meta charset="UTF-8"><style>#style#</style></head><body class="markdown-body">#html#</body></html>`,

    exportCss: `.markdown-body{box-sizing:border-box;min-width:200px;max-width:980px;margin:0 auto;padding:45px;}.markdown-body .octicon{display:inline-block;fill:currentColor;vertical-align:text-bottom}.markdown-body .anchor{float:left;line-height:1;margin-left:-20px;padding-right:4px}.markdown-body .anchor:focus{outline:none}.markdown-body h1 .octicon-link,.markdown-body h2 .octicon-link,.markdown-body h3 .octicon-link,.markdown-body h4 .octicon-link,.markdown-body h5 .octicon-link,.markdown-body h6 .octicon-link{color:#1b1f23;vertical-align:middle;visibility:hidden}.markdown-body h1:hover .anchor,.markdown-body h2:hover .anchor,.markdown-body h3:hover .anchor,.markdown-body h4:hover .anchor,.markdown-body h5:hover .anchor,.markdown-body h6:hover .anchor{text-decoration:none}.markdown-body h1:hover .anchor .octicon-link,.markdown-body h2:hover .anchor .octicon-link,.markdown-body h3:hover .anchor .octicon-link,.markdown-body h4:hover .anchor .octicon-link,.markdown-body h5:hover .anchor .octicon-link,.markdown-body h6:hover .anchor .octicon-link{visibility:visible}.markdown-body h1:hover .anchor .octicon-link:before,.markdown-body h2:hover .anchor .octicon-link:before,.markdown-body h3:hover .anchor .octicon-link:before,.markdown-body h4:hover .anchor .octicon-link:before,.markdown-body h5:hover .anchor .octicon-link:before,.markdown-body h6:hover .anchor .octicon-link:before{width:16px;height:16px;content:' ';display:inline-block;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxNiAxNicgdmVyc2lvbj0nMS4xJyB3aWR0aD0nMTYnIGhlaWdodD0nMTYnIGFyaWEtaGlkZGVuPSd0cnVlJz48cGF0aCBmaWxsLXJ1bGU9J2V2ZW5vZGQnIGQ9J000IDloMXYxSDRjLTEuNSAwLTMtMS42OS0zLTMuNVMyLjU1IDMgNCAzaDRjMS40NSAwIDMgMS42OSAzIDMuNSAwIDEuNDEtLjkxIDIuNzItMiAzLjI1VjguNTljLjU4LS40NSAxLTEuMjcgMS0yLjA5QzEwIDUuMjIgOC45OCA0IDggNEg0Yy0uOTggMC0yIDEuMjItMiAyLjVTMyA5IDQgOXptOS0zaC0xdjFoMWMxIDAgMiAxLjIyIDIgMi41UzEzLjk4IDEyIDEzIDEySDljLS45OCAwLTItMS4yMi0yLTIuNSAwLS44My40Mi0xLjY0IDEtMi4wOVY2LjI1Yy0xLjA5LjUzLTIgMS44NC0yIDMuMjVDNiAxMS4zMSA3LjU1IDEzIDkgMTNoNGMxLjQ1IDAgMy0xLjY5IDMtMy41UzE0LjUgNiAxMyA2eic+PC9wYXRoPjwvc3ZnPg==)}.markdown-body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;line-height:1.5;color:#24292e;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;font-size:16px;line-height:1.5;word-wrap:break-word}.markdown-body details{display:block}.markdown-body summary{display:list-item}.markdown-body a{background-color:initial}.markdown-body a:active,.markdown-body a:hover{outline-width:0}.markdown-body strong{font-weight:inherit;font-weight:bolder}.markdown-body h1{font-size:2em;margin:.67em 0}.markdown-body img{border-style:none}.markdown-body code,.markdown-body kbd,.markdown-body pre{font-family:monospace,monospace;font-size:1em}.markdown-body hr{box-sizing:initial;height:0;overflow:visible}.markdown-body input{font:inherit;margin:0}.markdown-body input{overflow:visible}.markdown-body [type=checkbox]{box-sizing:border-box;padding:0}.markdown-body *{box-sizing:border-box}.markdown-body input{font-family:inherit;font-size:inherit;line-height:inherit}.markdown-body a{color:#0366d6;text-decoration:none}.markdown-body a:hover{text-decoration:underline}.markdown-body strong{font-weight:600}.markdown-body hr{height:0;margin:15px 0;overflow:hidden;background:0 0;border:0;border-bottom:1px solid #dfe2e5}.markdown-body hr:after,.markdown-body hr:before{display:table;content:""}.markdown-body hr:after{clear:both}.markdown-body table{border-spacing:0;border-collapse:collapse}.markdown-body td,.markdown-body th{padding:0}.markdown-body details summary{cursor:pointer}.markdown-body kbd{display:inline-block;padding:3px 5px;font:11px SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;line-height:10px;color:#444d56;vertical-align:middle;background-color:#fafbfc;border:1px solid #d1d5da;border-radius:3px;box-shadow:inset 0 -1px 0 #d1d5da}.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{margin-top:0;margin-bottom:0}.markdown-body h1{font-size:32px}.markdown-body h1,.markdown-body h2{font-weight:600}.markdown-body h2{font-size:24px}.markdown-body h3{font-size:20px}.markdown-body h3,.markdown-body h4{font-weight:600}.markdown-body h4{font-size:16px}.markdown-body h5{font-size:14px}.markdown-body h5,.markdown-body h6{font-weight:600}.markdown-body h6{font-size:12px}.markdown-body p{margin-top:0;margin-bottom:10px}.markdown-body blockquote{margin:0}.markdown-body ol,.markdown-body ul{padding-left:0;margin-top:0;margin-bottom:0}.markdown-body ol ol,.markdown-body ul ol{list-style-type:lower-roman}.markdown-body ol ol ol,.markdown-body ol ul ol,.markdown-body ul ol ol,.markdown-body ul ul ol{list-style-type:lower-alpha}.markdown-body dd{margin-left:0}.markdown-body code,.markdown-body pre{font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-size:12px}.markdown-body pre{margin-top:0;margin-bottom:0}.markdown-body input::-webkit-inner-spin-button,.markdown-body input::-webkit-outer-spin-button{margin:0;-webkit-appearance:none;appearance:none}.markdown-body:checked + .radio-label{position:relative;z-index:1;border-color:#0366d6}.markdown-body .border{border:1px solid #e1e4e8 !important}.markdown-body .border-0{border:0 !important}.markdown-body .border-bottom{border-bottom:1px solid #e1e4e8 !important}.markdown-body .rounded-1{border-radius:3px !important}.markdown-body .bg-white{background-color:#fff !important}.markdown-body .bg-gray-light{background-color:#fafbfc !important}.markdown-body .text-gray-light{color:#6a737d !important}.markdown-body .mb-0{margin-bottom:0 !important}.markdown-body .my-2{margin-top:8px !important;margin-bottom:8px !important}.markdown-body .pl-0{padding-left:0 !important}.markdown-body .py-0{padding-top:0 !important;padding-bottom:0 !important}.markdown-body .pl-1{padding-left:4px !important}.markdown-body .pl-2{padding-left:8px !important}.markdown-body .py-2{padding-top:8px !important;padding-bottom:8px !important}.markdown-body .pl-3,.markdown-body .px-3{padding-left:16px !important}.markdown-body .px-3{padding-right:16px !important}.markdown-body .pl-4{padding-left:24px !important}.markdown-body .pl-5{padding-left:32px !important}.markdown-body .pl-6{padding-left:40px !important}.markdown-body .f6{font-size:12px !important}.markdown-body .lh-condensed{line-height:1.25 !important}.markdown-body .text-bold{font-weight:600 !important}.markdown-body .pl-c{color:#6a737d}.markdown-body .pl-c1,.markdown-body .pl-s .pl-v{color:#005cc5}.markdown-body .pl-e,.markdown-body .pl-en{color:#6f42c1}.markdown-body .pl-s .pl-s1,.markdown-body .pl-smi{color:#24292e}.markdown-body .pl-ent{color:#22863a}.markdown-body .pl-k{color:#d73a49}.markdown-body .pl-pds,.markdown-body .pl-s,.markdown-body .pl-s .pl-pse .pl-s1,.markdown-body .pl-sr,.markdown-body .pl-sr .pl-cce,.markdown-body .pl-sr .pl-sra,.markdown-body .pl-sr .pl-sre{color:#032f62}.markdown-body .pl-smw,.markdown-body .pl-v{color:#e36209}.markdown-body .pl-bu{color:#b31d28}.markdown-body .pl-ii{color:#fafbfc;background-color:#b31d28}.markdown-body .pl-c2{color:#fafbfc;background-color:#d73a49}.markdown-body .pl-c2:before{content:"^M"}.markdown-body .pl-sr .pl-cce{font-weight:700;color:#22863a}.markdown-body .pl-ml{color:#735c0f}.markdown-body .pl-mh,.markdown-body .pl-mh .pl-en,.markdown-body .pl-ms{font-weight:700;color:#005cc5}.markdown-body .pl-mi{font-style:italic;color:#24292e}.markdown-body .pl-mb{font-weight:700;color:#24292e}.markdown-body .pl-md{color:#b31d28;background-color:#ffeef0}.markdown-body .pl-mi1{color:#22863a;background-color:#f0fff4}.markdown-body .pl-mc{color:#e36209;background-color:#ffebda}.markdown-body .pl-mi2{color:#f6f8fa;background-color:#005cc5}.markdown-body .pl-mdr{font-weight:700;color:#6f42c1}.markdown-body .pl-ba{color:#586069}.markdown-body .pl-sg{color:#959da5}.markdown-body .pl-corl{text-decoration:underline;color:#032f62}.markdown-body .mb-0{margin-bottom:0 !important}.markdown-body .my-2{margin-bottom:8px !important}.markdown-body .my-2{margin-top:8px !important}.markdown-body .pl-0{padding-left:0 !important}.markdown-body .py-0{padding-top:0 !important;padding-bottom:0 !important}.markdown-body .pl-1{padding-left:4px !important}.markdown-body .pl-2{padding-left:8px !important}.markdown-body .py-2{padding-top:8px !important;padding-bottom:8px !important}.markdown-body .pl-3{padding-left:16px !important}.markdown-body .pl-4{padding-left:24px !important}.markdown-body .pl-5{padding-left:32px !important}.markdown-body .pl-6{padding-left:40px !important}.markdown-body .pl-7{padding-left:48px !important}.markdown-body .pl-8{padding-left:64px !important}.markdown-body .pl-9{padding-left:80px !important}.markdown-body .pl-10{padding-left:96px !important}.markdown-body .pl-11{padding-left:112px !important}.markdown-body .pl-12{padding-left:128px !important}.markdown-body hr{border-bottom-color:#eee}.markdown-body kbd{display:inline-block;padding:3px 5px;font:11px SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;line-height:10px;color:#444d56;vertical-align:middle;background-color:#fafbfc;border:1px solid #d1d5da;border-radius:3px;box-shadow:inset 0 -1px 0 #d1d5da}.markdown-body:after,.markdown-body:before{display:table;content:""}.markdown-body:after{clear:both}.markdown-body >:first-child{margin-top:0 !important}.markdown-body >:last-child{margin-bottom:0 !important}.markdown-body a:not([href]){color:inherit;text-decoration:none}.markdown-body blockquote,.markdown-body details,.markdown-body dl,.markdown-body ol,.markdown-body p,.markdown-body pre,.markdown-body table,.markdown-body ul{margin-top:0;margin-bottom:16px}.markdown-body hr{height:.25em;padding:0;margin:24px 0;background-color:#e1e4e8;border:0}.markdown-body blockquote{padding:0 1em;color:#6a737d;border-left:.25em solid #dfe2e5}.markdown-body blockquote >:first-child{margin-top:0}.markdown-body blockquote >:last-child{margin-bottom:0}.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{margin-top:24px;margin-bottom:16px;font-weight:600;line-height:1.25}.markdown-body h1{font-size:2em}.markdown-body h1,.markdown-body h2{padding-bottom:.3em;border-bottom:1px solid #eaecef}.markdown-body h2{font-size:1.5em}.markdown-body h3{font-size:1.25em}.markdown-body h4{font-size:1em}.markdown-body h5{font-size:.875em}.markdown-body h6{font-size:.85em;color:#6a737d}.markdown-body ol,.markdown-body ul{padding-left:2em}.markdown-body ol ol,.markdown-body ol ul,.markdown-body ul ol,.markdown-body ul ul{margin-top:0;margin-bottom:0}.markdown-body li{word-wrap:break-all}.markdown-body li > p{margin-top:16px}.markdown-body li + li{margin-top:.25em}.markdown-body dl{padding:0}.markdown-body dl dt{padding:0;margin-top:16px;font-size:1em;font-style:italic;font-weight:600}.markdown-body dl dd{padding:0 16px;margin-bottom:16px}.markdown-body table{display:block;width:100%;overflow:auto}.markdown-body table th{font-weight:600}.markdown-body table td,.markdown-body table th{padding:6px 13px;border:1px solid #dfe2e5}.markdown-body table tr{background-color:#fff;border-top:1px solid #c6cbd1}.markdown-body table tr:nth-child(2n){background-color:#f6f8fa}.markdown-body img{max-width:100%;box-sizing:initial;background-color:#fff}.markdown-body img[align=right]{padding-left:20px}.markdown-body img[align=left]{padding-right:20px}.markdown-body code{padding:.2em .4em;margin:0;font-size:85%;background-color:rgba(27,31,35,.05);border-radius:3px}.markdown-body pre{word-wrap:normal}.markdown-body pre > code{padding:0;margin:0;font-size:100%;word-break:normal;white-space:pre;background:0 0;border:0}.markdown-body .highlight{margin-bottom:16px}.markdown-body .highlight pre{margin-bottom:0;word-break:normal}.markdown-body .highlight pre,.markdown-body pre{padding:16px;overflow:auto;font-size:85%;line-height:1.45;background-color:#f6f8fa;border-radius:3px}.markdown-body pre code{display:inline;max-width:auto;padding:0;margin:0;overflow:visible;line-height:inherit;word-wrap:normal;background-color:initial;border:0}.markdown-body .commit-tease-sha{display:inline-block;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-size:90%;color:#444d56}.markdown-body .full-commit .btn-outline:not(:disabled):hover{color:#005cc5;border-color:#005cc5}.markdown-body .blob-wrapper{overflow-x:auto;overflow-y:hidden}.markdown-body .blob-wrapper-embedded{max-height:240px;overflow-y:auto}.markdown-body .blob-num{width:1%;min-width:50px;padding-right:10px;padding-left:10px;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-size:12px;line-height:20px;color:rgba(27,31,35,.3);text-align:right;white-space:nowrap;vertical-align:top;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.markdown-body .blob-num:hover{color:rgba(27,31,35,.6)}.markdown-body .blob-num:before{content:attr(data-line-number)}.markdown-body .blob-code{position:relative;padding-right:10px;padding-left:10px;line-height:20px;vertical-align:top}.markdown-body .blob-code-inner{overflow:visible;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-size:12px;color:#24292e;word-wrap:normal;white-space:pre}.markdown-body .pl-token.active,.markdown-body .pl-token:hover{cursor:pointer;background:#ffea7f}.markdown-body .tab-size[data-tab-size="1"]{-moz-tab-size:1;tab-size:1}.markdown-body .tab-size[data-tab-size="2"]{-moz-tab-size:2;tab-size:2}.markdown-body .tab-size[data-tab-size="3"]{-moz-tab-size:3;tab-size:3}.markdown-body .tab-size[data-tab-size="4"]{-moz-tab-size:4;tab-size:4}.markdown-body .tab-size[data-tab-size="5"]{-moz-tab-size:5;tab-size:5}.markdown-body .tab-size[data-tab-size="6"]{-moz-tab-size:6;tab-size:6}.markdown-body .tab-size[data-tab-size="7"]{-moz-tab-size:7;tab-size:7}.markdown-body .tab-size[data-tab-size="8"]{-moz-tab-size:8;tab-size:8}.markdown-body .tab-size[data-tab-size="9"]{-moz-tab-size:9;tab-size:9}.markdown-body .tab-size[data-tab-size="10"]{-moz-tab-size:10;tab-size:10}.markdown-body .tab-size[data-tab-size="11"]{-moz-tab-size:11;tab-size:11}.markdown-body .tab-size[data-tab-size="12"]{-moz-tab-size:12;tab-size:12}.markdown-body .task-list-item{list-style-type:none}.markdown-body .task-list-item + .task-list-item{margin-top:3px}.markdown-body .task-list-item input{margin:0 .2em .25em -1.6em;vertical-align:middle}.markdown-body pre code,.item-content pre code,.markdown-body pre .subst,.item-content pre .subst,.markdown-body pre .tag .title,.item-content pre .tag .title,.markdown-body pre .lisp .title,.item-content pre .lisp .title,.markdown-body pre .clojure .built_in,.item-content pre .clojure .built_in,.markdown-body pre .nginx .title,.item-content pre .nginx .title{color:black}.markdown-body pre .string,.item-content pre .string,.markdown-body pre .title,.item-content pre .title,.markdown-body pre .constant,.item-content pre .constant,.markdown-body pre .parent,.item-content pre .parent,.markdown-body pre .tag .value,.item-content pre .tag .value,.markdown-body pre .rules .value,.item-content pre .rules .value,.markdown-body pre .rules .value .number,.item-content pre .rules .value .number,.markdown-body pre .preprocessor,.item-content pre .preprocessor,.markdown-body pre .ruby .symbol,.item-content pre .ruby .symbol,.markdown-body pre .ruby .symbol .string,.item-content pre .ruby .symbol .string,.markdown-body pre .aggregate,.item-content pre .aggregate,.markdown-body pre .template_tag,.item-content pre .template_tag,.markdown-body pre .django .variable,.item-content pre .django .variable,.markdown-body pre .smalltalk .class,.item-content pre .smalltalk .class,.markdown-body pre .addition,.item-content pre .addition,.markdown-body pre .flow,.item-content pre .flow,.markdown-body pre .stream,.item-content pre .stream,.markdown-body pre .bash .variable,.item-content pre .bash .variable,.markdown-body pre .apache .tag,.item-content pre .apache .tag,.markdown-body pre .apache .cbracket,.item-content pre .apache .cbracket,.markdown-body pre .tex .command,.item-content pre .tex .command,.markdown-body pre .tex .special,.item-content pre .tex .special,.markdown-body pre .erlang_repl .function_or_atom,.item-content pre .erlang_repl .function_or_atom,.markdown-body pre .markdown .header,.item-content pre .markdown .header{color:#df5000}.markdown-body pre .comment,.item-content pre .comment,.markdown-body pre .annotation,.item-content pre .annotation,.markdown-body pre .template_comment,.item-content pre .template_comment,.markdown-body pre .diff .header,.item-content pre .diff .header,.markdown-body pre .chunk,.item-content pre .chunk,.markdown-body pre .markdown .blockquote,.item-content pre .markdown .blockquote{color:#888}.markdown-body pre .number,.item-content pre .number,.markdown-body pre .date,.item-content pre .date,.markdown-body pre .regexp,.item-content pre .regexp,.markdown-body pre .literal,.item-content pre .literal,.markdown-body pre .smalltalk .symbol,.item-content pre .smalltalk .symbol,.markdown-body pre .smalltalk .char,.item-content pre .smalltalk .char,.markdown-body pre .go .constant,.item-content pre .go .constant,.markdown-body pre .change,.item-content pre .change,.markdown-body pre .markdown .bullet,.item-content pre .markdown .bullet,.markdown-body pre .markdown .link_url,.item-content pre .markdown .link_url{color:#080}.markdown-body pre .label,.item-content pre .label,.markdown-body pre .javadoc,.item-content pre .javadoc,.markdown-body pre .ruby .string,.item-content pre .ruby .string,.markdown-body pre .decorator,.item-content pre .decorator,.markdown-body pre .filter .argument,.item-content pre .filter .argument,.markdown-body pre .localvars,.item-content pre .localvars,.markdown-body pre .array,.item-content pre .array,.markdown-body pre .attr_selector,.item-content pre .attr_selector,.markdown-body pre .important,.item-content pre .important,.markdown-body pre .pseudo,.item-content pre .pseudo,.markdown-body pre .pi,.item-content pre .pi,.markdown-body pre .doctype,.item-content pre .doctype,.markdown-body pre .deletion,.item-content pre .deletion,.markdown-body pre .envvar,.item-content pre .envvar,.markdown-body pre .shebang,.item-content pre .shebang,.markdown-body pre .apache .sqbracket,.item-content pre .apache .sqbracket,.markdown-body pre .nginx .built_in,.item-content pre .nginx .built_in,.markdown-body pre .tex .formula,.item-content pre .tex .formula,.markdown-body pre .erlang_repl .reserved,.item-content pre .erlang_repl .reserved,.markdown-body pre .prompt,.item-content pre .prompt,.markdown-body pre .markdown .link_label,.item-content pre .markdown .link_label,.markdown-body pre .vhdl .attribute,.item-content pre .vhdl .attribute,.markdown-body pre .clojure .attribute,.item-content pre .clojure .attribute,.markdown-body pre .coffeescript .property,.item-content pre .coffeescript .property{color:#88f}.markdown-body pre .keyword,.item-content pre .keyword{color:#48b;font-weight:bold}.markdown-body pre .title,.item-content pre .title{color:#454545}.markdown-body pre .markdown .emphasis,.item-content pre .markdown .emphasis,.markdown-body pre .comment,.item-content pre .comment{font-style:italic}.markdown-body pre .nginx .built_in,.item-content pre .nginx .built_in{font-weight:normal}.markdown-body pre .coffeescript .javascript,.item-content pre .coffeescript .javascript,.markdown-body pre .javascript .xml,.item-content pre .javascript .xml,.markdown-body pre .tex .formula,.item-content pre .tex .formula,.markdown-body pre .xml .javascript,.item-content pre .xml .javascript,.markdown-body pre .xml .vbscript,.item-content pre .xml .vbscript,.markdown-body pre .xml .css,.item-content pre .xml .css,.markdown-body pre .xml .cdata,.item-content pre .xml .cdata{opacity:0.5}.markdown-body ul,.item-content ul{margin:0.5em 0;padding:0 0 0 2em}.markdown-body ul li,.item-content ul li{list-style:disc}.hljs{display:block;overflow-x:auto;padding:0.5em;color:#333;background:#f8f8f8;}.hljs-comment,.hljs-quote{color:#998;font-style:italic;}.hljs-keyword,.hljs-selector-tag,.hljs-subst{color:#333;font-weight:bold;}.hljs-number,.hljs-literal,.hljs-variable,.hljs-template-variable,.hljs-tag .hljs-attr{color:#008080;}.hljs-string,.hljs-doctag{color:#d14;}.hljs-title,.hljs-section,.hljs-selector-id{color:#900;font-weight:bold;}.hljs-subst{font-weight:normal;}.hljs-type,.hljs-class .hljs-title{color:#458;font-weight:bold;}.hljs-tag,.hljs-name,.hljs-attribute{color:#000080;font-weight:normal;}.hljs-regexp,.hljs-link{color:#009926;}.hljs-symbol,.hljs-bullet{color:#990073;}.hljs-built_in,.hljs-builtin-name{color:#0086b3;}.hljs-meta{color:#999;font-weight:bold;}.hljs-deletion{background:#fdd;}.hljs-addition{background:#dfd;}.hljs-emphasis{font-style:italic;}.hljs-strong{font-weight:bold;}`,

    printCss: `@page{size:5.5in 8.5in;margin:70pt 60pt 70pt;}@page:first{size:5.5in 8.5in;margin:0;}img{max-width:100%;}div.frontcover{page:cover;content:url("images/cover.png");width:100%;height:100%;}@page:right{@bottom-left{margin:10pt 0 30pt 0;border-top:.25pt solid #666;content:"Our Cats";font-size:9pt;color:#333;}@bottom-right{margin:10pt 0 30pt 0;border-top:.25pt solid #666;content:counter(page);font-size:9pt;}@top-right{content:string(doctitle);margin:30pt 0 10pt 0;font-size:9pt;color:#333;}}@page:left{@bottom-right{margin:10pt 0 30pt 0;border-top:.25pt solid #666;content:"Our Cats";font-size:9pt;color:#333;}@bottom-left{margin:10pt 0 30pt 0;border-top:.25pt solid #666;content:counter(page);font-size:9pt;}}@page:first{@bottom-right{content:normal;margin:0;}@bottom-left{content:normal;margin:0;}}body{counter-reset:chapternum figurenum;font-family:"Trebuchet MS","Lucida Grande","Lucida Sans Unicode","Lucida Sans",Tahoma,sans-serif;line-height:1.5;font-size:11pt;}h1{string-set:doctitle content();page-break-before:always;counter-reset:figurenum;counter-reset:footnote;line-height:1.3;}h1.chapter:before{counter-increment:chapternum;content:counter(chapternum) ". ";}figcaption:before{counter-increment:figurenum;content:counter(chapternum) "-" counter(figurenum) ". ";}.fn{float:footnote;}.fn{counter-increment:footnote;}.fn::footnote-call{content:counter(footnote);font-size:9pt;vertical-align:super;line-height:none;}.fn::footnote-marker{font-weight:bold;}@page{@footnotes{border-top:0.6pt solid black;padding-top:8pt;}}h1,h2,h3,h4,h5{font-weight:bold;page-break-after:avoid;page-break-inside:avoid;}h1+p,h2+p,h3+p{page-break-before:avoid;}table,figure{page-break-inside:avoid;}ul.toc{list-style:none;margin:0;padding:0;}ul.toc a::after{content:leader('.') target-counter(attr(href),page);}ul.toc li{line-height:2;}ul.toc li a{text-decoration:none;}a{color:#000;}a.xref:after{content:" (page " target-counter(attr(href,url),page) ")";}`,
};