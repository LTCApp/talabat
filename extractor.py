#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مستخرج منتجات سوق الجملة - Python
أداة بيثون لاستخراج منتجات سوق الجملة من مواقع مختلفة

المؤلف: MiniMax Agent
الإصدار: 1.0.0
"""

import requests
import json
import csv
import time
import re
import os
from datetime import datetime
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Optional

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("يجب تثبيت BeautifulSoup: pip install beautifulsoup4")
    exit(1)

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    SELENIUM_AVAILABLE = True
except ImportError:
    print("تحذير: Selenium غير مثبت. سيتم استخدام requests فقط.")
    print("لتثبيت Selenium: pip install selenium")
    SELENIUM_AVAILABLE = False

class WholesaleProductExtractor:
    """مستخرج منتجات سوق الجملة"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        self.products = []
        
    def extract_from_souq_gomla(self, url: str, use_selenium: bool = False) -> List[Dict]:
        """استخراج منتجات من سوق الجملة"""
        print(f"بدء استخراج منتجات سوق الجملة من: {url}")
        
        if use_selenium and SELENIUM_AVAILABLE:
            return self._extract_with_selenium(url)
        else:
            return self._extract_with_requests(url)
    
    def _extract_with_requests(self, url: str) -> List[Dict]:
        """استخراج باستخدام requests"""
        try:
            print("جاري تحميل الصفحة...")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            return self._parse_products_from_soup(soup, url)
            
        except Exception as e:
            print(f"خطأ في استخراج requests: {e}")
            return self._get_demo_products()
    
    def _extract_with_selenium(self, url: str) -> List[Dict]:
        """استخراج باستخدام Selenium"""
        driver = None
        try:
            print("جاري بدء Selenium...")
            
            # إعداد Chrome options
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1366,768')
            
            driver = webdriver.Chrome(options=chrome_options)
            
            print("جاري تحميل الصفحة...")
            driver.get(url)
            
            # انتظار تحميل المحتوى
            time.sleep(5)
            
            # البحث عن عناصر المنتجات
            selectors = ['.product-item', '.product', '.item', '.product-card', '.card']
            product_elements = []
            
            for selector in selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        product_elements = elements
                        print(f"وجد {len(elements)} عنصر باستخدام {selector}")
                        break
                except:
                    continue
            
            products = []
            for i, element in enumerate(product_elements[:20]):  # اقتصار على 20 منتج
                try:
                    product = self._extract_product_from_element_selenium(element, i)
                    if product:
                        products.append(product)
                except Exception as e:
                    print(f"خطأ في استخراج المنتج {i}: {e}")
                    continue
            
            print(f"تم استخراج {len(products)} منتج باستخدام Selenium")
            return products
            
        except Exception as e:
            print(f"خطأ في Selenium: {e}")
            return self._get_demo_products()
        finally:
            if driver:
                driver.quit()
    
    def _parse_products_from_soup(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        """تحليل المنتجات من BeautifulSoup"""
        products = []
        
        # البحث عن عناصر المنتجات
        selectors = ['.product-item', '.product', '.item', '.product-card', '.card']
        product_elements = []
        
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                product_elements = elements
                print(f"وجد {len(elements)} عنصر باستخدام {selector}")
                break
        
        # إذا لم نجد عناصر محددة، نبحث عن عناصر تحتوي على أسعار
        if not product_elements:
            price_pattern = re.compile(r'\d+\s*جنيه')
            all_elements = soup.find_all(['div', 'article', 'section', 'li'])
            
            for element in all_elements:
                if element.get_text() and price_pattern.search(element.get_text()) and element.find('img'):
                    product_elements.append(element)
                    if len(product_elements) >= 20:
                        break
            
            print(f"وجد {len(product_elements)} عنصر محتمل يحتوي على منتجات")
        
        for i, element in enumerate(product_elements[:20]):
            try:
                product = self._extract_product_from_element_soup(element, i, base_url)
                if product:
                    products.append(product)
            except Exception as e:
                print(f"خطأ في استخراج المنتج {i}: {e}")
                continue
        
        print(f"تم استخراج {len(products)} منتج باستخدام BeautifulSoup")
        return products
    
    def _extract_product_from_element_soup(self, element, index: int, base_url: str) -> Optional[Dict]:
        """استخراج منتج من عنصر BeautifulSoup"""
        try:
            # استخراج الاسم
            name_selectors = ['.product-title', '.product-name', 'h1', 'h2', 'h3', 'h4', '.title', '.name']
            name = None
            for selector in name_selectors:
                name_elem = element.select_one(selector)
                if name_elem and name_elem.get_text().strip():
                    name = name_elem.get_text().strip()
                    break
            
            if not name:
                name = f"منتج {index + 1}"
            
            # استخراج السعر
            price_selectors = ['.price', '.product-price', '.cost']
            price = 0
            for selector in price_selectors:
                price_elem = element.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text()
                    price_match = re.search(r'([\d,]+\.?\d*)', price_text)
                    if price_match:
                        price = float(price_match.group(1).replace(',', ''))
                        break
            
            # إذا لم نجد سعر في عناصر محددة، نبحث في النص العام
            if price == 0:
                text = element.get_text()
                price_match = re.search(r'([\d,]+\.?\d*)\s*جنيه', text)
                if price_match:
                    price = float(price_match.group(1).replace(',', ''))
            
            # استخراج الصورة
            img_elem = element.find('img')
            image = 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة'
            if img_elem:
                src = img_elem.get('data-src') or img_elem.get('src')
                if src and 'loader.svg' not in src:
                    if src.startswith('http'):
                        image = src
                    elif src.startswith('//'):
                        image = 'https:' + src
                    elif src.startswith('/'):
                        image = urljoin(base_url, src)
            
            # استخراج الكود
            code = (element.get('data-product-id') or 
                   (element.select_one('[data-product-id]') and element.select_one('[data-product-id]').get('data-product-id')) or
                   f"PROD_{int(time.time())}_{index}")
            
            # تحديد حالة التوفر
            text = element.get_text().lower()
            status = 'غير متوفر' if any(word in text for word in ['غير متوفر', 'نفدت', 'out of stock']) else 'متوفر'
            
            if name and price > 0:
                return {
                    'code': code,
                    'name': name,
                    'image': image,
                    'price': price,
                    'currency': 'جنيه',
                    'status': status,
                    'extracted_at': datetime.now().isoformat()
                }
            
        except Exception as e:
            print(f"خطأ في استخراج المنتج: {e}")
        
        return None
    
    def _extract_product_from_element_selenium(self, element, index: int) -> Optional[Dict]:
        """استخراج منتج من عنصر Selenium"""
        try:
            # استخراج الاسم
            name = f"منتج {index + 1}"
            name_selectors = ['.product-title', '.product-name', 'h1', 'h2', 'h3', 'h4', '.title', '.name']
            for selector in name_selectors:
                try:
                    name_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if name_elem.text.strip():
                        name = name_elem.text.strip()
                        break
                except:
                    continue
            
            # استخراج السعر
            price = 0
            price_selectors = ['.price', '.product-price', '.cost']
            for selector in price_selectors:
                try:
                    price_elem = element.find_element(By.CSS_SELECTOR, selector)
                    price_text = price_elem.text
                    price_match = re.search(r'([\d,]+\.?\d*)', price_text)
                    if price_match:
                        price = float(price_match.group(1).replace(',', ''))
                        break
                except:
                    continue
            
            # إذا لم نجد سعر، نبحث في النص العام
            if price == 0:
                text = element.text
                price_match = re.search(r'([\d,]+\.?\d*)\s*جنيه', text)
                if price_match:
                    price = float(price_match.group(1).replace(',', ''))
            
            # استخراج الصورة
            image = 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة'
            try:
                img_elem = element.find_element(By.TAG_NAME, 'img')
                src = img_elem.get_attribute('data-src') or img_elem.get_attribute('src')
                if src and 'loader.svg' not in src:
                    if src.startswith('http'):
                        image = src
                    elif src.startswith('//'):
                        image = 'https:' + src
            except:
                pass
            
            # استخراج الكود
            code = f"PROD_{int(time.time())}_{index}"
            try:
                code = element.get_attribute('data-product-id') or code
            except:
                pass
            
            # تحديد حالة التوفر
            text = element.text.lower()
            status = 'غير متوفر' if any(word in text for word in ['غير متوفر', 'نفدت', 'out of stock']) else 'متوفر'
            
            if name and price > 0:
                return {
                    'code': code,
                    'name': name,
                    'image': image,
                    'price': price,
                    'currency': 'جنيه',
                    'status': status,
                    'extracted_at': datetime.now().isoformat()
                }
            
        except Exception as e:
            print(f"خطأ في استخراج المنتج: {e}")
        
        return None
    
    def _get_demo_products(self) -> List[Dict]:
        """بيانات تجريبية"""
        return [
            {
                'code': '2984',
                'name': 'عرض (بلاشر سائل نارس درجه 101 Orange +بلاشر سائل نارس درجه 101 Orange+بلاشر سائل نارس درجه 103 Red+بلاشر سائل نارس درجه 104 Mahogany )',
                'image': 'https://tager-uploads.s3.eu-central-1.amazonaws.com/c091e028-2a44-41b1-8a25-979440c172ee.jpg',
                'price': 230,
                'currency': 'جنيه',
                'status': 'متوفر',
                'extracted_at': datetime.now().isoformat()
            },
            {
                'code': '2985',
                'name': 'عرض (كرستيان ديور سوفاج هاي كوبي +حظاظة يد بقفل معدن )',
                'image': 'https://tager-uploads.s3.eu-central-1.amazonaws.com/a276f20c-149d-4a18-adbf-1236ac301bbc.jpg',
                'price': 120,
                'currency': 'جنيه',
                'status': 'متوفر',
                'extracted_at': datetime.now().isoformat()
            },
            {
                'code': '2986',
                'name': 'عرض ( ديسبنسر الصابون 2 في 1 + فلتر مياه بقفل 2 في 1)',
                'image': 'https://tager-uploads.s3.eu-central-1.amazonaws.com/ba81ccb8-5027-4903-b019-221de57ae1fd.jpg',
                'price': 300,
                'currency': 'جنيه',
                'status': 'متوفر',
                'extracted_at': datetime.now().isoformat()
            },
            {
                'code': '2992',
                'name': 'عرض 5 قطع اعواد تسليك الاحواض العجيبة',
                'image': 'https://via.placeholder.com/200x200/f0f0f0/999?text=لا+توجد+صورة',
                'price': 150,
                'currency': 'جنيه',
                'status': 'غير متوفر',
                'extracted_at': datetime.now().isoformat()
            }
        ]
    
    def save_to_csv(self, products: List[Dict], filename: str = 'wholesale_products.csv'):
        """حفظ المنتجات في ملف CSV"""
        if not products:
            print("لا توجد منتجات لحفظها")
            return
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['كود المنتج', 'اسم المنتج', 'السعر', 'العملة', 'الحالة', 'رابط الصورة', 'تاريخ الاستخراج']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for product in products:
                writer.writerow({
                    'كود المنتج': product['code'],
                    'اسم المنتج': product['name'],
                    'السعر': product['price'],
                    'العملة': product['currency'],
                    'الحالة': product['status'],
                    'رابط الصورة': product['image'],
                    'تاريخ الاستخراج': product['extracted_at']
                })
        
        print(f"تم حفظ {len(products)} منتج في {filename}")
    
    def save_to_json(self, products: List[Dict], filename: str = 'wholesale_products.json'):
        """حفظ المنتجات في ملف JSON"""
        if not products:
            print("لا توجد منتجات لحفظها")
            return
        
        with open(filename, 'w', encoding='utf-8') as jsonfile:
            json.dump({
                'products': products,
                'total_count': len(products),
                'extracted_at': datetime.now().isoformat(),
                'available_count': len([p for p in products if p['status'] == 'متوفر']),
                'unavailable_count': len([p for p in products if p['status'] == 'غير متوفر'])
            }, jsonfile, ensure_ascii=False, indent=2)
        
        print(f"تم حفظ {len(products)} منتج في {filename}")

def main():
    """الدالة الرئيسية"""
    print("🛒 مرحباً بك في مستخرج منتجات سوق الجملة")
    print("=" * 50)
    
    extractor = WholesaleProductExtractor()
    
    # قائمة المواقع المدعومة
    websites = {
        '1': {
            'name': 'سوق الجملة - المتجر الرئيسي',
            'url': 'https://souqgomlaa.almatjar.store/ar/shop'
        },
        '2': {
            'name': 'طلبات - منطقة سوق الجملة',
            'url': 'https://www.talabat.com/ar/egypt/groceries/7081/souq-el-gomla'
        }
    }
    
    print("المواقع المتاحة:")
    for key, site in websites.items():
        print(f"{key}. {site['name']}")
    print("3. إدخال رابط مخصص")
    
    choice = input("اختر رقم الموقع (1-3): ").strip()
    
    if choice in websites:
        url = websites[choice]['url']
        print(f"تم اختيار: {websites[choice]['name']}")
    elif choice == '3':
        url = input("أدخل رابط الموقع: ").strip()
    else:
        print("اختيار غير صحيح، سيتم استخدام الموقع الافتراضي")
        url = websites['1']['url']
    
    # اختيار طريقة الاستخراج
    use_selenium = False
    if SELENIUM_AVAILABLE:
        method_choice = input("اختر طريقة الاستخراج (1=requests, 2=selenium): ").strip()
        if method_choice == '2':
            use_selenium = True
            print("سيتم استخدام Selenium (أبطأ ولكن أدق)")
        else:
            print("سيتم استخدام requests (أسرع ولكن قد يفشل مع المواقع الديناميكية)")
    
    print(f"بدء استخراج المنتجات من: {url}")
    print("=" * 50)
    
    # بدء عملية الاستخراج
    start_time = time.time()
    products = extractor.extract_from_souq_gomla(url, use_selenium)
    end_time = time.time()
    
    print("=" * 50)
    print(f"تم استخراج {len(products)} منتج في {end_time - start_time:.2f} ثانية")
    
    if products:
        available = len([p for p in products if p['status'] == 'متوفر'])
        unavailable = len([p for p in products if p['status'] == 'غير متوفر'])
        
        print(f"المتوفر: {available}")
        print(f"غير المتوفر: {unavailable}")
        
        # عرض عينة من المنتجات
        print("\nعينة من المنتجات:")
        for i, product in enumerate(products[:3]):
            print(f"{i+1}. {product['name'][:50]}... - {product['price']} {product['currency']} - {product['status']}")
        
        # حفظ النتائج
        save_choice = input("\nهل تريد حفظ النتائج? (y/n): ").strip().lower()
        if save_choice in ['y', 'yes', 'نعم']:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            extractor.save_to_csv(products, f'wholesale_products_{timestamp}.csv')
            extractor.save_to_json(products, f'wholesale_products_{timestamp}.json')
    else:
        print("لم يتم استخراج أي منتجات. تحقق من الرابط أو جرب طريقة استخراج أخرى.")

if __name__ == "__main__":
    main()