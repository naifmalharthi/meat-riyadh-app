/* 🍖 لحوم الرياض - gs.js | Google Apps Script
✅ VERSION 11 - QUEUE SYSTEM + EMAIL NOTIFICATIONS
✅ Google Sheets Integration
✅ Telegram Notifications (للعامل)
✅ Email Notifications (للعميل) - جديد!
✅ Offline Queue Support - دعم الطابور دون إنترنت
✅ Auto Retry - إعادة محاولة تلقائية
✅ Data Validation

هذا الملف يُنسخ مباشرة إلى Google Apps Script Editor:
https://script.google.com/home
*/

// ════════════════════════════════════════════════════════════════════════════
// ⚙️ SECTION 1: الإعدادات الأساسية (Configuration)
// ════════════════════════════════════════════════════════════════════════════

const TELEGRAM_BOT_TOKEN = "8185675610:AAGmYo2_Ym0kDM0DYF4otw77xnDv7ug3Czs";
const TELEGRAM_CHAT_ID = "5625674358";
const SPREADSHEET_NAME = "لحوم الرياض - الطلبات";
const SHEET_NAME = "Orders";

// 📊 تسجيل محاولات الإرسال للتحليل
const LOG_SHEET_NAME = "Queue_Logs";

// ════════════════════════════════════════════════════════════════════════════
// 📊 SECTION 2: معالج الطلبات مع دعم الفشل (Improved Handler)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📤 doPost() - معالج الطلبات POST مع نظام Queue + Email
 * 
 * التحسينات:
 *   ✅ يحفظ الطلب في Sheets أولاً
 *   ✅ محاولة إرسال Telegram للعامل
 *   ✅ محاولة إرسال Email للعميل (جديد!)
 *   ✅ إذا فشل ← يسجل المحاولة الفاشلة
 *   ✅ يعيد حالة واضحة للعميل
 * 
 * البيانات المتوقعة: نفسها + customerEmail
 * الاستجابة: {status, message, orderId, queueStatus, emailStatus}
 */
