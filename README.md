# FeHelper - 前端助手

<div align="center">

![FeHelper Logo](https://user-images.githubusercontent.com/865735/75407628-7399c580-594e-11ea-8ef2-00adf39d61a8.jpg)

**30+ 开发者工具集 | Chrome / Edge / Firefox 浏览器扩展**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/pkgccpejnmalmdinmhkkfafefagiiiad?label=Chrome&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/pkgccpejnmalmdinmhkkfafefagiiiad?label=Users&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![GitHub Stars](https://img.shields.io/github/stars/zxlie/FeHelper?style=for-the-badge&color=8b5cf6&logo=github)](https://github.com/zxlie/FeHelper)
[![开发历史](https://img.shields.io/badge/since-2012-f59e0b?style=for-the-badge&logo=calendar&logoColor=white)](https://github.com/zxlie/FeHelper)
[![CI](https://img.shields.io/github/actions/workflow/status/zxlie/FeHelper/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white)](https://github.com/zxlie/FeHelper/actions)

**[English](README_EN.md) | [日本語](README_JA.md) | [한국어](README_KO.md)**

[官网](https://fehelper.com) · [在线文档](https://fehelper.com/docs.html) · [问题反馈](https://github.com/zxlie/FeHelper/issues)

</div>

---

## 功能一览

### JSON 处理
| 功能 | 说明 |
|------|------|
| JSON 格式化 | 自动/手动格式化、语法高亮、折叠展开、节点路径、BigInt 精度无损 |
| JSON 对比 | 两段 JSON 结构化差异对比，高亮显示差异项 |
| JSON 转 Excel | JSON 数据一键转 Excel 表格 |

### 编解码
| 功能 | 说明 |
|------|------|
| Unicode | 中文 ↔ `\uXXXX` 互转 |
| URL / UTF-8 / UTF-16 | `%XX` / `\xXX` 编解码 |
| Base64 | 编码与解码 |
| Hex | 字符串 ↔ 十六进制 |
| MD5 / SHA1 | 摘要计算 |
| Gzip | 基于 CompressionStream API 的压缩/解压 |
| JWT | Header + Payload + Sign 解码 |
| Cookie | 格式化为 JSON |
| HTML 实体 | 普通/深度编码与解码 |
| 字符串转义 | `\n` `\t` `\"` 等转义/去转义 |

### 开发调试
| 功能 | 说明 |
|------|------|
| 代码美化 | JavaScript / CSS / HTML / XML / SQL 代码格式化 |
| 代码压缩 | HTML / JS / CSS 压缩 |
| 正则表达式 | 实时匹配与替换测试 |
| 简易 Postman | GET / POST / HEAD 接口调试 |
| WebSocket | WebSocket 连接测试与消息分析 |
| 油猴脚本 | 页面脚本注入 |

### 转换工具
| 功能 | 说明 |
|------|------|
| 时间戳转换 | Unix ↔ 日期互转、多时区世界时钟、Windows FILETIME 互转 |
| 进制转换 | 2/4/8/10/16 进制互转，BigInt 支持超大整数无损 |
| 颜色转换 | HEX / RGB / HSL / HSV 互转，支持透明度 |

### 图像与生成
| 功能 | 说明 |
|------|------|
| 二维码 | 生成（可选 Logo、颜色、尺寸）与扫码解码 |
| 条形码 | Code128 / Code39 / EAN-13 / EAN-8 / UPC / ITF-14 |
| UUID / ID 生成器 | UUID v4、雪花 ID（生成 + 解析）、NanoID |
| 图片 Base64 | 图片 ↔ Base64 编码互转 |
| 网页截屏 | 可视区域 / 全页滚动截屏 |
| 页面取色 | 采集任意元素色值 |
| SVG 转换 | SVG ↔ PNG 等格式转换 |

### 其他工具
| 功能 | 说明 |
|------|------|
| AI 助手 | 代码优化、方案设计、资料查找 |
| Mock 数据 | 生成姓名、手机、身份证、地址等测试数据 |
| 随机密码 | 自定义长度、字符类型 |
| 便签笔记 | 分类目录管理、导入导出 |
| Markdown 转换 | HTML → Markdown、PDF 下载 |
| 海报制作 | 多模板海报设计 |
| 图表制作 | 多种图表类型、数据可视化 |
| 页面性能 | 页面加载耗时分析 |

---

## 最近更新

### v2026.04 重大改进

**新功能**
- 条形码生成（Code128 / EAN-13 / UPC 等 6 种格式）
- UUID v4 / 雪花 ID / NanoID 生成器（全新工具页）
- Windows FILETIME ↔ 日期互转
- 字符串转义/去转义编解码
- 进制转换 BigInt 支持（超大整数无损）

**安全加固**
- 全项目 evalCore 动态执行替换为安全方案
- Toast / innerHTML XSS 注入修复
- Content Script 注入逻辑优化（`insertCSS` 替代误用 API）
- `_codeBeautify` fileType 白名单校验

**核心修复**
- JSON BigInt 精度无损处理（纯函数模块 `json-utils.js`）
- Service Worker 休眠问题（`chrome.alarms` 替代 `setTimeout`）
- Content Script 改为 `document_idle` + `all_frames: false`，修复谷歌会议等站点崩溃
- 时间戳 `0` 校验修复
- 代码美化 `let`/`const` 语法兼容

**工程化**
- 单元测试：Vitest + 79 个测试用例
- CI/CD：GitHub Actions 自动测试
- ESLint 代码规范
- 清理无效依赖、死代码
- Babel target Chrome 58 → 100

---

## 安装

### 浏览器商店（推荐）

| 浏览器 | 安装地址 |
|--------|----------|
| Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Edge | [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/fehelper%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/fehelper-%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/) |

### 源码安装

```bash
git clone https://github.com/zxlie/FeHelper.git
cd FeHelper
npm install
npm test        # 运行测试
```

打开 `chrome://extensions/` → 开启开发者模式 → 加载已解压的扩展程序 → 选择 `apps` 目录。

### 离线安装

前往 [Chrome-Stats](https://chrome-stats.com/d/pkgccpejnmalmdinmhkkfafefagiiiad) 下载 CRX 或 ZIP 文件，拖拽到 `chrome://extensions/` 页面安装。

---

## 开发

```bash
npm install          # 安装依赖
npm test             # 运行 Vitest 单元测试
npm run test:watch   # 测试监听模式
npm run test:coverage # 覆盖率报告
npx eslint apps/     # 代码规范检查
```

### 项目结构

```
FeHelper/
├── apps/                    # 扩展源码
│   ├── manifest.json        # Chrome Extension MV3 清单
│   ├── background/          # Service Worker
│   ├── popup/               # 弹出面板
│   ├── options/             # 设置页 + 工具市场
│   ├── json-format/         # JSON 格式化
│   ├── en-decode/           # 编解码
│   ├── timestamp/           # 时间戳
│   ├── trans-radix/         # 进制转换
│   ├── qr-code/             # 二维码 + 条形码
│   ├── uuid-gen/            # UUID / 雪花ID
│   ├── code-beautify/       # 代码美化
│   └── ...                  # 更多工具
├── test/                    # Vitest 单元测试
├── .github/workflows/       # CI/CD
├── vitest.config.js
├── eslint.config.js
└── package.json
```

### 贡献指南

1. Fork 本仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送：`git push origin feature/your-feature`
5. 创建 Pull Request

---

## 联系

- 官网：[fehelper.com](https://fehelper.com)
- 邮箱：xianliezhao@foxmail.com
- 微信：398824681
- 反馈：[GitHub Issues](https://github.com/zxlie/FeHelper/issues)

## 许可证

[MIT License](LICENSE)

---

<div align="center">

**如果 FeHelper 对你有帮助，请给一个 Star！**

[![Star History Chart](https://api.star-history.com/svg?repos=zxlie/FeHelper&type=Date)](https://star-history.com/#zxlie/FeHelper&Date)

</div>
