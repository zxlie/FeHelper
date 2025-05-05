const express = require('express');
const router = express.Router();
const Track = require('../models/track'); // 引入Track模型

console.log('admin.js 已加载'); // 日志A

// admin 路由全局日志
router.use((req, res, next) => {
  console.log('admin 路由收到请求:', req.path);
  next();
});

// 累计用户、近一月用户、占比
router.get('/overview', async (req, res) => {
  try {
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 3600 * 1000;
    const todayStart = new Date().setHours(0, 0, 0, 0);

    // 使用 Promise.all 并行执行数据库查询
    const [totalUserIds, monthUserIds, todayActiveUserIds, estimatedTotalDocs, allEvents] = await Promise.all([
      Track.distinct('userId'),
      Track.distinct('userId', { createdAt: { $gte: new Date(monthAgo) } }),
      Track.distinct('userId', { createdAt: { $gte: new Date(todayStart) } }),
      Track.estimatedDocumentCount(),
      Track.distinct('event'),
    ]);

    const userCount = totalUserIds.length;
    const monthUserCount = monthUserIds.length;
    const todayActive = todayActiveUserIds.length;
    const eventCount = allEvents.length;

    res.json({
      total: estimatedTotalDocs,
      userCount: userCount,
      monthUserCount: monthUserCount,
      monthUserRate: userCount ? ((monthUserCount / userCount) * 100).toFixed(2) + '%' : '0%',
      todayActive: todayActive,
      eventCount: eventCount
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
});

// 浏览器类型和版本分布
router.get('/browser-distribution', async (req, res) => {
  const agg = await Track.aggregate([
    {
      $group: {
        _id: { browser: '$browser', version: '$browserVersion' },
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  res.json(agg);
});

// FeHelper版本分布
router.get('/fh-version-distribution', async (req, res) => {
  const agg = await Track.aggregate([
    {
      $group: {
        _id: '$extensionVersion',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  res.json(agg);
});

// 操作系统及版本分布
router.get('/os-distribution', async (req, res) => {
  const agg = await Track.aggregate([
    {
      $group: {
        _id: { os: '$os', version: '$osVersion' },
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  res.json(agg);
});

// 设备类型分布
router.get('/device-type-distribution', async (req, res) => {
  const agg = await Track.aggregate([
    {
      $group: {
        _id: '$deviceType',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  res.json(agg);
});

// 事件类型分布
router.get('/event-distribution', async (req, res) => {
  const agg = await Track.aggregate([
    {
      $group: {
        _id: '$event',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  res.json(agg);
});

// 国家、省份、城市分布
router.get('/user-distribution', async (req, res) => {
  const country = await Track.aggregate([
    {
      $group: {
        _id: '$country',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  const province = await Track.aggregate([
    {
      $group: {
        _id: '$province',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  const city = await Track.aggregate([
    {
      $group: {
        _id: '$city',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  res.json({ country, province, city });
});

// 工具使用排名
router.get('/tools', async (req, res) => {
  const agg = await Track.aggregate([
    {
      $group: {
        _id: '$tool_name',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  res.json(agg);
});

// 原始数据分页
router.get('/raw', async (req, res) => {
  const page = parseInt(req.query.page || 1);
  const pageSize = parseInt(req.query.pageSize || 20);
  const total = await Track.countDocuments();
  const list = await Track.find().sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize);
  res.json({ total, list });
});

// 用户画像（语言、平台、浏览器）
router.get('/users', async (req, res) => {
  const lang = await Track.aggregate([
    {
      $group: {
        _id: '$language',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  const platform = await Track.aggregate([
    {
      $group: {
        _id: '$os',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  const browser = await Track.aggregate([
    {
      $group: {
        _id: '$browser',
        pv: { $sum: 1 },
        userIds: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        _id: 1,
        pv: 1,
        uv: { $size: '$userIds' }
      }
    },
    { $sort: { pv: -1 } }
  ]);
  res.json({ lang, platform, browser });
});

// 事件趋势（最近30天）
router.get('/event-trend', async (req, res) => {
  const days = 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  const agg = await Track.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          userId: '$userId'
        },
        pv: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.day',
        uv: { $sum: 1 },
        pv: { $sum: '$pv' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(agg);
});

module.exports = router; 