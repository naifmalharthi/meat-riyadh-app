/* 🍖 لحوم الرياض - app.js - FIX NULL TOTAL */

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
  console.log("🔍 Looking for EXACT save button...");
  
  const buttons = document.querySelectorAll('button');
  let saveButtonFound = false;
  
  buttons.forEach((btn) => {
    const text = btn.textContent.trim();
    
    if (text.includes('حفظ') && text.includes('الطلب')) {
      console.log("✅ Found EXACT save button: " + text);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleAddOrder();
      });
      
      saveButtonFound = true;
      return;
    }
  });
  
  if (!saveButtonFound) {
    console.warn("⚠️ Exact save button not found");
  }
  
  const form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', (e) => {
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
      <td>${o.total || 0}</td>
      <td>${o.service}</td>
      <td>${o.status}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteOrder('${o.id}')">حذف</button></td>
    </tr>
  `).join('');
}

// 💾 ADD ORDER
function handleAddOrder() {
  const name = document.getElementById('customerName')?.value?.trim();
  const phone = document.getElementById('customerPhone')?.value?.trim();
  const animal = document.getElementById('animalType')?.value || '';
  const qty = parseInt(document.getElementById('quantity')?.value || 0);
  const price = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  
  // ✅ FIX: احصل على الإجمالي بطرق متعددة
  let totalEl = document.getElementById('totalAmount');
  let total = 0;
  
  if (totalEl) {
    // جرب textContent أولاً
    const textTotal = totalEl.textContent?.trim();
    if (textTotal) {
      total = parseFloat(textTotal.replace(/,/g, '')) || 0;
    }
    // إذا لم ينجح، احسبها يدوياً
    if (total === 0) {
      total = qty * price;
    }
  } else {
    // إذا لم توجد العنصر، احسبها من qty و price
    total = qty * price;
  }
  
  const service = document.getElementById('serviceType')?.value || '';

  if (!name || !phone) {
    alert('❌ الرجاء ملء الاسم والهاتف');
    return;
  }

  console.log("✅ Total value:", total, "| Qty:", qty, "| Price:", price);

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
    console.log("✅ Order saved:", allOrders.length);
  } catch (e) {
    alert('❌ خطأ في الحفظ');
    return;
  }

  alert('✅ تم حفظ الطلب بنجاح!');

  const form = document.getElementById('orderForm');
  if (form) form.reset();
  
  loadOrders();
  updateStats();

  const modal = document.getElementById('orderModal');
  if (modal) {
    try {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    } catch (e) {
      console.log("Modal close attempted");
    }
  }

  syncWithGoogleSheets(order);
}

function syncWithGoogleSheets(order) {
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }).then(r => console.log("✅ Google Sheets synced"))
    .catch(e => console.log("⚠️ Sync note:", e.message));
}

function deleteOrder(id) {
  if (confirm('حذف هذا الطلب؟')) {
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
}

console.log("✅ app.js loaded - NULL FIX");
