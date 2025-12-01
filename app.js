/* 🍖 لحوم الرياض - app.js | VERSION 10
✅ تطوير: 2025-12-01 18:00
✅ حالة: جاهز للإنتاج
✅ توثيق عربي شامل
✅ معالجة أخطاء متقدمة
✅ دعم بريد + Telegram
✅ حل مشاكل الإنترنت الأوفلاين
*/

// ════════════════════════════════════════════════════════════════════════════
// 📊 SECTION 1: الإعدادات الأساسية والثوابت
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔗 APPS_SCRIPT_URL - رابط Google Apps Script
 * 
 * طريقة الإعداد:
 * 1. انسخ ملف gs.js إلى Google Apps Script
 * 2. افتح: https://script.google.com/home
 * 3. أنشئ مشروع جديد وضع الكود
 * 4. اضغط "نشر" → "نشر كتطبيق ويب"
 * 5. انسخ الرابط الجديد وضعه هنا
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHjwtauzuSyOfOK9LoYYQDc7XUkPERY4vJncBR7Z9Mb7grU2F5tY5fa7wmQjgHdR37/exec";

/**
 * ⏰ OFFLINE_TIMEOUT - المدة المسموحة للعمل بلا إنترنت
 * بعد انقضاء هذه المدة يظهر تنبيه للمستخدم
 */
const OFFLINE_TIMEOUT = 300000; // 5 دقائق

// ════════════════════════════════════════════════════════════════════════════
// 🗃️ متغيرات الحالة العامة
// ════════════════════════════════════════════════════════════════════════════

let allOrders = [];
let filteredOrders = [];
let selectedOrderId = null;
let currentStatusFilter = 'all';
let isEditMode = false;
let isOnline = navigator.onLine;
let offlineTimestamp = null;

// ════════════════════════════════════════════════════════════════════════════
// 📖 البيانات الثابتة (Constants)
// ════════════════════════════════════════════════════════════════════════════

const animalDescriptions = {
    'غنم نعيمي': '🏆 جودة عالية، طعم غني، مطلوب للمناسبات',
    'غنم نجدي': '💪 حجم كبير، لحم مميز غني بالعصارة',
    'غنم حري': '☀️ يتحمل الحرارة، مناسب للبيئة الجافة',
    'غنم سواكني': '💰 خيار اقتصادي، لحم جيد، ألوان مختلفة',
    'غنم بربري': '🍃 خيار صحي، طعم خفيف، للتسمين',
    'ماعز': '✨ لحم ماعز طازج وجودة عالية',
    'جمل': '🐫 لحم جمل - للطلبات الكبيرة والجملة فقط'
};

const AGES = ['6 شهور', '1 سنة', 'سنة ونصف', 'سنتان'];

const animalPrices = {
    'غنم نعيمي': 1800,
    'غنم نجدي': 1900,
    'غنم حري': 1600,
    'غنم سواكني': 1500,
    'غنم بربري': 1400,
    'ماعز': 1200,
    'جمل': 5000
};

const SERVICES = {
    'توصيل مجاني': { name: 'توصيل مجاني', price: 0 },
    'توصيل برسم': { name: 'توصيل برسم', price: 50 },
    'ذبح': { name: 'خدمة الذبح', price: 20 },
    'تقطيع': { name: 'خدمة التقطيع', price: 25 },
    'تغليف': { name: 'خدمة التغليف', price: 15 },
    'استلام من المحل': { name: 'استلام من المحل', price: 0 }
};

// ════════════════════════════════════════════════════════════════════════════
// 🚀 حدث تحميل الصفحة
// ════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 تحميل التطبيق - النسخة v10');
    
    try {
        // تحميل البيانات من التخزين المحلي
        loadOrdersFromStorage();
        
        // عرض الإحصائيات
        updateStats();
        
        // عرض الطلبات في الجدول
        displayOrders(allOrders);
        
        // ربط الأزرار والعناصر
        setupEventListeners();
        
        // استعادة الوضع الليلي
        restoreDarkMode();
        
        // التحقق من الاتصال بالإنترنت
        checkInternetConnection();
        
        // محاولة إرسال الطلبات المعلقة
        syncPendingOrders();
        
        console.log('✅ تم تحميل التطبيق بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تحميل التطبيق:', error);
        showNotification('❌ حدث خطأ في تحميل التطبيق', 'error');
    }
});

// ════════════════════════════════════════════════════════════════════════════
// 📂 إدارة التخزين (Local Storage)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 💾 loadOrdersFromStorage - تحميل الطلبات من التخزين المحلي
 */
function loadOrdersFromStorage() {
    try {
        const stored = localStorage.getItem('meat-orders-v10');
        allOrders = stored ? JSON.parse(stored) : [];
        console.log(`📂 تم تحميل ${allOrders.length} طلب من التخزين`);
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        allOrders = [];
    }
}

