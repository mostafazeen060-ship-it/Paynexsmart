/**
 * BTech.com Product Scraper — Paynix Inventory Sync v3.0
 * =====================================================
 * Engine: axios + cheerio (no browser binary — Replit compatible)
 * Proxy:  Full residential proxy support via --proxy flag or env vars
 *
 * CLOUDFLARE NOTICE:
 *   btech.com uses Cloudflare Bot Management. Direct requests from
 *   datacenter IPs (Replit, AWS, etc.) are blocked at the IP level.
 *   Use a residential proxy to bypass this from any environment.
 *
 * LEGAL NOTICE: Use only with BTech's permission or for research purposes.
 *
 * ── Usage ────────────────────────────────────────────────────────────
 *
 *   npm install
 *
 *   # No proxy (works from residential IP / local machine)
 *   node btech-scraper.js --test
 *   node btech-scraper.js
 *
 *   # With residential proxy (works from Replit / any server)
 *   node btech-scraper.js --proxy http://user:pass@host:port --test
 *   node btech-scraper.js --proxy http://user:pass@host:port
 *
 *   # Via environment variable (recommended for CI/Replit secrets)
 *   export BTECH_PROXY=http://user:pass@host:port
 *   node btech-scraper.js --test
 *
 *   # Other flags
 *   node btech-scraper.js --category mobiles       # Single category
 *   node btech-scraper.js --validate               # Validate output JSON
 *   node btech-scraper.js --concurrency 3          # Parallel requests
 *
 * ── Recommended Residential Proxy Providers ──────────────────────────
 *   • Bright Data  → https://brightdata.com  (best CF bypass rate)
 *   • Oxylabs      → https://oxylabs.io
 *   • SmartProxy   → https://smartproxy.com
 *   • IPRoyal      → https://iproyal.com     (budget-friendly)
 *
 *   Proxy URL format:  http://USERNAME:PASSWORD@HOST:PORT
 *   Example:           http://lum-customer-123:abc@zproxy.lum-superproxy.io:22225
 *
 * ── Output ───────────────────────────────────────────────────────────
 *   btech-products.json  (Paynix Product schema)
 *   → Import via: Admin Panel → Products → Import JSON
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Parse CLI Arguments ───────────────────────────────────────────────────────
function getArg(flag, defaultVal = null) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : defaultVal;
}
function hasFlag(flag) { return process.argv.includes(flag); }

// Proxy: --proxy arg → BTECH_PROXY env → HTTP_PROXY env → null
const PROXY_URL = getArg('--proxy') || process.env.BTECH_PROXY || process.env.HTTP_PROXY || process.env.HTTPS_PROXY || null;

// ── Configuration ─────────────────────────────────────────────────────────────
const CONFIG = {
  baseUrl:        'https://btech.com/ar',
  outputFile:     join(__dirname, 'btech-products.json'),
  progressFile:   join(__dirname, 'btech-progress.json'),
  minDelay:       PROXY_URL ? 1000 : 2000,  // Faster with proxy (residential IP = less suspicious)
  maxDelay:       PROXY_URL ? 2500 : 4500,
  maxRetries:     4,
  requestTimeout: 30000,
  concurrency:    parseInt(getArg('--concurrency', '1'), 10),
  testMode:       hasFlag('--test'),
  validateMode:   hasFlag('--validate'),
  singleCategory: getArg('--category'),
  proxy:          PROXY_URL,
};

// ── Known BTech Categories (Fallback) ─────────────────────────────────────────
const KNOWN_CATEGORIES = [
  { slug: 'mobiles',          nameAr: 'موبايلات وتابلت',      nameEn: 'Mobiles' },
  { slug: 'laptops',          nameAr: 'لابتوبات',             nameEn: 'Laptops' },
  { slug: 'tablets',          nameAr: 'تابلت',                nameEn: 'Tablets' },
  { slug: 'tvs-monitors',     nameAr: 'شاشات وتليفزيونات',    nameEn: 'TVs & Monitors' },
  { slug: 'air-conditioners', nameAr: 'تكييفات',              nameEn: 'Air Conditioners' },
  { slug: 'refrigerators',    nameAr: 'ثلاجات',               nameEn: 'Refrigerators' },
  { slug: 'washing-machines', nameAr: 'غسالات',               nameEn: 'Washing Machines' },
  { slug: 'cameras',          nameAr: 'كاميرات',              nameEn: 'Cameras' },
  { slug: 'audio',            nameAr: 'صوتيات',               nameEn: 'Audio' },
  { slug: 'gaming',           nameAr: 'جيمنج',               nameEn: 'Gaming' },
  { slug: 'accessories',      nameAr: 'إكسسوارات',            nameEn: 'Accessories' },
  { slug: 'home-appliances',  nameAr: 'أجهزة منزلية',         nameEn: 'Home Appliances' },
  { slug: 'printers',         nameAr: 'طابعات',               nameEn: 'Printers' },
  { slug: 'networking',       nameAr: 'نتوركينج',             nameEn: 'Networking' },
];

// ── Rotating User-Agent Pool ──────────────────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
];
let _uaIdx = 0;
function nextUA() { return USER_AGENTS[_uaIdx++ % USER_AGENTS.length]; }

// ── Proxy Agent Factory ───────────────────────────────────────────────────────
function makeProxyAgent() {
  if (!CONFIG.proxy) return null;
  try {
    const agent = new HttpsProxyAgent(CONFIG.proxy);
    const masked = CONFIG.proxy.replace(/:([^@:]+)@/, ':***@'); // hide password in logs
    log('info', `Proxy configured: ${masked}`);
    return agent;
  } catch (err) {
    log('error', `Invalid proxy URL: ${CONFIG.proxy} — ${err.message}`);
    process.exit(1);
  }
}

// ── HTTP Client Factory ───────────────────────────────────────────────────────
function makeClient(proxyAgent) {
  const baseHeaders = {
    'Accept':                  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language':         'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding':         'gzip, deflate, br',
    'Connection':              'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest':          'document',
    'Sec-Fetch-Mode':          'navigate',
    'Sec-Fetch-Site':          'none',
    'Sec-Fetch-User':          '?1',
    'Cache-Control':           'max-age=0',
    'DNT':                     '1',
  };

  return axios.create({
    timeout: CONFIG.requestTimeout,
    maxRedirects: 10,
    headers: baseHeaders,
    ...(proxyAgent ? { httpsAgent: proxyAgent, httpAgent: proxyAgent, proxy: false } : {}),
    // proxy: false tells axios NOT to use built-in proxy so our agent takes over
  });
}

// ── Logger ────────────────────────────────────────────────────────────────────
const ICONS = { info: 'ℹ️ ', success: '✅', warn: '⚠️ ', error: '❌', progress: '📊', block: '🚫', proxy: '🔀' };
function log(level, msg, extra = '') {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${ICONS[level] ?? '• '} ${msg}${extra ? '  ' + extra : ''}`);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
const delay = (min, max = min) => new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
const randomDelay = () => delay(CONFIG.minDelay, CONFIG.maxDelay);

function loadProgress() {
  if (!existsSync(CONFIG.progressFile)) return { scrapedUrls: [], products: [] };
  try { return JSON.parse(readFileSync(CONFIG.progressFile, 'utf-8')); } catch { return { scrapedUrls: [], products: [] }; }
}
function saveProgress(p) { writeFileSync(CONFIG.progressFile, JSON.stringify(p, null, 2)); }
function saveOutput(products) {
  writeFileSync(CONFIG.outputFile, JSON.stringify(products, null, 2));
  log('success', `Saved ${products.length} products → ${CONFIG.outputFile}`);
}

// ── Cloudflare Detection ──────────────────────────────────────────────────────
function isCloudflareBlock(html, status) {
  if (status === 403 || status === 503) return true;
  if (!html || typeof html !== 'string') return false;
  return (
    html.includes('__CF$cv$params') ||
    html.includes('challenge-platform') ||
    html.includes('cf_clearance') ||
    html.includes('cf-browser-verification') ||
    (html.toLowerCase().includes('cloudflare') && html.length < 8000)
  );
}

function printBlockGuidance() {
  const hasProxy = !!CONFIG.proxy;
  console.log('\n' + '═'.repeat(72));
  console.log('🚫  CLOUDFLARE BLOCK DETECTED');
  console.log('═'.repeat(72));
  if (hasProxy) {
    console.log('Your proxy IP was flagged by Cloudflare. Try:');
    console.log('  1. Rotate to a different proxy endpoint/session');
    console.log('  2. Use a premium residential proxy (Bright Data, Oxylabs)');
    console.log('  3. Add --concurrency 1 to slow down requests');
  } else {
    console.log('Datacenter IPs (Replit, AWS, etc.) are auto-challenged by Cloudflare.');
    console.log('');
    console.log('✅  FIX — Add a residential proxy:');
    console.log('');
    console.log('   # Set in Replit Secrets (recommended):');
    console.log('   BTECH_PROXY = http://user:pass@proxy-host:port');
    console.log('');
    console.log('   # Or pass on command line:');
    console.log('   node btech-scraper.js --proxy http://user:pass@host:port --test');
    console.log('');
    console.log('   # Or run locally (residential IP = no proxy needed):');
    console.log('   git clone https://github.com/mostafazeen060-ship-it/paynix');
    console.log('   cd paynix/scraper && npm install');
    console.log('   node btech-scraper.js --test');
  }
  console.log('═'.repeat(72) + '\n');
}

// ── Fetch with Retry + Proxy ──────────────────────────────────────────────────
async function fetchHTML(url, client, label = '') {
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const res = await client.get(url, {
        headers: { 'User-Agent': nextUA(), 'Referer': CONFIG.baseUrl + '/' },
      });

      const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

      if (isCloudflareBlock(html, res.status)) {
        log('block', `CF challenge${label ? ' [' + label + ']' : ''} attempt ${attempt}: ${url.slice(0, 70)}`);
        if (attempt === 1) printBlockGuidance();
        await delay(3000 * attempt, 6000 * attempt);
        if (attempt === CONFIG.maxRetries) return { html: null, blocked: true };
        continue;
      }

      log('success', `Fetched${label ? ' [' + label + ']' : ''}: ${url.slice(0, 75)}`);
      return { html, blocked: false };

    } catch (err) {
      const status = err.response?.status ?? 0;
      const errHtml = typeof err.response?.data === 'string' ? err.response.data : '';

      if (isCloudflareBlock(errHtml, status)) {
        log('block', `CF block (${status})${label ? ' [' + label + ']' : ''} attempt ${attempt}`);
        if (attempt === 1) printBlockGuidance();
        if (attempt === CONFIG.maxRetries) return { html: null, blocked: true };
        await delay(4000 * attempt, 8000 * attempt);
        continue;
      }

      log('warn', `Attempt ${attempt}/${CONFIG.maxRetries} — ${err.code ?? err.message} — ${url.slice(0, 60)}`);
      if (attempt < CONFIG.maxRetries) await delay(2000 * attempt, 4000 * attempt);
    }
  }
  return { html: null, blocked: false };
}

// ── Category Discovery ────────────────────────────────────────────────────────
async function discoverCategories(client) {
  log('info', 'Discovering categories from homepage...');
  const { html, blocked } = await fetchHTML(CONFIG.baseUrl, client, 'homepage');

  if (blocked) return null;

  if (html) {
    const $ = cheerio.load(html);
    const found = new Map();

    $('nav a[href], header a[href], .menu a[href], .nav-link[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (!href || !text || text.length < 2 || href.startsWith('#') || href.includes('javascript')) return;

      const url = href.startsWith('http') ? href : `https://btech.com${href}`;
      if (!url.includes('/ar/')) return;

      const afterAr = url.split('/ar/')[1] ?? '';
      const slug = afterAr.replace(/\/$/, '').split('/')[0];
      if (slug && !slug.includes('?') && !slug.includes('product') && !slug.includes('search') && slug.length > 2) {
        found.set(slug, {
          slug,
          url: `${CONFIG.baseUrl}/${slug}/`,
          nameAr: text,
          nameEn: text,
        });
      }
    });

    if (found.size > 3) {
      const cats = Array.from(found.values());
      log('success', `Discovered ${cats.length} categories from nav`);
      return cats;
    }
  }

  log('warn', 'Nav scraping returned insufficient results — using known category list');
  return KNOWN_CATEGORIES.map(c => ({
    slug: c.slug,
    url: `${CONFIG.baseUrl}/${c.slug}/`,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
  }));
}

// ── Product URL Collection (pagination-aware) ─────────────────────────────────
async function collectProductUrls(client, category) {
  const urls = new Set();
  let page = 1;
  let emptyPages = 0;

  log('info', `  Collecting: ${category.nameEn} → ${category.url}`);

  while (emptyPages < 2) {
    const pageUrl = page === 1 ? category.url : `${category.url}page/${page}/`;
    const { html, blocked } = await fetchHTML(pageUrl, client, `${category.nameEn} p${page}`);

    if (blocked) return { urls: [], blocked: true };
    if (!html)   { emptyPages++; page++; continue; }

    const $ = cheerio.load(html);
    const before = urls.size;

    // Multiple selector strategies for WooCommerce / custom themes
    const selectors = [
      'a.woocommerce-loop-product__link[href]',
      '.products li.product a:not(.add_to_cart_button)[href]',
      'a[href*="/product/"][href]',
      'a[href*="/p/"][href]',
      '.product-item a[href]',
      '.product-card a[href]',
    ];

    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const href = $(el).attr('href') || '';
        if (!href) return;
        const absUrl = href.startsWith('http') ? href : `https://btech.com${href}`;
        if ((absUrl.includes('/product/') || absUrl.includes('/p/') || absUrl.includes('/ar/') && absUrl.split('/ar/')[1]?.includes('-')) && !absUrl.includes('?') ) {
          urls.add(absUrl.split('?')[0]); // strip query strings
        }
      });
    }

    // JSON-LD embedded product data (fast path — no extra requests)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        const items = data['@graph'] ?? (Array.isArray(data) ? data : [data]);
        for (const item of items) {
          if (item['@type'] === 'Product' && item.url) urls.add(item.url);
        }
      } catch {}
    });

    const added = urls.size - before;
    const hasNextPage = $('a.next, .next a, [rel="next"], .pagination .next, a[aria-label="Next"]').length > 0;

    log('progress', `    Page ${page}: +${added} URLs found (total: ${urls.size}) | next: ${hasNextPage}`);

    if (!hasNextPage && added === 0) emptyPages++;
    else if (added > 0) emptyPages = 0;

    page++;
    await delay(1200, 2500);
    if (CONFIG.testMode && urls.size >= 5) break;
  }

  log('success', `  → ${urls.size} product URLs in "${category.nameEn}"`);
  return { urls: Array.from(urls), blocked: false };
}

// ── Product Detail Scraper ────────────────────────────────────────────────────
async function scrapeProduct(client, url, category) {
  const { html, blocked } = await fetchHTML(url, client, 'detail');
  if (blocked) return { product: null, blocked: true };
  if (!html)   return { product: null, blocked: false };

  const $ = cheerio.load(html);

  // ── 1. Try JSON-LD (fastest, most accurate) ──
  let jsonLd = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (jsonLd) return;
    try {
      const data = JSON.parse($(el).html() || '');
      const items = data['@graph'] ?? (Array.isArray(data) ? data : [data]);
      for (const item of items) {
        if (item['@type'] === 'Product') { jsonLd = item; break; }
      }
    } catch {}
  });

  // ── 2. HTML selectors as fallback ──
  const name = (
    jsonLd?.name ||
    $('h1.product_title, h1.product-title, h1[class*="title"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    ''
  ).trim();

  if (!name) {
    log('warn', `  Skipped (no name): ${url.slice(0, 70)}`);
    return { product: null, blocked: false };
  }

  // Price — try JSON-LD offer first, then DOM
  const offerPrice = jsonLd?.offers?.price ?? (Array.isArray(jsonLd?.offers) ? jsonLd.offers[0]?.price : null);
  const priceRaw = String(offerPrice ?? '')
    || $('p.price ins .woocommerce-Price-amount, .product-price [class*="price"], [class*="current-price"]')
        .first().text().replace(/[^\d.]/g, '')
    || $('p.price .woocommerce-Price-amount').first().text().replace(/[^\d.]/g, '')
    || '0';

  const price = parseFloat(priceRaw.toString().replace(/[^\d.]/g, '')) || 0;
  if (price <= 0) {
    log('warn', `  Skipped (price=0): ${name.slice(0, 50)}`);
    return { product: null, blocked: false };
  }

  // Original price (before discount)
  const origRaw = $('p.price del .woocommerce-Price-amount, [class*="old-price"], [class*="regular-price"], s .amount')
    .first().text().replace(/[^\d.]/g, '');
  const originalPrice = parseFloat(origRaw) > price ? parseFloat(origRaw) : undefined;
  const discountPercent = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // SKU
  const sku = (
    jsonLd?.sku ||
    $('[class*="sku"] span, .sku span, [itemprop="sku"]').text().replace(/SKU[:\s]*/i, '').trim() ||
    url.split('/').filter(Boolean).pop()?.replace(/[?#].*/, '') || ''
  );

  // Brand
  const brand = (
    jsonLd?.brand?.name ||
    $('[class*="brand"] a, [class*="brand"] span, [itemprop="brand"], .manufacturer a').first().text().trim() ||
    ''
  );

  // Images (deduplicated, HTTP-only)
  const imageSet = new Set();
  if (jsonLd?.image) {
    (Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image]).forEach(img => {
      const src = typeof img === 'string' ? img : img?.url || img?.contentUrl;
      if (src && src.startsWith('http')) imageSet.add(src);
    });
  }
  $('img.wp-post-image, .woocommerce-product-gallery__image img, .product-image img, [class*="gallery"] img')
    .each((_, el) => {
      const src = $(el).attr('data-large_image') || $(el).attr('data-src') || $(el).attr('src') || '';
      if (src && src.startsWith('http') && !src.includes('placeholder')) imageSet.add(src);
    });

  // Availability
  const availEl = $('[class*="availability"], [class*="stock"], .in-stock, .out-of-stock').first().text().toLowerCase();
  const cfAvail = jsonLd?.offers?.availability ?? (Array.isArray(jsonLd?.offers) ? jsonLd.offers[0]?.availability : '');
  const outOfStock = availEl.includes('out') || availEl.includes('غير') ||
    cfAvail === 'https://schema.org/OutOfStock';
  const availability = outOfStock ? 'out-of-stock' : 'in-stock';

  // Description
  const description = (
    jsonLd?.description ||
    $('#tab-description, .woocommerce-product-details__short-description, [class*="description"]')
      .first().text().replace(/\s+/g, ' ').trim().slice(0, 2000) || ''
  );

  // Specs from table rows
  const specs = {};
  $('table.woocommerce-product-attributes tr, .specifications tr, [class*="specs"] tr, .product-attributes tr')
    .each((_, row) => {
      const cells = $(row).find('th, td');
      if (cells.length >= 2) {
        const key = $(cells[0]).text().trim();
        const val = $(cells[1]).text().trim();
        if (key && val) specs[key] = val;
      }
    });

  const sourceId = sku || url.split('/').filter(Boolean).pop()?.replace(/[?#].*/, '') || '';

  return {
    blocked: false,
    product: {
      id:             `btech-${sourceId || Math.random().toString(36).slice(2, 10)}`,
      name,
      nameAr:         name,
      nameEn:         name,
      description,
      descriptionAr:  description,
      descriptionEn:  description,
      price,
      originalPrice:  originalPrice ?? undefined,
      discountPercent,
      images:         Array.from(imageSet),
      category:       category.nameEn || '',
      categoryAr:     category.nameAr || category.nameEn || '',
      brand,
      sku,
      source:         'btech',
      sourceId,
      sourceUrl:      url,
      isActive:       !outOfStock,
      availability,
      stock:          outOfStock ? 0 : 99,
      specs,
      lastSyncedAt:   new Date().toISOString(),
      createdAt:      new Date().toISOString(),
    },
  };
}

// ── Schema Validator ──────────────────────────────────────────────────────────
function validateProducts(products) {
  const REQUIRED = ['id', 'name', 'nameAr', 'price', 'source', 'sourceUrl', 'isActive', 'images'];
  const errors = [];
  const warnings = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    for (const f of REQUIRED) {
      if (p[f] === undefined || p[f] === null || p[f] === '') {
        errors.push(`[${i}] Missing "${f}" — id: ${p.id ?? 'unknown'}`);
      }
    }
    if (typeof p.price !== 'number' || p.price <= 0) errors.push(`[${i}] Bad price: ${p.price} (${p.id})`);
    if (!Array.isArray(p.images)) errors.push(`[${i}] images must be array (${p.id})`);
    if (!['btech', 'aman', 'manual'].includes(p.source)) errors.push(`[${i}] Bad source: "${p.source}" (${p.id})`);
    if (!p.nameAr || p.nameAr.length < 2) warnings.push(`[${i}] Short nameAr: "${p.nameAr}" (${p.id})`);
    if (!p.images?.length) warnings.push(`[${i}] No images: ${p.id}`);
  }

  // Duplicate IDs
  const seen = new Set();
  const dupes = [];
  for (const p of products) {
    if (seen.has(p.id)) dupes.push(p.id);
    seen.add(p.id);
  }
  if (dupes.length) errors.push(`Duplicate IDs: ${[...new Set(dupes)].join(', ')}`);

  return { errors, warnings };
}

