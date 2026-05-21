import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, CheckCircle, XCircle, FileText, AlertCircle, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getOrderById } from '@/lib/storage'; // تأكد من توفر هذه الدالة
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import type { Order } from '@/types';

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const { t, lang } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (orderId) {
      const found = getOrderById(orderId);
      setOrder(found || null);
    }
  }, [orderId, user, navigate]);

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold">{t('الطلب غير موجود', 'Order not found')}</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-[#0f2460] underline">{t('العودة للرئيسية', 'Back to home')}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-black text-[#0f2460]">{t('تفاصيل الطلب', 'Order Details')}</h1>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getOrderStatusColor(order.status)}`}>
              {getOrderStatusLabel(order.status, t)}
            </span>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
              <Package size={40} className="text-[#d4a339]" />
              <div>
                <p className="text-slate-500 text-sm">{t('رقم الطلب', 'Order ID')}</p>
                <p className="font-mono font-bold text-lg">{order.id}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between mb-2">
                <span className="text-slate-600">{t('المنتج', 'Product')}</span>
                <span className="font-bold">{order.productName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-600">{t('خطة التقسيط', 'Installment Plan')}</span>
                <span className="font-bold">{order.months} {t('شهر', 'months')}</span>
              </div>
              <div className="flex justify-between pt-4 border-t">
                <span className="text-lg font-bold">{t('الإجمالي', 'Total')}</span>
                <span className="text-xl font-black text-[#0f2460]">{formatCurrency(order.totalAmount, lang)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
