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

// 2. دالة التوليد التلقائي المحدثة بصور ذكية ومطابقة للأقسام
const generatePayNexProducts = (): Product[] => {
  const CATEGORIES = [
    { id: 'mobiles', name: 'الموبايلات والتابلت', brands: ['Samsung', 'Apple', 'Oppo', 'Xiaomi'], basePrice: 9000, imgKeyword: 'smartphone' },
    { id: 'tv', name: 'الشاشات والإلكترونيات', brands: ['LG', 'Samsung', 'Toshiba', 'Sony'], basePrice: 16000, imgKeyword: 'tv' },
    { id: 'laptops', name: 'الكمبيوتر واللاب توب', brands: ['Dell', 'HP', 'Lenovo', 'Asus'], basePrice: 30000, imgKeyword: 'laptop' },
    { id: 'refrigerators', name: 'الثلاجات والديب فريزر', brands: ['Kiriazi', 'LG', 'Sharp', 'Beko'], basePrice: 24000, imgKeyword: 'refrigerator' },
    { id: 'washers', name: 'الغسالات والمجففات', brands: ['Zanussi', 'LG', 'Samsung', 'Toshiba'], basePrice: 15000, imgKeyword: 'washing-machine' },
    { id: 'air-conditioners', name: 'التكييفات', brands: ['Carrier', 'Sharp', 'Gree', 'Unionaire'], basePrice: 21000, imgKeyword: 'air-conditioner' },
    { id: 'kitchen', name: 'أجهزة المطبخ الصغيرة', brands: ['Braun', 'Kenwood', 'Philips', 'Moulinex'], basePrice: 3500, imgKeyword: 'blender' },
    { id: 'personal-care', name: 'العناية الشخصية', brands: ['Braun', 'Philips', 'Babyliss'], basePrice: 1800, imgKeyword: 'shaver' },
    { id: 'home-appliances', name: 'المكنسة والمكواة والدفايات', brands: ['Philips', 'Panasonic', 'Tornado'], basePrice: 4500, imgKeyword: 'vacuum' },
    { id: 'gaming', name: 'الألعاب والـ Gaming', brands: ['Sony PlayStation', 'Microsoft Xbox'], basePrice: 26000, imgKeyword: 'console' },
    { id: 'accessories', name: 'الإكسسوارات والساعات الذكية', brands: ['Oraimo', 'Anker', 'Apple', 'Samsung'], basePrice: 2500, imgKeyword: 'smartwatch' }
  ];

  const productsList: Product[] = [];
  let globalId = 1;

  CATEGORIES.forEach((category) => {
    for (let i = 1; i <= 2000; i++) {
      const brand = category.brands[i % category.brands.length];
      const priceModifier = 0.6 + ((i * 7) % 150) * 0.02;
      const price = Math.round((category.basePrice * priceModifier) / 50) * 50;
      
      // هنا تم تعديل الرابط ليعتمد على الكلمات المفتاحية للقسم لضمان دقة الصور وتنوعها ديناميكياً
      const imageId = (i % 10) + 1;
      const imageUrl = `https://loremflickr.com/320/240/${category.imgKeyword}?lock=${imageId}`;
      
      productsList.push({
        id: globalId,
        title: `${category.name.slice(0, -1)} ${brand} - موديل رقم ${i}`,
        category: category.name,
        categoryId: category.id,
        brand: brand,
        price: price,
        currency: "ج.م",
        stock: (i % 20) + 1,
        image: imageUrl,
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

export default function App() {
  const [products] = useState<Product[]>(generatePayNexProducts());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const [calcPrice, setCalcPrice] = useState<number>(9000);
  const [calcMonths, setCalcMonths] = useState<number>(24);
  const calcDownPayment = Math.round(calcPrice * 0.1);
  const calcMonthlyInstallment = Math.round(((calcPrice - calcDownPayment) * (1 + (calcMonths * 0.015))) / calcMonths);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif', direction: 'rtl', backgroundColor: '#fdfdfd', minHeight: '100vh', margin: 0, padding: 0 }}>
      
      {/* هيدر PayNex العلوي */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#0a0f1d', color: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#00b4d8', width: '35px', height: '35px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>P</div>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>PayNex <span style={{ fontSize: '12px', color: '#00b4d8', verticalAlign: 'super' }}>Smart</span></span>
        </div>
        <button style={{ background: '#00b4d8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>كل الأقسام</button>
      </header>

      {/* البانر الرئيسي الإعلاني */}
      <div style={{ background: 'linear-gradient(135deg, #0a0f1d 0%, #072541 100%)', color: '#fff', padding: '40px 20px', textAlign: 'center', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <span style={{ background: 'rgba(0,180,216,0.2)', color: '#00b4d8', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>كارت التمويل الذكي</span>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '15px 0 10px 0', lineHeight: '1.3' }}>اشتري الآن وادفع<br/><span style={{ color: '#00b4d8' }}>واشحن بالأقساط</span></h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '400px', margin: '0 auto 25px auto', lineHeight: '1.5' }}>التمويل الذكي الذي تحتاج إليه، التمويل على القسيمة الأفضل، ودفع بالأقساط السهلة التي تلائم التزاماتك.</p>
        <button style={{ background: '#00b4d8', color: '#fff', border: 'none', width: '80%', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,180,216,0.3)', cursor: 'pointer' }}>احصل على كارتك</button>
      </div>

      {/* لوحة الإحصائيات السريعة */}
      <div style={{ padding: '0 15px', marginTop: '-20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#00b4d8' }}>22,000</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>إجمالي المنتجات</div>
          </div>
          <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>22,000</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>المتجر نشط</div>
          </div>
        </div>
      </div>

      {/* قسم التصفح والبحث */}
      <div style={{ padding: '25px 15px 10px 15px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '15px' }}>تصفح حسب الفئة</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="البحث السريع في 22,000 منتج من B.TECH..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '15px' }}>
          <button onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: '25px', border: 'none', background: selectedCategory === 'all' ? '#0a0f1d' : '#f1f5f9', color: selectedCategory === 'all' ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '13px' }}>
            كل المعروض (22,000)
          </button>
          {['mobiles', 'tv', 'laptops', 'refrigerators', 'washers', 'air-conditioners', 'kitchen', 'personal-care', 'home-appliances', 'gaming', 'accessories'].map(catId => {
            const catName = products.find(p => p.categoryId === catId)?.category || catId;
            return (
              <button key={catId} onClick={() => { setSelectedCategory(catId); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: '25px', border: 'none', background: selectedCategory === catId ? '#0a0f1d' : '#f1f5f9', color: selectedCategory === catId ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '13px' }}>
                {catName}
              </button>
            );
          })}
        </div>
      </div>

      {/* شبكة عرض المنتجات بالصور الصحيحة */}
      <div style={{ padding: '0 15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {currentProducts.map(product => (
            <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '10px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <img src={product.image} alt={product.title} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '12px', backgroundColor: '#f1f5f9' }} />
                <h3 style={{ fontSize: '12px', color: '#1e293b', margin: '8px 0 4px 0', height: '34px', overflow: 'hidden', fontWeight: 'bold', lineHeight: '1.4' }}>{product.title}</h3>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>{product.price.toLocaleString()} {product.currency}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '8px', fontSize: '10px', color: '#475569' }}>
                <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '2px' }}>قسط شهري ذكي</div>
                <div>24 شهر: {product.installment.m24.toLocaleString()} ج.م</div>
              </div>
            </div>
          ))}
        </div>

        {/* أزرار التنقل السريع */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '15px', marginBottom: '25px' }}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px' }}>السابق</button>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>صفحة {currentPage} من {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px' }}>التالي</button>
        </div>
      </div>

      {/* حاسبة الأقساط التفاعلية */}
      <div style={{ margin: '20px 15px', padding: '20px', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', borderRadius: '24px', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 5px 0' }}>احسب قسطك الشهري</h3>
        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '0 0 20px 0' }}>سوق بأكثر من 40,000 تاجر إلى تاجر</p>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span>قيمة السلعة:</span>
            <span style={{ fontWeight: 'bold', color: '#00b4d8' }}>{calcPrice.toLocaleString()} ج.م</span>
          </div>
          <input 
            type="range" 
            min="2000" 
            max="100000" 
            step="500"
            value={calcPrice} 
            onChange={(e) => setCalcPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#00b4d8', marginBottom: '20px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span>فترة التقسيط:</span>
            <span style={{ fontWeight: 'bold', color: '#00b4d8' }}>{calcMonths} شهر</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[6, 12, 24].map(m => (
              <button key={m} onClick={() => setCalcMonths(m)} style={{ padding: '10px', borderRadius: '10px', border: 'none', background: calcMonths === m ? '#00b4d8' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>{m} شهر</button>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: '#94a3b8' }}>
            <span>المقدم (10%):</span>
            <span>{calcDownPayment.toLocaleString()} ج.م</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
            <span>القسط الشهري المتوقع:</span>
            <span style={{ color: '#10b981', fontSize: '18px' }}>{calcMonthlyInstallment.toLocaleString()} ج.م</span>
          </div>
        </div>
      </div>

      {/* الفوتر السفلي */}
      <footer style={{ background: '#0a0f1d', color: '#64748b', padding: '30px 20px', textAlign: 'center', fontSize: '12px' }}>
        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px', marginBottom: '10px' }}>PayNex</div>
        <p style={{ margin: '0 0 20px 0', color: '#475569' }}>منصة الحلول التمويلية الذكية الأولى في مصر.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', color: '#94a3b8', marginBottom: '20px' }}>
          <span>الشروط</span> • <span>الخصوصية</span> • <span>اتصل بنا</span>
        </div>
        <p style={{ margin: 0, color: '#334155' }}>© 2026 PayNex Smart Pay. جميع الحقوق محفوظة.</p>
      </footer>

    </div>
  );
}
