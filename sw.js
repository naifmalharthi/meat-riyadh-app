/* 🍖 Service Worker - لحوم الرياض */

const CACHE_NAME = 'meat-riyadh-v5';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/style.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// 🚀 تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ SW Installed - Caching files');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => console.error('❌ Cache error:', err))
  );
  self.skipWaiting();
});

// 🔄 تنشيط Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 📡 التعامل مع الطلبات (Network First)
self.addEventListener('fetch', event => {
  // تخطي غير GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // تخطي الطلبات الخارجية غير الموثوقة
  if (!event.request.url.includes(self.location.origin) && 
      !event.request.url.includes('cdn.jsdelivr.net') &&
      !event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين الاستجابة الناجحة
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // العودة للـ cache إذا فشل الاتصال
        return caches.match(event.request)
          .then(response => response || createOfflineResponse());
      })
  );
});

// 📴 رسالة offline
function createOfflineResponse() {
  return new Response(
    '<h1>أنت غير متصل بالإنترنت</h1><p>حاول لاحقاً</p>',
    {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 503,
      statusText: 'Service Unavailable'
    }
  );
}

// 📨 معالجة الرسائل من العميل
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker loaded');
