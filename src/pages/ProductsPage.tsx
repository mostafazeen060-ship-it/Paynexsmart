import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '@/lib/storage';
import { ShoppingBag } from 'lucide-react';

// تعريف التصنيفات - يمكنك تعديلها لتطابق التصنيفات في قاعدة بياناتك
const categories = ['الكل', 'موبايلات', 'لابتوبات', 'شاشات', 'أجهزة منزلية'];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const allProducts = getProducts();

  // تصفية المنتجات بناءً على التصنيف
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'الكل') return allProducts;
    return allProducts.filter(p => p.category === selectedCategory);
  }, [selectedCategory, allProducts]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="container mx-auto">
        
        {/* 1. شريط الأقسام بجانب العنوان */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-black text-[#0f2460]">أحدث الإلكترونيات</h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-[#0f2460] text-white shadow-lg' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 2. شبكة المنتجات */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group overflow-hidden"
            >
              {/* الصورة */}
              <div className="h-48 flex items-center justify-center bg-gray-50 p-4">
                <img 
                  src={product.image_url || '/placeholder.svg'} 
                  alt={product.name || 'منتج'} 
                  className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" 
                />
              </div>
              
              {/* المعلومات */}
              <div className="p-4 flex-grow text-right">
                <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 h-12 leading-tight">
                  {product.name || 'منتج'}
                </h3>
                <p className="text-[#0f2460] font-black text-xl mb-4">
                  {(product.price || 0).toLocaleString()} ج.م
                </p>
              </div>

              {/* زر التقسيط */}
              <div className="p-4 pt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // منع الانتقال لصفحة التفاصيل عند الضغط على الزر
                    navigate(`/order-form/${product.id}`);
                  }}
                  className="w-full bg-[#d4a339] hover:bg-[#b88d2f] text-white font-bold py-3 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} />
                  اطلب بالتقسيط
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            لا توجد منتجات في هذا التصنيف حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
