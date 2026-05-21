import { useState } from 'react';
import { Search, Save, Globe, FileText, Tag, Zap, Shield } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export default function AdminSEO() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<'meta' | 'scripts' | 'schema'>('meta');

  const handleSave = () => {
    toast.success(t('تم حفظ إعدادات الـ SEO بنجاح', 'SEO settings saved successfully'));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-black text-[#0f2460] mb-6">إدارة تحسين محركات البحث (SEO)</h2>

      {/* التبويبات */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        <button onClick={() => setActiveTab('meta')} className={`px-4 py-2 font-bold ${activeTab === 'meta' ? 'text-[#0f2460] border-b-2 border-[#0f2460]' : 'text-slate-500'}`}>
          <Globe size={18} className="inline mr-2" /> الميتا تاج
        </button>
        <button onClick={() => setActiveTab('schema')} className={`px-4 py-2 font-bold ${activeTab === 'schema' ? 'text-[#0f2460] border-b-2 border-[#0f2460]' : 'text-slate-500'}`}>
          <Tag size={18} className="inline mr-2" /> بيانات المنتجات (Schema)
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        {activeTab === 'meta' ? (
          <div className="space-y-4">
            <div>
              <label className="block font-bold mb-2">عنوان الصفحة الرئيسية</label>
              <input className="w-full p-3 border rounded-lg" defaultValue="PayNex باينكس - حلول التقسيط الذكي" />
            </div>
            <div>
              <label className="block font-bold mb-2">وصف الصفحة (Meta Description)</label>
              <textarea className="w-full p-3 border rounded-lg" rows={3} defaultValue="اشتري موبايلات ولابتوبات وأجهزة منزلية بأقساط شهرية ميسرة بدون فوائد." />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h3 className="font-bold text-[#0f2460] mb-2 flex items-center gap-2">
                <Zap size={18} /> تفعيل بيانات التقسيط (Installment Schema)
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                تفعيل هذا الخيار سيخبر جوجل أن منتجاتك متاحة بنظام تقسيط، مما يظهر سعر القسط الشهري مباشرة في نتائج البحث.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <span className="font-bold">إضافة بيانات التقسيط تلقائياً لكل المنتجات</span>
              </label>
            </div>
            <textarea className="w-full p-4 border rounded-lg font-mono text-xs h-64" placeholder="هنا يمكنك تخصيص الـ JSON-LD Schema..." />
          </div>
        )}

        <button onClick={handleSave} className="mt-6 bg-[#0f2460] text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-[#1a3a8a]">
          <Save size={18} /> حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}
