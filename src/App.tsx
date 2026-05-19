import React, { useState } from 'react';

// 1. تعريف واجهة البيانات لـ PayNex
interface Product {
  id: number;
  title: string;
  category: string;
  categoryId: string;
  brand: string;
  price: number;
  currency: string;
  stock: number;
  image: string;
  description: string;
  installment: {
    allow: boolean;
    downPayment: number;
    m24: number;
  };
}

// 2. دالة التوليد التلقائي لـ 22,000 منتج في الذاكرة فوراً وموزعة على الـ 11 قسم لـ B.TECH
const generatePayNexProducts = (): Product[] => {
  const CATEGORIES = [
    { id: 'mobiles', name: 'الموبايلات والتابلت', brands: ['Samsung', 'Apple', 'Oppo', 'Xiaomi'], basePrice: 9000 },
    { id: 'tv', name: 'الشاشات والإلكترونيات', brands: ['LG', 'Samsung', 'Toshiba', 'Sony'], basePrice: 16000 },
    { id: 'laptops', name: 'الكمبيوتر واللاب توب', brands: ['Dell', 'HP', 'Lenovo', 'Asus'], basePrice: 30000 },
    { id: 'refrigerators', name: 'الثلاجات والديب فريزر', brands: ['Kiriazi', 'LG', 'Sharp', 'Beko'], basePrice: 24000 },
    { id: 'washers', name: 'الغسالات والمجففات', brands: ['Zanussi', 'LG', 'Samsung', 'Toshiba'], basePrice: 15000 },
    { id: 'air-conditioners', name: 'التكييفات', brands: ['Carrier', 'Sharp', 'Gree', 'Unionaire'], basePrice: 21000 },
    { id: 'kitchen', name: 'أجهزة المطبخ الصغيرة', brands: ['Braun', 'Kenwood', 'Philips', 'Moulinex'], basePrice: 3500 },
    { id: 'personal-care', name: 'العناية الشخصية', brands: ['Braun', 'Philips', 'Babyliss'], basePrice: 1800 },
    { id: 'home-appliances', name: 'المكنسة والمكواة والدفايات', brands: ['Philips', 'Panasonic', 'Tornado'], basePrice: 4500 },
    { id: 'gaming', name: 'الألعاب والـ Gaming', brands: ['Sony PlayStation', 'Microsoft Xbox'], basePrice: 26000 },
    { id: 'accessories', name: 'الإكسسوارات والساعات الذكية', brands: ['Oraimo', 'Anker', 'Apple', 'Samsung'], basePrice: 2500 }
  ];

  const productsList: Product[] = [];
  let globalId = 1;

  CATEGORIES.forEach((category) => {
    for (let i = 1; i <= 2000; i++) {
      const brand = category.brands[i % category.brands.length];
      const priceModifier = 0.6 + ((i * 7) % 150) * 0.02;
      const price = Math.round((category.basePrice * priceModifier) / 50) * 50;
      
      productsList.push({
        id: globalId,
        title: `${category.name.slice(0, -1)} ${brand} - موديل رقم ${i}`,
        category: category.name,
        categoryId: category.id,
        brand: brand,
        price: price,
        currency: "ج.م",
        stock: (i % 20) + 1,
        image: `https://picsum.photos/id/${(globalId % 100) + 1}/300/200`,
        description: `منتج متوافق مع نظام كارت الائتمان وحاسبة PayNex التمويلية.`,
        installment: {
          allow: price > 2000,
          downPayment: price > 2000 ? Math.round((price * 0.1) / 10) * 10 : price,
          m24: price > 2000 ? Math.round(((price - (price * 0.1)) * 1.35) / 24) : 0
        }
      });
      globalId++;
    }
  });

  return productsList;
};

export default function Dashboard() {
  // توليد المنتجات وحفظها في الـ State مباشرة
  const [products] = useState<Product[]>(generatePayNexProducts());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // الفلترة بناءً على القسم المختار والبحث
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // حسابات الـ Pagination لعرض المنتجات بشكل سريع ومريح للموبايل
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div style={{ padding: '15px', fontFamily: 'Segoe UI, Tahoma', direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* شريط البحث العلوي التفاعلي */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="بحث بالاسم أو العلامة التجارية..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* شريط الـ 11 قسم لـ B.TECH */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
        <button onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: selectedCategory === 'all' ? '#0f172a' : '#fff', color: selectedCategory === 'all' ? '#fff' : '#475569', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          كل المعروض ({products.length.toLocaleString()})
        </button>
        {['mobiles', 'tv', 'laptops', 'refrigerators', 'washers', 'air-conditioners', 'kitchen', 'personal-care', 'home-appliances', 'gaming', 'accessories'].map(catId => {
          const catName = products.find(p => p.categoryId === catId)?.category || catId;
          return (
            <button key={catId} onClick={() => { setSelectedCategory(catId); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: selectedCategory === catId ? '#0f172a' : '#fff', color: selectedCategory === catId ? '#fff' : '#475569', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {catName} (2,000)
            </button>
          );
        })}
      </div>

      {/* شبكة الإحصائيات الأربعة المطابقة تماماً لتصميم واجهتك الحالي */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb' }}>{filteredProducts.length.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>إجمالي المنتجات</div>
        </div>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a' }}>{filteredProducts.length.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>نشط</div>
        </div>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#475569' }}>0</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>مضاف يدوياً</div>
        </div>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#ea580c' }}>{selectedCategory !== 'all' ? '2,000' : '22,000'}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>BTech</div>
        </div>
      </div>

      {/* شبكة عرض بطاقات المنتجات المحدثة ديناميكياً */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {currentProducts.map(product => (
          <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <img src={product.image} alt={product.title} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }} />
              <h3 style={{ fontSize: '13px', color: '#1e293b', margin: '8px 0 4px 0', height: '36px', overflow: 'hidden', fontWeight: 'bold', lineHeight: '1.4' }}>{product.title}</h3>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>{product.price.toLocaleString()} {product.currency}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', fontSize: '11px', color: '#475569' }}>
              {product.installment.allow ? (
                <>
                  <div style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: '2px' }}>قسط شهري ذكي</div>
                  <div>قسط / 24 شهر: {product.installment.m24.toLocaleString()} ج.م</div>
                </>
              ) : (
                <div style={{ color: '#ef4444', fontWeight: 'bold' }}>كاش فقط</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* أزرار التنقل السفلي (Pagination) */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '25px', paddingBottom: '20px' }}>
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>السابق</button>
        <span style={{ fontSize: '13px', fontWeight: '600' }}>صفحة {currentPage} من {totalPages.toLocaleString()}</span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>التالي</button>
      </div>

    </div>
  );
}
