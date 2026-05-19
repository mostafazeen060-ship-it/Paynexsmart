import { MOCK_ANALYTICS } from '@/constants/data';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';

export default function AdminAnalytics() {
  const { t, lang } = useApp();
  const a = MOCK_ANALYTICS;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('إجمالي الطلبات', 'Total Orders'), value: a.totalOrders, color: 'bg-blue-500' },
          { label: t('الإيرادات', 'Revenue'), value: formatCurrency(a.totalRevenue, lang), color: 'bg-[#d4a339]' },
          { label: t('العملاء', 'Customers'), value: a.totalCustomers, color: 'bg-green-500' },
          { label: t('معدل الموافقة', 'Approval Rate'), value: `${Math.round((a.approvedOrders / a.totalOrders) * 100)}%`, color: 'bg-[#0f2460]' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-white mb-3`}>
              <span className="text-lg font-bold">{i + 1}</span>
            </div>
            <div className="text-2xl font-black text-[#0f2460]">{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-bold text-[#0f2460] mb-5">{t('الاتجاه الشهري', 'Monthly Trend')}</h3>
        <div className="flex items-end gap-3 h-40">
          {a.monthlyTrend.map((m, i) => {
            const max = Math.max(...a.monthlyTrend.map(x => x.orders));
            const h = (m.orders / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-[#0f2460]">{m.orders}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0f2460] to-[#d4a339] transition-all duration-700" style={{ height: `${h}%` }} />
                <span className="text-xs text-slate-400 truncate w-full text-center">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Province */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-bold text-[#0f2460] mb-4">{t('الطلبات حسب المحافظة', 'Orders by Province')}</h3>
          <div className="space-y-3">
            {a.ordersByProvince.map((item, i) => {
              const max = Math.max(...a.ordersByProvince.map(x => x.count));
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.province}</span>
                    <div className="flex gap-3">
                      <span className="text-[#0f2460] font-bold">{item.count}</span>
                      <span className="text-[#d4a339] font-bold">{formatCurrency(item.revenue, lang)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0f2460] to-[#d4a339] rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supervisor Performance */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-bold text-[#0f2460] mb-4">{t('أداء المشرفين', 'Supervisor Performance')}</h3>
          <div className="space-y-4">
            {a.supervisorPerformance.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                <div className="w-10 h-10 bg-[#0f2460] rounded-xl flex items-center justify-center text-white font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">{s.name}</div>
                  <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                    <span>{s.orders} {t('طلب', 'orders')}</span>
                    <span>{s.attendance}% {t('حضور', 'attendance')}</span>
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-bold text-[#d4a339]">{formatCurrency(s.revenue, lang)}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full mt-1 ${s.attendance >= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {s.attendance >= 90 ? t('ممتاز', 'Excellent') : t('جيد', 'Good')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
