import { useState, useEffect } from 'react';
import { Shield, Clock, TrendingUp, AlertTriangle, CheckCircle, Lock, Eye, Activity } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getSupervisors, getOrders, getAttendanceRecords } from '@/lib/storage';
import { formatCurrency, formatDate, formatTime, hoursSince } from '@/lib/utils';
import { PROVINCES } from '@/constants/data';
import type { Supervisor, Order } from '@/types';

export default function AdminSupervisorActivity() {
  const { t, lang } = useApp();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Supervisor | null>(null);

  useEffect(() => {
    setSupervisors(getSupervisors());
    setOrders(getOrders());
  }, []);

  function getSupervisorStats(sup: Supervisor) {
    const supOrders = orders.filter(o => o.supervisorId === sup.id);
    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const monthOrders = supOrders.filter(o => new Date(o.createdAt) >= monthStart);
    const attendance = getAttendanceRecords(sup.id);
    const presentDays = attendance.filter(r => r.status === 'present' || r.status === 'late').length;
    const totalDays = attendance.length || 1;
    const attendanceRate = Math.round((presentDays / totalDays) * 100);
    const targetPct = sup.target > 0 ? Math.min(100, Math.round((monthOrders.length / sup.target) * 100)) : 0;
    const hasBonus = monthOrders.length >= 1500;
    const debtOverdue = sup.pendingDebt && sup.pendingDebt > 0 && sup.lastCheckOutAt
      ? hoursSince(sup.lastCheckOutAt) > 24
      : false;

    return { supOrders, monthOrders, attendanceRate, targetPct, hasBonus, debtOverdue };
  }

  const province = (id: string) => {
    const p = PROVINCES.find(pr => pr.id === id);
    return lang === 'ar' ? p?.nameAr : p?.nameEn;
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-3 text-sm text-[#0f2460] flex items-center gap-2">
        <Activity size={15} className="text-[#d4a339]" />
        {t('صفحة رقابة حصرية للمدير العام — تعرض نشاط وأداء جميع المشرفين', 'Exclusive admin page — shows all supervisor activity and performance')}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('إجمالي المشرفين', 'Total Supervisors'), value: supervisors.length, color: 'bg-blue-500' },
          { label: t('مشرفون نشطون', 'Active'), value: supervisors.filter(s => s.isActive && !s.isLocked).length, color: 'bg-green-500' },
          { label: t('حسابات مقفلة', 'Locked Accounts'), value: supervisors.filter(s => s.isLocked).length, color: 'bg-red-500' },
          { label: t('إجمالي العهد المستحقة', 'Total Pending Debt'), value: formatCurrency(supervisors.reduce((s, sup) => s + (sup.pendingDebt ?? 0), 0), lang), color: 'bg-[#d4a339]' },
        ].map((card, i) => (
          <div key={i} className="stat-card">
            <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center text-white mb-3`}>
              <TrendingUp size={18} />
            </div>
            <div className="text-2xl font-black text-[#0f2460]">{card.value}</div>
            <div className="text-slate-500 text-sm">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Supervisor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {supervisors.map(sup => {
          const { supOrders, monthOrders, attendanceRate, targetPct, hasBonus, debtOverdue } = getSupervisorStats(sup);
          return (
            <div key={sup.id} className={`bg-white rounded-2xl shadow-sm border p-5 ${sup.isLocked ? 'border-red-300 bg-red-50/20' : debtOverdue ? 'border-yellow-300 bg-yellow-50/20' : 'border-slate-100'}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0f2460] to-[#1a368e] rounded-xl flex items-center justify-center text-white text-lg font-black">
                    {sup.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-[#0f2460]">{sup.name}</div>
                    <div className="text-xs text-slate-500">{province(sup.province)}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {sup.isLocked && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock size={10} /> {t('مقفل', 'Locked')}
                    </span>
                  )}
                  {!sup.isLocked && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sup.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {sup.isActive ? t('نشط', 'Active') : t('موقوف', 'Suspended')}
                    </span>
                  )}
                  {hasBonus && <span className="text-xs bg-[#d4a339]/20 text-[#d4a339] px-2 py-0.5 rounded-full">🏆 {t('مكافأة', 'Bonus')}</span>}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-lg font-black text-[#0f2460]">{monthOrders.length}</div>
                  <div className="text-xs text-slate-400">{t('هذا الشهر', 'This Month')}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-lg font-black text-[#0f2460]">{attendanceRate}%</div>
                  <div className="text-xs text-slate-400">{t('الحضور', 'Attendance')}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-lg font-black text-[#d4a339]">{targetPct}%</div>
                  <div className="text-xs text-slate-400">{t('التارجت', 'Target')}</div>
                </div>
              </div>

              {/* Target bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{t('التارجت الشهري', 'Monthly Target')}</span>
                  <span>{monthOrders.length}/{sup.target}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${targetPct >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-[#0f2460] to-[#d4a339]'}`}
                    style={{ width: `${Math.min(100, targetPct)}%` }}
                  />
                </div>
              </div>

              {/* Wallet & Debt */}
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-slate-500">{t('رصيد المحفظة:', 'Wallet Balance:')}</span>
                <span className="font-bold text-[#0f2460]">{formatCurrency(sup.wallet.totalBalance, lang)}</span>
              </div>

              {(sup.pendingDebt ?? 0) > 0 && (
                <div className={`flex items-center justify-between text-sm p-2 rounded-lg mb-3 ${debtOverdue ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <span className={`text-xs font-medium ${debtOverdue ? 'text-red-700' : 'text-yellow-700'}`}>
                    {debtOverdue ? `⚠️ ${t('عهدة متأخرة (+24h)', 'Overdue Debt (+24h)')}` : `⏳ ${t('عهدة مستحقة', 'Pending Debt')}`}
                  </span>
                  <span className={`font-bold text-sm ${debtOverdue ? 'text-red-700' : 'text-yellow-700'}`}>
                    {formatCurrency(sup.pendingDebt ?? 0, lang)}
                  </span>
                </div>
              )}

              <button onClick={() => setSelected(sup)}
                className="w-full py-2 rounded-xl bg-[#0f2460]/10 text-[#0f2460] text-xs font-medium hover:bg-[#0f2460] hover:text-white transition-all flex items-center justify-center gap-2">
                <Eye size={13} /> {t('عرض التفاصيل', 'View Details')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-[#0f2460]">{selected.name} — {t('تفاصيل النشاط', 'Activity Details')}</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Attendance */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Clock size={15} className="text-[#d4a339]" /> {t('سجل الحضور الأخير', 'Recent Attendance')}
                </h4>
                {getAttendanceRecords(selected.id).slice(0, 7).map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${r.status === 'present' ? 'bg-green-500' : r.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span>{r.date}</span>
                      {r.faceVerified && <span className="text-xs text-green-600">Face✓</span>}
                    </div>
                    <span className="text-xs text-slate-400">
                      {r.checkInTime ? formatTime(r.checkInTime) : '—'} → {r.checkOutTime ? formatTime(r.checkOutTime) : '—'}
                    </span>
                  </div>
                ))}
                {getAttendanceRecords(selected.id).length === 0 && (
                  <p className="text-slate-400 text-sm">{t('لا سجلات', 'No records')}</p>
                )}
              </div>

              {/* Wallet Transactions */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <TrendingUp size={15} className="text-[#d4a339]" /> {t('آخر معاملات المحفظة', 'Recent Wallet Transactions')}
                </h4>
                {selected.wallet.transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
                    <div>
                      <p className="font-medium text-slate-700">{tx.description}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.createdAt, lang)}</p>
                    </div>
                    <span className={`font-bold ${tx.type === 'withdrawal' || tx.type === 'settlement' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'withdrawal' || tx.type === 'settlement' ? '-' : '+'}{formatCurrency(tx.amount, lang)}
                    </span>
                  </div>
                ))}
                {selected.wallet.transactions.length === 0 && <p className="text-slate-400 text-sm">{t('لا معاملات', 'No transactions')}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
