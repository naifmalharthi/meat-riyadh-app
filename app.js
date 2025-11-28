/* 🍖 لحوم الرياض - app.js - نسخة صحيحة 100% - FINAL */

// ⚙️ إعدادات Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyj0cgSy_TUYejv-cpqzGykk_bS8z1IHlKfuRMvgc6FpAEt12Pp0Nq5RyCAiblnxKS8pQ/exec";

// 🌐 المتغيرات العامة
let allOrders = [];
let filteredOrders = [];

// 💰 حساب الإجمالي تلقائياً - يجب تكون GLOBAL من البداية
function calculateTotal() {
  const quantityInput = document.getElementById('quantity');
  const priceInput = document.getElementById('pricePerUnit');
  const totalOutput = document.getElementById('totalAmount');

  if (quantityInput && priceInput && totalOutput) {
    const qty = parseInt(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const total = qty * price;
    totalOutput.textContent = total.toLocaleString('ar-SA');
  }
}

// 🚀 تحميل البيانات عند بدء التطبيق
window.addEventListener('DOMContentLoaded', () => {
  console.log("✅ APP STARTED");
  loadOrders();
  updateStats();
  attachFormListener();
});

// 📌 ربط الـ Form بـ handleAddOrder
function attachFormListener() {
  const form = document.getElementById('orderForm');
  if (form) {
    console.log("✅ Form attached");
    form.addEventListener('submit', handleAddOrder);
  } else {
    console.error("❌ Form NOT found");
  }
}

// 💾 تحميل الطلبات من localStorage
function loadOrders() {
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  filteredOrders = [...allOrders];
  renderOrders();
  console.log("✅ Loaded " + allOrders.length + " orders");
}

// 📝 عرض الطلبات في الجدول
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (filteredOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">لا توجد طلبات</td></tr>';
    return;
  }

  tbody.innerHTML = filteredOrders.map(order => `
    <tr>
      <td>${order.id || ''}</td>
      <td>${order.customer || ''}</td>
      <td>${order.phone || ''}</td>
      <td>${order.animal || ''}</td>
      <td>${order.quantity || ''}</td>
      <td>${order.price || ''}</td>
      <td>${order.total || ''}</td>
      <td>${order.service || ''}</td>
      <td>${order.status || 'جديد'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')">حذف</button></td>
    </tr>
  `).join('');
}

// 💾 إضافة طلب جديد
function handleAddOrder(event) {
  event.preventDefault();
  console.log("🔄 Form submitted");

  try {
    const customerName = document.getElementById('customerName');
    const customerPhone = document.getElementById('customerPhone');
    const animalType = document.getElementById('animalType');
    const quantity = document.getElementById('quantity');
    const pricePerUnit = document.getElementById('pricePerUnit');
    const totalAmount = document.getElementById('totalAmount');
    const serviceType = document.getElementById('serviceType');
    const notes = document.getElementById('notes');

    if (!customerName || !customerPhone) {
      alert('❌ الحقول غير موجودة');
      return;
    }

    const orderData = {
      id: 'ORD-' + Date.now(),
      customer: customerName.value.trim(),
      phone: customerPhone.value.trim(),
      animal: animalType ? animalType.value : '',
      quantity: quantity ? parseInt(quantity.value) || 0 : 0,
      price: pricePerUnit ? parseFloat(pricePerUnit.value) || 0 : 0,
      total: totalAmount ? parseFloat(totalAmount.textContent || totalAmount.value) || 0 : 0,
      service: serviceType ? serviceType.value : '',
      status: 'جديد',
      notes: notes ? notes.value.trim() : '',
      date: new Date().toLocaleDateString('ar-SA'),
      timestamp: new Date().toLocaleString('ar-SA')
    };

    // التحقق من البيانات
    if (!orderData.customer || !orderData.phone) {
      alert('❌ الرجاء ملء الاسم والهاتف');
      return;
    }

    // حفظ محلي
    allOrders.push(orderData);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    console.log("✅ Saved order: " + orderData.id);

    // إرسال للـ Google Apps Script
    sendToGoogleAppsScript(orderData);

    // تحديث الواجهة
    alert('✅ تم حفظ الطلب بنجاح!');
    
    // تنظيف النموذج
    const form = document.getElementById('orderForm');
    if (form) form.reset();
    
    loadOrders();
    updateStats();

    // إغلاق الـ Modal
    setTimeout(() => {
      const modal = document.getElementById('orderModal');
      if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    }, 500);

  } catch (error) {
    console.error(error);
    alert('❌ خطأ: ' + error.message);
  }
}

// 📤 إرسال البيانات للـ Google Apps Script
async function sendToGoogleAppsScript(orderData) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    console.log("📡 Sent to GAS, status: " + response.status);
  } catch (error) {
    console.log("⚠️ GAS error (expected): " + error.message);
  }
}

// 🗑️ حذف طلب
function deleteOrder(orderId) {
  if (confirm('هل متأكد من الحذف؟')) {
    allOrders = allOrders.filter(o => o.id !== orderId);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    alert('✅ تم الحذف');
    loadOrders();
    updateStats();
  }
}

// 📊 تحديث الإحصائيات
function updateStats() {
  const total = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const totalOrdersEl = document.getElementById('totalOrders');
  const totalRevenueEl = document.getElementById('totalRevenue');

  if (totalOrdersEl) totalOrdersEl.textContent = total;
  if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue.toLocaleString('ar-SA');
}

console.log("✅ app.js loaded");
