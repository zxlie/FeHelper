// FeHelper 服务端主入口
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { mongoUri } = require('./models/config');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'fehelper-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// 注册API路由（必须在静态资源之前）
app.use('/api/admin', require('./api/admin'));
app.use('/api/track', require('./api/track'));

// 静态资源
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 连接MongoDB
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB连接成功');
}).catch(err => {
    console.error('MongoDB连接失败:', err);
});

// 健康检查
app.get('/api/ping', (req, res) => {
    res.send('pong');
});


app.listen(PORT, () => {
    console.log(`FeHelper统计服务已启动，端口：${PORT}`);
}); 