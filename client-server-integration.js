// client-server-integration.js - دمج الموقع مع الخادم
// أضف هذا الكود في نهاية script.js أو في ملف منفصل

// تحديث فئة WholesaleProductExtractor لتعمل مع الخادم
class EnhancedWholesaleProductExtractor extends WholesaleProductExtractor {
    constructor() {
        super();
        this.serverUrl = this.detectServerUrl();
    }

    detectServerUrl() {
        // البحث عن الخادم المحلي أو استخدام الرابط الحالي
        const currentHost = window.location.host;
        if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
            return `http://${currentHost}`;
        }
        return window.location.origin;
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
            // محاولة استخدام الخادم أولاً
            if (await this.isServerAvailable()) {
                await this.extractWithServer(url);
            } else {
                // إذا لم يكن الخادم متاحاً، استخدم الطريقة القديمة
                this.showStatus('الخادم غير متاح. جاري استخدام الاستخراج المحلي...', 'info');
                await this.fallbackExtraction(url);
            }
            
            if (this.products.length > 0) {
                this.showProgress(100);
                this.showStatus(`تم استخراج ${this.products.length} منتج بنجاح!`, 'success');
                this.displayResults();
            } else {
                this.showStatus('لم يتم العثور على منتجات. تحقق من الرابط أو استخدم الخادم.', 'error');
            }
            
        } catch (error) {
            console.error('خطأ في الاستخراج:', error);
            this.showStatus(`خطأ في الاستخراج: ${error.message}`, 'error');
            
            // عرض بيانات تجريبية في حالة الفشل
            this.showStatus('جاري عرض بيانات تجريبية...', 'info');
            await this.loadDemoData();
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = '🔍 استخراج المنتجات';
            setTimeout(() => this.showProgress(0), 1000);
        }
    }

    async isServerAvailable() {
        try {
            const response = await fetch(`${this.serverUrl}/api/health`, {
                method: 'GET',
                timeout: 3000
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async extractWithServer(url) {
        this.showProgress(30);
        this.showStatus('جاري الاتصال بالخادم...', 'info');
        
        const response = await fetch(`${this.serverUrl}/api/extract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                method: 'puppeteer' // أو 'axios' حسب التفضيل
            })
        });

        if (!response.ok) {
            throw new Error(`خطأ في الخادم: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.products) {
            this.products = data.products;
            this.filteredProducts = [...this.products];
        } else {
            throw new Error(data.error || 'فشل في استخراج البيانات');
        }
    }

    async fallbackExtraction(url) {
        // استخدام الطريقة القديمة (من script.js الأصلي)
        this.showProgress(50);
        this.showStatus('جاري المحاولة بالطرق البديلة...', 'info');
        
        try {
            if (url.includes('souqgomlaa.almatjar.store')) {
                await this.extractFromSouqGomla(url);
            } else {
                throw new Error('هذا الموقع يتطلب خادم backend');
            }
        } catch (error) {
            console.warn('فشلت الطريقة البديلة:', error);
            await this.loadDemoData();
        }
    }
}

// تحديث المتغير العام لاستخدام الفئة المحدثة
if (typeof window !== 'undefined') {
    // استبدال الفئة القديمة بالجديدة
    document.addEventListener('DOMContentLoaded', () => {
        new EnhancedWholesaleProductExtractor();
    });
}