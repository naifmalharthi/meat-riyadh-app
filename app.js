/* 🍖 لحوم الرياض - app.js - FIXED FORM SUBMISSION */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwq0O2dFt_5DY0nhHhu6xVV6xf8OY9Azsis3AvCuBY8vpLth8ak6JdWXt-H5r7BHOa6/exec";

let allOrders = [];
let filteredOrders = [];

function calculateTotal() {
  const qty = parseInt(document.getElementById('quantity')?.value || 0);
  const price = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  const total = qty * price;
  const el = document.getElementById('totalAmount');
  if (el) el.textContent = total.toLocaleString('ar-SA');
}

window.addEventListener('DOMContentLoaded', () => {
  console.log("🔥 DOMContentLoaded fired");
  loadOrders();
  updateStats();
  setupFormListener();
});

function setupFormListener() {
  console.log("🔍 Looking for save button...");
  
  // البحث عن الزر بناءً على النص
  const buttons = document.querySelectorAll('button');
  let found = false;
  
  buttons.forEach((btn, idx) => {
    const text = btn.textContent.trim();
    console.log(`Button ${idx}: "${text}" | type: "${btn.type}"`);
    
    // البحث عن أي زر يحتوي على "حفظ"
    if (text.includes('حفظ') || text.includes('Save') || btn.type === 'submit') {
      console.log("✅ Found save button!");
      
      // إضافة click listener مباشر
      btn.addEventListener('click', (e) => {
        console.log("🔥🔥🔥 BUTTON CLICKED!");
        e.preventDefault();
        handleAddOrder();
      });
      
      found = true;
    }
  });
  
  if (!found) {
    console.warn("⚠️ Save button not found, trying form listener only");
  }
  
  // أيضاً ربط الـ Form نفسها
  const form = document.getElementById('orderForm');
  if (form) {
    console.log("✅ Form found, adding submit listener");
    form.addEventListener('submit', (e) => {
      console.log("🔥 FORM SUBMIT EVENT!");
      e.preventDefault();
      handleAddOrder();
    });
  }
}

function loadOrders() {
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  filteredOrders = [...allOrders];
  renderOrders();
}

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

// 💾 ADD ORDER - دالة رئيسية بسيطة
function handleAddOrder() {
  console.log("🔥 handleAddOrder called");
  
  const name = document.getElementById('customerName')?.value?.trim();
  const phone = document.getElementById('customerPhone')?.value?.trim();
  const animal = document.getElementById('animalType')?.value || '';
  const qty = parseInt(document.getElementById('quantity')?.value || 0);
  const price = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  const total = parseFloat(document.getElementById('totalAmount')?.textContent?.replace(/,/g, '') || 0);
  const service = document.getElementById('serviceType')?.value || '';

  console.log("📋 Data:", { name, phone, animal, qty, price, total, service });

  if (!name || !phone) {
    alert('❌ الرجاء ملء الاسم والهاتف');
    console.error("❌ Name or phone missing");
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
    date: new Date().toLocaleDateString('ar-SA'),
    timestamp: new Date().toLocaleString('ar-SA')
  };

  try {
    allOrders.push(order);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    console.log("✅ SAVED TO LOCALSTORAGE - Total:", allOrders.length);
  } catch (e) {
    console.error("❌ Save failed:", e);
    alert('❌ خطأ في الحفظ');
    return;
  }

  alert('✅ تم حفظ الطلب بنجاح!');

  // Reset
  const form = document.getElementById('orderForm');
  if (form) {
    form.reset();
    console.log("Form reset");
  }
  
  loadOrders();
  updateStats();

  // Close modal
  const modal = document.getElementById('orderModal');
  if (modal) {
    try {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    } catch (e) {
      console.log("⚠️ Modal close:", e.message);
    }
  }

  // Sync
  syncWithGoogleSheets(order);
}

function syncWithGoogleSheets(order) {
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }).then(r => console.log("✅ Google Sheets synced"))
    .catch(e => console.log("⚠️ GAS:", e.message));
}

function deleteOrder(id) {
  if (confirm('حذف؟')) {
    allOrders = allOrders.filter(o => o.id !== id);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    loadOrders();
    updateStats();
    alert('✅ تم الحذف');
  }
}

function updateStats() {
  const total = allOrders.length;
  const revenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
  
  const el1 = document.getElementById('totalOrders');
  const el2 = document.getElementById('totalRevenue');
  
  if (el1) el1.textContent = total;
  if (el2) el2.textContent = revenue.toLocaleString('ar-SA');
  
  console.log("📊 Stats: " + total + " orders, " + revenue + " revenue");
}

console.log("✅ app.js loaded - FIXED");
