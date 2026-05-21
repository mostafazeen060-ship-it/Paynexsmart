import { User } from '@/types';
import { logAudit } from './auditLog';

const AUTH_KEY = 'paynix_auth_user';

export function getCurrentUser(): User | null {
  const user = localStorage.getItem(AUTH_KEY);
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem(AUTH_KEY);
}

// هذه الدوال هي التي يحتاجها ملف LoginPage.tsx وتتسبب في الخطأ
export function loginWithEmail(email: string, password: string): User | null {
  // هنا ستضع منطق التحقق الفعلي (API أو Mock)
  return null; 
}

export function loginWithPhone(phone: string, password: string): User | null {
  return null;
}

export function registerUser(userData: User): void {
  // منطق التسجيل
}
