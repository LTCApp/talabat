# 🚀 دليل التشغيل والاستخدام

## الحلول المتاحة

تم إنشاء 3 حلول مختلفة لاستخراج المنتجات:

### 1. 🌐 الموقع الأساسي (Frontend)
- **الملفات**: `index.html`, `style.css`, `script.js`
- **المميزات**: واجهة جميلة، تصدير CSV/JSON
- **القيود**: محدود بقيود CORS والمتصفح

### 2. 🔧 خادم Node.js (الحل الأفضل)
- **الملفات**: `server.js`, `package.json`
- **المميزات**: استخراج حقيقي بـ Puppeteer و Cheerio
- **المتطلبات**: Node.js و npm

### 3. 🐍 تطبيق Python (بديل مقل)
- **الملف**: `extractor.py`
- **المميزات**: بسيط ومستقل، BeautifulSoup + Selenium
- **المتطلبات**: Python 3.7+

---

## 🚀 التشغيل السريع (الحل الموصى به)

### الخطوة 1: تثبيت Node.js
```bash
# تثبيت المتطلبات
npm install

# أو بطريقة يدوية
npm install express cors puppeteer cheerio axios
```

### الخطوة 2: تشغيل الخادم
```bash
# تشغيل الخادم
npm start

# أو
node server.js
```

### الخطوة 3: فتح الموقع
افتح المتصفح واذهب إلى: `http://localhost:3000`

---

## 🐍 استخدام تطبيق Python

### الخطوة 1: تثبيت المكتبات
```bash
# تثبيت المتطلبات الأساسية
pip install requests beautifulsoup4

# للمواقع الديناميكية (اختياري)
pip install selenium

# تثبيت ChromeDriver (لـ Selenium)
# اتبع إرشادات https://chromedriver.chromium.org/
```

### الخطوة 2: تشغيل التطبيق
```bash
python extractor.py
```

---

## 🌐 استخدام الموقع فقط (بدون خادم)

افتح `index.html` في المتصفح مباشرة.

**تحذير**: قد لا يعمل الاستخراج الحقيقي بسبب قيود CORS.

---

## 🔧 استكشاف الأخطاء

### مشكلة: "لا يستخرج شيء"

#### الحلول:

1. **تأكد من تشغيل الخادم**:
   ```bash
   # تحقق من تشغيل الخادم
   curl http://localhost:3000/api/health
   ```

2. **تحقق من الرابط**:
   - استخدم: `https://souqgomlaa.almatjar.store/ar/shop`
   - تجنب: `https://www.talabat.com` (يحتاج Puppeteer)

3. **فحص console المتصفح**:
   - اضغط F12 وانظر الأخطاء

4. **جرب تطبيق Python**:
   ```bash
   python extractor.py
   ```

### مشكلة: خطأ في تثبيت Puppeteer

```bash
# لـ Ubuntu/Debian
sudo apt-get install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0

# لـ macOS
brew install chromium

# لـ Windows
# تثبيت تلقائي مع npm install
```

### مشكلة: CORS Error

هذه مشكلة طبيعية. الحلول:
1. استخدم خادم Node.js
2. استخدم تطبيق Python
3. استخدم browser extension

---

## 📦 ملفات المشروع

```
wholesale-extractor/
├── 🌐 Frontend (الموقع)
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── 🔧 Backend (الخادم)
│   ├── server.js
│   ├── package.json
│   └── api-integration.js
│
├── 🐍 Python البديل
│   └── extractor.py
│
├── 🔗 التكامل
│   └── client-server-integration.js
│
└── 📝 التوثيق
    ├── README.md
    └── SETUP_GUIDE.md
```

---

## 🎯 الاستخدام الموصى به

### للمبتدئين:
1. استخدم **تطبيق Python** (`extractor.py`)
2. بسيط ولا يحتاج إعدادات معقدة

### للمتقدمين:
1. استخدم **خادم Node.js** (`server.js`)
2. أداء أفضل وإمكانيات أكثر

### للتجربة السريعة:
1. افتح **الموقع مباشرة** (`index.html`)
2. للاطلاع على الواجهة فقط

---

## 🔄 التحديثات المستقبلية

- [ ] دعم المزيد من المواقع
- [ ] تحسين الأداء والسرعة
- [ ] إضافة مرشحات متقدمة
- [ ] تطبيق محمول (Android/iOS)
- [ ] API عام للمطورين

---

**📞 للدعم التقني:**  
إذا واجهت مشاكل، افتح console المتصفح (F12) وانسخ رسالة الخطأ.