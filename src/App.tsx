import React, { useState } from 'react';

// تعريف مواصفات المنتج الثابتة والأقساط
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

// مصفوفة المنتجات الحقيقية (البديل النظيف للدالة العشوائية القديمة)
const PAYNEX_REAL_PRODUCTS: Product[] = [
  {
    id: 1,
    title: "iPhone 15 Pro Max - 256GB - تيتانيوم طبيعي أصلي",
    category: "الموبايلات والتابلت",
    categoryId: "mobiles",
    brand: "Apple",
    price: 65000,
    currency: "ج.م",
    stock: 5,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&auto=format&fit=crop&q=80",
    description: "نسخة الشرق الأوسط بضمان معتمد، متاح تقسيط مباشر برقم البطاقة.",
    installment: { allow: true, downPayment: 6500, m24: 3450 }
  },
  {
    id: 2,
    title: "شاشة سامسونج 55 بوصة Smart UHD 4K رسيفر مدمج",
    category: "الشاشات والإلكترونيات",
    categoryId: "tv",
    brand: "Samsung",
    price: 18500,
    currency: "ج.م",
    stock: 8,
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&auto=format&fit=crop&q=80",
    description: "ألوان سينمائية فائقة الوضوح مع دعم كامل لتطبيقات المشاهدة الذكية.",
    installment: { allow: true, downPayment: 1850, m24: 980 }
  },
  {
    id: 3,
    title: "لابتوب ديل اير ون Dell Latitude برو معالج Core i7",
    category: "الكمبيوتر واللاب توب",
    categoryId: "laptops",
    brand: "Dell",
    price: 32000,
    currency: "ج.م",
    stock: 3,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80",
    description: "لأعمال البرمجة والجرافيك الشاقة، هارد سريع ورامات قوية.",
    installment: { allow: true, downPayment: 3200, m24: 1700 }
  },
  {
    id: 4,
    title: "ثلاجة شارب ديجيتال 450 لتر إنفيرتر موفرة للطاقة",
    category: "الثلاجات والديب فريزر",
    categoryId: "refrigerators",
    brand: "Sharp",
    price: 28500,
    currency: "ج.م",
    stock: 4,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80",
    description: "نظام تبريد متطور لمنع تكون الثلج مع الحفاظ على نضارة المأكولات.",
    installment: { allow: true, downPayment: 2850, m24: 1510 }
  },
  {
    id: 5,
    title: "غسالة ملابس ال جي اتوماتيك كامل 8 كيلو ديجيتال",
    category: "الغسالات والمجففات",
    categoryId: "washers",
    brand: "LG",
    price: 21000,
    currency: "ج.م",
    stock: 6,
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80",
    description: "محرك دفع مباشر ذكي، هادئة تماماً وموفرة في استهلاك المياه.",
    installment: { allow: true, downPayment: 2100, m24: 1120 }
  },
  {
    id: 6,
    title: "تكييف كاريير اوبتي ماكس 1.5 حصان بارد ساخن بلازما",
    category: "التكييفات",
    categoryId: "air-conditioners",
    brand: "Carrier",
    price: 23500,
    currency: "ج.م",
    stock: 9,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80",
    description: "تبريد سريع جداً يغطي المساحات بكفاءة مع فلاتر تنقية الهواء.",
    installment: { allow: true, downPayment: 2350, m24: 1250 }
  }
];

