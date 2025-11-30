// Service Worker - مع تصفية الـ favicon (FIXED)

const CACHE_NAME = 'lhoom-riyadh-v2';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json'
];

// ════════════════════════════════════════════════════════════════════════════
// تثبيت Service Worker
// ════════════════════════════════════════════════════════════════════════════

self.addEventListener('install', event => {
  console.log('🔧 Service Worker Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(error => {
        console.error('❌ Cache error:', error);
        // استمر حتى مع وجود خطأ
        return Promise.resolve();
      })
  );
});

// ════════════════════════════════════════════════════════════════════════════
// تفعيل Service Worker
// ════════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker Activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ════════════════════════════════════════════════════════════════════════════
// التعامل مع الطلبات
// ════════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // تجاهل الطلبات التي لا نريد تخزينها
  if (url.includes('favicon.ico') || url.includes('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // إذا فشل الجلب والـ cache، أرجع الصفحة الرئيسية
        return caches.match('/index.html');
      })
  );
});

console.log('✅ Service Worker Script Loaded Successfully');
