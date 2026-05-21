import { generateId } from './utils';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  messageAr: string;
  messageEn: string;
  orderId?: string;
  createdAt: string;
}

export function addNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
  const current = JSON.parse(localStorage.getItem('qastly_notifications') || '[]');
  const newNotification: Notification = { 
    ...notification, 
    id: generateId(), 
    createdAt: new Date().toISOString() 
  };
  localStorage.setItem('qastly_notifications', JSON.stringify([newNotification, ...current]));
}

export function getNotifications(): Notification[] {
  return JSON.parse(localStorage.getItem('qastly_notifications') || '[]');
}
