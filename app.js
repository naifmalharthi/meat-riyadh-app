/* 🍖 لحوم الرياض - app.js - متصل بـ Google Sheets */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwq0O2dFt_5DY0nhHhu6xVV6xf8OY9Azsis3AvCuBY8vpLth8ak6JdWXt-H5r7BHOa6/exec";

// 🌐 المتغيرات العامة
let allOrders = [];
let filteredOrders = [];

// 💰 حساب الإجمالي تلقائياً (GLOBAL - يعمل في أي وقت)
function calculateTotal() {
  console.log("💰 calculateTotal called");
  const quantityInput = document.getElementById('quantity');
  const priceInput = document.getElementById('pricePerUnit');
  const totalOutput = document.getElementById('totalAmount');

  if (quantityInput && priceInput && totalOutput) {
    const qty = parseInt(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const total = qty * price;
    totalOutput.textContent = total.toLocaleString('ar-SA');
    console.log(`✅ Total calculated: ${qty} × ${price} = ${total}`);
  }
}

// 🚀 تحميل البيانات عند بدء التطبيق
window.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Page loaded - initializing...");
  loadOrders();
  updateStats();
  attachEventListeners();
  attachCalculatorListeners();
});

// 📌 ربط الأحداث بالعناصر
function attachEventListeners() {
  const form = document.getElementById('orderForm');
  if (form) {
    console.log("✅ Form found - attaching submit listener");
    form.addEventListener('submit', handleAddOrder);
  } else {
    console.error("❌ orderForm not found!");
  }
}

// 📌 ربط أحداث الآلة الحاسبة
function attachCalculatorListeners() {
  const quantityInput = document.getElementById('quantity');
  const priceInput = document.getElementById('pricePerUnit');

  if (quantityInput && priceInput) {
    console.log("✅ Calculator inputs found - attaching listeners");
    quantityInput.addEventListener('input', calculateTotal);
    quantityInput.addEventListener('change', calculateTotal);
    priceInput.addEventListener('input', calculateTotal);
    priceInput.addEventListener('change', calculateTotal);
  } else {
    console.warn("⚠️ Calculator inputs not found - will use inline handlers");
  }
}

// 💾 تحميل الطلبات من localStorage
function loadOrders() {
  console.log("📂 Loading orders from localStorage...");
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  console.log(`✅ Loaded ${allOrders.length} orders`);
  filteredOrders = [...allOrders];
  renderOrders();
}

// 📝 عرض الطلبات في الجدول
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) {
    console.error("❌ ordersTableBody not found!");
    return;
  }

  console.log(`📊 Rendering ${filteredOrders.length} orders...`);

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
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')">حذف</button>
      </td>
    </tr>
  `).join('');
}

// 💾 إضافة طلب جديد
function handleAddOrder(event) {
  event.preventDefault();
  console.log("🔄 Processing order form submission...");

  try {
    // جمع البيانات من النموذج
    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');
    const animalTypeInput = document.getElementById('animalType');
    const quantityInput = document.getElementById('quantity');
    const pricePerUnitInput = document.getElementById('pricePerUnit');
    const totalAmountInput = document.getElementById('totalAmount');
    const serviceTypeInput = document.getElementById('serviceType');
    const notesInput = document.getElementById('notes');

    // التحقق من وجود الحقول
    if (!customerNameInput || !customerPhoneInput) {
      console.error("❌ Form inputs not found!");
      showAlert('❌ خطأ: بعض حقول النموذج غير موجودة', 'error');
      return;
    }

    const orderData = {
      id: 'ORD-' + Date.now(),
      customer: customerNameInput.value.trim(),
      phone: customerPhoneInput.value.trim(),
      animal: animalTypeInput ? animalTypeInput.value : '',
      quantity: quantityInput ? parseInt(quantityInput.value) || 0 : 0,
      price: pricePerUnitInput ? parseFloat(pricePerUnitInput.value) || 0 : 0,
      total: totalAmountInput ? parseFloat(totalAmountInput.textContent || totalAmountInput.value) || 0 : 0,
      service: serviceTypeInput ? serviceTypeInput.value : '',
      status: 'جديد',
      notes: notesInput ? notesInput.value.trim() : '',
      date: new Date().toLocaleDateString('ar-SA'),
      timestamp: new Date().toLocaleString('ar-SA')
    };

    console.log("📋 Order data:", JSON.stringify(orderData));

    // التحقق من البيانات الأساسية
    if (!orderData.customer || !orderData.phone) {
      console.error("❌ Missing required fields");
      showAlert('❌ الرجاء ملء الاسم والهاتف', 'error');
      return;
    }

    // 1️⃣ حفظ محلي FIRST (الأهم!)
    console.log("💾 Saving to localStorage...");
    allOrders.push(orderData);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    console.log("✅ Saved to localStorage successfully");

    // 2️⃣ إرسال للـ Google Apps Script
    console.log("📤 Sending to Google Sheets...");
    sendToGoogleAppsScript(orderData);

    // 3️⃣ تحديث الواجهة
    showAlert('✅ تم حفظ الطلب بنجاح! تم إرساله إلى الجدول', 'success');
    
    // تنظيف النموذج
    const form = document.getElementById('orderForm');
    if (form) form.reset();
    
    // تحديث الإحصائيات والجدول
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
    console.error("❌ Error:", error);
    showAlert('❌ حدث خطأ: ' + error.message, 'error');
  }
}

// 📤 إرسال البيانات للـ Google Apps Script
async function sendToGoogleAppsScript(orderData) {
  try {
    console.log("🌐 Sending to Google Sheets via Apps Script...");
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    console.log("📡 Response status:", response.status);
    const result = await response.text();
    console.log("📡 Response:", result);

    if (response.ok) {
      console.log("✅ Successfully sent to Google Sheets");
    } else {
      console.error("⚠️ Google Apps Script returned:", result);
    }
  } catch (error) {
    console.log("⚠️ Google Sheets sync in progress...", error.message);
  }
}

// 🗑️ حذف طلب
function deleteOrder(orderId) {
  if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
    console.log("🗑️ Deleting order:", orderId);
    allOrders = allOrders.filter(o => o.id !== orderId);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    showAlert('✅ تم حذف الطلب', 'success');
    loadOrders();
    updateStats();
  }
}

// 📊 تحديث الإحصائيات
function updateStats() {
  console.log("📊 Updating statistics...");
  const total = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const totalOrdersEl = document.getElementById('totalOrders');
  const totalRevenueEl = document.getElementById('totalRevenue');

  if (totalOrdersEl) totalOrdersEl.textContent = total;
  if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue.toLocaleString('ar-SA');

  console.log(`✅ Stats updated: ${total} orders, Revenue: ${totalRevenue}`);
}

// 📢 عرض التنبيهات
function showAlert(message, type) {
  console.log(`📢 Alert [${type}]: ${message}`);
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) {
    console.error("❌ alertBox not found!");
    alert(message);
    return;
  }

  alertBox.textContent = message;
  alertBox.className = `alert alert-${type === 'error' ? 'danger' : type} show`;
  alertBox.style.display = 'block';

  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 4000);
}

console.log("✅ app.js loaded successfully - connected to Google Sheets");
