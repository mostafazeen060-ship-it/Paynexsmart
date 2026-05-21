import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { OrderStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatCurrency(amount: number, lang: string = 'ar'): string {
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return lang === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
}

export function formatDate(dateStr: string, lang: string = 'ar'): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 3600000;
}

export function formatTime(dateStr: string, lang: string = 'ar'): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getCurrentMonthLabel(lang: string = 'ar'): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', { month: 'long', year: 'numeric' }).format(new Date());
}

// ── Order status labels & colors ─────────────────────────────────────────────

/**
 * Customer-facing label for order status.
 * "under-inquiry" shown as "جاري التحقق من الطلب" with pulsing indicator.
 */
export function getOrderStatusLabel(status: string, lang: string = 'ar'): string {
  const map: Record<string, [string, string]> = {
    'pending':       ['قيد الانتظار',             'Pending'],
    'under-inquiry': ['جاري التحقق من الطلب',      'Verifying Order'],
    'under-review':  ['جاري التحقق من الطلب',      'Verifying Order'],
    'admin-review':  ['جاري مراجعة البيانات',        'Reviewing Data'],
    'approved':      ['موافقة نهائية',              'Approved'],
    'delivered':     ['تم التسليم',                'Delivered'],
    'rejected':      ['لم تكتمل الموافقة',          'Not Approved'],
    'active':        ['نشط — أقساط جارية',          'Active — Installments Running'],
    'completed':     ['مكتمل',                     'Completed'],
  };
  return lang === 'ar' ? (map[status]?.[0] ?? status) : (map[status]?.[1] ?? status);
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    'pending':       'bg-amber-50 text-amber-800 border border-amber-200',
    'under-inquiry': 'bg-orange-50 text-orange-800 border border-orange-200',
    'under-review':  'bg-orange-50 text-orange-800 border border-orange-200',
    'admin-review':  'bg-purple-50 text-purple-800 border border-purple-200',
    'approved':      'bg-emerald-50 text-emerald-800 border border-emerald-200',
    'delivered':     'bg-teal-50 text-teal-800 border border-teal-200',
    'rejected':      'bg-red-50 text-red-800 border border-red-200',
    'active':        'bg-blue-50 text-blue-800 border border-blue-200',
    'completed':     'bg-slate-50 text-slate-700 border border-slate-200',
  };
  return map[status] ?? 'bg-slate-50 text-slate-700';
}

/**
 * Returns true when the status should show a pulsing yellow indicator.
 * Used in customer-facing OrderStatusPage.
 */
export function isVerifyingStatus(status: string): boolean {
  return ['under-inquiry', 'under-review', 'admin-review'].includes(status);
}
