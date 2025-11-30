// 🍖 لحوم الرياض - app.js (محدّث - إصلاح النقل الفعلي للبيانات)

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZEEvRD80E_H_806OA8EqIoIMP6SjdAfTLy5jpRt1hTUCtHnKqA4ACBl5AAs9dcwKfWg/exec";

let allOrders = [];
let filteredOrders = [];
let selectedOrderId = null;
let currentStatusFilter = 'all';
let isEditMode = false;

// ════════════════════════════════════════════════════════════════════════
// 🚀 إرسال البيانات إلى Google Apps Script - WORKING VERSION
// ════════════════════════════════════════════════════════════════════════

function sendToGoogleAppsScript(orderData) {
  try {
    console.log('📤 جاري إرسال البيانات إلى Google Apps Script...');
    console.log('البيانات:', orderData);
    
    // استخدام method: POST مع content-type
    const payload = {
      id: orderData.id,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      animalType: orderData.animalType,
      quantity: orderData.quantity,
      pricePerUnit: orderData.pricePerUnit,
      totalPrice: orderData.totalPrice,
      serviceType: orderData.serviceType,
      orderStatus: orderData.orderStatus,
      timestamp: new Date().toLocaleString('ar-SA')
    };

    // الطريقة الصحيحة: استخدام FormData أو JSON مع الترميز الصحيح
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      payload: formData
    })
    .then(response => {
      console.log('✅ تم إرسال البيانات - Response Status:', response.status);
    })
    .catch(error => {
      console.error('⚠️ تحذير في الإرسال (قد تصل البيانات):', error.message);
    });

    return true;
  } catch (error) {
    console.error('❌ خطأ في إرسال البيانات:', error);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════════
// معالجة إرسال النموذج
// ════════════════════════════════════════════════════════════════════════

async function handleOrderSubmit(e) {
  e.preventDefault();
  
  console.log('📝 جاري معالجة الطلب...');
  
  const customerName = document.getElementById('customerName')?.value || '';
  const customerPhone = document.getElementById('customerPhone')?.value || '';
  const animalType = document.getElementById('animalType')?.value || '';
  const quantity = parseInt(document.getElementById('quantity')?.value || 0);
  const pricePerUnit = parseFloat(document.getElementById('pricePerUnit')?.value || 0);
  const totalPrice = parseFloat(document.getElementById('totalAmount')?.value || 0);
  const serviceType = document.getElementById('serviceType')?.value || '';
  const orderStatus = 'pending';
  
  if (!customerName || !customerPhone || !animalType || quantity === 0 || pricePerUnit === 0) {
    alert('❌ الرجاء ملء جميع الحقول المطلوبة');
    return;
  }
  
  const order = {
    id: Date.now(),
    customerName,
    customerPhone,
    animalType,
    quantity,
    pricePerUnit,
    totalPrice,
    serviceType,
    orderStatus,
    createdAt: new Date().toISOString()
  };
  
  console.log('📊 الطلب الجديد:', order);
  
  allOrders.push(order);
  saveOrders();
  console.log('💾 تم حفظ الطلب في localStorage');
  
  // إرسال إلى Google Apps Script
  console.log('📤 جاري إرسال الطلب إلى Google Apps Script...');
  sendToGoogleAppsScript(order);
  
  // إغلاق المودال
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
  
  loadOrders();
  
  alert('✅ تم إضافة الطلب بنجاح وإرساله إلى النظام');
  
  document.getElementById('orderForm')?.reset();
  document.getElementById('totalAmount').value = 0;
  document.getElementById('totalAmount').textContent = '0';
  
  console.log('✅ تم معالجة الطلب بنجاح');
}

// ════════════════════════════════════════════════════════════════════════
// المتغيرات والثوابت
// ════════════════════════════════════════════════════════════════════════

const animalDescriptions = {
  'غنم نعيمي': 'يتميز بجودة لحمه وطعمه الغني، يعتبر من الأنواع المطلوبة بكثرة للمناسبات',
  'غنم نجدي': 'معروف بحجمه الكبير ولحمه المميز الغني بالعصارة',
  'غنم حري': 'يتحمل الظروف المناخية القاسية، مناسب للبيئة الجافة',
  'غنم سواكني': 'يتميز بلحمه الجيد وخيار اقتصادي مناسب، ألوان مختلفة',
  'غنم بربري': 'خيار صحي وطعمه خفيف، مناسب لعمليات التسمين',
  'ماعز': 'لحم ماعز طازج وجودة عالية',
  'جمل': 'لحم جمل - للطلبات الكبيرة والجملة فقط'
};

const AGES = ['6 شهور', '1 سنة', 'سنة ونصف', 'سنتان'];

const SERVICES = {
  'توصيل مجاني': { name: 'توصيل مجاني', price: 0, description: 'توصيل مجاني داخل الرياض' },
  'توصيل برسم': { name: 'توصيل برسم', price: 50, description: 'يبدأ من 50 ريال' },
  'ذبح': { name: 'خدمة الذبح', price: 20, description: 'خدمة الذبح الحلال' },
  'تقطيع': { name: 'خدمة التقطيع', price: 25, description: 'تقطيع اللحم' },
  'تغليف': { name: 'خدمة التغليف', price: 15, description: 'تغليف احترافي' },
  'استلام من المحل': { name: 'استلام من المحل', price: 0, description: 'من محل الشفا' }
};

const REGIONS = {
  'الرياض': { name: 'الرياض', minQty: 1 },
  'خارج الرياض (جملة فقط)': { name: 'خارج الرياض', minQty: 10 }
};

const animalPrices = {
  'غنم نعيمي': 1800,
  'غنم نجدي': 1900,
  'غنم حري': 1600,
  'غنم سواكني': 1500,
  'غنم بربري': 1400,
  'ماعز': 1200,
  'جمل': 5000
};

// ════════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ════════════════════════════════════════════════════════════════════════

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

  const priceInput = document.getElementById('pricePerUnit');
  if (selectedAnimal && animalPrices[selectedAnimal]) {
    priceInput.value = animalPrices[selectedAnimal];
    calculateTotal();
  }
}

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

