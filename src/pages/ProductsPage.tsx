import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/features/ProductCard';
import { useApp } from '@/contexts/AppContext';
import { getProducts } from '@/lib/storage';
import type { Product } from '@/types';

const CATEGORIES_AR = ['الكل', 'موبايلات', 'لابتوبات', 'شاشات وتليفزيونات', 'أجهزة منزلية', 'ألعاب'];
const CATEGORIES_EN = ['All', 'Phones', 'Laptops', 'TVs', 'Appliances', 'Gaming'];

const SORT_OPTIONS_AR = ['الأحدث', 'الأعلى سعراً', 'الأقل سعراً', 'الاسم أ-ي'];
const SORT_OPTIONS_EN = ['Newest', 'Price: High to Low', 'Price: Low to High', 'Name A-Z'];

export default function ProductsPage() {
  const { t, lang } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [sortIdx, setSortIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState(100000);

  useEffect(() => {
    setProducts(getProducts().filter(p => p.isActive));
    const cat = searchParams.get('category');
    if (cat) {
      const idx = CATEGORIES_AR.findIndex(c => c.includes(cat) || c === cat);
      if (idx > 0) setCategoryIdx(idx);
    }
  }, [searchParams]);

  const categories = lang === 'ar' ? CATEGORIES_AR : CATEGORIES_EN;
  const sortOptions = lang === 'ar' ? SORT_OPTIONS_AR : SORT_OPTIONS_EN;

  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    if (categoryIdx > 0) {
      const cat = CATEGORIES_AR[categoryIdx].replace('الكل', '');
      result = result.filter(p => p.categoryAr.includes(cat));
    }

    result = result.filter(p => p.price <= priceMax);

    switch (sortIdx) {
      case 1: result.sort((a, b) => b.price - a.price); break;
      case 2: result.sort((a, b) => a.price - b.price); break;
      case 3: result.sort((a, b) => a.nameAr.localeCompare(b.nameAr)); break;
      default: result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [products, search, categoryIdx, sortIdx, priceMax]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams(search ? { q: search } : {});
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Page Header */}
      <div className="gradient-hero py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
            {t('جميع المنتجات', 'All Products')}
          </h1>
          <p className="text-white/70">
            {t('اشتري أي منتج بالتقسيط المريح - بدون فوائد', 'Buy any product with easy installments - No interest')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl shadow-card p-4 mb-6 flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('ابحث عن منتج...', 'Search for a product...')}
                className="input-field ps-10 text-sm"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary px-6">
              {t('بحث', 'Search')}
            </button>
          </form>

          <div className="flex gap-2">
            <select
              value={sortIdx}
              onChange={e => setSortIdx(Number(e.target.value))}
              className="input-field text-sm w-auto flex-1 md:w-48"
            >
              {sortOptions.map((o, i) => <option key={i} value={i}>{o}</option>)}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-outline flex items-center gap-2 px-4 ${showFilters ? 'bg-[#0f2460] text-white' : ''}`}
            >
              <Filter size={16} />
              {t('فلترة', 'Filter')}
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-card p-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">{t('فلاتر متقدمة', 'Advanced Filters')}</h3>
              <button onClick={() => { setCategoryIdx(0); setPriceMax(100000); }} className="text-sm text-[#0f2460] flex items-center gap-1">
                <RotateCcw size={14} />
                {t('إعادة ضبط', 'Reset')}
              </button>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-2 block">
                {t('الحد الأقصى للسعر:', 'Max Price:')} {priceMax.toLocaleString()} {t('ج.م', 'EGP')}
              </label>
              <input
                type="range"
                min={1000}
                max={100000}
                step={1000}
                value={priceMax}
                onChange={e => setPriceMax(Number(e.target.value))}
                className="w-full accent-[#0f2460]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1,000</span>
                <span>100,000</span>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setCategoryIdx(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                categoryIdx === i
                  ? 'bg-[#0f2460] text-white shadow-navy'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-600 text-sm">
            {t(`${filtered.length} منتج`, `${filtered.length} Products`)}
          </p>
        </div>

        {/* Products Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">{t('لا توجد نتائج', 'No Results')}</h3>
            <p className="text-slate-400">{t('جرب كلمات بحث مختلفة', 'Try different search terms')}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
