import { CheckCircle, Home, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/contexts/AppContext';

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { t } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-slate-100 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          
          <h1 className="text-3xl font-black text-[#0f2460] mb-4">
            {t('تم استلام طلبك بنجاح!', 'Order Received Successfully!')}
          </h1>
          
          <p className="text-slate-600 mb-8 leading-relaxed">
            {t('شكراً لثقتك بـ "باينكس". سيقوم أحد مسؤولينا بالتواصل معك في أقرب وقت لتأكيد تفاصيل التقسيط وبدء الإجراءات.', 
               'Thank you for trusting PayNex. One of our agents will contact you shortly to confirm your installment details and start the process.')}
          </p>

          {orderId && (
            <div className="bg-slate-50 p-4 rounded-xl mb-8 border border-dashed border-slate-300">
              <p className="text-sm text-slate-500 font-bold">{t('رقم طلبك:', 'Your Order ID:')}</p>
              <p className="text-2xl font-mono font-black text-[#0f2460]">{orderId}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center justify-center gap-2 bg-slate-100 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              <Home size={18} /> {t('الرئيسية', 'Home')}
            </button>
            <button 
              onClick={() => navigate('/products')} 
              className="flex items-center justify-center gap-2 bg-[#0f2460] text-white py-3 rounded-xl font-bold hover:bg-[#1a3a8a] transition"
            >
              <ShoppingBag size={18} /> {t('متابعة التسوق', 'Continue')}
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
               }
            
