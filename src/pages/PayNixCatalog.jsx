import React, { useState, useEffect } from 'react';

// 1. تعريف الأقسام الـ 11 الأساسية لشغل B.TECH
const CATEGORIES = [
  { id: 'mobiles', name: 'الموبايلات والتابلت', brands: ['Samsung', 'Apple', 'Oppo', 'Xiaomi', 'Realme'], basePrice: 9000 },
  { id: 'tv', name: 'الشاشات والإلكترونيات', brands: ['LG', 'Samsung', 'Toshiba', 'Sony', 'Sharp'], basePrice: 16000 },
  { id: 'laptops', name: 'الكمبيوتر واللاب توب', brands: ['Dell', 'HP', 'Lenovo', 'Asus', 'Apple'], basePrice: 30000 },
  { id: 'refrigerators', name: 'الثلاجات والديب فريزر', brands: ['Kiriazi', 'LG', 'Sharp', 'Beko', 'Toshiba'], basePrice: 24000 },
  { id: 'washers', name: 'الغسالات والمجففات', brands: ['Zanussi', 'LG', 'Samsung', 'Toshiba', 'Whirlpool'], basePrice: 15000 },
  { id: 'air-conditioners', name: 'التكييفات', brands: ['Carrier', 'Sharp', 'Gree', 'Unionaire', 'Tornado'], basePrice: 21000 },
  { id: 'kitchen', name: 'أجهزة المطبخ الصغيرة', brands: ['Black & Decker', 'Braun', 'Kenwood', 'Philips', 'Moulinex'], basePrice: 3500 },
  { id: 'personal-care', name: 'العناية الشخصية', brands: ['Braun', 'Philips', 'Babyliss', 'Panasonic'], basePrice: 1800 },
  { id: 'home-appliances', name: 'المكنسة والمكواة والدفايات', brands: ['Philips', 'Panasonic', 'Tornado', 'Rowenta'], basePrice: 4500 },
  { id: 'gaming', name: 'الألعاب والـ Gaming', brands: ['Sony PlayStation', 'Microsoft Xbox', 'Nintendo'], basePrice: 26000 },
  { id: 'accessories', name: 'الإكسسوارات والساعات الذكية', brands: ['Oraimo', 'Anker', 'Apple', 'Samsung', 'Xiaomi'], basePrice: 2500 }
];

// 2. دالة توليد 2,000 منتج لكل قسم من الأقسام الـ 11 (إجمالي 22,000 منتج)
const generatePerfectCatalog = () => {
  const products = [];
  let globalId = 1;
  const itemsPerCategory = 2000; // 2000 منتج لكل قسم

  CATEGORIES.forEach((category) => {
    for (let i = 1; i <= itemsPerCategory; i++) {
      const brand = category.brands[i % category.brands.length];
      
      // معامل تغير السعر لتوليد أسعار متنوعة ومنطقية لكل منتج في نفس القسم
      const priceModifier = 0.6 + ((i * 7) % 150) * 0.02; 
      const price = Math.round((category.basePrice * priceModifier) / 50) * 50; // تقريب لأقرب 50 جنيه
      
      // منطق حسابات الأقساط لـ PayNix
      const allowInstallment = price > 2000; 
      const minDownPayment = allowInstallment ? Math.round((price * 0.1) / 10) * 10 : price; // مقدم 10%
      const remainingAmount = price - minDownPayment;
      
      // فوائد افتراضية للتقسيط (24 شهر و 36 شهر)
      const m24 = allowInstallment ? Math.round((remainingAmount * 1.35) / 24) : 0; 
      const m36 = allowInstallment ? Math.round((remainingAmount * 1.50) / 36) : 0;

      products.push({
        id: globalId,
        productIndex: i, // ترتيب المنتج داخل قسمه الخاص
        title: `${category.name.slice(0, -1)} ${brand} - موديل رقم ${i}`,
        category: category.name,
        categoryId: category.id,
        brand: brand,
        price: price,
        currency: "ج.م",
        stock: (i % 20) + 1,
        image: `https://picsum.photos/id/${(globalId % 100) + 1}/300/200`, // صور متغيرة سريعة التحميل
        description: `منتج أصلي ومميز من ماركة ${brand} مدرج تحت فئة ${category.name}. متوافق تماماً مع حاسبة التمويل الاستهلاكي الفوري لمنصة PayNix.`,
        installment: {
          allow: allowInstallment,
          downPayment: minDownPayment,
          m24: m24,
          m36: m36
        }
      });
      globalId++;
    }
  });

  return products;
};

