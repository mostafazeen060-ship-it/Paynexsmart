import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function NotFound() {
  const { t } = useApp();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-black text-[#0f2460] mb-4">404</div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">{t('الصفحة غير موجودة', 'Page Not Found')}</h2>
        <p className="text-slate-500 mb-6">{t('الصفحة التي تبحث عنها غير موجودة', 'The page you are looking for does not exist')}</p>
        <button onClick={() => navigate('/')} className="btn-primary flex items-center gap-2 mx-auto">
          <Home size={18} />
          {t('الرئيسية', 'Home')}
        </button>
      </div>
    </div>
  );
}