export default function App() {
  const [products] = useState<Product[]>(PAYNEX_REAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4; // عرض متوازن ومثالي لشاشات الموبايل

  // الـ States الخاصة بحاسبة الأقساط بروح وتصميم جوميا الأنيق
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
      
      {/* التوب بار العلوي لإعلانات العروض المباشرة */}
      <div style={{ background: '#f68b1e', color: '#fff', fontSize: '11px', textAlign: 'center', padding: '6px 0', fontWeight: 'bold' }}>
        قسّط جميع مشترياتك أونلاين برقم البطاقة وبأسرع موافقة تمويلية في مصر!
      </div>

      {/* الهيدر المحسن: لوجو مستقل لـ PayNex وزر تسجيل الدخول */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ background: '#f68b1e', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: '900', fontSize: '20px' }}>P</div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a' }}>PayNex<span style={{ color: '#f68b1e' }}>.</span></span>
        </div>
        <button style={{ background: '#fff', color: '#f68b1e', border: '2px solid #f68b1e', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
          تسجيل الدخول
        </button>
      </header>

      {/* شريط البحث النظيف والمنقح من أي نصوص خارجية */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e1e1e4' }}>
        <input 
          type="text" 
          placeholder="ابحث عن الماركات، المنتجات الحقيقية، والأقسام المتاحة..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{ width: '100%', padding: '11px 12px', borderRadius: '4px', border: '1px solid #a3a3a6', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f1f1f2' }}
        />
      </div>

      {/* التصفح حسب الفئة والدوران السلس للأقسام */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px 16px', background: '#fff', WebkitOverflowScrolling: 'touch' }}>
        <button onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: selectedCategory === 'all' ? '#f68b1e' : '#f1f1f2', color: selectedCategory === 'all' ? '#fff' : '#282828', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '12px' }}>
          كل المعروض ({products.length})
        </button>
        {['mobiles', 'tv', 'laptops', 'refrigerators', 'washers', 'air-conditioners'].map(catId => {
          const catName = products.find(p => p.categoryId === catId)?.category || catId;
          return (
            <button key={catId} onClick={() => { setSelectedCategory(catId); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: selectedCategory === catId ? '#f68b1e' : '#f1f1f2', color: selectedCategory === catId ? '#fff' : '#282828', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '12px' }}>
              {catName}
            </button>
          );
        })}
      </div>

      {/* الـ Grid المزدوج المطور (2 كارت في الصف) بنمط شكل الموبايل لجوميا وبي تك */}
      <div style={{ padding: '12px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {currentProducts.map(product => (
            <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e1e1e4' }}>
              <div>
                {/* احتواء الصورة بشكل محاذي ومظبوط وعالي الجودة */}
                <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: '6px', borderRadius: '4px', marginBottom: '8px', height: '110px', alignItems: 'center' }}>
                  <img src={product.image} alt={product.title} style={{ maxWidth: '100%', maxHeight: '105px', objectFit: 'contain' }} />
                </div>
                <h3 style={{ fontSize: '12px', color: '#282828', margin: '0 0 6px 0', height: '36px', overflow: 'hidden', lineHeight: '1.4', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.title}</h3>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' }}>{product.price.toLocaleString()} {product.currency}</div>
              </div>
              <div style={{ background: '#fff6ee', padding: '6px', borderRadius: '2px', border: '1px solid #fde4c3', marginTop: '4px' }}>
                <div style={{ color: '#f68b1e', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>قسط شهري مرن:</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a1a' }}>{product.installment.m24.toLocaleString()} ج.م × 24 شهر</div>
              </div>
            </div>
          ))}
        </div>

        {/* أزرار الـ Pagination السلسة */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px', marginBottom: '8px' }}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #c7c7cd', background: '#fff', fontSize: '12px', color: '#282828', fontWeight: '500' }}>السابق</button>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#282828' }}>صفحة {currentPage} من {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #c7c7cd', background: '#fff', fontSize: '12px', color: '#282828', fontWeight: '500' }}>التالي</button>
        </div>
      </div>

      {/* حاسبة أقساط PayNex الذكية والمستقلة بالكامل في الأسفل */}
      <div style={{ margin: '16px 12px', padding: '16px', background: '#fff', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #f68b1e' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0' }}>احسب قسطك التقديري الفوري</h3>
        <p style={{ fontSize: '11px', color: '#757577', margin: '0 0 14px 0' }}>احسب خطة تمويلك لأي منتج خارجي بكل سهولة عبر أنظمة PayNex</p>
        
        <div style={{ background: '#f6f6f9', padding: '12px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ color: '#535357' }}>قيمة السلعة المطلوبة:</span>
            <span style={{ fontWeight: 'bold', color: '#f68b1e', fontSize: '14px' }}>{calcPrice.toLocaleString()} ج.م</span>
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
            <span style={{ color: '#535357' }}>فترة السداد والتمويل:</span>
            <span style={{ fontWeight: 'bold', color: '#f68b1e' }}>{calcMonths} شهر</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '16px' }}>
            {[6, 12, 24].map(m => (
              <button key={m} onClick={() => setCalcMonths(m)} style={{ padding: '8px 0', borderRadius: '4px', border: 'none', background: calcMonths === m ? '#f68b1e' : '#fff', color: calcMonths === m ? '#fff' : '#282828', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{m} شهر</button>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', margin: '12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#757577' }}>
            <span>مقدم الشراء المطلوبة (10%):</span>
            <span style={{ fontWeight: '600', color: '#282828' }}>{calcDownPayment.toLocaleString()} ج.م</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', alignItems: 'center' }}>
            <span style={{ color: '#1a1a1a' }}>القسط الشهري المتوقع:</span>
            <span style={{ color: '#10b981', fontSize: '17px', fontWeight: '800' }}>{calcMonthlyInstallment.toLocaleString()} ج.م/شهر</span>
          </div>
        </div>
      </div>

      {/* الفوتر الاحترافي النظيف لـ PayNex */}
      <footer style={{ background: '#282828', color: '#a3a3a6', padding: '24px 16px', textAlign: 'center', fontSize: '12px' }}>
        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px', marginBottom: '6px' }}>PayNex</div>
        <p style={{ margin: '0 0 12px 0', lineHeight: '1.4' }}>نظام وحلول التمويل الذكي للتقسيط المباشر برقم البطاقة بأسهل الإجراءات.</p>
        <p style={{ margin: 0, color: '#535357' }}>© 2026 PayNex Smart Pay. جميع الحقوق محفوظة.</p>
      </footer>

    </div>
  );
}
