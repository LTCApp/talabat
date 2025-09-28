// api-integration.js - ملف التكامل مع APIs الحقيقية
// هذا الملف يحتوي على الكود المطلوب للتكامل مع مواقع سوق الجملة الحقيقية

class RealAPIIntegration {
    constructor() {
        this.apiEndpoints = {
            souqGomla: 'https://souqgomlaa.almatjar.store/ar/shop',
            talabat: 'https://www.talabat.com/ar/egypt/groceries/7081/souq-el-gomla'
        };
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
    }

    /**
     * استخراج المنتجات من سوق الجملة - المتجر
     * @param {string} url رابط المتجر
     * @returns {Promise<Array>} قائمة المنتجات
     */
    async extractFromSouqGomla(url) {
        try {
            // استخدام Fetch API مع CORS proxy للتغلب على قيود المتصفح
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(proxyUrl + url, {
                headers: this.headers,
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            return this.parseSouqGomlaHTML(html);
        } catch (error) {
            console.error('خطأ في استخراج منتجات سوق الجملة:', error);
            throw error;
        }
    }

    /**
     * تحليل HTML واستخراج معلومات المنتجات من سوق الجملة
     * @param {string} html محتوى HTML
     * @returns {Array} قائمة المنتجات
     */
    parseSouqGomlaHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const products = [];

        // البحث عن عناصر المنتجات
        const productElements = doc.querySelectorAll('.product-item, .product, [data-product-id]');

        productElements.forEach((element, index) => {
            try {
                const product = {
                    id: index + 1,
                    code: this.extractProductCode(element),
                    name: this.extractProductName(element),
                    image: this.extractProductImage(element),
                    price: this.extractProductPrice(element),
                    currency: 'جنيه',
                    status: this.extractProductStatus(element),
                    url: this.extractProductUrl(element),
                    extractedAt: new Date().toISOString()
                };

                if (product.code && product.name) {
                    products.push(product);
                }
            } catch (error) {
                console.warn(`خطأ في استخراج المنتج رقم ${index}:`, error);
            }
        });

        return products;
    }

    /**
     * استخراج كود المنتج
     * @param {Element} element عنصر HTML للمنتج
     * @returns {string} كود المنتج
     */
    extractProductCode(element) {
        // البحث عن كود المنتج في مختلف الأماكن المحتملة
        const codeSelectors = [
            '[data-product-id]',
            '.product-id',
            '.product-code',
            '.sku',
            'meta[property="product:retailer_item_id"]'
        ];

        for (const selector of codeSelectors) {
            const codeElement = element.querySelector(selector);
            if (codeElement) {
                return codeElement.getAttribute('data-product-id') || 
                       codeElement.getAttribute('content') || 
                       codeElement.textContent.trim();
            }
        }

        // إذا لم يوجد كود صريح، استخراج من URL
        const link = element.querySelector('a[href]');
        if (link) {
            const match = link.href.match(/\/(\d+)\//); 
            if (match) return match[1];
        }

        return `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * استخراج اسم المنتج
     * @param {Element} element عنصر HTML للمنتج
     * @returns {string} اسم المنتج
     */
    extractProductName(element) {
        const nameSelectors = [
            '.product-title',
            '.product-name', 
            'h2',
            'h3',
            '.title',
            '[data-product-name]',
            'meta[property="og:title"]'
        ];

        for (const selector of nameSelectors) {
            const nameElement = element.querySelector(selector);
            if (nameElement) {
                return nameElement.getAttribute('content') || 
                       nameElement.textContent.trim();
            }
        }

        return 'اسم المنتج غير محدد';
    }

    /**
     * استخراج صورة المنتج
     * @param {Element} element عنصر HTML للمنتج
     * @returns {string} رابط صورة المنتج
     */
    extractProductImage(element) {
        const imageSelectors = [
            '.product-image img',
            '.product-img img',
            'img[data-src]',
            'img[src]',
            'meta[property="og:image"]'
        ];

        for (const selector of imageSelectors) {
            const imgElement = element.querySelector(selector);
            if (imgElement) {
                const src = imgElement.getAttribute('data-src') || 
                           imgElement.getAttribute('src') ||
                           imgElement.getAttribute('content');
                
                if (src && src !== '/store/images/loader.svg') {
                    return src.startsWith('http') ? src : `https:${src}`;
                }
            }
        }

        return 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة';
    }

    /**
     * استخراج سعر المنتج
     * @param {Element} element عنصر HTML للمنتج
     * @returns {number} سعر المنتج
     */
    extractProductPrice(element) {
        const priceSelectors = [
            '.price',
            '.product-price',
            '.cost',
            '[data-price]',
            'meta[property="product:price:amount"]'
        ];

        for (const selector of priceSelectors) {
            const priceElement = element.querySelector(selector);
            if (priceElement) {
                const priceText = priceElement.getAttribute('data-price') ||
                                priceElement.getAttribute('content') ||
                                priceElement.textContent;
                
                const priceMatch = priceText.match(/([\d,]+\.?\d*)/); 
                if (priceMatch) {
                    return parseFloat(priceMatch[1].replace(',', ''));
                }
            }
        }

        return 0;
    }

    /**
     * استخراج حالة توفر المنتج
     * @param {Element} element عنصر HTML للمنتج
     * @returns {string} حالة التوفر
     */
    extractProductStatus(element) {
        // البحث عن علامات عدم التوفر
        const unavailableIndicators = [
            '.out-of-stock',
            '.unavailable',
            '.sold-out',
            '[data-stock="0"]'
        ];

        for (const selector of unavailableIndicators) {
            if (element.querySelector(selector)) {
                return 'غير متوفر';
            }
        }

        // البحث عن نص يدل على عدم التوفر
        const text = element.textContent.toLowerCase();
        if (text.includes('غير متوفر') || text.includes('out of stock') || text.includes('نفذت الكمية')) {
            return 'غير متوفر';
        }

        return 'متوفر';
    }

    /**
     * استخراج رابط المنتج
     * @param {Element} element عنصر HTML للمنتج
     * @returns {string} رابط المنتج
     */
    extractProductUrl(element) {
        const link = element.querySelector('a[href]');
        return link ? link.href : '';
    }

    /**
     * استخراج المنتجات من طلبات
     * @param {string} storeUrl رابط المتجر
     * @returns {Promise<Array>} قائمة المنتجات
     */
    async extractFromTalabat(storeUrl) {
        try {
            // طلبات يتطلب التعامل مع JavaScript rendering
            // لذلك نحتاج لاستخدام puppeteer أو selenium
            console.warn('استخراج طلبات يتطلب خادم backend مع puppeteer');
            
            // عرض رسالة للمستخدم
            throw new Error('استخراج منتجات طلبات يتطلب إعداد خادم backend مخصص');
            
        } catch (error) {
            console.error('خطأ في استخراج منتجات طلبات:', error);
            throw error;
        }
    }

    /**
     * معالجة أخطاء الشبكة والCORS
     * @param {string} url الرابط المطلوب
     * @returns {Promise<Response>} استجابة الطلب
     */
    async handleCORSRequest(url) {
        // قائمة بـ CORS proxies
        const corsProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://cors.bridged.cc/',
            'https://yacdn.org/proxy/'
        ];

        for (const proxy of corsProxies) {
            try {
                const response = await fetch(proxy + url, {
                    headers: this.headers,
                    method: 'GET'
                });
                
                if (response.ok) {
                    return response;
                }
            } catch (error) {
                console.warn(`فشل Proxy ${proxy}:`, error);
                continue;
            }
        }

        throw new Error('فشل في جميع محاولات تجاوز CORS');
    }

    /**
     * حفظ البيانات محلياً
     * @param {Array} products قائمة المنتجات
     * @param {string} storeName اسم المتجر
     */
    saveToLocalStorage(products, storeName) {
        const data = {
            products,
            storeName,
            extractedAt: new Date().toISOString(),
            totalCount: products.length,
            availableCount: products.filter(p => p.status === 'متوفر').length
        };
        
        localStorage.setItem(`wholesale_data_${storeName}`, JSON.stringify(data));
    }

    /**
     * تحميل البيانات من التخزين المحلي
     * @param {string} storeName اسم المتجر
     * @returns {Object|null} البيانات المحفوظة
     */
    loadFromLocalStorage(storeName) {
        const data = localStorage.getItem(`wholesale_data_${storeName}`);
        return data ? JSON.parse(data) : null;
    }
}

// تصدير الكلاس للاستخدام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealAPIIntegration;
} else if (typeof window !== 'undefined') {
    window.RealAPIIntegration = RealAPIIntegration;
}

// مثال على الاستخدام:
/*
const apiIntegration = new RealAPIIntegration();

// استخراج من سوق الجملة
apiIntegration.extractFromSouqGomla('https://souqgomlaa.almatjar.store/ar/shop')
    .then(products => {
        console.log('تم استخراج', products.length, 'منتج');
        apiIntegration.saveToLocalStorage(products, 'souq_gomla');
    })
    .catch(error => {
        console.error('خطأ:', error);
    });
*/