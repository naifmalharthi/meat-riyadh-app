// 🍖 لحوم الرياض - Service Worker v4.0
// هذا الملف يعمل في الخلفية ويدير التخزين المحلي والعمل بدون إنترنت

// اسم التخزين (غيره عند كل تحديث)
const CACHE_NAME = 'meat-app-v4.0';

// الملفات المهمة التي سيتم تخزينها
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './?v=offline'  // صفحة fallback
];

// ═══════════════════════════════════════════════════════════════
// 1️⃣ حدث التثبيت (يحدث مرة واحدة فقط)
// ═══════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('🔧 تثبيت Service Worker v4.0...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 تخزين الملفات الأساسية...');
        return cache.addAll(FILES_TO_CACHE)
          .catch((err) => {
            console.warn('⚠️ بعض الملفات لم تُخزن:', err);
            // متابعة حتى بدون جميع الملفات
            return cache.add('./index.html');
          });
      })
  );
  
  // تفعيل فوراً بدون انتظار
  self.skipWaiting();
});

// ═══════════════════════════════════════════════════════════════
// 2️⃣ حدث التفعيل (يحدث بعد التثبيت)
// ═══════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('✅ تفعيل Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // حذف النسخ القديمة من التخزين
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('🗑️ حذف النسخة القديمة:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // السيطرة على جميع الصفحات فوراً
  self.clients.claim();
});

// ═══════════════════════════════════════════════════════════════
// 3️⃣ حدث الطلب (Fetch) - أهم جزء!
// ═══════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير الـ GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // الاستراتيجية: "Network First" مع Fallback للتخزين
    fetch(event.request)
      .then((response) => {
        // ✅ حصلنا على الإنترنت!
        
        // التحقق من الاستجابة
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // تخزين نسخة من الاستجابة
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // ❌ لا إنترنت - استخدم التخزين!
        
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              console.log('📦 استخدام النسخة المحفوظة:', event.request.url);
              return response;
            }

            // إذا لم نجد النسخة المحفوظة
            // عرّف صفحة fallback مناسبة
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }

            // للملفات الأخرى (CSS, JS, إلخ)
            return new Response('موارد غير متوفرة بدون إنترنت', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});

// ═══════════════════════════════════════════════════════════════
// 4️⃣ حدث الرسائل (Message) - للتحديثات
// ═══════════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ تحديث قيد التطبيق...');
    self.skipWaiting();
  }
});

// ═══════════════════════════════════════════════════════════════
// 5️⃣ حدث الإشعارات (Push) - للتنبيهات
// ═══════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  let data = {};
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = {
      title: 'إشعار جديد',
      body: event.data ? event.data.text() : 'لديك إشعار جديد'
    };
  }

  const options = {
    body: data.body || 'من تطبيق لحوم الرياض',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%2321808D" width="192" height="192"/><text x="50%" y="50%" font-size="100" dominant-baseline="middle" text-anchor="middle" fill="white">🍖</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect fill="%2321808D" width="72" height="72"/><text x="36" y="36" font-size="50" dominant-baseline="middle" text-anchor="middle" fill="white">🍖</text></svg>',
    tag: data.tag || 'notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'فتح'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'لحوم الرياض', options)
  );
});

// ═══════════════════════════════════════════════════════════════
// 6️⃣ معالجة النقر على الإشعار
// ═══════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // فتح التطبيق عند النقر على الإشعار
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // البحث عن نافذة مفتوحة بالفعل
        for (let client of clientList) {
          if (client.url === '/' || client.url.includes('index.html')) {
            return client.focus();
          }
        }
        // إذا لم توجد نافذة، افتح واحدة جديدة
        return clients.openWindow('./index.html');
      })
  );
});

console.log('✅ Service Worker جاهز للعمل!');
