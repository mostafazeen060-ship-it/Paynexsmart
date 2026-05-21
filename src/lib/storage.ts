import type { SiteSettings, Order, Product, Supervisor, AttendanceRecord, Notification } from '@/types';
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
  
  try { 
    const parsed = JSON.parse(stored);
    // دمج الإعدادات مع ضمان وجود مصفوفة banners دائماً
    return { 
      ...DEFAULT_SETTINGS, 
      ...parsed,
      banners: (Array.isArray(parsed.banners)) ? parsed.banners : DEFAULT_SETTINGS.banners || [] 
    }; 
  }
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

// ===== ORDERS =====
export function getOrders(): Order[] {
  const stored = localStorage.getItem(KEY.orders);
  if (!stored) { localStorage.setItem(KEY.orders, JSON.stringify(MOCK_ORDERS)); return MOCK_ORDERS; }
  try { return JSON.parse(stored) as Order[]; } catch { return MOCK_ORDERS; }
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find(o => o.id === id);
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem(KEY.orders, JSON.stringify(orders));
}

// ===== SUPERVISORS =====
export function getSupervisors(): Supervisor[] {
  const stored = localStorage.getItem(KEY.supervisors);
  if (!stored) return MOCK_SUPERVISORS;
  try { return JSON.parse(stored) as Supervisor[]; } catch { return MOCK_SUPERVISORS; }
}

// ===== NOTIFICATIONS =====
export function getNotifications(userId: string): Notification[] {
  try { return JSON.parse(localStorage.getItem(`paynix_notifications_${userId}`) ?? '[]'); }
  catch { return []; }
}

export function addNotification(notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): void {
  const notifications = getNotifications(notif.userId);
  const newNotif: Notification = { ...notif, id: generateId(), isRead: false, createdAt: new Date().toISOString() };
  localStorage.setItem(`paynix_notifications_${notif.userId}`, JSON.stringify([newNotif, ...notifications]));
}

// ===== SCRAPER HISTORY =====
export function getScraperHistory() {
  try { return JSON.parse(localStorage.getItem('paynix_scraper_history') ?? '[]'); }
  catch { return []; }
}
