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
  // صور واقعية ومحددة لكل قسم لإنهاء عشوائية الصور السابقة
  const CATEGORIES = [
    { id: 'mobiles', name: 'الموبايلات والتابلت', brands: ['Samsung', 'Apple', 'Oppo', 'Xiaomi'], basePrice: 9000, imgUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80' },
    { id: 'tv', name: 'الشاشات والإلكترونيات', brands: ['LG', 'Samsung', 'Toshiba', 'Sony'], basePrice: 16000, imgUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&auto=format&fit=crop&q=80' },
    { id: 'laptops', name: 'الكمبيوتر واللاب توب', brands: ['Dell', 'HP', 'Lenovo', 'Asus'], basePrice: 30000, imgUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80' },
    { id: 'refrigerators', name: 'الثلاجات والديب فريزر', brands: ['Kiriazi', 'LG', 'Sharp'], basePrice: 24000, imgUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80' },
    { id: 'washers', name: 'الغسالات والمجففات', brands: ['Zanussi', 'LG', 'Samsung'], basePrice: 15000, imgUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80' },
    { id: 'air-conditioners', name: 'التكييفات', brands: ['Carrier', 'Sharp', 'Gree'], basePrice: 21000, imgUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80' },
    { id: 'kitchen', name: 'أجهزة المطبخ الصغيرة', brands: ['Braun', 'Kenwood', 'Philips'], basePrice: 3500, imgUrl: 'https://images.unsplash.com/photo-1522336572468-97b06e871437?w=400&auto=format&fit=crop&q=80' },
    { id: 'accessories', name: 'الإكسسوارات والساعات الذكية', brands: ['Oraimo', 'Anker', 'Apple'], basePrice: 2500, imgUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&auto=format&fit=crop&q=80' }
  ];

  const productsList: Product[] = [];
  let globalId = 1;

  CATEGORIES.forEach((category) => {
    // توليد الـ 22,000 منتج الذكي بناءً على مصفوفة الفئات المحدثة
    for (let i = 1; i <= 2750; i++) {
      const brand = category.brands[i % category.brands.length];
      const priceModifier = 0.75 + ((i * 17) % 80) * 0.01;
      const price = Math.round((category.basePrice * priceModifier) / 50) * 50;
      
      productsList.push({
        id: globalId,
        title: `${category.name.slice(0, -1)} ${brand} - الفئة الذكية موديل رقم ${i + 10}`,
        category: category.name,
        categoryId: category.id,
        brand: brand,
        price: price,
        currency: "ج.م",
        stock: (i % 10) + 1,
        image: category.imgUrl,
        description: `منتج أصلي بالكامل وضمان الوكيل، متاح الآن عبر خطط تمويل وتقسيط PayNex المباشرة السريعة.`,
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
  const itemsPerPage = 8; // يعرض 4 صفوف متوازنة في الشاشة

  // الـ States الخاصة بحاسبة الأقساط المتجددة بروح جوميا وبدون كروت
  const [calcPrice, setCalcPrice] = useState<number>(14000);
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
      
      {/* التوب بار العلوي بنمط منصات التجارة الكبرى */}
      <div style={{ background: '#f68b1e', color: '#fff', fontSize: '11px', textAlign: 'center', padding: '6px 0', fontWeight: 'bold' }}>
        تسوّق الآن وقسّط أونلاين برقم البطاقة - أسرع موافقة تمويلية فورية في مصر
      </div>

      {/* الهيدر بعد التعديل: اللوجو الجديد الاحترافي وزر تسجيل الدخول */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ background: '#f68b1e', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: '900', fontSize: '20px' }}>P</div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a' }}>PayNex<span style={{ color: '#f68b1e' }}>.</span></span>
        </div>
        <button style={{ background: '#fff', color: '#f68b1e', border: '2px solid #f68b1e', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
          تسجيل الدخول
        </button>
      </header>

      {/* شريط البحث المحدث - تم تنظيفه بالكامل من أي أسماء أخرى */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e1e1e4' }}>
        <input 
          type="text" 
          placeholder="ابحث عن المنتجات، الماركات العالمية، أو الأقسام..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{ width: '100%', padding: '11px 12px', borderRadius: '4px', border: '1px solid #a3a3a6', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f1f1f2' }}
        />
      </div>

      {/* شريط الفئات والأقسام السريعة */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px 16px', background: '#fff', WebkitOverflowScrolling: 'touch' }}>
        <button onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: selectedCategory === 'all' ? '#f68b1e' : '#f1f1f2', color: selectedCategory === 'all' ? '#fff' : '#282828', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '12px' }}>
          الكل (22,000)
        </button>
        {['mobiles', 'tv', 'laptops', 'refrigerators', 'washers', 'air-conditioners', 'kitchen', 'accessories'].map(catId => {
          const catName = products.find(p => p.categoryId === catId)?.category || catId;
          return (
            <button key={catId} onClick={() => { setSelectedCategory(catId); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: selectedCategory === catId ? '#f68b1e' : '#f1f1f2', color: selectedCategory === catId ? '#fff' : '#282828', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '12px' }}>
              {catName}
            </button>
          );
        })}
      </div>

      {/* الـ Grid المزدوج المتوازن (كارتين بكل صف) بنمط جوميا لعرض احترافي وممتلئ */}
      <div style={{ padding: '12px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {currentProducts.map(product => (
            <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e1e1e4' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: '6px', borderRadius: '4px', marginBottom: '8px', height: '120px', alignItems: 'center' }}>
                  <img src={product.image} alt={product.title} style={{ maxWidth: '100%', maxHeight: '110px', objectFit: 'contain' }} />
                </div>
                <h3 style={{ fontSize: '12px', color: '#282828', margin: '0 0 6px 0', height: '36px', overflow: 'hidden', lineHeight: '1.4', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.title}</h3>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' }}>{product.price.toLocaleString()} {product.currency}</div>
              </div>
              <div style={{ background: '#fff6ee', padding: '6px', borderRadius: '2px', border: '1px solid #fde4c3', marginTop: '4px' }}>
                <div style={{ color: '#f68b1e', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>خطة قسط مرنة:</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a1a' }}>{product.installment.m24.toLocaleString()} ج.م × 24 شهر</div>
              </div>
            </div>
          ))}
        </div>

        {/* الترقيم والـ Pagination المطور والسلس */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px', marginBottom: '8px' }}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #c7c7cd', background: '#fff', fontSize: '12px', color: '#282828', fontWeight: '500' }}>السابق</button>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#282828' }}>صفحة {currentPage} من {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #c7c7cd', background: '#fff', fontSize: '12px', color: '#282828', fontWeight: '500' }}>التالي</button>
        </div>
      </div>

      {/* حاسبة أقساط ذكية ومنفصلة تماماً بروح الهوية الجديدة */}
      <div style={{ margin: '16px 12px', padding: '16px', background: '#fff', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #f68b1e' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0' }}>احسب خطة قسطك التقديرية فوراً</h3>
        <p style={{ fontSize: '11px', color: '#757577', margin: '0 0 16px 0' }}>قسّط أي منتجات خارجية ترغب بها بكل سهولة عبر خدمات تمويل PayNex</p>
        
        <div style={{ background: '#f6f6f9', padding: '12px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ color: '#535357' }}>إجمالي قيمة السلعة:</span>
            <span style={{ fontWeight: 'bold', color: '#f68b1e', fontSize: '15px' }}>{calcPrice.toLocaleString()} ج.م</span>
          </div>
          <input 
            type="range" 
            min="2000" 
            max="100000" 
            step="500"
            value={calcPrice} 
            onChange={(e) => setCalcPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#f68b1e', marginBottom: '16px', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ color: '#535357' }}>فترة السداد والتمويل المفضلة:</span>
            <span style={{ fontWeight: 'bold', color: '#f68b1e' }}>{calcMonths} شهر</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '16px' }}>
            {[6, 12, 24].map(m => (
              <button key={m} onClick={() => setCalcMonths(m)} style={{ padding: '8px 0', borderRadius: '4px', border: 'none', background: calcMonths === m ? '#f68b1e' : '#fff', color: calcMonths === m ? '#fff' : '#282828', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{m} شهر</button>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', margin: '12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#757577' }}>
            <span>مقدم الشراء التقديري (10%):</span>
            <span style={{ fontWeight: '600', color: '#282828' }}>{calcDownPayment.toLocaleString()} ج.م</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', alignItems: 'center' }}>
            <span style={{ color: '#1a1a1a' }}>القسط الشهري المتوقع:</span>
            <span style={{ color: '#10b981', fontSize: '18px', fontWeight: '800' }}>{calcMonthlyInstallment.toLocaleString()} ج.م/شهر</span>
          </div>
        </div>
      </div>

      {/* فوتر احترافي مستقل تماماً */}
      <footer style={{ background: '#282828', color: '#a3a3a6', padding: '24px 16px', textAlign: 'center', fontSize: '12px' }}>
        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px', marginBottom: '6px' }}>PayNex</div>
        <p style={{ margin: '0 0 12px 0', lineHeight: '1.4' }}>المنصة الذكية الأولى في مصر لحلول وأنظمة التقسيط المباشر برقم البطاقة.</p>
        <p style={{ margin: 0, color: '#535357' }}>© 2026 PayNex Smart Pay. جميع الحقوق محفوظة.</p>
      </footer>

    </div>
  );
}
