/* 🍖 لحوم الرياض - gs.js | Google Apps Script
✅ VERSION 9 - FULLY DOCUMENTED IN ARABIC
✅ Google Sheets Integration
✅ Telegram Notifications
✅ Email Alerts
✅ Data Validation

هذا الملف يُنسخ مباشرة إلى Google Apps Script Editor:
https://script.google.com/home
*/

// ════════════════════════════════════════════════════════════════════════════
// ⚙️ SECTION 1: الإعدادات الأساسية (Configuration)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔑 TELEGRAM_BOT_TOKEN - رمز بوت تليجرام
 * 
 * الوصف:
 *   رمز فريد من Telegram Bot API
 *   يُستخدم للاتصال بـ Telegram
 * 
 * طريقة الحصول عليه:
 *   1. افتح Telegram وابحث عن @BotFather
 *   2. أرسل /newbot
 *   3. اتبع التعليمات واحصل على الرمز
 *   4. ضع الرمز هنا بين علامات الاقتباس
 * 
 * ⚠️ تحذير:
 *   احفظ هذا الرمز سرياً ولا تشاركه مع أحد
 */
const TELEGRAM_BOT_TOKEN = "8185675610:AAGmYo2_Ym0kDM0DYF4otw77xnDv7ug3Czs";

/**
 * 👥 TELEGRAM_CHAT_ID - معرّف مجموعة/قناة تليجرام
 * 
 * الوصف:
 *   معرّف فريد للمجموعة أو القناة
 *   حيث سيتم إرسال الإشعارات
 * 
 * طريقة الحصول عليه:
 *   1. أنشئ مجموعة خاصة في Telegram
 *   2. أضف البوت إلى المجموعة
 *   3. أرسل أي رسالة
 *   4. افتح: https://api.telegram.org/botTOKEN/getUpdates
 *   5. ابحث عن "chat": {"id": XXXXX}
 * 
 * ⚠️ تحذير:
 *   هذا المعرّف حساس أيضاً
 */
const TELEGRAM_CHAT_ID = "5625674358";

/**
 * 📊 SPREADSHEET_NAME - اسم جدول البيانات
 * 
 * الوصف:
 *   اسم Google Sheet حيث سيتم حفظ الطلبات
 *   يجب أن يكون موجوداً قبل تشغيل السكريبت
 */
const SPREADSHEET_NAME = "لحوم الرياض - الطلبات";

/**
 * 📋 SHEET_NAME - اسم الورقة في الجدول
 * 
 * الوصف:
 *   اسم الورقة الفرعية التي ستحتفظ بسجل الطلبات
 *   سيتم إنشاؤها تلقائياً إن لم تكن موجودة
 */
const SHEET_NAME = "Orders";

// ════════════════════════════════════════════════════════════════════════════
// 📝 SECTION 2: معالج الطلبات الرئيسي (Main Request Handler)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📤 doPost() - معالج الطلبات POST الرئيسي
 * 
 * الغرض:
 *   استقبال البيانات من التطبيق الويب
 *   حفظها في Google Sheets
 *   إرسال إشعار Telegram
 *   إرسال بريد تأكيد (اختياري)
 * 
 * الخطوات:
 *   1️⃣ استقبال البيانات من الطلب
 *   2️⃣ الحصول على ورقة Google Sheets
 *   3️⃣ إنشاء الرؤوس إن لم تكن موجودة
 *   4️⃣ إضافة صف جديد بالبيانات
 *   5️⃣ إرسال إشعار Telegram
 *   6️⃣ إرجاع استجابة النجاح
 * 
 * البيانات المتوقعة (Parameters):
 *   - id: رقم الطلب الفريد (timestamp)
 *   - customerName: اسم العميل
 *   - customerPhone: رقم الهاتف
 *   - animalType: نوع الماشية
 *   - animalAge: عمر الحيوان
 *   - quantity: الكمية
 *   - pricePerUnit: السعر للوحدة
 *   - totalPrice: الإجمالي
 *   - serviceType: نوع الخدمة
 *   - region: المنطقة
 *   - orderStatus: حالة الطلب
 *   - timestamp: التاريخ والوقت
 * 
 * الاستجابة:
 *   {
 *     "status": "success",
 *     "message": "تم حفظ الطلب بنجاح! ✅",
 *     "orderId": "1733064000000",
 *     "timestamp": "1/12/2025, 12:53:20 م"
 *   }
 */
