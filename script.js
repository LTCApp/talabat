class WholesaleProductExtractor {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSampleData();
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
        
        this.showStatus('بدء عملية استخراج المنتجات...', 'info');
        this.showProgress(20);

        try {
            // محاكاة عملية الاستخراج
            await this.simulateExtraction();
            
            this.showProgress(100);
            this.showStatus(`تم استخراج ${this.products.length} منتج بنجاح!`, 'success');
            
            this.displayResults();
            
        } catch (error) {
            console.error('خطأ في الاستخراج:', error);
            this.showStatus('حدث خطأ أثناء استخراج المنتجات', 'error');
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = '🔍 استخراج المنتجات';
            setTimeout(() => this.showProgress(0), 1000);
        }
    }

    async simulateExtraction() {
        // محاكاة تأخير الشبكة
        for (let i = 20; i <= 80; i += 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.showProgress(i);
        }
        
        // تحديث البيانات مع منتجات من البيانات الحقيقية
        this.products = this.getSampleProducts();
        this.filteredProducts = [...this.products];
    }

    getSampleProducts() {
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
                code: '2988',
                name: 'عرض (مشط رجالي لفرد الشعر و اللحية +ساعة تاتش دائرية أسود)',
                image: 'https://tager-uploads.s3.eu-central-1.amazonaws.com/9d17aa94-3f2e-4ad7-bb7c-192d7be54758.jpg',
                price: 240,
                currency: 'جنيه',
                status: 'متوفر'
            },
            {
                code: '2989',
                name: 'عرض 17 قطعة (عرض 12 قلم ليب لاينر ام ان +بلاشر دايموند 6 اللوان+هايلايت + برونزر باليت+بلاشر + هايلايتر باليت+عرض 10 فرش ميك اب+مكبر شفايف فيكتوريا سيكريت)',
                image: 'https://tager-uploads.s3.eu-central-1.amazonaws.com/0158a7cd-3d52-4585-9019-42ea83e789e3.jpg',
                price: 220,
                currency: 'جنيه',
                status: 'متوفر'
            },
            {
                code: '2990',
                name: 'عرض قطعتين درج الثلاجة العجيب',
                image: 'https://tager-uploads.s3.eu-central-1.amazonaws.com/fb3898c5-d8d1-46bd-a0e8-4375aafd85a2.jpg',
                price: 105,
                currency: 'جنيه',
                status: 'متوفر'
            },
            {
                code: '2991',
                name: 'عرض قطعتين كشاف طاقه شمسيه صغير',
                image: 'https://tager-uploads.s3.eu-central-1.amazonaws.com/cfb59642-ebf9-48ea-9127-c90f6ce571ed.jpg',
                price: 150,
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
            },
            {
                code: '2993',
                name: 'عرض قطعتين وصلة حنفية Turbo Flex 360',
                image: 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
                price: 170,
                currency: 'جنيه',
                status: 'غير متوفر'
            },
            {
                code: '2994',
                name: 'ساعة تاتش دائرية أسود + حظاظة يد بقفل معدن + عرض 3 تيشيرت ديجيتال صيفى',
                image: 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
                price: 180,
                currency: 'جنيه',
                status: 'متوفر'
            },
            {
                code: '2999',
                name: 'عرض ( منظم قعدة السيارة +منظم سيارة بUSB)',
                image: 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
                price: 220,
                currency: 'جنيه',
                status: 'متوفر'
            },
            {
                code: '3000',
                name: 'عرض شراب ركبة زحف للأطفال +جوانتى تسنين الاطفال',
                image: 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
                price: 160,
                currency: 'جنيه',
                status: 'متوفر'
            },
            {
                code: '3001',
                name: 'عرض (2 طقم شراب ركبة زحف للأطفال )',
                image: 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
                price: 115,
                currency: 'جنيه',
                status: 'متوفر'
            },
            {
                code: '3002',
                name: 'عرض (القلم الايلينر لاصق الرموش +عرض 3 قطع رموش 5D )',
                image: 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
                price: 170,
                currency: 'جنيه',
                status: 'متوفر'
            }
        ];
    }

    loadSampleData() {
        // تحميل بيانات تجريبية عند بدء التشغيل
        this.products = this.getSampleProducts();
        this.filteredProducts = [...this.products];
        this.displayResults();
        this.showStatus('تم تحميل بيانات تجريبية للعرض', 'info');
    }

    displayResults() {
        const resultsHeader = document.querySelector('.results-header');
        const filterSection = document.querySelector('.filter-section');
        const productsTable = document.getElementById('productsTable');
        const exportBtn = document.getElementById('exportBtn');

        // إظهار العناصر
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

        // تصدير CSV
        const csvData = this.convertToCSV();
        this.downloadFile(csvData, 'wholesale_products.csv', 'text/csv');
        
        // تصدير JSON
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
            
            // إخفاء النتائج
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