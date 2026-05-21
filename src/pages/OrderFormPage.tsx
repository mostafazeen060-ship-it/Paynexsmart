import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InstallmentCalculator from '@/components/features/InstallmentCalculator';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, addOrder, getSupervisorByProvince } from '@/lib/storage';
import { calculateInstallment } from '@/lib/installment';
import { formatCurrency, generateId } from '@/lib/utils';
import { PROVINCES } from '@/constants/data';
import type { Product, Order, InstallmentPlan } from '@/types';
import { toast } from 'sonner';

type Step = 'info' | 'plan' | 'done';

export default function OrderFormPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const { t, lang } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<Step>('info');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  const [plan, setPlan] = useState<InstallmentPlan>(() =>
    calculateInstallment({
      productPrice: 0,
      downPayment: Number(searchParams.get('down') ?? 0),
      months: Number(searchParams.get('months') ?? 12),
    })
  );

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    nationalId: '',
    province: '',
    address: '',
    job: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = getProducts().find(pr => pr.id === productId);
    if (!p) { navigate('/products'); return; }
    setProduct(p);
    setPlan(calculateInstallment({
      productPrice: p.price,
      downPayment: Number(searchParams.get('down') ?? 0),
      months: Number(searchParams.get('months') ?? 12),
    }));
  }, [productId, navigate, searchParams]);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name, email: user.email ?? '', phone: user.phone ?? '' }));
  }, [user]);

  function validateInfo() {
    const errs: Record<string, string> = {};
    if (!form.name.trim())                         errs.name       = t('الاسم مطلوب', 'Name is required');
    if (!form.phone.match(/^01[0-9]{9}$/))         errs.phone      = t('رقم هاتف غير صحيح', 'Invalid phone number');
    if (!form.nationalId.match(/^[0-9]{14}$/))     errs.nationalId = t('الرقم القومي يجب أن يكون 14 رقماً', 'National ID must be 14 digits');
    if (!form.province)                            errs.province   = t('المحافظة مطلوبة', 'Province is required');
    if (!form.address.trim())                      errs.address    = t('العنوان مطلوب', 'Address is required');
    if (!form.job.trim())                          errs.job        = t('الوظيفة مطلوبة', 'Job is required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmitOrder() {
    if (!product || !user) return;

    const supervisor = getSupervisorByProvince(form.province);

    const orderBase = {
      customerId: user.id,
      customerName: form.name,
      customerPhone: form.phone,
      customerNationalId: form.nationalId,
      customerEmail: form.email,
      customerProvince: form.province,
      customerAddress: form.address,
      customerJob: form.job,
      productId: product.id,
      product,
      installmentPlan: plan,
      status: 'pending' as const,
      supervisorId: supervisor?.id,
      documents: {},
    };

    // Auto-compute credit score for admin view
    const { calculateCreditScore } = await import('@/lib/creditScore');
    const creditScore = calculateCreditScore({ ...orderBase, id: '', createdAt: '', updatedAt: '' } as any);

    const order = addOrder({ ...orderBase, creditScore });
    setSubmittedOrder(order);
    setStep('done');
    toast.success(t('تم إرسال طلبك بنجاح!', 'Order submitted successfully!'));
  }

  if (!product) return null;

  const provincesList = PROVINCES.map(p => ({ value: p.id, label: lang === 'ar' ? p.nameAr : p.nameEn }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Progress */}
        {step !== 'done' && (
          <div className="flex items-center justify-center mb-8">
            {[
              { key: 'info', label: t('البيانات', 'Info') },
              { key: 'plan', label: t('خطة التقسيط', 'Plan') },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`flex flex-col items-center ${i > 0 ? 'ms-4' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    ['info', 'plan'].indexOf(step) >= i ? 'bg-[#0f2460] text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {['info', 'plan'].indexOf(step) > i ? <CheckCircle size={20} /> : i + 1}
                  </div>
                  <span className="text-xs mt-1 text-slate-500">{s.label}</span>
                </div>
                {i < 1 && <div className="w-16 h-0.5 bg-slate-200 mb-4 mx-2" />}
              </div>
            ))}
          </div>
        )}

        {/* Product Summary */}
        {step !== 'done' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex gap-4">
            <img src={product.images[0]} alt={product.nameAr} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="font-bold text-[#0f2460]">{lang === 'ar' ? product.nameAr : product.nameEn}</div>
              <div className="text-[#d4a339] font-bold">{formatCurrency(product.price, lang)}</div>
            </div>
            {plan.monthlyPayment > 0 && (
              <div className="text-end">
                <div className="installment-badge">{plan.months} {t('شهر', 'mo')}</div>
                <div className="text-xs text-slate-500 mt-1">{formatCurrency(plan.monthlyPayment, lang)}/{t('شهر', 'mo')}</div>
              </div>
            )}
          </div>
        )}

        {/* Inquiry fee notice */}
        {step !== 'done' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 text-yellow-800 text-sm font-medium">
            ⚠️ {t(
              `تطبق رسوم استعلام تدفع عند توقيع طلب التقسيط ورفع المستندات — قيمتها: ${formatCurrency(plan.inquiryFee || 150, 'ar')}`,
              `Inquiry fees of ${formatCurrency(plan.inquiryFee || 150, 'en')} apply when signing the installment application and uploading documents`
            )}
          </div>
        )}

        {/* STEP 1: Personal Info */}
        {step === 'info' && (
          <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-[#0f2460] mb-6">{t('البيانات الشخصية', 'Personal Information')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { field: 'name',       label: t('الاسم الكامل', 'Full Name'),        type: 'text',  placeholder: t('أحمد محمد علي', 'Ahmed Mohamed Ali') },
                { field: 'email',      label: t('البريد الإلكتروني', 'Email'),        type: 'email', placeholder: 'example@email.com' },
                { field: 'phone',      label: t('رقم الهاتف', 'Phone Number'),        type: 'tel',   placeholder: '01xxxxxxxxx' },
                { field: 'nationalId', label: t('الرقم القومي', 'National ID'),       type: 'text',  placeholder: '14 رقم', maxLength: 14 },
                { field: 'job',        label: t('الوظيفة', 'Job Title'),              type: 'text',  placeholder: t('مهندس، محاسب...', 'Engineer, Accountant...') },
              ].map(({ field, label, type, placeholder, maxLength }) => (
                <div key={field}>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`input-field ${errors[field] ? 'border-red-400' : ''}`}
                  />
                  {errors[field] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />{errors[field]}
                    </p>
                  )}
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('المحافظة', 'Province')}</label>
                <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                  className={`input-field ${errors.province ? 'border-red-400' : ''}`}>
                  <option value="">{t('اختر المحافظة', 'Select Province')}</option>
                  {provincesList.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('العنوان بالتفصيل', 'Detailed Address')}</label>
                <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder={t('الشارع، الحي، المنطقة...', 'Street, Neighborhood, Area...')}
                  rows={3} className={`input-field resize-none ${errors.address ? 'border-red-400' : ''}`} />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
            </div>
            <button onClick={() => { if (validateInfo()) setStep('plan'); }} className="btn-primary w-full mt-6">
              {t('التالي: خطة التقسيط', 'Next: Installment Plan')}
            </button>
          </div>
        )}

        {/* STEP 2: Plan */}
        {step === 'plan' && (
          <div className="animate-fade-in">
            <InstallmentCalculator productPrice={product.price} onPlanSelected={p => setPlan(p)} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('info')} className="btn-outline flex-1">{t('العودة', 'Back')}</button>
              <button onClick={handleSubmitOrder} className="btn-gold flex-1">{t('إرسال الطلب', 'Submit Order')}</button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && submittedOrder && (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-[#0f2460] mb-3">{t('تم إرسال طلبك بنجاح!', 'Order Submitted!')}</h2>
            <p className="text-slate-600 mb-2">
              {t('رقم الطلب:', 'Order ID:')} <strong className="text-[#0f2460] font-mono text-sm">{submittedOrder.id}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800 text-start">
              <p className="font-semibold mb-1">📋 {t('الخطوات التالية:', 'Next Steps:')}</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>{t('سيتواصل معك مشرف المحافظة خلال 24-48 ساعة', 'Province supervisor will contact you within 24-48 hours')}</li>
                <li>{t('ستحتاج إلى دفع رسوم الاستعلام للمشرف', 'You will pay the inquiry fee to the supervisor')}</li>
                <li>{t('سيرفع المشرف المستندات المطلوبة', 'Supervisor will upload required documents')}</li>
                <li>{t('المدير العام يراجع ويتخذ القرار النهائي', 'Super Admin reviews and makes final decision')}</li>
              </ol>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate(`/order-status/${submittedOrder.id}`)} className="btn-primary">
                {t('تتبع الطلب', 'Track Order')}
              </button>
              <button onClick={() => navigate('/')} className="btn-outline">{t('الرئيسية', 'Home')}</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
