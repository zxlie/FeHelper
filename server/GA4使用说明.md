# FeHelper插件GA4数据统计使用指南

本文档将指导您如何配置和使用Google Analytics 4 (GA4)来跟踪FeHelper浏览器扩展的使用情况。

## 1. 创建GA4账户和配置

### 1.1 创建GA4属性
1. 访问[Google Analytics](https://analytics.google.com/)并登录您的Google账户
2. 创建一个新的GA4属性（如果没有的话）
3. 记录下您的测量ID（Measurement ID），通常格式为`G-XXXXXXXXXX`

### 1.2 获取API密钥
1. 在GA4管理界面中，进入`管理` > `数据流` > 选择您的网站/应用数据流
2. 在数据流详情页面中，找到`测量ID`和`API密钥`部分
3. 创建一个新的API密钥，设置一个容易记住的名称（如"FeHelper扩展")
4. 记录下生成的API密钥，这将用于授权数据发送

## 2. 配置FeHelper扩展使用GA4

在`apps/background/statistics.js`文件中，更新以下配置：

```javascript
// GA4测量ID - 替换为您自己的GA4测量ID
const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';
const GA4_API_SECRET = 'YOUR_API_SECRET';
```

请将`G-XXXXXXXXXX`替换为您的GA4测量ID，将`YOUR_API_SECRET`替换为您的API密钥。

## 3. 解决中国大陆访问GA的问题

由于中国大陆地区访问Google服务可能会受到限制，我们提供了一个代理服务器解决方案：

### 3.1 部署GA4代理服务器
1. 在您可以访问的服务器（如阿里云、腾讯云等）上部署`server/ga4-proxy.js`文件
2. 安装依赖：`npm install`
3. 启动服务：`npm start`

### 3.2 配置FeHelper使用代理服务器
在`apps/background/statistics.js`文件中，更新代理服务器URL：

```javascript
// 国内备用URL (替换为您的代理服务器地址)
const backupURL = `https://your-ga4-proxy.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;
```

请将`your-ga4-proxy.com`替换为您的代理服务器实际域名或IP地址。

## 4. 跟踪的事件类型

本实现会跟踪以下类型的事件：

| 事件名称 | 说明 | 参数 |
|---------|------|------|
| extension_loaded | 扩展启动 | extension_version |
| daily_active_user | 每日活跃用户 | date |
| extension_installed | 扩展安装 | - |
| extension_updated | 扩展更新 | previous_version |
| tool_used | 工具使用 | tool_name, date |
| usage_summary | 使用摘要 | top_tools |

## 5. 在GA4中查看数据

1. 登录GA4控制台
2. 浏览`实时`报告查看当前活跃用户
3. 在`报告`>`参与度`>`事件`中查看各类事件数据
4. 您可以创建自定义报告和探索查看特定数据

## 6. 隐私保护

为了保护用户隐私，我们收集的数据都是匿名的，不包含任何可以直接识别用户个人身份的信息。在隐私政策中，我们明确说明了所收集数据的类型和用途。

## 7. 注意事项

- GA4有免费使用额度限制，但对于一般规模的浏览器扩展通常足够
- 如果您的扩展用户数量非常大，可能需要考虑升级到付费版本
- 请确保在隐私政策中说明您收集的数据类型和用途
- 代理服务器需要定期维护，确保其正常运行 