function printValidationReport(products) {
  const { errors, warnings } = validateProducts(products);

  // Category breakdown
  const cats = {};
  for (const p of products) cats[p.category] = (cats[p.category] || 0) + 1;

  const avgPrice = products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0;
  const withImages  = products.filter(p => p.images?.length > 0).length;
  const withSpecs   = products.filter(p => Object.keys(p.specs || {}).length > 0).length;
  const inStock     = products.filter(p => p.isActive).length;
  const withBrand   = products.filter(p => p.brand).length;
  const withDisc    = products.filter(p => p.discountPercent > 0).length;

  console.log('\n' + '═'.repeat(68));
  console.log('📋  SCHEMA VALIDATION REPORT');
  console.log('═'.repeat(68));
  console.log(`   Total products:   ${products.length}`);
  console.log(`   Schema errors:    ${errors.length === 0 ? '✅ 0' : '❌ ' + errors.length}`);
  console.log(`   Warnings:         ${warnings.length === 0 ? '✅ 0' : '⚠️  ' + warnings.length}`);
  console.log('');
  console.log('📈  Quality Metrics:');
  console.log(`   Avg price:        ${avgPrice.toFixed(0)} EGP`);
  console.log(`   With images:      ${withImages}/${products.length} (${Math.round(withImages/Math.max(products.length,1)*100)}%)`);
  console.log(`   With specs:       ${withSpecs}/${products.length} (${Math.round(withSpecs/Math.max(products.length,1)*100)}%)`);
  console.log(`   With brand:       ${withBrand}/${products.length} (${Math.round(withBrand/Math.max(products.length,1)*100)}%)`);
  console.log(`   With discount:    ${withDisc}/${products.length}`);
  console.log(`   In stock:         ${inStock}/${products.length} (${Math.round(inStock/Math.max(products.length,1)*100)}%)`);
  console.log('');
  console.log('📦  By Category:');
  Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => {
    console.log(`   ${n.toString().padStart(5)}  ${cat}`);
  });

  if (errors.length) {
    console.log('\n❌  Errors:');
    errors.slice(0, 10).forEach(e => console.log('   ' + e));
  }
  if (warnings.length) {
    console.log('\n⚠️   Warnings (sample):');
    warnings.slice(0, 5).forEach(w => console.log('   ' + w));
  }
  console.log('═'.repeat(68) + '\n');
  return { errors, warnings };
}

