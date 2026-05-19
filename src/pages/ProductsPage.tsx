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

  return (
    <div className="products-container">
      <h1>منتجاتنا</h1>
      <div className="grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>السعر: {product.price} ج.م</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;
