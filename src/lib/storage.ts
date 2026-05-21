import { SiteSettings, Order, Product, Supervisor } from '@/types';
import { DEFAULT_SETTINGS, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId } from './utils';

const KEY = {
  settings:    'paynix_settings',
  products:    'paynix_products',
  orders:      'paynix_orders',
  supervisors: 'paynix_supervisors',
  notifications: 'qastly_notifications'
};

// دالة محلية لإضافة التنبيهات بدلاً من استيرادها
export function addNotification(notification: any) {
  const current = JSON.parse(localStorage.getItem(KEY.notifications) || '[]');
  const newNotification = { ...notification, id: generateId(), createdAt: new Date().toISOString() };
  localStorage.setItem(KEY.notifications, JSON.stringify([newNotification, ...current]));
}

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

export function addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: `ord-${generateId()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveOrders([...orders, newOrder]);
  
  // استخدام الدالة المحلية
  addNotification({
    userId: 'admin-001', type: 'new-order',
    messageAr: `طلب جديد من ${newOrder.customerName}`,
    messageEn: `New order from ${newOrder.customerName}`,
    orderId: newOrder.id,
  });
  
  return newOrder;
}

// ===== SUPERVISORS =====
export function getSupervisors(): Supervisor[] {
  const stored = localStorage.getItem(KEY.supervisors);
  return stored ? JSON.parse(stored) : MOCK_SUPERVISORS;
}