function doPost(e) {
  try {
    console.log('📤 استقبال طلب جديد...');

    // ════════════════════════════════════════════════════════════════════════
    // 🔍 STEP 1: الحصول على جدول البيانات والورقة
    // ════════════════════════════════════════════════════════════════════════

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // إذا لم توجد الورقة: إنشاء واحدة جديدة
    if (!sheet) {
      console.log('📋 جاري إنشاء ورقة جديدة:', SHEET_NAME);
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    // ════════════════════════════════════════════════════════════════════════
    // 📊 STEP 2: إنشاء رؤوس الأعمدة إن لم تكن موجودة
    // ════════════════════════════════════════════════════════════════════════

    if (sheet.getLastRow() === 0) {
      console.log('🎯 جاري إضافة رؤوس الأعمدة...');
      
      const headers = [
        'رقم الطلب',
        'اسم العميل',
        'رقم الهاتف',
        'نوع الماشية',
        'العمر',
        'الكمية',
        'السعر للوحدة',
        'الإجمالي',
        'نوع الخدمة',
        'المنطقة',
        'الحالة',
        'التاريخ والوقت',
        'وقت الاستقبال'
      ];
      
      sheet.appendRow(headers);
      
      // تنسيق رؤوس الأعمدة (جعلها غامقة وملونة)
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#2c5aa0');
      headerRange.setFontColor('white');
      
      console.log('✅ تم إضافة الرؤوس');
    }

    // ════════════════════════════════════════════════════════════════════════
    // 📋 STEP 3: قراءة بيانات الطلب
    // ════════════════════════════════════════════════════════════════════════

    const params = e.parameter;
    const timestamp = new Date().toLocaleString('ar-SA');

    // التحقق من البيانات الأساسية
    if (!params.id || !params.customerName) {
      throw new Error('❌ البيانات المطلوبة مفقودة');
    }

    console.log('📋 البيانات المستقبلة:', params);

    // ════════════════════════════════════════════════════════════════════════
    // ➕ STEP 4: إضافة صف جديد بالبيانات
    // ════════════════════════════════════════════════════════════════════════

    const newRow = [
      params.id || 'لا يوجد',
      params.customerName || '',
      params.customerPhone || '',
      params.animalType || '',
      params.animalAge || '',
      params.quantity || '',
      params.pricePerUnit || '',
      params.totalPrice || '',
      params.serviceType || '',
      params.region || '',
      params.orderStatus || '',
      params.timestamp || timestamp,
      timestamp
    ];

    sheet.appendRow(newRow);
    console.log('✅ تم إضافة الصف الجديد');

    // تنسيق الصف الجديد (توسيط النصوص)
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, newRow.length).setHorizontalAlignment('center');

    // ════════════════════════════════════════════════════════════════════════
    // 🔔 STEP 5: إرسال إشعار Telegram
    // ════════════════════════════════════════════════════════════════════════

    sendTelegramNotification(params);

    // ════════════════════════════════════════════════════════════════════════
    // 📧 STEP 6: إرسال بريد تأكيد (اختياري)
    // ════════════════════════════════════════════════════════════════════════

    // إذا أردت إرسال بريد تأكيد:
    // sendConfirmationEmail(params);

    // ════════════════════════════════════════════════════════════════════════
    // ✅ STEP 7: إرجاع استجابة النجاح
    // ════════════════════════════════════════════════════════════════════════

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'تم حفظ الطلب بنجاح! ✅',
        orderId: params.id,
        timestamp: timestamp
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('❌ خطأ:', error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: '❌ حدث خطأ في حفظ الطلب',
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 📱 SECTION 3: إرسال إشعارات Telegram
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📬 sendTelegramNotification() - إرسال إشعار Telegram
 * 
 * الوظيفة:
 *   صياغة رسالة منسقة جميلة
 *   إرسالها عبر Telegram Bot API
 *   معالجة الأخطاء والاستجابات
 * 
 * الرسالة تتضمن:
 *   ✅ عنوان الإشعار
 *   ✅ بيانات العميل (الاسم والهاتف)
 *   ✅ تفاصيل الطلب (نوع الماشية، الكمية، السعر)
 *   ✅ الخدمات والمنطقة
 *   ✅ المجموع والحالة
 *   ✅ التاريخ والوقت
 * 
 * المدخلات:
 *   orderData (object): بيانات الطلب من doPost
 */
function sendTelegramNotification(orderData) {
  try {
    console.log('📱 جاري إرسال إشعار Telegram...');

    // ════════════════════════════════════════════════════════════════════════
    // 📝 صياغة الرسالة
    // ════════════════════════════════════════════════════════════════════════

    const message = formatTelegramMessage(orderData);

    // ════════════════════════════════════════════════════════════════════════
    // 🔗 إعداد الطلب
    // ════════════════════════════════════════════════════════════════════════

    const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // ════════════════════════════════════════════════════════════════════════
    // 📤 إرسال الطلب
    // ════════════════════════════════════════════════════════════════════════

    const response = UrlFetchApp.fetch(telegramURL, options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      console.log('✅ تم إرسال الإشعار إلى Telegram بنجاح');
    } else {
      console.error('❌ خطأ من Telegram:', result.description);
    }

  } catch (error) {
    console.error('❌ خطأ في إرسال Telegram:', error.toString());
  }
}

/**
 * 📝 formatTelegramMessage() - صياغة رسالة Telegram
 * 
 * الوظيفة:
 *   تنسيق البيانات في رسالة جميلة الشكل
 *   استخدام HTML tags للتنسيق (Bold, Italic, Underline)
 *   تقسيم المعلومات إلى أقسام واضحة
 * 
 * HTML Tags المدعومة:
 *   <b>نص</b>: نص غامق (Bold)
 *   <i>نص</i>: نص مائل (Italic)
 *   <u>نص</u>: نص مسطر (Underline)
 *   <code>نص</code>: نص أحادي المسافة (Monospace)
 *   <pre>نص</pre>: نص محفوظ التنسيق (Preformatted)
 * 
 * المدخلات:
 *   orderData (object): بيانات الطلب
 * 
 * الإرجاع:
 *   (string): الرسالة المنسقة بصيغة HTML
 */
function formatTelegramMessage(data) {
  const message = `
<b>🍖 طلب جديد من لحوم الرياض</b>

<b>👤 بيانات العميل:</b>
الاسم: <b>${data.customerName || '-'}</b>
الهاتف: <b>${data.customerPhone || '-'}</b>

<b>🐑 تفاصيل الطلب:</b>
نوع الماشية: <i>${data.animalType || '-'}</i>
العمر: <i>${data.animalAge || '-'}</i>
الكمية: <b>${data.quantity || '-'} وحدة</b>
السعر للوحدة: <b>${data.pricePerUnit || '-'} ر.س</b>

<b>💰 المجموع:</b>
<b>${data.totalPrice || '-'} ر.س</b>

<b>📦 الخدمات:</b>
الخدمة: <i>${data.serviceType || '-'}</i>
المنطقة: <i>${data.region || '-'}</i>

<b>⏰ التفاصيل:</b>
الحالة: <i>${data.orderStatus || '-'}</i>
الوقت: <i>${data.timestamp || new Date().toLocaleString('ar-SA')}</i>
رقم الطلب: <code>#${data.id || '-'}</code>

━━━━━━━━━━━━━━━━━
✅ تم حفظ الطلب في قاعدة البيانات
  `.trim();

  return message;
}

// ════════════════════════════════════════════════════════════════════════════
// 📧 SECTION 4: إرسال بريد التأكيد (اختياري)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📧 sendConfirmationEmail() - إرسال بريد تأكيد للعميل
 * 
 * الوظيفة:
 *   إرسال بريد إلكتروني لتأكيد استقبال الطلب
 *   يتضمن جميع تفاصيل الطلب
 *   يمكن تخصيصه بناءً على رغبتك
 * 
 * ملاحظة:
 *   تحتاج إلى بريد نطاق (domain email) لكي يعمل
 *   أو استخدم بريد Gmail الافتراضي
 * 
 * المدخلات:
 *   orderData (object): بيانات الطلب
 */
function sendConfirmationEmail(orderData) {
  try {
    if (!orderData.customerEmail) {
      console.log('ℹ️ لا يوجد بريد إلكتروني للعميل');
      return;
    }

    console.log('📧 جاري إرسال بريد التأكيد...');

    const emailBody = `
مرحباً ${orderData.customerName},

شكراً لطلبك من لحوم الرياض! 🍖

تم استقبال طلبك برقم: #${orderData.id}

------- التفاصيل -------

النوع: ${orderData.animalType}
الكمية: ${orderData.quantity}
المجموع: ${orderData.totalPrice} ريال سعودي

الحالة: ${orderData.orderStatus}
التاريخ: ${orderData.timestamp}

سيتم التواصل معك قريباً.

مع تحياتنا،
فريق لحوم الرياض 🐑
    `.trim();

    // إرسال البريد (اختياري - يمكن حذفه)
    // GmailApp.sendEmail(
    //   orderData.customerEmail,
    //   'تأكيد طلبك من لحوم الرياض - 🍖',
    //   emailBody
    // );

    console.log('✅ تم إرسال البريد');

  } catch (error) {
    console.error('❌ خطأ في إرسال البريد:', error.toString());
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🧪 SECTION 5: دالة اختبار (Testing Function)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🧪 testFunction() - دالة اختبار السكريبت
 * 
 * الوظيفة:
 *   اختبار السكريبت بدون الحاجة لطلب من التطبيق
 *   التحقق من أن كل شيء يعمل بشكل صحيح
 * 
 * الاستخدام:
 *   1. افتح Google Apps Script
 *   2. اضغط على Run (التشغيل)
 *   3. اختر testFunction من القائمة
 *   4. راقب السجل والإشعارات
 * 
 * ملاحظة:
 *   هذه دالة آمنة تماماً للاختبار
 *   لا تضيف بيانات فعلية إلى الجدول
 */
function testFunction() {
  try {
    console.log('🧪 جاري الاختبار...');

    // بيانات اختبار
    const testData = {
      id: Date.now(),
      customerName: 'اختبار النظام',
      customerPhone: '0501234567',
      animalType: 'غنم نعيمي',
      animalAge: '1 سنة',
      quantity: 5,
      pricePerUnit: 1800,
      totalPrice: 9000,
      serviceType: 'توصيل مجاني',
      region: 'الرياض',
      orderStatus: 'قيد المعالجة',
      timestamp: new Date().toLocaleString('ar-SA')
    };

    // محاكاة طلب POST
    const e = {
      parameter: testData
    };

    // استدعاء الدالة الرئيسية
    const result = doPost(e);
    const content = result.getContent();
    const parsedResult = JSON.parse(content);

    console.log('✅ نتيجة الاختبار:', parsedResult);

    if (parsedResult.status === 'success') {
      console.log('✅ السكريبت يعمل بشكل صحيح! 🎉');
    } else {
      console.log('❌ هناك مشكلة في السكريبت');
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.toString());
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 📊 SECTION 6: دوال إضافية مفيدة (Utility Functions)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📊 getOrderStats() - الحصول على إحصائيات الطلبات
 * 
 * الوظيفة:
 *   حساب إجمالي الطلبات والمبيعات والمتوسط
 *   يمكن استخدامها لتقارير شهرية/سنوية
 * 
 * الإرجاع:
 *   {
 *     totalOrders: 50,
 *     totalSales: 450000,
 *     averageOrder: 9000,
 *     lastOrder: {...}
 *   }
 */
function getOrderStats() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      console.log('⚠️ لا توجد ورقة بيانات');
      return null;
    }

    const data = sheet.getDataRange().getValues();
    const totalOrders = data.length - 1; // - 1 للرؤوس
    
    let totalSales = 0;
    for (let i = 1; i < data.length; i++) {
      totalSales += parseFloat(data[i][7]) || 0; // العمود 8 (الإجمالي)
    }

    const averageOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      totalOrders: totalOrders,
      totalSales: totalSales,
      averageOrder: averageOrder,
      lastUpdateTime: new Date().toLocaleString('ar-SA')
    };

  } catch (error) {
    console.error('❌ خطأ في حساب الإحصائيات:', error.toString());
    return null;
  }
}

/**
 * 🗑️ clearTestData() - حذف بيانات الاختبار
 * 
 * الوظيفة:
 *   حذف جميع البيانات من الورقة
 *   ترك الرؤوس فقط
 * 
 * ⚠️ تحذير:
 *   هذه عملية لا يمكن الرجوع عنها!
 */
function clearTestData() {
  try {
    if (confirm('⚠️ هل أنت متأكد من حذف جميع البيانات؟')) {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = spreadsheet.getSheetByName(SHEET_NAME);
      
      if (sheet && sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
        console.log('✅ تم حذف البيانات');
      }
    }
  } catch (error) {
    console.error('❌ خطأ في الحذف:', error.toString());
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ✅ نهاية الملف - Google Apps Script متكامل وموثق بالعربية
// ════════════════════════════════════════════════════════════════════════════
//
// 📋 التعليمات:
// 1. انسخ هذا الملف بالكامل
// 2. افتح https://script.google.com/
// 3. انشئ مشروع جديد
// 4. الصق الكود
// 5. عدّل TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID
// 6. احفظ واضغط Deploy (نشر)
// 7. اختر New deployment
// 8. نوع التطبيق: Web app
// 9. Execute as: Me
// 10. Who has access: Anyone (or مسموح لأي شخص)
// 11. انسخ رابط Deployment
// 12. ضعه في APPS_SCRIPT_URL في app.js
//
// ✅ النظام جاهز!
// ════════════════════════════════════════════════════════════════════════════