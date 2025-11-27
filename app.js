/* 🍖 لحوم الرياض - JavaScript الكامل (app.js) */

/* ============================================
   تهيئة النظام
   ============================================ */

// المتغيرات العامة
let allOrders = [];
let filteredOrders = [];
let currentSort = { field: 'id', direction: 'desc' };
let currentView = 'orders';

// تحميل البيانات عند بدء التطبيق
window.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  loadSettings();
  checkDarkMode();
  updateLastUpdate();
});

/* ============================================
   إدارة الطلبات
   ============================================ */

function loadOrders() {
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  filteredOrders = [...allOrders];
  renderOrders();
  updateStats();
  renderCharts();
}

function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filterStatus = document.getElementById('filterStatus')?.value || '';

  // تطبيق البحث والفلترة
  filteredOrders = allOrders.filter(order => {
    const matchesSearch = !searchText || 
      order.id.toString().includes(searchText) ||
      order.phone.includes(searchText) ||
      order.location.toLowerCase().includes(searchText);
    
    const matchesStatus = !filterStatus || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // التصنيف
  filteredOrders.sort((a, b) => {
    let aVal = a[currentSort.field];
    let bVal = b[currentSort.field];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    return currentSort.direction === 'asc' ? 
      aVal > bVal ? 1 : -1 :
      aVal < bVal ? 1 : -1;
  });

  // عرض الطلبات
  tbody.innerHTML = filteredOrders.map(order => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.animal}</td>
      <td>${order.quantity}</td>
      <td><strong>${order.total} ر.س</strong></td>
      <td>
        <select onchange="updateOrderStatus(${order.id}, this.value)" 
                style="border: none; padding: 4px; border-radius: 4px;">
          <option value="معلق" ${order.status === 'معلق' ? 'selected' : ''}>معلق</option>
          <option value="قيد التحضير" ${order.status === 'قيد التحضير' ? 'selected' : ''}>قيد التحضير</option>
          <option value="تم التوصيل" ${order.status === 'تم التوصيل' ? 'selected' : ''}>تم التوصيل</option>
          <option value="ملغى" ${order.status === 'ملغى' ? 'selected' : ''}>ملغى</option>
        </select>
      </td>
      <td>${order.date.split(',')[0]}</td>
      <td>
        <button class="btn btn-sm" onclick="copyOrderDetails(${order.id})">نسخ</button>
        <button class="btn btn-danger btn-sm" onclick="deleteOrder(${order.id})">حذف</button>
      </td>
    </tr>
  `).join('');
}

function updateStats() {
  const total = allOrders.length;
  const revenue = allOrders.reduce((sum, o) => sum + o.total, 0);
  const average = total > 0 ? Math.round(revenue / total) : 0;
  const pending = allOrders.filter(o => o.status === 'معلق').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statRevenue').textContent = revenue + ' ر.س';
  document.getElementById('statAverage').textContent = average + ' ر.س';
  document.getElementById('statPending').textContent = pending;
}

function updateOrderStatus(orderId, newStatus) {
  const order = allOrders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    order.statusUpdatedAt = new Date().toLocaleString('ar-SA');
    saveOrders();
    showAlert('تم تحديث حالة الطلب', 'success');
  }
}

function deleteOrder(orderId) {
  if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
    allOrders = allOrders.filter(o => o.id !== orderId);
    saveOrders();
    loadOrders();
    showAlert('تم حذف الطلب', 'success');
  }
}

// ⚙️ إعدادات Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZEEvRD80E_H_806OA8EqIoIMP6SjdAfTLy5jpRt1hTUCtHnKqA4ACBl5AAs9dcwKfWg/exec";

// 💾 حفظ الطلبات محلياً + إرسال لـ Google Sheets + Telegram
function saveOrders() {
  // 1️⃣ حفظ محلي
  localStorage.setItem('meatOrders', JSON.stringify(allOrders));
  
  // 2️⃣ إرسال كل طلب جديد للـ Google Sheets + Telegram
  allOrders.forEach(order => {
    if (!order.sentToGoogle) {
      sendOrderToGoogle(order);
      order.sentToGoogle = true; // علم أنه تم الإرسال
    }
  });
}

// 🌐 إرسال الطلب للـ Google Sheets + Telegram
async function sendOrderToGoogle(order) {
  try {
    const orderData = {
      customerName: order.customer || 'غير محدد',
      customerPhone: order.phone || 'غير محدد',
      animalType: order.animal,
      quantity: order.quantity,
      pricePerUnit: order.price,
      totalAmount: order.total,
      serviceType: order.service || 'توصيل',
      status: order.status || 'معلق',
      notes: order.notes || '',
      orderDate: order.date
    };

    // إرسال البيانات للـ Google Apps Script
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    console.log('✅ تم إرسال الطلب لـ Google Sheets + Telegram');
  } catch (error) {
    console.error('⚠️ خطأ في الإرسال:', error);
  }
}

/* ============================================
   الرسوم البيانية والتقارير
   ============================================ */

function renderCharts() {
  // الرسم البياني 1: توزيع الحالات
  const statusCounts = {};
  allOrders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  let statusHTML = '';
  for (const [status, count] of Object.entries(statusCounts)) {
    const percentage = Math.round((count / allOrders.length) * 100) || 0;
    statusHTML += `
      <div class="chart-bar">
        <div class="chart-label">${status}</div>
        <div class="chart-bar-fill" style="width: ${percentage}%">${count}</div>
      </div>
    `;
  }
  document.getElementById('statusChart').innerHTML = statusHTML || '<p>لا توجد بيانات</p>';

  // الرسم البياني 2: أفضل الماشيات
  const animalCounts = {};
  allOrders.forEach(o => {
    animalCounts[o.animal] = (animalCounts[o.animal] || 0) + 1;
  });

  let animalHTML = '';
  Object.entries(animalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([animal, count]) => {
      const percentage = Math.round((count / allOrders.length) * 100) || 0;
      animalHTML += `
        <div class="chart-bar">
          <div class="chart-label">${animal}</div>
          <div class="chart-bar-fill" style="width: ${percentage}%">${count}</div>
        </div>
      `;
    });
  document.getElementById('animalChart').innerHTML = animalHTML || '<p>لا توجد بيانات</p>';

  // ملخص التقرير
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);
  const delivered = allOrders.filter(o => o.status === 'تم التوصيل').length;
  
  document.getElementById('reportSummary').innerHTML = `
    <ul style="list-style: none; padding: 0;">
      <li>📊 إجمالي الطلبات: <strong>${allOrders.length}</strong></li>
      <li>💰 الإيرادات الكلية: <strong>${totalRevenue} ريال</strong></li>
      <li>✅ الطلبات المُسلَّمة: <strong>${delivered}</strong></li>
      <li>📈 معدل النجاح: <strong>${allOrders.length > 0 ? Math.round((delivered/allOrders.length)*100) : 0}%</strong></li>
    </ul>
  `;
}

/* ============================================
   التصدير والاستيراد
   ============================================ */

function exportToCSV() {
  let csv = 'رقم الطلب,الماشية,الكمية,الخدمة,المبلغ,الحالة,التاريخ\n';
  filteredOrders.forEach(o => {
    csv += `${o.id},${o.animal},${o.quantity},${o.service},${o.total},${o.status},"${o.date}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `orders-${Date.now()}.csv`);
  link.click();
}

function openImportModal() {
  document.getElementById('importModal').classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function importJSON() {
  const file = document.getElementById('importFile').files[0];
  if (!file) {
    showAlert('يرجى اختيار ملف', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        allOrders = data;
        saveOrders();
        loadOrders();
        closeModal('importModal');
        showAlert('تم استيراد البيانات بنجاح', 'success');
      }
    } catch (error) {
      showAlert('خطأ في صيغة الملف', 'error');
    }
  };
  reader.readAsText(file);
}

/* ============================================
   النسخ الاحتياطية
   ============================================ */

function createBackup() {
  const backup = {
    data: allOrders,
    timestamp: new Date().toLocaleString('ar-SA'),
    version: '4.0'
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `backup-${Date.now()}.json`;
  link.click();

  showAlert('تم إنشاء نسخة احتياطية', 'success');
}

function restoreBackup() {
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = '.json';
  file.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        allOrders = backup.data || backup;
        saveOrders();
        loadOrders();
        showAlert('تم استعادة النسخة الاحتياطية', 'success');
      } catch {
        showAlert('خطأ في الملف', 'error');
      }
    };
    reader.readAsText(e.target.files[0]);
  };
  file.click();
}

