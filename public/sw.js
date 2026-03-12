/**
 * 增强版 Service Worker
 * 提供智能缓存策略，提升应用性能和离线体验
 */

// Workbox 注入点 - 不要删除
self.__WB_MANIFEST;

// 缓存版本号 - 更新时修改
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const FONT_CACHE = `fonts-${CACHE_VERSION}`;

// 需要预缓存的核心资源
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// 安装阶段：预缓存核心资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Pre-cache complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error);
      })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 删除旧版本的缓存
              return cacheName.startsWith('static-') && cacheName !== STATIC_CACHE ||
                     cacheName.startsWith('images-') && cacheName !== IMAGE_CACHE ||
                     cacheName.startsWith('api-') && cacheName !== API_CACHE ||
                     cacheName.startsWith('fonts-') && cacheName !== FONT_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// 判断请求是否为导航请求
const isNavigationRequest = (request) => {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && 
          request.headers.get('accept')?.includes('text/html'));
};

// 判断请求是否为图片
const isImageRequest = (request) => {
  return request.destination === 'image' ||
         /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff?)$/i.test(request.url);
};

// 判断请求是否为字体
const isFontRequest = (request) => {
  return request.destination === 'font' ||
         /\.(woff2?|ttf|otf|eot)$/i.test(request.url);
};

// 判断请求是否为 API
const isAPIRequest = (request) => {
  return request.url.includes('/api/') ||
         request.url.includes('supabase') ||
         request.headers.get('X-Requested-With') === 'XMLHttpRequest';
};

// 判断请求是否为静态资源
const isStaticAsset = (request) => {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         /\.(js|css|json)$/i.test(request.url);
};

// 缓存策略：Stale While Revalidate
const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // 发起网络请求更新缓存
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[SW] Network fetch failed:', error);
      throw error;
    });
  
  // 优先返回缓存，同时更新
  return cached || fetchPromise;
};

// 缓存策略：Cache First
const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    throw error;
  }
};

// 缓存策略：Network First
const networkFirst = async (request, cacheName, maxAge = 60000) => {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // 添加时间戳到响应
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      cache.put(request, modifiedResponse);
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
  }
  
  const cached = await cache.match(request);
  if (cached) {
    // 检查缓存是否过期
    const cachedAt = cached.headers.get('sw-cached-at');
    if (cachedAt && Date.now() - parseInt(cachedAt) < maxAge) {
      return cached;
    }
    // 缓存过期但仍返回，同时后台更新
    staleWhileRevalidate(request, cacheName);
    return cached;
  }
  
  throw new Error('No cache available and network failed');
};

// 获取请求的最大缓存时间
const getMaxAge = (request) => {
  const url = request.url;
  
  // 用户数据 - 短缓存
  if (url.includes('/users') || url.includes('/profile')) {
    return 30 * 1000; // 30秒
  }
  
  // 内容列表 - 中等缓存
  if (url.includes('/posts') || url.includes('/feed')) {
    return 60 * 1000; // 1分钟
  }
  
  // 静态配置 - 长缓存
  if (url.includes('/config') || url.includes('/settings')) {
    return 5 * 60 * 1000; // 5分钟
  }
  
  return 60 * 1000; // 默认1分钟
};

// 获取缓存名称
const getCacheName = (request) => {
  if (isImageRequest(request)) return IMAGE_CACHE;
  if (isFontRequest(request)) return FONT_CACHE;
  if (isAPIRequest(request)) return API_CACHE;
  if (isStaticAsset(request)) return STATIC_CACHE;
  return STATIC_CACHE;
};

// 获取缓存策略
const getCacheStrategy = (request) => {
  // 导航请求 - Network First
  if (isNavigationRequest(request)) {
    return 'network-first';
  }
  
  // 图片 - Cache First
  if (isImageRequest(request)) {
    return 'cache-first';
  }
  
  // 字体 - Cache First
  if (isFontRequest(request)) {
    return 'cache-first';
  }
  
  // API - Network First with cache fallback
  if (isAPIRequest(request)) {
    return 'network-first';
  }
  
  // 静态资源 - Stale While Revalidate
  if (isStaticAsset(request)) {
    return 'stale-while-revalidate';
  }
  
  // 默认 - Network First
  return 'network-first';
};

// 处理 fetch 请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过跨域请求（除了 CDN 资源）
  const url = new URL(request.url);
  if (url.origin !== self.location.origin && 
      !url.hostname.includes('cdn') &&
      !url.hostname.includes('fonts')) {
    return;
  }
  
  const strategy = getCacheStrategy(request);
  const cacheName = getCacheName(request);
  
  event.respondWith(
    (async () => {
      try {
        switch (strategy) {
          case 'cache-first':
            return await cacheFirst(request, cacheName);
          case 'stale-while-revalidate':
            return await staleWhileRevalidate(request, cacheName);
          case 'network-first':
          default:
            return await networkFirst(request, cacheName, getMaxAge(request));
        }
      } catch (error) {
        console.error('[SW] Fetch failed:', error);
        
        // 导航请求失败时返回离线页面
        if (isNavigationRequest(request)) {
          const cache = await caches.open(STATIC_CACHE);
          const offlinePage = await cache.match('/index.html');
          if (offlinePage) {
            return offlinePage;
          }
        }
        
        throw error;
      }
    })()
  );
});

// 处理后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      // 可以在这里处理待同步的数据
      Promise.resolve()
    );
  }
});

// 处理推送通知
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // 如果已有窗口打开，聚焦它
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // 否则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 监听消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
