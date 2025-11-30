// 🍖 نظام إدارة الطلبات - app.js (معدل وكامل)
// جميع الأزرار والوظائف مربوطة بشكل صحيح

let allOrders = [];
let filteredOrders = [];

// تحميل البيانات عند فتح الصفحة
window.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  setupEventListeners();
  applyTheme(localStorage.getItem('darkMode') === 'true');
});

// ====== EVENT LISTENERS - ربط جميع الأزرار ====== 
function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');

  // 1️⃣ حساب الإجمالي عند تغيير الكمية أو السعر
  const quantityInput = document.getElementById('quantity');
  const priceInput = document.getElementById('pricePerUnit');
  
  if (quantityInput) quantityInput.addEventListener('input', calculateTotal);
  if (priceInput) priceInput.addEventListener('input', calculateTotal);

  // 2️⃣ إرسال نموذج الطلب
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', handleOrderSubmit);
  }

  // 3️⃣ زر "➕ طلب جديد" - فتح المودال
  const addOrderBtn = document.getElementById('addOrderBtn');
  if (addOrderBtn) {
    addOrderBtn.addEventListener('click', () => {
      console.log('✅ زر طلب جديد تم الضغط عليه');
      const modal = document.getElementById('orderModal');
      if (modal) {
        modal.classList.add('show');
        if (orderForm) orderForm.reset();
      }
    });
  }

  // 4️⃣ زر "📤 تصدير"
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      console.log('✅ زر تصدير تم الضغط عليه');
      if (allOrders.length === 0) {
        alert('❌ لا توجد بيانات لتصديرها');
        return;
      }
      const dataStr = JSON.stringify(allOrders, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      alert('✅ تم تصدير البيانات بنجاح');
    });
  }

  // 5️⃣ زر "📥 استيراد"
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFile');
  
  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      console.log('✅ زر استيراد تم الضغط عليه');
      importFileInput.click();
    });
    
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result);
            allOrders = Array.isArray(data) ? data : [];
            saveOrders();
            loadOrders();
            alert('✅ تم استيراد البيانات بنجاح');
            console.log('📥 تم استيراد', allOrders.length, 'طلب');
          } catch (error) {
            alert('❌ خطأ في قراءة الملف - تأكد من صيغة JSON');
            console.error('❌ خطأ:', error);
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // 6️⃣ مربع البحث
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      console.log('🔍 البحث عن:', query);
      
      if (query === '') {
        filteredOrders = allOrders;
      } else {
        filteredOrders = allOrders.filter(order =>
          (order.customerName && order.customerName.toLowerCase().includes(query)) ||
          (order.customerPhone && order.customerPhone.includes(query)) ||
          (order.animalType && order.animalType.toLowerCase().includes(query))
        );
      }
      renderTable();
    });
  }

  // 7️⃣ تبديل الوضع الداكن
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      console.log('🌙 تبديل الوضع الداكن');
      const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
      applyTheme(!isDark);
      localStorage.setItem('darkMode', !isDark);
    });
  }

  // 8️⃣ حذف جميع البيانات
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      console.log('🗑️ حذف جميع البيانات');
      if (confirm('⚠️ هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه')) {
        localStorage.clear();
        allOrders = [];
        filteredOrders = [];
        loadOrders();
        alert('✅ تم حذف جميع البيانات بنجاح');
      }
    });
  }

  console.log('✅ Event listeners تم تعيينها بنجاح');
}

// حساب الإجمالي
function calculateTotal() {
  const quantityField = document.getElementById('quantity');
  const priceField = document.getElementById('pricePerUnit');
  const totalField = document.getElementById('totalPrice');
  
  if (quantityField && priceField && totalField) {
    const quantity = parseFloat(quantityField.value) || 0;
    const price = parseFloat(priceField.value) || 0;
    const total = quantity * price;
    totalField.value = total.toFixed(2);
    console.log(`💰 حساب: ${quantity} × ${price} = ${total.toFixed(2)}`);
  }
}

