const express = require('express');
const router = express.Router();
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const Track = require('../models/track');

// 埋点上报接口
router.post('/', async (req, res) => {
    try {
        const body = req.body || {};
        const headers = req.headers || {};
        const userAgentStr = body.userAgent || headers['user-agent'] || '';
        const parser = new UAParser(userAgentStr);
        const uaResult = parser.getResult();

        // IP获取与地理位置解析
        let ip = body.IP || req.ip || headers['x-forwarded-for'] || '';
        if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
        if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
        const geo = geoip.lookup(ip) || {};

        // 设备类型判断
        const deviceType = uaResult.device.type || (uaResult.os.name && uaResult.os.name.match(/Android|iOS|iPhone|iPad/i) ? 'mobile' : 'desktop');

        // 只保留 TrackSchema 中定义的字段
        const data = {
            // 用户与会话
            userId: body.userId || '',

            // 事件与页面
            event: body.event || '',

            // 页面信息
            pageUrl: body.pageUrl || '',
            pageTitle: body.pageTitle || '',

            // 设备与环境
            userAgent: userAgentStr,
            browser: uaResult.browser.name || '',
            browserVersion: uaResult.browser.version || '',
            os: uaResult.os.name || '',
            osVersion: uaResult.os.version || '',
            deviceType: deviceType || '',
            deviceVendor: uaResult.device.vendor || '',
            deviceModel: uaResult.device.model || '',
            language: body.language || headers['accept-language'] || '',
            timezone: body.timezone || '',
            platform: body.platform || uaResult.os.name || '',

            // 网络与地理
            IP: ip,
            country: geo.country || '',
            province: geo.region || '',
            city: geo.city || '',
            online: typeof body.online === 'boolean' ? body.online : null,

            // 扩展相关
            extensionVersion: body.extensionVersion || '',
            previous_version: body.previous_version || '',
            tool_name: body.tool_name || '',
        };
        
        await Track.create(data);
        res.json({ code: 0, msg: '上报成功' });
    } catch (err) {
        console.error('埋点上报失败:', err);
        res.status(500).json({ code: 1, msg: '上报失败' });
    }
});

module.exports = router; 