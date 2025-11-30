// 🍖 لحوم الرياض - app.js (WITH GOOGLE APPS SCRIPT INTEGRATION) ✅

// ════════════════════════════════════════════════════════════════════════════
// GOOGLE APPS SCRIPT URL
// ════════════════════════════════════════════════════════════════════════════
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyj0cgSyTUYejv-cpqzGykkbS8z1IHlKfuRMvgc6FpAEt12Pp0Nq5RyCAiblnxKS8pQ/exec";

// ════════════════════════════════════════════════════════════════════════════
// إرسال البيانات إلى Google Apps Script
// ════════════════════════════════════════════════════════════════════════════

async function sendOrderToGoogleAppsScript(orderData) {
  try {
    console.log('📤 جاري إرسال البيانات إلى Google Apps Script...');
    console.log('البيانات:', orderData);
    
    // استخدام FormData لأفضل توافقية
    const formData = new FormData();
    formData.append('id', orderData.id);
    formData.append('customerName', orderData.customer);
    formData.append('customerPhone', orderData.phone);
    formData.append('animalType', orderData.animal);
    formData.append('quantity', orderData.quantity);
    formData.append('pricePerUnit', orderData.pricePerUnit);
    formData.append('totalPrice', orderData.total);
    formData.append('serviceType', orderData.service);
    formData.append('orderStatus', orderData.status);
    formData.append('timestamp', new Date().toLocaleString('ar-SA'));
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors' // مهم للـ Google Apps Script
    });
    
    console.log('✅ تم الإرسال بنجاح!');
    return true;
    
  } catch (error) {
    console.warn('⚠️ تحذير في الإرسال (البيانات محفوظة محليًا):', error.message);
    // لا نمنع المستخدم من الاستمرار حتى لو فشل الإرسال
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// المتغيرات الأساسية
// ════════════════════════════════════════════════════════════════════════════

let allOrders = [];
let filteredOrders = [];
let currentSort = { field: 'id', direction: 'desc' };
let currentView = 'orders';

// ════════════════════════════════════════════════════════════════════════════
// تحميل البيانات عند بدء التطبيق
// ════════════════════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  console.log('🔥 التطبيق يتم تحميله...');
  loadOrders();
  loadSettings();
  checkDarkMode();
  updateLastUpdate();
  setupFormListener();
  console.log('✅ التطبيق جاهز!');
});

// ════════════════════════════════════════════════════════════════════════════
// إعداد مستمع النموذج
// ════════════════════════════════════════════════════════════════════════════

function setupFormListener() {
  const addOrderBtn = document.getElementById('addOrderBtn');
  if (addOrderBtn) {
    addOrderBtn.addEventListener('click', showAddOrderForm);
  }
  
  // في حالة وجود نموذج في الصفحة
  const form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', handleAddOrder);
  }
}

function handleAddOrder(e) {
  e.preventDefault();
  
  console.log('📝 جاري معالجة الطلب الجديد...');
  
  // جمع بيانات النموذج
  const customer = document.getElementById('customerName')?.value || '';
  const phone = document.getElementById('customerPhone')?.value || '';
  const animal = document.getElementById('animalType')?.value || '';
  const quantity = parseInt(document.getElementById('quantity')?.value || 0);
  const pricePerUnit = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  const total = quantity * pricePerUnit;
  const service = document.getElementById('serviceType')?.value || '';
  const status = 'قيد المعالجة'; // الحالة الافتراضية
  
  // التحقق من البيانات
  if (!customer || !phone || !animal || quantity === 0 || pricePerUnit === 0) {
    alert('❌ الرجاء ملء جميع الحقول المطلوبة');
    return;
  }
  
  // إنشاء الطلب
  const newOrder = {
    id: Date.now(),
    customer,
    phone,
    animal,
    quantity,
    pricePerUnit,
    total,
    service,
    status,
    location: 'الرياض',
    date: new Date().toLocaleDateString('ar-SA'),
    time: new Date().toLocaleTimeString('ar-SA')
  };
  
  console.log('📊 الطلب الجديد:', newOrder);
  
  // حفظ في localStorage أولاً
  allOrders.push(newOrder);
  localStorage.setItem('meatOrders', JSON.stringify(allOrders));
  console.log('💾 تم حفظ الطلب في localStorage');
  
  // إرسال إلى Google Apps Script (بشكل asynchronous)
  console.log('📤 جاري إرسال البيانات إلى Google Apps Script...');
  sendOrderToGoogleAppsScript(newOrder).then(success => {
    if (success) {
      console.log('✅ تم الإرسال إلى Google Apps Script و Telegram');
    } else {
      console.log('⚠️ تم الحفظ محليًا (لم يتم الإرسال للخادم)');
    }
  });
  
  // تحديث الواجهة
  loadOrders();
  alert('✅ تم إضافة الطلب بنجاح!');
  
  // إعادة تعيين النموذج
  document.getElementById('orderForm')?.reset();
  closeAddOrderModal();
}

// ════════════════════════════════════════════════════════════════════════════
// إدارة الطلبات
// ════════════════════════════════════════════════════════════════════════════

function loadOrders() {
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  filteredOrders = [...allOrders];
  renderOrders();
  updateStats();
  renderCharts();
}

