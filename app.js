/* 🍖 لحوم الرياض - app.js - النسخة الجديدة الكاملة */

// ⚙️ إعدادات Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyj0cgSy_TUYejv-cpqzGykk_bS8z1IHlKfuRMvgc6FpAEt12Pp0Nq5RyCAiblnxKS8pQ/exec";

// 🌐 المتغيرات العامة
let allOrders = [];
let filteredOrders = [];
let currentSort = { field: 'id', direction: 'desc' };

// 🚀 تحميل البيانات عند بدء التطبيق
window.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  updateStats();
  checkDarkMode();
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
  const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filterStatus = document.getElementById('filterStatus')?.value || '';

  // تطبيق البحث والفلترة
  filteredOrders = allOrders.filter(order => {
    const matchesSearch = !searchText || 
      order.id.toString().includes(searchText) ||
      order.customer.toLowerCase().includes(searchText) ||
      order.phone.includes(searchText);
    
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
    
    return currentSort.direction === 'asc' 
      ? aVal > bVal ? 1 : -1 
      : aVal < bVal ? 1 : -1;
  });

  // عرض الطلبات
  if (filteredOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">لا توجد طلبات</td></tr>';
    return;
  }

  tbody.innerHTML = filteredOrders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.customer}</td>
      <td>${order.phone}</td>
      <td>${order.animal}</td>
      <td>${order.quantity}</td>
      <td>${order.price}</td>
      <td>${order.total}</td>
      <td>${order.service}</td>
      <td>
        <select class="form-control form-control-sm" onchange="updateOrderStatus('${order.id}', this.value)">
          <option value="جديد" ${order.status === 'جديد' ? 'selected' : ''}>جديد</option>
          <option value="قيد المعالجة" ${order.status === 'قيد المعالجة' ? 'selected' : ''}>قيد المعالجة</option>
          <option value="تم التوصيل" ${order.status === 'تم التوصيل' ? 'selected' : ''}>تم التوصيل</option>
          <option value="ملغى" ${order.status === 'ملغى' ? 'selected' : ''}>ملغى</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')">حذف</button>
      </td>
    </tr>
  `).join('');
}

// 💾 إضافة طلب جديد
async function handleAddOrder(event) {
  event.preventDefault();

  const orderData = {
    id: 'ORD-' + Date.now(),
    customer: document.getElementById('customerName').value,
    phone: document.getElementById('customerPhone').value,
    animal: document.getElementById('animalType').value,
    quantity: parseInt(document.getElementById('quantity').value),
    price: parseFloat(document.getElementById('pricePerUnit').value),
    total: parseFloat(document.getElementById('totalAmount').value),
    service: document.getElementById('serviceType').value,
    status: 'جديد',
    notes: document.getElementById('notes').value,
    date: new Date().toLocaleDateString('ar-SA'),
    timestamp: new Date().toLocaleString('ar-SA')
  };

  try {
    console.log("📤 جاري الإرسال إلى Google Apps Script...");
    console.log("📦 البيانات:", JSON.stringify(orderData));

    // إرسال للـ Google Apps Script + Telegram + Google Sheets
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    console.log("✅ الحالة:", response.status);
    const responseText = await response.text();
    console.log("✅ الرد:", responseText);

    // حفظ محلي
    allOrders.push(orderData);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));

    showAlert('✅ تم حفظ الطلب بنجاح! تم إشعار البائع عبر Telegram.', 'success');
    
    // تنظيف النموذج
    document.getElementById('orderForm').reset();
    document.getElementById('totalAmount').textContent = '0';
    
    loadOrders();
    updateStats();

    // إغلاق الـ Modal
    setTimeout(() => {
      const modal = document.getElementById('orderModal');
      if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    }, 1500);

  } catch (error) {
    console.error("❌ خطأ:", error);
    showAlert('❌ حدث خطأ: ' + error.message, 'error');
  }
}

// 🔄 تحديث حالة الطلب
function updateOrderStatus(orderId, newStatus) {
  const order = allOrders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    showAlert(`✅ تم تحديث الحالة إلى: ${newStatus}`, 'success');
    loadOrders();
  }
}

// 🗑️ حذف طلب
function deleteOrder(orderId) {
  if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
    allOrders = allOrders.filter(o => o.id !== orderId);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    showAlert('✅ تم حذف الطلب', 'success');
    loadOrders();
  }
}

// 📊 تحديث الإحصائيات
function updateStats() {
  const total = allOrders.length;
  const delivered = allOrders.filter(o => o.status === 'تم التوصيل').length;
  const pending = allOrders.filter(o => o.status === 'جديد' || o.status === 'قيد المعالجة').length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);

  document.getElementById('totalOrders').textContent = total;
  document.getElementById('deliveredOrders').textContent = delivered;
  document.getElementById('pendingOrders').textContent = pending;
  document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString('ar-SA');
}

// 📢 عرض التنبيهات
function showAlert(message, type) {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;
  
  alertBox.textContent = message;
  alertBox.className = `alert show alert-${type}`;
  
  setTimeout(() => alertBox.classList.remove('show'), 4000);
}

// 🔍 البحث
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const filterStatus = document.getElementById('filterStatus');
  
  if (searchInput) searchInput.addEventListener('input', renderOrders);
  if (filterStatus) filterStatus.addEventListener('change', renderOrders);
});

// 💰 حساب الإجمالي تلقائياً
function calculateTotal() {
  const quantity = parseInt(document.getElementById('quantity').value) || 0;
  const price = parseFloat(document.getElementById('pricePerUnit').value) || 0;
  const total = quantity * price;
  
  document.getElementById('totalAmount').textContent = total.toLocaleString('ar-SA');
  return total;
}

// 🌙 الوضع المظلم
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function checkDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
}

// 📥 استيراد البيانات
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        allOrders = data;
        localStorage.setItem('meatOrders', JSON.stringify(allOrders));
        loadOrders();
        showAlert('✅ تم استيراد البيانات بنجاح!', 'success');
      }
    } catch (err) {
      showAlert('❌ خطأ في الملف', 'error');
    }
  };
  reader.readAsText(file);
}

// 📤 تصدير البيانات
function exportData() {
  const dataStr = JSON.stringify(allOrders, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meat-riyadh-orders-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 🗑️ حذف جميع البيانات
function deleteAllData() {
  if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا!')) {
    allOrders = [];
    localStorage.removeItem('meatOrders');
    loadOrders();
    showAlert('✅ تم حذف جميع البيانات', 'success');
  }
}
