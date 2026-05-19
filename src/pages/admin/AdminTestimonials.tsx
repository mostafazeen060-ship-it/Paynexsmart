/**
 * AdminTestimonials — Manage customer reviews displayed on the homepage.
 * Admin can add, activate/deactivate, and delete testimonials.
 */

import { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Eye, EyeOff, MessageSquare, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getTestimonials, saveTestimonials, addTestimonial, deleteTestimonial, type TestimonialItem } from '@/lib/storage';
import { PROVINCES } from '@/constants/data';
import { toast } from 'sonner';

export default function AdminTestimonials() {
  const { t } = useApp();
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', province: 'cairo', text: '', rating: 5 });

  function reload() { setItems(getTestimonials()); }
  useEffect(() => { reload(); }, []);

  function handleAdd() {
    if (!form.name.trim() || !form.text.trim()) {
      toast.error(t('الاسم والنص مطلوبان', 'Name and text are required'));
      return;
    }
    addTestimonial({ ...form, isActive: true });
    toast.success(t('تمت إضافة الرأي', 'Testimonial added'));
    setForm({ name: '', province: 'cairo', text: '', rating: 5 });
    setShowForm(false);
    reload();
  }

  function toggleActive(id: string) {
    const updated = items.map(i => i.id === id ? { ...i, isActive: !i.isActive } : i);
    saveTestimonials(updated);
    reload();
  }

  function handleDelete(id: string) {
    deleteTestimonial(id);
    toast.success(t('تم الحذف', 'Deleted'));
    reload();
  }

  const active = items.filter(i => i.isActive).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a1628] to-[#0e2044] rounded-2xl p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c9a84c]/20 rounded-xl flex items-center justify-center">
            <MessageSquare size={20} className="text-[#c9a84c]" />
          </div>
          <div>
            <h2 className="font-black text-lg">{t('إدارة آراء العملاء', 'Manage Testimonials')}</h2>
            <p className="text-white/50 text-xs">{active} {t('رأي نشط من أصل', 'active out of')} {items.length}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-gold flex items-center gap-2 text-sm">
          <Plus size={15} /> {t('إضافة رأي', 'Add Testimonial')}
        </button>
      </div>

      {/* Note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        💡 {t('الآراء النشطة تظهر في شريط Marquee في الصفحة الرئيسية. إذا لم يكن هناك آراء مُدارة، تظهر الآراء الافتراضية.', 'Active testimonials appear in the homepage marquee. If no managed testimonials exist, default ones are shown.')}
      </div>

      {/* List */}
      <div className="grid md:grid-cols-2 gap-4">
        {items.length === 0 && (
          <div className="col-span-2 text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
            <p>{t('لا توجد آراء مُضافة — الصفحة الرئيسية تعرض الآراء الافتراضية', 'No testimonials added — homepage shows default ones')}</p>
          </div>
        )}
        {items.map(item => (
          <div key={item.id} className={`bg-white rounded-2xl border p-4 transition-all ${item.isActive ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-[#0a1628] text-sm">{item.name}</div>
                <div className="text-xs text-slate-400">{PROVINCES.find(p => p.id === item.province)?.nameAr ?? item.province}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(item.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.isActive ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  title={item.isActive ? t('إخفاء', 'Hide') : t('إظهار', 'Show')}>
                  {item.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button onClick={() => handleDelete(item.id)}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} className={s <= item.rating ? 'fill-[#c9a84c] text-[#c9a84c]' : 'text-slate-200'} />
              ))}
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">"{item.text}"</p>
          </div>
        ))}
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-[#0a1628]">{t('إضافة رأي عميل جديد', 'Add New Testimonial')}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('اسم العميل', 'Customer Name')}</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field" placeholder={t('مثال: أحمد محمد', 'e.g., Ahmed Mohamed')} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('المحافظة', 'Province')}</label>
                <select value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))} className="input-field">
                  {PROVINCES.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('التقييم', 'Rating')}</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setForm(p => ({ ...p, rating: s }))}>
                      <Star size={22} className={s <= form.rating ? 'fill-[#c9a84c] text-[#c9a84c]' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('نص الرأي', 'Review Text')}</label>
                <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                  className="input-field resize-none" rows={3}
                  placeholder={t('اكتب رأي العميل الإيجابي هنا...', 'Write positive customer feedback here...')} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleAdd} className="btn-primary flex-1">{t('حفظ الرأي', 'Save Testimonial')}</button>
                <button onClick={() => setShowForm(false)} className="btn-outline flex-1">{t('إلغاء', 'Cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
