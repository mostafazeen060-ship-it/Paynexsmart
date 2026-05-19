import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Search, Upload, Package,
  CheckCircle, AlertCircle, Clock, X, FileJson,
  RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff,
  Link2, Settings2, Wifi, WifiOff, BarChart3, Zap,
  Info, RotateCcw,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  getProducts, addProduct, updateProduct, deleteProduct,
  importScrapedProducts, getScraperHistory, getSiteSettings, saveSiteSettings,
  type ScraperImportRecord,
} from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';

// ── Sync-status helpers ───────────────────────────────────────────────────────
type SyncStatus = 'idle' | 'fetching' | 'importing' | 'done' | 'error';

function hoursSinceDate(iso: string | undefined): number {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const { t, lang } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Local state ──
  const [products, setProducts]         = useState<Product[]>([]);
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState<Product | null>(null);
  const [importing, setImporting]       = useState(false);
  const [history, setHistory]           = useState<ScraperImportRecord[]>([]);
  const [showHistory, setShowHistory]   = useState(false);
  const [lastResult, setLastResult]     = useState<ScraperImportRecord | null>(null);
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // URL-based sync state
  const [syncStatus, setSyncStatus]         = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress]     = useState('');
  const [syncUrl, setSyncUrl]               = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncHours, setAutoSyncHours]   = useState(24);
  const [urlDirty, setUrlDirty]             = useState(false);

  const [form, setForm] = useState({
    nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '',
    price: 0, originalPrice: 0, categoryAr: '', category: '',
    brand: '', imageUrl: '', stock: 10, isActive: true,
  });

  // ── Load everything ──────────────────────────────────────────────────────
  function reload() {
    setProducts(getProducts());
    setHistory(getScraperHistory());
  }

  useEffect(() => {
    reload();
    const cfg = getSiteSettings();
    setSyncUrl(cfg.syncJsonUrl ?? '');
    setAutoSyncEnabled(cfg.autoSyncEnabled ?? false);
    setAutoSyncHours(cfg.autoSyncIntervalHours ?? 24);
  }, []);

  // ── Auto-sync on page load ───────────────────────────────────────────────
  useEffect(() => {
    const cfg = getSiteSettings();
    if (!cfg.autoSyncEnabled || !cfg.syncJsonUrl) return;
    const hours = cfg.autoSyncIntervalHours ?? 24;
    if (hoursSinceDate(cfg.lastSyncDate) >= hours) {
      // Slight delay so UI renders first
      const timer = setTimeout(() => triggerUrlSync(cfg.syncJsonUrl!, true), 1500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Computed values ──────────────────────────────────────────────────────
  const categories = ['all', ...Array.from(new Set(products.map(p => p.categoryAr).filter(Boolean)))];
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.nameAr.includes(search) ||
      p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.categoryAr === categoryFilter;
    return matchSearch && matchCat;
  });

  const sourceStats = {
    btech:  products.filter(p => p.source === 'btech').length,
    aman:   products.filter(p => p.source === 'aman').length,
    manual: products.filter(p => p.source === 'manual').length,
    active: products.filter(p => p.isActive).length,
    hidden: products.filter(p => !p.isActive).length,
  };

  const categoryBreakdown = Array.from(
    products.reduce((m, p) => {
      const cat = p.categoryAr || p.category || t('غير مصنف', 'Uncategorized');
      m.set(cat, (m.get(cat) ?? 0) + 1);
      return m;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);

  const lastImport = history[0] ?? null;

  // ── Save sync settings ───────────────────────────────────────────────────
  function saveSyncSettings() {
    const cfg = getSiteSettings();
    saveSiteSettings({
      ...cfg,
      syncJsonUrl:          syncUrl.trim(),
      autoSyncEnabled,
      autoSyncIntervalHours: autoSyncHours,
    });
    setUrlDirty(false);
    toast.success(t('تم حفظ إعدادات المزامنة', 'Sync settings saved'));
  }

  // ── URL-based sync ───────────────────────────────────────────────────────
  const triggerUrlSync = useCallback(async (url: string, silent = false) => {
    if (!url.trim()) {
      toast.error(t('أدخل رابط ملف JSON أولاً', 'Enter a JSON file URL first'));
      return;
    }

    setSyncStatus('fetching');
    setSyncProgress(t('جاري تحميل الملف...', 'Fetching file...'));
    if (!silent) toast.info(t('جاري المزامنة...', 'Syncing...'));

    try {
      // Use a CORS proxy for GitHub raw or other CORS-restricted sources
      let fetchUrl = url.trim();
      // Convert github.com blob URL → raw.githubusercontent.com
      fetchUrl = fetchUrl
        .replace('https://github.com/', 'https://raw.githubusercontent.com/')
        .replace('/blob/', '/');

      const res = await fetch(fetchUrl, {
        headers: { Accept: 'application/json, text/plain, */*' },
        cache: 'no-cache',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

      setSyncStatus('importing');
      setSyncProgress(t('جاري معالجة البيانات...', 'Processing data...'));

      const data = await res.json();
      const rawProducts: Record<string, unknown>[] = Array.isArray(data)
        ? data
        : (data.products ?? []);

      if (rawProducts.length === 0) {
        throw new Error(t('الملف لا يحتوي على منتجات', 'File contains no products'));
      }

      setSyncProgress(t(`جاري استيراد ${rawProducts.length} منتج...`, `Importing ${rawProducts.length} products...`));
      await new Promise(r => setTimeout(r, 50)); // yield to UI

      const result = importScrapedProducts(rawProducts, 'btech');
      setLastResult(result);
      reload();
      setSyncStatus('done');

      const msg = t(
        `✅ مزامنة مكتملة: +${result.added} جديد، ${result.updated} محدَّث`,
        `✅ Sync complete: +${result.added} new, ${result.updated} updated`,
      );
      if (silent) toast.success(msg);
      else toast.success(msg);

      setSyncProgress('');
      setTimeout(() => setSyncStatus('idle'), 3000);

    } catch (err) {
      setSyncStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      setSyncProgress(msg);
      if (!silent) toast.error(t(`فشل الاستيراد: ${msg}`, `Sync failed: ${msg}`));
      setTimeout(() => { setSyncStatus('idle'); setSyncProgress(''); }, 5000);
    }
  }, [t]);

  // ── File import ──────────────────────────────────────────────────────────
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      toast.error(t('يرجى اختيار ملف JSON', 'Please select a JSON file'));
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const rawProducts: Record<string, unknown>[] = Array.isArray(data) ? data : data.products ?? [];

      if (rawProducts.length === 0) {
        toast.error(t('الملف لا يحتوي على منتجات', 'File contains no products'));
        return;
      }

      toast.info(t(`جاري استيراد ${rawProducts.length} منتج...`, `Importing ${rawProducts.length} products...`));
      await new Promise(r => setTimeout(r, 50));

      const result = importScrapedProducts(rawProducts, 'btech');
      setLastResult(result);
      reload();

      if (result.failed > 0) {
        toast.warning(t(
          `تم الاستيراد: +${result.added} جديد، ${result.updated} محدَّث، ${result.failed} فشل`,
          `Imported: +${result.added} new, ${result.updated} updated, ${result.failed} failed`,
        ));
      } else {
        toast.success(t(
          `✅ تم الاستيراد: +${result.added} جديد، ${result.updated} محدَّث`,
          `✅ Imported: +${result.added} new, ${result.updated} updated`,
        ));
      }
    } catch {
      toast.error(t('خطأ في قراءة الملف', 'Failed to parse JSON file'));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // ── Product CRUD ─────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null);
    setForm({ nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', price: 0, originalPrice: 0, categoryAr: '', category: '', brand: '', imageUrl: '', stock: 10, isActive: true });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({ nameAr: p.nameAr, nameEn: p.nameEn, descriptionAr: p.descriptionAr, descriptionEn: p.descriptionEn, price: p.price, originalPrice: p.originalPrice ?? 0, categoryAr: p.categoryAr, category: p.category, brand: p.brand, imageUrl: p.images[0] ?? '', stock: p.stock, isActive: p.isActive });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.nameAr || !form.price) { toast.error(t('الاسم والسعر مطلوبان', 'Name and price required')); return; }
    if (editing) {
      updateProduct(editing.id, { nameAr: form.nameAr, nameEn: form.nameEn, descriptionAr: form.descriptionAr, descriptionEn: form.descriptionEn, price: form.price, originalPrice: form.originalPrice || undefined, categoryAr: form.categoryAr, category: form.category || form.categoryAr, brand: form.brand, images: form.imageUrl ? [form.imageUrl] : editing.images, stock: form.stock, isActive: form.isActive });
      toast.success(t('تم تعديل المنتج', 'Product updated'));
    } else {
      addProduct({ nameAr: form.nameAr, nameEn: form.nameEn || form.nameAr, name: form.nameAr, description: form.descriptionAr, descriptionAr: form.descriptionAr, descriptionEn: form.descriptionEn, price: form.price, originalPrice: form.originalPrice || undefined, categoryAr: form.categoryAr, category: form.category || form.categoryAr, brand: form.brand, images: [form.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop'], source: 'manual', isActive: form.isActive, stock: form.stock });
      toast.success(t('تم إضافة المنتج', 'Product added'));
    }
    reload();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (!confirm(t('هل تريد حذف هذا المنتج؟', 'Delete this product?'))) return;
    deleteProduct(id);
    reload();
    toast.success(t('تم الحذف', 'Deleted'));
  }

  function handleToggleActive(p: Product) {
    updateProduct(p.id, { isActive: !p.isActive });
    reload();
  }

  // ── Sync status badge helpers ────────────────────────────────────────────
  const syncBgColor: Record<SyncStatus, string> = {
    idle:      '',
    fetching:  'bg-blue-50 border-blue-100',
    importing: 'bg-blue-50 border-blue-100',
    done:      'bg-green-50 border-green-100',
    error:     'bg-red-50 border-red-100',
  };
  const syncTextColor: Record<SyncStatus, string> = {
    idle:      '',
    fetching:  'text-blue-600',
    importing: 'text-blue-600',
    done:      'text-green-700',
    error:     'text-red-600',
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ══ SYNC ENGINE PANEL ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header row */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0f2460]/10 rounded-xl flex items-center justify-center">
              <FileJson size={18} className="text-[#0f2460]" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                {t('مزامنة منتجات BTech', 'BTech Product Sync')}
              </p>
              <p className="text-xs text-slate-400">
                {lastImport
                  ? t(
                      `آخر مزامنة: ${new Date(lastImport.importedAt).toLocaleString('ar-EG')} · ${lastImport.added + lastImport.updated} منتج`,
                      `Last sync: ${new Date(lastImport.importedAt).toLocaleString()} · ${lastImport.added + lastImport.updated} products`,
                    )
                  : t('لم تتم أي مزامنة بعد', 'No syncs yet')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(h => !h)}
                className="text-xs text-slate-500 hover:text-[#0f2460] flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {t('السجل', 'History')}
              </button>
            )}
            <button
              onClick={() => setShowSyncSettings(s => !s)}
              className={`text-xs flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${showSyncSettings ? 'bg-[#0f2460] text-white' : 'text-slate-500 hover:text-[#0f2460] hover:bg-slate-50'}`}
            >
              <Settings2 size={14} />
              {t('إعدادات', 'Settings')}
            </button>
            <label className={`btn-primary text-sm flex items-center gap-2 cursor-pointer ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
              {importing ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
              {importing ? t('جاري الاستيراد...', 'Importing...') : t('رفع JSON', 'Upload JSON')}
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileImport} disabled={importing} />
            </label>
          </div>
        </div>

        {/* ── Sync Settings Panel (collapsible) ── */}
        {showSyncSettings && (
          <div className="border-b border-slate-100 bg-slate-50/60 p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <Link2 size={13} />
              {t('مزامنة تلقائية من رابط', 'Auto-Sync from URL')}
            </p>

            {/* URL input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                {t('رابط ملف btech-products.json', 'URL of btech-products.json')}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={syncUrl}
                  onChange={e => { setSyncUrl(e.target.value); setUrlDirty(true); }}
                  placeholder="https://raw.githubusercontent.com/user/repo/main/scraper/btech-products.json"
                  className="input-field text-xs flex-1 font-mono"
                  dir="ltr"
                />
                <button
                  onClick={() => triggerUrlSync(syncUrl)}
                  disabled={!syncUrl.trim() || syncStatus === 'fetching' || syncStatus === 'importing'}
                  className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  {syncStatus === 'fetching' || syncStatus === 'importing'
                    ? <RefreshCw size={14} className="animate-spin" />
                    : <Zap size={14} />}
                  {t('مزامنة الآن', 'Sync Now')}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {t(
                  'يمكنك استضافة الملف على GitHub ورفع الرابط الخام هنا — سيتم إعادة الاستيراد تلقائياً مع إزالة التكرارات',
                  'Host the file on GitHub and paste the raw URL here — re-imports auto-deduplicate existing products',
                )}
              </p>
            </div>

            {/* Auto-sync toggle + interval */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setAutoSyncEnabled(v => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${autoSyncEnabled ? 'bg-[#0f2460]' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${autoSyncEnabled ? 'start-5' : 'start-0.5'}`} />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {t('مزامنة تلقائية عند فتح الصفحة', 'Auto-sync on page open')}
                </span>
              </label>

              {autoSyncEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{t('كل', 'Every')}</span>
                  <select
                    value={autoSyncHours}
                    onChange={e => setAutoSyncHours(Number(e.target.value))}
                    className="input-field text-xs w-auto py-1"
                  >
                    {[6, 12, 24, 48, 72].map(h => (
                      <option key={h} value={h}>{h} {t('ساعة', 'hours')}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={saveSyncSettings}
                disabled={!urlDirty && true}
                className="btn-outline text-xs flex items-center gap-1.5"
              >
                <CheckCircle size={13} />
                {t('حفظ الإعدادات', 'Save Settings')}
              </button>
            </div>

            {/* How-to tip */}
            <div className="bg-[#0f2460]/5 rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-[#0f2460]">{t('خطوات الإعداد', 'Setup Steps')}</p>
              <p>1. {t('شغّل السكريبت محلياً:', 'Run the scraper locally:')}</p>
              <code className="block bg-white rounded-lg px-2 py-1 font-mono text-[11px] text-slate-700 border border-slate-100 mt-1" dir="ltr">
                cd scraper &amp;&amp; npm install &amp;&amp; node btech-scraper.js --test
              </code>
              <p className="mt-1">2. {t('أو أضف وكيل سكن (residential proxy) لتشغيله من أي مكان:', 'Or add a residential proxy to run from anywhere:')}</p>
              <code className="block bg-white rounded-lg px-2 py-1 font-mono text-[11px] text-slate-700 border border-slate-100 mt-1" dir="ltr">
                node btech-scraper.js --proxy http://user:pass@host:port
              </code>
              <p className="mt-1">3. {t('ارفع btech-products.json على GitHub وضع الرابط الخام أعلاه.', 'Upload btech-products.json to GitHub and paste the raw URL above.')}</p>
            </div>
          </div>
        )}

        {/* ── Live sync progress bar ── */}
        {syncStatus !== 'idle' && (
          <div className={`px-4 py-3 border-b text-sm flex items-center gap-3 ${syncBgColor[syncStatus]}`}>
            {syncStatus === 'fetching' || syncStatus === 'importing'
              ? <RefreshCw size={14} className={`animate-spin flex-shrink-0 ${syncTextColor[syncStatus]}`} />
              : syncStatus === 'done'
              ? <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
              : <AlertCircle size={14} className="text-red-500 flex-shrink-0" />}
            <span className={`font-medium ${syncTextColor[syncStatus]}`}>{syncProgress}</span>
          </div>
        )}

        {/* ── Last import result banner ── */}
        {lastResult && syncStatus === 'idle' && (
          <div className={`px-4 py-3 text-sm flex items-center justify-between gap-3 border-b ${lastResult.failed > 0 ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
            <div className="flex items-center gap-5 flex-wrap">
              <span className="flex items-center gap-1.5 text-green-700 font-medium">
                <CheckCircle size={14} /> +{lastResult.added} {t('جديد', 'added')}
              </span>
              <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                <RotateCcw size={14} /> {lastResult.updated} {t('محدَّث', 'updated')}
              </span>
              {lastResult.skipped > 0 && (
                <span className="text-slate-500">{lastResult.skipped} {t('متجاوَز', 'skipped')}</span>
              )}
              {lastResult.failed > 0 && (
                <span className="flex items-center gap-1.5 text-red-600 font-medium">
                  <AlertCircle size={14} /> {lastResult.failed} {t('فشل', 'failed')}
                </span>
              )}
              <span className="text-slate-400 text-xs">{(lastResult.durationMs / 1000).toFixed(1)}s</span>
            </div>
            <button onClick={() => setLastResult(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
        )}

        {/* ── Import history ── */}
        {showHistory && history.length > 0 && (
          <div className="divide-y divide-slate-50">
            <div className="px-4 py-2 bg-slate-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={12} /> {t('سجل المزامنة', 'Sync History')}
              </p>
              <span className="text-[11px] text-slate-400">{history.length} {t('عملية', 'syncs')}</span>
            </div>
            {history.slice(0, 8).map(rec => (
              <div key={rec.id} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rec.failed > 0 ? 'bg-amber-400' : 'bg-green-400'}`} />
                  <div>
                    <p className="font-medium text-slate-700 text-xs">
                      +{rec.added} {t('جديد', 'new')} · {rec.updated} {t('محدَّث', 'updated')}
                      {rec.failed > 0 && <span className="text-red-500 ms-2">{rec.failed} {t('فشل', 'failed')}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(rec.importedAt).toLocaleString(lang === 'ar' ? 'ar-EG' : undefined)}
                      · {rec.totalInFile} {t('في الملف', 'in file')} · {(rec.durationMs / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${rec.source === 'btech' ? 'bg-[#0f2460]/10 text-[#0f2460]' : 'bg-slate-100 text-slate-500'}`}>
                  {rec.source}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Category & source breakdown ── */}
        <div className="px-4 py-2.5 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {sourceStats.btech > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#0f2460] rounded-full" />
                BTech: {sourceStats.btech}
              </span>
            )}
            {sourceStats.manual > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full" />
                {t('يدوي', 'Manual')}: {sourceStats.manual}
              </span>
            )}
            {autoSyncEnabled && syncUrl && (
              <span className="flex items-center gap-1 text-green-600">
                <Wifi size={11} /> {t('مزامنة تلقائية مفعّلة', 'Auto-sync on')}
              </span>
            )}
            {!autoSyncEnabled && syncUrl && (
              <span className="flex items-center gap-1 text-slate-400">
                <WifiOff size={11} /> {t('مزامنة يدوية', 'Manual sync')}
              </span>
            )}
          </div>
          {categoryBreakdown.length > 0 && (
            <button
              onClick={() => setShowBreakdown(b => !b)}
              className="text-xs text-slate-400 hover:text-[#0f2460] flex items-center gap-1 transition-colors"
            >
              <BarChart3 size={12} />
              {showBreakdown ? t('إخفاء التوزيع', 'Hide breakdown') : t('توزيع الفئات', 'Category breakdown')}
            </button>
          )}
        </div>

        {showBreakdown && categoryBreakdown.length > 0 && (
          <div className="px-4 pb-3 border-t border-slate-50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
              {categoryBreakdown.map(([cat, count]) => {
                const pct = Math.round((count / products.length) * 100);
                return (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-slate-600 truncate">{cat}</span>
                        <span className="text-slate-400 font-medium ms-1">{count}</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0f2460]/30 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══ TOOLBAR ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('بحث بالاسم أو العلامة التجارية...', 'Search by name or brand...')}
            className="input-field ps-9 text-sm"
          />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field text-sm w-auto">
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? t('كل الفئات', 'All Categories') : c}</option>
          ))}
        </select>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('إضافة منتج', 'Add Product')}
        </button>
      </div>

      {/* ══ STATS ROW ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('إجمالي المنتجات', 'Total Products'), value: products.length,       color: 'text-[#0f2460]' },
          { label: t('نشط',             'Active'),          value: sourceStats.active,    color: 'text-green-600' },
          { label: t('BTech',           'BTech'),           value: sourceStats.btech,     color: 'text-[#0f2460]' },
          { label: t('مضاف يدوياً',     'Manual'),          value: sourceStats.manual,    color: 'text-slate-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ══ PRODUCT GRID ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(p => (
          <div key={p.id} className={`bg-white rounded-2xl shadow-card overflow-hidden border transition-opacity ${p.isActive ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
            <div className="aspect-square bg-slate-50 overflow-hidden relative">
              <img
                src={p.images[0]}
                alt={p.nameAr}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop'; }}
              />
              {p.originalPrice && p.originalPrice > p.price && (
                <span className="absolute top-2 start-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                </span>
              )}
              {p.source === 'btech' && (
                <span className="absolute top-2 end-2 bg-[#0f2460] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">BTech</span>
              )}
            </div>
            <div className="p-3">
              <div className="font-semibold text-slate-800 text-sm truncate mb-0.5">
                {lang === 'ar' ? p.nameAr : p.nameEn}
              </div>
              {p.brand && <div className="text-xs text-slate-400 mb-1">{p.brand}</div>}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-[#0f2460] text-sm">{formatCurrency(p.price, lang)}</span>
                {p.originalPrice && p.originalPrice > p.price && (
                  <span className="text-xs text-slate-400 line-through">{formatCurrency(p.originalPrice, lang)}</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 py-1.5 rounded-lg bg-[#0f2460]/10 text-[#0f2460] text-xs font-medium hover:bg-[#0f2460] hover:text-white transition-all flex items-center justify-center gap-1"
                >
                  <Edit2 size={11} /> {t('تعديل', 'Edit')}
                </button>
                <button
                  onClick={() => handleToggleActive(p)}
                  title={p.isActive ? t('إخفاء', 'Hide') : t('إظهار', 'Show')}
                  className="w-8 py-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center"
                >
                  {p.isActive ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="w-8 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <Package size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {search || categoryFilter !== 'all'
                ? t('لا توجد منتجات مطابقة', 'No matching products')
                : t('لا توجد منتجات — استورد ملف JSON أو أضف يدوياً', 'No products — sync a JSON file or add manually')}
            </p>
            {!search && categoryFilter === 'all' && (
              <button
                onClick={() => setShowSyncSettings(true)}
                className="mt-3 text-xs text-[#0f2460] hover:underline flex items-center gap-1 mx-auto"
              >
                <Info size={12} /> {t('إعداد المزامنة التلقائية', 'Set up auto-sync')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL ═══════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-[#0f2460]">
                {editing ? t('تعديل منتج', 'Edit Product') : t('إضافة منتج', 'Add Product')}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { label: t('الاسم بالعربية *', 'Name AR *'), key: 'nameAr' as const },
                  { label: t('الاسم بالإنجليزية', 'Name EN'), key: 'nameEn' as const },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">{f.label}</label>
                    <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input-field text-sm" />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t('السعر (ج.م) *', 'Price (EGP) *')}</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t('السعر الأصلي', 'Original Price')}</label>
                  <input type="number" min="0" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: Number(e.target.value) }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t('الفئة (عربي)', 'Category AR')}</label>
                  <input value={form.categoryAr} onChange={e => setForm(f => ({ ...f, categoryAr: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t('العلامة التجارية', 'Brand')}</label>
                  <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t('المخزون', 'Stock')}</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="input-field text-sm" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="text-sm font-medium text-slate-700 mb-2">{t('الحالة', 'Status')}</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className={`w-full py-2 rounded-xl text-sm font-medium border-2 transition-all ${form.isActive ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}>
                    {form.isActive ? t('نشط', 'Active') : t('مخفي', 'Hidden')}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('رابط الصورة', 'Image URL')}</label>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="input-field text-sm" placeholder="https://..." />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="" className="mt-2 h-20 w-20 object-cover rounded-lg border border-slate-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('الوصف بالعربية', 'Description AR')}</label>
                <textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} className="input-field text-sm resize-none" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="btn-primary flex-1">
                  {editing ? t('حفظ التعديلات', 'Save Changes') : t('إضافة المنتج', 'Add Product')}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline flex-1">{t('إلغاء', 'Cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
