import { useState } from 'react';
import { Save, Palette, Phone, DollarSign, Globe, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { t, settings, updateSettings } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState<'general' | 'installment' | 'social' | 'colors'>('general');

  function handleSave() {
    updateSettings(form);
    toast.success(t('تم حفظ الإعدادات بنجاح', 'Settings saved successfully'));
  }

  function f(field: keyof typeof form, value: any) {
    setForm(p => ({ ...p, [field]: value }));
  }

  const tabs = [
    { key: 'general', icon: <Globe size={16} />, label: t('عام', 'General') },
    { key: 'installment', icon: <DollarSign size={16} />, label: t('التقسيط', 'Installment') },
    { key: 'social', icon: <Phone size={16} />, label: t('التواصل', 'Social') },
    { key: 'colors', icon: <Palette size={16} />, label: t('الألوان', 'Colors') },
  ];

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-card p-1.5 flex gap-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-[#0f2460] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        {/* Admin exclusive note */}
        <div className="flex items-center gap-2 text-xs text-[#0f2460] bg-[#0f2460]/5 rounded-lg p-2.5 mb-5">
          <Lock size={14} className="text-[#d4a339]" />
          {t('هذه الإعدادات حصرية للمدير العام ولا يمكن للمشرفين تعديلها', 'These settings are exclusive to the Super Admin and cannot be modified by supervisors')}
        </div>

        {activeTab === 'general' && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#0f2460] text-lg mb-4">{t('الإعدادات العامة', 'General Settings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: t('اسم الموقع (عربي)', 'Site Name AR'), field: 'siteNameAr' },
                { label: t('اسم الموقع (إنجليزي)', 'Site Name EN'), field: 'siteNameEn' },
                { label: t('الشعار (عربي)', 'Tagline AR'), field: 'taglineAr' },
                { label: t('الشعار (إنجليزي)', 'Tagline EN'), field: 'taglineEn' },
                { label: t('رقم الهاتف', 'Phone'), field: 'contactPhone' },
                { label: t('واتساب (مع كود)', 'WhatsApp (with code)'), field: 'contactWhatsapp' },
                { label: t('البريد الإلكتروني', 'Email'), field: 'contactEmail' },
              ].map(item => (
                <div key={item.field}>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">{item.label}</label>
                  <input value={(form as any)[item.field]} onChange={e => f(item.field as any, e.target.value)} className="input-field text-sm" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('نص الفوتر (عربي)', 'Footer Text AR')}</label>
                <textarea value={form.footerTextAr} onChange={e => f('footerTextAr', e.target.value)} className="input-field resize-none text-sm" rows={2} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'installment' && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#0f2460] text-lg mb-4">{t('إعدادات التقسيط - صلاحية المدير', 'Installment Settings - Admin Control')}</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-yellow-800 text-sm font-medium">
                ⚠️ {t('تأثير فوري على جميع الطلبات الجديدة — لا يمكن للمشرفين تعديل هذه القيم', 'Immediate effect on all new orders — supervisors cannot modify these values')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  {t('رسوم الاستعلام والآي سكور (ج.م)', 'Inquiry & i-Score Fee (EGP)')}
                </label>
                <input type="number" value={form.inquiryFee} onChange={e => f('inquiryFee', Number(e.target.value))} className="input-field text-sm font-bold text-[#d4a339]" min={0} />
                <p className="text-xs text-slate-500 mt-1">{t('تُدفع من العميل للمشرف عند توقيع طلب التقسيط ورفع المستندات', 'Paid by customer to supervisor when signing installment application and uploading documents')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  {t('نسبة الفائدة الافتراضية (%)', 'Default Interest Rate (%)')}
                </label>
                <input type="number" value={form.defaultInterestRate} onChange={e => f('defaultInterestRate', Number(e.target.value))} className="input-field text-sm" min={0} step={0.5} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  {t('هامش الربح / المصاريف الإدارية (%)', 'Profit Margin / Admin Fee (%)')}
                </label>
                <input type="number" value={form.defaultAdminFee} onChange={e => f('defaultAdminFee', Number(e.target.value))} className="input-field text-sm" min={0} step={0.5} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  {t('الحد الأقصى لمدة التقسيط (شهر)', 'Max Installment Duration (months)')}
                </label>
                <input type="number" value={form.maxInstallmentMonths} onChange={e => f('maxInstallmentMonths', Number(e.target.value))} className="input-field text-sm" min={3} max={60} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  {t('الحد الأدنى للمقدم (%)', 'Min Down Payment (%)')}
                </label>
                <input type="number" value={form.minDownPaymentPercent} onChange={e => f('minDownPaymentPercent', Number(e.target.value))} className="input-field text-sm" min={0} max={50} />
                <p className="text-xs text-[#d4a339] mt-1">{t('0 = بدون مقدم', '0 = Zero down payment')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  {t('مدة التقسيط الافتراضية (شهر)', 'Default Duration (months)')}
                </label>
                <input type="number" value={form.defaultInstallmentMonths} onChange={e => f('defaultInstallmentMonths', Number(e.target.value))} className="input-field text-sm" min={3} />
              </div>
            </div>

            {/* Daily custody note */}
            <div className="bg-[#0f2460]/5 border border-[#0f2460]/20 rounded-xl p-4">
              <h4 className="font-semibold text-[#0f2460] text-sm mb-2">{t('نظام تسليم العهدة اليومية', 'Daily Custody Delivery System')}</h4>
              <p className="text-slate-500 text-xs">
                {t('يلتزم المشرف بتسليم العهدة النقدية يومياً للمدير. التأخر أكثر من 24 ساعة يؤدي لإيقاف الحساب تلقائياً حتى يُفعّله المدير.',
                  'Supervisor must deliver daily cash custody to admin. Delay over 24 hours auto-suspends account until admin reactivates.')}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#0f2460] text-lg mb-4">{t('روابط التواصل الاجتماعي', 'Social Media Links')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Facebook', field: 'facebookUrl' },
                { label: 'Instagram', field: 'instagramUrl' },
                { label: 'Twitter / X', field: 'twitterUrl' },
                { label: 'TikTok', field: 'tiktokUrl' },
                { label: 'YouTube', field: 'youtubeUrl' },
              ].map(item => (
                <div key={item.field}>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">{item.label}</label>
                  <input value={(form as any)[item.field]} onChange={e => f(item.field as any, e.target.value)} className="input-field text-sm" placeholder="https://..." dir="ltr" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#0f2460] text-lg mb-4">{t('ألوان الموقع', 'Site Colors')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: t('اللون الأساسي', 'Primary Color'), field: 'primaryColor' },
                { label: t('اللون الثانوي (ذهبي)', 'Secondary Color (Gold)'), field: 'secondaryColor' },
                { label: t('لون التمييز', 'Accent Color'), field: 'accentColor' },
              ].map(item => (
                <div key={item.field}>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">{item.label}</label>
                  <div className="flex gap-2">
                    <input type="color" value={(form as any)[item.field]} onChange={e => f(item.field as any, e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border border-slate-200" />
                    <input value={(form as any)[item.field]} onChange={e => f(item.field as any, e.target.value)} className="input-field text-sm flex-1" dir="ltr" />
                  </div>
                  <div className="w-full h-3 rounded-full mt-2" style={{ backgroundColor: (form as any)[item.field] }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100">
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={18} />
            {t('حفظ جميع الإعدادات', 'Save All Settings')}
          </button>
        </div>
      </div>
    </div>
  );
}