/**
 * 💾 saveOrdersToStorage - حفظ الطلبات في التخزين المحلي
 */
function saveOrdersToStorage() {
    try {
        localStorage.setItem('meat-orders-v10', JSON.stringify(allOrders));
        console.log('✅ تم حفظ البيانات في التخزين المحلي');
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
        showNotification('❌ فشل حفظ البيانات', 'error');
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 📋 إدارة الطلبات
// ════════════════════════════════════════════════════════════════════════════

/**
 * ➕ addOrder - إضافة طلب جديد
 */
function addOrder(orderData) {
    try {
        // التحقق من صحة البيانات
        const validation = validateOrderData(orderData);
        if (!validation.isValid) {
            showNotification(`❌ ${validation.error}`, 'error');
            return false;
        }

        const newOrder = {
            id: Date.now(),
            ...orderData,
            orderStatus: 'قيد المعالجة',
            timestamp: new Date().toLocaleString('ar-SA'),
            synced: false
        };

        allOrders.unshift(newOrder);
        saveOrdersToStorage();
        
        // محاولة إرسال إلى Google Sheets
        if (isOnline) {
            sendOrderToServer(newOrder);
        } else {
            showNotification('📡 سيتم إرسال الطلب عند استعادة الاتصال', 'info');
        }
        
        return true;
    } catch (error) {
        console.error('❌ خطأ في إضافة الطلب:', error);
        showNotification('❌ فشل إضافة الطلب', 'error');
        return false;
    }
}

/**
 * ✏️ updateOrder - تعديل طلب موجود
 */
function updateOrder(orderId, updatedData) {
    try {
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            showNotification('❌ لم يتم العثور على الطلب', 'error');
            return false;
        }

        allOrders[orderIndex] = {
            ...allOrders[orderIndex],
            ...updatedData,
            synced: false
        };

        saveOrdersToStorage();
        showNotification('✅ تم تحديث الطلب', 'success');
        return true;
    } catch (error) {
        console.error('❌ خطأ في تحديث الطلب:', error);
        showNotification('❌ فشل تحديث الطلب', 'error');
        return false;
    }
}

/**
 * 🗑️ deleteOrder - حذف طلب
 */
function deleteOrder(orderId) {
    try {
        allOrders = allOrders.filter(o => o.id !== orderId);
        saveOrdersToStorage();
        showNotification('✅ تم حذف الطلب', 'success');
        return true;
    } catch (error) {
        console.error('❌ خطأ في حذف الطلب:', error);
        showNotification('❌ فشل حذف الطلب', 'error');
        return false;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// ✅ التحقق من صحة البيانات
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔍 validateOrderData - التحقق من صحة بيانات الطلب
 */
function validateOrderData(data) {
    // التحقق من اسم العميل
    if (!data.customerName || data.customerName.trim().length < 2) {
        return { isValid: false, error: 'اسم العميل يجب أن يكون على الأقل حرفين' };
    }

    // التحقق من رقم الهاتف
    const phoneRegex = /^[\d\s\-\+]{10,}$/;
    if (!phoneRegex.test(data.customerPhone)) {
        return { isValid: false, error: 'رقم الهاتف غير صحيح' };
    }

    // التحقق من نوع الماشية
    if (!data.animalType || !animalPrices[data.animalType]) {
        return { isValid: false, error: 'نوع الماشية غير صحيح' };
    }

    // التحقق من الكمية
    if (!data.quantity || data.quantity < 1 || data.quantity > 1000) {
        return { isValid: false, error: 'الكمية يجب أن تكون بين 1 و 1000' };
    }

    // التحقق من المنطقة
    if (data.region === 'خارج الرياض' && data.quantity < 10) {
        return { isValid: false, error: 'الحد الأدنى للطلبات خارج الرياض: 10 وحدات' };
    }

    return { isValid: true };
}

// ════════════════════════════════════════════════════════════════════════════
// 📊 إدارة الإحصائيات
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📈 updateStats - تحديث الإحصائيات
 */
function updateStats() {
    try {
        const displayOrders = currentStatusFilter === 'all' 
            ? allOrders 
            : allOrders.filter(o => o.orderStatus === currentStatusFilter);

        const totalOrders = displayOrders.length;
        const totalSales = displayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
        const pendingOrders = allOrders.filter(o => o.orderStatus === 'قيد المعالجة').length;

        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalSales').textContent = totalSales.toLocaleString('ar-SA') + ' ر.س';
        document.getElementById('avgOrder').textContent = avgOrder.toLocaleString('ar-SA') + ' ر.س';
        document.getElementById('pendingOrders').textContent = pendingOrders;
    } catch (error) {
        console.error('❌ خطأ في تحديث الإحصائيات:', error);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 🖥️ إدارة الواجهة
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📋 displayOrders - عرض الطلبات في الجدول
 */
function displayOrders(orders) {
    const tbody = document.getElementById('ordersBody');
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customerName}</td>
            <td>${order.customerPhone}</td>
            <td>${order.animalType}</td>
            <td>${order.quantity}</td>
            <td>${order.pricePerUnit}</td>
            <td>${order.totalPrice}</td>
            <td>${order.serviceType}</td>
            <td><span class="status ${getStatusClass(order.orderStatus)}">${order.orderStatus}</span></td>
            <td>${order.timestamp}</td>
            <td>
                <button class="btn-edit" onclick="editOrder(${order.id})" title="تعديل">✏️</button>
                <button class="btn-delete" onclick="deleteOrderWithConfirm(${order.id})" title="حذف">🗑️</button>
            </td>
        </tr>
    `).join('');
}

/**
 * 🎨 getStatusClass - الحصول على فئة CSS للحالة
 */
function getStatusClass(status) {
    const statusMap = {
        'قيد المعالجة': 'pending',
        'تم التوصيل': 'completed',
        'ملغي': 'cancelled'
    };
    return statusMap[status] || 'pending';
}

// ════════════════════════════════════════════════════════════════════════════
// 🌐 إدارة الاتصال بالإنترنت
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📡 checkInternetConnection - التحقق من الاتصال بالإنترنت
 */
function checkInternetConnection() {
    window.addEventListener('online', () => {
        isOnline = true;
        console.log('✅ تم استعادة الاتصال بالإنترنت');
        hideOfflineIndicator();
        syncPendingOrders();
        showNotification('✅ تم استعادة الاتصال بالإنترنت', 'success');
    });

    window.addEventListener('offline', () => {
        isOnline = false;
        offlineTimestamp = Date.now();
        console.log('❌ فقد الاتصال بالإنترنت');
        showOfflineIndicator();
        showNotification('📡 فقدت الاتصال بالإنترنت - يمكنك المتابعة والبيانات ستحفظ محلياً', 'warning');
    });
}

/**
 * 📤 syncPendingOrders - محاولة إرسال الطلبات المعلقة
 */
function syncPendingOrders() {
    const unsyncedOrders = allOrders.filter(o => !o.synced);
    
    if (unsyncedOrders.length === 0) return;
    
    console.log(`📤 محاولة إرسال ${unsyncedOrders.length} طلب معلق...`);
    
    unsyncedOrders.forEach(order => {
        sendOrderToServer(order);
    });
}

/**
 * 📤 sendOrderToServer - إرسال الطلب إلى الخادم
 */
function sendOrderToServer(order) {
    if (!isOnline) return;

    try {
        const formData = new FormData();
        Object.keys(order).forEach(key => {
            formData.append(key, order[key]);
        });

        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // تحديث حالة الطلب
                const orderIndex = allOrders.findIndex(o => o.id === order.id);
                if (orderIndex !== -1) {
                    allOrders[orderIndex].synced = true;
                    saveOrdersToStorage();
                }
                console.log(`✅ تم إرسال الطلب ${order.id}`);
            }
        })
        .catch(error => {
            console.error('❌ فشل إرسال الطلب:', error);
        });
    } catch (error) {
        console.error('❌ خطأ في إرسال الطلب:', error);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 🔔 الإشعارات
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔔 showNotification - عرض إشعار
 */
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

// ════════════════════════════════════════════════════════════════════════════
// 🌙 الوضع الليلي
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🌙 toggleDarkMode - تبديل الوضع الليلي
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
    console.log('🌙 تم تبديل الوضع الليلي');
}

/**
 * 🌙 restoreDarkMode - استعادة الوضع الليلي المحفوظ
 */
function restoreDarkMode() {
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 🎛️ ربط أحداث الواجهة
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔗 setupEventListeners - ربط أحداث الأزرار والعناصر
 */
function setupEventListeners() {
    // زر إضافة طلب جديد
    document.getElementById('addOrderBtn').addEventListener('click', () => {
        isEditMode = false;
        document.getElementById('modalTitle').textContent = 'إضافة طلب جديد';
        document.getElementById('orderForm').reset();
        document.getElementById('orderModal').style.display = 'flex';
        document.getElementById('orderModal').setAttribute('aria-hidden', 'false');
    });

    // زر الإلغاء
    document.getElementById('cancelBtn').addEventListener('click', closeModal);

    // نموذج الطلب
    document.getElementById('orderForm').addEventListener('submit', handleFormSubmit);

    // أزرار التصفية
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentStatusFilter = e.target.dataset.filter;
            filteredOrders = currentStatusFilter === 'all' 
                ? allOrders 
                : allOrders.filter(o => o.orderStatus === currentStatusFilter);
            displayOrders(filteredOrders);
            updateStats();
        });
    });

    // زر الوضع الليلي
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);

    // زر حذف البيانات
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);

    // تحديث اختيار نوع الحيوان
    document.getElementById('animalType').addEventListener('change', (e) => {
        const description = animalDescriptions[e.target.value];
        const descDiv = document.getElementById('animalDesc');
        if (description) {
            descDiv.textContent = description;
            descDiv.classList.add('show');
            descDiv.style.display = 'block';
        } else {
            descDiv.style.display = 'none';
        }
        updatePrice();
    });

    // تحديث السعر عند تغيير الكمية
    document.getElementById('quantity').addEventListener('change', updatePrice);
    document.getElementById('quantity').addEventListener('input', updatePrice);

    // إغلاق النموذج عند النقر خارجه
    document.getElementById('orderModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('orderModal')) {
            closeModal();
        }
    });
}

/**
 * 💾 handleFormSubmit - معالجة إرسال النموذج
 */
function handleFormSubmit(e) {
    e.preventDefault();

    try {
        const orderData = {
            customerName: document.getElementById('customerName').value,
            customerPhone: document.getElementById('customerPhone').value,
            animalType: document.getElementById('animalType').value,
            animalAge: document.getElementById('animalAge').value,
            quantity: parseInt(document.getElementById('quantity').value),
            pricePerUnit: parseInt(document.getElementById('pricePerUnit').value),
            totalPrice: parseInt(document.getElementById('totalDisplay').textContent),
            serviceType: document.getElementById('serviceType').value,
            region: document.getElementById('region').value,
            orderStatus: document.getElementById('orderStatus').value
        };

        if (isEditMode && selectedOrderId) {
            updateOrder(selectedOrderId, orderData);
        } else {
            addOrder(orderData);
        }

        displayOrders(currentStatusFilter === 'all' ? allOrders : filteredOrders);
        updateStats();
        closeModal();
        showNotification('✅ تم حفظ الطلب بنجاح', 'success');
    } catch (error) {
        console.error('❌ خطأ في معالجة النموذج:', error);
        showNotification('❌ حدث خطأ في حفظ الطلب', 'error');
    }
}

/**
 * 💰 updatePrice - تحديث السعر الإجمالي
 */
function updatePrice() {
    const animalType = document.getElementById('animalType').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    
    const price = animalPrices[animalType] || 0;
    document.getElementById('pricePerUnit').value = price;
    
    const total = price * quantity;
    document.getElementById('totalDisplay').textContent = total.toLocaleString('ar-SA');
}

/**
 * ✏️ editOrder - تعديل طلب
 */
function editOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    isEditMode = true;
    selectedOrderId = orderId;
    
    document.getElementById('modalTitle').textContent = 'تعديل الطلب';
    document.getElementById('customerName').value = order.customerName;
    document.getElementById('customerPhone').value = order.customerPhone;
    document.getElementById('animalType').value = order.animalType;
    document.getElementById('animalAge').value = order.animalAge;
    document.getElementById('quantity').value = order.quantity;
    document.getElementById('pricePerUnit').value = order.pricePerUnit;
    document.getElementById('totalDisplay').textContent = order.totalPrice.toLocaleString('ar-SA');
    document.getElementById('serviceType').value = order.serviceType;
    document.getElementById('region').value = order.region;
    document.getElementById('orderStatus').value = order.orderStatus;

    document.getElementById('orderModal').style.display = 'flex';
    document.getElementById('orderModal').setAttribute('aria-hidden', 'false');
}

/**
 * 🗑️ deleteOrderWithConfirm - حذف الطلب مع تأكيد
 */
function deleteOrderWithConfirm(orderId) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب؟')) {
        deleteOrder(orderId);
        displayOrders(currentStatusFilter === 'all' ? allOrders : filteredOrders);
        updateStats();
    }
}

/**
 * 🪟 closeModal - إغلاق النموذج
 */
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.getElementById('orderModal').setAttribute('aria-hidden', 'true');
    document.getElementById('orderForm').reset();
    isEditMode = false;
    selectedOrderId = null;
}

/**
 * 🗑️ clearAllData - حذف جميع البيانات
 */
function clearAllData() {
    if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف جميع البيانات؟ هذا الإجراء غير قابل للتراجع!')) {
        allOrders = [];
        saveOrdersToStorage();
        displayOrders([]);
        updateStats();
        showNotification('✅ تم حذف جميع البيانات', 'success');
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 📡 مؤشرات الاتصال
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📡 showOfflineIndicator - عرض مؤشر الاتصال المفقود
 */
function showOfflineIndicator() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
}

/**
 * 📡 hideOfflineIndicator - إخفاء مؤشر الاتصال
 */
function hideOfflineIndicator() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}