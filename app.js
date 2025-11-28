/* 🍖 لحوم الرياض - app.js - SIMPLE WORKING VERSION */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwq0O2dFt_5DY0nhHhu6xVV6xf8OY9Azsis3AvCuBY8vpLth8ak6JdWXt-H5r7BHOa6/exec";

let allOrders = [];
let filteredOrders = [];

// 💰 حساب الإجمالي - GLOBAL
function calculateTotal() {
  const qty = parseInt(document.getElementById('quantity')?.value || 0);
  const price = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  const total = qty * price;
  const el = document.getElementById('totalAmount');
  if (el) el.textContent = total.toLocaleString('ar-SA');
}

// 🚀 Start
window.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  updateStats();
  setupForm();
});

// 📌 Setup Form - ابحث عن الزر مباشرة
function setupForm() {
  // طريقة 1: البحث عن الـ Form
  const form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', handleAddOrder);
  }
  
  // طريقة 2: البحث عن الزر مباشرة (بديل)
  const saveBtn = document.querySelector('button[type="submit"]');
  if (saveBtn && saveBtn.textContent.includes('حفظ')) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleAddOrder(new Event('submit'));
    });
  }
}

// 💾 Load Orders
function loadOrders() {
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  filteredOrders = [...allOrders];
  renderOrders();
}

// 📝 Render
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  
  if (!filteredOrders.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">لا توجد طلبات</td></tr>';
    return;
  }
  
  tbody.innerHTML = filteredOrders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.phone}</td>
      <td>${o.animal}</td>
      <td>${o.quantity}</td>
      <td>${o.price}</td>
      <td>${o.total}</td>
      <td>${o.service}</td>
      <td>${o.status}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteOrder('${o.id}')">حذف</button></td>
    </tr>
  `).join('');
}

// 💾 ADD ORDER - الدالة الأساسية
function handleAddOrder(event) {
  if (event) event.preventDefault();
  
  console.log("🔥 SAVING ORDER...");
  
  const name = document.getElementById('customerName')?.value?.trim();
  const phone = document.getElementById('customerPhone')?.value?.trim();
  const animal = document.getElementById('animalType')?.value || '';
  const qty = parseInt(document.getElementById('quantity')?.value || 0);
  const price = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  const total = parseFloat(document.getElementById('totalAmount')?.textContent?.replace(/,/g, '') || 0);
  const service = document.getElementById('serviceType')?.value || '';
  const notes = document.getElementById('notes')?.value?.trim() || '';

  if (!name || !phone) {
    alert('❌ الرجاء ملء الاسم والهاتف');
    return;
  }

  const order = {
    id: 'ORD-' + Date.now(),
    customer: name,
    phone: phone,
    animal: animal,
    quantity: qty,
    price: price,
    total: total,
    service: service,
    status: 'جديد',
    notes: notes,
    date: new Date().toLocaleDateString('ar-SA'),
    timestamp: new Date().toLocaleString('ar-SA')
  };

  // SAVE
  allOrders.push(order);
  localStorage.setItem('meatOrders', JSON.stringify(allOrders));
  
  console.log("✅ SAVED:", order);
  alert('✅ تم حفظ الطلب!');

  // Reset
  document.getElementById('orderForm')?.reset?.();
  
  // Update
  loadOrders();
  updateStats();

  // Close Modal
  const modal = document.getElementById('orderModal');
  if (modal) {
    const bsModal = bootstrap.Modal.getInstance(modal);
    bsModal?.hide();
  }

  // Send to GAS
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }).catch(e => console.log('GAS:', e.message));
}

// 🗑️ Delete
function deleteOrder(id) {
  if (confirm('حذف؟')) {
    allOrders = allOrders.filter(o => o.id !== id);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    loadOrders();
    updateStats();
  }
}

// 📊 Stats
function updateStats() {
  const total = allOrders.length;
  const revenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
  
  const el1 = document.getElementById('totalOrders');
  const el2 = document.getElementById('totalRevenue');
  
  if (el1) el1.textContent = total;
  if (el2) el2.textContent = revenue.toLocaleString('ar-SA');
}

console.log("✅ APP READY");
