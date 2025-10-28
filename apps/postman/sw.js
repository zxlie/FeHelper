/**
 * FeHelper Postman Mock Server
 * 基于Service Worker实现的本地POST请求模拟服务器
 */

// 模拟的API端点配置
const MOCK_APIS = {
  '/api/mock': {
    method: 'POST',
    response: {
      success: true,
      message: 'Mock服务器响应成功',
      timestamp: new Date().toISOString(),
      data: {
        id: 1001,
        name: 'FeHelper Mock API',
        version: '1.0.0',
        description: '这是一个基于Service Worker的模拟API服务器'
      }
    },
    delay: 500 // 模拟网络延迟
  },
  '/api/user/login': {
    method: 'POST',
    response: {
      success: true,
      message: '登录成功',
      token: 'mock_jwt_token_' + Date.now(),
      user: {
        id: 1001,
        username: 'testuser',
        email: 'test@fehelper.com',
        role: 'admin'
      }
    },
    delay: 300
  },
  '/api/data/create': {
    method: 'POST',
    response: {
      success: true,
      message: '数据创建成功',
      id: Math.floor(Math.random() * 10000),
      createdAt: new Date().toISOString()
    },
    delay: 800
  }
};

// 监听fetch事件
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  
  // 检查是否是我们的Mock API端点
  const mockApi = MOCK_APIS[pathname];
  
  if (mockApi && event.request.method === mockApi.method) {
    event.respondWith(handleMockRequest(event.request, mockApi));
  }
});

// 处理Mock请求
async function handleMockRequest(request, mockApi) {
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, mockApi.delay));
    
    // 获取请求体数据
    let requestData = null;
    try {
      const contentType = request.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        requestData = await request.json();
      } else if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.text();
        requestData = parseFormData(formData);
      }
    } catch (e) {
      console.log('Mock Server: 无法解析请求体', e);
    }
    
    // 构建响应数据
    const responseData = {
      ...mockApi.response,
      request: {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        body: requestData
      },
      server: {
        name: 'FeHelper Mock Server',
        version: '1.0.0',
        poweredBy: 'Service Worker'
      }
    };
    
    // 返回响应
    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Powered-By': 'FeHelper Mock Server',
        'X-Response-Time': mockApi.delay + 'ms'
      }
    });
    
  } catch (error) {
    // 错误响应
    return new Response(JSON.stringify({
      success: false,
      error: 'Mock服务器内部错误',
      message: error.message,
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}

// 解析表单数据
function parseFormData(formDataString) {
  const params = new URLSearchParams(formDataString);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

// Service Worker安装事件
self.addEventListener('install', (event) => {
  console.log('FeHelper Mock Server: Service Worker 已安装');
  self.skipWaiting();
});

// Service Worker激活事件
self.addEventListener('activate', (event) => {
  console.log('FeHelper Mock Server: Service Worker 已激活');
  event.waitUntil(self.clients.claim());
});

console.log('FeHelper Mock Server: Service Worker 已加载');