// معالجة إرسال النموذج
function handleOrderSubmit(e) {
  e.preventDefault();
  
  const customerName = document.getElementById('customerName')?.value || '';
  const customerPhone = document.getElementById('customerPhone')?.value || '';
  const animalType = document.getElementById('animalType')?.value || '';
  const quantity = document.getElementById('quantity')?.value || '0';
  const pricePerUnit = document.getElementById('pricePerUnit')?.value || '0';
  const totalPrice = document.getElementById('totalPrice')?.value || '0';
  const serviceType = document.getElementById('serviceType')?.value || '';
  const orderStatus = document.getElementById('orderStatus')?.value || 'pending';
  
  const order = {
    id: Date.now(),
    customerName,
    customerPhone,
    animalType,
    quantity: parseInt(quantity),
    pricePerUnit: parseFloat(pricePerUnit),
    totalPrice: parseFloat(totalPrice),
    serviceType,
    orderStatus,
    createdAt: new Date().toISOString()
  };
  
  allOrders.push(order);
  saveOrders();
  loadOrders();
  
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.classList.remove('show');
  }
  
  alert('✅ تم إضافة الطلب بنجاح');
  console.log('📝 طلب جديد تم إضافته:', order);
}

// تحميل الطلبات من localStorage
function loadOrders() {
  try {
    const savedOrders = localStorage.getItem('allOrders');
    allOrders = savedOrders ? JSON.parse(savedOrders) : [];
    filteredOrders = allOrders;
    renderTable();
    updateStats();
    console.log('✅ تم تحميل', allOrders.length, 'طلب');
  } catch (error) {
    console.error('❌ خطأ في تحميل البيانات:', error);
    allOrders = [];
    filteredOrders = [];
  }
}

// حفظ الطلبات إلى localStorage
function saveOrders() {
  try {
    localStorage.setItem('allOrders', JSON.stringify(allOrders));
    console.log('💾 تم حفظ البيانات');
  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error);
  }
}

// عرض الجدول
function renderTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (filteredOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="no-data">لا توجد طلبات حالياً</td></tr>';
    return;
  }

  tbody.innerHTML = filteredOrders.map(order => {
    const statusText = {
      'pending': 'قيد المعالجة',
      'completed': 'مُنجزة',
      'cancelled': 'ملغاة'
    }[order.orderStatus] || order.orderStatus;

    return `
      <tr>
        <td>#${order.id}</td>
        <td>${order.customerName}</td>
        <td>${order.customerPhone}</td>
        <td>${order.animalType}</td>
        <td>${order.quantity}</td>
        <td>${order.pricePerUnit?.toFixed(2) || '0.00'} ر.س</td>
        <td>${order.totalPrice?.toFixed(2) || '0.00'} ر.س</td>
        <td>${order.serviceType}</td>
        <td><span class="status-badge status-${order.orderStatus}">${statusText}</span></td>
        <td>
          <button class="btn btn--secondary" onclick="deleteOrder(${order.id})">حذف</button>
        </td>
      </tr>
    `;
  }).join('');
  
  console.log('🔄 تم تحديث الجدول -', filteredOrders.length, 'طلب');
}

// حذف طلب
function deleteOrder(id) {
  if (confirm('⚠️ هل تريد حذف هذا الطلب؟')) {
    allOrders = allOrders.filter(order => order.id !== id);
    saveOrders();
    loadOrders();
    alert('✅ تم حذف الطلب بنجاح');
    console.log('🗑️ تم حذف الطلب:', id);
  }
}

// تحديث الإحصائيات
function updateStats() {
  const stats = document.querySelectorAll('.stat-card .value');
  if (stats.length >= 4) {
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.orderStatus === 'pending').length;
    const completedOrders = allOrders.filter(o => o.orderStatus === 'completed').length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    stats[0].textContent = totalOrders;
    stats[1].textContent = pendingOrders;
    stats[2].textContent = completedOrders;
    stats[3].textContent = totalRevenue.toFixed(2) + ' ر.س';
    
    console.log(`📊 الإحصائيات: إجمالي=${totalOrders}, قيد المعالجة=${pendingOrders}, مُنجزة=${completedOrders}, إيرادات=${totalRevenue.toFixed(2)}`);
  }
}

// تطبيق الوضع الداكن
function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.setAttribute('data-color-scheme', 'dark');
    console.log('🌙 تم تفعيل الوضع الداكن');
  } else {
    document.documentElement.removeAttribute('data-color-scheme');
    console.log('☀️ تم تفعيل الوضع الفاتح');
  }
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => {
    console.log('⚠️ Service Worker registration failed:', err);
  });
}

console.log('✅ app.js تم تحميله بنجاح');
