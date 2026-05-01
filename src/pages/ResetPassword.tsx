import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';

const T = {
  fr: {
    title: 'Nouveau mot de passe',
    subtitle: 'Choisissez un nouveau mot de passe pour votre compte.',
    newPassword: 'NOUVEAU MOT DE PASSE',
    confirmPassword: 'CONFIRMER LE MOT DE PASSE',
    placeholder: '••••••••',
    submit: 'Réinitialiser le mot de passe',
    success: 'Mot de passe mis à jour ! Redirection...',
    errorMismatch: 'Les mots de passe ne correspondent pas.',
    errorShort: 'Le mot de passe doit contenir au moins 8 caractères.',
    errorInvalid: 'Lien invalide ou expiré.',
    backToLogin: 'Retour à la connexion',
  },
  en: {
    title: 'New password',
    subtitle: 'Choose a new password for your account.',
    newPassword: 'NEW PASSWORD',
    confirmPassword: 'CONFIRM PASSWORD',
    placeholder: '••••••••',
    submit: 'Reset password',
    success: 'Password updated! Redirecting...',
    errorMismatch: "Passwords don't match.",
    errorShort: 'Password must be at least 8 characters.',
    errorInvalid: 'Invalid or expired link.',
    backToLogin: 'Back to login',
  },
};

const ResetPassword: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError(t.errorShort); return; }
    if (password !== confirm) { setError(t.errorMismatch); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch {
      setError(t.errorInvalid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <span className="text-3xl font-bold tracking-tight text-white">
            Table<span className="text-[#b8f000]">Now</span>
          </span>
        </div>

        <div
          className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-10"
          style={{ borderTop: '4px solid #b8f000' }}
        >
          {success ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle2 size={48} className="text-green-400" />
              <p className="text-white font-medium text-center">{t.success}</p>
            </div>
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
                    {t.newPassword}
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t.placeholder}
                      required
                      className="w-full h-14 px-4 pr-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#b8f000] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                    {t.confirmPassword}
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder={t.placeholder}
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

              <p className="mt-6 text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-[#b8f000] hover:underline"
                >
                  {t.backToLogin}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
