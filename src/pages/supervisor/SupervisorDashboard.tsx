import { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle, Target, TrendingUp, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getOrdersBySupervisor, getSupervisors } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order, Supervisor } from '@/types';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const { t, lang } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);

  useEffect(() => {
    if (!user) return;
    setOrders(getOrdersBySupervisor(user.id));
    const sup = getSupervisors().find(s => s.id === user.id);
    setSupervisor(sup ?? null);
  }, [user]);

  const pending = orders.filter(o => o.status === 'pending' || o.status === 'under-review');
  const approved = orders.filter(o => o.status === 'approved');
  const targetPct = supervisor ? Math.min(Math.round((orders.length / supervisor.target) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      {/* Lock Warning */}
      {supervisor?.isLocked && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3">
          <Lock size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">{t('حسابك مقفل — عهدة غير مسلّمة', 'Account Locked — Unsettled Custody')}</p>
            <p className="text-red-600 text-sm mt-1">
              {t('تواصل مع المدير العام لتسوية العهدة وفتح حسابك. لا يمكنك تسجيل حضور جديد حتى يتم التسوية.',
                'Contact the Super Admin to settle your custody and unlock your account.')}
            </p>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="gradient-hero rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-black mb-1">{t(`مرحباً، ${user?.name}`, `Welcome, ${user?.name}`)}</h2>
        <p className="text-white/70">
          {supervisor ? t(`مشرف محافظة ${supervisor.province}`, `Province Supervisor`) : t('لوحة التحكم', 'Dashboard')}
        </p>
        {supervisor && (
          <div className="mt-4 text-sm text-white/80">
            {t(`ساعات العمل: ${supervisor.workHoursStart} - ${supervisor.workHoursEnd}`, `Work hours: ${supervisor.workHoursStart} - ${supervisor.workHoursEnd}`)}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('إجمالي الطلبات', 'Total Orders'), value: orders.length, icon: <ShoppingBag size={20} />, color: 'bg-blue-500' },
          { label: t('قيد المراجعة', 'Pending'), value: pending.length, icon: <Clock size={20} />, color: 'bg-yellow-500' },
          { label: t('معتمدة', 'Approved'), value: approved.length, icon: <CheckCircle size={20} />, color: 'bg-green-500' },
          { label: t('التارجت', 'Target'), value: `${targetPct}%`, icon: <Target size={20} />, color: 'bg-[#d4a339]' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-white mb-3`}>{s.icon}</div>
            <div className="text-2xl font-black text-[#0f2460]">{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Target Progress */}
      {supervisor && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#0f2460] flex items-center gap-2">
              <Target size={16} className="text-[#d4a339]" />
              {t('التارجت الشهري', 'Monthly Target')}
            </h3>
            <span className="badge-gold">{orders.length}/{supervisor.target} {t('طلب', 'orders')}</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${targetPct >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-[#0f2460] to-[#d4a339]'}`}
              style={{ width: `${targetPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0</span>
            <span className="font-bold text-[#0f2460]">{targetPct}%</span>
            <span>{supervisor.target}</span>
          </div>
          {targetPct >= 100 && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-green-800 text-sm font-medium text-center">
              🎉 {t('تهانينا! لقد حققت التارجت الشهري', 'Congratulations! You achieved the monthly target')}
            </div>
          )}
        </div>
      )}

      {/* Wallet Summary */}
      {supervisor && (
        <div className="bg-gradient-to-r from-[#0f2460] to-[#1a368e] rounded-2xl p-5 text-white">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#d4a339]" />
            {t('ملخص المحفظة', 'Wallet Summary')}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('رسوم الاستعلام', 'Inquiry Fees'), value: supervisor.wallet.totalFees },
              { label: t('أقساط محصّلة', 'Collected'), value: supervisor.wallet.totalInstallmentsCollected },
              { label: t('إجمالي الرصيد', 'Total Balance'), value: supervisor.wallet.totalBalance },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-xs text-white/60 mb-1">{item.label}</div>
                <div className="font-bold text-[#d4a339]">{formatCurrency(item.value, lang)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-[#0f2460]">{t('أحدث الطلبات', 'Recent Orders')}</h3>
        </div>
        {orders.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <ShoppingBag size={40} className="mx-auto mb-2 opacity-30" />
            <p>{t('لا توجد طلبات بعد', 'No orders yet')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{o.customerName}</div>
                  <div className="text-xs text-slate-400">{lang === 'ar' ? o.product.nameAr : o.product.nameEn}</div>
                </div>
                <div className="text-end">
                  <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'approved' ? 'status-approved' : o.status === 'rejected' ? 'status-pending' : 'status-reviewing'}`}>
                    {o.status}
                  </span>
                  <div className="text-xs text-slate-400 mt-0.5">{formatDate(o.createdAt, lang)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
