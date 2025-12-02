const CACHE_NAME = 'health-workbench-v1';

// ⚠️ 这里写入你想要缓存的静态资源
const ASSETS_TO_CACHE = [
  './',
  './首页.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
  // 如果以后拆出单独的 JS / CSS 文件，也在这里加上
];

// 安装阶段：预缓存静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 激活阶段：清理旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：优先从缓存读取，缓存没有再访问网络
self.addEventListener('fetch', event => {
  const req = event.request;

  // 只处理 GET 请求
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        return cached;
      }
      return fetch(req).then(res => {
        // 把新资源也顺便塞进缓存（克隆一下响应）
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(req, resClone);
        });
        return res;
      }).catch(() => {
        // 可选：这里可以返回一个离线兜底页面
        return caches.match('./首页.html');
      });
    })
  );
});
