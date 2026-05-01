import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Globe, Check } from 'lucide-react';
import { useLang } from '../context/LangContext';

type LangCode = 'fr' | 'en';

const LANGS: { code: LangCode; flag: string; label: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

const LanguageToggle: React.FC = () => {
  const { lang, setLang } = useLang();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  if (pathname !== '/login' && pathname !== '/register') return null;

  const current = LANGS.find(l => l.code === lang) ?? LANGS[0];

  return (
    <div className="fixed top-3 right-6 z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-[#2a2a2a] rounded-full text-sm text-[#888] hover:text-white hover:border-[#444] transition-colors"
      >
        <Globe size={14} />
        <span>{current.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="text-base">{l.flag}</span>
              <span className={lang === l.code ? 'text-white' : 'text-[#888]'}>{l.label}</span>
              {lang === l.code && <Check size={12} className="ml-auto text-[#b8f000]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;
