import type { SiteSettings, Order, Product, Supervisor, AttendanceRecord } from '@/types';
import { DEFAULT_SETTINGS, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId, addDays } from './utils';

const KEY = {
  settings:    'paynix_settings',
  products:    'paynix_products',
  orders:      'paynix_orders',
  supervisors: 'paynix_supervisors',
};

// ===== SITE SETTINGS =====
export function getSiteSettings(): SiteSettings {
  const stored = localStorage.getItem(KEY.settings);
  if (!stored) return DEFAULT_SETTINGS;
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }; }
  catch { return DEFAULT_SETTINGS; }
}
export function saveSiteSettings(settings: SiteSettings): void {
  localStorage.setItem(KEY.settings, JSON.stringify(settings));
}

// ===== PRODUCTS =====
export function getProducts(): Product[] {
  const stored = localStorage.getItem(KEY.products);
  if (!stored) { localStorage.setItem(KEY.products, JSON.stringify(MOCK_PRODUCTS)); return MOCK_PRODUCTS; }
  try { return JSON.parse(stored) as Product[]; } catch { return MOCK_PRODUCTS; }
}
export function saveProducts(products: Product[]): void {
  localStorage.setItem(KEY.products, JSON.stringify(products));
}
export function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
  const products = getProducts();
  const newProduct: Product = { ...product, id: generateId(), createdAt: new Date().toISOString() };
  saveProducts([...products, newProduct]);
  return newProduct;
}
export function updateProduct(id: string, updates: Partial<Product>): void {
  saveProducts(getProducts().map(p => p.id === id ? { ...p, ...updates } : p));
}
export function deleteProduct(id: string): void {
  saveProducts(getProducts().filter(p => p.id !== id));
}