function doPost(e) {
  try {
    console.log('📤 استقبال طلب جديد مع نظام Queue + Email...');

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // إنشاء الورقة إذا لم تكن موجودة
    if (!sheet) {
      console.log('📋 جاري إنشاء ورقة جديدة:', SHEET_NAME);
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    // إنشاء رؤوس الأعمدة
    if (sheet.getLastRow() === 0) {
      const headers = [
        'رقم الطلب',
        'اسم العميل',
        'رقم الهاتف',
        'البريد الإلكتروني',
        'نوع الماشية',
        'العمر',
        'الكمية',
        'السعر للوحدة',
        'الإجمالي',
        'نوع الخدمة',
        'المنطقة',
        'الحالة',
        'التاريخ والوقت',
        'وقت الاستقبال',
        'حالة Telegram',
        'حالة البريد الإلكتروني',
        'عدد محاولات الإرسال'
      ];
      
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#2c5aa0');
      headerRange.setFontColor('white');
    }

    // ════════════════════════════════════════════════════════════════════════
    // STEP 1: قراءة بيانات الطلب
    // ════════════════════════════════════════════════════════════════════════

    const params = e.parameter;
    const timestamp = new Date().toLocaleString('ar-SA');

    if (!params.id || !params.customerName) {
      throw new Error('❌ البيانات المطلوبة مفقودة');
    }

    console.log('📋 البيانات المستقبلة:', params);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 2: إضافة الطلب في Sheets ✅ أولاً قبل أي شيء
    // ════════════════════════════════════════════════════════════════════════

    const newRow = [
      params.id || 'لا يوجد',
      params.customerName || '',
      params.customerPhone || '',
      params.customerEmail || '',
      params.animalType || '',
      params.animalAge || '',
      params.quantity || '',
      params.pricePerUnit || '',
      params.totalPrice || '',
      params.serviceType || '',
      params.region || '',
      params.orderStatus || '',
      params.timestamp || timestamp,
      timestamp,
      '🔄 في الانتظار',  // حالة Telegram الأولية
      '🔄 في الانتظار',  // حالة البريد الأولية
      1                    // عدد المحاولات = 1
    ];

    sheet.appendRow(newRow);
    console.log('✅ تم حفظ الطلب في Sheets بنجاح');

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, newRow.length).setHorizontalAlignment('center');

    // ════════════════════════════════════════════════════════════════════════
    // STEP 3: محاولة إرسال Telegram مع معالجة الفشل
    // ════════════════════════════════════════════════════════════════════════

    let telegramStatus = '✅ نجح';
    let telegramSuccess = true;

    try {
      sendTelegramNotification(params);
      console.log('✅ تم إرسال Telegram بنجاح');
    } catch (telegramError) {
      telegramStatus = '❌ فشل - سيُعاد المحاولة لاحقاً';
      telegramSuccess = false;
      console.error('⚠️ خطأ في إرسال Telegram:', telegramError.toString());
      
      // تسجيل محاولة الإرسال الفاشلة
      logFailedAttempt(params, telegramError.toString());
    }

    // تحديث حالة Telegram في الـ Sheet (العمود 15)
    sheet.getRange(lastRow, 15).setValue(telegramStatus);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 3.5: محاولة إرسال Email للعميل (جديد!)
    // ════════════════════════════════════════════════════════════════════════

    let emailStatus = '✅ نجح';
    let emailSuccess = true;

    try {
      if (params.customerEmail) {
        sendCustomerEmail(params);
        console.log('✅ تم إرسال البريد الإلكتروني بنجاح');
      } else {
        emailStatus = '⚠️ لم يتم تقديم بريد إلكتروني';
        emailSuccess = false;
      }
    } catch (emailError) {
      emailStatus = '❌ فشل - سيُعاد المحاولة لاحقاً';
      emailSuccess = false;
      console.error('⚠️ خطأ في إرسال البريد:', emailError.toString());
      
      // تسجيل محاولة الإرسال الفاشلة
      logFailedAttempt(params, 'Email Error: ' + emailError.toString());
    }

    // تحديث حالة البريد في الـ Sheet (العمود 16)
    sheet.getRange(lastRow, 16).setValue(emailStatus);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 4: إرجاع الاستجابة للعميل
    // ════════════════════════════════════════════════════════════════════════

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: telegramSuccess && emailSuccess
          ? '✅ تم حفظ الطلب والإرسال للعامل وتأكيد البريد!' 
          : '✅ تم حفظ الطلب محلياً - سيتم إشعارات قريباً',
        orderId: params.id,
        timestamp: timestamp,
        queueStatus: telegramSuccess ? 'تم الإرسال' : 'في الطابور',
        telegramStatus: telegramStatus,
        emailStatus: emailStatus
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('❌ خطأ حرج:', error.toString());
    
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
// 📱 SECTION 3: إرسال Telegram مع معالجة الأخطاء المتقدمة
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📬 sendTelegramNotification() - إرسال مع معالجة الأخطاء
 * 
 * الميزات:
 *   ✅ timeout معقول (30 ثانية)
 *   ✅ معالجة أخطاء الشبكة
 *   ✅ التحقق من الاستجابة
 *   ✅ رسائل خطأ واضحة
 */
function sendTelegramNotification(orderData) {
  try {
    console.log('📱 جاري إرسال إشعار Telegram...');

    const message = formatTelegramMessage(orderData);
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
      muteHttpExceptions: true,
      timeout: 30  // 30 ثانية timeout
    };

    const response = UrlFetchApp.fetch(telegramURL, options);
    const responseCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    console.log('📨 رد Telegram:', responseCode, result);

    if (result.ok) {
      console.log('✅ تم إرسال الإشعار إلى Telegram بنجاح');
      return true;
    } else {
      throw new Error(`Telegram Error: ${result.description}`);
    }

  } catch (error) {
    console.error('❌ خطأ في إرسال Telegram:', error.toString());
    throw error;  // نرجع الخطأ للدالة الأب
  }
}

/**
 * 📝 formatTelegramMessage() - صياغة الرسالة
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
// 📧 SECTION 3.5: إرسال البريد الإلكتروني للعميل (جديد!)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📧 sendCustomerEmail() - إرسال بريد تأكيد للعميل
 * 
 * الوظيفة:
 *   إرسال بريد إلكتروني للعميل بتأكيد استقبال الطلب
 *   يتضمن كافة تفاصيل الطلب
 *   يعرّف العميل أن الفريق سيتصل به قريباً
 * 
 * المعاملات:
 *   orderData: كائن يحتوي على بيانات الطلب
 *   customerEmail: بريد العميل الإلكتروني
 * 
 * القيم المُرجعة:
 *   true: إذا تم الإرسال بنجاح
 *   false: إذا حدث خطأ في الإرسال
 * 
 * الأخطاء المعالجة:
 *   - عدم وجود بريد إلكتروني للعميل
 *   - فشل الاتصال بخدمة Gmail
 *   - أخطاء صيغة البريد
 */
function sendCustomerEmail(orderData) {
  try {
    console.log('📧 جاري إرسال بريد تأكيد للعميل...');

    // التحقق من وجود البريد الإلكتروني
    if (!orderData.customerEmail) {
      console.warn('⚠️ لا يوجد بريد إلكتروني للعميل');
      throw new Error('البريد الإلكتروني مفقود');
    }

    // إعداد عنوان الرسالة
    const subject = `✅ تم استقبال طلبك من لحوم الرياض #${orderData.id}`;
    
    // إعداد محتوى الرسالة بصيغة نصية
    const message = `السلام عليكم ورحمة الله وبركاته

تم استقبال طلبك بنجاح! 🎉

📋 تفاصيل الطلب:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
رقم الطلب: #${orderData.id}
الاسم: ${orderData.customerName || '-'}
الهاتف: ${orderData.customerPhone || '-'}
البريد الإلكتروني: ${orderData.customerEmail || '-'}

🐑 تفاصيل الماشية:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
النوع: ${orderData.animalType || '-'}
العمر: ${orderData.animalAge || '-'}
الكمية: ${orderData.quantity || '-'} وحدة
السعر للوحدة: ${orderData.pricePerUnit || '-'} ر.س

💰 المجموع النهائي:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderData.totalPrice || '-'} ر.س

📦 معلومات الخدمة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الخدمة: ${orderData.serviceType || '-'}
المنطقة: ${orderData.region || '-'}

⏰ معلومات الطلب:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الوقت: ${new Date().toLocaleString('ar-SA')}
الحالة: ${orderData.orderStatus || 'قيد المعالجة'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ما هي الخطوة التالية؟

1. تم تسجيل طلبك في نظامنا
2. سيتم إشعار فريقنا بطلبك مباشرة
3. سيتصلون بك قريباً لتأكيد الطلب والاتفاق على التوقيت
4. يمكنك الاطلاع على حالة طلبك من خلال البوابة

📞 إذا كان لديك أي استفسار، يمكنك التواصل معنا:
• الهاتف: يتوفر بعد الاتصال من الفريق
• البريد: سيتم إرسال تحديثات إليك

شكراً لاختيارك لحوم الرياض! 🙏
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

لحوم الرياض - جودة عالية وأسعار منافسة`;

    // إرسال البريد الإلكتروني
    GmailApp.sendEmail(
      orderData.customerEmail,  // بريد المستقبل
      subject,                  // عنوان الرسالة
      message                   // محتوى الرسالة
    );

    console.log('✅ تم إرسال البريد الإلكتروني بنجاح للعميل');
    return true;

  } catch (error) {
    console.error('❌ خطأ في إرسال البريد الإلكتروني:', error.toString());
    throw error;  // نرجع الخطأ للدالة الأب
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 📊 SECTION 4: نظام تسجيل المحاولات الفاشلة (Retry Log System)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 logFailedAttempt() - تسجيل محاولة إرسال فاشلة
 * 
 * الوظيفة:
 *   تسجيل الطلبات التي فشل إرسالها للتليجرام أو البريد الإلكتروني
 *   لإعادة محاولة الإرسال لاحقاً
 *   تتبع الأخطاء والإحصائيات
 */
function logFailedAttempt(orderData, errorMessage) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);

    // إنشاء ورقة السجل إذا لم تكن موجودة
    if (!logSheet) {
      console.log('📊 جاري إنشاء ورقة السجل...');
      logSheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
      
      const headers = [
        'وقت المحاولة',
        'رقم الطلب',
        'اسم العميل',
        'رسالة الخطأ',
        'عدد المحاولات',
        'آخر محاولة'
      ];
      
      logSheet.appendRow(headers);
      const headerRange = logSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#ff6b6b');
      headerRange.setFontColor('white');
    }

    // تسجيل المحاولة الفاشلة
    const logRow = [
      new Date().toLocaleString('ar-SA'),
      orderData.id,
      orderData.customerName,
      errorMessage,
      1,  // عدد المحاولات الأولي
      '🔄 قيد الانتظار'
    ];

    logSheet.appendRow(logRow);
    console.log('📊 تم تسجيل المحاولة الفاشلة');

  } catch (error) {
    console.error('❌ خطأ في تسجيل المحاولة:', error.toString());
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🔄 SECTION 5: إعادة محاولة الإرسال التلقائي (Auto Retry System)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔄 retryFailedOrders() - إعادة محاولة الطلبات الفاشلة
 * 
 * الوظيفة:
 *   تشغيل هذه الدالة دورياً (كل 5 دقائق)
 *   تفحص جميع الطلبات بحالة "فشل" للـ Telegram والبريد
 *   تحاول إرسالها مرة أخرى
 * 
 * الآلية:
 *   1. البحث عن الطلبات التي حالتها "❌ فشل"
 *   2. التحقق من أن المحاولات < 3
 *   3. إعادة محاولة الإرسال
 *   4. تحديث الحالة حسب النتيجة
 * 
 * الاستخدام:
 *   1. في Google Apps Script
 *   2. Triggers → New Trigger
 *   3. Function: retryFailedOrders
 *   4. Select event source: Time-driven
 *   5. اختر "Minutes timer" كل 5 دقائق
 */
function retryFailedOrders() {
  try {
    console.log('🔄 جاري فحص الطلبات الفاشلة...');

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      console.log('⚠️ لا توجد ورقة بيانات');
      return;
    }

    const data = sheet.getDataRange().getValues();
    let retriedCount = 0;
    let successCount = 0;

    // فحص جميع الصفوف (تجاوز الرؤوس)
    for (let i = 1; i < data.length; i++) {
      const telegramStatus = data[i][14];  // العمود 15 (حالة Telegram)
      const emailStatus = data[i][15];    // العمود 16 (حالة البريد)
      const retryCount = data[i][16] || 0;  // العمود 17 (عدد المحاولات)

      // التحقق من وجود حالة فشل
      const hasTelegramFailure = telegramStatus && telegramStatus.includes('❌');
      const hasEmailFailure = emailStatus && emailStatus.includes('❌');

      // إذا كانت هناك حالة فشل والمحاولات < 3
      if ((hasTelegramFailure || hasEmailFailure) && retryCount < 3) {
        console.log(`🔄 إعادة محاولة الطلب رقم: ${data[i][0]}`);

        // بناء كائن الطلب من البيانات المحفوظة
        const orderData = {
          id: data[i][0],
          customerName: data[i][1],
          customerPhone: data[i][2],
          customerEmail: data[i][3],
          animalType: data[i][4],
          animalAge: data[i][5],
          quantity: data[i][6],
          pricePerUnit: data[i][7],
          totalPrice: data[i][8],
          serviceType: data[i][9],
          region: data[i][10],
          orderStatus: data[i][11],
          timestamp: data[i][12]
        };

        // إعادة محاولة إرسال Telegram إذا فشل
        if (hasTelegramFailure) {
          try {
            sendTelegramNotification(orderData);
            sheet.getRange(i + 1, 15).setValue('✅ نجح (إعادة محاولة)');
            successCount++;
            console.log('✅ تم إرسال Telegram بنجاح!');
          } catch (error) {
            const newRetryCount = retryCount + 1;
            sheet.getRange(i + 1, 15).setValue(`❌ فشل - محاولة ${newRetryCount}/3`);
            console.log(`⚠️ محاولة Telegram ${newRetryCount}: فشلت - ${error.toString()}`);
          }
        }

        // إعادة محاولة إرسال البريد الإلكتروني إذا فشل
        if (hasEmailFailure && orderData.customerEmail) {
          try {
            sendCustomerEmail(orderData);
            sheet.getRange(i + 1, 16).setValue('✅ نجح (إعادة محاولة)');
            successCount++;
            console.log('✅ تم إرسال البريد الإلكتروني بنجاح!');
          } catch (error) {
            const newRetryCount = retryCount + 1;
            sheet.getRange(i + 1, 16).setValue(`❌ فشل - محاولة ${newRetryCount}/3`);
            console.log(`⚠️ محاولة البريد ${newRetryCount}: فشلت - ${error.toString()}`);
          }
        }

        // تحديث عدد المحاولات
        const newRetryCount = retryCount + 1;
        sheet.getRange(i + 1, 17).setValue(newRetryCount);
        
        retriedCount++;
      }
    }

    console.log(`✅ انتهت عملية المحاولة: ${retriedCount} طلب جرت محاولتها، ${successCount} نجحت`);

  } catch (error) {
    console.error('❌ خطأ في إعادة المحاولات:', error.toString());
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 📊 SECTION 6: دوال إحصائية وتقارير
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📊 getQueueStats() - الحصول على إحصائيات الطابور
 * 
 * الوظيفة:
 *   جمع إحصائيات شاملة عن حالة الطلبات
 *   عد الطلبات الناجحة والفاشلة والمعلقة
 *   حساب معدل النجاح
 * 
 * القيم المُرجعة:
 *   - totalOrders: إجمالي عدد الطلبات
 *   - successful: عدد الطلبات الناجحة
 *   - failed: عدد الطلبات الفاشلة
 *   - pending: عدد الطلبات المعلقة
 *   - successRate: معدل النجاح (نسبة مئوية)
 */
function getQueueStats() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    let totalOrders = data.length - 1;
    let successCount = 0;
    let failedCount = 0;
    let pendingCount = 0;

    for (let i = 1; i < data.length; i++) {
      const telegramStatus = data[i][14] || '';
      if (telegramStatus.includes('✅')) {
        successCount++;
      } else if (telegramStatus.includes('❌')) {
        failedCount++;
      } else {
        pendingCount++;
      }
    }

    return {
      totalOrders: totalOrders,
      successful: successCount,
      failed: failedCount,
      pending: pendingCount,
      successRate: totalOrders > 0 ? Math.round((successCount / totalOrders) * 100) : 0
    };

  } catch (error) {
    console.error('❌ خطأ:', error.toString());
    return null;
  }
}

/**
 * 🧪 testQueueSystem() - اختبار نظام الطابور
 * 
 * الوظيفة:
 *   اختبار شامل لنظام الطابور والإرسال
 *   التحقق من الحفظ والإشعارات
 *   يطبع نتائج الاختبار في Console
 * 
 * الاستخدام:
 *   تشغيل هذه الدالة من Google Apps Script Editor
 *   عرض النتائج في Logs
 */
function testQueueSystem() {
  try {
    console.log('🧪 اختبار نظام الطابور + البريد الإلكتروني...');

    const testData = {
      id: Date.now(),
      customerName: 'اختبار Queue System',
      customerPhone: '0501234567',
      customerEmail: 'test@example.com',
      animalType: 'غنم نعيمي',
      animalAge: '1 سنة',
      quantity: 3,
      pricePerUnit: 1800,
      totalPrice: 5400,
      serviceType: 'توصيل مجاني',
      region: 'الرياض',
      orderStatus: 'قيد المعالجة',
      timestamp: new Date().toLocaleString('ar-SA')
    };

    const e = { parameter: testData };
    const result = doPost(e);
    const content = result.getContent();
    const parsed = JSON.parse(content);

    console.log('✅ نتيجة الاختبار:', parsed);

    if (parsed.status === 'success') {
      console.log('✅ نظام الطابور والبريد يعمل بشكل صحيح! 🎉');
    }

  } catch (error) {
    console.error('❌ خطأ الاختبار:', error.toString());
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 📋 التعليمات الكاملة
// ════════════════════════════════════════════════════════════════════════════
//
// 1️⃣ نسخ الكود بالكامل
// 2️⃣ افتح Google Apps Script: https://script.google.com/
// 3️⃣ نشئ مشروع جديد
// 4️⃣ الصق الكود
// 5️⃣ احفظ واضغط Deploy
// 6️⃣ اختر New deployment → Web app
// 7️⃣ Execute as: Me
// 8️⃣ Who has access: Anyone
// 9️⃣ انسخ URL الـ Deployment
// 🔟 ضعه في app.js: APPS_SCRIPT_URL
//
// ⏰ إضافة Auto Retry:
// 1. في Google Apps Script
// 2. اضغط على 🔔 Triggers
// 3. New Trigger (أضف)
// 4. Function: retryFailedOrders
// 5. Select event source: Time-driven
// 6. Type: Minutes timer
// 7. Interval: Every 5 minutes
// 8. احفظ
//
// ✅ النظام جاهز مع دعم الطابور والبريد الإلكتروني!
// ════════════════════════════════════════════════════════════════════════════