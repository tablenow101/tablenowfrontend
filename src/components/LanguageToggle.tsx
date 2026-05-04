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
    return true;
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
    <div className="fixed top-6 right-6 z-[999] flex items-center gap-6">

      {/* Theme toggle — minimaliste, même style que la langue */}
      <button
        onClick={() => setDark(d => !d)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-label="Toggle theme"
      >
        {dark ? <Sun size={18} className="text-white" /> : <Moon size={18} className="text-[#111]" />}
        <span className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#111]'}`}>
          {dark ? (lang === 'fr' ? 'Sombre' : 'Dark') : (lang === 'fr' ? 'Clair' : 'Light')}
        </span>
      </button>

      {/* Language selector — globe + drapeau + label */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Globe size={18} className={dark ? 'text-white' : 'text-[#111]'} />
          <span className="text-base">{current.flag}</span>
          <span className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#111]'}`}>
            {current.label}
          </span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 mt-3 min-w-[160px] rounded-2xl overflow-hidden shadow-2xl z-50 py-1"
              style={{ background: dark ? '#1c1c1e' : '#ffffff', border: dark ? 'none' : '1px solid #e5e5e5' }}
            >
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? '#2a2a2a' : '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="text-lg">{l.flag}</span>
                  <span className="text-sm flex-1 text-left" style={{
                    color: lang === l.code ? (dark ? '#888' : '#999') : (dark ? '#fff' : '#111'),
                    fontWeight: lang === l.code ? 400 : 500,
                  }}>
                    {l.label}
                  </span>
                  {lang === l.code && <Check size={14} style={{ color: dark ? '#888' : '#999' }} />}
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
