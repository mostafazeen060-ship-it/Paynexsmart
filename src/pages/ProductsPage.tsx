import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // تأكد من مسار الملف صح

function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      // سحب البيانات من جدول products
      const { data, error } = await supabase.from('products').select('*');
      
      if (error) {
        console.error("خطأ في سحب المنتجات:", error);
      } else {
        setProducts(data || []);
      }
    }
    fetchProducts();
  }, []);

  {products.map((product) => (
  <div key={product.id} className="product-card">
    {/* تأكد إن name و price هما نفس أسماء الأعمدة في Supabase */}
    <h3>{product.name || "منتج بدون اسم"}</h3> 
    <p>السعر: {product.price ? `${product.price} ج.م` : "السعر غير متاح"}</p>
  </div>
))}
