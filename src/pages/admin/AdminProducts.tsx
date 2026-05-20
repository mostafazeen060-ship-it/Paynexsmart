import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Package, RefreshCw, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

export default function AdminProducts() {
  const { t, lang } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({ nameAr: '', price: 0, imageUrl: '' });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) {
        const mapped = data.map((p: any) => ({
          id: p.id, nameAr: p.name, nameEn: p.name, name: p.name,
          price: Number(p.price), images: p.image_url ? [p.image_url] : ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop'],
          categoryAr: 'عام', brand: 'براند', source: 'manual', isActive: true, stock: 10
        }));
        setProducts(mapped);
      }
    } catch (e) {
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = products.filter(p => !search || p.nameAr.includes(search));

  async function handleSave() {
    if (!form.nameAr || !form.price) return;
    try {
      if (editing) {
        await supabase.from('products').update({ name: form.nameAr, price: form.price, image_url: form.imageUrl }).eq('id', editing.id);
        toast.success('تم التعديل بنجاح');
      } else {
        await supabase.from('products').insert([{ name: form.nameAr, price: form.price, image_url: form.imageUrl }]);
        toast.success('تم الإضافة بنجاح');
      }
      setShowForm(false);
      reload();
    } catch {
      toast.error('فشل الحفظ');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد الحذف؟')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('تم الحذف');
    reload();
  }

  return (
    <div className="space-y-5 p-4 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Package /> إدارة المنتجات بالسيرفر</h1>
        <button onClick={() => { setEditing(null); setForm({ nameAr: '', price: 0, imageUrl: '' }); setShowForm(true); }} className="px-4 py-2 bg-[#0f2460] text-white rounded-lg text-sm">+ إضافة منتج</button>
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm">
        <input type="text" placeholder="بحث باسم المنتج..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" />
        <button onClick={reload} className="p-2 border rounded-lg"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-xl border shadow-md space-y-3">
          <h3 className="font-bold text-sm">{editing ? 'تعديل المنتج' : 'منتج جديد'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" placeholder="اسم المنتج" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="p-2 border rounded-lg text-sm" />
            <input type="number" placeholder="السعر" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="p-2 border rounded-lg text-sm" />
            <input type="text" placeholder="رابط الصورة" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="p-2 border rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border rounded-lg">إلغاء</button>
            <button onClick={handleSave} className="px-4 py-1.5 bg-[#0f2460] text-white rounded-lg">حفظ في السيرفر</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-sm text-slate-400">جاري التحميل من Supabase...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border overflow-hidden shadow-sm p-3 space-y-2">
              <img src={p.images[0]} className="w-full aspect-square object-cover rounded-lg" alt="" />
              <div className="font-bold text-sm truncate">{p.nameAr}</div>
              <div className="text-sm text-[#0f2460] font-black">{formatCurrency(p.price, lang)}</div>
              <div className="flex gap-2 text-xs pt-1">
                <button onClick={() => { setEditing(p); setForm({ nameAr: p.nameAr, price: p.price, imageUrl: p.images[0] }); setShowForm(true); }} className="flex-1 py-1 bg-slate-100 rounded-lg">تعديل</button>
                <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-red-50 text-red-500 rounded-lg">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
