import { useState, useEffect } from 'react';
import { Shield, Clock, Search, Filter, User, LogIn, Edit, CheckCircle, XCircle, Wallet, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getAuditLogs } from '@/lib/auditLog';
import { formatDate, formatTime } from '@/lib/utils';
import type { AuditLog } from '@/types';

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  order:      <CheckCircle size={13} className="text-green-500" />,
  wallet:     <Wallet size={13} className="text-[#d4a339]" />,
  settings:   <Settings size={13} className="text-blue-500" />,
  auth:       <LogIn size={13} className="text-purple-500" />,
  supervisor: <User size={13} className="text-orange-500" />,
};

const ROLE_COLORS: Record<string, string> = {
  admin:      'bg-[#d4a339] text-[#0f2460]',
  supervisor: 'bg-blue-100 text-blue-700',
  customer:   'bg-green-100 text-green-700',
};

export default function AdminAuditLog() {
  const { t, lang } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => { setLogs(getAuditLogs()); }, []);

  const entities = ['all', 'order', 'wallet', 'settings', 'auth', 'supervisor'];
  const filtered = logs.filter(l => {
    const matchSearch = !search || l.action.includes(search) || l.userName.includes(search);
    const matchEntity = entityFilter === 'all' || l.entity === entityFilter;
    return matchSearch && matchEntity;
  });

  return (
    <div className="space-y-5">
      <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-3 text-sm text-[#0f2460] flex items-center gap-2">
        <Shield size={15} className="text-[#d4a339]" />
        {t('سجل المراجعة غير قابل للحذف — يسجل كل عملية في النظام بشكل تلقائي', 'Audit log is append-only and cannot be deleted — records every system action automatically')}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('إجمالي السجلات', 'Total Records'), value: logs.length },
          { label: t('أحداث الدخول', 'Auth Events'), value: logs.filter(l => l.entity === 'auth').length },
          { label: t('تغييرات الطلبات', 'Order Changes'), value: logs.filter(l => l.entity === 'order').length },
          { label: t('معاملات المحفظة', 'Wallet Transactions'), value: logs.filter(l => l.entity === 'wallet').length },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-2xl font-black text-[#0f2460]">{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('بحث في السجلات...', 'Search logs...')} className="input-field ps-9 text-sm" />
        </div>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="input-field text-sm w-auto">
          {entities.map(e => <option key={e} value={e}>{e === 'all' ? t('الكل', 'All') : e}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-[#0f2460]">{t('سجل المراجعة', 'Audit Log')} ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[t('الوقت', 'Time'), t('المستخدم', 'User'), t('الدور', 'Role'), t('الحدث', 'Entity'), t('الإجراء', 'Action')].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    <div>{formatDate(log.timestamp, lang)}</div>
                    <div className="font-mono">{formatTime(log.timestamp)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{log.userName}</div>
                    <div className="text-xs text-slate-400 font-mono">{log.userId.slice(0, 12)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[log.userRole] ?? 'bg-slate-100 text-slate-600'}`}>
                      {log.userRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      {ENTITY_ICONS[log.entity] ?? <Shield size={13} />}
                      {log.entity}
                      {log.entityId && <span className="text-slate-400">#{log.entityId.slice(0, 8)}</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[300px]">
                    <p className="truncate">{log.action}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">{t('لا سجلات بعد', 'No audit logs yet')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
