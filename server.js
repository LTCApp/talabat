// server.js - خادم Node.js لاستخراج المنتجات الحقيقي
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// تقديم الملفات الاستاتيكية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API لاستخراج المنتجات
app.post('/api/extract', async (req, res) => {
    try {
        const { url, method = 'puppeteer' } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'يجب توفير رابط الموقع' });
        }

        let products = [];
        
        if (url.includes('souqgomlaa.almatjar.store')) {
            products = await extractFromSouqGomla(url, method);
        } else if (url.includes('talabat.com')) {
            products = await extractFromTalabat(url, method);
        } else {
            products = await extractFromGenericSite(url, method);
        }

        res.json({
            success: true,
            products,
            total: products.length,
            extractedAt: new Date().toISOString(),
            url
        });

    } catch (error) {
        console.error('خطأ في الاستخراج:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            products: getDemoProducts() // بيانات تجريبية في حالة الفشل
        });
    }
});

// استخراج من سوق الجملة باستخدام Puppeteer
async function extractFromSouqGomla(url, method = 'puppeteer') {
    console.log(`بدء استخراج سوق الجملة باستخدام ${method}`);
    
    if (method === 'puppeteer') {
        return await extractWithPuppeteer(url);
    } else {
        return await extractWithAxios(url);
    }
}

// استخراج باستخدام Puppeteer (للمواقع الديناميكية)
async function extractWithPuppeteer(url) {
    let browser;
    
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        const page = await browser.newPage();
        
        // تعيين User Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // تعيين بيانات الشاشة
        await page.setViewport({ width: 1366, height: 768 });
        
        console.log('جاري تحميل الصفحة...');
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // انتظار تحميل المنتجات
        try {
            await page.waitForSelector('.product, .item, [data-product]', { timeout: 10000 });
        } catch (e) {
            console.log('لم يتم العثور على عناصر منتجات محددة، سيتم المتابعة...');
        }
        
        // انتظار إضافي لضمان تحميل JavaScript
        await page.waitForTimeout(3000);
        
        console.log('جاري استخراج المنتجات...');
        
        // استخراج بيانات المنتجات من الصفحة
        const products = await page.evaluate(() => {
            const extractedProducts = [];
            
            // قائمة العناصر المحتملة للمنتجات
            const selectors = [
                '.product-item',
                '.product',
                '.item', 
                '.product-card',
                '.card',
                '[data-product]',
                '[data-product-id]'
            ];
            
            let productElements = [];
            for (const selector of selectors) {
                productElements = document.querySelectorAll(selector);
                if (productElements.length > 0) {
                    console.log(`وجد ${productElements.length} عنصر باستخدام ${selector}`);
                    break;
                }
            }
            
            // إذا لم نجد عناصر محددة، نبحث عن عناصر تحتوي على أسعار
            if (productElements.length === 0) {
                const allElements = document.querySelectorAll('*');
                const potentialProducts = [];
                
                allElements.forEach(el => {
                    const text = el.textContent || '';
                    if (text.match(/\d+\s*جنيه/) && el.querySelector('img')) {
                        potentialProducts.push(el);
                    }
                });
                
                productElements = potentialProducts.slice(0, 20);
                console.log(`وجد ${productElements.length} عنصر محتمل يحتوي على منتجات`);
            }
            
            productElements.forEach((element, index) => {
                try {
                    // استخراج الاسم
                    const nameElement = element.querySelector('.product-title, .product-name, h1, h2, h3, h4, .title, .name') || element;
                    const name = nameElement.textContent.trim() || `منتج ${index + 1}`;
                    
                    // استخراج السعر
                    const priceElement = element.querySelector('.price, .product-price, .cost, [data-price]') || element;
                    const priceText = priceElement.textContent || priceElement.getAttribute('data-price') || '';
                    const priceMatch = priceText.match(/([\d,]+\.?\d*)/);
                    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
                    
                    // استخراج الصورة
                    const imgElement = element.querySelector('img');
                    let image = 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة';
                    if (imgElement) {
                        const src = imgElement.getAttribute('data-src') || imgElement.getAttribute('src');
                        if (src && !src.includes('loader.svg')) {
                            image = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : window.location.origin + src);
                        }
                    }
                    
                    // استخراج الكود
                    const code = element.getAttribute('data-product-id') || 
                               element.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
                               `PROD_${Date.now()}_${index}`;
                    
                    // تحديد حالة التوفر
                    const text = element.textContent.toLowerCase();
                    const status = (text.includes('غير متوفر') || text.includes('نفدت') || text.includes('out of stock')) ? 'غير متوفر' : 'متوفر';
                    
                    if (name && price > 0) {
                        extractedProducts.push({
                            code,
                            name,
                            image,
                            price,
                            currency: 'جنيه',
                            status,
                            extractedAt: new Date().toISOString()
                        });
                    }
                    
                } catch (error) {
                    console.warn(`خطأ في استخراج المنتج ${index}:`, error);
                }
            });
            
            return extractedProducts;
        });
        
        console.log(`تم استخراج ${products.length} منتج`);
        return products;
        
    } catch (error) {
        console.error('خطأ في Puppeteer:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// استخراج باستخدام Axios و Cheerio (للمواقع الاستاتيكية)
async function extractWithAxios(url) {
    try {
        console.log('جاري تحميل الصفحة باستخدام Axios...');
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            },
            timeout: 30000
        });
        
        const $ = cheerio.load(response.data);
        const products = [];
        
        // البحث عن عناصر المنتجات
        const selectors = ['.product-item', '.product', '.item', '.product-card', '.card'];
        let productElements = $();
        
        for (const selector of selectors) {
            productElements = $(selector);
            if (productElements.length > 0) {
                console.log(`وجد ${productElements.length} عنصر باستخدام ${selector}`);
                break;
            }
        }
        
        productElements.each((index, element) => {
            try {
                const $el = $(element);
                
                // استخراج البيانات
                const name = $el.find('.product-title, .product-name, h1, h2, h3, h4, .title, .name').first().text().trim() || `منتج ${index + 1}`;
                
                const priceText = $el.find('.price, .product-price, .cost').first().text() || $el.attr('data-price') || '';
                const priceMatch = priceText.match(/([\d,]+\.?\d*)/);
                const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
                
                const imgSrc = $el.find('img').first().attr('data-src') || $el.find('img').first().attr('src');
                let image = 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة';
                if (imgSrc && !imgSrc.includes('loader.svg')) {
                    image = imgSrc.startsWith('http') ? imgSrc : (imgSrc.startsWith('//') ? 'https:' + imgSrc : new URL(url).origin + imgSrc);
                }
                
                const code = $el.attr('data-product-id') || $el.find('[data-product-id]').first().attr('data-product-id') || `PROD_${Date.now()}_${index}`;
                
                const text = $el.text().toLowerCase();
                const status = (text.includes('غير متوفر') || text.includes('نفدت') || text.includes('out of stock')) ? 'غير متوفر' : 'متوفر';
                
                if (name && price > 0) {
                    products.push({
                        code,
                        name,
                        image,
                        price,
                        currency: 'جنيه',
                        status,
                        extractedAt: new Date().toISOString()
                    });
                }
                
            } catch (error) {
                console.warn(`خطأ في استخراج المنتج ${index}:`, error);
            }
        });
        
        console.log(`تم استخراج ${products.length} منتج باستخدام Axios`);
        return products;
        
    } catch (error) {
        console.error('خطأ في Axios:', error);
        throw error;
    }
}

