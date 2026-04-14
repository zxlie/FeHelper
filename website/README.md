# FeHelper 官网

这是 FeHelper Chrome/Edge/Firefox 浏览器扩展的官方网站（v2026.04）。

## 项目特点

- 🎨 **现代化设计**: 采用渐变色彩和流畅动画，展现"重磅发布"的视觉效果
- 📱 **完全响应式**: 适配各种设备屏幕，提供一致的用户体验
- ⚡ **性能优化**: 使用系统字体，无外部字体依赖，加载速度极快
- 🎯 **功能直观**: 通过HTML+CSS可视化展示各工具功能，无需截图
- 🔗 **实时数据**: 自动获取GitHub的stars和forks数据
- 🌏 **国内友好**: 所有资源均可在国内环境正常访问

## 技术实现

### 字体策略
- **系统字体栈**: 使用高质量的系统字体，包含中英文完整支持
- **字体回退**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif`
- **无外部依赖**: 完全避免Google Fonts等外部字体服务，确保国内访问稳定

### 可视化演示
- **JSON工具**: 代码高亮显示
- **差异对比**: 颜色标识增删改
- **代码压缩**: 动态显示压缩率
- **二维码**: CSS绘制二维码图案
- **API调试**: 模拟请求响应状态

### 交互效果
- **标签切换**: 工具分类展示
- **滚动动画**: Intersection Observer API
- **悬停效果**: 3D变换和阴影
- **视差滚动**: 背景图案动画
- **计数动画**: GitHub数据动效

## 文件结构

```
website/
├── index.html              # 首页落地页
├── docs.html               # 文档中心
├── privacy-policy.html     # 隐私政策（中英双语）
├── llms.txt                # LLM/爬虫站点说明
├── static/
│   ├── css/
│   │   ├── style.css       # 全站主样式
│   │   └── docs.css        # 文档页样式
│   ├── js/
│   │   ├── script.js       # 首页交互脚本
│   │   ├── docs.js         # 文档页脚本
│   │   └── hotfix.json     # 推广位元数据
│   ├── img/                # 图标资源
│   └── screenshot/         # 工具截图
├── docs/                   # Markdown工具文档（30+篇）
└── README.md               # 项目说明
```

## 本地开发

1. 克隆项目到本地
2. 进入website目录
3. 启动本地服务器：
   ```bash
   python3 -m http.server 8000
   ```
4. 打开浏览器访问 `http://localhost:8000`

## 浏览器支持

- Chrome 60+
- Edge 79+
- Firefox 60+
- Safari 12+

## 部署

可以部署到任何静态网站托管服务：
- GitHub Pages
- Netlify
- Vercel
- 腾讯云静态网站托管
- 阿里云OSS静态网站

## 更新记录

### v3.0 (2026-04-13)
- 全面更新首页内容，新增"v2026.04 新版亮点"和"数据与信任"区块
- 同步 32+ 工具信息：UUID/ID 生成器、条形码、Gzip、FILETIME、BigInt 精度
- 更新工具分类：思维导图移至效率类，UUID 加入计算类
- 新增 UUID/ID 生成器文档 (docs/uuid-gen.md)
- 更新 QR code / en-decode / timestamp / trans-radix 文档反映新功能
- privacy-policy.html 添加顶部导航栏
- 全站 copyright 更新为 2011-2026
- llms.txt 完整重写，包含全部 32+ 工具索引
- docs.js 工具分类与首页同步
- SEO 优化：更新 meta、OG、Twitter Card、keywords

### v2.2 (2024-12-19)
- 📊 更新真实数据：GitHub 5.3K stars, Chrome Store 200K+ 用户
- 🦊 新增 Firefox 浏览器支持和下载选项
- 📖 添加"关于FeHelper"时间线

### v2.0 (2024-12-19)
- ✅ 移除 Google Fonts 依赖，改用系统字体
- ✅ 优化国内访问体验

### v1.0 (2024-12-19)
- 🎉 初始版本发布

## 许可证

MIT License - 详见 LICENSE 文件 