/* 🍖 لحوم الرياض - app.js - PROFESSIONAL VERSION v2.0 */
/* النسخة الاحترافية الكاملة - مع الحفاظ على الربط بـ Google Sheets و Telegram */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbygGltJNat_bWGkiTtun_npkLxXrksqbrna71TwtomcPsjnLahSLvrWQAjDXEsjoK35/exec";

// ==================== 📊 البيانات الأساسية ====================

const ANIMALS_DATA = {
  'غنم نعيمي': 'يتميز بجودة لحمه وطعمه الغني، يعتبر من الأنواع المطلوبة بكثرة للمناسبات',
  'غنم نجدي': 'معروف بحجمه الكبير ولحمه المميز الغني بالعصارة',
  'غنم حري': 'يتحمل الظروف المناخية القاسية، مناسب للبيئة الجافة',
  'غنم سواكني': 'يتميز بلحمه الجيد وخيار اقتصادي مناسب، ألوان مختلفة (أحمر، أبيض، أسود)',
  'غنم بربري': 'خيار صحي وطعمه خفيف، مناسب لعمليات التسمين والتجارة',
  'ماعز': 'لحم ماعز طازج وجودة عالية',
  'جمل': 'لحم جمل - للطلبات الكبيرة والجملة فقط'
};

const AGES = [
  '6 شهور',
  '1 سنة',
  'سنة ونصف',
  'سنتان'
];

const SERVICES = {
  'توصيل مجاني': {
    name: 'توصيل مجاني',
    type: 'delivery',
    price: 0,
    area: 'الرياض',
    description: 'توصيل مجاني داخل الرياض'
  },
  'توصيل برسم': {
    name: 'توصيل برسم',
    type: 'delivery_paid',
    base: 50,
    perKm: 1,
    description: 'يبدأ من 50 ريال + 1 ريال لكل كيلومتر'
  },
  'ذبح': {
    name: 'خدمة الذبح',
    type: 'additional',
    price: 20,
    description: 'خدمة الذبح الحلال'
  },
  'تقطيع': {
    name: 'خدمة التقطيع',
    type: 'additional',
    price: 25,
    description: 'تقطيع اللحم بحسب الطلب'
  },
  'تغليف': {
    name: 'خدمة التغليف',
    type: 'additional',
    price: 15,
    description: 'تغليف احترافي وآمن'
  },
  'استلام من المحل': {
    name: 'استلام من المحل',
    type: 'pickup',
    price: 0,
    location: 'الشفا',
    description: 'استلام من محل الشفا'
  }
};

const REGIONS = {
  'الرياض': {
    name: 'الرياض',
    minQty: 1,
    deliveryFree: true
  },
  'خارج الرياض (جملة فقط)': {
    name: 'خارج الرياض',
    minQty: 10,
    deliveryFree: false
  }
};

// ==================== 💾 متغيرات التطبيق ====================

let allOrders = [];
let filteredOrders = [];

// ==================== 🎨 الدوال المساعدة ====================

function formatCurrency(amount) {
  return amount.toLocaleString('ar-SA') + ' ر.س';
}

function getAnimalDescription(animal) {
  return ANIMALS_DATA[animal] || '';
}

function calculateDeliveryFee(distance = 0, deliveryType = 'free') {
  if (deliveryType === 'free') return 0;
  if (deliveryType === 'pickup') return 0;
  if (deliveryType === 'paid') {
    const fee = SERVICES['توصيل برسم'];
    return fee.base + (distance * fee.perKm);
  }
  return 0;
}

// ==================== 🖼️ التهيئة والعرض ====================

window.addEventListener('DOMContentLoaded', () => {
  console.log("🔥 App initialized - Professional v2.0");
  loadOrders();
  updateStats();
  setupFormListener();
  populateSelects();
  setupServiceListener();
  setupDeleteAllButton();
  setupExportButton();
});

