/* 🍖 لحوم الرياض - app.js - النسخة الكاملة المتقدمة */

// ⚙️ إعدادات Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyj0cgSy_TUYejv-cpqzGykk_bS8z1IHlKfuRMvgc6FpAEt12Pp0Nq5RyCAiblnxKS8pQ/exec";

// 🌐 المتغيرات العامة
let allOrders = [];
let filteredOrders = [];

// 🚀 تحميل البيانات عند بدء التطبيق
window.addEventListener('load', () => {
  loadOrders();
  updateStats();
  updateReports();
  updateSystemInfo();
});

// 💾 تحميل الطلبات من localStorage
function loadOrders() {
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  filteredOrders = [...allOrders];
  renderOrders();
}

// 📝 عرض الطلبات
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  
  if (filteredOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">لا توجد طلبات</td></tr>';
    return;
  }

  tbody.innerHTML = filteredOrders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.customer || '-'}</td>
      <td>${order.phone || '-'}</td>
      <td>${order.animal}</td>
      <td>${order.quantity}</td>
      <td>${order.total} ر.س</td>
      <td>
        <span class="badge badge-${getBadgeClass(order.status)}">
          ${order.status}
        </span>
      </td>
      <td>${order.date}</td>
    </tr>
  `).join('');
}

// 🔍 تصنيف Badge
function getBadgeClass(status) {
  const map = {
    'معلق': 'pending',
    'قيد التحضير': 'processing',
    'تم التوصيل': 'completed',
    'ملغى': 'cancelled'
  };
  return map[status] || 'pending';
}

// 🔎 البحث والفلترة
function filterOrders() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;

  filteredOrders = allOrders.filter(order => {
    const matchesSearch = !search || 
      order.id.toLowerCase().includes(search) ||
      order.phone.includes(search) ||
      order.customer.toLowerCase().includes(search);
    
    const matchesStatus = !status || order.status === status;
    
    return matchesSearch && matchesStatus;
  });

  renderOrders();
}

// 📊 تحديث الإحصائيات
function updateStats() {
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const averageAmount = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingOrders = allOrders.filter(o => o.status === 'معلق').length;

  document.getElementById('statTotal').textContent = totalOrders;
  document.getElementById('statRevenue').textContent = totalRevenue.toFixed(0) + ' ر.س';
  document.getElementById('statAverage').textContent = averageAmount.toFixed(0) + ' ر.س';
  document.getElementById('statPending').textContent = pendingOrders;
}

// 📈 تحديث التقارير
function updateReports() {
  if (!document.getElementById('reports-tab').classList.contains('active')) return;

  // أعلى مبيعة
  const topOrder = allOrders.reduce((max, o) => (o.total > max.total ? o : max), allOrders[0] || {});
  document.getElementById('topSale').textContent = topOrder.total ? topOrder.total + ' ر.س' : '-';

  // عدد العملاء الفريدين
  const uniqueCustomers = new Set(allOrders.map(o => o.phone)).size;
  document.getElementById('totalCustomers').textContent = uniqueCustomers;

  // أكثر ماشية
  const animalCounts = {};
  allOrders.forEach(o => {
    animalCounts[o.animal] = (animalCounts[o.animal] || 0) + 1;
  });
  const topAnimal = Object.entries(animalCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('topAnimal').textContent = topAnimal ? topAnimal[0] : '-';

  // نسبة الإنجاز
  const completed = allOrders.filter(o => o.status === 'تم التوصيل').length;
  const rate = allOrders.length > 0 ? Math.round((completed / allOrders.length) * 100) : 0;
  document.getElementById('completionRate').textContent = rate + '%';

  // توزيع الحالات
  document.getElementById('dist-pending').textContent = allOrders.filter(o => o.status === 'معلق').length;
  document.getElementById('dist-processing').textContent = allOrders.filter(o => o.status === 'قيد التحضير').length;
  document.getElementById('dist-completed').textContent = allOrders.filter(o => o.status === 'تم التوصيل').length;
  document.getElementById('dist-cancelled').textContent = allOrders.filter(o => o.status === 'ملغى').length;

  // توزيع الماشيات
  let animalHTML = '<table style="width: 100%;">';
  Object.entries(animalCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([animal, count]) => {
      const percentage = Math.round((count / allOrders.length) * 100) || 0;
      animalHTML += `
        <tr>
          <td style="text-align: left;">${animal}</td>
          <td style="text-align: right;">${count} (${percentage}%)</td>
        </tr>
      `;
    });
  animalHTML += '</table>';
  document.getElementById('animalDistribution').innerHTML = animalHTML || '<p>لا توجد بيانات</p>';
}

// 💾 إضافة طلب جديد
async function handleAddOrder(event) {
  event.preventDefault();

  const orderData = {
    customer: document.getElementById('customerName').value,
    phone: document.getElementById('customerPhone').value,
    animal: document.getElementById('animalType').value,
    quantity: parseInt(document.getElementById('quantity').value),
    price: parseFloat(document.getElementById('pricePerUnit').value),
    total: parseFloat(document.getElementById('totalAmount').value),
    service: document.getElementById('serviceType').value,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    date: document.getElementById('orderDate').value,
    id: 'ORD-' + Date.now()
  };

try {
  console.log("📤 Sending data to:", APPS_SCRIPT_URL);
  console.log("📦 Data:", JSON.stringify(orderData));
  
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  console.log("✅ Response status:", response.status);
  console.log("✅ Response:", await response.text());


    // حفظ محلي
    allOrders.push(orderData);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));

    showAlert('✅ تم حفظ الطلب بنجاح! تم إشعار البائع.', 'success', 'modalAlertBox');
    
    loadOrders();
    updateStats();
    updateSystemInfo();

    setTimeout(() => closeOrderModal(), 1500);

  } catch (error) {
    console.error(error);
    showAlert('❌ حدث خطأ، حاول مرة أخرى', 'error', 'modalAlertBox');
  }
}

// 📢 عرض التنبيهات
function showAlert(message, type, elementId = 'alertBox') {
  const box = document.getElementById(elementId);
  if (!box) return;
  
  box.textContent = message;
  box.className = `alert show alert-${type}`;
  
  setTimeout(() => box.classList.remove('show'), 4000);
}

// 📥 تنزيل البيانات
function downloadData() {
  const dataStr = JSON.stringify(allOrders, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meat-riyadh-orders-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 📤 استيراد البيانات
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
        updateStats();
        alert('✅ تم استيراد البيانات بنجاح!');
      }
    } catch (err) {
      alert('❌ خطأ في الملف');
    }
  };
  reader.readAsText(file);
}

// 🗑️ حذف جميع البيانات
function deleteAllData() {
  if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!')) {
    allOrders = [];
    localStorage.removeItem('meatOrders');
    loadOrders();
    updateStats();
    alert('✅ تم حذف البيانات');
  }
}

// ℹ️ معلومات النظام
function updateSystemInfo() {
  document.getElementById('totalOrdersInfo').textContent = allOrders.length;
  document.getElementById('lastUpdateInfo').textContent = new Date().toLocaleString('ar-SA');
  
  const dataSize = (JSON.stringify(allOrders).length / 1024).toFixed(2);
  document.getElementById('dataSize').textContent = dataSize + ' KB';
}
