import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const fieldCls = (hasError: boolean) =>
  `w-full h-14 px-5 bg-[#1a1a1a] border rounded-xl text-sm text-white placeholder-[#555] focus:outline-none transition-colors ${
    hasError ? 'border-red-500 focus:border-red-500' : 'border-[#2a2a2a] focus:border-[#b8f000]'
  }`;

const Signup: React.FC = () => {
  const { lang } = useLang();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = lang === 'fr' ? 'Email invalide' : 'Invalid email';
    if (password.length < 8)
      errs.password = lang === 'fr' ? '8 caractères minimum' : 'Min 8 characters';
    if (password !== confirmPassword)
      errs.confirmPassword = lang === 'fr' ? 'Mots de passe différents' : 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || (lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.'));
        return;
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
        navigate('/setup/restaurant', { replace: true });
      }
    } catch {
      setGlobalError(lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://app.tablenow.io/auth/callback',
          skipBrowserRedirect: false,
        },
      });
    } catch {
      setGlobalError(lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">TableNow</h1>
          <p className="text-[#888] text-sm">Créer un compte</p>
        </div>

        {globalError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-red-400 text-sm">{globalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#555] mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldCls(!!errors.email)}
              placeholder="name@company.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#555] mb-2 block">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldCls(!!errors.password)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#555] mb-2 block">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldCls(!!errors.confirmPassword)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#b8f000] text-black font-semibold rounded-xl hover:bg-[#a8df00] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Création en cours...' : 'Créer un compte'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2a2a2a]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#0a0a0a] text-[#555]">ou</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full h-14 border border-[#2a2a2a] text-white font-semibold rounded-xl hover:border-[#444] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <p className="text-center text-[#555] text-sm mt-6">
          Vous avez un compte? <Link to="/login" className="text-[#b8f000] hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
