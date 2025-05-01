/**
 * FeHelper数据统计模块 - 使用GA4实现
 * @author fehelper
 */

import Awesome from './awesome.js';

// GA4测量ID - 需要替换为您自己的GA4测量ID
const GA4_MEASUREMENT_ID = 'G-1NWRCJRT01';
const GA4_API_SECRET = 'wHIo3W6uRRCvhZ18hwOmiA';

// 用户ID存储键名
const USER_ID_KEY = 'FH_USER_ID';
// 上次使用日期存储键名
const LAST_ACTIVE_DATE_KEY = 'FH_LAST_ACTIVE_DATE';
// 用户日常使用数据存储键名
const USER_USAGE_DATA_KEY = 'FH_USER_USAGE_DATA';

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
     * 使用GA4发送事件数据
     * @param {string} eventName - 事件名称
     * @param {Object} params - 事件参数
     */
    const sendToGA4 = async (eventName, params = {}) => {
        // 获取设备和浏览器信息
        const manifest = chrome.runtime.getManifest();
        
        // 确保获取用户ID
        const uid = await getUserId();
        
        // 构建GA4所需参数
        const gaParams = {
            client_id: uid,
            user_id: uid,
            non_personalized_ads: true,
            ...params
        };
        
        // GA4主URL
        const mainURL = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;
        // 国内备用URL (可以使用自己的代理转发)
        const backupURL = `https://chrome.fehelper.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;
        
        // 准备发送的数据
        const data = {
            client_id: uid,
            user_id: uid,
            events: [
                {
                    name: eventName,
                    params: {
                        extension_version: manifest.version,
                        ...gaParams
                    }
                }
            ]
        };
        
        try {
            // 主要尝试直接发送到GA
            fetch(mainURL, {
                method: 'POST',
                body: JSON.stringify(data),
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                // 如果主要GA服务器失败，尝试备用URL
                if (backupURL) {
                    fetch(backupURL, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        keepalive: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).catch(e => console.log('备用GA4统计服务器发送失败:', e));
                }
            });
        } catch (error) {
            console.log('GA4统计发送失败:', error);
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
                
                // 发送每日活跃记录到GA4
                sendToGA4('daily_active_user', {
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
        sendToGA4('extension_installed');
    };
    
    /**
     * 记录插件更新事件
     * @param {string} previousVersion - 更新前的版本
     */
    const recordUpdate = async (previousVersion) => {
        sendToGA4('extension_updated', {
            previous_version: previousVersion
        });
    };
    
    /**
     * 记录工具使用情况
     * @param {string} toolName - 工具名称
     */
    const recordToolUsage = async (toolName) => {
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
        
        // 发送工具使用记录到GA4
        sendToGA4('tool_used', {
            tool_name: toolName,
            date: todayStr
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
            
            sendToGA4('usage_summary', {
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
     * 初始化GA4测量代码
     */
    const initGA4 = async () => {
        // 获取用户ID
        const uid = await getUserId();
        
        // 发送初始化事件
        sendToGA4('extension_loaded', {
            extension_version: chrome.runtime.getManifest().version
        });
    };
    
    /**
     * 初始化统计模块
     */
    const init = async () => {
        await getUserId();
        await loadUsageData();
        await recordDailyActiveUser();
        await initGA4();
        scheduleSyncStats();
    };
    
    return {
        init,
        recordInstallation,
        recordUpdate,
        recordToolUsage
    };
})();

export default Statistics; 