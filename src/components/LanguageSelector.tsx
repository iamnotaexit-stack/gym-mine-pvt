import { Globe, MapPin, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../lib/translations';

interface LanguageSelectorProps {
  variant?: 'compact' | 'cards' | 'header' | 'inline';
  className?: string;
  showRegionBadge?: boolean;
}

const LANGUAGES: { code: Language; label: string; nativeName: string; regionNote: string }[] = [
  {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    regionNote: 'Global standard'
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeName: 'हिंदी',
    regionNote: 'National language'
  },
  {
    code: 'as',
    label: 'Assamese',
    nativeName: 'অসমীয়া',
    regionNote: 'গুৱাহাটী, অসম (Local Touch)'
  }
];

export default function LanguageSelector({
  variant = 'compact',
  className = '',
  showRegionBadge = false
}: LanguageSelectorProps) {
  const { language, setLanguage, regionInfo } = useLanguage();

  if (variant === 'cards') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-red-600 bg-red-50/70 shadow-sm ring-2 ring-red-500/20'
                    : 'border-gray-200 hover:border-red-200 hover:bg-gray-50/60 bg-white'
                }`}
              >
                {lang.code === 'as' && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-600 text-white shadow-xs">
                    <Sparkles size={10} /> Local
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{lang.nativeName}</span>
                    {lang.code !== 'en' && (
                      <span className="text-xs text-gray-500 font-medium">({lang.label})</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{lang.regionNote}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className={`font-semibold ${isSelected ? 'text-red-700' : 'text-gray-400'}`}>
                    {isSelected ? '✓ Active' : 'Switch'}
                  </span>
                  {lang.code === 'as' && (
                    <span className="text-[11px] text-red-600 font-medium flex items-center gap-0.5">
                      <MapPin size={11} /> Guwahati
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showRegionBadge && (
          <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-lg flex items-center justify-between gap-3 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-red-600 shrink-0" />
              <span>
                <strong>{regionInfo.city}, {regionInfo.state}</strong> ({regionInfo.district})
              </span>
            </div>
            <span className="font-semibold text-red-700 bg-white px-2 py-0.5 rounded border border-red-200 shrink-0">
              {regionInfo.localGreeting}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`relative flex items-center bg-red-800/40 rounded-lg backdrop-blur-xs overflow-hidden ${className}`}>
        <div className="absolute left-2 pointer-events-none text-red-200">
          <Globe size={14} />
        </div>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="appearance-none bg-transparent text-white font-bold text-xs py-1.5 pl-7 pr-3 outline-none cursor-pointer hover:bg-red-700/50 transition-colors"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code} className="text-gray-900 font-sans">
              {lang.code === 'en' ? 'EN' : (lang.code === 'hi' ? 'HI (हिंदी)' : 'AS (অসমীয়া)')}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Compact or Inline
  return (
    <div className={`inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 ${className}`}>
      <Globe size={14} className="text-gray-500 ml-1 mr-0.5" />
      {LANGUAGES.map((lang) => {
        const isSelected = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {lang.code === 'as' ? 'অসমীয়া' : (lang.code === 'hi' ? 'हिंदी' : 'EN')}
          </button>
        );
      })}
    </div>
  );
}