// ── Validate-Only Mode ────────────────────────────────────────────────────────
function runValidation() {
  if (!existsSync(CONFIG.outputFile)) {
    log('error', `File not found: ${CONFIG.outputFile}`);
    process.exit(1);
  }
  let products;
  try { products = JSON.parse(readFileSync(CONFIG.outputFile, 'utf-8')); }
  catch (e) { log('error', `Invalid JSON: ${e.message}`); process.exit(1); }

  log('info', `Validating ${products.length} products...`);
  const { errors } = printValidationReport(products);
  process.exit(errors.length > 0 ? 1 : 0);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (CONFIG.validateMode) return runValidation();

  const mode = CONFIG.testMode ? 'TEST (5 products)'
    : CONFIG.singleCategory    ? `SINGLE CATEGORY: ${CONFIG.singleCategory}`
    : 'FULL SYNC';

  console.log('\n' + '═'.repeat(68));
  console.log('🚀  PAYNIX — BTech Scraper v3.0');
  console.log('═'.repeat(68));
  console.log(`   Mode:     ${mode}`);
  console.log(`   Engine:   axios + cheerio (no browser required)`);
  console.log(`   Proxy:    ${CONFIG.proxy ? '✅ Configured' : '⚠️  None (datacenter IP will be blocked by CF)'}`);
  console.log(`   Delay:    ${CONFIG.minDelay}–${CONFIG.maxDelay}ms`);
  console.log('═'.repeat(68) + '\n');

  const proxyAgent = makeProxyAgent();
  const client = makeClient(proxyAgent);
  const progress = loadProgress();
  const scrapedUrls = new Set(progress.scrapedUrls);
  const products = [...(progress.products || [])];

  // ── Step 1: Category Discovery ──
  log('info', 'Step 1/3 — Category discovery');
  let categories = await discoverCategories(client);
  if (categories === null) {
    log('error', 'Blocked on first request — cannot continue without proxy');
    process.exit(1);
  }

  // Filter by --category
  if (CONFIG.singleCategory) {
    categories = categories.filter(c =>
      c.slug === CONFIG.singleCategory ||
      c.nameEn.toLowerCase().includes(CONFIG.singleCategory.toLowerCase()) ||
      c.nameAr.includes(CONFIG.singleCategory)
    );
    if (!categories.length) {
      log('error', `Category "${CONFIG.singleCategory}" not found.`);
      log('info', `Available: ${KNOWN_CATEGORIES.map(c => c.slug).join(', ')}`);
      process.exit(1);
    }
  }
  if (CONFIG.testMode) categories = categories.slice(0, 1);
  log('progress', `Categories: ${categories.length} → [${categories.map(c => c.nameEn).join(', ')}]`);

  // ── Step 2: URL Collection ──
  log('info', 'Step 2/3 — Collecting product URLs per category');
  const allUrls = new Map();
  let cfBlockCount = 0;

  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    log('progress', `[${ci + 1}/${categories.length}] ${cat.nameEn}`);
    const { urls, blocked } = await collectProductUrls(client, cat);
    if (blocked) {
      cfBlockCount++;
      if (cfBlockCount >= 2) { log('error', 'Multiple CF blocks — aborting'); process.exit(1); }
      continue;
    }
    for (const url of urls) {
      if (!scrapedUrls.has(url)) allUrls.set(url, cat);
    }
    await randomDelay();
    if (CONFIG.testMode && allUrls.size >= 5) break;
  }

  log('progress', `New URLs to scrape: ${allUrls.size} (${scrapedUrls.size} already done)`);

  // ── Step 3: Product Detail Scraping ──
  log('info', 'Step 3/3 — Scraping product detail pages');
  const urlList = Array.from(allUrls.entries());
  let scraped = 0, failed = 0, cfBlocks = 0;

  for (let i = 0; i < urlList.length; i++) {
    const [url, cat] = urlList[i];
    log('progress', `[${i + 1}/${urlList.length}] ${url.slice(0, 78)}`);

    const { product, blocked } = await scrapeProduct(client, url, cat);

    if (blocked) {
      cfBlocks++;
      failed++;
      if (cfBlocks >= 4) { log('error', 'Too many CF blocks — saving progress and stopping'); break; }
    } else if (product) {
      products.push(product);
      scrapedUrls.add(url);
      scraped++;
    } else {
      failed++;
    }

    if ((i + 1) % 10 === 0 || scraped + failed === urlList.length) {
      saveProgress({ scrapedUrls: Array.from(scrapedUrls), products });
      saveOutput(products);
    }

    await randomDelay();
    if (CONFIG.testMode && scraped >= 5) break;
  }

  // Final save + clear progress on full success
  saveOutput(products);
  if (!CONFIG.testMode && cfBlocks === 0) {
    saveProgress({ scrapedUrls: [], products: [] });
    log('info', 'Progress file reset (full clean run)');
  }

  // ── Final Report ──
  console.log('\n' + '═'.repeat(68));
  console.log('🏁  SYNC COMPLETE');
  console.log('═'.repeat(68));
  console.log(`   ✅ Scraped:           ${scraped}`);
  console.log(`   ❌ Failed/skipped:    ${failed}`);
  if (cfBlocks) console.log(`   🚫 CF blocks:        ${cfBlocks}`);
  console.log(`   📦 Total in output:  ${products.length}`);
  console.log(`   📁 File:             ${CONFIG.outputFile}`);
  console.log('═'.repeat(68));

  printValidationReport(products);

  console.log('📌  Next: import btech-products.json via Admin → Products → Import JSON\n');
}

main().catch(err => {
  log('error', `Fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});
