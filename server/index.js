// FeHelper 服务端主入口
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { mongoUri } = require('./config');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 连接MongoDB
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB连接成功');
}).catch(err => {
    console.error('MongoDB连接失败:', err);
});

// 定义埋点数据模型
const TrackSchema = new mongoose.Schema({
    event: String,
    userId: String,
    date: String,
    timestamp: Number,
    tool_name: String,
    previous_version: String,
    top_tools: String,
    // 客户端信息
    language: String,
    timezone: String,
    userAgent: String,
    platform: String,
    vendor: String,
    colorDepth: Number,
    screenWidth: Number,
    screenHeight: Number,
    deviceMemory: String,
    hardwareConcurrency: String,
    extensionVersion: String,
    networkType: String,
    downlink: String,
    rtt: String,
    online: Boolean,
    touchSupport: Boolean,
    cookieEnabled: Boolean,
    doNotTrack: String,
    appVersion: String,
    appName: String,
    product: String,
    vendorSub: String,
    screenOrientation: String,
    memoryJSHeapSize: String,
    timeOpened: Number
}, { timestamps: true });

const Track = mongoose.model('Track', TrackSchema);

// 埋点上报接口
app.post('/api/track', async (req, res) => {
    try {
        const data = req.body;
        await Track.create(data);
        res.json({ code: 0, msg: '上报成功' });
    } catch (err) {
        console.error('埋点上报失败:', err);
        res.status(500).json({ code: 1, msg: '上报失败' });
    }
});

// 健康检查
app.get('/api/ping', (req, res) => {
    res.send('pong');
});

// 加载管理后台API扩展
require('./api')(app);

app.listen(PORT, () => {
    console.log(`FeHelper统计服务已启动，端口：${PORT}`);
}); 