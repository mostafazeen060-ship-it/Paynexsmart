import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, Filter, Lock, Star, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, updateOrder, addNotification } from '@/lib/storage';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { calculateCreditScore, getCreditRiskLabel, getCreditRiskColor } from '@/lib/creditScore';
import { logOrderStatusChange } from '@/lib/auditLog';
import type { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';

// All statuses in the new workflow
const WORKFLOW_STATUSES: { value: OrderStatus; labelAr: string; labelEn: string; color: string }[] = [
  { value: 'pending',        labelAr: 'قيد الانتظار',              labelEn: 'Pending',       color: 'bg-slate-100 text-slate-700' },
  { value: 'under-inquiry',  labelAr: 'جاري الاستعلام الميداني',   labelEn: 'Under Inquiry', color: 'bg-blue-100 text-blue-700' },
  { value: 'admin-review',   labelAr: 'مراجعة المدير',             labelEn: 'Admin Review',  color: 'bg-purple-100 text-purple-700' },
  { value: 'approved',       labelAr: 'موافقة نهائية',             labelEn: 'Approved',      color: 'bg-green-100 text-green-700' },
  { value: 'delivered',      labelAr: 'تم التسليم',               labelEn: 'Delivered',     color: 'bg-teal-100 text-teal-700' },
  { value: 'rejected',       labelAr: 'مرفوض',                   labelEn: 'Rejected',      color: 'bg-red-100 text-red-700' },
];

const FILTER_STATUSES = [{ value: 'all', labelAr: 'الكل', labelEn: 'All' }, ...WORKFLOW_STATUSES.map(s => ({ value: s.value, labelAr: s.labelAr, labelEn: s.labelEn }))];

export default function AdminOrders() {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [changeStatusTo, setChangeStatusTo] = useState<OrderStatus>('pending');
  const [installmentOverride, setInstallmentOverride] = useState({ months: 0, downPayment: 0 });
  const [showOverride, setShowOverride] = useState(false);

  useEffect(() => { setOrders(getOrders()); }, []);
  function reload() { setOrders(getOrders()); }

  function openOrder(o: Order) {
    setSelected(o);
    setChangeStatusTo(o.status);
    setRejectionReason('');
    setShowOverride(false);
    setInstallmentOverride({
      months: o.installmentPlan.months,
      downPayment: o.installmentPlan.downPayment,
    });
  }

  function handleChangeStatus(orderId: string, newStatus: OrderStatus) {
    // Rejection reason is now optional/internal — no longer required
    const updates: Partial<Order> = { status: newStatus };
    if (newStatus === 'rejected' && rejectionReason.trim()) updates.rejectionReason = rejectionReason; // Store internally only
    if (newStatus === 'approved') updates.approvedAt = new Date().toISOString();
    if (newStatus === 'delivered') updates.deliveredAt = new Date().toISOString();

    // Log to audit trail
    const oldOrder = orders.find(o => o.id === orderId);
    if (oldOrder && user) {
      logOrderStatusChange(user.id, user.name, 'admin', orderId, oldOrder.status, newStatus, rejectionReason);
    }

    updateOrder(orderId, updates);
    toast.success(t('تم تغيير حالة الطلب بنجاح', 'Order status updated'));
    reload();
    setSelected(null);
    setRejectionReason('');
  }

  function handleInstallmentOverride(orderId: string) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const updatedPlan = {
      ...order.installmentPlan,
      months: installmentOverride.months || order.installmentPlan.months,
      downPayment: installmentOverride.downPayment ?? order.installmentPlan.downPayment,
    };
    updateOrder(orderId, { installmentPlan: updatedPlan });
    toast.success(t('تم تعديل شروط التقسيط', 'Installment terms updated'));
    reload();
    setShowOverride(false);
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customerName.includes(search) || o.id.includes(search) || o.customerPhone.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingReview = orders.filter(o => o.status === 'admin-review').length;

  return (
    <div className="space-y-5">
      {/* Admin-only banner */}
      <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-3 flex items-center gap-2 text-sm text-[#0f2460]">
        <Lock size={15} className="text-[#d4a339] flex-shrink-0" />
        <span>{t('صلاحية الموافقة النهائية وتغيير حالة الطلب حصرية للمدير العام — المشرفون لا يملكون هذه الصلاحية', 'Final approval & status change is exclusive to Super Admin — supervisors cannot change final status')}</span>
      </div>

      {/* Pending review alert */}
      {pendingReview > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2 text-sm text-purple-800">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <strong>{pendingReview}</strong>
          {t(' طلبات تنتظر مراجعتك النهائية', ' orders awaiting your final review')}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('بحث بالاسم أو رقم الطلب أو الهاتف...', 'Search by name, order ID or phone...')}
            className="input-field ps-9 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-auto">
          {FILTER_STATUSES.map(o => <option key={o.value} value={o.value}>{lang === 'ar' ? o.labelAr : o.labelEn}</option>)}
        </select>
        <button onClick={reload} className="btn-outline flex items-center gap-2 text-sm px-4">
          <RefreshCw size={15} />
          {t('تحديث', 'Refresh')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-[#0f2460]">{t('الطلبات', 'Orders')} ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[t('رقم الطلب', '#'), t('العميل', 'Customer'), t('المنتج', 'Product'),
                  t('المحافظة', 'Province'), t('القسط', 'Monthly'), t('تقييم الائتمان', 'Credit'), t('الحالة', 'Status'), ''].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(o => {
                const credit = o.creditScore;
                return (
                  <tr key={o.id} className={`hover:bg-slate-50 ${o.status === 'admin-review' ? 'bg-purple-50/40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{o.id.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-slate-400">{o.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[130px] truncate">
                      {lang === 'ar' ? o.product.nameAr : o.product.nameEn}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.customerProvince}</td>
                    <td className="px-4 py-3 font-bold text-[#0f2460]">{formatCurrency(o.installmentPlan.monthlyPayment, lang)}</td>
                    <td className="px-4 py-3">
                      {credit ? (
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getCreditRiskColor(credit.risk)}`}>
                          {credit.score} — {getCreditRiskLabel(credit.risk, lang)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{t('لم يُحسب', 'N/A')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOrderStatusColor(o.status)}`}>
                        {getOrderStatusLabel(o.status, lang)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openOrder(o)}
                        className="w-8 h-8 rounded-lg bg-[#0f2460]/10 hover:bg-[#0f2460] text-[#0f2460] hover:text-white flex items-center justify-center transition-all">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">{t('لا توجد طلبات', 'No orders found')}</div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0f2460] text-lg">{t('تفاصيل الطلب', 'Order Details')}</h3>
                <p className="text-xs text-slate-400">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">✕</button>
            </div>
            <div className="p-5 space-y-5">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: t('الاسم', 'Name'), v: selected.customerName },
                  { label: t('الهاتف', 'Phone'), v: selected.customerPhone },
                  { label: t('البريد', 'Email'), v: selected.customerEmail || '—' },
                  { label: t('الرقم القومي', 'National ID'), v: '***' + selected.customerNationalId.slice(-4) },
                  { label: t('المحافظة', 'Province'), v: selected.customerProvince },
                  { label: t('الوظيفة', 'Job'), v: selected.customerJob },
                  { label: t('العنوان', 'Address'), v: selected.customerAddress },
                  { label: t('تاريخ الطلب', 'Date'), v: formatDate(selected.createdAt, lang) },
                ].map(item => (
                  <div key={item.label}><p className="text-xs text-slate-400">{item.label}</p><p className="font-medium text-slate-800">{item.v}</p></div>
                ))}
              </div>

              {/* Installment Plan */}
              <div className="bg-[#0f2460]/5 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm text-center">
                {[
                  { label: t('القسط الشهري', 'Monthly'), v: formatCurrency(selected.installmentPlan.monthlyPayment, lang), highlight: true },
                  { label: t('المدة', 'Duration'), v: `${selected.installmentPlan.months} ${t('شهر', 'mo')}` },
                  { label: t('الإجمالي', 'Total'), v: formatCurrency(selected.installmentPlan.totalAmount, lang) },
                  { label: t('المقدم', 'Down Payment'), v: formatCurrency(selected.installmentPlan.downPayment, lang) },
                  { label: t('الفائدة', 'Interest'), v: `${selected.installmentPlan.interestRate}%` },
                  { label: t('رسوم الاستعلام', 'Inquiry'), v: formatCurrency(selected.installmentPlan.inquiryFee, lang) },
                ].map(item => (
                  <div key={item.label} className={item.highlight ? 'bg-[#0f2460] text-white rounded-lg p-2' : ''}>
                    <p className={`text-xs ${item.highlight ? 'text-white/70' : 'text-slate-400'}`}>{item.label}</p>
                    <p className={`font-bold ${item.highlight ? 'text-[#d4a339] text-lg' : 'text-slate-800'}`}>{item.v}</p>
                  </div>
                ))}
              </div>

              {/* Credit Score */}
              {selected.creditScore && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      <Star size={15} className="text-[#d4a339]" />
                      {t('تقييم الائتمان الداخلي', 'Internal Credit Score')}
                    </h4>
                    <span className={`text-sm px-3 py-1 rounded-full border font-bold ${getCreditRiskColor(selected.creditScore.risk)}`}>
                      {selected.creditScore.score}/100 — {getCreditRiskLabel(selected.creditScore.risk, lang)}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selected.creditScore.risk === 'low' ? 'bg-green-500' :
                        selected.creditScore.risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${selected.creditScore.score}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selected.creditScore.factors.map(f => (
                      <div key={f.name} className="flex justify-between bg-slate-50 rounded-lg px-2 py-1.5">
                        <span className="text-slate-500">{f.nameAr}</span>
                        <span className="font-bold text-[#0f2460]">{f.value}/{f.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {Object.entries(selected.documents).some(([k, v]) => k !== 'uploadedAt' && k !== 'uploadedGps' && v) && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText size={15} className="text-[#d4a339]" />
                    {t('المستندات المرفوعة', 'Uploaded Documents')}
                    {selected.documents.uploadedGps && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">GPS ✓</span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selected.documents)
                      .filter(([k]) => !['uploadedAt', 'uploadedGps'].includes(k))
                      .map(([key, url]) => url ? (
                        <div key={key}>
                          <p className="text-xs text-slate-500 mb-1">{key}</p>
                          <img src={url as string} alt={key} className="w-full h-28 object-cover rounded-xl border" />
                        </div>
                      ) : null)}
                  </div>
                </div>
              )}

              {/* Admin Override — Installment Terms */}
              <div className="border border-[#d4a339]/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-[#0f2460] flex items-center gap-2 text-sm">
                    <Lock size={14} className="text-[#d4a339]" />
                    {t('تعديل شروط التقسيط — صلاحية المدير', 'Override Installment Terms — Admin Only')}
                  </h4>
                  <button onClick={() => setShowOverride(!showOverride)} className="text-xs text-[#0f2460] underline">
                    {showOverride ? t('إغلاق', 'Close') : t('تعديل', 'Modify')}
                  </button>
                </div>
                {showOverride && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t('عدد الشهور', 'Months')}</label>
                      <input type="number" value={installmentOverride.months}
                        onChange={e => setInstallmentOverride(p => ({ ...p, months: Number(e.target.value) }))}
                        className="input-field text-sm" min={1} max={60} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t('المقدم (ج.م)', 'Down Payment (EGP)')}</label>
                      <input type="number" value={installmentOverride.downPayment}
                        onChange={e => setInstallmentOverride(p => ({ ...p, downPayment: Number(e.target.value) }))}
                        className="input-field text-sm" min={0} />
                    </div>
                    <button onClick={() => handleInstallmentOverride(selected.id)}
                      className="col-span-2 btn-gold text-sm py-2">{t('حفظ التعديلات', 'Save Changes')}</button>
                  </div>
                )}
              </div>

              {/* Status Change — Admin Exclusive */}
              <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={15} className="text-[#d4a339]" />
                  <h4 className="font-semibold text-[#0f2460] text-sm">
                    {t('تغيير حالة الطلب — قرار المدير العام', 'Change Status — Super Admin Decision')}
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {WORKFLOW_STATUSES.map(s => (
                    <button key={s.value} onClick={() => setChangeStatusTo(s.value)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all text-start px-3 ${
                        changeStatusTo === s.value
                          ? 'border-[#0f2460] bg-[#0f2460] text-white'
                          : 'border-slate-200 text-slate-600 hover:border-[#0f2460]'
                      }`}>
                      {lang === 'ar' ? s.labelAr : s.labelEn}
                    </button>
                  ))}
                </div>

                {changeStatusTo === 'rejected' && (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-2 flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span>
                      <span>{t('سبب الرفض سيبقى داخلياً للسجلات فقط — العميل لن يرى السبب بشكل صريح', 'Rejection reason stays internal (records only) — customer receives a general non-approval message')}</span>
                    </div>
                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                      className="input-field resize-none text-sm mb-3" rows={2}
                      placeholder={t('سبب الرفض الداخلي (للسجل فقط — غير مرئي للعميل)', 'Internal rejection reason (records only — not visible to customer)')} />
                  </>
                )}

                <div className="flex gap-3">
                  <button onClick={() => handleChangeStatus(selected.id, changeStatusTo)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                    <CheckCircle size={15} />
                    {t('تطبيق القرار', 'Apply Decision')}
                  </button>
                  <button onClick={() => setSelected(null)} className="btn-outline px-4 text-sm">
                    {t('إغلاق', 'Close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
