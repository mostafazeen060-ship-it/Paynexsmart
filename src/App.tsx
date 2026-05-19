import React, { useState } from 'react';

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

const generatePayNexProducts = (): Product[] => {
  const CATEGORIES = [
    { id: 'mobiles', name: 'الموبايلات والتابلت', brands: ['Samsung', 'Apple', 'Oppo', 'Xiaomi'], basePrice: 9000, imgUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80' },
    { id: 'tv', name: 'الشاشات والإلكترونيات', brands: ['LG', 'Samsung', 'Toshiba', 'Sony'], basePrice: 16000, imgUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&auto=format&fit=crop&q=80' },
    { id: 'laptops', name: 'الكمبيوتر واللاب توب', brands: ['Dell', 'HP', 'Lenovo', 'Asus'], basePrice: 30000, imgUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80' },
    { id: 'refrigerators', name: 'الثلاجات والديب فريزر', brands: ['Kiriazi', 'LG', 'Sharp'], basePrice: 24000, imgUrl: 'https://images.unsplash.com/photo-1571175432247-5c92522756d1?w=400&auto=format&fit=crop&q=80' },
    { id: 'washers', name: 'الغسالات والمجففات', brands: ['Zanussi', 'LG', 'Samsung'], basePrice: 15000, imgUrl: 'https://images.unsplash.com/photo-1545173168-9f18d8219973?w=400&auto=format&fit=crop&q=80' },
    { id: 'air-conditioners', name: 'التكييفات', brands: ['Carrier', 'Sharp', 'Gree'], basePrice: 21000, imgUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&auto=format&fit=crop&q=80' },
    { id: 'kitchen', name: 'أجهزة المطبخ الصغيرة', brands: ['Braun', 'Kenwood', 'Philips'], basePrice: 3500, imgUrl: 'https://images.unsplash.com/photo-1581622558663-b2e33377dfb2?w=400&auto=format&fit=crop&q=80' },
    { id: 'accessories', name: 'الإكسسوارات والساعات الذكية', brands: ['Oraimo', 'Anker', 'Apple'], basePrice: 2500, imgUrl: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&auto=format&fit=crop&q=80' }
  ];

  const productsList: Product[] = [];
  let globalId = 1;

  CATEGORIES.forEach((category) => {
    for (let i = 1; i <= 2750; i++) {
      const brand = category.brands[i % category.brands.length];
      const priceModifier = 0.7 + ((i * 13) % 100) * 0.01;
      const price = Math.round((category.basePrice * priceModifier) / 50) * 50;
      
      productsList.push({
        id: globalId,
        title: `${category.name.slice(0, -1)} ${brand} - موديل سلعة ممتازة رقم ${i}`,
        category: category.name,
        categoryId: category.id,
        brand: brand,
        price: price,
        currency: "ج.م",
        stock: (i % 15) + 1,
        image: category.imgUrl,
        description: `منتج أصلي وضمان معتمد بقسط مباشر من PayNex.`,
        installment: {
          allow: price > 2000,
          downPayment: Math.round((price * 0.1) / 10) * 10,
          m24: Math.round(((price - (price * 0.1)) * 1.35) / 24)
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
  const itemsPerPage = 6;

  const [calcPrice, setCalcPrice] = useState<number>(15000);
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
    <div style={{ fontFamily: 'Segoe UI, Roboto, sans-serif', direction: 'rtl', backgroundColor: '#f1f1f2', minHeight: '100vh', margin: 0, padding: 0 }}>
      
      {/* هيدر جوميا توب بار المحاكي */}
      <div style={{ background: '#f68b1e', color: '#fff', fontSize: '11px', textAlign: 'center', padding: '4px 0', fontWeight: 'bold' }}>
        تسوّق الآن وقسّط مباشرة برقم البطاقة - أسرع موافقة تمويلية في مصر!
      </div>

      {/* الهيدر الرئيسي مع زر تسجيل الدخول والشعار الاحترافي */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ background: '#f68b1e', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: '900', fontSize: '20px' }}>P</div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#000' }}>PayNex<span style={{ color: '#f68b1e' }}>.</span></span>
        </div>
        <button style={{ background: 'none', color: '#f68b1e', border: '2px solid #f68b1e', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
          تسجيل الدخول
        </button>
      </header>

      {/* شريط البحث المدمج */}
      <div style={{ padding: '12px', background: '#fff', borderBottom: '1px solid #e1e1e4' }}>
        <input 
          type="text" 
          placeholder="البحث عن المنتجات، الماركات، والأقسام المتاحة..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #a3a3a6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* قائمة الفئات الدوارة السريعة */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px', background: '#fff', WebkitOverflowScrolling: 'touch' }}>
        <button onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: selectedCategory === 'all' ? '#f68b1e' : '#f1f1f2', color: selectedCategory === 'all' ? '#fff' : '#000', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '12px' }}>
          الكل (22,000 منتج)
        </button>
        {['mobiles', 'tv', 'laptops', 'refrigerators', 'washers', 'air-conditioners', 'kitchen', 'accessories'].map(catId => {
          const catName = products.find(p => p.categoryId === catId)?.category || catId;
          return (
            <button key={catId} onClick={() => { setSelectedCategory(catId); setCurrentPage(1); }} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: selectedCategory === catId ? '#f68b1e' : '#f1f1f2', color: selectedCategory === catId ? '#fff' : '#000', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '12px' }}>
              {catName}
            </button>
          );
        })}
      </div>

      {/* الـ Grid وتجربة عرض المنتجات المستوحاة من جوميا ثنائية الكروت */}
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {currentProducts.map(product => (
            <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e1e1e4' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <img src={product.image} alt={product.title} style={{ width: '100%', height: '110px', objectFit: 'contain', backgroundColor: '#fff' }} />
                </div>
                <h3 style={{ fontSize: '12px', color: '#282828', margin: '0 0 6px 0', height: '34px', overflow: 'hidden', lineHeight: '1.4', fontWeight: '400', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.title}</h3>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#282828', marginBottom: '8px' }}>{product.price.toLocaleString()} {product.currency}</div>
              </div>
              <div style={{ background: '#fef3e6', padding: '6px', borderRadius: '2px', border: '1px solid #fde4c3' }}>
                <div style={{ color: '#f68b1e', fontSize: '10px', fontWeight: 'bold' }}>قسط شهري متوقع</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#282828' }}>{product.installment.m24.toLocaleString()} ج.م × 24</div>
              </div>
            </div>
          ))}
        </div>

        {/* أزرار الـ Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '16px', marginBottom: '12px' }}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', color: '#000' }}>السابق</button>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>صفحة {currentPage} من {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', color: '#000' }}>التالي</button>
        </div>
      </div>

      {/* حاسبة أقساط PayNex المدمجة في الهيكل الفاخر */}
      <div style={{ margin: '12px', padding: '16px', background: '#fff', borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderTop: '4px solid #f68b1e' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#000', margin: '0 0 4px 0' }}>حاسبة أقساط PayNex الذكية</h3>
        <p style={{ fontSize: '11px', color: '#757577', margin: '0 0 16px 0' }}>حدد سعر أي منتج خارجي واحسب خطة قسطك فورياً</p>
        
        <div style={{ background: '#f1f1f2', padding: '12px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span>سعر السلعة الكلي:</span>
            <span style={{ fontWeight: 'bold', color: '#f68b1e' }}>{calcPrice.toLocaleString()} ج.م</span>
          </div>
          <input 
            type="range" 
            min="2000" 
            max="100000" 
            step="500"
            value={calcPrice} 
            onChange={(e) => setCalcPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#f68b1e', marginBottom: '16px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span>فترة السداد بالأشهر:</span>
            <span style={{ fontWeight: 'bold', color: '#f68b1e' }}>{calcMonths} شهر</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '16px' }}>
            {[6, 12, 24].map(m => (
              <button key={m} onClick={() => setCalcMonths(m)} style={{ padding: '8px', borderRadius: '4px', border: 'none', background: calcMonths === m ? '#f68b1e' : '#fff', color: calcMonths === m ? '#fff' : '#000', fontWeight: 'bold', fontSize: '12px' }}>{m} شهر</button>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e1e1e4', margin: '12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#757577' }}>
            <span>المقدم المطلوب (10%):</span>
            <span>{calcDownPayment.toLocaleString()} ج.م</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
            <span>القسط الشهري التقديري:</span>
            <span style={{ color: '#10b981', fontSize: '18px' }}>{calcMonthlyInstallment.toLocaleString()} ج.م/شهر</span>
          </div>
        </div>
      </div>

      {/* الفوتر بنمط وبصمة مستقلة */}
      <footer style={{ background: '#282828', color: '#fff', padding: '24px 16px', textAlign: 'center', fontSize: '12px', marginTop: '20px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '6px' }}>PayNex</div>
        <p style={{ color: '#a3a3a6', margin: '0 0 16px 0' }}>نظام وتطبيق حلول التقسيط وحساب التمويل المباشر الأسرع في مصر.</p>
        <p style={{ color: '#757577', margin: 0 }}>© 2026 PayNex Smart Pay. جميع الحقوق محفوظة.</p>
      </footer>

    </div>
  );
}
