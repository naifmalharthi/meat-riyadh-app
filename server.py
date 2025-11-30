#!/usr/bin/env python3
"""
🍖 لحوم الرياض - Development Server
خادم محلي محسّن للتطوير مع ميزات إضافية

الاستخدام:
    python3 server.py

أو:
    python3 -m http.server 8000
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from urllib.parse import urlparse, parse_qs

PORT = 8000
HOSTNAME = '0.0.0.0'

class MeatRiyadhHandler(http.server.SimpleHTTPRequestHandler):
    """
    معالج HTTP مخصص لـ Meat Riyadh App
    يضيف رؤوس إضافية لتحسين التطوير
    """
    
    def end_headers(self):
        """إضافة رؤوس لتحسين الـ caching والـ CORS"""
        
        # السماح بـ CORS (للتطوير فقط)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        
        # منع الـ cache القديم
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        # تحديد MIME types بشكل صحيح
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
        elif self.path.endswith('.css'):
            self.send_header('Content-Type', 'text/css; charset=utf-8')
        elif self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json; charset=utf-8')
        elif self.path.endswith('.html'):
            self.send_header('Content-Type', 'text/html; charset=utf-8')
        
        super().end_headers()
    
    def log_message(self, format, *args):
        """تحسين رسائل السجل"""
        if self.path == '/favicon.ico':
            return  # تجاهل رسائل favicon
        
        status = args[1] if len(args) > 1 else '?'
        method = args[0] if len(args) > 0 else '?'
        
        # ألوان للـ terminal
        if str(status).startswith('2'):
            status_color = '\033[92m'  # أخضر
        elif str(status).startswith('3'):
            status_color = '\033[94m'  # أزرق
        elif str(status).startswith('4'):
            status_color = '\033[93m'  # أصفر
        else:
            status_color = '\033[91m'  # أحمر
        
        reset_color = '\033[0m'
        
        print(f'{status_color}[{status}]{reset_color} {method} {self.path}')


def start_server():
    """بدء الخادم"""
    
    try:
        with socketserver.TCPServer(
            (HOSTNAME, PORT), 
            MeatRiyadhHandler
        ) as httpd:
            print('═' * 60)
            print('🍖 لحوم الرياض - Development Server')
            print('═' * 60)
            print()
            print('✅ الخادم يعمل الآن!')
            print()
            print(f'🌐 الرابط المحلي:')
            print(f'   http://localhost:{PORT}')
            print()
            print(f'🌐 الرابط من الشبكة (لهاتفك):')
            print(f'   http://<your-ip>:{PORT}')
            print()
            print('💡 الاختصارات المفيدة:')
            print('   Ctrl + Shift + R  → Hard Refresh (تحديث فوري)')
            print('   F12               → Developer Tools (أدوات المطور)')
            print('   Ctrl + C          → إيقاف الخادم')
            print()
            print('📁 الملفات المراقبة:')
            print('   • index.html')
            print('   • style.css')
            print('   • app.js')
            print()
            print('═' * 60)
            print()
            
            # فتح المتصفح تلقائياً (اختياري)
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print('🚀 فتح المتصفح...\n')
            except:
                pass
            
            print('📡 السجلات:')
            print('─' * 60)
            httpd.serve_forever()
    
    except OSError as e:
        if e.errno == 48 or e.errno == 98:  # Port already in use
            print(f'❌ الخطأ: المنفذ {PORT} مستخدم بالفعل!')
            print()
            print('الحل:')
            print(f'1. استخدم منفذ آخر: python3 -m http.server 8001')
            print(f'2. أو أغلق البرنامج الذي يستخدم المنفذ {PORT}')
        else:
            print(f'❌ الخطأ: {e}')
        sys.exit(1)
    
    except KeyboardInterrupt:
        print()
        print()
        print('═' * 60)
        print('✅ تم إيقاف الخادم')
        print('═' * 60)
        sys.exit(0)


if __name__ == '__main__':
    start_server()
