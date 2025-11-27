// 🍖 لحوم الرياض - Service Worker
const CACHE_NAME = 'meat-riyadh-v4.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
];

// ✅ التثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ تم فتح الـ cache');
      return cache.addAll(urlsToCache).catch(err => {
        console.log('⚠️ بعض الملفات لم يتم تخزينها:', err);
      });
    })
  );
  self.skipWaiting();
});

// 🔄 التفعيل
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الـ cache القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 📡 المعالجة
self.addEventListener('fetch', event => {
  // للطلبات POST (ترسل دائماً للشبكة)
  if (event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('❌ خطأ في الاتصال بالإنترنت', { status: 500 }))
    );
    return;
  }

  // للطلبات GET (Cache first, then network)
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      
      return fetch(event.request)
        .then(response => {
          // لا نخزن الاستجابات غير الناجحة
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // نسخ الاستجابة
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // عند الفشل، نحاول الحصول على نسخة مخزنة
          return caches.match(event.request).then(response => {
            if (response) return response;
            return new Response('❌ لا يمكن الوصول لهذا المورد', { status: 404 });
          });
        });
    })
  );
});

// 🔔 معالجة الإشعارات
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'طلب جديد!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232a8f9f" width="192" height="192"/><text x="50%" y="50%" font-size="120" fill="white" text-anchor="middle" dy=".3em">🍖</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232a8f9f" width="192" height="192"/></svg>',
    tag: 'meat-order',
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification('🍖 لحوم الرياض', options)
  );
});

// 🖱️ معالجة النقر على الإشعار
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
