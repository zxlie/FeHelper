console.log('Admin.js script execution started.'); // 最顶部的日志

// 管理后台前端主JS（Vue 3 组件化重构）

const { createApp, ref, reactive, onMounted, defineComponent, watch } = Vue;
console.log('Vue library loaded, createApp function:', typeof createApp); // 检查 Vue 是否加载成功

const apiBase = '/api/admin';
console.log('Defining components...'); // 日志点 1

// 顶部导航栏（无打赏按钮，仅限本人使用）
const HeaderNav = defineComponent({
  template: `
    <header class="w-full h-14 bg-white shadow flex items-center justify-between px-6 fixed top-0 left-0 z-10">
      <div class="flex items-center space-x-3">
        <img src="./img/fe-48.png" alt="FeHelper" class="h-8 w-8">
        <span class="text-xl font-bold tracking-wide">FeHelper 数据统计后台</span>
      </div>
      <div class="flex items-center space-x-4">
        <span class="text-gray-500 text-sm">仅限本人使用</span>
        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.607 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </div>
    </header>
  `
});

// 统计总览卡片
const OverviewPanel = defineComponent({
  props: ['overview'],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded shadow p-4 flex flex-col items-center">
        <div class="text-2xl font-bold">{{overview.userCount || 0}}</div>
        <div class="text-xs text-gray-500 mt-1">累计用户数</div>
      </div>
      <div class="bg-white rounded shadow p-4 flex flex-col items-center">
        <div class="text-2xl font-bold">{{overview.todayActive || 0}}</div>
        <div class="text-xs text-gray-500 mt-1">今日活跃用户</div>
      </div>
      <div class="bg-white rounded shadow p-4 flex flex-col items-center">
        <div class="text-2xl font-bold">{{overview.monthUserCount || 0}}</div>
        <div class="text-xs text-gray-500 mt-1">近一月活跃用户</div>
      </div>
      <div class="bg-white rounded shadow p-4 flex flex-col items-center">
        <div class="text-2xl font-bold">{{overview.monthUserRate || '0%'}}</div>
        <div class="text-xs text-gray-500 mt-1">近一月用户占比</div>
      </div>
      <div class="bg-white rounded shadow p-4 flex flex-col items-center">
        <div class="text-2xl font-bold">{{overview.eventCount || 0}}</div>
        <div class="text-xs text-gray-500 mt-1">累计埋点事件数</div>
      </div>
    </div>
  `
});

// 工具英文名到中文名映射
const toolNameMap = {
  'json-format': 'JSON美化工具',
  'json-diff': 'JSON比对工具',
  'qr-code': '二维码/解码',
  'image-base64': '图片转Base64',
  'en-decode': '信息编码转换',
  'code-beautify': '代码美化工具',
  'code-compress': '代码压缩工具',
  'aiagent': 'AI，请帮帮忙',
  'timestamp': '时间(戳)转换',
  'password': '随机密码生成',
  'sticky-notes': '我的便签笔记',
  'html2markdown': 'Markdown转换',
  'postman': '简易Postman',
  'websocket': 'Websocket工具',
  'regexp': '正则公式速查',
  'trans-radix': '进制转换工具',
  'trans-color': '颜色转换工具',
  'crontab': 'Crontab工具',
  'loan-rate': '贷(还)款利率',
  'devtools': 'FH开发者工具',
  'page-monkey': '网页油猴工具',
  'screenshot': '网页截屏工具',
  'color-picker': '页面取色工具',
  'naotu': '便捷思维导图',
  'grid-ruler': '网页栅格标尺',
  'page-timing': '网站性能优化',
  'excel2json': 'Excel转JSON',
  'chart-maker': '图表制作工具',
  'svg-converter': 'SVG转为图片',
  'poster-maker': '海报快速生成',

  "popup": "FH Popup页面",
  "options": "FH插件市场",
};

// 工具排行
const TopTools = defineComponent({
  props: ['tools'],
  template: `
    <div class="bg-white rounded shadow p-4">
      <div class="font-bold mb-2">FeHelper工具使用排名</div>
      <ol class="list-decimal ml-6 text-sm text-gray-700">
        <li v-if="tools.length === 0">暂无数据</li>
        <li v-for="tool in tools" :key="tool.name">
          {{tool.name}} <span class="text-gray-400">({{tool.pv}})</span>
        </li>
      </ol>
    </div>
  `
});

// 分布表格
const SimpleTable = defineComponent({
  props: ['title', 'data', 'label'],
  template: `
    <div class="bg-white rounded shadow p-4">
      <div class="font-bold mb-2">{{title}}</div>
      <table class="min-w-full text-xs border border-gray-200">
        <thead>
          <tr>
            <th class="px-2 py-1 border-b border-gray-200 bg-gray-50">{{label}}</th>
            <th class="px-2 py-1 border-b border-gray-200 bg-gray-50">UV（用户数）</th>
            <th class="px-2 py-1 border-b border-gray-200 bg-gray-50">PV（访问次数）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data.length === 0">
            <td colspan="3" class="px-2 py-1 text-center">暂无数据</td>
          </tr>
          <tr v-for="row in data" :key="row._id" class="border-b border-gray-100">
            <td class="px-2 py-1 border-r border-gray-100">{{row._id}}</td>
            <td class="px-2 py-1 border-r border-gray-100">{{row.uv}}</td>
            <td class="px-2 py-1">{{row.pv}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
});

// 错误提示
const ErrorAlert = defineComponent({
  props: ['message'],
  template: `
    <div v-if="message" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
      <strong class="font-bold">错误：</strong>
      <span class="block sm:inline">{{message}}</span>
    </div>
  `
});

const eventTrend = ref([]);

// 新增事件趋势表格
const EventTrendTable = defineComponent({
  props: ['data'],
  template: `
    <div class="bg-white rounded shadow p-4">
      <div class="font-bold mb-2">事件趋势（最近30天）</div>
      <table class="min-w-full text-xs border border-gray-200">
        <thead>
          <tr>
            <th class="px-2 py-1 border-b border-gray-200 bg-gray-50">日期</th>
            <th class="px-2 py-1 border-b border-gray-200 bg-gray-50">UV（用户数）</th>
            <th class="px-2 py-1 border-b border-gray-200 bg-gray-50">PV（访问次数）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data.length === 0">
            <td colspan="3" class="px-2 py-1 text-center">暂无数据</td>
          </tr>
          <tr v-for="row in data" :key="row._id" class="border-b border-gray-100">
            <td class="px-2 py-1 border-r border-gray-100">{{row._id}}</td>
            <td class="px-2 py-1 border-r border-gray-100">{{row.uv}}</td>
            <td class="px-2 py-1">{{row.pv}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
});

const App = defineComponent({
  components: { HeaderNav, OverviewPanel, TopTools, SimpleTable, ErrorAlert, EventTrendTable },
  setup() {
    // 数据定义
    const overview = ref({});
    // 直接存储原始数组
    const browserDist = ref([]);
    const osDist = ref([]);
    const deviceTypeDist = ref([]);
    const fhVerDist = ref([]);
    const langDist = ref([]);
    const eventPieDist = ref([]);
    const countryDist = ref([]);
    const provinceDist = ref([]);
    const cityDist = ref([]);
    const tools = ref([]);
    const eventDist = ref([]);
    const errorMsg = ref('');
    const loading = ref(true);

    // API请求工具函数
    const fetchApi = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} 请求失败: ${res.status} ${res.statusText}`);
        return await res.json();
      } catch (err) {
        throw err;
      }
    };

    // 加载所有首页数据
    const loadAll = async () => {
      try {
        loading.value = true;
        errorMsg.value = '';

        // 1. 总览
        overview.value = await fetchApi(apiBase + '/overview');

        // 2. 浏览器分布
        const rawBrowserDist = await fetchApi(apiBase + '/browser-distribution');
        browserDist.value = rawBrowserDist.map(i => ({
          _id: (i._id && i._id.browser)
            ? `${i._id.browser} ${i._id.version}`
            : (typeof i._id === 'string' ? i._id : '未知'),
          uv: i.uv || 0,
          pv: i.pv || 0
        }));

        // 3. 操作系统分布
        const rawOsDist = await fetchApi(apiBase + '/os-distribution');
        osDist.value = rawOsDist.map(i => ({
          _id: (i._id && i._id.os)
            ? `${i._id.os} ${i._id.version}`
            : (typeof i._id === 'string' ? i._id : '未知'),
          uv: i.uv || 0,
          pv: i.pv || 0
        }));

        // 4. 设备类型分布
        const rawDeviceTypeDist = await fetchApi(apiBase + '/device-type-distribution');
        deviceTypeDist.value = rawDeviceTypeDist.map(i => ({
          _id: i._id || '未知',
          uv: i.uv || 0,
          pv: i.pv || 0
        }));

        // 5. 插件版本分布
        const rawFhVerDist = await fetchApi(apiBase + '/fh-version-distribution');
        fhVerDist.value = rawFhVerDist.map(i => ({
          _id: (i._id ? `${i._id}` : '未知'),
          uv: i.uv || 0,
          pv: i.pv || 0
        }));

        // 6. 用户语言分布
        const users = await fetchApi(apiBase + '/users');
        langDist.value = (users.lang || []).map(i => ({
          _id: i._id || '未知',
          uv: i.uv || 0,
          pv: i.pv || 0
        }));

        // 7. 事件类型分布（主区域）
        const rawEventPieDist = await fetchApi(apiBase + '/event-distribution');
        eventPieDist.value = (rawEventPieDist || []).map(i => ({
          _id: i._id || '未知',
          uv: i.uv || 0,
          pv: i.pv || 0
        }));

        // 8. 地理分布
        const userDist = await fetchApi(apiBase + '/user-distribution');
        countryDist.value = (userDist.country || []).map(i => ({
          _id: i._id || '未知',
          uv: i.uv || 0,
          pv: i.pv || 0
        }));
        provinceDist.value = (userDist.province || []).map(i => ({
          _id: i._id || '未知',
          uv: i.uv || 0,
          pv: i.pv || 0
        }));
        cityDist.value = (userDist.city || []).map(i => ({
          _id: i._id || '未知',
          uv: i.uv || 0,
          pv: i.pv || 0
        }));

        // 9. 工具排行
        const toolsList = await fetchApi(apiBase + '/tools');
        tools.value = toolsList.map(t => ({ name: toolNameMap[t._id] || (t._id ? t._id : '插件更新或安装'), pv: t.pv || 0 }));

        // 10. 事件类型分布（表格）
        eventDist.value = eventPieDist.value;

        // 11. 事件趋势
        const trendList = await fetchApi(apiBase + '/event-trend');
        eventTrend.value = trendList.map(i => ({
          _id: i._id,
          uv: i.uv || 0,
          pv: i.pv || 0
        }));

      } catch (error) {
        errorMsg.value = '数据加载失败: ' + error.message;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadAll();
    });

    return {
      overview, browserDist, osDist, deviceTypeDist, fhVerDist,
      langDist, eventPieDist, countryDist, provinceDist, cityDist,
      tools, eventDist, errorMsg, loading, eventTrend
    };
  },
  template: `
    <div>
      <HeaderNav />
      <div class="flex pt-14 h-screen">
        <main class="flex-1 p-8 overflow-auto bg-gray-50 min-h-screen" id="main-content">
          <ErrorAlert :message="errorMsg" />
          <div v-if="loading" class="text-center py-8">
            <div class="text-xl text-gray-600">加载中...</div>
          </div>
          <div v-else>
            <OverviewPanel :overview="overview" />
            <!-- 表格区域：两行，每行4个表格，全部可见 -->
            <div class="w-full mx-auto">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <SimpleTable title="浏览器类型/版本分布" :data="browserDist" label="浏览器/版本" />
                <SimpleTable title="操作系统分布" :data="osDist" label="操作系统/版本" />
                <SimpleTable title="设备类型分布" :data="deviceTypeDist" label="设备类型" />
                <SimpleTable title="FeHelper版本分布" :data="fhVerDist" label="版本号" />
                <SimpleTable title="用户语言分布" :data="langDist" label="语言" />
                <SimpleTable title="事件类型分布（主区域）" :data="eventPieDist" label="事件类型" />
                <SimpleTable title="国家分布" :data="countryDist" label="国家" />
                <SimpleTable title="省份分布" :data="provinceDist" label="省份" />
                <SimpleTable title="城市分布" :data="cityDist" label="城市" />
              </div>
            </div>
            <!-- 其它内容 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <TopTools :tools="tools" />
              <EventTrendTable :data="eventTrend" />
            </div>
          </div>
        </main>
      </div>
    </div>
  `
});

console.log('Components defined. Mounting app...'); // 日志点 2
createApp(App).mount('#app'); 