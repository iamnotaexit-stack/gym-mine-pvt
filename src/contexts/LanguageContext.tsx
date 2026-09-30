import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type Language, 
  translations, 
  REGIONAL_METADATA, 
  type RegionalInfo, 
  generateWhatsAppReminder 
} from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  whatsappLanguage: Language;
  setWhatsappLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  regionInfo: RegionalInfo;
  getWhatsAppText: (name: string, date: string, offset: number, overrideLang?: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = 'gym_addict_lang';
const STORAGE_WHATSAPP_LANG_KEY = 'gym_addict_whatsapp_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'as') {
      return saved;
    }
    return 'en';
  });

  const [whatsappLanguage, setWhatsappLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_WHATSAPP_LANG_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'as') {
      return saved;
    }
    return 'as'; // Default to Assamese for local Guwahati touch in reminders!
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    document.documentElement.lang = lang === 'as' ? 'as' : (lang === 'hi' ? 'hi' : 'en');
  };

  const setWhatsappLanguage = (lang: Language) => {
    setWhatsappLanguageState(lang);
    localStorage.setItem(STORAGE_WHATSAPP_LANG_KEY, lang);
  };

  useEffect(() => {
    document.documentElement.lang = language === 'as' ? 'as' : (language === 'hi' ? 'hi' : 'en');
  }, [language]);

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const langDict = translations[language] as Record<string, string>;
    const defaultDict = translations.en as Record<string, string>;
    let text = langDict[key] || defaultDict[key] || key;

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return text;
  };

  const getWhatsAppText = (name: string, date: string, offset: number, overrideLang?: Language): string => {
    const targetLang = overrideLang || whatsappLanguage || language;
    return generateWhatsAppReminder(targetLang, name, date, offset);
  };

  const regionInfo = REGIONAL_METADATA[language] || REGIONAL_METADATA.en;

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      whatsappLanguage,
      setWhatsappLanguage,
      t,
      regionInfo,
      getWhatsAppText
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
