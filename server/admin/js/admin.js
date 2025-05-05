console.log('Admin.js script execution started.'); // 最顶部的日志

// 管理后台前端主JS（Vue 3 组件化重构）

const { createApp, ref, reactive, onMounted, defineComponent, watch } = Vue;
console.log('Vue library loaded, createApp function:', typeof createApp); // 检查 Vue 是否加载成功

const apiBase = '/api/admin';
console.log('Defining components...'); // 日志点 1

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
  'popup': 'FH Popup页面',
  'options': 'FH插件市场'
};

// 顶部导航栏（无打赏按钮，仅限本人使用）
const HeaderNav = defineComponent({
  emits: ['show-query-modal'],
  template: `
    <header class="w-full h-14 bg-white shadow flex items-center justify-between px-6 fixed top-0 left-0 z-10">
      <div class="flex items-center space-x-3">
        <img src="./img/fe-48.png" alt="FeHelper" class="h-8 w-8">
        <span class="text-xl font-bold tracking-wide">FeHelper 数据统计后台</span>
      </div>
      <div class="flex items-center space-x-4">
        <span class="text-gray-500 text-sm">仅限本人使用</span>
        <button @click="$emit('show-query-modal')" class="ml-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">查询</button>
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

// 分布表格
const SimpleTable = defineComponent({
  props: ['title', 'data', 'label', 'cardColor'],
  computed: {
    cardBg() {
      const map = {
        blue: 'bg-blue-50',
        green: 'bg-green-50',
        yellow: 'bg-yellow-50',
        purple: 'bg-purple-50',
        pink: 'bg-pink-50',
        indigo: 'bg-indigo-50',
        orange: 'bg-orange-50',
        teal: 'bg-teal-50',
        default: 'bg-white'
      };
      return map[this.cardColor] || map.default;
    },
    barColor() {
      const map = {
        blue: 'bg-blue-400',
        green: 'bg-green-400',
        yellow: 'bg-yellow-400',
        purple: 'bg-purple-400',
        pink: 'bg-pink-400',
        indigo: 'bg-indigo-400',
        orange: 'bg-orange-400',
        teal: 'bg-teal-400',
        default: 'bg-gray-200'
      };
      return map[this.cardColor] || map.default;
    }
  },
  template: `
    <div :class="cardBg + ' rounded-xl shadow-lg p-4 mb-2 relative'">
      <div :class="barColor + ' absolute top-0 left-0 w-full h-1 rounded-t'" />
      <div class="font-bold mb-2 text-base">{{title}}</div>
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

// 工具排行
const TopTools = defineComponent({
  props: ['tools', 'cardColor'],
  template: `
    <div :class="(cardColor || 'indigo') + ' rounded-xl shadow-lg p-4 mb-2 relative'">
      <div class="font-bold mb-2 text-base">工具排行</div>
      <table class="min-w-full text-xs border border-gray-200 border-collapse">
        <thead>
          <tr>
            <th class="px-2 py-1 border border-gray-200 bg-gray-50">工具</th>
            <th class="px-2 py-1 border border-gray-200 bg-gray-50">PV（访问次数）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tools.length === 0">
            <td colspan="2" class="px-2 py-1 text-center border border-gray-200">暂无数据</td>
          </tr>
          <tr v-for="tool in tools" :key="tool.name">
            <td class="px-2 py-1 border border-gray-200">{{tool.name}}</td>
            <td class="px-2 py-1 border border-gray-200">{{tool.pv}}</td>
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
  props: ['data', 'cardColor'],
  computed: {
    cardBg() {
      const map = {
        blue: 'bg-blue-50',
        green: 'bg-green-50',
        yellow: 'bg-yellow-50',
        purple: 'bg-purple-50',
        pink: 'bg-pink-50',
        indigo: 'bg-indigo-50',
        orange: 'bg-orange-50',
        teal: 'bg-teal-50',
        default: 'bg-white'
      };
      return map[this.cardColor] || map.default;
    },
    barColor() {
      const map = {
        blue: 'bg-blue-400',
        green: 'bg-green-400',
        yellow: 'bg-yellow-400',
        purple: 'bg-purple-400',
        pink: 'bg-pink-400',
        indigo: 'bg-indigo-400',
        orange: 'bg-orange-400',
        teal: 'bg-teal-400',
        default: 'bg-gray-200'
      };
      return map[this.cardColor] || map.default;
    }
  },
  template: `
    <div :class="cardBg + ' rounded-xl shadow-lg p-4 mb-2 relative'">
      <div :class="barColor + ' absolute top-0 left-0 w-full h-1 rounded-t'" />
      <div class="font-bold mb-2 text-base">事件趋势（最近30天）</div>
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

const LoginModal = defineComponent({
  props: ['show', 'error'],
  emits: ['login'],
  setup(props, { emit }) {
    const username = ref('');
    const password = ref('');
    const loading = ref(false);
    const doLogin = async () => {
      loading.value = true;
      try {
        const res = await fetch(apiBase + '/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.value, password: password.value }),
          credentials: 'include'
        });
        if (res.ok) {
          emit('login');
        } else {
          emit('login', await res.json());
        }
      } finally {
        loading.value = false;
      }
    };
    return { username, password, loading, doLogin };
  },
  template: `
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded shadow-lg p-8 w-80">
        <div class="text-lg font-bold mb-4">登录后台</div>
        <div class="mb-2">
          <input v-model="username" class="w-full border rounded px-3 py-2" placeholder="用户名" autocomplete="username" />
        </div>
        <div class="mb-4">
          <input v-model="password" type="password" class="w-full border rounded px-3 py-2" placeholder="密码" autocomplete="current-password" />
        </div>
        <div v-if="error" class="text-red-500 text-sm mb-2">{{error.error}}</div>
        <button @click="doLogin" :disabled="loading" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{{loading ? '登录中...' : '登录'}}</button>
      </div>
    </div>
  `
});

// 查询模态框组件
const QueryModal = defineComponent({
  props: ['show'],
  emits: ['close'],
  setup(props, { emit }) {
    const toolName = ref('');
    const event = ref('');
    const userId = ref('');
    const startTime = ref('');
    const endTime = ref('');
    const page = ref(1);
    const pageSize = ref(20);
    const total = ref(0);
    const list = ref([]);
    const loading = ref(false);

    // 固定字段顺序
    const fields = [
      'userId',
      'extensionVersion',
      'tool_name',
      'browser',
      'os',
      'language',
      'country',
      'province',
      'city',
      'pageUrl',
      'pageTitle'
    ];

    const doQuery = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams();
        if (toolName.value) params.append('tool_name', toolName.value);
        if (event.value) params.append('event', event.value);
        if (userId.value) params.append('userId', userId.value);
        if (startTime.value) params.append('startTime', startTime.value);
        if (endTime.value) params.append('endTime', endTime.value);
        params.append('page', page.value);
        params.append('pageSize', pageSize.value);
        const res = await fetch(`/api/admin/raw?${params.toString()}`, { credentials: 'include' });
        const data = await res.json();
        list.value = data.list || [];
        total.value = data.total || 0;
      } finally {
        loading.value = false;
      }
    };

    const handlePageChange = (newPage) => {
      page.value = newPage;
      doQuery();
    };

    const close = () => {
      emit('close');
    };

    return {
      toolName, event, userId, startTime, endTime, page, pageSize, total, list, loading,
      doQuery, handlePageChange, close, fields
    };
  },
  template: `
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-lg p-8 w-[1200px] max-h-[90vh] overflow-auto relative">
        <button @click="close" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl">&times;</button>
        <div class="text-lg font-bold mb-4">数据查询</div>
        <div class="flex flex-wrap gap-4 mb-4">
          <input v-model="toolName" class="border rounded px-3 py-2" placeholder="工具名" />
          <input v-model="event" class="border rounded px-3 py-2" placeholder="事件类型" />
          <input v-model="userId" class="border rounded px-3 py-2" placeholder="用户ID" />
          <input v-model="startTime" type="date" class="border rounded px-3 py-2" placeholder="开始日期" />
          <input v-model="endTime" type="date" class="border rounded px-3 py-2" placeholder="结束日期" />
          <button @click="doQuery" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">查询</button>
        </div>
        <div v-if="loading" class="text-center text-gray-500 py-8">加载中...</div>
        <table v-else class="min-w-full text-xs border border-gray-200 border-collapse mb-4">
          <thead>
            <tr>
              <th v-for="field in fields" :key="field" class="px-2 py-1 border border-gray-200 bg-gray-50">{{field}}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item._id">
              <td v-for="field in fields" :key="field" class="px-2 py-1 border border-gray-200">
                <span v-if="typeof item[field] === 'object' && item[field] !== null">{{ JSON.stringify(item[field]) }}</span>
                <span v-else>{{ item[field] }}</span>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td :colspan="fields.length" class="text-center border border-gray-200 py-4">暂无数据</td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-between items-center">
          <span>共 {{total}} 条</span>
          <div>
            <button :disabled="page<=1" @click="handlePageChange(page-1)" class="px-2 py-1 border rounded mr-2">上一页</button>
            <span>第 {{page}} 页</span>
            <button :disabled="page*pageSize>=total" @click="handlePageChange(page+1)" class="px-2 py-1 border rounded ml-2">下一页</button>
          </div>
        </div>
      </div>
    </div>
  `
});

// App组件定义，保持在所有子组件定义之后
const App = defineComponent({
  components: { HeaderNav, OverviewPanel, TopTools, SimpleTable, ErrorAlert, EventTrendTable, LoginModal, QueryModal },
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
    const loggedIn = ref(false);
    const loginError = ref(null);
    const showQueryModal = ref(false);

    // API请求工具函数
    const fetchApi = async (url) => {
      try {
        const res = await fetch(url, { credentials: 'include' });
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

    // 检查登录状态
    const checkLogin = async () => {
      try {
        const res = await fetch(apiBase + '/check-login', { credentials: 'include' });
        if (res.status === 200) {
          loggedIn.value = true;
        } else {
          // 401等非200状态，均视为未登录（401是未登录的正常表现）
          loggedIn.value = false;
        }
      } catch (e) {
        // 网络异常等也视为未登录
        loggedIn.value = false;
      }
    };

    // 登录成功后重新加载
    const handleLogin = async (err) => {
      if (!err || err.success) {
        loginError.value = null;
        loggedIn.value = true;
        await loadAll();
      } else {
        loginError.value = err;
      }
    };

    onMounted(async () => {
      await checkLogin();
      if (loggedIn.value) await loadAll();
    });

    return {
      overview, browserDist, osDist, deviceTypeDist, fhVerDist,
      langDist, eventPieDist, countryDist, provinceDist, cityDist,
      tools, eventDist, errorMsg, loading, eventTrend,
      loggedIn,
      loginError,
      handleLogin,
      showQueryModal
    };
  },
  template: `
    <LoginModal :show="!loggedIn" :error="loginError" @login="handleLogin" />
    <div v-if="loggedIn">
      <HeaderNav @show-query-modal="showQueryModal = true" />
      <QueryModal :show="showQueryModal" @close="showQueryModal = false" />
      <main class="pt-16 px-6 max-w-7xl mx-auto">
        <ErrorAlert :message="errorMsg" />
        <OverviewPanel :overview="overview" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SimpleTable title="FeHelper版本分布" :data="fhVerDist" label="版本号" cardColor="blue" />
          <SimpleTable title="浏览器分布" :data="browserDist" label="浏览器" cardColor="green" />
          <SimpleTable title="操作系统分布" :data="osDist" label="操作系统" cardColor="yellow" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SimpleTable title="设备类型分布" :data="deviceTypeDist" label="设备类型" cardColor="purple" />
          <SimpleTable title="语言分布" :data="langDist" label="语言" cardColor="pink" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SimpleTable title="国家分布" :data="countryDist" label="国家" cardColor="indigo" />
          <SimpleTable title="省份分布" :data="provinceDist" label="省份" cardColor="teal" />
          <SimpleTable title="城市分布" :data="cityDist" label="城市" cardColor="orange" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TopTools :tools="tools" cardColor="indigo" />
          <EventTrendTable :data="eventDist" cardColor="teal" />
        </div>
      </main>
    </div>
  `
});

console.log('Components defined. Mounting app...'); // 日志点 2
createApp(App).mount('#app'); 