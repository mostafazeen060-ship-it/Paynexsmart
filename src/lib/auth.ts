import { User } from '@/types';
import { ADMIN_CREDENTIALS, MOCK_SUPERVISORS } from '@/constants/data';
import { logLogin } from './auditLog';

const AUTH_KEY = 'qastly_auth_user';

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
