import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Package, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';

const CATEGORIES = ['موبايلات', 'لابتوبات', 'شاشات', 'أجهزة منزلية'];

export default function AdminProducts() {
  const { t } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    nameAr: '', price: 0, imageUrl: '', category: 'موبايلات', stock: 10, isActive: true
  });

  const reload = useCallback(async () => {
    setLoading(true);
    // جلب البيانات من Supabase
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.nameAr.includes(search) || p.brand?.includes(search);
      const matchCat = selectedCategory === 'الكل' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد؟')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('تم حذف المنتج');
    reload();
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h2 className="text-2xl font-black text-[#0f2460]">إدارة المنتجات</h2>
        <button onClick={() => setShowForm(true)} className="bg-[#0f2460] text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> منتج جديد
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['الكل', ...CATEGORIES].map(cat => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${selectedCategory === cat ? 'bg-[#d4a339] text-white' : 'bg-white border'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm">
            <img src={p.imageUrl} className="h-32 w-full object-contain mb-3" />
            <h3 className="font-bold text-sm mb-1">{p.nameAr}</h3>
            <p className="text-[#0f2460] font-black">{p.price.toLocaleString()} ج.م</p>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <button onClick={() => { setEditing(p); setShowForm(true); }} className="flex-1 text-xs py-2 bg-slate-100 rounded-lg">تعديل</button>
              <button onClick={() => handleDelete(p.id)} className="px-2 text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
