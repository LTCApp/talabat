#!/bin/bash

# ألوان للنص
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 بدء تشغيل مستخرج منتجات سوق الجملة${NC}"
echo "================================================"

# تحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}⚠️ Node.js غير مثبت. يرجى تثبيت Node.js من https://nodejs.org${NC}"
    exit 1
fi

# تحقق من وجود package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}⚠️ package.json غير موجود. تأكد من وجوده في نفس المجلد.${NC}"
    exit 1
fi

# تثبيت المتطلبات
echo -e "${YELLOW}📦 جاري تثبيت المتطلبات...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}⚠️ فشل في تثبيت المتطلبات${NC}"
    exit 1
fi

# تشغيل الخادم
echo -e "${GREEN}✅ تم تثبيت المتطلبات بنجاح!${NC}"
echo -e "${BLUE}🚀 جاري تشغيل الخادم...${NC}"
echo "================================================"
echo -e "${GREEN}🌐 سيتم فتح الموقع على: http://localhost:3000${NC}"
echo -e "${YELLOW}⚠️ لإيقاف الخادم: اضغط Ctrl+C${NC}"
echo "================================================"

# فتح المتصفح تلقائياً بعد 3 ثوان (لـ macOS و Linux)
if command -v open &> /dev/null; then
    # macOS
    (sleep 3 && open http://localhost:3000) &
elif command -v xdg-open &> /dev/null; then
    # Linux
    (sleep 3 && xdg-open http://localhost:3000) &
fi

# تشغيل الخادم
node server.js