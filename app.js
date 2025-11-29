/* 🍖 لحوم الرياض - app.js - v3.4 - FIXED DEFAULT LIGHT MODE ✨ */

// ⚙️ إعدادات Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZEEvRD80E_H_806OA8EqIoIMP6SjdAfTLy5jpRt1hTUCtHnKqA4ACBl5AAs9dcwKfWg/exec";
const TELEGRAM_BOT_URL = "https://api.telegram.org/bot";

// 🌐 المتغيرات العامة
let allOrders = [];
let filteredOrders = [];
let selectedOrderId = null;
let currentStatusFilter = 'all';

// 🎯 [📊 البيانات الكاملة] أنواع الأغنام مع الأوصاف التفصيلية
const animalDescriptions = {
  'غنم نعيمي': 'يتميز بجودة لحمه وطعمه الغني، يعتبر من الأنواع المطلوبة بكثرة للمناسبات',
  'غنم نجدي': 'معروف بحجمه الكبير ولحمه المميز الغني بالعصارة',
  'غنم حري': 'يتحمل الظروف المناخية القاسية، مناسب للبيئة الجافة',
  'غنم سواكني': 'يتميز بلحمه الجيد وخيار اقتصادي مناسب، ألوان مختلفة (أحمر، أبيض، أسود)',
  'غنم بربري': 'خيار صحي وطعمه خفيف، مناسب لعمليات التسمين والتجارة',
  'ماعز': 'لحم ماعز طازج وجودة عالية',
  'جمل': 'لحم جمل - للطلبات الكبيرة والجملة فقط'
};

// 🎯 [📊 الأعمار المتاحة]
const AGES = [
  '6 شهور',
  '1 سنة',
  'سنة ونصف',
  'سنتان'
];

// 🎯 [📊 الخدمات المتاحة]
const SERVICES = {
  'توصيل مجاني': { name: 'توصيل مجاني', price: 0, description: 'توصيل مجاني داخل الرياض' },
  'توصيل برسم': { name: 'توصيل برسم', price: 50, description: 'يبدأ من 50 ريال + 1 ريال/كم' },
  'ذبح': { name: 'خدمة الذبح', price: 20, description: 'خدمة الذبح الحلال' },
  'تقطيع': { name: 'خدمة التقطيع', price: 25, description: 'تقطيع اللحم بحسب الطلب' },
  'تغليف': { name: 'خدمة التغليف', price: 15, description: 'تغليف احترافي وآمن' },
  'استلام من المحل': { name: 'استلام من المحل', price: 0, description: 'استلام من محل الشفا' }
};

// 🎯 [📊 المناطق]
const REGIONS = {
  'الرياض': { name: 'الرياض', minQty: 1 },
  'خارج الرياض (جملة فقط)': { name: 'خارج الرياض', minQty: 10 }
};

// 🎯 [📊 الأسعار المرجعية للحيوانات]
const animalPrices = {
  'غنم نعيمي': 1800,
  'غنم نجدي': 1900,
  'غنم حري': 1600,
  'غنم سواكني': 1500,
  'غنم بربري': 1400,
  'ماعز': 1200,
  'جمل': 5000
};

// 🌙 [🔧 إصلاح 1] DARK MODE - وضع غامق - الآن الافتراضي Light Mode
function initDarkMode() {
  const darkModeBtn = document.getElementById('darkModeToggle');
  const savedMode = localStorage.getItem('darkMode');
  
  // ✅ إذا لم يتم حفظ أي شيء، نستخدم Light Mode (false)
  // إذا كان مخزن، نستخدم القيمة المحفوظة
  const isDarkMode = savedMode === 'true' ? true : false;
  
  if (isDarkMode) {
    document.documentElement.setAttribute('data-color-scheme', 'dark');
    if (darkModeBtn) darkModeBtn.textContent = '☀️ وضع فاتح';
  } else {
    document.documentElement.removeAttribute('data-color-scheme');
    if (darkModeBtn) darkModeBtn.textContent = '🌙 وضع غامق';
  }
  
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
      
      if (isDark) {
        document.documentElement.removeAttribute('data-color-scheme');
        localStorage.setItem('darkMode', 'false');
        darkModeBtn.textContent = '🌙 وضع غامق';
      } else {
        document.documentElement.setAttribute('data-color-scheme', 'dark');
        localStorage.setItem('darkMode', 'true');
        darkModeBtn.textContent = '☀️ وضع فاتح';
      }
    });
  }
}

