import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Users, TrendingUp, DollarSign, Clock, CheckCircle,
  RefreshCw, AlertTriangle, Lock, Star, Activity, Package,
  BarChart2, FileJson, ChevronRight
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  getOrders, getSupervisors, getProducts,
  checkAndAutoLockSupervisors, getLastScraperImport,
  type ScraperImportRecord,
} from '@/lib/storage';
import { formatCurrency, formatDate, hoursSince } from '@/lib/utils';
import { MOCK_ANALYTICS } from '@/constants/data';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { t, lang, settings } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState(getOrders());
  const [supervisors, setSupervisors] = useState(getSupervisors());
  const [products] = useState(getProducts());
  const [lastSync, setLastSync] = useState<ScraperImportRecord | null>(null);

  useEffect(() => {
    checkAndAutoLockSupervisors();
    setSupervisors(getSupervisors());
    setLastSync(getLastScraperImport());
  }, []);

  const stats = {
    total:       orders.length,
    pending:     orders.filter(o => ['pending', 'under-inquiry', 'admin-review'].includes(o.status)).length,
    adminReview: orders.filter(o => o.status === 'admin-review').length,
    approved:    orders.filter(o => ['approved', 'delivered'].includes(o.status)).length,
    rejected:    orders.filter(o => o.status === 'rejected').length,
    revenue:     orders.filter(o => ['approved', 'delivered'].includes(o.status)).reduce((s, o) => s + o.installmentPlan.totalAmount, 0),
    lockedSupervisors: supervisors.filter(s => s.isLocked).length,
    pendingDebt:       supervisors.reduce((s, sup) => s + (sup.pendingDebt ?? 0), 0),
  };

  const statCards = [
    {
      label: t('إجمالي الطلبات', 'Total Orders'),
      value: stats.total,
      icon: <ShoppingBag size={22} />,
      color: 'bg-blue-500',
      sub: `+${stats.pending} ${t('منتظر', 'pending')}`,
      onClick: () => navigate('/admin/orders'),
    },
    {
      label: t('تنتظر مراجعتك', 'Awaiting Review'),
      value: stats.adminReview,
      icon: <Clock size={22} />,
      color: 'bg-purple-500',
      alert: stats.adminReview > 0,
      onClick: () => navigate('/admin/orders'),
    },
    {
      label: t('الطلبات المعتمدة', 'Approved'),
      value: stats.approved,
      icon: <CheckCircle size={22} />,
      color: 'bg-green-500',
      sub: `${stats.rejected} ${t('مرفوض', 'rejected')}`,
    },
    {
      label: t('الإيرادات المتوقعة', 'Expected Revenue'),
      value: formatCurrency(stats.revenue, lang),
      icon: <DollarSign size={22} />,
      color: 'bg-[#d4a339]',
      onClick: () => navigate('/admin/analytics'),
    },
    {
      label: t('المشرفون النشطون', 'Active Supervisors'),
      value: supervisors.filter(s => s.isActive && !s.isLocked).length,
      icon: <Users size={22} />,
      color: 'bg-[#0f2460]',
      sub: stats.lockedSupervisors > 0 ? `${stats.lockedSupervisors} ${t('مقفل', 'locked')}` : '',
      onClick: () => navigate('/admin/supervisors'),
    },
    {
      label: t('عهد مستحقة اليوم', 'Pending Debt Today'),
      value: formatCurrency(stats.pendingDebt, lang),
      icon: <DollarSign size={22} />,
      color: stats.pendingDebt > 0 ? 'bg-orange-500' : 'bg-slate-400',
      onClick: () => navigate('/admin/wallets'),
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Alert: Locked Supervisors ── */}
      {stats.lockedSupervisors > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <Lock size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-800 text-sm">
              {stats.lockedSupervisors} {t('حساب مشرف مقفل بسبب تأخر تسليم العهدة', 'supervisor account(s) locked — delayed custody settlement')}
            </p>
            <button onClick={() => navigate('/admin/wallets')} className="text-red-600 text-xs underline mt-0.5">
              {t('إدارة المحافظ والعهد', 'Manage Wallets & Custody')}
            </button>
          </div>
        </div>
      )}

      {/* ── Alert: Admin Review ── */}
      {stats.adminReview > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-purple-600" />
            <span className="text-purple-800 text-sm font-semibold">
              {stats.adminReview} {t('طلبات جاهزة لقرارك النهائي', 'orders ready for your final decision')}
            </span>
          </div>
          <button onClick={() => navigate('/admin/orders')} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
            {t('مراجعة الآن', 'Review Now')}
          </button>
        </div>
      )}

      {/* ── Sync Status Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${lastSync ? 'bg-green-100' : 'bg-slate-100'}`}>
              <FileJson size={18} className={lastSync ? 'text-green-600' : 'text-slate-400'} />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-sm">
                {t('مزامنة منتجات BTech', 'BTech Products Sync')}
              </p>
              {lastSync ? (
                <p className="text-slate-500 text-xs">
                  {t('آخر استيراد:', 'Last import:')} {new Date(lastSync.importedAt).toLocaleString(lang === 'ar' ? 'ar-EG' : undefined)}
                  {' · '}
                  <span className="text-green-600 font-medium">+{lastSync.added}</span> {t('جديد', 'new')}
                  {' · '}
                  <span className="text-blue-500 font-medium">{lastSync.updated}</span> {t('محدَّث', 'updated')}
                  {lastSync.failed > 0 && (
                    <span className="text-red-500 font-medium"> · {lastSync.failed} {t('فشل', 'failed')}</span>
                  )}
                </p>
              ) : (
                <p className="text-slate-400 text-xs">{t('لم يتم الاستيراد بعد', 'No import done yet')}</p>
              )}
              {settings.syncErrorMessage && (
                <p className="text-red-500 text-xs mt-0.5">⚠️ {settings.syncErrorMessage}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/products')}
            className="btn-outline text-sm flex items-center gap-2 flex-shrink-0"
          >
            <RefreshCw size={15} />
            {t('استيراد منتجات', 'Import Products')}
          </button>
        </div>

        {/* Sync mini-stats */}
        {lastSync && (
          <div className="grid grid-cols-4 border-t border-slate-50">
            {[
              { label: t('في الملف', 'In File'), value: lastSync.totalInFile, color: 'text-slate-700' },
              { label: t('منتجات جديدة', 'New'), value: lastSync.added, color: 'text-green-600' },
              { label: t('محدَّثة', 'Updated'), value: lastSync.updated, color: 'text-blue-500' },
              { label: t('فشل', 'Failed'), value: lastSync.failed, color: lastSync.failed > 0 ? 'text-red-500' : 'text-slate-300' },
            ].map(s => (
              <div key={s.label} className="text-center py-3 border-e border-slate-50 last:border-0">
                <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <div
            key={i}
            className={`stat-card ${s.alert ? 'border-2 border-purple-300' : ''} ${s.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={s.onClick}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center text-white`}>{s.icon}</div>
              <div className="flex items-center gap-1">
                {s.alert && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold animate-pulse">!</span>}
                {s.onClick && <ChevronRight size={14} className="text-slate-300" />}
              </div>
            </div>
            <div className="text-2xl font-black text-[#0f2460]">{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
            {s.sub && <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Province Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0f2460]">{t('الطلبات حسب المحافظة', 'Orders by Province')}</h3>
            <BarChart2 size={16} className="text-slate-300" />
          </div>
          <div className="space-y-3">
            {MOCK_ANALYTICS.ordersByProvince.map((item, i) => {
              const max = Math.max(...MOCK_ANALYTICS.ordersByProvince.map(x => x.count));
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{item.province}</span>
                    <span className="text-[#0f2460] font-bold">{item.count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0f2460] to-[#d4a339] rounded-full transition-all duration-700"
                      style={{ width: `${(item.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supervisor Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0f2460]">{t('أداء المشرفين', 'Supervisor Performance')}</h3>
            <button onClick={() => navigate('/admin/supervisor-activity')} className="text-xs text-[#0f2460] hover:underline flex items-center gap-1">
              {t('التفاصيل', 'Details')} <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-4">
            {supervisors.slice(0, 5).map((sup, i) => {
              const supOrders = orders.filter(o => o.supervisorId === sup.id);
              const targetPct = sup.target > 0 ? Math.min(100, Math.round((supOrders.length / sup.target) * 100)) : 0;
              return (
                <div key={sup.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0f2460] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 truncate">{sup.name}</span>
                      <span className="text-xs text-[#0f2460] flex-shrink-0 ms-2">{supOrders.length}/{sup.target}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${targetPct >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-[#0f2460] to-[#d4a339]'}`}
                        style={{ width: `${targetPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {targetPct >= 100 && <Star size={14} className="text-[#d4a339]" />}
                    {sup.isLocked && <Lock size={14} className="text-red-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-[#0f2460]">{t('أحدث الطلبات', 'Latest Orders')}</h3>
          <button onClick={() => navigate('/admin/orders')} className="text-sm text-[#0f2460] font-medium hover:underline flex items-center gap-1">
            {t('عرض الكل', 'View All')} <ChevronRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[t('العميل', 'Customer'), t('المنتج', 'Product'), t('المحافظة', 'Province'), t('الحالة', 'Status'), t('الإجمالي', 'Total')].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.slice(0, 5).map(o => (
                <tr key={o.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate('/admin/orders')}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customerName}</div>
                    <div className="text-xs text-slate-400">{o.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">
                    {lang === 'ar' ? o.product.nameAr : o.product.nameEn}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.customerProvince}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      o.status === 'approved' || o.status === 'delivered' ? 'status-approved' :
                      o.status === 'rejected' ? 'status-rejected' :
                      o.status === 'admin-review' ? 'bg-purple-100 text-purple-700' :
                      'status-reviewing'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#0f2460]">
                    {formatCurrency(o.installmentPlan.totalAmount, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">{t('لا توجد طلبات بعد', 'No orders yet')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
