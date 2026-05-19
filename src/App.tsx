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
    { id: 'personal-care', name: 'العناية الشخصية', brands: ['Braun', 'Philips'], basePrice: 1800, imgUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80' },
    { id: 'home-appliances', name: 'المكنسة والمكواة والدفايات', brands: ['Philips', 'Panasonic', 'Tornado'], basePrice: 4500, imgUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&auto=format&fit=crop&q=80' },
    { id: 'gaming', name: 'الألعاب والـ Gaming', brands: ['Sony PlayStation', 'Microsoft Xbox'], basePrice: 26000, imgUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80' },
    { id: 'accessories', name: 'الإكسسوارات والساعات الذكية', brands: ['Oraimo', 'Anker', 'Apple'], basePrice: 2500, imgUrl: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&auto=format&fit=crop&q=80' }
  ];

  const productsList: Product[] = [];
  let globalId = 1;

  CATEGORIES.forEach((category) => {
    for (let i = 1; i <= 2000; i++) {
      const brand = category.brands[i % category.brands.length];
      const priceModifier = 0.7 + ((i * 13) % 100) * 0.01;
      const price = Math.round((category.basePrice * priceModifier) / 50) * 50;
      
      productsList.push({
        id: globalId,
        title: `${category.name.slice(0, -1)} ${brand} - فئة أولى موديل ${i + 100}`,
        category: category.name,
        categoryId: category.id,
        brand: brand,
        price: price,
        currency: "ج.م",
        stock: (i % 15) + 1,
        image: category.imgUrl,
        description: `منتج أصلي 100% بضمان الوكيل المعتمد، متاح الآن عبر خطط تقسيط PayNex المرنة والمباشرة.`,
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
  const itemsPerPage = 8;

  const [calcPrice, setCalcPrice] = useState<number>(12000);
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
    <div style={{ fontFamily: 'Segoe UI, Roboto, Helvetica, sans-serif', direction: 'rtl', backgroundColor: '#f1f1f2', minHeight: '100vh', margin: 0, padding: 0 }}>
      
      {/* هيدر مستوحى من جوميا مع شعار احترافي وزر تسجيل الدخول */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderBottom: '3px solid #f68b1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#f68b1e', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontWeight: '900', fontSize: '20px', fontStyle: 'italic', boxShadow: '0 2px 4px rgba(246,139,30,0.2)' }}>P</div>
          <span style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.5px' }}>PayNex<span style={{ color: '#f68b1e' }}>.</span></span>
        </div>
        <button style={{ background: 'transparent', color: '#f68b1e', border: '2px solid #f68b1e', padding: '6px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          تسجيل الدخول
        </button>
      </header>

      {/* بانر إعلاني بنمط جوميا - شعار ووصف متجدد وبدون كروت عملاء */}
      <div style={{ background: '#f68b1e', color: '#fff', padding: '35px 20px', textAlign: 'center', boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', lineHeight: '1.3' }}>قسّط كل احتياجاتك بـ أسهل طريقة في مصر</h1>
        <p style={{ fontSize: '13px', color: '#fff', opacity: 0.95, maxWidth: '400px', margin: '0 auto', lineHeight: '1.5', fontWeight: '500' }}>
          تسوّق آلاف المنتجات الأصلية مباشرة وقسّم مدفوعاتك على فترات تصل إلى 24 شهراً بموافقة فورية برقم بطاقتك فقط ومن مكانك.
        </p>
      </div>

      {/* لوحة الإحصائيات العامة للمتجر */}
      <div style={{ padding: '0 12px', marginTop: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '4px', textAlign: 'center', borderBottom: '2px solid #e5e5e5' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#282828' }}>22,000</div>
            <div style={{ fontSize: '11px', color: '#757577', marginTop: '2px' }}>منتج متاح للتقسيط</div>
          </div>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '4px', textAlign: 'center', borderBottom: '2px solid #e5e5e5' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>100% أصلي</div>
            <div style={{ fontSize: '11px', color: '#757577', marginTop: '2px' }}>ضمان الوكيل المعتمد</div>
          </div>
        </div>
      </div>

      {/* البحث والتصفح بين الأقسام */}
      <div style={{ padding: '20px 12px 8px 12px' }}>
        <div style={{ marginBottom: '12px' }}>
          <input 
            type="text" 
            placeholder="ابحث عن المنتجات، الماركات، أو الفئات..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #c7c7cd', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
          />
        </div>

        {/* فئات التصفح بنمط جوميا المرن */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
          <button onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} style={{ padding: '8px 14px', borderRadius: '4px', border: 'none', background: selectedCategory === 'all' ? '#f68b1e' : '#fff', color: selectedCategory === 'all' ? '#fff' : '#282828', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap', fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            جميع الفئات (22,000)
          </button>
          {['mobiles', 'tv', 'laptops', 'refrigerators', 'washers', 'air-conditioners', 'kitchen', 'personal-care', 'home-appliances', 'gaming', 'accessories'].map(catId => {
            const catName = products.find(p => p.categoryId === catId)?.category || catId;
            return (
              <button key={catId} onClick={() => { setSelectedCategory(catId); setCurrentPage(1); }} style={{ padding: '8px 14px', borderRadius: '4px', border: 'none', background: selectedCategory === catId ? '#f68b1e' : '#fff', color: selectedCategory === catId ? '#fff' : '#282828', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap', fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {catName}
              </button>
            );
          })}
        </div>
      </div>

      {/* عرض المنتجات بصور واقعية ونظيفة جداً */}
      <div style={{ padding: '0 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentProducts.map(product => (
            <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '12px', display: 'flex', gap: '14px', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <img src={product.image} alt={product.title} style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#fff', flexShrink: 0 }} />
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '90px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', color: '#282828', margin: '0 0 4px 0', fontWeight: '500', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.title}</h3>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#282828' }}>{product.price.toLocaleString()} {product.currency}</div>
                </div>
                <div style={{ background: '#f6f6f9', padding: '5px 10px', borderRadius: '2px', fontSize: '11px', color: '#535357', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#f68b1e', fontWeight: 'bold' }}>خطة تقسيط ذكية</span>
                  <span style={{ fontWeight: '700' }}>24 شهر: {product.installment.m24.toLocaleString()} ج.م/شهر</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* أزرار التنقل بين الصفحات */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px', marginBottom: '24px' }}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', color: '#282828' }}>السابق</button>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#282828' }}>صفحة {currentPage} من {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', color: '#282828' }}>التالي</button>
        </div>
      </div>

      {/* حاسبة الأقساط التفاعلية المستقلة والنظيفة */}
      <div style={{ margin: '20px 12px', padding: '20px', background: '#fff', borderRadius: '4px', color: '#282828', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: '4px solid #f68b1e' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', textAlign: 'center', margin: '0 0 4px 0', color: '#1a1a1a' }}>احسب قسطك الشهري التقديري</h3>
        <p style={{ fontSize: '12px', color: '#757577', textAlign: 'center', margin: '0 0 20px 0' }}>اختر قيمة السلعة والمدة المفضلة لتقسيط مباشر وسريع</p>
        
        <div style={{ background: '#f6f6f9', padding: '16px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: '#535357' }}>قيمة المنتج المراد تقسيطه:</span>
            <span style={{ fontWeight: '700', color: '#f68b1e', fontSize: '16px' }}>{calcPrice.toLocaleString()} ج.م</span>
          </div>
          <input 
            type="range" 
            min="2000" 
            max="100000" 
            step="500"
            value={calcPrice} 
            onChange={(e) => setCalcPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#f68b1e', marginBottom: '20px', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: '#535357' }}>فترة التقسيط المناسبة لك:</span>
            <span style={{ fontWeight: '700', color: '#f68b1e' }}>{calcMonths} شهر</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            {[6, 12, 24].map(m => (
              <button key={m} onClick={() => setCalcMonths(m)} style={{ padding: '10px', borderRadius: '4px', border: 'none', background: calcMonths === m ? '#f68b1e' : '#fff', color: calcMonths === m ? '#fff' : '#282828', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>{m} شهر</button>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', margin: '15px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: '#757577' }}>
            <span>مقدم الشراء التقديري (10%):</span>
            <span style={{ fontWeight: '600', color: '#282828' }}>{calcDownPayment.toLocaleString()} ج.م</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', alignItems: 'center' }}>
            <span style={{ color: '#1a1a1a' }}>القسط الشهري المتوقع:</span>
            <span style={{ color: '#10b981', fontSize: '20px', fontWeight: '800' }}>{calcMonthlyInstallment.toLocaleString()} ج.م</span>
          </div>
        </div>
      </div>

      {/* الفوتر السفلي بهوية مستقلة */}
      <footer style={{ background: '#282828', color: '#a3a3a6', padding: '30px 16px', textAlign: 'center', fontSize: '12px' }}>
        <div style={{ fontWeight: '800', color: '#fff', fontSize: '18px', marginBottom: '8px' }}>PayNex</div>
        <p style={{ margin: '0 0 20px 0', color: '#a3a3a6', lineHeight: '1.5' }}>منصة الحلول التمويلية وأنظمة التقسيط المباشر الذكية الأولى في مصر.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', color: '#fff', marginBottom: '20px', fontWeight: '500' }}>
          <span>الشروط والأحكام</span> • <span>سياسة الخصوصية</span> • <span>اتصل بنا</span>
        </div>
        <p style={{ margin: 0, color: '#757577' }}>© 2026 PayNex Smart Pay. جميع الحقوق محفوظة.</p>
      </footer>

    </div>
  );
}