// ===== ORDERS =====
export function getOrders(): Order[] {
  const stored = localStorage.getItem(KEY.orders);
  if (!stored) { localStorage.setItem(KEY.orders, JSON.stringify(MOCK_ORDERS)); return MOCK_ORDERS; }
  try { return JSON.parse(stored) as Order[]; } catch { return MOCK_ORDERS; }
}
export function saveOrders(orders: Order[]): void {
  localStorage.setItem(KEY.orders, JSON.stringify(orders));
}
export function getOrdersByCustomer(customerId: string): Order[] {
  return getOrders().filter(o => o.customerId === customerId);
}
export function getOrdersBySupervisor(supervisorId: string): Order[] {
  return getOrders().filter(o => o.supervisorId === supervisorId);
}
export function addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: `ord-${generateId()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveOrders([...orders, newOrder]);
  addNotification({
    userId: 'admin-001', type: 'new-order',
    titleAr: 'طلب جديد', titleEn: 'New Order',
    messageAr: `طلب جديد من ${newOrder.customerName}`,
    messageEn: `New order from ${newOrder.customerName}`,
    orderId: newOrder.id,
  });
  if (newOrder.supervisorId) {
    addNotification({
      userId: newOrder.supervisorId, type: 'new-order',
      titleAr: 'طلب جديد في محافظتك', titleEn: 'New order in your province',
      messageAr: `طلب جديد من ${newOrder.customerName}`,
      messageEn: `New order from ${newOrder.customerName}`,
      orderId: newOrder.id,
    });
  }
  return newOrder;
}

export function updateOrder(id: string, updates: Partial<Order>): void {
  const orders = getOrders();
  const updated = orders.map(o => {
    if (o.id !== id) return o;
    const updatedOrder = { ...o, ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'rejected') {
      updatedOrder.rejectedAt = new Date().toISOString();
      updatedOrder.canReapplyAt = addDays(new Date().toISOString(), 60);
      addNotification({
        userId: o.customerId, type: 'order-update',
        titleAr: 'تحديث على طلبك', titleEn: 'Order Update',
        messageAr: 'عذراً، لم تكتمل موافقة طلبك في الوقت الحالي. يمكنك إعادة التقديم بعد 60 يوماً.',
        messageEn: 'Your order was not approved at this time. You may reapply after 60 days.',
        orderId: id,
      });
    }
    if (updates.status === 'approved') {
      updatedOrder.approvedAt = new Date().toISOString();
      addNotification({
        userId: o.customerId, type: 'order-update',
        titleAr: 'تهانينا! تمت الموافقة على طلبك', titleEn: 'Order Approved!',
        messageAr: 'تمت الموافقة على طلب التقسيط الخاص بك. سيتواصل معك مشرف المحافظة قريباً.',
        messageEn: 'Your installment order has been approved. Province supervisor will contact you soon.',
        orderId: id,
      });
    }
    if (updates.status === 'delivered') {
      updatedOrder.deliveredAt = new Date().toISOString();
      addNotification({
        userId: o.customerId, type: 'order-update',
        titleAr: 'تم تسليم المنتج وتفعيل الأقساط', titleEn: 'Product Delivered',
        messageAr: 'تم تسليم منتجك وتفعيل خطة الأقساط. شكراً لثقتك في باينكس.',
        messageEn: 'Your product has been delivered and installment plan activated.',
        orderId: id,
      });
    }
    if (updates.status === 'admin-review') {
      addNotification({
        userId: 'admin-001', type: 'new-order',
        titleAr: 'طلب ينتظر مراجعتك', titleEn: 'Order awaiting your review',
        messageAr: `طلب ${o.customerName} جاهز للمراجعة النهائية`,
        messageEn: `Order from ${o.customerName} is ready for final review`,
        orderId: id,
      });
    }
    return updatedOrder;
  });
  saveOrders(updated);
}

// ===== SUPERVISORS =====
export function getSupervisors(): Supervisor[] {
  const stored = localStorage.getItem(KEY.supervisors);
  if (!stored) { localStorage.setItem(KEY.supervisors, JSON.stringify(MOCK_SUPERVISORS)); return MOCK_SUPERVISORS; }
  try { return JSON.parse(stored) as Supervisor[]; } catch { return MOCK_SUPERVISORS; }
}
export function saveSupervisors(supervisors: Supervisor[]): void {
  localStorage.setItem(KEY.supervisors, JSON.stringify(supervisors));
}
export function getSupervisorByProvince(provinceId: string): Supervisor | null {
  return getSupervisors().find(s => s.province === provinceId) ?? null;
}
export function getSupervisorById(id: string): Supervisor | null {
  return getSupervisors().find(s => s.id === id) ?? null;
}

// ===== FINANCIAL LOCK SYSTEM =====

/** Lock supervisor account after check-out */
export function lockSupervisor(supervisorId: string): void {
  const sups = getSupervisors();
  saveSupervisors(sups.map(s =>
    s.id === supervisorId
      ? { ...s, isLocked: true, lastCheckOutAt: new Date().toISOString() }
      : s
  ));
}

/**
 * Admin confirms cash received → full or partial settlement.
 * Any remaining balance becomes negative debt (رصيد سالب).
 */
export function clearSupervisorDebt(supervisorId: string, adminId: string, amount: number): void {
  const sups = getSupervisors();
  const idx = sups.findIndex(s => s.id === supervisorId);
  if (idx === -1) return;
  const sup = sups[idx];
  const pendingBefore = sup.pendingDebt ?? 0;
  const remaining = pendingBefore - amount;
  // Negative means supervisor over-paid (credit), positive means still owes (debt)
  const newPendingDebt = remaining > 0 ? remaining : 0;
  const creditBalance = remaining < 0 ? Math.abs(remaining) : 0; // surplus returned

  sups[idx] = {
    ...sup,
    isLocked: false,
    pendingDebt: newPendingDebt,
    wallet: {
      ...sup.wallet,
      totalBalance: Math.max(0, sup.wallet.totalBalance - amount + creditBalance),
      lastSettledAt: new Date().toISOString(),
      transactions: [
        {
          id: generateId(),
          type: 'settlement',
          amount,
          description: `تصفير عهدة يدوي بواسطة المدير — مُسوَّى: ${amount} ج.م${remaining > 0 ? ` — متبقي (مدين): ${remaining} ج.م` : ''}`,
          createdAt: new Date().toISOString(),
          approvedBy: adminId,
        },
        ...sup.wallet.transactions,
      ],
      lastUpdated: new Date().toISOString(),
    },
  };
  saveSupervisors(sups);

  addNotification({
    userId: supervisorId, type: 'wallet',
    titleAr: 'تم تصفير العهدة',
    titleEn: 'Debt Cleared',
    messageAr: `تم استلام ${amount} ج.م من عهدتك وفتح حسابك لليوم التالي.${remaining > 0 ? ` متبقي مدين: ${remaining} ج.م.` : ''}`,
    messageEn: `${amount} EGP received. Account unlocked.${remaining > 0 ? ` Remaining debt: ${remaining} EGP.` : ''}`,
  });
}

/** Add fee collection to supervisor wallet — registers as pending debt */
export function addFeeToWallet(supervisorId: string, fee: number, orderId: string, customerName: string): void {
  const sups = getSupervisors();
  const idx = sups.findIndex(s => s.id === supervisorId);
  if (idx === -1) return;
  const sup = sups[idx];

  sups[idx] = {
    ...sup,
    pendingDebt: (sup.pendingDebt ?? 0) + fee,
    wallet: {
      ...sup.wallet,
      totalFees: sup.wallet.totalFees + fee,
      totalBalance: sup.wallet.totalBalance + fee,
      transactions: [
        {
          id: generateId(),
          type: 'fee',
          amount: fee,
          description: `رسوم استعلام — ${customerName}`,
          orderId,
          createdAt: new Date().toISOString(),
        },
        ...sup.wallet.transactions,
      ],
      lastUpdated: new Date().toISOString(),
    },
  };
  saveSupervisors(sups);
}

/** Auto-suspend supervisors who have outstanding debt > 24h */
export function checkAndAutoLockSupervisors(): void {
  const sups = getSupervisors();
  const now = Date.now();
  let changed = false;

  const updated = sups.map(s => {
    if (s.isLocked || !s.lastCheckOutAt || (s.pendingDebt ?? 0) === 0) return s;
    const hoursSinceCheckout = (now - new Date(s.lastCheckOutAt).getTime()) / 3600000;
    if (hoursSinceCheckout > 24) {
      changed = true;
      addNotification({
        userId: 'admin-001', type: 'lock-alert',
        titleAr: `تنبيه: تأخر تسليم عهدة ${s.name}`,
        titleEn: `Alert: ${s.name} delayed custody settlement`,
        messageAr: `المشرف ${s.name} لم يسلم العهدة منذ أكثر من 24 ساعة — تم تحويل الحساب للتحقيق.`,
        messageEn: `Supervisor ${s.name} has not settled custody for over 24 hours.`,
      });
      return { ...s, isLocked: true };
    }
    return s;
  });

  if (changed) saveSupervisors(updated);
}

/** Admin manual deduction */
export function deductWalletBalance(supervisorId: string, amount: number, description: string): void {
  const sups = getSupervisors();
  const idx = sups.findIndex(s => s.id === supervisorId);
  if (idx === -1) return;
  const sup = sups[idx];
  sups[idx] = {
    ...sup,
    wallet: {
      ...sup.wallet,
      totalBalance: sup.wallet.totalBalance - amount, // Allow negative
      transactions: [
        {
          id: generateId(),
          type: 'withdrawal',
          amount,
          description,
          createdAt: new Date().toISOString(),
          approvedBy: 'admin-001',
        },
        ...sup.wallet.transactions,
      ],
      lastUpdated: new Date().toISOString(),
    },
  };
  saveSupervisors(sups);
}

// ===== SALARY MANAGEMENT =====
export interface SalaryRecord {
  id: string;
  supervisorId: string;
  month: string; // 'YYYY-MM'
  baseSalary: number;
  bonuses: { id: string; amount: number; reason: string; date: string }[];
  penalties: { id: string; amount: number; reason: string; date: string }[];
  debtCarriedOver: number; // رصيد مدين مُرحَّل
  finalAmount: number;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  archivedData?: object; // Frozen snapshot
}

function getSalaryStorageKey(supervisorId: string, month: string) {
  return `paynix_salary_${supervisorId}_${month}`;
}

export function getSalaryRecord(supervisorId: string, month: string): SalaryRecord | null {
  try {
    const raw = localStorage.getItem(getSalaryStorageKey(supervisorId, month));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSalaryRecord(record: SalaryRecord): void {
  localStorage.setItem(getSalaryStorageKey(record.supervisorId, record.month), JSON.stringify(record));
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getOrCreateSalaryRecord(supervisorId: string, month?: string): SalaryRecord {
  const m = month ?? getCurrentMonth();
  const existing = getSalaryRecord(supervisorId, m);
  if (existing) return existing;

  // Check for carried-over debt from previous month
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevRecord = getSalaryRecord(supervisorId, prevMonth);
  const debtCarriedOver = prevRecord && prevRecord.isApproved && prevRecord.finalAmount < 0
    ? Math.abs(prevRecord.finalAmount)
    : 0;

  const sup = getSupervisors().find(s => s.id === supervisorId);
  const newRecord: SalaryRecord = {
    id: generateId(),
    supervisorId,
    month: m,
    baseSalary: sup?.baseSalary ?? 3000,
    bonuses: [],
    penalties: [],
    debtCarriedOver,
    finalAmount: (sup?.baseSalary ?? 3000) - debtCarriedOver,
    isApproved: false,
  };
  saveSalaryRecord(newRecord);
  return newRecord;
}

export function addBonus(supervisorId: string, amount: number, reason: string): void {
  const record = getOrCreateSalaryRecord(supervisorId);
  const updated: SalaryRecord = {
    ...record,
    bonuses: [...record.bonuses, { id: generateId(), amount, reason, date: new Date().toISOString() }],
    finalAmount: record.finalAmount + amount,
  };
  saveSalaryRecord(updated);
}

export function addPenalty(supervisorId: string, amount: number, reason: string): void {
  const record = getOrCreateSalaryRecord(supervisorId);
  const updated: SalaryRecord = {
    ...record,
    penalties: [...record.penalties, { id: generateId(), amount, reason, date: new Date().toISOString() }],
    finalAmount: record.finalAmount - amount,
  };
  saveSalaryRecord(updated);
}

/**
 * Monthly close — approve and archive salary.
 * Carries forward any negative balance to next month.
 */
export function approveMonthlySalary(supervisorId: string, adminId: string): SalaryRecord {
  const record = getOrCreateSalaryRecord(supervisorId);
  if (record.isApproved) throw new Error('Already approved');

  const sup = getSupervisors().find(s => s.id === supervisorId);
  const pendingDebt = sup?.pendingDebt ?? 0;
  const netFinal = record.finalAmount - pendingDebt;

  const approved: SalaryRecord = {
    ...record,
    finalAmount: netFinal,
    isApproved: true,
    approvedAt: new Date().toISOString(),
    approvedBy: adminId,
    archivedData: JSON.parse(JSON.stringify(record)), // deep freeze snapshot
  };
  saveSalaryRecord(approved);

  // Reset supervisor pending debt after salary settlement
  const sups = getSupervisors();
  const idx = sups.findIndex(s => s.id === supervisorId);
  if (idx !== -1) {
    sups[idx] = { ...sups[idx], pendingDebt: 0, wallet: { ...sups[idx].wallet, totalFees: 0, totalBalance: 0, transactions: [], lastUpdated: new Date().toISOString() } };
    saveSupervisors(sups);
  }

  addNotification({
    userId: supervisorId, type: 'wallet',
    titleAr: 'اعتماد الراتب الشهري',
    titleEn: 'Monthly Salary Approved',
    messageAr: `تم اعتماد راتب شهر ${record.month}. الصافي: ${netFinal} ج.م`,
    messageEn: `Salary for ${record.month} approved. Net: ${netFinal} EGP`,
  });

  return approved;
}

// ===== NOTIFICATIONS =====
export function getNotifications(userId: string): import('@/types').Notification[] {
  try { return JSON.parse(localStorage.getItem(`paynix_notifications_${userId}`) ?? '[]'); }
  catch { return []; }
}
export function addNotification(notif: Omit<import('@/types').Notification, 'id' | 'createdAt' | 'isRead'>): void {
  const notifications = getNotifications(notif.userId);
  const newNotif = { ...notif, id: generateId(), isRead: false, createdAt: new Date().toISOString() };
  localStorage.setItem(`paynix_notifications_${notif.userId}`, JSON.stringify([newNotif, ...notifications]));
}
export function markNotificationsRead(userId: string): void {
  const n = getNotifications(userId).map(n => ({ ...n, isRead: true }));
  localStorage.setItem(`paynix_notifications_${userId}`, JSON.stringify(n));
}

// ===== ATTENDANCE =====
export function getAttendanceRecords(supervisorId: string): AttendanceRecord[] {
  try { return JSON.parse(localStorage.getItem(`paynix_attendance_${supervisorId}`) ?? '[]'); }
  catch { return []; }
}
export function saveAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
  const records = getAttendanceRecords(record.supervisorId);
  const newRecord: AttendanceRecord = { ...record, id: generateId() };
  localStorage.setItem(`paynix_attendance_${record.supervisorId}`, JSON.stringify([newRecord, ...records]));
  return newRecord;
}
export function updateAttendanceRecord(supervisorId: string, date: string, updates: Partial<AttendanceRecord>): void {
  const records = getAttendanceRecords(supervisorId);
  const updated = records.map(r => r.date === date ? { ...r, ...updates } : r);
  localStorage.setItem(`paynix_attendance_${supervisorId}`, JSON.stringify(updated));
}

// ===== SCRAPER / SYNC HISTORY =====

export interface ScraperImportRecord {
  id: string;
  importedAt: string;
  source: 'btech' | 'manual';
  totalInFile: number;
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
  durationMs: number;
}

const SCRAPER_HISTORY_KEY = 'paynix_scraper_history';
const MAX_HISTORY = 20;

export function getScraperHistory(): ScraperImportRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SCRAPER_HISTORY_KEY) ?? '[]') as ScraperImportRecord[];
  } catch { return []; }
}

export function getLastScraperImport(): ScraperImportRecord | null {
  const h = getScraperHistory();
  return h.length > 0 ? h[0] : null;
}

export function addScraperImport(record: Omit<ScraperImportRecord, 'id'>): ScraperImportRecord {
  const history = getScraperHistory();
  const newRecord: ScraperImportRecord = { ...record, id: generateId() };
  const updated = [newRecord, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(SCRAPER_HISTORY_KEY, JSON.stringify(updated));

  // Update site settings sync date
  const settings = getSiteSettings();
  settings.lastSyncDate = record.importedAt;
  settings.syncErrorMessage = record.errors.length > 0
    ? `${record.failed} منتج فشل في الاستيراد`
    : undefined;
  saveSiteSettings(settings);

  return newRecord;
}

/**
 * Import an array of scraped products (BTech schema) into the product store.
 * Returns a summary record.
 */
export function importScrapedProducts(
  rawProducts: Record<string, unknown>[],
  source: 'btech' | 'manual' = 'btech',
): ScraperImportRecord {
  const startTime = Date.now();
  const existing = getProducts();
  const existingMap = new Map(existing.map(p => [p.sourceId ?? p.id, p]));

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];
  const newProducts: Product[] = [...existing];

  for (const raw of rawProducts) {
    try {
      if (!raw.name && !raw.nameAr) { skipped++; continue; }
      const price = parseFloat(String(raw.price ?? '0')) || 0;
      if (price <= 0) { skipped++; continue; }

      const sourceId = String(raw.sourceId ?? raw.sku ?? raw.id ?? '');
      const existingProduct = sourceId ? existingMap.get(sourceId) : undefined;

      const mapped: Product = {
        id: existingProduct?.id ?? generateId(),
        name: String(raw.name ?? raw.nameAr ?? ''),
        nameAr: String(raw.nameAr ?? raw.name ?? ''),
        nameEn: String(raw.nameEn ?? raw.name ?? ''),
        description: String(raw.description ?? raw.descriptionAr ?? ''),
        descriptionAr: String(raw.descriptionAr ?? raw.description ?? ''),
        descriptionEn: String(raw.descriptionEn ?? raw.description ?? ''),
        price,
        originalPrice: raw.originalPrice ? parseFloat(String(raw.originalPrice)) : undefined,
        images: Array.isArray(raw.images) && raw.images.length > 0
          ? (raw.images as string[])
          : [`https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop`],
        category: String(raw.category ?? ''),
        categoryAr: String(raw.categoryAr ?? raw.category ?? ''),
        brand: String(raw.brand ?? ''),
        source,
        sourceId,
        sourceUrl: String(raw.sourceUrl ?? ''),
        isActive: raw.availability !== 'out-of-stock',
        stock: raw.availability === 'out-of-stock' ? 0 : (Number(raw.stock) || 99),
        specs: (raw.specs && typeof raw.specs === 'object') ? raw.specs as Record<string, string> : {},
        lastSyncedAt: new Date().toISOString(),
        createdAt: existingProduct?.createdAt ?? new Date().toISOString(),
        adminPriceOverride: existingProduct?.adminPriceOverride,
      };

      if (existingProduct) {
        const idx = newProducts.findIndex(p => p.id === existingProduct.id);
        if (idx !== -1) { newProducts[idx] = mapped; updated++; }
      } else {
        newProducts.push(mapped);
        added++;
      }
    } catch (err) {
      failed++;
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  saveProducts(newProducts);

  return addScraperImport({
    importedAt: new Date().toISOString(),
    source,
    totalInFile: rawProducts.length,
    added,
    updated,
    skipped,
    failed,
    errors: errors.slice(0, 10),
    durationMs: Date.now() - startTime,
  });
}

// ===== TESTIMONIALS (Admin-managed) =====
export interface TestimonialItem {
  id: string;
  name: string;
  province: string;
  text: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
}

export function getTestimonials(): TestimonialItem[] {
  try {
    const raw = localStorage.getItem('paynix_testimonials');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveTestimonials(items: TestimonialItem[]): void {
  localStorage.setItem('paynix_testimonials', JSON.stringify(items));
}

export function addTestimonial(item: Omit<TestimonialItem, 'id' | 'createdAt'>): TestimonialItem {
  const all = getTestimonials();
  const newItem: TestimonialItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
  saveTestimonials([newItem, ...all]);
  return newItem;
}

export function deleteTestimonial(id: string): void {
  saveTestimonials(getTestimonials().filter(t => t.id !== id));
}
