import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// تعريف شكل البيانات الخاص بالمنتج لـ TypeScript
interface Product {
  id: string;
  name?: string | null;
  price?: number | null;
  image_url?: string | null; // استخدمنا image_url كما في جدول supabase
  description?: string | null;
  category?: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // دالة async داخل useEffect حتى نستخدم await بشكل صحيح
    async function fetchProducts() {
      try {
        setLoading(true);
        // استخدمنا typing هنا لتقليل أخطاء TS
        const { data, error: supabaseError } = await supabase
          .from<Product>('products')
          .select('id, name, price, image_url');

        if (supabaseError) throw supabaseError;

        setProducts(data ?? []);
      } catch (err: any) {
        console.error("خطأ في جلب المنتجات:", err?.message ?? String(err));
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // حالة التحميل حتى لا تظهر الصفحة بيضاء
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-xl font-bold text-orange-500 animate-pulse" dir="rtl">جاري تحميل المنتجات...</p>
      </div>
    );
  }

  // حالة حدوث خطأ في الاتصال
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-red-500" dir="rtl">
        <p className="p-4 bg-red-50 rounded-md border border-red-200">حدث خطأ أثناء تحميل البيانات: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* عنوان الصفحة بعدد المنتجات */}
      <h1 className="text-xl font-bold text-right mb-6 text-gray-800 border-b pb-2">
        كل المعروض ({products.length})
      </h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-10">لا توجد منتجات معروضة حالياً في قاعدة البيانات.</p>
      ) : (
        /* شبكة عرض المنتجات (Grid) المتوافقة مع الموبايل والكمبيوتر */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            // احمِ السعر لأنّه قد يكون null/undefined
            const price = product.price ?? 0;
            const monthlyInstallment = price > 0 ? Math.round(price / 24) : 0;

            return (
              <div 
                key={product.id} 
                className="border rounded-xl p-4 shadow-sm bg-white flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
              >
                {/* 1. حاوية صورة المنتج */}
                <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden mb-4 p-2">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name ?? "منتج"} 
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
                    />
                  ) : (
                    /* صورة افتراضية لو مفيش رابط */
                    <div className="text-gray-400 text-xs text-center">لا توجد صورة متوفرة</div>
                  )}
                </div>

                {/* 2. تفاصيل المنتج (الاسم والسعر) */}
                <div className="text-right">
                  <h3 className="font-medium text-sm text-gray-800 mb-2 line-clamp-2 h-10 leading-tight">
                    {product.name ?? "منتج بدون اسم"}
                  </h3>
                  
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    {price > 0 ? `${price.toLocaleString()} ج.م` : "السعر غير متاح"}
                  </p>
                </div>

                {/* 3. صندوق حساب الأقساط (نفس تصميم موقعك) */}
                {price > 0 && (
                  <div className="bg-orange-50 p-2 rounded-lg text-right mt-3 border border-orange-100">
                    <span className="text-[10px] text-orange-600 block mb-0.5">قسط شهري مرن:</span>
                    <span className="text-xs font-bold text-orange-700">
                      {monthlyInstallment.toLocaleString()} ج.م × 24 شهر
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
