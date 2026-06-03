import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const T = {
  fr: {
    title: 'Nouveau mot de passe',
    subtitle: 'Choisissez un nouveau mot de passe pour votre compte.',
    passwordLabel: 'NOUVEAU MOT DE PASSE',
    passwordPlaceholder: '8 caractères minimum',
    submit: 'Mettre à jour',
    success: 'Mot de passe mis à jour ! Redirection vers la connexion…',
    error: 'Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.',
    noSession: 'Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.',
    back: 'Retour à la connexion',
  },
  en: {
    title: 'New password',
    subtitle: 'Choose a new password for your account.',
    passwordLabel: 'NEW PASSWORD',
    passwordPlaceholder: 'At least 8 characters',
    submit: 'Update password',
    success: 'Password updated! Redirecting to sign in…',
    error: 'Could not update the password. The link may have expired.',
    noSession: 'Invalid or expired link. Please request a new reset link.',
    back: 'Back to sign in',
  },
};

// Landing page for the Supabase password-recovery email link. supabase-js
// establishes a recovery session from the URL (detectSessionInUrl); we then call
// updateUser to set the new password.
const ResetPassword: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    // Give supabase-js a moment to parse the recovery token from the URL.
    const check = async () => {
      for (let i = 0; i < 8; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { if (active) setHasSession(true); return; }
        await new Promise(r => setTimeout(r, 250));
      }
      if (active) setHasSession(false);
    };
    check();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      // Force a clean sign-in with the new password.
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6 sm:mb-10 gap-3">
          <span className="text-4xl font-black tracking-tight text-white">
            Table<span className="text-[#b8f000]">Now</span>
          </span>
        </div>

        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-10" style={{ borderTop: '4px solid #b8f000' }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t.title}</h1>
          <p className="text-sm text-[#888] mb-4 sm:mb-6">{t.subtitle}</p>

          {success ? (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <CheckCircle2 size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-green-400">{t.success}</span>
            </div>
          ) : hasSession === false ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{t.noSession}</span>
              </div>
              <Link to="/forgot-password" className="text-sm text-[#b8f000] hover:underline">
                {lang === 'fr' ? 'Demander un nouveau lien' : 'Request a new link'}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-3 sm:mb-5 p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.passwordLabel}</label>
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
                  disabled={loading || hasSession === null}
                  className="w-full h-14 bg-[#b8f000] text-black font-bold rounded-xl text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {(loading || hasSession === null) && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                  {t.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