// استخراج من طلبات
async function extractFromTalabat(url, method = 'puppeteer') {
    console.log('بدء استخراج طلبات...');
    
    // طلبات يحتاج Puppeteer فقط لأنه يعتمد على React
    return await extractWithPuppeteer(url);
}

// استخراج عام للمواقع الأخرى
async function extractFromGenericSite(url, method = 'axios') {
    console.log('بدء استخراج عام...');
    
    if (method === 'puppeteer') {
        return await extractWithPuppeteer(url);
    } else {
        return await extractWithAxios(url);
    }
}

// بيانات تجريبية في حالة الفشل
function getDemoProducts() {
    return [
        {
            code: '2984',
            name: 'عرض (بلاشر سائل نارس درجه 101 Orange +بلاشر سائل نارس درجه 101 Orange+بلاشر سائل نارس درجه 103 Red+بلاشر سائل نارس درجه 104 Mahogany )',
            image: 'https://tager-uploads.s3.eu-central-1.amazonaws.com/c091e028-2a44-41b1-8a25-979440c172ee.jpg',
            price: 230,
            currency: 'جنيه',
            status: 'متوفر'
        },
        {
            code: '2985',
            name: 'عرض (كرستيان ديور سوفاج هاي كوبي +حظاظة يد بقفل معدن )',
            image: 'https://tager-uploads.s3.eu-central-1.amazonaws.com/a276f20c-149d-4a18-adbf-1236ac301bbc.jpg',
            price: 120,
            currency: 'جنيه',
            status: 'متوفر'
        },
        {
            code: '2986',
            name: 'عرض ( ديسبنسر الصابون 2 في 1 + فلتر مياه بقفل 2 في 1)',
            image: 'https://tager-uploads.s3.eu-central-1.amazonaws.com/ba81ccb8-5027-4903-b019-221de57ae1fd.jpg',
            price: 300,
            currency: 'جنيه',
            status: 'متوفر'
        }
    ];
}

// بدء الخادم
app.listen(PORT, () => {
    console.log(`خادم استخراج المنتجات يعمل على http://localhost:${PORT}`);
    console.log('للوصول للموقع: http://localhost:' + PORT);
    console.log('API لاستخراج المنتجات: POST /api/extract');
});