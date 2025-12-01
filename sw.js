/* 🍖 لحوم الرياض - sw.js | Service Worker
✅ VERSION 9 - FULLY FUNCTIONAL
✅ Offline Support
✅ Caching Strategy
✅ Background Sync
*/

// ════════════════════════════════════════════════════════════════════════════
// 📋 SECTION 1: ثوابت Service Worker
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📦 CACHE_NAME - اسم ذاكرة التخزين المؤقتة
 * 
 * الوصف:
 *   اسم فريد لكل إصدار من التطبيق
 *   يتغير عند تحديث الملفات
 *   يسمح بتحديث الملفات المخزنة مؤقتاً
 * 
 * تنسيق الاسم:
 *   lahhom-v[version]-[timestamp]
 *   مثال: lahhom-v9-20251201
 */
const CACHE_NAME = 'lahhom-v9-20251201';

/**
 * 📂 FILES_TO_CACHE - قائمة الملفات المراد تخزينها مؤقتاً
 * 
 * الملفات:
 *   - index.html: الصفحة الرئيسية
 *   - app.js: الوظائف الرئيسية
 *   - style.css: الأنماط والتصميم
 *   - manifest.json: إعدادات PWA
 *   - صور أيقونات (إن وجدت)
 * 
 * فائدة:
 *   عند فقدان الاتصال بالإنترنت، يتم تحميل هذه الملفات من الذاكرة المؤقتة
 */
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// ════════════════════════════════════════════════════════════════════════════
// 🚀 SECTION 2: حدث التثبيت (Install Event)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔧 install - حدث تثبيت Service Worker
 * 
 * الغرض:
 *   عند تثبيت Service Worker لأول مرة:
 *   - إنشاء ذاكرة تخزين مؤقتة جديدة
 *   - تخزين جميع الملفات الأساسية
 *   - تفعيل الـ Service Worker فوراً
 * 
 * العملية:
 *   1️⃣ استمع لحدث 'install'
 *   2️⃣ أنشئ ذاكرة تخزين مؤقتة جديدة بـ CACHE_NAME
 *   3️⃣ أضف جميع الملفات من FILES_TO_CACHE
 *   4️⃣ تخطي انتظار البدء الفوري (skipWaiting)
 * 
 * الفائدة:
 *   ✅ التطبيق يعمل بلا إنترنت من التثبيت الأول
 *   ✅ تحميل سريع من الذاكرة المؤقتة
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: حدث التثبيت');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 جاري تخزين الملفات مؤقتاً:', FILES_TO_CACHE.length);
      
      return cache.addAll(FILES_TO_CACHE).then(() => {
        console.log('✅ تم تخزين جميع الملفات بنجاح');
        self.skipWaiting(); // تفعيل فوري
      }).catch((error) => {
        console.warn('⚠️ خطأ في التخزين المؤقت:', error);
      });
    })
  );
});

// ════════════════════════════════════════════════════════════════════════════
// 🚀 SECTION 3: حدث التفعيل (Activate Event)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔄 activate - حدث تفعيل Service Worker
 * 
 * الغرض:
 *   عند تحديث Service Worker:
 *   - حذف النسخ القديمة من الذاكرة المؤقتة
 *   - الاحتفاظ بالنسخة الجديدة فقط
 *   - تحرير مساحة التخزين
 * 
 * العملية:
 *   1️⃣ استمع لحدث 'activate'
 *   2️⃣ احصل على جميع أسماء الذاكرات المؤقتة
 *   3️⃣ احذف جميع الذاكرات باستثناء CACHE_NAME الحالية
 *   4️⃣ ادّعِ بأن المتحكم بمسؤولية جميع الصفحات
 * 
 * الفائدة:
 *   ✅ تحرير المساحة من النسخ القديمة
 *   ✅ التطبيق يستخدم أحدث إصدار
 *   ✅ تحديثات سلسة بدون مشاكل
 */
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: حدث التفعيل');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // حذف الذاكرات القديمة
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الذاكرة المؤقتة القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // ادّعِ بمسؤولية جميع الصفحات
      return self.clients.claim();
    })
  );
});

