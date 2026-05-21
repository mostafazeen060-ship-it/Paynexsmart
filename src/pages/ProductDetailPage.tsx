import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InstallmentCalculator from '@/components/features/InstallmentCalculator';
import { useApp } from '@/contexts/AppContext';
import { getProducts } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const found = getProducts().find(p => p.id === id);
    if (!found) navigate('/products');
    else setProduct(found);
  }, [id, navigate]);

  if (!product) return null;

  const name = lang === 'ar' ? product.nameAr : product.nameEn;
  const desc = lang === 'ar' ? product.descriptionAr : product.descriptionEn;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto py-10 px-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 mb-6 hover:text-[#0f2460] transition-colors"
        >
          <ArrowRight size={20} /> {t('عودة', 'Back')}
        </button>

        <div className="grid md:grid-cols-2 gap-10 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          {/* صورة المنتج */}
          <div className="flex items-center justify-center bg-gray-50 rounded-2xl p-6">
            <img src={product.image_url} alt={name} className="max-h-96 object-contain" />
          </div>

          {/* تفاصيل المنتج */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-[#0f2460] mb-4">{name}</h1>
            <p className="text-2xl font-bold text-[#d4a339] mb-6">{formatCurrency(product.price, lang)}</p>
            <p className="text-slate-600 mb-8 leading-relaxed">{desc}</p>

            {/* أزرار الإجراء */}
            <div className="flex gap-4 mt-auto">
              <button
                onClick={() => navigate(`/order-form/${product.id}`)}
                className="flex-1 bg-[#0f2460] text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-[#1a3a8a] transition-all"
              >
                <ShoppingBag size={20} />
                {t('اطلب بالتقسيط الآن', 'Order via Installment')}
              </button>
            </div>
          </div>
        </div>

        {/* حاسبة القسط */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-[#0f2460] mb-6 text-center">{t('احسب قسطك', 'Calculate Your Installment')}</h2>
          <InstallmentCalculator productPrice={product.price} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
