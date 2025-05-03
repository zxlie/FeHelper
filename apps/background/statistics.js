/**
 * FeHelper数据统计模块
 * @author fehelper
 */

import Awesome from './awesome.js';

// 数据上报服务器地址
let manifest = chrome.runtime.getManifest();
let SERVER_TRACK_URL = '';
if (manifest.name && manifest.name.endsWith('-Dev')) {
    SERVER_TRACK_URL = 'http://localhost:3001/api/track';
} else {
    SERVER_TRACK_URL = 'https://chrome.fehelper.com/api/track';
}

// 用户ID存储键名
const USER_ID_KEY = 'FH_USER_ID';
// 上次使用日期存储键名
const LAST_ACTIVE_DATE_KEY = 'FH_LAST_ACTIVE_DATE';
// 用户日常使用数据存储键名
const USER_USAGE_DATA_KEY = 'FH_USER_USAGE_DATA';

// 记录background启动时间
const FH_TIME_OPENED = Date.now();

let Statistics = (function() {
    
    // 用户唯一标识
    let userId = '';
    
    // 今天的日期字符串 YYYY-MM-DD
    let todayStr = new Date().toISOString().split('T')[0];
    
    // 本地存储的使用数据
    let usageData = {
        dailyUsage: {}, // 按日期存储的使用记录
        tools: {}       // 各工具的使用次数
    };
    
    /**
     * 生成唯一的用户ID
     * @returns {string} 用户ID
     */
    const generateUserId = () => {
        return 'fh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    /**
     * 获取或创建用户ID
     * @returns {Promise<string>} 用户ID
     */
    const getUserId = async () => {
        if (userId) return userId;
        
        try {
            const result = await Awesome.StorageMgr.get(USER_ID_KEY);
            if (result) {
                userId = result;
            } else {
                userId = generateUserId();
                await Awesome.StorageMgr.set(USER_ID_KEY, userId);
            }
            return userId;
        } catch (error) {
            console.error('获取用户ID失败:', error);
            return generateUserId(); // 失败时生成临时ID
        }
    };
    
    /**
     * 加载本地存储的使用数据
     * @returns {Promise<void>}
     */
    const loadUsageData = async () => {
        try {
            const data = await Awesome.StorageMgr.get(USER_USAGE_DATA_KEY);
            if (data) {
                usageData = JSON.parse(data);
            }
        } catch (error) {
            console.error('加载使用数据失败:', error);
        }
    };
    
    /**
     * 保存使用数据到本地存储
     * @returns {Promise<void>}
     */
    const saveUsageData = async () => {
        try {
            await Awesome.StorageMgr.set(USER_USAGE_DATA_KEY, JSON.stringify(usageData));
        } catch (error) {
            console.error('保存使用数据失败:', error);
        }
    };
    
    /**
     * 获取客户端详细信息（仅background可用字段）
     * @returns {Object}
     */
    const getClientInfo = () => {
        return {
            extensionVersion: chrome.runtime.getManifest().version,
            timeOpened: FH_TIME_OPENED
        };
    };

    /**
     * 使用自建服务器发送事件数据
     * @param {string} eventName - 事件名称
     * @param {Object} params - 事件参数
     */
    const sendToServer = async (eventName, params = {}) => {
        const uid = await getUserId();
        const clientInfo = getClientInfo();
        // 合并background全局的FH_CLIENT_INFO
        let extraInfo = {};
        try {
            if (typeof chrome !== 'undefined' && chrome && chrome.runtime && chrome.runtime.getBackgroundPage) {
                await new Promise(resolve => {
                    chrome.runtime.getBackgroundPage(bg => {
                        if (bg && bg.FH_CLIENT_INFO) {
                            extraInfo = bg.FH_CLIENT_INFO;
                        }
                        resolve();
                    });
                });
            }
        } catch(e) {}
        const payload = {
            event: eventName,
            userId: uid,
            date: todayStr,
            timestamp: Date.now(),
            ...clientInfo,
            ...extraInfo,
            ...params
        };
        try {
            fetch(SERVER_TRACK_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                },
                keepalive: true
            }).catch(e => console.log('自建统计服务器发送失败:', e));
        } catch (error) {
            console.log('自建统计发送失败:', error);
        }
    };
    
    /**
     * 记录每日活跃用户
     * @returns {Promise<void>}
     */
    const recordDailyActiveUser = async () => {
        try {
            // 获取上次活跃日期
            const lastActiveDate = await Awesome.StorageMgr.get(LAST_ACTIVE_DATE_KEY);
            
            // 如果今天还没有记录，则记录今天的活跃
            if (lastActiveDate !== todayStr) {
                await Awesome.StorageMgr.set(LAST_ACTIVE_DATE_KEY, todayStr);
                
                // 确保该日期的记录存在
                if (!usageData.dailyUsage[todayStr]) {
                    usageData.dailyUsage[todayStr] = {
                        date: todayStr,
                        tools: {}
                    };
                }
                
                // 发送每日活跃记录到自建服务器
                sendToServer('daily_active_user', {
                    date: todayStr
                });
            }
        } catch (error) {
            console.error('记录日活跃用户失败:', error);
        }
    };
    
    /**
     * 记录插件安装事件
     */
    const recordInstallation = async () => {
        sendToServer('extension_installed');
    };
    
    /**
     * 记录插件更新事件
     * @param {string} previousVersion - 更新前的版本
     */
    const recordUpdate = async (previousVersion) => {
        sendToServer('extension_updated', {
            previous_version: previousVersion
        });
    };
    
    /**
     * 记录插件卸载事件
     */
    const recordUninstall = async () => {
        sendToServer('extension_uninstall');
    };
    
    /**
     * 记录工具使用情况
     * @param {string} toolName - 工具名称
     */
    const recordToolUsage = async (toolName, params = {}) => {
        // 确保今天的记录存在
        if (!usageData.dailyUsage[todayStr]) {
            usageData.dailyUsage[todayStr] = {
                date: todayStr,
                tools: {}
            };
        }
        
        // 增加工具使用计数
        if (!usageData.tools[toolName]) {
            usageData.tools[toolName] = 0;
        }
        usageData.tools[toolName]++;
        
        // 增加今天该工具的使用计数
        if (!usageData.dailyUsage[todayStr].tools[toolName]) {
            usageData.dailyUsage[todayStr].tools[toolName] = 0;
        }
        usageData.dailyUsage[todayStr].tools[toolName]++;
        
        // 保存使用数据
        await saveUsageData();
        
        // 发送工具使用记录到自建服务器
        sendToServer('tool_used', {
            tool_name: toolName,
            date: todayStr,
            ...params
        });
    };
    
    /**
     * 定期发送使用摘要数据
     */
    const scheduleSyncStats = () => {
        // 每周发送一次摘要数据
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        setInterval(async () => {
            // 发送工具使用排名
            const toolRanking = Object.entries(usageData.tools)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({name, count}));
            
            sendToServer('usage_summary', {
                top_tools: JSON.stringify(toolRanking)
            });
            
            // 清理过旧的日期数据（保留30天数据）
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
            
            Object.keys(usageData.dailyUsage).forEach(date => {
                if (date < thirtyDaysAgoStr) {
                    delete usageData.dailyUsage[date];
                }
            });
            
            // 保存清理后的数据
            await saveUsageData();
        }, ONE_WEEK);
    };
    
    /**
     * 初始化统计模块
     */
    const init = async () => {
        await getUserId();
        await loadUsageData();
        await recordDailyActiveUser();
        scheduleSyncStats();
    };
    
    /**
     * 获取最近使用的工具（按最近使用时间倒序，默认最近10个）
     * @param {number} limit - 返回的最大数量
     * @returns {Promise<string[]>} 工具名称数组
     */
    const getRecentUsedTools = async (limit = 10) => {
        // 确保数据已加载
        await loadUsageData();
        // 收集所有日期，按新到旧排序
        const dates = Object.keys(usageData.dailyUsage).sort((a, b) => b.localeCompare(a));
        const toolSet = [];
        for (const date of dates) {
            const tools = Object.keys(usageData.dailyUsage[date].tools || {});
            for (const tool of tools) {
                if (!toolSet.includes(tool)) {
                    toolSet.push(tool);
                    if (toolSet.length >= limit) {
                        return toolSet;
                    }
                }
            }
        }
        return toolSet;
    };
    
    /**
     * 获取DashBoard统计数据
     * @returns {Promise<Object>} 统计数据对象
     */
    const getDashboardData = async () => {
        await loadUsageData();
        // 最近10次使用的工具及时间
        const recent = [];
        const recentDetail = [];
        const dates = Object.keys(usageData.dailyUsage).sort((a, b) => b.localeCompare(a));
        for (const date of dates) {
            for (const tool of Object.keys(usageData.dailyUsage[date].tools || {})) {
                if (!recent.includes(tool)) {
                    recent.push(tool);
                    recentDetail.push({ tool, date });
                    if (recent.length >= 10) break;
                }
            }
            if (recent.length >= 10) break;
        }
        // 工具使用总次数排行
        const mostUsed = Object.entries(usageData.tools)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
        const totalCount = Object.values(usageData.tools).reduce((a, b) => a + b, 0);
        const activeDays = Object.keys(usageData.dailyUsage).length;
        const allDates = Object.keys(usageData.dailyUsage).sort();
        // 最近10天每日使用情况
        const dailyTrend = allDates.slice(-10).map(date => ({
            date,
            count: Object.values(usageData.dailyUsage[date].tools || {}).reduce((a, b) => a + b, 0)
        }));
        // 首次和最近活跃日期
        const firstDate = allDates[0] || '';
        const lastDate = allDates[allDates.length - 1] || '';
        // 连续活跃天数
        let maxStreak = 0, curStreak = 0, prev = '';
        for (let i = 0; i < allDates.length; i++) {
            if (i === 0 || (new Date(allDates[i]) - new Date(prev) === 86400000)) {
                curStreak++;
            } else {
                maxStreak = Math.max(maxStreak, curStreak);
                curStreak = 1;
            }
            prev = allDates[i];
        }
        maxStreak = Math.max(maxStreak, curStreak);
        // 本月/本周统计
        const now = new Date();
        const thisMonth = now.toISOString().slice(0, 7);
        const thisWeekMonday = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString().slice(0, 10);
        let monthCount = 0, weekCount = 0;
        allDates.forEach(date => {
            const cnt = Object.values(usageData.dailyUsage[date].tools || {}).reduce((a, b) => a + b, 0);
            if (date.startsWith(thisMonth)) monthCount += cnt;
            if (date >= thisWeekMonday) weekCount += cnt;
        });
        // 平均每日使用次数
        const avgPerDay = activeDays ? Math.round(totalCount / activeDays * 10) / 10 : 0;
        // 最活跃的一天
        let maxDay = { date: '', count: 0 };
        allDates.forEach(date => {
            const cnt = Object.values(usageData.dailyUsage[date].tools || {}).reduce((a, b) => a + b, 0);
            if (cnt > maxDay.count) maxDay = { date, count: cnt };
        });
        // 最近未使用天数
        let daysSinceLast = 0;
        if (lastDate) {
            const diff = Math.floor((new Date() - new Date(lastDate)) / 86400000);
            daysSinceLast = diff > 0 ? diff : 0;
        }
        return {
            recent,
            recentDetail,
            mostUsed,
            totalCount,
            activeDays,
            dailyTrend,
            firstDate,
            lastDate,
            maxStreak,
            monthCount,
            weekCount,
            avgPerDay,
            maxDay,
            daysSinceLast,
            allDates
        };
    };
    
    return {
        init,
        recordInstallation,
        recordUpdate,
        recordToolUsage,
        getRecentUsedTools,
        getDashboardData,
        recordUninstall
    };
})();

export default Statistics; 