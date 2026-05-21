// تحديث التايب الخاص بالمنتج والطلب
export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string; // تم ربطها بـ AdminProducts
  categoryAr: string;
  brand: string;
  stock: number;
  isActive: boolean;
  descriptionAr: string;
  descriptionEn: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  customerProvince: string;
  months: number; // تم إضافتها بناءً على حاسبة التقسيط
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  supervisorId?: string;
}

export type OrderStatus = 'pending' | 'under-inquiry' | 'admin-review' | 'approved' | 'rejected';
