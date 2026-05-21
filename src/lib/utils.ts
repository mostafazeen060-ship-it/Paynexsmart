import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// دمج كلاسات Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// تنسيق العملة
export function formatCurrency(amount: number, lang: 'ar' | 'en' = 'ar') {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: 'EGP',
  }).format(amount);
}

// دالة حساب القسط الذكي (المعادلة الأساسية)
export function calculateInstallment(totalAmount: number, months: number, interestRate: number = 0) {
  // interestRate: نسبة الفائدة السنوية (مثال: 0.15 لـ 15%)
  const monthlyInterest = interestRate / 12;
  const monthlyPayment = (totalAmount * monthlyInterest * Math.pow(1 + monthlyInterest, months)) / 
                         (Math.pow(1 + monthlyInterest, months) - 1);
  
  // إذا كانت الفائدة 0، نقسم المبلغ على عدد الشهور مباشرة
  return interestRate === 0 ? Math.round(totalAmount / months) : Math.round(monthlyPayment);
}

// تسميات حالات الطلب
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

// ألوان حالات الطلب
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