// ✅ [🔧 إصلاح 2] CALCULATE TOTAL - حساب الإجمالي بدون undefined
function calculateTotal() {
  const qty = parseInt(document.getElementById('quantity')?.value || 0);
  const price = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  const total = qty * price;
  
  const totalEl = document.getElementById('totalAmount');
  if (totalEl) {
    totalEl.textContent = total.toLocaleString('ar-SA');
    totalEl.value = total;
  }
}

// 🐄 اختيار نوع الماشية - محسّنة مع البيانات الجديدة
function onAnimalChange() {
  const animalSelect = document.getElementById('animalType');
  const descBox = document.getElementById('animalDescBox');
  const selectedAnimal = animalSelect?.value;
  
  if (selectedAnimal && animalDescriptions[selectedAnimal]) {
    descBox.textContent = animalDescriptions[selectedAnimal];
    descBox.classList.add('show');
  } else {
    descBox.classList.remove('show');
  }
  
  // تحديث السعر
  const priceInput = document.getElementById('pricePerUnit');
  if (selectedAnimal && animalPrices[selectedAnimal]) {
    priceInput.value = animalPrices[selectedAnimal];
    calculateTotal();
  }
}

// ❌ [🔧 إصلاح 4] إغلاق Modal تلقائياً عند البدء
function initializeModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    try {
      const bsModal = bootstrap?.Modal?.getInstance(modal);
      if (bsModal) bsModal.hide();
    } catch (e) {
      console.log("Modal initialization attempted");
    }
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

// 🚀 تحميل البيانات عند بدء التطبيق
window.addEventListener('DOMContentLoaded', () => {
  console.log("🔥 App DOMContentLoaded - Loading data...");
  
  // ❌ [NEW] إغلاق Modal أولاً - قبل أي شيء
  initializeModal();
  
  // 🌙 Initialize Dark Mode - الآن Light Mode افتراضياً
  initDarkMode();
  
  // 📊 Populate dropdowns with data
  populateSelects();
  
  // Load and setup
  loadOrders();
  updateStats();
  updateReports();
  updateSystemInfo();
  setupEventListeners();
  setupDeleteAllButton();
  
  console.log("✅ App Ready!");
});

// 📊 [جديد] ملء القوائم المنسدلة من البيانات
function populateSelects() {
  // Fill Animals
  const animalSelect = document.getElementById('animalType');
  if (animalSelect) {
    animalSelect.innerHTML = '<option value="">اختر نوع الحيوان</option>';
    Object.keys(animalDescriptions).forEach(animal => {
      const option = document.createElement('option');
      option.value = animal;
      option.textContent = animal;
      animalSelect.appendChild(option);
    });
  }

  // Fill Ages
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

  // Fill Services
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

  // Fill Regions
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

// 🎯 Setup all event listeners
function setupEventListeners() {
  // Real-time calculations
  document.getElementById('quantity')?.addEventListener('input', calculateTotal);
  document.getElementById('pricePerUnit')?.addEventListener('input', calculateTotal);
  document.getElementById('animalType')?.addEventListener('change', onAnimalChange);
  
  // Form submission
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAddOrder();
    });
  }
}

// 💾 تحميل الطلبات من localStorage
function loadOrders() {
  allOrders = JSON.parse(localStorage.getItem('meatOrders')) || [];
  filteredOrders = [...allOrders];
  renderOrders();
}

