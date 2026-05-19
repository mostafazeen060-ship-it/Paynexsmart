import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram, Youtube, Send } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export default function ContactPage() {
  const { t, settings } = useApp();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success(t('تم إرسال رسالتك بنجاح', 'Message sent successfully'));
    (e.target as HTMLFormElement).reset();
  }

  const socials = [
    { icon: <Facebook size={24} />, label: 'Facebook', url: settings.facebookUrl, color: 'bg-[#1877F2]' },
    { icon: <Instagram size={24} />, label: 'Instagram', url: settings.instagramUrl, color: 'bg-gradient-to-br from-[#405DE6] to-[#E1306C]' },
    { icon: <Youtube size={24} />, label: 'YouTube', url: settings.youtubeUrl, color: 'bg-[#FF0000]' },
    { icon: <MessageCircle size={24} />, label: 'WhatsApp', url: `https://wa.me/${settings.contactWhatsapp}`, color: 'bg-[#25D366]' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="gradient-hero py-16 px-4 text-center">
        <h1 className="text-4xl font-black text-white mb-3">{t('تواصل معنا', 'Contact Us')}</h1>
        <p className="text-white/70 text-lg">{t('نحن هنا لمساعدتك في أي وقت', 'We are here to help you anytime')}</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-[#0f2460] mb-6">{t('معلومات التواصل', 'Contact Information')}</h2>
            <div className="space-y-4 mb-8">
              {[
                { icon: <Phone size={20} />, label: t('الهاتف', 'Phone'), value: settings.contactPhone, href: `tel:${settings.contactPhone}` },
                { icon: <MessageCircle size={20} />, label: 'WhatsApp', value: `+${settings.contactWhatsapp}`, href: `https://wa.me/${settings.contactWhatsapp}` },
                { icon: <Mail size={20} />, label: t('البريد الإلكتروني', 'Email'), value: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
                { icon: <MapPin size={20} />, label: t('الموقع', 'Location'), value: t('جمهورية مصر العربية', 'Arab Republic of Egypt'), href: '#' },
              ].map((c, i) => (
                <a key={i} href={c.href} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all group">
                  <div className="w-12 h-12 bg-[#0f2460]/10 rounded-xl flex items-center justify-center text-[#0f2460] group-hover:bg-[#0f2460] group-hover:text-white transition-all">
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">{c.label}</div>
                    <div className="font-semibold text-slate-800" dir="ltr">{c.value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Social Media */}
            <h3 className="font-bold text-[#0f2460] mb-4">{t('تابعنا على', 'Follow us on')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {socials.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className={`${s.color} text-white rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity`}>
                  {s.icon}
                  <span className="font-semibold">{s.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-2xl font-bold text-[#0f2460] mb-6">{t('أرسل رسالة', 'Send a Message')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('الاسم', 'Name')}</label>
                  <input type="text" className="input-field" placeholder={t('اسمك', 'Your name')} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('الهاتف', 'Phone')}</label>
                  <input type="tel" className="input-field" placeholder="01xxxxxxxxx" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('البريد الإلكتروني', 'Email')}</label>
                <input type="email" className="input-field" placeholder="example@email.com" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('الموضوع', 'Subject')}</label>
                <input type="text" className="input-field" placeholder={t('موضوع الرسالة', 'Message subject')} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('الرسالة', 'Message')}</label>
                <textarea className="input-field resize-none" rows={5} placeholder={t('اكتب رسالتك هنا...', 'Write your message here...')} required />
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                <Send size={18} />
                {t('إرسال الرسالة', 'Send Message')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