function downloadAllData() {
  const data = {
    orders: allOrders,
    exportDate: new Date().toLocaleString('ar-SA'),
    version: '4.0'
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `all-data-${Date.now()}.json`;
  link.click();

  showAlert('تم تنزيل البيانات', 'success');
}

function confirmClearAll() {
  if (confirm('هل أنت متأكد تماماً؟ هذا الإجراء غير قابل للتراجع!')) {
    if (confirm('تأكيد أخير قبل حذف جميع البيانات؟')) {
      allOrders = [];
      localStorage.removeItem('meatOrders');
      loadOrders();
      showAlert('تم حذف جميع البيانات', 'success');
    }
  }
}

/* ============================================
   واجهة المستخدم
   ============================================ */

function switchView(view) {
  currentView = view;
  document.querySelectorAll('[id*="View"]').forEach(el => el.style.display = 'none');
  document.getElementById(view + 'View').style.display = 'block';

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function checkDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
}

function sortOrders(field) {
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.field = field;
    currentSort.direction = 'asc';
  }
  renderOrders();
}

function showAlert(message, type = 'success') {
  const alertBox = document.getElementById('alertBox');
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} show`;
  alertDiv.textContent = message;
  alertBox.appendChild(alertDiv);

  setTimeout(() => alertDiv.remove(), 3000);
}

function saveSettings() {
  const whatsappNumber = document.getElementById('whatsappNumber').value;
  localStorage.setItem('whatsappNumber', whatsappNumber);
  showAlert('تم حفظ الإعدادات', 'success');
}

function loadSettings() {
  const whatsappNumber = localStorage.getItem('whatsappNumber') || '966501234567';
  const el = document.getElementById('whatsappNumber');
  if (el) el.value = whatsappNumber;
}

function updateLastUpdate() {
  document.getElementById('lastUpdate').textContent = new Date().toLocaleString('ar-SA');
}

// البحث الحي
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const filterStatus = document.getElementById('filterStatus');
  
  if (searchInput) searchInput.addEventListener('input', renderOrders);
  if (filterStatus) filterStatus.addEventListener('change', renderOrders);
});

// عرض معلومات النظام
document.addEventListener('DOMContentLoaded', () => {
  const systemInfo = document.getElementById('systemInfo');
  if (systemInfo) {
    systemInfo.innerHTML = `
      <ul style="list-style: none; padding: 0;">
        <li>📱 الإصدار: <strong>4.0 PWA</strong></li>
        <li>📅 آخر تحديث: <strong>${new Date().toLocaleDateString('ar-SA')}</strong></li>
        <li>💾 السعة المستخدمة: <strong>${(JSON.stringify(localStorage).length / 1024).toFixed(2)} KB</strong></li>
        <li>🌐 المتصفح: <strong>${navigator.userAgent.split(' ').slice(-2)[0]}</strong></li>
        <li>✅ PWA Support: <strong>${'serviceWorker' in navigator ? 'متاح ✅' : 'غير متاح ❌'}</strong></li>
      </ul>
    `;
  }
});
