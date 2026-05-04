import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Globe, Check, Sun, Moon } from 'lucide-react';
import { useLang } from '../context/LangContext';

type LangCode = 'fr' | 'en';

const LANGS: { code: LangCode; flag: string; label: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

const PUBLIC_PATHS = ['/login', '/register', '/verify-email', '/reset-password', '/pricing'];

const LanguageToggle: React.FC = () => {
  const { lang, setLang } = useLang();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('tn_theme');
    if (stored === 'light') return false;
    if (stored === 'dark') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('tn_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (!isPublic) return null;

  const current = LANGS.find(l => l.code === lang) ?? LANGS[0];

  return (
    <div className="fixed top-4 right-4 z-[999] flex items-center gap-3">

      {/* Theme toggle — minimal, séparé */}
      <button
        onClick={() => setDark(d => !d)}
        className="text-[#666] hover:text-white transition-colors p-1"
        aria-label="Toggle theme"
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Language selector — style exact screenshot */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <Globe size={18} className="text-white" />
          <span className="text-sm">{current.flag}</span>
          <span className="text-sm font-medium text-white">{current.label}</span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-3 min-w-[160px] bg-[#1c1c1e] rounded-2xl overflow-hidden shadow-2xl z-50 py-1">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors"
                >
                  <span className="text-lg">{l.flag}</span>
                  <span className={`text-sm flex-1 text-left ${lang === l.code ? 'text-[#888]' : 'text-white font-medium'}`}>
                    {l.label}
                  </span>
                  {lang === l.code && (
                    <Check size={14} className="text-[#888]" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LanguageToggle;
