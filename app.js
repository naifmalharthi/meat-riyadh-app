/* 🍖 لحوم الرياض - app.js - DEBUG + FIX */

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

// 🚀 تأكد من تحميل التطبيق
window.addEventListener('DOMContentLoaded', () => {
  console.log("🔥 DOMContentLoaded fired");
  loadOrders();
  updateStats();
  setupFormListener();
});

// 📌 ربط الـ Form بطريقة موثوقة
function setupFormListener() {
  console.log("🔍 Looking for form...");
  
  // طريقة 1: البحث عن الـ Form بـ ID
  const form = document.getElementById('orderForm');
  if (form) {
    console.log("✅ Form found by ID");
    form.addEventListener('submit', handleAddOrder);
  } else {
    console.log("⚠️ Form not found by ID, searching for submit button...");
    
    // طريقة 2: البحث عن الزر مباشرة
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      console.log(`Button ${idx}:`, btn.textContent, btn.type);
      if (btn.textContent.includes('حفظ') || btn.type === 'submit') {
        console.log("✅ Found save button:", btn.textContent);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          handleAddOrder(e);
        });
      }
    });
  }
  
  // طريقة 3: البحث عن جميع الـ Forms
  const allForms = document.querySelectorAll('form');
  console.log("Total forms found:", allForms.length);
  allForms.forEach((f, idx) => {
    console.log(`Form ${idx}:`, f.id);
    f.addEventListener('submit', handleAddOrder);
  });
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

// 💾 ADD ORDER - الدالة الرئيسية
function handleAddOrder(event) {
  console.log("🔥🔥🔥 FORM SUBMITTED!");
  if (event) event.preventDefault();
  
  console.log("📋 Collecting data...");
  
  const nameEl = document.getElementById('customerName');
  const phoneEl = document.getElementById('customerPhone');
  const animalEl = document.getElementById('animalType');
  const qtyEl = document.getElementById('quantity');
  const priceEl = document.getElementById('pricePerUnit');
  const totalEl = document.getElementById('totalAmount');
  const serviceEl = document.getElementById('serviceType');
  
  console.log("Elements found:");
  console.log("- customerName:", nameEl ? "✅" : "❌");
  console.log("- customerPhone:", phoneEl ? "✅" : "❌");
  console.log("- animalType:", animalEl ? "✅" : "❌");
  console.log("- quantity:", qtyEl ? "✅" : "❌");
  console.log("- pricePerUnit:", priceEl ? "✅" : "❌");
  console.log("- totalAmount:", totalEl ? "✅" : "❌");
  console.log("- serviceType:", serviceEl ? "✅" : "❌");
  
  const name = nameEl?.value?.trim();
  const phone = phoneEl?.value?.trim();
  const animal = animalEl?.value || '';
  const qty = parseInt(qtyEl?.value || 0);
  const price = parseFloat(priceEl?.value || 0);
  const total = parseFloat(totalEl?.textContent?.replace(/,/g, '') || 0);
  const service = serviceEl?.value || '';

  console.log("Data collected:");
  console.log("- Name:", name);
  console.log("- Phone:", phone);
  console.log("- Animal:", animal);
  console.log("- Qty:", qty);
  console.log("- Price:", price);
  console.log("- Total:", total);
  console.log("- Service:", service);

  if (!name || !phone) {
    console.error("❌ Missing name or phone");
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
    date: new Date().toLocaleDateString('ar-SA'),
    timestamp: new Date().toLocaleString('ar-SA')
  };

  console.log("📦 Order object:", order);

  try {
    allOrders.push(order);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    console.log("✅ SAVED TO LOCALSTORAGE");
    console.log("Total orders now:", allOrders.length);
  } catch (e) {
    console.error("❌ Save failed:", e);
    alert('❌ خطأ في الحفظ');
    return;
  }

  alert('✅ تم حفظ الطلب بنجاح!');

  const formEl = document.getElementById('orderForm');
  if (formEl) {
    console.log("Resetting form...");
    formEl.reset();
  }
  
  loadOrders();
  updateStats();

  const modal = document.getElementById('orderModal');
  if (modal) {
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) bsModal.hide();
  }

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
  
  console.log("📊 Stats updated: " + total + " orders, " + revenue + " revenue");
}

console.log("✅ app.js loaded with DEBUG mode");
