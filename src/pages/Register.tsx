import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { runPostAuth } from '../lib/postAuth';
import { resendSignupConfirmation } from '../lib/emailResend';

const T = {
  fr: {
    title: 'Créer votre compte',
    subtitle: 'Essai 7 jours gratuits · Résiliable à tout moment',
    nameLabel: 'NOM DU RESTAURANT',
    namePlaceholder: 'Le Bistrot du Coin',
    emailLabel: 'E-MAIL',
    emailPlaceholder: 'vous@restaurant.fr',
    passwordLabel: 'MOT DE PASSE',
    passwordPlaceholder: '8 caractères minimum',
    submit: 'Créer mon compte',
    or: 'OU',
    google: "S'inscrire avec Google",
    hasAccount: 'Déjà un compte ?',
    signIn: 'Se connecter',
    errorDefault: "La création du compte a échoué.",
    checkEmailTitle: 'Vérifiez votre email',
    checkEmailBody: 'Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte.',
  },
  en: {
    title: 'Create your account',
    subtitle: '7-day free trial · Cancel anytime',
    nameLabel: 'RESTAURANT NAME',
    namePlaceholder: 'The Corner Bistro',
    emailLabel: 'E-MAIL',
    emailPlaceholder: 'you@restaurant.com',
    passwordLabel: 'PASSWORD',
    passwordPlaceholder: 'At least 8 characters',
    submit: 'Create my account',
    or: 'OR',
    google: 'Sign up with Google',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
    errorDefault: 'Account creation failed.',
    checkEmailTitle: 'Check your email',
    checkEmailBody: "We've sent you a confirmation link. Click it to activate your account.",
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

// Sign-up yields a Supabase session in every case. Email/password uses
// supabase.auth.signUp (restaurant name carried in user_metadata.full_name so the
// backend names the restaurant correctly). If email confirmation is enabled the
// session arrives only after the user clicks the link → /auth/callback finishes the
// link/create. Otherwise we link + route immediately. Google uses signInWithOAuth.
const Register: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        // Email confirmation disabled: we already have a session. Bootstrap the
        // restaurant and follow the backend's next_route.
        const next = await runPostAuth(refreshUser);
        navigate(next, { replace: true });
      } else {
        // Email confirmation enabled: finish on /auth/callback after the user clicks.
        setCheckEmail(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async (): Promise<void> => {
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'OAuth failed');
    }
  };

  const handleResendEmail = async (): Promise<void> => {
    setResendError('');
    setResendLoading(true);
    try {
      await resendSignupConfirmation(email);
      // Success — just confirm it was sent
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResendError(msg || t.errorDefault);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg">
        {/* Logo + tagline */}
        <div className="flex flex-col items-center mb-6 sm:mb-10 gap-3">
          <span className="text-4xl font-black tracking-tight text-white">
            Table<span className="text-[#b8f000]">Now</span>
          </span>
          <span className="text-sm text-[#555] tracking-wide">
            Your Restaurant Host(ess) 24/7
          </span>
        </div>

        <div
          className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-10"
          style={{ borderTop: '4px solid #b8f000' }}
        >
          {checkEmail ? (
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle2 size={40} className="text-[#b8f000]" />
              <div>
                <h1 className="text-2xl font-bold text-white">{t.checkEmailTitle}</h1>
                <p className="text-sm text-[#888] mt-1">{t.checkEmailBody}</p>
              </div>

              {/* Display the email address */}
              <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg w-full">
                <p className="text-xs text-[#555] uppercase tracking-wide mb-1">E-mail</p>
                <p className="text-sm text-white font-medium break-all">{email}</p>
              </div>

              {/* Check spam notice */}
              <p className="text-xs text-[#555]">
                {lang === 'fr'
                  ? 'Vérifiez vos spams si vous ne recevez pas le lien'
                  : "Check your spam folder if you don't receive the link"}
              </p>

              {/* Resend error */}
              {resendError && (
                <div className="mb-3 p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400 w-full">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{resendError}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3 w-full pt-2">
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="w-full h-12 bg-[#b8f000] text-black font-bold rounded-xl text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {resendLoading && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                  {lang === 'fr' ? 'Renvoyer le lien' : 'Resend link'}
                </button>
                <Link
                  to="/login"
                  className="w-full h-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white flex items-center justify-center hover:border-[#444] transition-colors"
                >
                  {lang === 'fr' ? 'Retour à la connexion' : 'Back to sign in'}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{t.title}</h1>
              <p className="text-sm text-[#888] mb-4 sm:mb-6">{t.subtitle}</p>

              {error && (
                <div className="mb-3 sm:mb-5 p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    required
                    className="w-full h-14 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#b8f000] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
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
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    required
                    minLength={8}
                    className="w-full h-14 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#b8f000] transition-colors"
                  />
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

              <div className="flex items-center gap-3 my-4 sm:my-6">
                <div className="flex-1 h-px bg-[#2a2a2a]" />
                <span className="text-xs text-[#555]">{t.or}</span>
                <div className="flex-1 h-px bg-[#2a2a2a]" />
              </div>

              <button
                type="button"
                onClick={signUpWithGoogle}
                className="w-full h-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white flex items-center justify-center gap-3 hover:border-[#444] transition-colors"
              >
                <GoogleIcon />
                {t.google}
              </button>

              <p className="text-center text-sm text-[#555] mt-6">
                {t.hasAccount}{' '}
                <Link to="/login" className="text-[#b8f000] hover:underline font-medium">
                  {t.signIn}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
