import { Notification } from '@/types';
import { generateId } from './utils';

export function addNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
  const current = JSON.parse(localStorage.getItem('qastly_notifications') || '[]');
  const newNotification: Notification = { 
    ...notification, 
    id: generateId(), 
    createdAt: new Date().toISOString() 
  };
  localStorage.setItem('qastly_notifications', JSON.stringify([newNotification, ...current]));
}
