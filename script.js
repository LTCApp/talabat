// تحديث script.js للاستخراج الحقيقي
class WholesaleProductExtractor {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.isExtractingReal = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showStatus('جاهز للاستخراج. اختر المتجر واضغط "استخراج المنتجات"', 'info');
    }

    bindEvents() {
        const storeSelect = document.getElementById('storeSelect');
        const customUrl = document.getElementById('customUrl');
        const extractBtn = document.getElementById('extractBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        const searchFilter = document.getElementById('searchFilter');
        const statusFilter = document.getElementById('statusFilter');

        storeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customUrl.style.display = 'block';
                customUrl.focus();
            } else {
                customUrl.style.display = 'none';
            }
        });

        extractBtn.addEventListener('click', () => this.extractProducts());
        exportBtn.addEventListener('click', () => this.exportData());
        clearBtn.addEventListener('click', () => this.clearData());
        searchFilter.addEventListener('input', () => this.applyFilters());
        statusFilter.addEventListener('change', () => this.applyFilters());
    }

    showStatus(message, type = 'info') {
        const status = document.getElementById('status');
        status.className = `status ${type}`;
        status.textContent = message;
        status.classList.remove('hidden');
    }

    showProgress(percentage) {
        const progress = document.getElementById('progress');
        const progressBar = progress.querySelector('.progress-bar');
        
        if (percentage === 0) {
            progress.classList.add('hidden');
        } else {
            progress.classList.remove('hidden');
            progressBar.style.width = `${percentage}%`;
        }
    }

    async extractProducts() {
        const storeSelect = document.getElementById('storeSelect');
        const customUrl = document.getElementById('customUrl');
        const extractBtn = document.getElementById('extractBtn');
        
        let url = storeSelect.value;
        if (url === 'custom') {
            url = customUrl.value.trim();
            if (!url) {
                this.showStatus('يرجى إدخال رابط صحيح', 'error');
                return;
            }
        }

        extractBtn.disabled = true;
        extractBtn.textContent = '⏳ جاري الاستخراج...';
        
        this.showStatus('بدء عملية استخراج المنتجات الحقيقية...', 'info');
        this.showProgress(10);

        try {
            // تحديد نوع الموقع
            if (url.includes('souqgomlaa.almatjar.store')) {
                await this.extractFromSouqGomla(url);
            } else if (url.includes('talabat.com')) {
                await this.extractFromTalabat(url);
            } else {
                await this.extractFromGenericSite(url);
            }
            
            if (this.products.length > 0) {
                this.showProgress(100);
                this.showStatus(`تم استخراج ${this.products.length} منتج بنجاح!`, 'success');
                this.displayResults();
            } else {
                this.showStatus('لم يتم العثور على منتجات. تحقق من الرابط أو جرب رابطاً آخر.', 'error');
            }
            
        } catch (error) {
            console.error('خطأ في الاستخراج:', error);
            this.showStatus(`خطأ في الاستخراج: ${error.message}`, 'error');
            
            // في حالة فشل الاستخراج، عرض البيانات التجريبية
            this.showStatus('تعذر الاستخراج المباشر. جاري عرض بيانات تجريبية...', 'info');
            await this.loadDemoData();
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = '🔍 استخراج المنتجات';
            setTimeout(() => this.showProgress(0), 1000);
        }
    }

    // استخراج من سوق الجملة الحقيقي
    async extractFromSouqGomla(url) {
        this.showProgress(20);
        this.showStatus('جاري الاتصال بسوق الجملة...', 'info');
        
        try {
            // محاولة استخدام طرق مختلفة للاستخراج
            const methods = [
                () => this.corsProxyExtract(url),
                () => this.directFetch(url),
                () => this.jsonpExtract(url)
            ];

            for (let i = 0; i < methods.length; i++) {
                try {
                    this.showProgress(30 + (i * 20));
                    this.showStatus(`جاري تجربة طريقة الاستخراج ${i + 1}...`, 'info');
                    
                    const html = await methods[i]();
                    if (html) {
                        this.products = this.parseSouqGomlaHTML(html);
                        if (this.products.length > 0) {
                            this.filteredProducts = [...this.products];
                            return;
                        }
                    }
                } catch (error) {
                    console.warn(`فشلت طريقة ${i + 1}:`, error);
                    continue;
                }
            }
            
            throw new Error('فشل في جميع طرق الاستخراج');
            
        } catch (error) {
            console.error('خطأ في استخراج سوق الجملة:', error);
            throw new Error('تعذر الوصول إلى سوق الجملة. قد يكون الموقع محمي أو يتطلب تسجيل دخول.');
        }
    }

    // طريقة CORS Proxy
    async corsProxyExtract(url) {
        const proxies = [
            'https://api.allorigins.win/get?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.codetabs.com/v1/proxy?quest='
        ];

        for (const proxy of proxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(url), {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/html',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.contents || data.data || data;
                }
            } catch (error) {
                console.warn(`فشل Proxy ${proxy}:`, error);
                continue;
            }
        }
        throw new Error('فشل في جميع CORS proxies');
    }

    // طريقة Fetch مباشرة
    async directFetch(url) {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (compatible; ProductExtractor/1.0)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.text();
    }

    // طريقة JSONP (للمواقع التي تدعمها)
    async jsonpExtract(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const callbackName = 'jsonp_callback_' + Date.now();
            
            window[callbackName] = (data) => {
                document.head.removeChild(script);
                delete window[callbackName];
                resolve(data);
            };
            
            script.onerror = () => {
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('JSONP request failed'));
            };
            
            script.src = `${url}?callback=${callbackName}`;
            document.head.appendChild(script);
            
            // timeout بعد 10 ثوان
            setTimeout(() => {
                if (window[callbackName]) {
                    document.head.removeChild(script);
                    delete window[callbackName];
                    reject(new Error('JSONP timeout'));
                }
            }, 10000);
        });
    }

    // تحليل HTML واستخراج المنتجات
    parseSouqGomlaHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const products = [];

        // البحث عن عناصر المنتجات بطرق مختلفة
        const selectors = [
            '.product-item',
            '.product',
            '.item',
            '[data-product]',
            '.card',
            '.product-card'
        ];

        let productElements = [];
        for (const selector of selectors) {
            productElements = doc.querySelectorAll(selector);
            if (productElements.length > 0) break;
        }

        // إذا لم نجد عناصر محددة، نبحث في script tags للبيانات
        if (productElements.length === 0) {
            const scripts = doc.querySelectorAll('script');
            for (const script of scripts) {
                const text = script.textContent;
                if (text.includes('product') && text.includes('price')) {
                    try {
                        // محاولة استخراج JSON من JavaScript
                        const jsonMatch = text.match(/products\s*[:=]\s*(\[.*?\])/s);
                        if (jsonMatch) {
                            const productsData = JSON.parse(jsonMatch[1]);
                            return this.formatProductsFromJSON(productsData);
                        }
                    } catch (e) {
                        console.warn('فشل في تحليل JSON من script:', e);
                    }
                }
            }
        }

        // استخراج المنتجات من العناصر
        productElements.forEach((element, index) => {
            try {
                const product = this.extractProductFromElement(element, index);
                if (product && product.name && product.code) {
                    products.push(product);
                }
            } catch (error) {
                console.warn(`خطأ في استخراج المنتج ${index}:`, error);
            }
        });

        return products;
    }

    extractProductFromElement(element, index) {
        // استخراج الكود
        const code = this.extractText(element, [
            '[data-product-id]',
            '.product-id',
            '.sku',
            '.code'
        ]) || `PROD_${Date.now()}_${index}`;

        // استخراج الاسم
        const name = this.extractText(element, [
            '.product-title',
            '.product-name',
            'h2', 'h3', 'h4',
            '.title',
            '.name'
        ]);

        // استخراج السعر
        const priceText = this.extractText(element, [
            '.price',
            '.product-price',
            '.cost',
            '[data-price]'
        ]);
        const price = this.extractPrice(priceText);

        // استخراج الصورة
        const image = this.extractImage(element);

        // استخراج حالة التوفر
        const status = this.extractStatus(element);

        return {
            code,
            name: name || 'منتج غير محدد',
            image,
            price,
            currency: 'جنيه',
            status,
            extractedAt: new Date().toISOString()
        };
    }

    extractText(element, selectors) {
        for (const selector of selectors) {
            const el = element.querySelector(selector);
            if (el) {
                return el.textContent.trim() || el.getAttribute('data-product-id') || el.getAttribute('content');
            }
        }
        return null;
    }

    extractPrice(priceText) {
        if (!priceText) return 0;
        const match = priceText.match(/([\d,]+\.?\d*)/);
        return match ? parseFloat(match[1].replace(',', '')) : 0;
    }

    extractImage(element) {
        const img = element.querySelector('img');
        if (img) {
            const src = img.getAttribute('data-src') || img.getAttribute('src');
            if (src && !src.includes('loader.svg')) {
                return src.startsWith('http') ? src : 'https:' + src;
            }
        }
        return 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة';
    }

    extractStatus(element) {
        const text = element.textContent.toLowerCase();
        if (text.includes('غير متوفر') || text.includes('نفدت') || text.includes('out of stock')) {
            return 'غير متوفر';
        }
        return 'متوفر';
    }

    formatProductsFromJSON(productsData) {
        return productsData.map((item, index) => ({
            code: item.id || item.sku || item.code || `JSON_${index}`,
            name: item.name || item.title || 'منتج من JSON',
            image: item.image || item.thumbnail || 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
            price: parseFloat(item.price) || 0,
            currency: 'جنيه',
            status: item.stock > 0 ? 'متوفر' : 'غير متوفر',
            extractedAt: new Date().toISOString()
        }));
    }

    // استخراج من طلبات (يتطلب معالجة خاصة)
    async extractFromTalabat(url) {
        this.showProgress(25);
        this.showStatus('طلبات يتطلب معالجة خاصة...', 'info');
        
        // طلبات يحتاج JavaScript rendering
        throw new Error('استخراج طلبات يتطلب خادم backend مع Puppeteer أو Selenium. استخدم الخيار البديل أدناه.');
    }

    // استخراج عام للمواقع الأخرى
    async extractFromGenericSite(url) {
        this.showProgress(30);
        this.showStatus('جاري تحليل الموقع...', 'info');
        
        try {
            const html = await this.corsProxyExtract(url);
            this.products = this.parseGenericHTML(html);
            this.filteredProducts = [...this.products];
        } catch (error) {
            throw new Error('تعذر استخراج البيانات من هذا الموقع. قد يحتاج لمعالجة خاصة.');
        }
    }

    parseGenericHTML(html) {
        // تحليل عام للمواقع
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const products = [];

        // البحث عن أي عناصر تحتوي على أسعار
        const priceElements = doc.querySelectorAll('*');
        const potentialProducts = [];

        priceElements.forEach(el => {
            const text = el.textContent;
            if (text.match(/\d+\s*(جنيه|ريال|درهم|دولار)/) || text.match(/\$\d+/) || text.match(/\d+\.\d\d/)) {
                potentialProducts.push(el.closest('div, article, section, li') || el);
            }
        });

        // استخراج المنتجات المحتملة
        potentialProducts.slice(0, 20).forEach((element, index) => {
            const product = this.extractProductFromElement(element, index);
            if (product.name && product.price > 0) {
                products.push(product);
            }
        });

        return products;
    }

    // تحميل بيانات تجريبية في حالة فشل الاستخراج
    async loadDemoData() {
        this.showProgress(60);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.products = this.getDemoProducts();
        this.filteredProducts = [...this.products];
        this.displayResults();
        
        this.showStatus('تم عرض بيانات تجريبية. لاستخراج حقيقي، استخدم الخادم المرفق.', 'info');
    }

    getDemoProducts() {
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
            },
            {
                code: '2987',
                name: 'عرض ( ساعة تاتش دائرية أسود + محفظة رجالي + سماعة بلوتوث مغناطيسية)',
                image: 'https://tager-uploads.s3.eu-central-1.amazonaws.com/0c0fd9c4-7a33-4b61-97c6-f8dbab8b791d.jpg',
                price: 170,
                currency: 'جنيه',
                status: 'متوفر'
            },
            {
                code: '2992',
                name: 'عرض 5 قطع اعواد تسليك الاحواض العجيبة',
                image: 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
                price: 150,
                currency: 'جنيه',
                status: 'غير متوفر'
            }
        ];
    }

    displayResults() {
        const resultsHeader = document.querySelector('.results-header');
        const filterSection = document.querySelector('.filter-section');
        const productsTable = document.getElementById('productsTable');
        const exportBtn = document.getElementById('exportBtn');

        resultsHeader.classList.remove('hidden');
        filterSection.classList.remove('hidden');
        productsTable.classList.remove('hidden');
        exportBtn.disabled = false;

        this.updateSummary();
        this.renderTable();
    }

    updateSummary() {
        const totalCount = document.getElementById('totalCount');
        const availableCount = document.getElementById('availableCount');
        const unavailableCount = document.getElementById('unavailableCount');

        const available = this.products.filter(p => p.status === 'متوفر').length;
        const unavailable = this.products.filter(p => p.status === 'غير متوفر').length;

        totalCount.textContent = this.products.length;
        availableCount.textContent = available;
        unavailableCount.textContent = unavailable;
    }

    renderTable() {
        const productsTable = document.getElementById('productsTable');
        
        const tableHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>رقم المنتج</th>
                            <th>كود المنتج</th>
                            <th>صورة المنتج</th>
                            <th>اسم المنتج</th>
                            <th>السعر</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredProducts.map((product, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td><span class="product-code">${product.code}</span></td>
                                <td>
                                    <img src="${product.image}" alt="${product.name}" class="product-image" 
                                         onerror="this.src='https://via.placeholder.com/60x60/f0f0f0/999?text=لا+توجد'">
                                </td>
                                <td class="product-name">${product.name}</td>
                                <td class="product-price">${product.price} ${product.currency}</td>
                                <td>
                                    <span class="status-badge ${product.status === 'متوفر' ? 'status-available' : 'status-unavailable'}">
                                        ${product.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        productsTable.innerHTML = tableHTML;
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                product.code.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusFilter === 'all' || 
                                (statusFilter === 'available' && product.status === 'متوفر') ||
                                (statusFilter === 'unavailable' && product.status === 'غير متوفر');
            
            return matchesSearch && matchesStatus;
        });

        this.renderTable();
    }

    exportData() {
        if (this.products.length === 0) {
            this.showStatus('لا توجد بيانات للتصدير', 'error');
            return;
        }

        const csvData = this.convertToCSV();
        this.downloadFile(csvData, 'wholesale_products.csv', 'text/csv');
        
        const jsonData = JSON.stringify(this.products, null, 2);
        this.downloadFile(jsonData, 'wholesale_products.json', 'application/json');
        
        this.showStatus('تم تصدير البيانات بصيغتي CSV و JSON', 'success');
    }

    convertToCSV() {
        const headers = ['كود المنتج', 'اسم المنتج', 'السعر', 'العملة', 'الحالة', 'رابط الصورة'];
        const rows = this.products.map(product => [
            product.code,
            `"${product.name}"`,
            product.price,
            product.currency,
            product.status,
            product.image
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
            this.products = [];
            this.filteredProducts = [];
            
            document.querySelector('.results-header').classList.add('hidden');
            document.querySelector('.filter-section').classList.add('hidden');
            document.getElementById('productsTable').classList.add('hidden');
            document.getElementById('exportBtn').disabled = true;
            document.getElementById('status').classList.add('hidden');
            
            this.showStatus('تم مسح جميع البيانات', 'info');
        }
    }
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', () => {
    new WholesaleProductExtractor();
});