/**
 * AdminSEO — PayNex SEO & Code Injection Control Panel
 *
 * Allows admin to:
 * - Edit meta tags per page
 * - Inject custom header/footer scripts (GTM, AdSense, Pixel)
 * - View SEO health indicators
 * - Manage robots.txt content
 * - Configure structured data
 */

import { useState, useEffect } from 'react';
import {
  Search, Code, Globe, FileText, CheckCircle, XCircle,
  AlertTriangle, Eye, Save, RefreshCw, Tag, Zap, BarChart3, Shield
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

interface PageSEO {
  path: string;
  labelAr: string;
  titleAr: string;
  descAr: string;
  keywords: string;
  ogImage: string;
  schema: string;
  noIndex: boolean;
}

const DEFAULT_PAGES: PageSEO[] = [
  {
    path: '/',
    labelAr: 'الصفحة الرئيسية',
    titleAr: 'PayNex باينكس - حلول التقسيط الذكي | اشتري الآن وادفع بالأقساط',
    descAr: 'باينكس — حلول التقسيط الذكي في مصر. اشتري موبايلات ولابتوبات وأجهزة منزلية بأقساط شهرية ميسرة بدون فوائد.',
    keywords: 'باينكس, PayNex, تقسيط, شراء بالتقسيط, تمويل, قسط شهري, تقسيط بدون فوائد',
    ogImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop',
    schema: 'FinancialService',
    noIndex: false,
  },
  {
    path: '/products',
    labelAr: 'صفحة المنتجات',
    titleAr: 'تصفح المنتجات — PayNex باينكس | موبايلات ولابتوبات بالتقسيط',
    descAr: 'تصفح مئات المنتجات الإلكترونية — موبايلات، لابتوبات، تليفزيونات، أجهزة منزلية بأقساط ميسرة على باينكس.',
    keywords: 'موبايلات بالتقسيط, لابتوب بالتقسيط, أجهزة منزلية بالتقسيط, باينكس',
    ogImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=630&fit=crop',
    schema: 'ItemList',
    noIndex: false,
  },
  {
    path: '/contact',
    labelAr: 'تواصل معنا',
    titleAr: 'تواصل مع باينكس — PayNex | خدمة العملاء',
    descAr: 'تواصل مع فريق باينكس للدعم والاستفسارات. نحن هنا لمساعدتك في رحلة التقسيط.',
    keywords: 'تواصل باينكس, خدمة عملاء تقسيط',
    ogImage: '',
    schema: 'ContactPage',
    noIndex: false,
  },
  {
    path: '/login',
    labelAr: 'تسجيل الدخول',
    titleAr: 'تسجيل الدخول — PayNex باينكس',
    descAr: 'تسجيل الدخول لحساب باينكس الخاص بك.',
    keywords: '',
    ogImage: '',
    schema: '',
    noIndex: true, // Don't index login page
  },
];

const SEO_CHECKS = [
  { id: 'title',     labelAr: 'عنوان الصفحة (Title Tag)', check: (p: PageSEO) => p.titleAr.length >= 30 && p.titleAr.length <= 60 },
  { id: 'desc',      labelAr: 'الوصف التعريفي (Meta Description)', check: (p: PageSEO) => p.descAr.length >= 100 && p.descAr.length <= 160 },
  { id: 'keywords',  labelAr: 'الكلمات المفتاحية', check: (p: PageSEO) => p.keywords.length > 0 },
  { id: 'og',        labelAr: 'صورة الشبكات الاجتماعية (OG Image)', check: (p: PageSEO) => p.ogImage.length > 0 || p.noIndex },
  { id: 'schema',    labelAr: 'البيانات المنظمة (Schema)', check: (p: PageSEO) => p.schema.length > 0 || p.noIndex },
];

const STORAGE_KEY = 'paynex_seo_pages';
const HEADER_CODE_KEY = 'paynex_custom_header_code';
const FOOTER_CODE_KEY = 'paynex_custom_footer_code';
const ROBOTS_KEY = 'paynex_robots_txt';

export default function AdminSEO() {
  const { t } = useApp();
  const [pages, setPages] = useState<PageSEO[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? DEFAULT_PAGES; }
    catch { return DEFAULT_PAGES; }
  });
  const [selected, setSelected] = useState<PageSEO>(pages[0]);
  const [activeTab, setActiveTab] = useState<'pages' | 'code' | 'robots' | 'analytics'>('pages');
  const [headerCode, setHeaderCode] = useState(localStorage.getItem(HEADER_CODE_KEY) ?? '');
  const [footerCode, setFooterCode] = useState(localStorage.getItem(FOOTER_CODE_KEY) ?? '');
  const [robotsTxt, setRobotsTxt] = useState(localStorage.getItem(ROBOTS_KEY) ?? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /supervisor\nSitemap: https://paynex.com/sitemap.xml`);

  function savePages(updated: PageSEO[]) {
    setPages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function updatePage(field: keyof PageSEO, value: string | boolean) {
    const updated = pages.map(p => p.path === selected.path ? { ...p, [field]: value } : p);
    const updatedSelected = { ...selected, [field]: value };
    setSelected(updatedSelected);
    savePages(updated);
  }

  function saveCodeInjection() {
    localStorage.setItem(HEADER_CODE_KEY, headerCode);
    localStorage.setItem(FOOTER_CODE_KEY, footerCode);
    toast.success(t('تم حفظ الأكواد المخصصة', 'Custom codes saved'));
  }

  function saveRobots() {
    localStorage.setItem(ROBOTS_KEY, robotsTxt);
    toast.success(t('تم حفظ ملف robots.txt', 'robots.txt saved'));
  }

  function getSEOScore(page: PageSEO): number {
    if (page.noIndex) return 100;
    const passed = SEO_CHECKS.filter(c => c.check(page)).length;
    return Math.round((passed / SEO_CHECKS.length) * 100);
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  }

  const tabs = [
    { id: 'pages',     icon: FileText,  labelAr: 'وسوم الصفحات' },
    { id: 'code',      icon: Code,      labelAr: 'الأكواد المخصصة' },
    { id: 'robots',    icon: Shield,    labelAr: 'Robots & Sitemap' },
    { id: 'analytics', icon: BarChart3, labelAr: 'Google Analytics' },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a1628] to-[#0e2044] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#00d4ff]/20 rounded-xl flex items-center justify-center">
            <Search size={20} className="text-[#00d4ff]" />
          </div>
          <div>
            <h2 className="font-black text-lg">{t('وحدة التحكم في SEO', 'SEO Control Panel')}</h2>
            <p className="text-white/50 text-xs">{t('إدارة وسوم الميتا، الأكواد، وتحسين محركات البحث', 'Manage meta tags, custom code, and search optimization')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-[#0a1628] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#0a1628]'
              }`}
            >
              <Icon size={15} />
              {t(tab.labelAr, tab.id)}
            </button>
          );
        })}
      </div>

      {/* ── TAB: PAGE META TAGS ── */}
      {activeTab === 'pages' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Pages list */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-[#0a1628] text-sm">{t('الصفحات', 'Pages')} ({pages.length})</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {pages.map(page => {
                const score = getSEOScore(page);
                return (
                  <button
                    key={page.path}
                    onClick={() => setSelected(page)}
                    className={`w-full text-start px-4 py-3 hover:bg-slate-50 transition-colors ${selected.path === page.path ? 'bg-[#0a1628]/5 border-r-2 border-[#00d4ff]' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-[#0a1628]">{page.labelAr}</div>
                        <div className="text-xs text-slate-400 font-mono">{page.path}</div>
                      </div>
                      <div className={`text-sm font-black ${getScoreColor(score)}`}>{score}%</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meta editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* SEO Score */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#0a1628]">{t('تقييم SEO', 'SEO Score')} — {selected.labelAr}</h3>
                <div className={`text-2xl font-black ${getScoreColor(getSEOScore(selected))}`}>{getSEOScore(selected)}%</div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all ${getSEOScore(selected) >= 80 ? 'bg-emerald-500' : getSEOScore(selected) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${getSEOScore(selected)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SEO_CHECKS.map(check => {
                  const pass = check.check(selected);
                  return (
                    <div key={check.id} className="flex items-center gap-2 text-xs">
                      {pass ? <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" /> : <XCircle size={13} className="text-red-400 flex-shrink-0" />}
                      <span className={pass ? 'text-slate-600' : 'text-red-400'}>{check.labelAr}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fields */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-[#0a1628]">{t('تعديل الوسوم', 'Edit Meta Tags')}</h3>
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={selected.noIndex} onChange={e => updatePage('noIndex', e.target.checked)} className="accent-[#0a1628]" />
                  {t('إخفاء عن محركات البحث (noindex)', 'Hide from search engines (noindex)')}
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                  {t('عنوان الصفحة (Title Tag)', 'Page Title')}
                  <span className={`ms-2 ${selected.titleAr.length > 60 ? 'text-red-500' : selected.titleAr.length >= 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    ({selected.titleAr.length}/60)
                  </span>
                </label>
                <input value={selected.titleAr} onChange={e => updatePage('titleAr', e.target.value)}
                  className="input-field text-sm" placeholder="عنوان الصفحة بالعربية (30-60 حرف)" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                  {t('الوصف التعريفي (Meta Description)', 'Meta Description')}
                  <span className={`ms-2 ${selected.descAr.length > 160 ? 'text-red-500' : selected.descAr.length >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    ({selected.descAr.length}/160)
                  </span>
                </label>
                <textarea value={selected.descAr} onChange={e => updatePage('descAr', e.target.value)}
                  className="input-field resize-none text-sm" rows={3}
                  placeholder="وصف الصفحة (100-160 حرف) — يظهر في نتائج البحث" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('الكلمات المفتاحية', 'Keywords')}</label>
                <input value={selected.keywords} onChange={e => updatePage('keywords', e.target.value)}
                  className="input-field text-sm" placeholder="تقسيط, باينكس, شراء بالتقسيط, ..." />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('رابط صورة الشبكات الاجتماعية (OG Image URL)', 'OG Image URL')}</label>
                <input value={selected.ogImage} onChange={e => updatePage('ogImage', e.target.value)}
                  className="input-field text-sm" dir="ltr" placeholder="https://..." />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                <strong>💡 {t('تلميح SEO:', 'SEO Tip:')}</strong>
                {' '}{t('احرص على تضمين كلمات مثل "تقسيط، تمويل، قسط، بنك" في المحتوى لجذب إعلانات Google AdSense ذات سعر نقرة مرتفع في مجال التمويل.', 'Include keywords like "installment, finance, credit" in content to attract high-CPC Google AdSense ads in the finance sector.')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CODE INJECTION ── */}
      {activeTab === 'code' && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>{t('تنبيه مهم:', 'Important Warning:')}</strong>
              {' '}{t('الأكواد المُدرجة تعمل فوراً على الموقع. تأكد من صحة الكود قبل الحفظ لتجنب تعطيل الموقع.', 'Injected code runs immediately on the site. Verify code correctness before saving to avoid breaking the site.')}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold text-[#0a1628] mb-1 flex items-center gap-2">
                <Code size={16} className="text-[#00d4ff]" />
                {t('كود رأس الصفحة (Header)', 'Header Code')}
              </h3>
              <p className="text-xs text-slate-400 mb-3">{t('Google Tag Manager، Google Analytics، أكواد التتبع', 'Google Tag Manager, Analytics, tracking scripts')}</p>
              <textarea
                value={headerCode}
                onChange={e => setHeaderCode(e.target.value)}
                className="w-full h-52 px-4 py-3 rounded-xl border border-slate-200 bg-[#060e1d] text-[#00d4ff] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#00d4ff] resize-none"
                dir="ltr"
                placeholder={`<!-- Google Tag Manager -->\n<script>...</script>\n\n<!-- Google Analytics 4 -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>`}
              />
              <p className="text-xs text-slate-400 mt-2">{t('يُضاف في', 'Injected in')} &lt;head&gt;</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold text-[#0a1628] mb-1 flex items-center gap-2">
                <Code size={16} className="text-[#c9a84c]" />
                {t('كود نهاية الصفحة (Footer)', 'Footer Code')}
              </h3>
              <p className="text-xs text-slate-400 mb-3">{t('Google AdSense، Facebook Pixel، MoneyTag، كود التحويل', 'Google AdSense, Facebook Pixel, MoneyTag, conversion tracking')}</p>
              <textarea
                value={footerCode}
                onChange={e => setFooterCode(e.target.value)}
                className="w-full h-52 px-4 py-3 rounded-xl border border-slate-200 bg-[#060e1d] text-[#c9a84c] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84c] resize-none"
                dir="ltr"
                placeholder={`<!-- Google AdSense -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>\n\n<!-- Facebook Pixel -->\n<script>!function(f,b,e,v,n,t,s)...</script>`}
              />
              <p className="text-xs text-slate-400 mt-2">{t('يُضاف قبل', 'Injected before')} &lt;/body&gt;</p>
            </div>
          </div>

          <button onClick={saveCodeInjection} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {t('حفظ الأكواد المخصصة', 'Save Custom Code')}
          </button>

          {/* Pre-built snippets */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-[#0a1628] mb-4">{t('أكواد جاهزة — انسخ والصق', 'Ready Snippets — Copy & Paste')}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                {
                  name: 'Google Analytics 4',
                  location: t('هيدر', 'Header'),
                  code: `<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'GA_MEASUREMENT_ID');\n</script>`,
                },
                {
                  name: 'Google Tag Manager',
                  location: t('هيدر', 'Header'),
                  code: `<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>`,
                },
                {
                  name: 'Google AdSense Auto Ads',
                  location: t('فوتر', 'Footer'),
                  code: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>`,
                },
                {
                  name: 'Facebook Pixel',
                  location: t('هيدر', 'Header'),
                  code: `<!-- Meta Pixel Code -->\n<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\n/* ... */\n}\nfbq('init', 'YOUR_PIXEL_ID');\nfbq('track', 'PageView');\n</script>`,
                },
              ].map((snippet, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-[#0a1628]">{snippet.name}</span>
                    <span className="text-xs bg-[#00d4ff]/10 text-[#006e85] px-2 py-0.5 rounded-full">{snippet.location}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(snippet.code);
                      toast.success(t('تم نسخ الكود', 'Code copied'));
                    }}
                    className="text-xs text-[#0a1628] border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {t('نسخ الكود', 'Copy Code')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ROBOTS & SITEMAP ── */}
      {activeTab === 'robots' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-[#0a1628] mb-1 flex items-center gap-2">
              <Shield size={16} className="text-[#00d4ff]" />
              {t('ملف robots.txt', 'robots.txt File')}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{t('يتحكم في ما تستطيع محركات البحث الوصول إليه — robots.txt الافتراضي يحجب صفحات الإدارة', 'Controls what search engines can access — default blocks admin pages')}</p>
            <textarea
              value={robotsTxt}
              onChange={e => setRobotsTxt(e.target.value)}
              className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 bg-[#060e1d] text-green-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff] resize-none"
              dir="ltr"
            />
            <button onClick={saveRobots} className="btn-primary mt-3 flex items-center gap-2 text-sm">
              <Save size={15} />
              {t('حفظ robots.txt', 'Save robots.txt')}
            </button>
          </div>

          {/* Sitemap info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-[#0a1628] mb-4 flex items-center gap-2">
              <Globe size={16} className="text-[#00d4ff]" />
              {t('خريطة الموقع (Sitemap)', 'Sitemap')}
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 font-mono mb-4 dir-ltr" dir="ltr">
              https://paynex.com/sitemap.xml
            </div>
            <div className="space-y-2 text-sm text-slate-500">
              {['/', '/products', '/contact'].map(path => (
                <div key={path} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span dir="ltr" className="font-mono text-xs">{path}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-500">✓ {t('مفهرس', 'Indexed')}</span>
                  </div>
                </div>
              ))}
              {['/admin', '/supervisor', '/login'].map(path => (
                <div key={path} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span dir="ltr" className="font-mono text-xs text-slate-400">{path}</span>
                  <span className="text-xs text-slate-400">✗ {t('محجوب (noindex)', 'Blocked (noindex)')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ANALYTICS GUIDE ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: 'Google Analytics 4',
                icon: BarChart3,
                color: 'text-blue-500',
                bg: 'bg-blue-50',
                steps: [
                  t('اذهب إلى analytics.google.com وأنشئ property جديد', 'Go to analytics.google.com and create a new property'),
                  t('احصل على Measurement ID (يبدأ بـ G-XXXXXXXX)', 'Get Measurement ID (starts with G-XXXXXXXX)'),
                  t('ضع كود gtag.js في خانة "كود الهيدر" أعلاه', "Paste gtag.js code in 'Header Code' above"),
                  t('فعّل تتبع التحويلات من إعدادات الأحداث', 'Enable conversion tracking from Events settings'),
                ],
              },
              {
                title: 'Google AdSense',
                icon: Zap,
                color: 'text-amber-500',
                bg: 'bg-amber-50',
                steps: [
                  t('قدّم طلب في adsense.google.com', 'Apply at adsense.google.com'),
                  t('أضف كود التحقق في "كود الهيدر"', "Add verification code in 'Header Code'"),
                  t('بعد الموافقة، أضف كود Auto Ads في "كود الفوتر"', "After approval, add Auto Ads code in 'Footer Code'"),
                  t('الكلمات المفتاحية (تقسيط، تمويل، بنك) تجذب إعلانات CPC عالية', 'Finance keywords attract high-CPC ads'),
                ],
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={20} className={item.color} />
                    </div>
                    <h3 className="font-bold text-[#0a1628]">{item.title}</h3>
                  </div>
                  <ol className="space-y-2">
                    {item.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-[#0a1628] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                          {j + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>

          {/* Core Web Vitals Tips */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-[#0a1628] mb-4">{t('نصائح Core Web Vitals للأداء', 'Core Web Vitals Performance Tips')}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { metric: 'LCP', name: t('أكبر محتوى مرئي', 'Largest Contentful Paint'), target: '< 2.5s', tip: t('ضغط الصور واستخدام CDN', 'Compress images and use CDN'), color: 'bg-emerald-50 border-emerald-200' },
                { metric: 'FID', name: t('تأخر الاستجابة', 'First Input Delay'), target: '< 100ms', tip: t('تحسين JavaScript وتقليل الكود غير الضروري', 'Optimize JS and remove unused code'), color: 'bg-blue-50 border-blue-200' },
                { metric: 'CLS', name: t('ثبات التخطيط', 'Cumulative Layout Shift'), target: '< 0.1', tip: t('تحديد أبعاد الصور والإعلانات مسبقاً', 'Pre-define image and ad dimensions'), color: 'bg-purple-50 border-purple-200' },
              ].map((v, i) => (
                <div key={i} className={`border rounded-xl p-4 ${v.color}`}>
                  <div className="text-xl font-black text-[#0a1628] mb-1">{v.metric}</div>
                  <div className="text-xs font-semibold text-slate-600 mb-1">{v.name}</div>
                  <div className="text-xs text-emerald-600 font-bold mb-2">{t('الهدف:', 'Target:')} {v.target}</div>
                  <div className="text-xs text-slate-500">{v.tip}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
