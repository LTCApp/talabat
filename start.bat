@echo off
echo 🚀 بدء تشغيل مستخرج منتجات سوق الجملة
echo ================================================

REM تحقق من وجود Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Node.js غير مثبت. يرجى تثبيت Node.js من https://nodejs.org
    pause
    exit /b 1
)

REM تحقق من وجود package.json
if not exist package.json (
    echo ⚠️ package.json غير موجود. تأكد من وجوده في نفس المجلد.
    pause
    exit /b 1
)

REM تثبيت المتطلبات
echo 📦 جاري تثبيت المتطلبات...
npm install
if %errorlevel% neq 0 (
    echo ⚠️ فشل في تثبيت المتطلبات
    pause
    exit /b 1
)

REM تشغيل الخادم
echo ✅ تم تثبيت المتطلبات بنجاح!
echo 🚀 جاري تشغيل الخادم...
echo ================================================
echo 🌐 سيتم فتح الموقع على: http://localhost:3000
echo ⚠️ لإيقاف الخادم: اضغط Ctrl+C
echo ================================================

REM فتح المتصفح تلقائياً بعد 3 ثوان
start "" timeout /t 3 /nobreak && start http://localhost:3000

REM تشغيل الخادم
node server.js