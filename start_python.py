#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكريبت تشغيل سريع لاستخراج منتجات سوق الجملة باستخدام Python
"""

import os
import sys
import subprocess

def check_dependencies():
    """تحقق من وجود المتطلبات"""
    required_packages = ['requests', 'beautifulsoup4']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def install_packages(packages):
    """تثبيت الحزم الناقصة"""
    for package in packages:
        print(f"📦 جاري تثبيت {package}...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ تم تثبيت {package} بنجاح")
        except subprocess.CalledProcessError:
            print(f"⚠️ فشل في تثبيت {package}")
            return False
    return True

def main():
    print("🚀 بدء تشغيل مستخرج منتجات سوق الجملة (Python)")
    print("=" * 60)
    
    # تحقق من وجود ملف extractor.py
    if not os.path.exists('extractor.py'):
        print("⚠️ ملف extractor.py غير موجود في المجلد الحالي")
        return
    
    # تحقق من المتطلبات
    missing = check_dependencies()
    
    if missing:
        print(f"📦 الحزم الناقصة: {', '.join(missing)}")
        install_choice = input("هل تريد تثبيتها تلقائياً? (y/n): ").strip().lower()
        
        if install_choice in ['y', 'yes', 'نعم']:
            if not install_packages(missing):
                print("⚠️ فشل في تثبيت بعض الحزم")
                return
        else:
            print("⚠️ يجب تثبيت المتطلبات أولاً")
            return
    
    print("✅ جميع المتطلبات متوفرة!")
    print("🚀 جاري تشغيل التطبيق...")
    print("=" * 60)
    
    # تشغيل التطبيق
    try:
        subprocess.run([sys.executable, 'extractor.py'], check=True)
    except subprocess.CalledProcessError:
        print("⚠️ خطأ في تشغيل التطبيق")
    except KeyboardInterrupt:
        print("
🔴 تم إيقاف التطبيق بواسطة المستخدم")

if __name__ == "__main__":
    main()