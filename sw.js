/* 🍖 لحوم الرياض - sw.js | Service Worker v10
✅ تطوير: 2025-12-01 18:00
✅ العمل بلا إنترنت
✅ Caching متقدم
✅ تزامن الخلفية
*/

const CACHE_NAME = 'meat-riyadh-v10-20251201';
const urlsToCache = [
    '/',
    '/index.html',
    '/20251201-1800-app.js',
    '/20251201-1800-style.css',
    '/20251201-1800-manifest.json'
];

// ════════════════════════════════════════════════════════════════════════════
// 🔧 حدث التثبيت
// ════════════════════════════════════════════════════════════════════════════

self.addEventListener('install', event => {
    console.log('🔧 Service Worker: حدث التثبيت');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 جاري تخزين الملفات...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('❌ خطأ في التخزين:', err))
    );
});

// ════════════════════════════════════════════════════════════════════════════
// 🔄 حدث التفعيل
// ════════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', event => {
    console.log('🔄 Service Worker: حدث التفعيل');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ حذف الذاكرة القديمة:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ════════════════════════════════════════════════════════════════════════════
// 📡 حدث الطلبات (Fetch)
// ════════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', event => {
    // لا نعترض طلبات غير HTTP
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // تخزين النسخة الجديدة
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // استخدام النسخة المخزنة
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            console.log('📦 تم تحميل من الذاكرة المؤقتة:', event.request.url);
                            return response;
                        }
                        // صفحة الخطأ
                        return new Response('غير متوفر بلا إنترنت', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({'Content-Type': 'text/plain; charset=UTF-8'})
                        });
                    });
            })
    );
});

// ════════════════════════════════════════════════════════════════════════════
// 💬 استقبال الرسائل
// ════════════════════════════════════════════════════════════════════════════

self.addEventListener('message', event => {
    console.log('💬 رسالة من الصفحة:', event.data);
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});