/**
 * AdminWallets — Financial Management & Salary Control
 * 
 * Features:
 * - Custody settlement (full / partial — remainder → negative debt)
 * - Salary management (base, bonuses, penalties with reasons)
 * - Monthly close → archive + carry-forward negative balance
 * - Overdue custody auto-lock warnings
 */

import { useState, useEffect } from 'react';
import {
  Wallet, DollarSign, CheckCircle, AlertTriangle, Lock, RefreshCw,
  TrendingUp, Plus, Minus, Archive, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSupervisors, clearSupervisorDebt, addBonus, addPenalty,
  getOrCreateSalaryRecord, approveMonthlySalary, getCurrentMonth,
  type SalaryRecord
} from '@/lib/storage';
import { formatCurrency, formatDate, hoursSince } from '@/lib/utils';
import { logWalletSettlement } from '@/lib/auditLog';
import { PROVINCES } from '@/constants/data';
import type { Supervisor } from '@/types';
import { toast } from 'sonner';

export default function AdminWallets() {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState(0);
  const [expandedSup, setExpandedSup] = useState<string | null>(null);
  const [salaryRecords, setSalaryRecords] = useState<Record<string, SalaryRecord>>({});
  const [bonusModal, setBonusModal] = useState<{ supId: string; type: 'bonus' | 'penalty' } | null>(null);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [bonusReason, setBonusReason] = useState('');

  function reload() {
    const sups = getSupervisors();
    setSupervisors(sups);
    const records: Record<string, SalaryRecord> = {};
    sups.forEach(s => { records[s.id] = getOrCreateSalaryRecord(s.id, getCurrentMonth()); });
    setSalaryRecords(records);
  }

  useEffect(() => { reload(); }, []);

  function handleSettle(sup: Supervisor) {
    if (!user) return;
    const amount = settleAmount > 0 ? settleAmount : (sup.pendingDebt ?? sup.wallet.totalBalance);
    clearSupervisorDebt(sup.id, user.id, amount);
    logWalletSettlement(user.id, user.name, sup.id, sup.name, amount);
    const remaining = (sup.pendingDebt ?? 0) - amount;
    toast.success(
      remaining > 0
        ? t(`تم تسوية ${formatCurrency(amount)} — متبقي مدين: ${formatCurrency(remaining)}`, `Settled ${formatCurrency(amount, 'en')} — Remaining debt: ${formatCurrency(remaining, 'en')}`)
        : t(`تم تصفير عهدة ${sup.name} بالكامل`, `Settled ${sup.name}'s full custody`)
    );
    setSettlingId(null);
    setSettleAmount(0);
    reload();
  }

  function handleAddBonus() {
    if (!bonusModal || bonusAmount <= 0 || !bonusReason.trim()) {
      toast.error(t('يجب إدخال المبلغ والسبب', 'Amount and reason required'));
      return;
    }
    if (bonusModal.type === 'bonus') {
      addBonus(bonusModal.supId, bonusAmount, bonusReason);
      toast.success(t('تم إضافة الحافز', 'Bonus added'));
    } else {
      addPenalty(bonusModal.supId, bonusAmount, bonusReason);
      toast.success(t('تم تسجيل الجزاء', 'Penalty recorded'));
    }
    setBonusModal(null);
    setBonusAmount(0);
    setBonusReason('');
    reload();
  }

  function handleApproveSalary(supId: string) {
    if (!user) return;
    try {
      const record = approveMonthlySalary(supId, user.id);
      toast.success(t(
        `تم اعتماد الراتب — الصافي: ${formatCurrency(record.finalAmount)}`,
        `Salary approved — Net: ${formatCurrency(record.finalAmount, 'en')}`
      ));
      reload();
    } catch {
      toast.error(t('الراتب معتمد مسبقاً أو حدث خطأ', 'Salary already approved or error occurred'));
    }
  }

  const totalPending = supervisors.reduce((s, sup) => s + (sup.pendingDebt ?? 0), 0);
  const totalWallets = supervisors.reduce((s, sup) => s + sup.wallet.totalBalance, 0);
  const lockedCount  = supervisors.filter(s => s.isLocked).length;
  const overdueCount = supervisors.filter(s =>
    (s.pendingDebt ?? 0) > 0 && s.lastCheckOutAt && hoursSince(s.lastCheckOutAt) > 24
  ).length;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('إجمالي المحافظ', 'Total Wallets'), value: formatCurrency(totalWallets, lang), color: 'bg-[#0a1628]', icon: <Wallet size={20} /> },
          { label: t('عهد مستحقة', 'Pending Debt'), value: formatCurrency(totalPending, lang), color: 'bg-[#c9a84c]', icon: <DollarSign size={20} /> },
          { label: t('حسابات مقفلة', 'Locked'), value: lockedCount, color: 'bg-red-500', icon: <Lock size={20} /> },
          { label: t('عهد متأخرة +24h', 'Overdue +24h'), value: overdueCount, color: 'bg-orange-500', icon: <AlertTriangle size={20} /> },
        ].map((card, i) => (
          <div key={i} className="stat-card">
            <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center text-white mb-3`}>{card.icon}</div>
            <div className="text-xl font-black text-[#0a1628]">{card.value}</div>
            <div className="text-slate-500 text-sm">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800 text-sm">
              {overdueCount} {t('مشرف لديه عهدة متأخرة أكثر من 24 ساعة — حساباتهم مقفلة تلقائياً', 'supervisor(s) with overdue debt over 24h — Accounts auto-locked')}
            </p>
            <p className="text-red-600 text-xs mt-0.5">
              {t('يجب تصفير العهدة يدوياً لإعادة التفعيل. المبالغ غير المسلمة تحتسب كدين مدين.', 'Manually settle custody to reactivate. Unsettled amounts become negative debt.')}
            </p>
          </div>
        </div>
      )}

      {/* Supervisor Cards */}
      {supervisors.map(sup => {
        const isOverdue = (sup.pendingDebt ?? 0) > 0 && sup.lastCheckOutAt && hoursSince(sup.lastCheckOutAt) > 24;
        const prov = PROVINCES.find(p => p.id === sup.province);
        const salary = salaryRecords[sup.id];
        const expanded = expandedSup === sup.id;

        return (
          <div key={sup.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${isOverdue ? 'border-red-300' : 'border-slate-100'}`}>
            {/* Header row */}
            <div className="p-4 flex flex-wrap items-center gap-4">
              {/* Avatar + Info */}
              <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                <div className="w-11 h-11 bg-gradient-to-br from-[#0a1628] to-[#0e2044] rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {sup.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-[#0a1628]">{sup.name}</div>
                  <div className="text-xs text-slate-400">{lang === 'ar' ? prov?.nameAr : prov?.nameEn} — {sup.email}</div>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="text-center">
                <div className="text-xs text-slate-400">{t('الرصيد', 'Balance')}</div>
                <div className={`font-black text-lg ${sup.wallet.totalBalance < 0 ? 'text-red-600' : 'text-[#0a1628]'}`}>
                  {formatCurrency(sup.wallet.totalBalance, lang)}
                </div>
              </div>

              {/* Pending Debt */}
              <div className="text-center">
                <div className="text-xs text-slate-400">{t('العهدة المستحقة', 'Pending Debt')}</div>
                {(sup.pendingDebt ?? 0) > 0 ? (
                  <div className={`font-black text-lg ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                    {isOverdue && '⚠️ '}{formatCurrency(sup.pendingDebt ?? 0, lang)}
                  </div>
                ) : (
                  <div className="text-emerald-600 font-semibold text-sm flex items-center gap-1">
                    <CheckCircle size={13} /> {t('مسوّية', 'Settled')}
                  </div>
                )}
              </div>

              {/* Salary Net */}
              {salary && (
                <div className="text-center">
                  <div className="text-xs text-slate-400">{t('صافي الراتب', 'Net Salary')}</div>
                  <div className={`font-black text-lg ${salary.finalAmount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(salary.finalAmount, lang)}
                  </div>
                  {salary.isApproved && (
                    <div className="text-xs text-emerald-600 flex items-center gap-1 justify-center">
                      <CheckCircle size={10} /> {t('معتمد', 'Approved')}
                    </div>
                  )}
                </div>
              )}

              {/* Status badge */}
              <span className={`text-xs px-2 py-1 rounded-full ${sup.isLocked ? 'bg-red-100 text-red-700' : sup.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {sup.isLocked ? t('مقفل', 'Locked') : sup.isActive ? t('نشط', 'Active') : t('موقوف', 'Suspended')}
              </span>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                {((sup.pendingDebt ?? 0) > 0 || sup.isLocked) && (
                  <button onClick={() => { setSettlingId(sup.id); setSettleAmount(sup.pendingDebt ?? 0); }}
                    className="text-xs bg-[#0a1628] text-white px-3 py-2 rounded-lg hover:bg-[#0e2044] transition-colors flex items-center gap-1 min-h-[36px]">
                    <CheckCircle size={11} /> {t('تصفير العهدة', 'Clear Debt')}
                  </button>
                )}
                <button onClick={() => setExpandedSup(expanded ? null : sup.id)}
                  className="text-xs bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 min-h-[36px]">
                  {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {t('الراتب', 'Salary')}
                </button>
              </div>
            </div>

            {/* Expanded salary section */}
            {expanded && salary && (
              <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#0a1628]">
                    {t('إدارة الراتب —', 'Salary Management —')} {salary.month}
                  </h4>
                  {!salary.isApproved && (
                    <button onClick={() => handleApproveSalary(sup.id)}
                      className="flex items-center gap-2 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                      <Archive size={13} />
                      {t('اعتماد الراتب النهائي وأرشفته', 'Approve & Archive Salary')}
                    </button>
                  )}
                </div>

                {/* Salary breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: t('الراتب الأساسي', 'Base Salary'), value: formatCurrency(salary.baseSalary, lang), color: 'text-[#0a1628]' },
                    { label: t('الحوافز', 'Bonuses'), value: `+${formatCurrency(salary.bonuses.reduce((s, b) => s + b.amount, 0), lang)}`, color: 'text-emerald-600' },
                    { label: t('الجزاءات', 'Penalties'), value: `-${formatCurrency(salary.penalties.reduce((s, p) => s + p.amount, 0), lang)}`, color: 'text-red-600' },
                    { label: t('العهدة المديونة', 'Debt Deduction'), value: `-${formatCurrency(sup.pendingDebt ?? 0, lang)}`, color: 'text-orange-600' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                      <div className={`font-bold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {salary.debtCarriedOver > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    ⚠️ {t(`رصيد مدين مُرحَّل من الشهر السابق: ${formatCurrency(salary.debtCarriedOver, lang)}`, `Carried-over debt from previous month: ${formatCurrency(salary.debtCarriedOver, 'en')}`)}
                  </div>
                )}

                {/* Bonuses/Penalties list */}
                {(salary.bonuses.length > 0 || salary.penalties.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-3">
                    {salary.bonuses.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-emerald-700 mb-2">{t('الحوافز', 'Bonuses')}</div>
                        {salary.bonuses.map(b => (
                          <div key={b.id} className="text-xs bg-emerald-50 rounded-lg px-3 py-2 mb-1 flex justify-between">
                            <span className="text-slate-600">{b.reason}</span>
                            <span className="text-emerald-700 font-bold">+{formatCurrency(b.amount, lang)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {salary.penalties.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-red-700 mb-2">{t('الجزاءات', 'Penalties')}</div>
                        {salary.penalties.map(p => (
                          <div key={p.id} className="text-xs bg-red-50 rounded-lg px-3 py-2 mb-1 flex justify-between">
                            <span className="text-slate-600">{p.reason}</span>
                            <span className="text-red-700 font-bold">-{formatCurrency(p.amount, lang)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Add buttons */}
                {!salary.isApproved && (
                  <div className="flex gap-2">
                    <button onClick={() => { setBonusModal({ supId: sup.id, type: 'bonus' }); setBonusAmount(0); setBonusReason(''); }}
                      className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                      <Plus size={12} /> {t('إضافة حافز', 'Add Bonus')}
                    </button>
                    <button onClick={() => { setBonusModal({ supId: sup.id, type: 'penalty' }); setBonusAmount(0); setBonusReason(''); }}
                      className="flex items-center gap-1 text-xs bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors">
                      <Minus size={12} /> {t('تسجيل جزاء', 'Add Penalty')}
                    </button>
                  </div>
                )}

                {/* Archive note */}
                {salary.isApproved && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2">
                    <Archive size={13} />
                    {t(`معتمد في ${formatDate(salary.approvedAt ?? '', lang)} — للقراءة فقط`, `Approved on ${formatDate(salary.approvedAt ?? '', lang)} — Read Only`)}
                  </div>
                )}
              </div>
            )}

            {/* Transactions mini-list */}
            {expanded && sup.wallet.transactions.length > 0 && (
              <div className="border-t border-slate-100 p-4">
                <div className="text-xs font-semibold text-slate-500 mb-2">{t('آخر المعاملات', 'Recent Transactions')}</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sup.wallet.transactions.slice(0, 10).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[200px]">{tx.description}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={tx.type === 'settlement' || tx.type === 'withdrawal' ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {tx.type === 'settlement' || tx.type === 'withdrawal' ? '-' : '+'}{formatCurrency(tx.amount, lang)}
                        </span>
                        <span className="text-slate-400">{formatDate(tx.createdAt, lang)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {supervisors.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
          {t('لا يوجد مشرفون مسجلون', 'No supervisors registered')}
        </div>
      )}

      {/* ── Settle Modal ── */}
      {settlingId && (() => {
        const sup = supervisors.find(s => s.id === settlingId);
        if (!sup) return null;
        const remaining = (sup.pendingDebt ?? 0) - settleAmount;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSettlingId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0a1628]">{t('تأكيد استلام النقدية', 'Confirm Cash Receipt')}</h3>
                  <button onClick={() => setSettlingId(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-slate-500 text-sm mb-1">{t('المشرف:', 'Supervisor:')} <strong>{sup.name}</strong></p>
                <p className="text-slate-400 text-xs mb-4">{t('العهدة الكلية:', 'Total Custody:')} <strong>{formatCurrency(sup.pendingDebt ?? 0, lang)}</strong></p>
                <div className="mb-4">
                  <label className="text-sm text-slate-600 mb-1.5 block font-medium">{t('المبلغ المستلم فعلياً (ج.م)', 'Actual Amount Received (EGP)')}</label>
                  <input
                    type="number"
                    value={settleAmount}
                    onChange={e => setSettleAmount(Number(e.target.value))}
                    className="input-field text-center text-2xl font-black text-[#c9a84c]"
                    min={0}
                  />
                </div>
                {remaining > 0 && settleAmount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 mb-4 flex items-start gap-2">
                    <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                    {t(`متبقي (${formatCurrency(remaining, lang)}) يُحتسب كدين مدين على المشرف ويُرحَّل للشهر القادم`, `Remaining (${formatCurrency(remaining, 'en')}) becomes negative debt carried to next month`)}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => handleSettle(sup)} disabled={settleAmount <= 0}
                    className="btn-primary flex-1 disabled:opacity-50">
                    {t('تأكيد وتصفير', 'Confirm & Clear')}
                  </button>
                  <button onClick={() => setSettlingId(null)} className="btn-outline flex-1">
                    {t('إلغاء', 'Cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Bonus/Penalty Modal ── */}
      {bonusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBonusModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#0a1628]">
                  {bonusModal.type === 'bonus' ? t('إضافة حافز', 'Add Bonus') : t('تسجيل جزاء', 'Add Penalty')}
                </h3>
                <button onClick={() => setBonusModal(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 mb-1.5 block font-medium">{t('المبلغ (ج.م)', 'Amount (EGP)')}</label>
                  <input type="number" value={bonusAmount} onChange={e => setBonusAmount(Number(e.target.value))}
                    className="input-field" min={1} />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1.5 block font-medium">{t('السبب (إلزامي)', 'Reason (Required)')}</label>
                  <input value={bonusReason} onChange={e => setBonusReason(e.target.value)}
                    className="input-field" placeholder={bonusModal.type === 'bonus' ? t('مثال: تحقيق التارجت الشهري', 'e.g., Monthly target achieved') : t('مثال: تأخر في التسليم', 'e.g., Late delivery')} />
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={handleAddBonus}
                    className={`flex-1 py-3 rounded-xl text-white font-bold text-sm ${bonusModal.type === 'bonus' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'} transition-colors`}>
                    {bonusModal.type === 'bonus' ? t('إضافة الحافز', 'Add Bonus') : t('تسجيل الجزاء', 'Record Penalty')}
                  </button>
                  <button onClick={() => setBonusModal(null)} className="btn-outline flex-1 text-sm">{t('إلغاء', 'Cancel')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
