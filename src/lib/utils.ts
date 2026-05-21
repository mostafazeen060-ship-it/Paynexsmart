import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// دالة توليد معرف فريد (تم إضافتها لإصلاح خطأ البناء)
export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// دالة إضافة أيام (تم إضافتها لإصلاح خطأ البناء)
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatCurrency(amount: number, lang: 'ar' | 'en' = 'ar') {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: 'EGP',
  }).format(amount);
}

export function formatDate(dateStr: string, lang: 'ar' | 'en' = 'ar') {
  return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
}

export function formatTime(dateStr: string, lang: 'ar' | 'en' = 'ar') {
  return new Date(dateStr).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

export function hoursSince(dateStr: string) {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60));
}

export function getOrderStatusLabel(status: string, t: any) {
  const labels: Record<string, string> = {
    'pending': 'قيد الانتظار',
    'under-inquiry': 'جاري الاستعلام',
    'admin-review': 'مراجعة المدير',
    'approved': 'موافقة نهائية',
    'rejected': 'مرفوض',
  };
  return labels[status] || status;
}

export function getOrderStatusColor(status: string) {
  const colors: Record<string, string> = {
    'pending': 'bg-slate-100 text-slate-700',
    'under-inquiry': 'bg-blue-100 text-blue-700',
    'admin-review': 'bg-purple-100 text-purple-700',
    'approved': 'bg-emerald-100 text-emerald-700',
    'rejected': 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100';
}
