import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, DollarSign, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getSupervisors } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Supervisor } from '@/types';

export default function SupervisorWalletPage() {
  const { user } = useAuth();
  const { t, lang } = useApp();
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);

  useEffect(() => {
    if (!user) return;
    setSupervisor(getSupervisors().find(s => s.id === user.id) ?? null);
  }, [user]);

  if (!supervisor) return (
    <div className="text-center py-20 text-slate-400">
      <Wallet size={60} className="mx-auto mb-3 opacity-30" />
      <p>{t('لا توجد بيانات محفظة', 'No wallet data')}</p>
    </div>
  );

  const w = supervisor.wallet;

  return (
    <div className="space-y-5">
      {/* Lock Warning */}
      {supervisor.isLocked && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3">
          <Lock size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">{t('حسابك مقفل — عهدة غير مسلّمة', 'Account Locked — Unsettled Custody')}</p>
            <p className="text-red-600 text-sm mt-1">
              {t(`المبلغ المستحق: ${formatCurrency(supervisor.pendingDebt ?? 0, lang)} — تواصل مع المدير العام للتسوية`,
                `Amount due: ${formatCurrency(supervisor.pendingDebt ?? 0, lang)} — Contact admin to settle`)}
            </p>
          </div>
        </div>
      )}

      {/* Pending debt display */}
      {!supervisor.isLocked && (supervisor.pendingDebt ?? 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800 text-sm">{t('عهدة مستحقة لم تُسلَّم', 'Unsettled Pending Debt')}</p>
              <p className="text-yellow-600 text-xs">{t('يجب تسليمها للمدير العام اليوم قبل تسجيل الانصراف', 'Must be settled with admin before checkout')}</p>
            </div>
          </div>
          <span className="font-black text-yellow-700 text-lg">{formatCurrency(supervisor.pendingDebt ?? 0, lang)}</span>
        </div>
      )}

      {/* Wallet Card */}
      <div className="gradient-hero rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <div className="font-bold text-xl">{t('محفظتي', 'My Wallet')}</div>
            <div className="text-white/60 text-sm">{supervisor.name}</div>
          </div>
        </div>
        <div className="text-5xl font-black text-[#d4a339] mb-1">{formatCurrency(w.totalBalance, lang)}</div>
        <div className="text-white/60 text-sm">{t('إجمالي الرصيد', 'Total Balance')}</div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card border-l-4 border-[#0f2460]" style={{ borderInlineStart: '4px solid #0f2460' }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-[#0f2460]" />
            <span className="text-sm font-medium text-slate-600">{t('رسوم الاستعلام', 'Inquiry Fees')}</span>
          </div>
          <div className="text-2xl font-black text-[#0f2460]">{formatCurrency(w.totalFees, lang)}</div>
        </div>
        <div className="stat-card border-l-4 border-green-500" style={{ borderInlineStart: '4px solid #22c55e' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-sm font-medium text-slate-600">{t('أقساط محصّلة', 'Installments')}</span>
          </div>
          <div className="text-2xl font-black text-green-600">{formatCurrency(w.totalInstallmentsCollected, lang)}</div>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800 text-sm">
        <p className="font-medium mb-1">ℹ️ {t('ملاحظة هامة', 'Important Note')}</p>
        <p>{t('يمكن للمدير العام فقط تعديل رصيد محفظتك. لأي استفسار تواصل مع الإدارة.', 'Only the Super Admin can adjust your wallet balance. For any inquiry, contact management.')}</p>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-bold text-[#0f2460] mb-4">{t('سجل المعاملات', 'Transactions')}</h3>
        {w.transactions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">{t('لا توجد معاملات بعد', 'No transactions yet')}</p>
        ) : (
          <div className="space-y-2">
            {w.transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-slate-800">{tx.description}</div>
                  <div className="text-xs text-slate-400">{formatDate(tx.createdAt, lang)}</div>
                </div>
                <div className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount), lang)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
