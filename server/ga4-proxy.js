/**
 * FeHelper GA4代理服务器
 * 用于转发统计数据到GA4服务器，解决国内访问GA服务器被拦截问题
 */

const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST');
        return res.status(200).json({});
    }
    next();
});

// 代理GA4的收集端点
app.post('/mp/collect', async (req, res) => {
    try {
        const measurementId = req.query.measurement_id;
        const apiSecret = req.query.api_secret;
        
        if (!measurementId || !apiSecret) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        
        const gaUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
        
        // 记录请求数据但不保存敏感信息
        console.log(`[${new Date().toISOString()}] 代理请求到GA4: ${measurementId}`);
        
        // 转发请求到GA4
        const gaResponse = await fetch(gaUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        // 如果GA4返回成功，返回成功响应
        if (gaResponse.ok) {
            return res.status(200).json({ success: true });
        } else {
            // 如果GA4返回错误，返回错误响应
            const errorData = await gaResponse.text();
            return res.status(gaResponse.status).json({ 
                error: '转发到GA4失败', 
                status: gaResponse.status,
                details: errorData
            });
        }
    } catch (error) {
        console.error('代理请求失败:', error);
        res.status(500).json({ error: '代理服务器内部错误' });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`FeHelper GA4代理服务器运行在 http://localhost:${PORT}`);
}); 