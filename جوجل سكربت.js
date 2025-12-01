// ════════════════════════════════════════════════════════════════
// Google Apps Script - استقبال بيانات الطلبات + إرسال Telegram
// ════════════════════════════════════════════════════════════════

// ⚠️ اضبط هذه المتغيرات:
const TELEGRAM_BOT_TOKEN = "8185675610:AAGmYo2_Ym0kDM0DYF4otw77xnDv7ug3Czs";
const TELEGRAM_CHAT_ID = "5625674358";

function doPost(e) {
  try {
    // ✅ احصل على الـ Sheet بشكل صحيح
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Orders") || spreadsheet.getActiveSheet();
    
    // تحقق من أن الصف الأول يحتوي على الرؤوس
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'رقم الطلب',
        'اسم العميل',
        'رقم الهاتف',
        'نوع الماشية',
        'العمر',
        'الكمية',
        'السعر',
        'الإجمالي',
        'نوع الخدمة',
        'المنطقة',
        'الحالة',
        'التاريخ والوقت'
      ]);
    }
    
    // احصل على البيانات من الطلب
    const params = e.parameter;
    
    // أضف الصف الجديد
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
      params.timestamp || new Date().toLocaleString('ar-SA')
    ];
    
    sheet.appendRow(newRow);
    
    // ✅ إرسال Telegram
    sendTelegramMessage(params);
    
    // أرجع رسالة نجاح
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'تم حفظ الطلب بنجاح! ✅'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // أرجع رسالة خطأ
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * إرسال رسالة Telegram
 */
function sendTelegramMessage(orderData) {
  try {
    // صيغة الرسالة
    const message = formatTelegramMessage(orderData);
    
    // الرابط
    const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    // أرسل الطلب
    const response = UrlFetchApp.fetch(telegramURL, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('✅ Telegram Message Sent Successfully');
    } else {
      Logger.log('❌ Telegram Error: ' + result.description);
    }
    
  } catch (error) {
    Logger.log('❌ Error sending Telegram: ' + error.toString());
  }
}

/**
 * تنسيق رسالة Telegram
 */
function formatTelegramMessage(data) {
  const message = `
<b>🍖 طلب جديد من لحوم الرياض</b>

<b>👤 بيانات العميل:</b>
الاسم: ${data.customerName || '-'}
الهاتف: ${data.customerPhone || '-'}

<b>🐑 تفاصيل الطلب:</b>
نوع الماشية: ${data.animalType || '-'}
العمر: ${data.animalAge || '-'}
الكمية: ${data.quantity || '-'}
السعر للواحد: ${data.pricePerUnit || '-'} ر.س

<b>💰 المجموع:</b>
${data.totalPrice || '-'} ر.س

<b>📦 الخدمات:</b>
الخدمة: ${data.serviceType || '-'}
المنطقة: ${data.region || '-'}

<b>⏰ التفاصيل:</b>
الحالة: ${data.orderStatus || '-'}
الوقت: ${data.timestamp || '-'}
رقم الطلب: #${data.id || '-'}

━━━━━━━━━━━━━━━━━
✅ تم حفظ الطلب في قاعدة البيانات
  `.trim();
  
  return message;
}

// اختبر الدالة من هنا
function testFunction() {
  const testData = {
    parameter: {
      id: Date.now(),
      customerName: 'اختبار تليجرام',
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
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
