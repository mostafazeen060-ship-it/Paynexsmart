import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, addOrder } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';

export default function OrderFormPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [months, setMonths] = useState<number>(12); // الخطة الافتراضية
  const [formData, setFormData] = useState({ name: '', phone: '', province: '' });

  useEffect(() => {
    const products = getProducts();
    const found = products.find(p => p.id === productId);
    if (!found) {
      toast.error('المنتج غير موجود');
      navigate('/products');
    } else {
      setProduct(found);
    }
  }, [productId, navigate]);

  if (!product) return null;

  const price = product.price ?? 0;
  const monthlyPayment = Math.round(price / months);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('يجب تسجيل الدخول لإتمام الطلب');
      navigate('/login');
      return;
    }
    
    // منطق إضافة الطلب
    addOrder({
      productId: product.id,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerProvince: formData.province,
      months,
      totalAmount: price,
    });
    
    toast.success('تم إرسال طلبك بنجاح!');
    navigate('/order-status');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <h1 className="text-3xl font-black text-[#0f2460] mb-8 text-center">طلب تقسيط: {product.name}</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {/* عرض المنتج */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
            <img src={product.image_url} className="w-20 h-20 object-contain" alt={product.name} />
            <div>
              <h2 className="font-bold text-lg">{product.name}</h2>
              <p className="text-[#d4a339] font-black text-xl">{price.toLocaleString()} ج.م</p>
            </div>
          </div>

          {/* اختيار الخطة */}
          <div className="mb-6">
            <label className="block font-bold mb-3 text-slate-700">اختر مدة التقسيط:</label>
            <div className="grid grid-cols-3 gap-3">
              {[6, 12, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`py-3 rounded-lg font-bold border-2 ${months === m ? 'border-[#0f2460] bg-[#0f2460] text-white' : 'border-slate-200'}`}
                >
                  {m} شهر
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-slate-500">
              القسط الشهري التقريبي: <span className="font-black text-[#0f2460]">{monthlyPayment.toLocaleString()} ج.م</span>
            </p>
          </div>

          {/* بيانات العميل */}
          <div className="space-y-4">
            <input className="w-full p-3 border rounded-lg" placeholder="الاسم الكامل" required onChange={e => setFormData({...formData, name: e.target.value})} />
            <input className="w-full p-3 border rounded-lg" placeholder="رقم الهاتف" required onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input className="w-full p-3 border rounded-lg" placeholder="المحافظة" required onChange={e => setFormData({...formData, province: e.target.value})} />
          </div>

          <button type="submit" className="w-full mt-8 bg-[#0f2460] text-white py-4 rounded-xl font-black hover:bg-[#1a3a8a] transition-all">
            تأكيد طلب التقسيط
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