// تشغيل التوليد في الخلفية مرة واحدة
const ALL_PRODUCTS = generatePerfectCatalog();

export default function PayNixCatalog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24; // عرض 24 منتج في الشبكة ليكون التوزيع متناسقاً (4 في كل صف)

  // تصفية المنتجات بناءً على القسم المختار
  const filteredProducts = selectedCategory === 'all' 
    ? ALL_PRODUCTS 
    : ALL_PRODUCTS.filter(p => p.categoryId === selectedCategory);

  // حسابات الـ Pagination لتجنب حمل المتصفح
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1); // العودة للصفحة الأولى دائماً عند تبديل الأقسام
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', direction: 'rtl', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      
      {/* رأس الكتالوج */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0f172a', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '26px', fontWeight: '800' }}>لوحة كتالوج PayNix المحدثة</h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px' }}>هيكلة دقيقة محاكية لنظام B.TECH (11 قسم متساوي × 2,000 منتج لكل قسم)</p>
        </div>
        <div style={{ background: '#e67e22', color: '#fff', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
          إجمالي المنتجات بالفئة: {filteredProducts.length.toLocaleString()}
        </div>
      </div>

      {/* شريط الأقسام الـ 11 المميز */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '25px', WebkitOverflowScrolling: 'touch' }}>
        <button 
          onClick={() => handleCategoryChange('all')}
          style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: selectedCategory === 'all' ? '#0f172a' : '#fff', color: selectedCategory === 'all' ? '#fff' : '#334155', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: '0.2s' }}
        >
          كل المعروض ({ALL_PRODUCTS.length.toLocaleString()})
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: selectedCategory === cat.id ? '#0f172a' : '#fff', color: selectedCategory === cat.id ? '#fff' : '#334155', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}
          >
            {cat.name} (2,000)
          </button>
        ))}
      </div>

      {/* شبكة عرض المنتجات الـ 24 في الصفحة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {currentProducts.map(product => (
          <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#0f172a', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>{product.category}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>#{product.productIndex} من 2000</span>
              </div>
              <img src={product.image} alt={product.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }} />
              <h3 style={{ fontSize: '15px', color: '#1e293b', margin: '12px 0 4px 0', height: '40px', overflow: 'hidden', fontWeight: 'bold' }}>{product.title}</h3>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>الماركة: {product.brand}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                {product.price.toLocaleString()} {product.currency}
              </div>
            </div>

            {/* تفاصيل حسابات الأقساط والمقدم لنظام التمويل */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }}>
              {product.installment.allow ? (
                <>
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>✓ تمويل استهلاكي معتمد</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>المقدم الحسابي: {product.installment.downPayment.toLocaleString()} ج.م</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>قسط 24 شهر: {product.installment.m24.toLocaleString()} ج.م</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>قسط 36 شهر: {product.installment.m36.toLocaleString()} ج.م</div>
                </>
              ) : (
                <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>✕ المنتج خارج شروط جدول الأقساط</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* أدوات التحكم بالصفحات للـ 22 ألف منتج */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '35px', paddingBottom: '20px' }}>
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: '500' }}
        >
          السابق
        </button>
        <span style={{ fontSize: '14px', color: '#334155', fontWeight: '600' }}>صفحة {currentPage} من {totalPages.toLocaleString()}</span>
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: '500' }}
        >
          التالي
        </button>
      </div>

    </div>
  );
   }