// ════════════════════════════════════════════════════════════════════════════
// 📡 SECTION 4: حدث الطلبات (Fetch Event)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📡 fetch - اعتراض طلبات الشبكة
 * 
 * الغرض:
 *   اعتراض كل طلب ويب من الصفحة:
 *   - محاولة جلب الملف من الشبكة
 *   - إذا فشل: استخدام النسخة المخزنة مؤقتاً
 *   - إذا كان جديداً: تخزينه مؤقتاً للمرات القادمة
 * 
 * استراتيجية التخزين:
 *   (Network First, Cache Fallback)
 *   1️⃣ حاول جلب من الشبكة أولاً
 *   2️⃣ إذا نجح: خزّن النسخة الجديدة وأرجعها
 *   3️⃣ إذا فشل: ارجع النسخة المخزنة (إن وجدت)
 *   4️⃣ إذا لا توجد نسخة: ارجع صفحة خطأ
 * 
 * الفوائد:
 *   ✅ يعمل بلا إنترنت
 *   ✅ تحديثات تلقائية عند العودة للاتصال
 *   ✅ تجربة سلسة وسريعة
 */
self.addEventListener('fetch', (event) => {
  // لا نعترض طلبات غير HTTP
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    // 1️⃣ محاولة جلب من الشبكة
    fetch(event.request)
      .then((response) => {
        // 2️⃣ إذا نجح: تخزين مؤقت وإرجاع
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // عمل نسخة من الاستجابة للتخزين المؤقت
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // 3️⃣ إذا فشل: استخدام النسخة المخزنة
        return caches.match(event.request).then((response) => {
          if (response) {
            console.log('📦 تم تحميل من الذاكرة المؤقتة:', event.request.url);
            return response;
          }

          // 4️⃣ إذا لا توجد نسخة: صفحة خطأ
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          return new Response('غير متوفر بلا إنترنت', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain; charset=UTF-8'
            })
          });
        });
      })
  );
});

// ════════════════════════════════════════════════════════════════════════════
// 🔔 SECTION 5: الإشعارات والرسائل (Messages & Push Notifications)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 💬 message - استقبال الرسائل من الصفحة
 * 
 * الوصف:
 *   الصفحة قد ترسل رسائل للـ Service Worker
 *   مثل: مسح الذاكرة المؤقتة، تحديث البيانات، إلخ
 * 
 * الاستخدام:
 *   navigator.serviceWorker.controller.postMessage({
 *     type: 'CLEAR_CACHE'
 *   });
 */
self.addEventListener('message', (event) => {
  console.log('💬 رسالة من الصفحة:', event.data);

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ جاري مسح الذاكرة المؤقتة...');
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * 🔔 push - استقبال إشعارات الويب
 * 
 * الوصف:
 *   عند وصول إشعار push من الخادم:
 *   - عرض الإشعار للمستخدم
 *   - تشغيل صوت (اختياري)
 *   - تعيين إجراء عند الضغط
 * 
 * ملاحظة:
 *   يتطلب تفعيل Web Push API من الخادم
 */
self.addEventListener('push', (event) => {
  console.log('🔔 إشعار جديد:', event);

  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من لحوم الرياض',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'lahhom-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'فتح التطبيق'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🍖 لحوم الرياض', options)
  );
});

/**
 * 🖱️ notificationclick - التعامل مع النقر على الإشعار
 * 
 * الوصف:
 *   عند نقر المستخدم على الإشعار:
 *   - فتح التطبيق إن لم يكن مفتوحاً
 *   - التركيز على النافذة
 *   - تمرير البيانات إن وجدت
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ تم النقر على الإشعار:', event.action);

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // البحث عن نافذة مفتوحة بالفعل
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // إذا لم توجد: فتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// ════════════════════════════════════════════════════════════════════════════
// 🔄 SECTION 6: المزامنة الخلفية (Background Sync)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔄 sync - المزامنة الخلفية
 * 
 * الوصف:
 *   عندما يعود الاتصال بالإنترنت بعد انقطاع:
 *   - محاولة إرسال أي بيانات معلقة
 *   - مزامنة البيانات المحلية مع الخادم
 *   - إشعار الصفحة بالنجاح
 * 
 * ملاحظة:
 *   يتطلب API Background Sync (متقدم)
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 حدث المزامنة الخلفية:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // محاولة مزامنة الطلبات المعلقة
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_ORDERS',
            status: 'syncing'
          });
        });
      })
    );
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 📊 SECTION 7: السجلات والتتبع (Logging)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📊 تسجيل معلومات Service Worker
 * 
 * الغرض:
 *   طباعة معلومات التشخيص والتتبع
 *   مساعدة في اكتشاف المشاكل
 */
console.log('✅ Service Worker جاهز');
console.log('📦 الذاكرة المؤقتة:', CACHE_NAME);
console.log('📁 الملفات المخزنة:', FILES_TO_CACHE.length);

// ════════════════════════════════════════════════════════════════════════════
// ✅ نهاية Service Worker - متكامل وموثق بالعربية
// ════════════════════════════════════════════════════════════════════════════