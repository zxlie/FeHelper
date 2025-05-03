# FeHelper Server

本服务为FeHelper插件的数据统计与管理后台服务端，基于Node.js + Express + MongoDB。

## 安装依赖

```bash
cd server
npm install
```

## 启动服务

```bash
npm start
```

默认监听端口：3001

## 配置

MongoDB连接字符串在`config.js`中配置。

## 埋点上报接口

- POST `/api/track`
    - Content-Type: application/json
    - Body: 详见客户端埋点数据结构
    - 返回：`{ code: 0, msg: '上报成功' }`

## 健康检查

- GET `/api/ping`
    - 返回：pong

## 代码结构

- `index.js`：主服务入口，包含express服务、MongoDB连接、埋点接口
- `config.js`：MongoDB连接配置
- `api.js`：管理后台API扩展入口
- `package.json`：依赖管理 