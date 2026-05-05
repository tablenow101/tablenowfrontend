import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

const T = {
  fr: {
    title: 'Connexion',
    subtitle: 'Accédez à votre espace TableNow',
    emailLabel: 'E-MAIL',
    emailPlaceholder: 'vous@restaurant.fr',
    passwordLabel: 'MOT DE PASSE',
    passwordPlaceholder: '••••••••',
    forgotLink: 'Mot de passe oublié ?',
    submit: 'Se connecter',
    or: 'OU',
    google: 'Continuer avec Google',
    noAccount: 'Pas encore de compte ?',
    createAccount: 'Créer votre compte',
    errorDefault: 'Identifiants incorrects.',
    forgotTitle: 'Mot de passe oublié',
    forgotSubtitle: 'Entrez votre email, nous vous envoyons un lien de réinitialisation.',
    forgotSubmit: 'Envoyer le lien',
    forgotSuccess: 'Email envoyé ! Vérifiez votre boîte mail.',
    forgotError: 'Une erreur est survenue. Réessayez.',
    back: 'Retour',
  },
  en: {
    title: 'Sign in',
    subtitle: 'Access your TableNow dashboard',
    emailLabel: 'E-MAIL',
    emailPlaceholder: 'you@restaurant.com',
    passwordLabel: 'PASSWORD',
    passwordPlaceholder: '••••••••',
    forgotLink: 'Forgot password?',
    submit: 'Sign in',
    or: 'OR',
    google: 'Continue with Google',
    noAccount: 'No account yet?',
    createAccount: 'Create your account',
    errorDefault: 'Incorrect credentials.',
    forgotTitle: 'Forgot password',
    forgotSubtitle: "Enter your email, we'll send you a reset link.",
    forgotSubmit: 'Send reset link',
    forgotSuccess: 'Email sent! Check your inbox.',
    forgotError: 'Something went wrong. Please try again.',
    back: 'Back',
  },
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2045c0-.638-.0573-1.252-.164-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087C16.6564 13.8209 17.64 11.6136 17.64 9.2045z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.806.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5836-5.036-3.7109H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1023-1.17.2827-1.71V4.9582H.9573C.3477 6.1732 0 7.548 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}

const Login: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const [view, setView]                   = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError]     = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || t.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess(true);
    } catch {
      setForgotError(t.forgotError);
    } finally {
      setForgotLoading(false);
    }
  };

  const goToForgot = () => { setView('forgot'); setForgotSuccess(false); setForgotError(''); setForgotEmail(''); };
  const goToLogin  = () => { setView('login'); setForgotSuccess(false); setForgotError(''); };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Logo + tagline */}
        <div className="flex flex-col items-center mb-10 gap-3">
          <img src="/logo.png" alt="TableNow" className="h-10 w-auto" />
          <span className="text-sm text-[#555] tracking-wide">
            Your Restaurant Host(ess) 24/7
          </span>
        </div>

        <div
          className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-10"
          style={{ borderTop: '4px solid #b8f000' }}
        >
          {view === 'forgot' ? (
            <>
              <button
                onClick={goToLogin}
                className="flex items-center gap-1.5 text-sm text-[#888] hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft size={14} />
                {t.back}
              </button>

              <h1 className="text-3xl font-bold text-white mb-1">{t.forgotTitle}</h1>
              <p className="text-sm text-[#888] mb-6">{t.forgotSubtitle}</p>

              {forgotSuccess ? (
                <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <CheckCircle2 size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-green-400">{t.forgotSuccess}</span>
                </div>
              ) : (
                <>
                  {forgotError && (
                    <div className="mb-5 p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{forgotError}</span>
                    </div>
                  )}
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                        {t.emailLabel}
                      </label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        required
                        className="w-full h-14 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#b8f000] transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full h-14 bg-[#b8f000] text-black font-bold rounded-xl text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {forgotLoading && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                      {t.forgotSubmit}
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-1">{t.title}</h1>
              <p className="text-sm text-[#888] mb-6">{t.subtitle}</p>

              {error && (
                <div className="mb-5 p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    className="w-full h-14 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#b8f000] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                    {t.passwordLabel}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    required
                    className="w-full h-14 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#b8f000] transition-colors"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        rememberMe
                          ? 'bg-[#b8f000] border-[#b8f000]'
                          : 'bg-transparent border-[#555] hover:border-[#888]'
                      }`}
                    >
                      {rememberMe && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4.5L3.8 7.5L10 1" stroke="black" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <span className="text-sm text-[#888]">
                      {lang === 'fr' ? 'Se souvenir de moi' : 'Remember me'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={goToForgot}
                    className="text-sm text-[#b8f000] hover:underline cursor-pointer"
                  >
                    {t.forgotLink}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#b8f000] text-black font-bold rounded-xl text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                  {t.submit}
                </button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#2a2a2a]" />
                <span className="text-xs text-[#555]">{t.or}</span>
                <div className="flex-1 h-px bg-[#2a2a2a]" />
              </div>

              <button className="w-full h-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white flex items-center justify-center gap-3 hover:border-[#444] transition-colors">
                <GoogleIcon />
                {t.google}
              </button>

              <p className="mt-6 text-center text-sm text-[#555]">
                {t.noAccount}{' '}
                <Link to="/register" className="text-[#b8f000] hover:underline">
                  {t.createAccount}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
