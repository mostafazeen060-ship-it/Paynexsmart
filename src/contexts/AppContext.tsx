import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  lang: 'ar' | 'en';
  toggleLang: () => void;
  t: (ar: string, en: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  const toggleLang = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (ar: string, en: string) => {
    return lang === 'ar' ? ar : en;
  };

  return (
    <AppContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
