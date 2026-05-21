import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface Product {
  id: string;
  name?: string | null;
  price?: number | null;
  image_url?: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('id, name, price, image_url');

        if (supabaseError) throw supabaseError;
        setProducts(data ?? []);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) return <div className="text-center py-20">جاري التحميل...</div>;
  if (error) return <div className="text-center py-20 text-red-500">حدث خطأ: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-xl font-bold text-right mb-6 text-gray-800 border-b pb-2">
        كل المعروض ({products.length})
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const price = product.price ?? 0;
          const monthlyInstallment = price > 0 ? Math.round(price / 24) : 0;

          return (
            <div 
              key={product.id} 
              className="border rounded-xl p-4 shadow-sm bg-white flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden mb-4 p-2">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name ?? "منتج"} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                ) : (
                  <div className="text-gray-400 text-xs text-center">لا توجد صورة</div>
                )}
              </div>

              <div className="text-right flex-grow">
                <h3 className="font-medium text-sm text-gray-800 mb-2 line-clamp-2 h-10 leading-tight">
                  {product.name ?? "منتج بدون اسم"}
                </h3>
                
                <p className="text-lg font-bold text-gray-900 mb-2">
                  {price > 0 ? `${price.toLocaleString()} ج.م` : "السعر غير متاح"}
                </p>

                {price > 0 && (
                  <div className="bg-orange-50 p-2 rounded-lg text-right mt-3 border border-orange-100">
                    <span className="text-[10px] text-orange-600 block mb-0.5">قسط شهري مرن:</span>
                    <span className="text-xs font-bold text-orange-700">
                      {monthlyInstallment.toLocaleString()} ج.م × 24 شهر
                    </span>
                  </div>
                )}
              </div>

              <button 
                className="w-full mt-4 bg-[#D4A373] hover:bg-[#b08968] text-white font-bold py-2.5 rounded-xl transition duration-200 text-sm"
                onClick={() => window.location.href = `/product/${product.id}`}
              >
                اطلب بالتقسيط
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