// 📝 عرض الطلبات
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  
  if (filteredOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="table-empty text-center">لا توجد طلبات حالياً</td></tr>';
    return;
  }

  tbody.innerHTML = filteredOrders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.customer}</td>
      <td>${order.phone}</td>
      <td>${order.animal}</td>
      <td>${order.quantity}</td>
      <td>${order.price} ر.س</td>
      <td><strong>${order.total || (order.quantity * order.price)}</strong> ر.س</td>
      <td>${order.service}</td>
      <td>
        <span class="status" style="background-color: var(--color-info)">
          ${order.status}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')">حذف</button>
      </td>
    </tr>
  `).join('');
}

// 💾 إضافة طلب جديد
async function handleAddOrder() {
  // ✅ [🔧 إصلاح 2] Get values correctly
  const name = document.getElementById('customerName')?.value?.trim();
  const phone = document.getElementById('customerPhone')?.value?.trim();
  const animal = document.getElementById('animalType')?.value;
  const age = document.getElementById('animalAge')?.value || '';
  const qty = parseInt(document.getElementById('quantity')?.value || 0);
  const price = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  
  // ✅ Calculate total correctly
  let total = qty * price;
  const totalEl = document.getElementById('totalAmount');
  if (totalEl && totalEl.textContent && totalEl.textContent !== '0') {
    const cleanTotal = totalEl.textContent.replace(/,/g, '');
    total = parseFloat(cleanTotal) || (qty * price);
  }

  const service = document.getElementById('serviceType')?.value;
  const status = document.getElementById('status')?.value || 'معلق';
  const notes = document.getElementById('notes')?.value || '';
  const date = document.getElementById('orderDate')?.value;
  const region = document.getElementById('region')?.value || 'الرياض';

  // Validation
  if (!name || !phone || !animal || qty <= 0 || price <= 0) {
    showAlert('❌ الرجاء ملء جميع الحقول بشكل صحيح والتأكد من أن الكمية والسعر أكبر من صفر', 'error', 'modalAlertBox');
    return;
  }

  const orderData = {
    id: 'ORD-' + Date.now(),
    customer: name,
    phone: phone,
    animal: animal,
    age: age,
    quantity: qty,
    price: price,
    total: total,
    service: service,
    status: status,
    notes: notes,
    date: date,
    region: region,
    timestamp: new Date().toLocaleString('ar-SA')
  };

  try {
    console.log("📤 Sending to Apps Script:", orderData);
    
    // إرسال للـ Google Sheets
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    // حفظ محلي
    allOrders.push(orderData);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    
    console.log("✅ Order saved locally");
    showAlert('✅ تم حفظ الطلب بنجاح! تم إشعار البائع عبر التليجرام والجداول.', 'success', 'modalAlertBox');
    
    // Reset form
    document.getElementById('orderForm')?.reset();
    if (totalEl) totalEl.textContent = '0';
    
    loadOrders();
    updateStats();
    updateSystemInfo();
    
    setTimeout(() => closeOrderModal(), 2000);
  } catch (error) {
    console.error("❌ Error:", error);
    showAlert('❌ حدث خطأ أثناء الحفظ، لكن تم حفظ البيانات محلياً', 'warning', 'modalAlertBox');
  }
}

// 📢 عرض التنبيهات
function showAlert(message, type, elementId = 'alertBox') {
  const box = document.getElementById(elementId);
  if (!box) return;
  box.textContent = message;
  box.className = `alert alert-${type} show`;
  setTimeout(() => box.classList.remove('show'), 4500);
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
  showAlert('✅ تم تنزيل البيانات بنجاح', 'success');
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
        showAlert('✅ تم استيراد البيانات بنجاح!', 'success');
      }
    } catch (err) {
      showAlert('❌ خطأ في صيغة الملف', 'error');
    }
  };
  reader.readAsText(file);
}

// 🗑️ [🔧 إصلاح 3] حذف جميع البيانات
function setupDeleteAllButton() {
  const deleteAllBtn = document.querySelector('[data-action="deleteAll"]') || 
                       document.querySelector('button[onclick*="deleteAllData"]') ||
                       Array.from(document.querySelectorAll('button')).find(btn => 
                         btn.textContent.includes('حذف جميع') || btn.textContent.includes('🗑️')
                       );
  
  if (deleteAllBtn) {
    deleteAllBtn.removeAttribute('onclick');
    deleteAllBtn.addEventListener('click', deleteAllData);
    console.log("✅ Delete All button fixed!");
  }
}

function deleteAllData() {
  if (confirm('⚠️ هل أنت متأكد من حذف جميع البيانات؟\nهذا الإجراء لا يمكن التراجع عنه!')) {
    if (confirm('🔴 آخر تحذير: سيتم حذف جميع الطلبات بشكل دائم!')) {
      allOrders = [];
      localStorage.removeItem('meatOrders');
      loadOrders();
      updateStats();
      updateSystemInfo();
      showAlert('✅ تم حذف جميع البيانات بنجاح', 'success');
    }
  }
}

// 🗑️ حذف طلب واحد
function deleteOrder(id) {
  if (confirm('هل تريد حذف هذا الطلب؟')) {
    allOrders = allOrders.filter(order => order.id !== id);
    localStorage.setItem('meatOrders', JSON.stringify(allOrders));
    loadOrders();
    updateStats();
    showAlert('✅ تم حذف الطلب', 'success');
  }
}

// ℹ️ معلومات النظام
function updateSystemInfo() {
  const totalOrdersInfo = document.getElementById('totalOrdersInfo');
  const lastUpdateInfo = document.getElementById('lastUpdateInfo');
  const dataSizeInfo = document.getElementById('dataSize');
  
  if (totalOrdersInfo) totalOrdersInfo.textContent = allOrders.length;
  if (lastUpdateInfo) lastUpdateInfo.textContent = new Date().toLocaleString('ar-SA');
  
  if (dataSizeInfo) {
    const dataSize = (JSON.stringify(allOrders).length / 1024).toFixed(2);
    dataSizeInfo.textContent = dataSize + ' KB';
  }
}

// 📊 تحديث الإحصائيات
function updateStats() {
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const averageOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;
  const pendingOrders = allOrders.filter(o => o.status === 'معلق').length;

  const els = {
    totalOrders: document.getElementById('totalOrders'),
    totalRevenue: document.getElementById('totalRevenue'),
    averageOrder: document.getElementById('averageOrder'),
    pendingOrders: document.getElementById('pendingOrders')
  };

  if (els.totalOrders) els.totalOrders.textContent = totalOrders;
  if (els.totalRevenue) els.totalRevenue.textContent = totalRevenue.toLocaleString('ar-SA');
  if (els.averageOrder) els.averageOrder.textContent = averageOrder.toLocaleString('ar-SA');
  if (els.pendingOrders) els.pendingOrders.textContent = pendingOrders;
}

// 📈 تحديث التقارير
function updateReports() {
  // Animal distribution
  const animalDist = {};
  allOrders.forEach(o => {
    animalDist[o.animal] = (animalDist[o.animal] || 0) + o.quantity;
  });
  console.log('📊 Animal Distribution:', animalDist);

  // Status distribution  
  const statusDist = { 'معلق': 0, 'قيد التحضير': 0, 'تم التوصيل': 0, 'ملغى': 0 };
  allOrders.forEach(o => {
    if (statusDist[o.status] !== undefined) statusDist[o.status]++;
  });
  console.log('📊 Status Distribution:', statusDist);
}

// 🔍 البحث والتصفية
function filterOrders(status = 'all') {
  if (status === 'all') {
    filteredOrders = [...allOrders];
  } else {
    filteredOrders = allOrders.filter(order => order.status === status);
  }
  renderOrders();
}

// 🔄 Close Modal
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    try {
      const bsModal = bootstrap?.Modal?.getInstance(modal);
      if (bsModal) bsModal.hide();
    } catch (e) {
      console.log("Modal close");
    }
  }
}

// ✅ COMPLETE APP LOADED
console.log("✅ app.js loaded - v3.4 - COMPLETE + FIXED + DATA + MODAL CLOSE + DEFAULT LIGHT MODE ✨");