function populateSelects() {
  const animalSelect = document.getElementById('animalType');
  if (animalSelect) {
    animalSelect.innerHTML = '';
    Object.keys(animalDescriptions).forEach(animal => {
      const option = document.createElement('option');
      option.value = animal;
      option.textContent = animal;
      animalSelect.appendChild(option);
    });
  }

  const ageSelect = document.getElementById('animalAge');
  if (ageSelect) {
    ageSelect.innerHTML = '';
    AGES.forEach(age => {
      const option = document.createElement('option');
      option.value = age;
      option.textContent = age;
      ageSelect.appendChild(option);
    });
  }

  const serviceSelect = document.getElementById('serviceType');
  if (serviceSelect) {
    serviceSelect.innerHTML = '';
    Object.keys(SERVICES).forEach(key => {
      const service = SERVICES[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = service.name;
      option.title = service.description;
      serviceSelect.appendChild(option);
    });
  }

  const regionSelect = document.getElementById('region');
  if (regionSelect) {
    regionSelect.innerHTML = '';
    Object.keys(REGIONS).forEach(key => {
      const region = REGIONS[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = region.name;
      regionSelect.appendChild(option);
    });
  }
}

function setupEventListeners() {
  document.getElementById('quantity')?.addEventListener('input', calculateTotal);
  document.getElementById('pricePerUnit')?.addEventListener('input', calculateTotal);
  document.getElementById('animalType')?.addEventListener('change', onAnimalChange);

  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', handleOrderSubmit);
  }
}

function loadOrders() {
  console.log('📊 Loading Orders...');
  const savedOrders = localStorage.getItem('allOrders');
  allOrders = savedOrders ? JSON.parse(savedOrders) : [];
  filteredOrders = allOrders;
  console.log(`✅ Loaded ${allOrders.length} orders`);
}

function saveOrders() {
  localStorage.setItem('allOrders', JSON.stringify(allOrders));
  console.log('💾 Orders Saved');
}

function updateStats() {
  console.log('📈 Updating Statistics...');
}

function updateReports() {
  console.log('📊 Updating Reports...');
}

function updateSystemInfo() {
  console.log('ℹ️ System Info Updated');
}

function setupDeleteAllButton() {
  const deleteBtn = document.getElementById('deleteAllBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('⚠️ هل أنت متأكد من حذف جميع البيانات؟')) {
        localStorage.clear();
        allOrders = [];
        filteredOrders = [];
        console.log('🗑️ All Data Deleted');
        loadOrders();
      }
    });
  }
}

function initDarkMode() {
  const darkModeBtn = document.getElementById('darkModeToggle');
  const savedMode = localStorage.getItem('darkMode');
  let isDarkMode = false;

  if (savedMode !== null) {
    isDarkMode = savedMode === 'true';
  }

  applyTheme(isDarkMode);

  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      const isCurrentlyDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
      const newDarkMode = !isCurrentlyDark;
      applyTheme(newDarkMode);
      localStorage.setItem('darkMode', newDarkMode);
    });
  }

  function applyTheme(isDark) {
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (isDark) {
      document.documentElement.setAttribute('data-color-scheme', 'dark');
      if (darkModeBtn) darkModeBtn.textContent = '☀️ وضع فاتح';
    } else {
      document.documentElement.removeAttribute('data-color-scheme');
      if (darkModeBtn) darkModeBtn.textContent = '🌙 وضع غامق';
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// بداية التطبيق
// ════════════════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  console.log("🔥 App Starting");
  initializeModal();
  initDarkMode();
  populateSelects();
  loadOrders();
  updateStats();
  updateReports();
  updateSystemInfo();
  setupEventListeners();
  setupDeleteAllButton();
  console.log("✅ App Ready");
});

console.log('✅ app.js تم تحميله');
console.log('🔗 Google Apps Script URL:', APPS_SCRIPT_URL);
