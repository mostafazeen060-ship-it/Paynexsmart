import type { User } from '@/types';
import { ADMIN_CREDENTIALS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId } from './utils';
import { logLogin } from './auditLog';

const AUTH_KEY = 'qastly_auth_user';

export function login(username: string, password: string): User | null {
  // التحقق من الأدمن
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const admin: User = { id: 'admin', name: 'Administrator', role: 'admin' };
    localStorage.setItem(AUTH_KEY, JSON.stringify(admin));
    logLogin('admin'); // تسجيل عملية الدخول في الـ Audit Log
    return admin;
  }

  // التحقق من المشرفين
  const supervisor = MOCK_SUPERVISORS.find(s => s.email === username && s.password === password);
  if (supervisor) {
    const user: User = { id: supervisor.id, name: supervisor.name, role: 'supervisor' };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    logLogin(supervisor.id); // تسجيل عملية الدخول في الـ Audit Log
    return user;
  }

  return null;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = '/login';
}

export function getCurrentUser(): User | null {
  const user = localStorage.getItem(AUTH_KEY);
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}
