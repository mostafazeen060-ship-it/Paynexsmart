import type { SiteSettings, Order, Product, Supervisor, AttendanceRecord, Notification } from '@/types';
import { DEFAULT_SETTINGS, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId, addDays } from './utils';

const KEY = {
  settings:    'paynix_settings',
  products:    'paynix_products',
  orders:      'paynix_orders',
  supervisors: 'paynix_supervisors',
};

// ===== SITE SETTINGS (معدلة للحماية من خطأ banners) =====
export function getSiteSettings(): SiteSettings {
  const stored = localStorage.getItem(KEY.settings);
  if (!stored) return DEFAULT_SETTINGS;
  
  try { 
    const parsed = JSON.parse(stored);
    return { 
      ...DEFAULT_SETTINGS, 
      ...parsed,
      // نضمن دائماً إرجاع مصفوفة banners لتجنب الخطأ في المكونات
      banners: Array.isArray(parsed.banners) ? parsed.banners : DEFAULT_SETTINGS.banners || [] 
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
  
  // الإخطارات
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

// ===== SCRAPER =====
export function addScraperImport(record: any): any {
  // logic...
  return record;
}
