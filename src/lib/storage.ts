// أضف هذه الدوال إلى src/lib/storage.ts
export function getNotifications(userId: string): Notification[] {
  const all = JSON.parse(localStorage.getItem('qastly_notifications') || '[]');
  return all.filter((n: Notification) => n.userId === userId);
}

export function markNotificationsRead(userId: string): void {
  const all = JSON.parse(localStorage.getItem('qastly_notifications') || '[]');
  const updated = all.map((n: Notification) => 
    n.userId === userId ? { ...n, isRead: true } : n
  );
  localStorage.setItem('qastly_notifications', JSON.stringify(updated));
}
