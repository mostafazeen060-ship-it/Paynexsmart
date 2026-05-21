import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ar-EG');
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ar-EG', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'قيد الانتظار',
    approved: 'تم الموافقة',
    rejected: 'مرفوض',
    'under-review': 'تحت المراجعة'
  };
  return labels[status] || status;
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600',
    approved: 'text-green-600',
    rejected: 'text-red-600',
    'under-review': 'text-blue-600'
  };
  return colors[status] || 'text-gray-600';
}
