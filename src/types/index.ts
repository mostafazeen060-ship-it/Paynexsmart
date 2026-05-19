// ============================================================
// Application Types — Qastly Platform
// ============================================================

export type Lang = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';
export type UserRole = 'customer' | 'supervisor' | 'admin';

// ——— Core User ———
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  province?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  googleId?: string;
}

// ——— Supervisor ———
export interface Supervisor extends User {
  baseSalary?: number;             // Monthly base salary (EGP)
  role: 'supervisor';
  province: string;
  workHoursStart: string;
  workHoursEnd: string;
  workDays: string[];
  target: number;
  wallet: SupervisorWallet;
  rewards: Reward[];
  attendanceRecords: AttendanceRecord[];
  isLocked?: boolean;           // Financial lock: must settle daily before next check-in
  lastCheckOutAt?: string;      // Timestamp of last check-out
  pendingDebt?: number;         // Current unsettled cash in custody
}

export interface SupervisorWallet {
  id: string;
  supervisorId: string;
  totalFees: number;
  totalInstallmentsCollected: number;
  totalBalance: number;
  transactions: WalletTransaction[];
  lastUpdated: string;
  lastSettledAt?: string;       // When admin last cleared debt
}

export interface WalletTransaction {
  id: string;
  type: 'fee' | 'installment' | 'withdrawal' | 'adjustment' | 'settlement';
  amount: number;
  description: string;
  orderId?: string;
  createdAt: string;
  approvedBy?: string;
  gpsLat?: number;
  gpsLng?: number;
}

// ——— Attendance ———
export interface AttendanceRecord {
  id: string;
  supervisorId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInGps?: GpsCoords;
  checkOutGps?: GpsCoords;
  status: 'present' | 'absent' | 'late' | 'early-leave';
  faceVerified: boolean;
  faceImage?: string;
  location?: string;
  isMockLocation?: boolean;
}

export interface GpsCoords {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
}

// ——— Rewards ———
export interface Reward {
  id: string;
  supervisorId: string;
  type: 'bonus' | 'certificate' | 'penalty';
  amount?: number;
  description: string;
  achievedAt: string;
  criteria: string;
}

// ——— Product (Aman Scraper) ———
export interface Product {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  description: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  categoryAr: string;
  brand: string;
  source: 'aman' | 'btech' | 'manual';
  sourceId?: string;
  sourceUrl?: string;
  isActive: boolean;
  stock: number;
  specs?: Record<string, string>;
  lastSyncedAt?: string;
  createdAt: string;
  adminPriceOverride?: number;
  syncError?: string;           // Last scraper error for this product
}

// ——— Financial ———
export interface InstallmentPlan {
  months: number;
  downPayment: number;
  interestRate: number;         // % annual
  adminFee: number;             // % of principal
  adminFeeAmount: number;       // Absolute EGP
  inquiryFee: number;           // EGP fixed
  monthlyPayment: number;       // EGP rounded
  totalAmount: number;          // EGP full cost
}

// ——— Order Status Workflow ———
// pending → under-inquiry → admin-review → approved → delivered → rejected
export type OrderStatus =
  | 'pending'            // Customer submitted
  | 'under-inquiry'      // Supervisor doing field visit
  | 'admin-review'       // Supervisor uploaded docs, waiting admin
  | 'approved'           // Admin approved
  | 'delivered'          // Product delivered, installments active
  | 'rejected'           // Admin rejected
  // Legacy statuses for backwards compat
  | 'documents-required'
  | 'under-review'
  | 'active'
  | 'completed';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerNationalId: string;
  customerEmail: string;
  customerProvince: string;
  customerAddress: string;
  customerAddressGps?: GpsCoords;     // Captured at order time or field visit
  customerJob: string;
  customerIncome?: number;
  productId: string;
  product: Product;
  installmentPlan: InstallmentPlan;
  status: OrderStatus;
  supervisorId?: string;
  documents: OrderDocuments;
  notes?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  canReapplyAt?: string;
  approvedAt?: string;
  deliveredAt?: string;
  creditScore?: CreditScore;
  eSignature?: string;                // Base64 e-signature
  fieldVisitGps?: GpsCoords;         // GPS when supervisor uploaded docs
  inquiryFeePaidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDocuments {
  nationalIdFront?: string;
  nationalIdBack?: string;
  utilityBill?: string;
  incomeProof?: string;
  customerHousePhoto?: string;       // Photo taken at customer's house
  uploadedAt?: string;
  uploadedGps?: GpsCoords;
}

// ——— Credit Scoring ———
export interface CreditScore {
  score: number;            // 0–100
  risk: 'low' | 'medium' | 'high';
  factors: CreditFactor[];
  calculatedAt: string;
}

export interface CreditFactor {
  name: string;
  nameAr: string;
  weight: number;
  value: number;
  note?: string;
}

// ——— Audit Log ———
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;           // 'order' | 'supervisor' | 'settings' | 'wallet' etc.
  entityId?: string;
  before?: string;          // JSON snapshot before
  after?: string;           // JSON snapshot after
  ip?: string;
  timestamp: string;
}

// ——— Misc ———
export interface Banner {
  id: string;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  link?: string;
  isActive: boolean;
  order: number;
}

export interface SiteSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  siteNameAr: string;
  siteNameEn: string;
  taglineAr: string;
  taglineEn: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  inquiryFee: number;
  defaultInterestRate: number;
  defaultAdminFee: number;
  minDownPaymentPercent: number;
  maxInstallmentMonths: number;
  defaultInstallmentMonths: number;
  banners: Banner[];
  footerTextAr: string;
  footerTextEn: string;
  lastSyncDate?: string;
  syncErrorMessage?: string;
  geofenceRadiusMeters?: number;      // Default 50m for document upload
  syncJsonUrl?: string;               // Remote URL for auto-sync (GitHub raw, CDN, etc.)
  autoSyncEnabled?: boolean;          // Trigger sync check on admin page load
  autoSyncIntervalHours?: number;     // How often to auto-sync (default: 24h)
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new-order' | 'order-update' | 'system' | 'reminder' | 'wallet' | 'lock-alert';
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  isRead: boolean;
  orderId?: string;
  createdAt: string;
}

export interface Province {
  id: string;
  nameAr: string;
  nameEn: string;
  supervisorId?: string;
  supervisorName?: string;
  centerLat?: number;
  centerLng?: number;
}

export interface Analytics {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  ordersByProvince: { province: string; count: number; revenue: number }[];
  topProducts: { product: string; count: number }[];
  supervisorPerformance: { name: string; orders: number; revenue: number; attendance: number }[];
  monthlyTrend: { month: string; orders: number; revenue: number }[];
}

export interface ScraperStatus {
  lastRun: string;
  status: 'success' | 'partial' | 'failed';
  productsUpdated: number;
  errors: string[];
  nextScheduled: string;
}
