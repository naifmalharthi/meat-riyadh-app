/* 🍖 لحوم الرياض - app.js النسخة النهائية المدمجة */

// ⚙️ إعدادات Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZEEvRD80E_H_806OA8EqIoIMP6SjdAfTLy5jpRt1hTUCtHnKqA4ACBl5AAs9dcwKfWg/exec";

// 🌐 المتغيرات العامة
let allOrders = [];
let filteredOrders = [];
let currentSort = { field: 'id', direction: 'desc' };

// 🚀 تحميل البيانات عند بدء التطبيق
window.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  updateLastUpdate();
});

// 💾 تحميل الطلبات من localStorage
function loadOrders() {
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  filteredOrders = [...allOrders];
  renderOrders();
  updateStats();
}

// 📝 عرض الطلبات في الجدول
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  
  if (!tbody) return;
  
  if (allOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding: 20px; text-align: center; color: #999;">لا توجد طلبات حالياً</td></tr>';
    return;
  }

  tbody.innerHTML = allOrders.map(order => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 10px; text-align: right;">${order.id}</td>
      <td style="padding: 10px; text-align: right;">${order.customer || order.name || '-'}</td>
      <td style="padding: 10px; text-align: right;">${order.phone || '-'}</td>
      <td style="padding: 10px; text-align: right;">${order.animal}</td>
      <td style="padding: 10px; text-align: right;">${order.quantity}</td>
      <td style="padding: 10px; text-align: right;">${order.total} ر.س</td>
      <td style="padding: 10px; text-align: right;">
        <span style="background: ${getStatusColor(order.status)}; padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px;">
          ${order.status}
        </span>
      </td>
      <td style="padding: 10px; text-align: right;">${order.date || new Date().toLocaleDateString('ar-SA')}</td>
    </tr>
  `).join('');
}

// 📊 تحديث الإحصائيات
function updateStats() {
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const averageAmount = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingOrders = allOrders.filter(order => order.status === 'معلق').length;

  const statTotal = document.getElementById('statTotal');
  const statRevenue = document.getElementById('statRevenue');
  const statAverage = document.getElementById('statAverage');
  const statPending = document.getElementById('statPending');

  if (statTotal) statTotal.textContent = totalOrders;
  if (statRevenue) statRevenue.textContent = totalRevenue.toFixed(0) + ' ر.س';
  if (statAverage) statAverage.textContent = averageAmount.toFixed(0) + ' ر.س';
  if (statPending) statPending.textContent = pendingOrders;
}

// 💾 حفظ الطلب (الدالة الرئيسية)
function saveOrder(order) {
  try {
    // 1️⃣ إضافة معرّف فريد للطلب
    order.id = order.id || 'ORD-' + Date.now();
    order.date = order.date || new Date().toLocaleDateString('ar-SA');
    
    // 2️⃣ حفظ محلي في localStorage
    allOrders.push(order);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    
    // 3️⃣ إرسال لـ Google Sheets + Telegram
    sendOrderToGoogle(order);
    
    // 4️⃣ تحديث الواجهة
    renderOrders();
    updateStats();
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ الطلب:', error);
    return false;
  }
}

// 🌐 إرسال الطلب للـ Google Sheets + Telegram
async function sendOrderToGoogle(order) {
  try {
    const orderData = {
      customerName: order.customer || order.name || 'غير محدد',
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
    const response = await fetch(APPS_SCRIPT_URL, {
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

// 🎨 لون الحالة
function getStatusColor(status) {
  const colors = {
    'معلق': '#FFA500',
    'قيد التحضير': '#2a8f9f',
    'تم التوصيل': '#047857',
    'ملغى': '#c0152f'
  };
  return colors[status] || '#999';
}

// 🕐 تحديث وقت آخر تحديث
function updateLastUpdate() {
  const lastUpdateEl = document.getElementById('lastUpdate');
  if (lastUpdateEl) {
    lastUpdateEl.textContent = new Date().toLocaleString('ar-SA');
  }
}

// 🔄 حذف جميع البيانات (مع تأكيد)
function deleteAllOrders() {
  if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
    allOrders = [];
    localStorage.removeItem('meatOrders');
    renderOrders();
    updateStats();
    console.log('✅ تم حذف جميع البيانات');
  }
}

// 📥 تنزيل البيانات كملف JSON
function downloadData() {
  const dataStr = JSON.stringify(allOrders, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meat-riyadh-orders-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// 📤 استيراد البيانات من ملف JSON
function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        allOrders = importedData;
        localStorage.setItem('meatOrders', JSON.stringify(allOrders));
        renderOrders();
        updateStats();
        alert('✅ تم استيراد البيانات بنجاح!');
      } else {
        alert('❌ صيغة الملف غير صحيحة!');
      }
    } catch (error) {
      alert('❌ خطأ في قراءة الملف: ' + error.message);
    }
  };
  reader.readAsText(file);
}
