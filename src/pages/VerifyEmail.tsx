import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { useLang } from '../context/LangContext';
import { Loader } from 'lucide-react';

type Status = 'waiting' | 'loading' | 'success' | 'error';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<Status>('waiting');
    const [email, setEmail]   = useState('');
    const navigate            = useNavigate();
    const { t, lang, setLang } = useLang();

    useEffect(() => {
        const token      = searchParams.get('token');
        const emailParam = searchParams.get('email');
        if (emailParam) setEmail(decodeURIComponent(emailParam));
        if (token) verifyEmail(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const verifyEmail = async (token: string) => {
        setStatus('loading');
        try {
            await authAPI.verifyEmail(token);
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch {
            setStatus('error');
        }
    };

    const handleCTA = () => {
        const token = searchParams.get('token');
        if (token) verifyEmail(token);
        else navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">

            {/* Lang toggle — top right */}
            <div className="absolute top-5 right-6 flex items-center gap-1">
                <button onClick={() => setLang('fr')} className="text-xs font-bold px-2 py-1 rounded" style={lang==='fr'?{background:'#b8f000',color:'#000'}:{color:'#555'}}>FR</button>
                <button onClick={() => setLang('en')} className="text-xs font-bold px-2 py-1 rounded" style={lang==='en'?{background:'#b8f000',color:'#000'}:{color:'#555'}}>EN</button>
            </div>

            <div className="w-full max-w-[480px]">
                <div className="text-center mb-9">
                    <Link to="/" className="inline-block text-[36px] font-bold tracking-tight text-white">
                        Table<span style={{ color: '#b8f000' }}>Now</span>
                    </Link>
                    <p className="text-sm text-[#555] mt-2">{t('tagline')}</p>
                </div>

                <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-9 text-center">

                    {/* LOADING */}
                    {status === 'loading' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-5">
                                <Loader size={28} className="text-[#888] animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Vérification en cours…</h2>
                            <p className="text-sm text-[#888]">Ne fermez pas cette fenêtre.</p>
                        </>
                    )}

                    {/* SUCCESS */}
                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold" style={{ background:'rgba(184,240,0,.12)', border:'2px solid #b8f000', color:'#b8f000' }}>✓</div>
                            <h2 className="text-xl font-bold text-white mb-2">Email vérifié !</h2>
                            <p className="text-sm text-[#888] mb-1">Votre assistant IA est en cours de configuration.</p>
                            <p className="text-xs text-[#555]">Redirection vers la connexion…</p>
                        </>
                    )}

                    {/* ERROR */}
                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold" style={{ background:'rgba(239,68,68,.1)', border:'2px solid rgba(239,68,68,.4)', color:'#ef4444' }}>✕</div>
                            <h2 className="text-xl font-bold text-white mb-2">Lien invalide ou expiré</h2>
                            <p className="text-sm text-[#888] mb-6">Demandez un nouvel email de vérification.</p>
                            <Link to="/login" className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background:'#b8f000' }}>
                                Retour à la connexion
                            </Link>
                        </>
                    )}

                    {/* WAITING */}
                    {status === 'waiting' && (
                        <>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl" style={{ background:'rgba(184,240,0,.08)', border:'2px solid rgba(184,240,0,.3)' }}>✉️</div>
                            <h2 className="text-xl font-bold text-white mb-2">{t('verifyTitle')}</h2>
                            <p className="text-sm text-[#888] mb-1 leading-relaxed">
                                {t('verifySent')}{email && <> <span className="text-white font-medium">{email}</span></>}
                            </p>
                            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 text-left mt-5 mb-6">
                                <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-3">{t('onceActive')}</p>
                                {[t('verifyBullet1'), t('verifyBullet2'), t('verifyBullet3')].map((bullet, i) => (
                                    <div key={i} className="flex items-start gap-3 mb-2.5 last:mb-0">
                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background:'#b8f000' }} />
                                        <span className="text-sm text-[#888] leading-relaxed">{bullet}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleCTA} className="w-full py-3 rounded-xl text-sm font-bold text-black mb-4" style={{ background:'#b8f000' }}>
                                {t('verifyBtn')}
                            </button>
                            <p className="text-xs text-[#555]">
                                {t('notReceived')}{' '}
                                <button className="text-[#b8f000] hover:opacity-70" onClick={() => window.location.reload()}>
                                    {t('resend')}
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
