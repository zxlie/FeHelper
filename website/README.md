# FeHelper 官网

这是 FeHelper Chrome/Edge 浏览器扩展的官方网站。

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
├── index.html              # 主页面 (498行)
├── css/
│   └── style.css          # 样式文件 (1267行)
├── js/
│   └── script.js          # 交互脚本 (394行)
├── img/                    # 图标资源
│   ├── favicon.ico         # 网站图标
│   ├── fe-16.png          # 16x16 FeHelper图标
│   ├── fe-48.png          # 48x48 FeHelper图标
│   └── fe-128.png         # 128x128 FeHelper图标
└── README.md              # 项目说明
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

### v2.2 (2024-12-19)
- 📊 更新真实数据：GitHub 5.3K stars, 1.3K forks, Chrome Store 200K+ 用户
- 🦊 新增Firefox浏览器支持和下载选项
- 📖 添加"关于FeHelper"时间线，展示13年发展历程
- 🔗 更新所有浏览器商店链接和评分数据
- ✨ 优化GitHub数据获取逻辑，提供真实默认值

### v2.1 (2024-12-19)
- 🎨 添加FeHelper官方图标到网站
- 🔖 更新favicon和多尺寸图标
- ✨ 替换导航栏、页脚、徽章等位置的图标
- 🚀 增强品牌视觉识别度

### v2.0 (2024-12-19)
- ✅ 移除Google Fonts依赖，改用系统字体
- ✅ 优化国内访问体验
- ✅ 提升页面加载速度
- ✅ 增强字体显示兼容性

### v1.0 (2024-12-19)
- 🎉 初始版本发布
- 🎨 现代化渐变设计
- 📱 响应式布局适配
- 🔧 功能工具可视化展示
- 📊 GitHub数据集成

## 许可证

MIT License - 详见 LICENSE 文件 