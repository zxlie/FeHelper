/**
 * 油猴脚本模板市场
 */
window.MonkeyTemplates = [
    {
        category: '示例',
        list: [
            {
                mName: 'Demo：百度首页换Logo为Google并自动搜索FeHelper',
                mIncludes: ['https://www.baidu.com', 'https://www.baidu.com/'],
                mExcludes: [],
                mScript: `// 简易 Toast
const toast = (text, time = 1500) => {
  let el = document.querySelector('#fh_demo_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fh_demo_toast';
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:10px 18px;border-radius:8px;z-index:99999;font:14px/1.5 sans-serif';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.display = 'block';
  clearTimeout(window.__fh_demo_t);
  window.__fh_demo_t = setTimeout(() => el.style.display = 'none', time);
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  if (location.pathname !== '/') return;
  toast('1) 替换 Logo 为 Google');
  let lg = document.querySelector('#s_lg_img_new') || document.querySelector('#s_lg_img');
  if (lg) lg.src = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';

  await sleep(1500);
  toast('2) 输入 FeHelper');
  let kw = document.querySelector('#kw');
  if (kw) {
    for (let ch of 'FeHelper') { kw.value += ch; await sleep(120); }
  }

  await sleep(1000);
  toast('3) 自动搜索');
  let form = document.querySelector('#form');
  form && form.submit();
})();`,
                mStyle: '',
                mRunAt: 'document-end',
                mAllFrames: false,
                mWorld: 'MAIN',
                mRefresh: 0,
                mTags: ['示例']
            }
        ]
    },
    {
        category: '常用增强',
        list: [
            {
                mName: '通用：暗色护眼模式（夜间反色）',
                mIncludes: ['*://*/*'],
                mExcludes: [
                    '*://*.youtube.com/*', '*://youtube.com/*',
                    '*://*.bilibili.com/*', '*://bilibili.com/*',
                    '*://*.netflix.com/*'
                ],
                mScript: `// 默认禁用，请按需在匹配规则里加上你想反色的网站
console.log('夜间模式已注入', location.href);`,
                mStyle: `html { filter: invert(0.92) hue-rotate(180deg) !important; background: #fff !important; }
img, video, picture, iframe, svg, [style*="background-image"] {
  filter: invert(1) hue-rotate(180deg) !important;
}`,
                mRunAt: 'document-start',
                mAllFrames: false,
                mWorld: 'MAIN',
                mRefresh: 0,
                mTags: ['美化']
            },
            {
                mName: '通用：移除页面所有广告 iframe（粗暴版）',
                mIncludes: ['*://*/*'],
                mExcludes: [],
                mScript: `(() => {
  const adKeywords = ['ad', 'ads', 'adsense', 'banner', 'sponsor', 'promo', 'douban-ad'];
  const purge = () => {
    document.querySelectorAll('iframe, [class*="ad"], [id*="ad"], [class*="banner"]').forEach(el => {
      const sig = ((el.id || '') + ' ' + (el.className || '')).toLowerCase();
      if (adKeywords.some(k => sig.includes(k))) el.remove();
    });
  };
  purge();
  new MutationObserver(purge).observe(document.documentElement, { childList: true, subtree: true });
})();`,
                mStyle: '',
                mRunAt: 'document-end',
                mAllFrames: false,
                mWorld: 'MAIN',
                mRefresh: 0,
                mTags: ['净化']
            },
            {
                mName: '通用：自由复制（解除右键禁用 / 文本选择限制）',
                mIncludes: ['*://*/*'],
                mExcludes: [],
                mScript: globalThis.FHMonkeyFreeCopy.script,
                mStyle: `* { -webkit-user-select: text !important; user-select: text !important; }`,
                mRunAt: 'document-start',
                mAllFrames: true,
                mWorld: 'MAIN',
                mRefresh: 0,
                mTags: ['增强']
            }
        ]
    },
    {
        category: '开发者工具',
        list: [
            {
                mName: '开发：页面加载性能一键查看',
                mIncludes: ['*://*/*'],
                mExcludes: [],
                mScript: `(() => {
  setTimeout(() => {
    let t = performance.getEntriesByType('navigation')[0];
    if (!t) return;
    let info = {
      DNS:        ((t.domainLookupEnd - t.domainLookupStart) | 0) + 'ms',
      TCP:        ((t.connectEnd - t.connectStart) | 0) + 'ms',
      TTFB:       ((t.responseStart - t.requestStart) | 0) + 'ms',
      下载:       ((t.responseEnd - t.responseStart) | 0) + 'ms',
      DOM构建:    ((t.domContentLoadedEventEnd - t.responseEnd) | 0) + 'ms',
      Onload总耗时: ((t.loadEventEnd - t.startTime) | 0) + 'ms'
    };
    console.table(info);
  }, 1500);
})();`,
                mStyle: '',
                mRunAt: 'document-idle',
                mAllFrames: false,
                mWorld: 'MAIN',
                mRefresh: 0,
                mTags: ['性能']
            }
        ]
    }
];

window.MonkeyNewGuide = `// 在这里编写你的脚本，可以：
// 1. 操作页面所有 DOM
// 2. 直接访问页面的全局变量（如 jQuery、Vue 等）
// 3. 通过"依赖第三方js"字段引入额外脚本，加载完后再执行
// 4. 使用 GM_setValue / GM_getValue / GM_addStyle / GM_xmlhttpRequest 等 API
// 5. 错误会自动回传到"运行日志"面板

(() => {
    'use strict';
    console.log('[FeHelper Monkey] hello, ', location.href);
})();
`;