function populateSelects() {
  // ملء قائمة الحيوانات
  const animalSelect = document.getElementById('animalType');
  if (animalSelect) {
    animalSelect.innerHTML = '<option value="">اختر نوع الحيوان</option>';
    Object.keys(ANIMALS_DATA).forEach(animal => {
      const option = document.createElement('option');
      option.value = animal;
      option.textContent = animal;
      animalSelect.appendChild(option);
    });
    
    animalSelect.addEventListener('change', () => {
      const desc = getAnimalDescription(animalSelect.value);
      const descEl = document.getElementById('animalDescription');
      if (descEl) {
        descEl.textContent = desc;
        descEl.style.display = desc ? 'block' : 'none';
      }
    });
  }

  // ملء قائمة الأعمار
  const ageSelect = document.getElementById('animalAge');
  if (ageSelect) {
    ageSelect.innerHTML = '<option value="">اختر العمر</option>';
    AGES.forEach(age => {
      const option = document.createElement('option');
      option.value = age;
      option.textContent = age;
      ageSelect.appendChild(option);
    });
  }

  // ملء قائمة الخدمات
  const serviceSelect = document.getElementById('serviceType');
  if (serviceSelect) {
    serviceSelect.innerHTML = '<option value="">اختر الخدمة</option>';
    Object.keys(SERVICES).forEach(key => {
      const service = SERVICES[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = service.name;
      option.title = service.description;
      serviceSelect.appendChild(option);
    });
  }

  // ملء قائمة المناطق
  const regionSelect = document.getElementById('region');
  if (regionSelect) {
    regionSelect.innerHTML = '<option value="">اختر المنطقة</option>';
    Object.keys(REGIONS).forEach(key => {
      const region = REGIONS[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = region.name;
      regionSelect.appendChild(option);
    });
  }
}

function setupServiceListener() {
  const serviceSelect = document.getElementById('serviceType');
  if (serviceSelect) {
    serviceSelect.addEventListener('change', () => {
      const selected = SERVICES[serviceSelect.value];
      const distanceField = document.getElementById('distanceField');
      const locationField = document.getElementById('locationField');
      
      if (distanceField) {
        distanceField.style.display = (selected?.type === 'delivery_paid') ? 'block' : 'none';
      }
      if (locationField) {
        locationField.style.display = (selected?.type === 'pickup') ? 'block' : 'none';
      }
    });
  }
}

function setupFormListener() {
  console.log("🔍 Setting up form listeners");
  
  const buttons = document.querySelectorAll('button');
  let saveButtonFound = false;
  
  buttons.forEach((btn) => {
    const text = btn.textContent.trim();
    
    if (text.includes('حفظ') && text.includes('الطلب')) {
      console.log("✅ Found save button: " + text);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleAddOrder();
      });
      
      saveButtonFound = true;
    }
  });
  
  if (!saveButtonFound) {
    console.warn("⚠️ Save button not found");
  }
  
  const form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAddOrder();
    });
  }
}

function setupDeleteAllButton() {
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      if (confirm('⚠️ هل أنت متأكد من حذف جميع الطلبات؟ هذه العملية لا تُرجع!')) {
        if (confirm('تأكيد نهائي: حذف جميع البيانات؟')) {
          allOrders = [];
          localStorage.setItem('meatOrders', JSON.stringify([]));
          loadOrders();
          updateStats();
          alert('✅ تم حذف جميع البيانات');
        }
      }
    });
  }
}

function setupExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
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
    tbody.innerHTML = '<tr><td colspan="11" class="text-center py-3">لا توجد طلبات حالياً</td></tr>';
    return;
  }
  
  tbody.innerHTML = filteredOrders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.phone}</td>
      <td>${o.animal}</td>
      <td>${o.age || '-'}</td>
      <td>${o.quantity}</td>
      <td>${o.pricePerUnit} ر.س</td>
      <td>${o.deliveryFee || 0} ر.س</td>
      <td><strong>${o.total || 0} ر.س</strong></td>
      <td>${o.service}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${o.id}')">
          🗑️ حذف
        </button>
      </td>
    </tr>
  `).join('');
}

// ==================== 💾 إضافة طلب جديد ====================

function handleAddOrder() {
  const name = document.getElementById('customerName')?.value?.trim();
  const phone = document.getElementById('customerPhone')?.value?.trim();
  const animal = document.getElementById('animalType')?.value || '';
  const age = document.getElementById('animalAge')?.value || '';
  const qty = parseInt(document.getElementById('quantity')?.value || 0);
  const pricePerUnit = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  const service = document.getElementById('serviceType')?.value || '';
  const region = document.getElementById('region')?.value || 'الرياض';
  const address = document.getElementById('address')?.value?.trim() || '';
  const distance = parseFloat(document.getElementById('distance')?.value || 0);
  
  // التحقق من البيانات المطلوبة
  if (!name || !phone || !animal || !qty || !pricePerUnit || !service) {
    alert('❌ الرجاء ملء جميع الحقول المطلوبة');
    return;
  }

  // حساب رسوم التوصيل
  const serviceObj = SERVICES[service];
  let deliveryFee = 0;

  if (serviceObj.type === 'delivery_paid') {
    deliveryFee = calculateDeliveryFee(distance, 'paid');
  } else if (serviceObj.type === 'delivery_free') {
    deliveryFee = 0;
  }

  const subtotal = qty * pricePerUnit;
  const total = subtotal + deliveryFee;

  console.log("✅ Order details:", {
    qty, pricePerUnit, subtotal, deliveryFee, total
  });

  const order = {
    id: 'ORD-' + Date.now(),
    customer: name,
    phone: phone,
    animal: animal,
    age: age,
    quantity: qty,
    pricePerUnit: pricePerUnit,
    subtotal: subtotal,
    deliveryFee: deliveryFee,
    total: total,
    service: service,
    region: region,
    address: address,
    distance: distance,
    status: 'جديد',
    date: new Date().toLocaleDateString('ar-SA'),
    timestamp: new Date().toLocaleString('ar-SA')
  };

  try {
    allOrders.push(order);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    console.log("✅ Order saved locally:", allOrders.length);
  } catch (e) {
    alert('❌ خطأ في الحفظ المحلي');
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

  // 🔑 SYNC WITH GOOGLE SHEETS & TELEGRAM
  console.log("🔄 Syncing with Google Sheets...");
  syncWithGoogleSheets(order);
}

// ==================== 📤 SYNC TO GOOGLE SHEETS & TELEGRAM ====================

function syncWithGoogleSheets(order) {
  const payload = JSON.stringify(order);
  
  console.log("🌐 API URL:", APPS_SCRIPT_URL);
  console.log("📦 Sending order:", order.id);
  
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: payload,
    mode: 'no-cors'
  })
  .then(r => {
    console.log("✅ Response received:", r.status);
    return r.text();
  })
  .then(text => {
    console.log("✅ Sync completed");
  })
  .catch(e => {
    console.error("❌ Sync error:", e.message);
  });
}

// ==================== 🗑️ حذف طلب ====================

function deleteOrder(id) {
  if (confirm('حذف هذا الطلب؟')) {
    allOrders = allOrders.filter(o => o.id !== id);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    loadOrders();
    updateStats();
    alert('✅ تم الحذف');
  }
}

// ==================== 📊 إحصائيات ====================

function updateStats() {
  const total = allOrders.length;
  const revenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
  
  const el1 = document.getElementById('totalOrders');
  const el2 = document.getElementById('totalRevenue');
  
  if (el1) el1.textContent = total;
  if (el2) el2.textContent = formatCurrency(revenue);
}

// ==================== 📥 تصدير ====================

function exportToCSV() {
  if (allOrders.length === 0) {
    alert('❌ لا توجد طلبات للتصدير');
    return;
  }

  const headers = ['رقم الطلب', 'العميل', 'الهاتف', 'نوع الحيوان', 'العمر', 'الكمية', 'السعر للوحدة', 'رسوم التوصيل', 'الإجمالي', 'الخدمة', 'المنطقة', 'التاريخ'];
  
  let csv = headers.join(',') + '\n';
  
  allOrders.forEach(order => {
    csv += [
      order.id,
      order.customer,
      order.phone,
      order.animal,
      order.age || '-',
      order.quantity,
      order.pricePerUnit,
      order.deliveryFee || 0,
      order.total,
      order.service,
      order.region,
      order.date
    ].join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert('✅ تم تصدير البيانات بنجاح');
}

// ==================== 🔍 البحث والتصفية ====================

function searchOrders(query) {
  const q = query.toLowerCase();
  filteredOrders = allOrders.filter(o => 
    o.id.toLowerCase().includes(q) ||
    o.customer.toLowerCase().includes(q) ||
    o.phone.includes(q) ||
    o.animal.toLowerCase().includes(q)
  );
  renderOrders();
}

// ==================== ✅ تحديث الحالة ====================

function updateOrderStatus(id, status) {
  const order = allOrders.find(o => o.id === id);
  if (order) {
    order.status = status;
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    loadOrders();
    alert('✅ تم تحديث الحالة');
  }
}

console.log("✅ app.js loaded - Professional v2.0 - WITH SYNC");
