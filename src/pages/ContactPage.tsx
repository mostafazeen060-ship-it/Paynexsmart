import { Phone, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export default function ContactPage() {
  const { t, settings } = useApp();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success(t('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً', 'Message sent successfully, we will contact you soon'));
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="bg-[#0f2460] py-16 px-4 text-center text-white">
        <h1 className="text-3xl md:text-4xl font-black mb-4">{t('تواصل معنا', 'Contact Us')}</h1>
        <p className="opacity-80 max-w-lg mx-auto">{t('نحن هنا لمساعدتك في أي استفسار بخصوص أقساطك أو طلباتك', 'We are here to help you with any inquiries regarding your installments or orders')}</p>
      </div>

      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* معلومات التواصل */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-[#0f2460] mb-6">{t('بيانات التواصل', 'Contact Info')}</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-[#d4a339]/10 p-3 rounded-full text-[#d4a339]"><Phone size={20} /></div>
                <div>
                  <p className="text-sm text-slate-500">{t('اتصل بنا', 'Call Us')}</p>
                  <p className="font-bold">{settings.contactPhone || '01000000000'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-[#d4a339]/10 p-3 rounded-full text-[#d4a339]"><Mail size={20} /></div>
                <div>
                  <p className="text-sm text-slate-500">{t('البريد الإلكتروني', 'Email')}</p>
                  <p className="font-bold">{settings.contactEmail || 'support@paynix.com'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* نموذج التواصل */}
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t('الاسم', 'Name')}</label>
              <input type="text" className="w-full p-3 border rounded-lg" placeholder={t('اسمك الكريم', 'Your Name')} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t('الرسالة', 'Message')}</label>
              <textarea className="w-full p-3 border rounded-lg h-32" placeholder={t('كيف يمكننا مساعدتك؟', 'How can we help you?')} required />
            </div>
            <button type="submit" className="w-full bg-[#d4a339] text-white py-3 rounded-lg font-black hover:bg-[#b88d2f] transition-all flex items-center justify-center gap-2">
              <Send size={18} />
              {t('إرسال', 'Send')}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
