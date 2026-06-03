import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const T = {
  fr: {
    title: 'Mot de passe oublié',
    subtitle: 'Entrez votre email, nous vous envoyons un lien de réinitialisation.',
    emailLabel: 'E-MAIL',
    emailPlaceholder: 'vous@restaurant.fr',
    submit: 'Envoyer le lien',
    success: 'Email envoyé ! Vérifiez votre boîte mail.',
    error: 'Une erreur est survenue. Réessayez.',
    back: 'Retour à la connexion',
  },
  en: {
    title: 'Forgot password',
    subtitle: "Enter your email, we'll send you a reset link.",
    emailLabel: 'E-MAIL',
    emailPlaceholder: 'you@restaurant.com',
    submit: 'Send reset link',
    success: 'Email sent! Check your inbox.',
    error: 'Something went wrong. Please try again.',
    back: 'Back to sign in',
  },
};

// Password reset is delegated entirely to Supabase Auth. The email link points to
// /reset-password, where the user sets a new password.
const ForgotPassword: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSuccess(true);
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
          <Link to="/login" className="flex items-center gap-1.5 text-sm text-[#888] hover:text-white mb-4 sm:mb-6 transition-colors">
            <ArrowLeft size={14} />
            {t.back}
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t.title}</h1>
          <p className="text-sm text-[#888] mb-4 sm:mb-6">{t.subtitle}</p>

          {success ? (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <CheckCircle2 size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-green-400">{t.success}</span>
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
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.emailLabel}</label>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#b8f000] text-black font-bold rounded-xl text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
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

export default ForgotPassword;
