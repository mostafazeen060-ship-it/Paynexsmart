import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function NotificationBell() {
  const { t } = useApp();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // تحميل التنبيهات من التخزين المحلي
  useEffect(() => {
    const data = localStorage.getItem('qastly_notifications');
    if (data) setNotifications(JSON.parse(data));
  }, []);

  const markAsRead = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('qastly_notifications', JSON.stringify(updated));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 rounded-lg hover:bg-slate-100 relative"
      >
        <Bell size={20} className="text-slate-600" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-4 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-slate-800 mb-3">{t('التنبيهات', 'Notifications')}</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">{t('لا توجد تنبيهات جديدة', 'No new notifications')}</p>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className="p-3 bg-slate-50 rounded-xl mb-2 text-sm flex justify-between items-start">
                <span>{n.message}</span>
                <button onClick={() => markAsRead(n.id)} className="text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
