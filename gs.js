/* 🍖 لحوم الرياض - gs.js | Google Apps Script v10
✅ تطوير: 2025-12-01 18:00
✅ حفظ في Google Sheets
✅ إشعارات Telegram و Email
✅ معالجة أخطاء متقدمة

طريقة الاستخدام:
1. انسخ هذا الكود إلى Google Apps Script Editor
2. افتح: https://script.google.com/home
3. أنشئ مشروع جديد
4. الصق هذا الكود
5. اضغط "نشر" → "نشر كتطبيق ويب"
*/

// ════════════════════════════════════════════════════════════════════════════
// ⚙️ SECTION 1: الإعدادات الأساسية
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔑 TELEGRAM_BOT_TOKEN - رمز بوت تليجرام
 * 
 * طريقة الحصول:
 * 1. افتح Telegram وابحث عن @BotFather
 * 2. أرسل /newbot
 * 3. اتبع التعليمات واحصل على الرمز
 */
const TELEGRAM_BOT_TOKEN = "8185675610:AAGmYo2_Ym0kDM0DYF4otw77xnDv7ug3Czs";

/**
 * 👥 TELEGRAM_CHAT_ID - معرّف مجموعة تليجرام
 * 
 * طريقة الحصول:
 * 1. أنشئ مجموعة خاصة
 * 2. أضف البوت إليها
 * 3. افتح: https://api.telegram.org/botTOKEN/getUpdates
 * 4. ابحث عن "chat": {"id": XXXXX}
 */
const TELEGRAM_CHAT_ID = "5625674358";

/**
 * 📊 SPREADSHEET_NAME - اسم جدول البيانات
 */
const SPREADSHEET_NAME = "لحوم الرياض - الطلبات";
const SHEET_NAME = "Orders";

/**
 * 📧 EMAIL_CONFIG - إعدادات البريد الإلكتروني
 */
const EMAIL_CONFIG = {
    adminEmail: 'your-email@gmail.com',
    fromName: 'لحوم الرياض',
    sendNotifications: true
};

// ════════════════════════════════════════════════════════════════════════════
// 📤 معالج الطلبات الرئيسي
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📤 doPost - معالج طلبات POST
 * 
 * الخطوات:
 * 1. استقبال البيانات
 * 2. التحقق من الصحة
 * 3. حفظ في Google Sheets
 * 4. إرسال إشعارات
 * 5. إرجاع النتيجة
 */
function doPost(e) {
    try {
        console.log('📤 استقبال طلب جديد...');
        
        // الحصول على البيانات
        const params = e.parameter;
        const timestamp = new Date().toLocaleString('ar-SA');
        
        // التحقق من البيانات الأساسية
        if (!params.id || !params.customerName) {
            throw new Error('❌ البيانات المطلوبة مفقودة');
        }
        
        // الحصول على الورقة
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet) {
            console.log('📋 جاري إنشاء ورقة جديدة...');
            sheet = spreadsheet.insertSheet(SHEET_NAME);
            addHeaders(sheet);
        }
        
        // إضافة الطلب
        addOrderRow(sheet, params, timestamp);
        
        // إرسال الإشعارات
        sendTelegramNotification(params);
        sendEmailNotification(params);
        
        console.log('✅ تم معالجة الطلب بنجاح');
        
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
// 📋 إدارة الجدول
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📊 addHeaders - إضافة رؤوس الأعمدة
 */
function addHeaders(sheet) {
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
    
    // تنسيق الرؤوس
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#2c5aa0');
    headerRange.setFontColor('white');
    
    console.log('✅ تم إضافة الرؤوس');
}

/**
 * ➕ addOrderRow - إضافة صف جديد بالطلب
 */
function addOrderRow(sheet, params, timestamp) {
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
}

// ════════════════════════════════════════════════════════════════════════════
// 📱 إرسال إشعارات Telegram
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📬 sendTelegramNotification - إرسال إشعار تليجرام
 */
function sendTelegramNotification(orderData) {
    try {
        const message = formatTelegramMessage(orderData);
        const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const payload = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        };
        
        const options = {
            method: 'post',
            payload: JSON.stringify(payload),
            contentType: 'application/json',
            muteHttpExceptions: true
        };
        
        const response = UrlFetchApp.fetch(telegramURL, options);
        const result = JSON.parse(response.getContentText());
        
        if (result.ok) {
            console.log('✅ تم إرسال إشعار Telegram');
        } else {
            console.warn('⚠️ فشل إرسال إشعار Telegram:', result.description);
        }
    } catch (error) {
        console.error('❌ خطأ في إرسال إشعار Telegram:', error);
    }
}

/**
 * 📝 formatTelegramMessage - صياغة رسالة تليجرام
 */
function formatTelegramMessage(data) {
    return `<b>🍖 طلب جديد</b>\n\n` +
        `<b>👤 العميل:</b> ${data.customerName}\n` +
        `<b>📱 الهاتف:</b> ${data.customerPhone}\n` +
        `<b>🐑 النوع:</b> ${data.animalType}\n` +
        `<b>📅 العمر:</b> ${data.animalAge}\n` +
        `<b>📦 الكمية:</b> ${data.quantity}\n` +
        `<b>💰 السعر:</b> ${data.pricePerUnit} ر.س\n` +
        `<b>💵 الإجمالي:</b> ${data.totalPrice} ر.س\n` +
        `<b>🚚 الخدمة:</b> ${data.serviceType}\n` +
        `<b>📍 المنطقة:</b> ${data.region}\n` +
        `<b>📊 الحالة:</b> ${data.orderStatus}\n` +
        `<b>🕐 التوقيت:</b> ${data.timestamp}`;
}

// ════════════════════════════════════════════════════════════════════════════
// 📧 إرسال إشعارات البريد الإلكتروني
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📧 sendEmailNotification - إرسال بريد إلكتروني
 */
function sendEmailNotification(orderData) {
    if (!EMAIL_CONFIG.sendNotifications) return;
    
    try {
        const subject = `🍖 طلب جديد من ${orderData.customerName}`;
        const message = formatEmailMessage(orderData);
        
        GmailApp.sendEmail(
            EMAIL_CONFIG.adminEmail,
            subject,
            message
        );
        
        console.log('✅ تم إرسال بريد إلكتروني');
    } catch (error) {
        console.error('❌ خطأ في إرسال البريد:', error);
    }
}

/**
 * 📝 formatEmailMessage - صياغة رسالة البريل
 */
function formatEmailMessage(data) {
    return `السلام عليكم ورحمة الله وبركاته,\n\n` +
        `تم استقبال طلب جديد:\n\n` +
        `====================================\n` +
        `اسم العميل: ${data.customerName}\n` +
        `رقم الهاتف: ${data.customerPhone}\n` +
        `نوع الماشية: ${data.animalType}\n` +
        `العمر: ${data.animalAge}\n` +
        `الكمية: ${data.quantity}\n` +
        `السعر للوحدة: ${data.pricePerUnit} ر.س\n` +
        `الإجمالي: ${data.totalPrice} ر.س\n` +
        `نوع الخدمة: ${data.serviceType}\n` +
        `المنطقة: ${data.region}\n` +
        `الحالة: ${data.orderStatus}\n` +
        `التاريخ والوقت: ${data.timestamp}\n` +
        `====================================\n\n` +
        `يرجى التحقق من الطلب في جدول البيانات.\n\n` +
        `تطبيق: 🍖 لحوم الرياض - النسخة v10`;
}