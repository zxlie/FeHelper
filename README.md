# FeHelper - 前端助手

<div align="center">

![FeHelper Logo](https://user-images.githubusercontent.com/865735/75407628-7399c580-594e-11ea-8ef2-00adf39d61a8.jpg)

**面向开发者、测试、运营和效率用户的浏览器工具箱**

**30+ 常用工具 · Chrome / Edge / Firefox 扩展 · Manifest V3 · 2012 至今持续维护**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/pkgccpejnmalmdinmhkkfafefagiiiad?label=Chrome&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/pkgccpejnmalmdinmhkkfafefagiiiad?label=Users&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![GitHub Stars](https://img.shields.io/github/stars/zxlie/FeHelper?style=for-the-badge&color=8b5cf6&logo=github)](https://github.com/zxlie/FeHelper)
[![CI](https://img.shields.io/github/actions/workflow/status/zxlie/FeHelper/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white)](https://github.com/zxlie/FeHelper/actions)
[![License](https://img.shields.io/github/license/zxlie/FeHelper?style=for-the-badge&color=10b981)](LICENSE)

**[English](README_EN.md) | [日本語](README_JA.md) | [한국어](README_KO.md)**

[官网](https://fehelper.com) · [在线文档](https://fehelper.com/docs.html) · [Chrome 商店](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad) · [问题反馈](https://github.com/zxlie/FeHelper/issues) · [观看 20 秒介绍视频](https://raw.githubusercontent.com/zxlie/FeHelper/master/website/static/video/fehelper-promo.mp4)

[![FeHelper 20 秒介绍视频](website/static/video/fehelper-promo.gif)](https://raw.githubusercontent.com/zxlie/FeHelper/master/website/static/video/fehelper-promo.mp4)

</div>

---

## 项目简介

FeHelper 是一个集成式浏览器开发者工具箱，目标是把日常高频的小工具集中到一个扩展里：JSON 格式化、编解码、时间戳、二维码、代码美化、正则、接口调试、WebSocket、网页截图、取色、Mock 数据、油猴脚本、图表、海报、AI 助手等都可以按需启用。

适合这些场景：

- 接口联调：JSON 自动美化、JSON Diff、简易 Postman、WebSocket 调试。
- 数据处理：编解码、Excel 转 JSON、Mock 数据、进制转换、时间戳转换。
- 页面调试：网页截屏、页面取色、栅格标尺、页面性能分析、油猴脚本注入。
- 内容生成：二维码、条形码、UUID / 雪花 ID、图表制作、海报快速生成。
- 日常效率：随机密码、便签笔记、HTML 转 Markdown、AI 助手。

---

## 功能矩阵

### JSON 与数据处理

| 工具 | 能力 |
| --- | --- |
| JSON 美化工具 | 页面自动检测并格式化、手动格式化、语法高亮、折叠展开、排序、乱码修正、BigInt 精度无损、嵌套转义解析、皮肤定制、复制/下载 |
| JSON 比对工具 | 两段 JSON 结构化比较，标记新增、删除、修改差异 |
| Excel 转 JSON | 将 Excel / CSV 数据转换为 JSON、XML、MySQL、PHP 等结构 |
| 数据 Mock 工具 | 生成姓名、手机号、身份证、地址、公司、技术字段等测试数据 |
| 图表制作工具 | 制作柱状图、折线图、饼图等常用可视化图表，并支持导出图片 |

### 编解码与转换

| 工具 | 能力 |
| --- | --- |
| 信息编码转换 | Unicode、UTF-8、UTF-16、URL、Base64、MD5、SHA1、Hex、Gzip、JWT、Cookie、HTML 实体、字符串转义/去转义 |
| 时间戳转换 | Unix 秒/毫秒与日期互转、世界时区、Windows FILETIME 互转 |
| 时间戳计算器 | 智能解析多种时间格式、代码生成、时间计算、批量转换、时区转换、数据库格式生成、模拟时区解析 |
| 进制转换工具 | 2 到 36 进制任意互转，支持 BigInt 超大整数无损转换 |
| 颜色转换工具 | HEX、RGB、RGBA、HSL、HSV 等颜色格式互转 |
| Crontab 工具 | 生成、编辑和解释 Crontab 表达式 |
| 贷(还)款利率 | 贷款还款计划、实际利率反推 |

### 开发与调试

| 工具 | 能力 |
| --- | --- |
| 代码美化工具 | JavaScript、CSS、HTML、XML、SQL 格式化 |
| 代码压缩工具 | HTML、JavaScript、CSS 压缩 |
| 正则公式速查 | 常用正则模板、实时匹配和替换测试 |
| 简易 Postman | GET / POST / HEAD 请求调试，支持 JSON 结果格式化 |
| WebSocket 工具 | WebSocket 连接测试、消息发送、结果分析 |
| 网页油猴工具 | 配置页面匹配规则、注入脚本和样式、导入/导出 `.user.js`、运行日志、`@require` 支持 |
| FH 开发者工具 | 本地开发并集成自定义工具到 FeHelper 工具市场 |
| AI 智能助手 | 写代码、改代码、方案设计、资料查找和分析 |

### 页面与图像工具

| 工具 | 能力 |
| --- | --- |
| 二维码 / 解码 | 生成二维码，支持 Logo、颜色、尺寸；支持截图粘贴解码 |
| 条形码 | Code128、Code39、EAN-13、EAN-8、UPC、ITF-14 |
| 图片转 Base64 | 图片链接、截图、文件与 Base64 互转 |
| 网页截屏工具 | 可视区域截屏、全页滚动截屏、结果预览和保存 |
| 页面取色工具 | 从网页任意元素采集颜色 |
| SVG 转为图片 | SVG 转 PNG / JPG / WebP，支持自定义尺寸、拖放、URL 导入 |
| 网页栅格标尺 | 页面横纵标尺，辅助检查布局对齐 |
| 网站性能优化 | 页面性能指标、资源加载、内存、长任务监控和优化建议 |

### 生产力工具

| 工具 | 能力 |
| --- | --- |
| UUID / ID 生成器 | UUID v4、Twitter Snowflake 风格雪花 ID、NanoID，支持雪花 ID 字段解析 |
| 随机密码生成 | 自定义长度、数字、大小写字母、特殊符号 |
| 我的便签笔记 | 分类目录管理、自动保存、导入导出 |
| Markdown 转换 | Markdown 编写/预览、HTML 转 Markdown、PDF 下载 |
| 海报快速生成 | 多模板海报制作，支持文字、图片、配色和导出 |
| 便捷思维导图 | 轻量思维导图，支持自动保存、导入导出、图片下载 |

---

## 最近更新

### v2026.04 重点改进

| 类型 | 内容 |
| --- | --- |
| 新工具 | 条形码生成、UUID / 雪花 ID / NanoID、时间戳计算器、SVG 转图片、图表制作、海报快速生成 |
| JSON | BigInt 精度无损、嵌套转义解析、JSON 自动美化重复内容修复、格式化容器重复挂载保护 |
| 时间 | Windows FILETIME 互转、时间戳计算器模拟时区解析、时区转换增强 |
| 油猴 | `.user.js` 导入导出、`@all-frames` 解析修复、frame 精准注入、运行日志诊断 |
| 海报 | 检测到的模板硬编码文字可在编辑面板修改，修复底部最后一行无法调整 |
| 安全 | 替换不安全动态执行路径、修复 Toast / innerHTML XSS 风险、代码美化 fileType 白名单 |
| 稳定性 | Service Worker 休眠处理、Content Script 注入策略优化、Google Meet 等站点兼容修复 |
| 工程化 | Vitest 单元测试、GitHub Actions CI、ESLint、Babel target 升级、依赖和死代码清理 |

当前测试覆盖：

```bash
npm test
# 2 test files, 79 tests
```

---

## 安装

### 浏览器商店安装

| 浏览器 | 地址 |
| --- | --- |
| Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Edge | [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/fehelper%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/fehelper-%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/) |

### 源码安装

```bash
git clone https://github.com/zxlie/FeHelper.git
cd FeHelper
npm install
npm test
npm run build
```

Chrome / Edge 本地加载：

1. 打开 `chrome://extensions/` 或 `edge://extensions/`。
2. 开启「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择仓库中的 `apps` 目录。

### 离线安装

可以前往 [Chrome-Stats](https://chrome-stats.com/d/pkgccpejnmalmdinmhkkfafefagiiiad) 下载 CRX / ZIP，然后在浏览器扩展页面拖拽安装。

---

## 开发

### 常用命令

```bash
npm install           # 安装依赖
npm test              # 运行 Vitest 单元测试
npm run test:watch    # 测试监听模式
npm run test:coverage # 覆盖率报告
npm run build         # 打包 Chrome 扩展
npx eslint apps/      # 代码规范检查
```

### 项目结构

```text
FeHelper/
├── apps/                    # 扩展源码
│   ├── manifest.json        # Chrome Extension Manifest V3 清单
│   ├── background/          # Service Worker、工具注册、菜单、统计、注入逻辑
│   ├── popup/               # 扩展弹出面板
│   ├── options/             # 设置页与工具市场
│   ├── json-format/         # JSON 美化
│   ├── json-diff/           # JSON 比对
│   ├── en-decode/           # 编解码
│   ├── datetime-calc/       # 时间戳计算器
│   ├── timestamp/           # 旧版时间戳转换
│   ├── page-monkey/         # 网页油猴工具
│   ├── poster-maker/        # 海报快速生成
│   ├── chart-maker/         # 图表制作
│   ├── svg-converter/       # SVG 转图片
│   ├── uuid-gen/            # UUID / 雪花 ID / NanoID
│   └── ...                  # 其他工具
├── website/                 # 官网与文档站点
├── test/                    # Vitest 单元测试
├── .github/workflows/       # GitHub Actions
├── gulpfile.js              # 打包任务
├── vitest.config.js         # 测试配置
├── eslint.config.js         # ESLint 配置
└── package.json
```

### 新增工具建议

新增工具时，建议同时补齐：

1. `apps/<tool-name>/index.html`
2. `apps/<tool-name>/index.css`
3. `apps/<tool-name>/index.js`
4. `apps/background/tools.js` 中的工具注册
5. `website/docs/<tool-name>.md` 中的文档
6. 必要的单元测试或手动验证说明

---

## 兼容性

| 项目 | 说明 |
| --- | --- |
| 扩展规范 | Chrome Extension Manifest V3 |
| 主要浏览器 | Chrome、Edge、Firefox |
| 构建目标 | 现代 Chromium 内核，Babel target 已升级到 Chrome 100 |
| 权限 | `tabs`、`scripting`、`contextMenus`、`storage`、`webNavigation`、`notifications` 等 |
| 数据存储 | 主要使用浏览器本地存储，不依赖远程账号系统 |

部分功能依赖浏览器能力和站点权限，例如截图、取色、油猴注入、CompressionStream、WebSocket 等；在浏览器限制页面、Chrome Web Store 页面、部分 CSP 严格站点上可能有功能边界。

---

## 贡献

欢迎提交 Issue 和 Pull Request。为了便于维护，请尽量提供清晰的复现信息：

- 浏览器类型和版本。
- FeHelper 版本。
- 问题发生的工具名称。
- 输入样例、目标页面 URL 或截图。
- 期望结果和实际结果。
- 控制台报错或运行日志。

贡献流程：

1. Fork 本仓库。
2. 创建分支：`git checkout -b feature/your-feature`。
3. 修改代码并运行 `npm test`、必要时运行 `npm run build`。
4. 提交更改：`git commit -m "feat: add your feature"`。
5. 推送分支并创建 Pull Request。

---

## 联系与反馈

- 官网：[fehelper.com](https://fehelper.com)
- 在线文档：[fehelper.com/docs.html](https://fehelper.com/docs.html)
- 邮箱：xianliezhao@foxmail.com
- 微信：398824681
- 问题反馈：[GitHub Issues](https://github.com/zxlie/FeHelper/issues)

## 许可证

[MIT License](LICENSE)

---

<div align="center">

**如果 FeHelper 对你有帮助，欢迎给一个 Star。**

[![Star History Chart](https://api.star-history.com/svg?repos=zxlie/FeHelper&type=Date)](https://star-history.com/#zxlie/FeHelper&Date)

</div>
