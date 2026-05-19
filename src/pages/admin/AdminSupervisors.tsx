import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Clock, Target, Wallet, Key, Eye, EyeOff, UserCog } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getSupervisors, saveSupervisors } from '@/lib/storage';
import { PROVINCES } from '@/constants/data';
import { formatCurrency, generateId } from '@/lib/utils';
import type { Supervisor } from '@/types';
import { toast } from 'sonner';

const WORK_DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

// Store supervisor passwords separately
function getSupervisorPasswords(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('qastly_sup_passwords') ?? '{}'); } catch { return {}; }
}
function saveSupervisorPasswords(p: Record<string, string>) {
  localStorage.setItem('qastly_sup_passwords', JSON.stringify(p));
}
function setSupervisorPassword(id: string, pass: string) {
  const p = getSupervisorPasswords();
  p[id] = pass;
  saveSupervisorPasswords(p);
}

export default function AdminSupervisors() {
  const { t, lang } = useApp();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState<string | null>(null);
  const [editing, setEditing] = useState<Supervisor | null>(null);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', province: '',
    workHoursStart: '09:00', workHoursEnd: '17:00',
    workDays: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء'],
    target: 1500,
    password: '000000',
  });

  function reload() { setSupervisors(getSupervisors()); }
  useEffect(() => { reload(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', province: '', workHoursStart: '09:00', workHoursEnd: '17:00', workDays: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء'], target: 1500, password: '000000' });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name || !form.email || !form.province) {
      toast.error(t('الاسم والبريد والمحافظة مطلوبة', 'Name, email, province required'));
      return;
    }
    const sups = getSupervisors();
    if (editing) {
      const updated = sups.map(s => s.id === editing.id ? { ...s, name: form.name, email: form.email, phone: form.phone, province: form.province, workHoursStart: form.workHoursStart, workHoursEnd: form.workHoursEnd, workDays: form.workDays, target: form.target } : s);
      saveSupervisors(updated);
      if (form.password) setSupervisorPassword(editing.id, form.password);
      toast.success(t('تم تعديل المشرف', 'Supervisor updated'));
    } else {
      const id = generateId();
      const newSup: Supervisor = {
        id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        province: form.province,
        workHoursStart: form.workHoursStart,
        workHoursEnd: form.workHoursEnd,
        workDays: form.workDays,
        target: form.target,
        role: 'supervisor',
        isActive: true,
        createdAt: new Date().toISOString(),
        wallet: {
          id: generateId(),
          supervisorId: id,
          totalFees: 0,
          totalInstallmentsCollected: 0,
          totalBalance: 0,
          transactions: [],
          lastUpdated: new Date().toISOString(),
        },
        rewards: [],
        attendanceRecords: [],
      };
      setSupervisorPassword(id, form.password);
      saveSupervisors([...sups, newSup]);
      toast.success(t('تم إضافة المشرف', 'Supervisor added'));
    }
    reload();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (confirm(t('هل تريد حذف هذا المشرف؟', 'Delete this supervisor?'))) {
      saveSupervisors(getSupervisors().filter(s => s.id !== id));
      reload();
      toast.success(t('تم الحذف', 'Deleted'));
    }
  }

  function handleToggleActive(id: string, current: boolean) {
    const updated = getSupervisors().map(s => s.id === id ? { ...s, isActive: !current } : s);
    saveSupervisors(updated);
    reload();
    toast.success(current ? t('تم إيقاف الحساب', 'Account suspended') : t('تم تفعيل الحساب', 'Account activated'));
  }

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      workDays: f.workDays.includes(day) ? f.workDays.filter(d => d !== day) : [...f.workDays, day]
    }));
  }

  const passwords = getSupervisorPasswords();

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          {t('إضافة مشرف', 'Add Supervisor')}
        </button>
      </div>

      {/* Bonus note */}
      <div className="bg-[#d4a339]/10 border border-[#d4a339]/30 rounded-xl p-4 text-sm text-[#0f2460]">
        🎯 {t('نظام المكافآت: المشرف الذي يحقق 1500 طلب/شهر يحصل على مكافأة 3000 جنيه تضاف تلقائياً للتقارير', 'Bonus system: Supervisor who achieves 1500 orders/month gets EGP 3000 bonus added automatically to reports')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {supervisors.map(s => {
          const province = PROVINCES.find(p => p.id === s.province);
          const sup_pass = passwords[s.id] ?? '000000';
          return (
            <div key={s.id} className={`bg-white rounded-2xl shadow-card p-5 border ${s.isActive ? 'border-slate-100' : 'border-red-200 bg-red-50/30'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0f2460] to-[#1a368e] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-[#0f2460]">{s.name}</div>
                    <div className="text-slate-500 text-xs">{s.email}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full cursor-pointer ${s.isActive ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'}`}
                  onClick={() => handleToggleActive(s.id, s.isActive)}
                  title={t('اضغط لتغيير الحالة', 'Click to toggle status')}>
                  {s.isActive ? t('نشط', 'Active') : t('موقوف', 'Suspended')}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={14} className="text-[#d4a339]" />
                  <span>{lang === 'ar' ? province?.nameAr : province?.nameEn}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={14} className="text-[#d4a339]" />
                  <span>{s.workHoursStart} - {s.workHoursEnd}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Target size={14} className="text-[#d4a339]" />
                  <span>{t('التارجت:', 'Target:')} {s.target} {t('طلب/شهر', 'orders/mo')}</span>
                  {s.target >= 1500 && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded-full">🏆 مكافأة</span>}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Wallet size={14} className="text-[#d4a339]" />
                  <span>{t('المحفظة:', 'Wallet:')} {formatCurrency(s.wallet.totalBalance)}</span>
                </div>
              </div>

              {/* Credentials display */}
              {showCredentials === s.id && (
                <div className="bg-slate-50 rounded-xl p-3 mb-3 text-xs space-y-1 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t('البريد:', 'Email:')}</span>
                    <span className="font-mono font-bold text-[#0f2460]">{s.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t('كلمة المرور:', 'Password:')}</span>
                    <span className="font-mono font-bold text-[#d4a339]">{sup_pass}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowCredentials(showCredentials === s.id ? null : s.id)}
                  className="flex-1 py-2 rounded-xl bg-[#d4a339]/10 text-[#d4a339] text-xs font-medium hover:bg-[#d4a339] hover:text-white transition-all flex items-center justify-center gap-1">
                  <Key size={12} /> {t('بيانات الدخول', 'Credentials')}
                </button>
                <button onClick={() => {
                  setEditing(s);
                  setForm({ name: s.name, email: s.email, phone: s.phone ?? '', province: s.province, workHoursStart: s.workHoursStart, workHoursEnd: s.workHoursEnd, workDays: s.workDays, target: s.target, password: passwords[s.id] ?? '000000' });
                  setShowForm(true);
                }}
                  className="flex-1 py-2 rounded-xl bg-[#0f2460]/10 text-[#0f2460] text-xs font-medium hover:bg-[#0f2460] hover:text-white transition-all flex items-center justify-center gap-1">
                  <Edit2 size={12} /> {t('تعديل', 'Edit')}
                </button>
                <button onClick={() => handleDelete(s.id)}
                  className="py-2 px-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-[#0f2460] flex items-center gap-2">
                <UserCog size={18} />
                {editing ? t('تعديل مشرف', 'Edit Supervisor') : t('مشرف جديد', 'New Supervisor')}
              </h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: t('الاسم', 'Name'), field: 'name', type: 'text' },
                { label: t('البريد الإلكتروني', 'Email'), field: 'email', type: 'email' },
                { label: t('رقم الهاتف', 'Phone'), field: 'phone', type: 'tel' },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.field]} onChange={e => setForm(p => ({...p, [f.field]: e.target.value}))} className="input-field text-sm" />
                </div>
              ))}

              {/* Password field */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1">
                  <Key size={14} className="text-[#d4a339]" />
                  {t('كلمة المرور', 'Password')}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({...p, password: e.target.value}))}
                    className="input-field text-sm pe-10"
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">{t('يمكن تغييرها في أي وقت من قبل المدير فقط', 'Can be changed anytime by admin only')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('المحافظة', 'Province')}</label>
                <select value={form.province} onChange={e => setForm(f => ({...f, province: e.target.value}))} className="input-field text-sm">
                  <option value="">{t('اختر', 'Select')}</option>
                  {PROVINCES.map(p => <option key={p.id} value={p.id}>{lang === 'ar' ? p.nameAr : p.nameEn}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t('بداية الدوام', 'Work Start')}</label>
                  <input type="time" value={form.workHoursStart} onChange={e => setForm(f => ({...f, workHoursStart: e.target.value}))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t('نهاية الدوام', 'Work End')}</label>
                  <input type="time" value={form.workHoursEnd} onChange={e => setForm(f => ({...f, workHoursEnd: e.target.value}))} className="input-field text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('أيام العمل', 'Work Days')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {WORK_DAYS_AR.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.workDays.includes(d) ? 'bg-[#0f2460] text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('التارجت الشهري (طلبات)', 'Monthly Target (orders)')}</label>
                <input type="number" value={form.target} onChange={e => setForm(f => ({...f, target: Number(e.target.value)}))} className="input-field text-sm" min={1} />
                <p className="text-xs text-[#d4a339] mt-1">🏆 {t('عند تحقيق 1500 طلب: مكافأة 3000 ج.م', 'At 1500 orders: EGP 3000 bonus')}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="btn-primary flex-1">{t('حفظ', 'Save')}</button>
                <button onClick={() => setShowForm(false)} className="btn-outline flex-1">{t('إلغاء', 'Cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
