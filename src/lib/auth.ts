import { User } from '@/types';
import { ADMIN_CREDENTIALS, MOCK_SUPERVISORS } from '@/constants/data';
import { logLogin } from './auditLog';

const AUTH_KEY = 'qastly_auth_user';
const USERS_KEY = 'qastly_all_users';

export function getStoredUsers(): User[] {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

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

// الدوال المطلوبة لـ LoginPage.tsx
export function loginWithEmail(email: string, password: string): User | null {
  return login(email, password);
}

export function loginWithPhone(phone: string, password: string): User | null {
  // حالياً تعمل مثل الإيميل للتبسيط
  return login(phone, password);
}

export function registerUser(userData: User): void {
  const users = getStoredUsers();
  users.push(userData);
  saveUsers(users);
}

export function login(username: string, password: string): User | null {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const admin: User = { id: 'admin', name: 'Administrator', role: 'admin' };
    setCurrentUser(admin);
    logLogin('admin');
    return admin;
  }

  const supervisor = MOCK_SUPERVISORS.find(s => s.email === username && s.password === password);
  if (supervisor) {
    const user: User = { id: supervisor.id, name: supervisor.name, role: 'supervisor' };
    setCurrentUser(user);
    logLogin(supervisor.id);
    return user;
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}
