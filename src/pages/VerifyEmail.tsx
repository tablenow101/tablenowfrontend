import React
import { useLang } from '../context/LangContext';, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api';

type Status = 'loading' | 'success' | 'error';

const LIME = '#b8f000';


// ─── Theme + Lang toggle bar ──────────────────────────────────────────────────
function TopBar({ lang, setLang }: { lang: string; setLang: (l: 'fr'|'en') => void }) {
  const [dark, setDark] = React.useState(() => localStorage.getItem('theme') !== 'light');
  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('light', !next);
  };
  return (
    <div style={{ position: 'fixed', top: 12, right: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 100 }}>
      <button onClick={() => setLang('fr')} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', background: lang === 'fr' ? '#b8f000' : 'transparent', color: lang === 'fr' ? '#000' : '#555' }}>FR</button>
      <button onClick={() => setLang('en')} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', background: lang === 'en' ? '#b8f000' : 'transparent', color: lang === 'en' ? '#000' : '#555' }}>EN</button>
      <button onClick={toggle} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', fontSize: 16 }}>{dark ? '☀️' : '🌙'}</button>
    </div>
  );
}

const VerifyEmail: React.FC = () => {
    const { lang, setLang } = useLang();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Lien de vérification invalide.');
            return;
        }
        authAPI.verifyEmail(token)
            .then(res => {
                setStatus('success');
                setMessage(res.data.message || 'Email vérifié !');
                setTimeout(() => navigate('/login'), 3000);
            })
            .catch(err => {
                setStatus('error');
                setMessage(err.response?.data?.error || 'La vérification a échoué. Le lien est peut-être expiré.');
            });
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Table<span style={{ color: LIME }}>Now</span>
                    </h1>
                </div>

                <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-10 text-center">

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        {status === 'loading' && (
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${LIME}15`, border: `2px solid ${LIME}` }}>
                                <div className="w-6 h-6 border-2 border-white/20 rounded-full animate-spin" style={{ borderTopColor: LIME }} />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: `${LIME}15`, border: `2px solid ${LIME}` }}>
                                ✓
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-red-500/10 border-2 border-red-500/40">
                                ✕
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white mb-3">
                        {status === 'loading' && 'Vérification en cours…'}
                        {status === 'success' && 'Email vérifié !'}
                        {status === 'error'   && 'Vérification échouée'}
                    </h2>

                    {/* Message */}
                    <p className="text-sm text-[#888] mb-6 leading-relaxed">
                        {status === 'loading' && 'Nous activons votre compte, votre assistant IA est en cours de configuration.'}
                        {status === 'success' && 'Votre assistant IA est actif. Vous allez être redirigé vers la connexion dans quelques secondes.'}
                        {status === 'error'   && message}
                    </p>

                    {/* Success checklist */}
                    {status === 'success' && (
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 text-left mb-6 space-y-3">
                            {[
                                'Votre assistant IA est configuré',
                                'Une ligne téléphonique dédiée vous est attribuée',
                                'Votre adresse BCC est prête',
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-black" style={{ background: LIME }}>✓</div>
                                    <span className="text-sm text-[#888]">{item}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA */}
                    {status === 'success' && (
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 rounded-xl text-sm font-bold text-black"
                            style={{ background: LIME }}
                        >
                            Accéder à mon espace →
                        </button>
                    )}
                    {status === 'error' && (
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222] transition-colors"
                        >
                            Retour à la connexion
                        </button>
                    )}
                </div>

                {status === 'error' && (
                    <p className="text-center text-sm text-[#555] mt-4">
                        Besoin d'aide ? <span className="text-[#888] cursor-pointer hover:underline">Contactez le support</span>
                    </p>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