function saveOrders() {
  localStorage.setItem('meatOrders', JSON.stringify(allOrders));
  console.log('💾 تم حفظ جميع الطلبات');
}

function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  
  const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filterStatus = document.getElementById('filterStatus')?.value || '';
  
  // تطبيق البحث والفلترة
  filteredOrders = allOrders.filter(order => {
    const matchesSearch = !searchText || 
      order.id.toString().includes(searchText) || 
      order.phone.includes(searchText) || 
      order.customer.toLowerCase().includes(searchText);
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
      (aVal > bVal ? 1 : -1) : 
      (aVal < bVal ? 1 : -1);
  });
  
  // عرض الطلبات
  tbody.innerHTML = filteredOrders.map(order => `
    <tr>
      <td>#${order.id}</td>
      <td>${order.customer}</td>
      <td>${order.phone}</td>
      <td>${order.animal}</td>
      <td>${order.quantity}</td>
      <td>${order.pricePerUnit} ريال</td>
      <td><strong>${order.total} ريال</strong></td>
      <td>${order.service}</td>
      <td><span style="background-color: var(--color-info); padding: 4px 8px; border-radius: 4px; color: white;">${order.status}</span></td>
      <td>${order.date}</td>
    </tr>
  `).join('') || '<tr><td colspan="10" style="text-align: center; color: #999;">لا توجد بيانات</td></tr>';
}

// ════════════════════════════════════════════════════════════════════════════
// الإحصائيات
// ════════════════════════════════════════════════════════════════════════════

function updateStats() {
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);
  const averageOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;
  const pendingOrders = allOrders.filter(o => o.status === 'قيد المعالجة').length;
  
  // تحديث العناصر
  const elements = {
    'totalOrders': totalOrders,
    'totalRevenue': totalRevenue.toLocaleString('ar-SA'),
    'averageOrder': averageOrder.toLocaleString('ar-SA'),
    'pendingOrders': pendingOrders
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// الرسوم البيانية
// ════════════════════════════════════════════════════════════════════════════

function renderCharts() {
  if (allOrders.length === 0) return;
  
  // الرسم البياني 1: الإجمالي حسب الحالة
  const statusCounts = {
    'قيد المعالجة': 0,
    'تم التوصيل': 0,
    'ملغي': 0
  };
  
  allOrders.forEach(o => {
    if (statusCounts.hasOwnProperty(o.status)) {
      statusCounts[o.status]++;
    }
  });
  
  let statusHTML = '<table style="width:100%">';
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = Math.round((count / allOrders.length) * 100) || 0;
    statusHTML += `<tr><td>${status}</td><td>${count} (${percentage}%)</td></tr>`;
  });
  statusHTML += '</table>';
  const statusEl = document.getElementById('statusDistribution');
  if (statusEl) statusEl.innerHTML = statusHTML;
  
  // الرسم البياني 2: أفضل الماشيات
  const animalCounts = {};
  allOrders.forEach(o => {
    animalCounts[o.animal] = (animalCounts[o.animal] || 0) + 1;
  });
  
  let animalHTML = '<table style="width:100%">';
  Object.entries(animalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([animal, count]) => {
      const percentage = Math.round((count / allOrders.length) * 100) || 0;
      animalHTML += `<tr><td style="text-align:left">${animal}</td><td style="text-align:right">${count} (${percentage}%)</td></tr>`;
    });
  animalHTML += '</table>';
  const animalEl = document.getElementById('animalDistribution');
  if (animalEl) animalEl.innerHTML = animalHTML;
}

// ════════════════════════════════════════════════════════════════════════════
// الإعدادات
// ════════════════════════════════════════════════════════════════════════════

function loadSettings() {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) enableDarkMode();
}

function checkDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  const btn = document.getElementById('darkModeToggle');
  if (btn) {
    btn.textContent = isDark ? '☀️' : '🌙';
  }
}

function enableDarkMode() {
  document.documentElement.setAttribute('data-color-scheme', 'dark');
  localStorage.setItem('darkMode', 'true');
  const btn = document.getElementById('darkModeToggle');
  if (btn) btn.textContent = '☀️';
}

function disableDarkMode() {
  document.documentElement.removeAttribute('data-color-scheme');
  localStorage.setItem('darkMode', 'false');
  const btn = document.getElementById('darkModeToggle');
  if (btn) btn.textContent = '🌙';
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
  if (isDark) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// التحديثات
// ════════════════════════════════════════════════════════════════════════════

function updateLastUpdate() {
  const el = document.getElementById('lastUpdate');
  if (el) {
    el.textContent = new Date().toLocaleString('ar-SA');
  }
}

function deleteAllData() {
  if (confirm('⚠️ هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا!')) {
    localStorage.removeItem('meatOrders');
    allOrders = [];
    filteredOrders = [];
    loadOrders();
    alert('✅ تم حذف جميع البيانات');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// واجهة المودالات
// ════════════════════════════════════════════════════════════════════════════

function showAddOrderForm() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.style.display = 'block';
    modal.classList.add('show');
  }
}

function closeAddOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// تسجيل الدخول
// ════════════════════════════════════════════════════════════════════════════

console.log('✅ app.js تم تحميله بنجاح');
console.log('🔗 Google Apps Script URL:', APPS_SCRIPT_URL);
console.log('✅ مع دعم Telegram و Google Sheet التلقائي!');
