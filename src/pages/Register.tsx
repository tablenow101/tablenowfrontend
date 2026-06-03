import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

// Sign-up is Google-OAuth only. The Supabase OAuth redirect lands on
// /auth/callback, which auto-creates the restaurant from the Google profile
// and routes via app-state.
const Register: React.FC = () => {
  const { lang } = useLang();
  const [error, setError] = useState('');

  const signUpWithGoogle = async (): Promise<void> => {
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'OAuth failed');
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
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {lang === 'fr' ? 'Créer votre compte' : 'Create your account'}
          </h1>
          <p className="text-sm text-[#888] mb-4 sm:mb-6">
            {lang === 'fr'
              ? 'Essai 7 jours gratuits · Résiliable à tout moment'
              : '7-day free trial · Cancel anytime'}
          </p>

          {error && (
            <div className="mb-3 sm:mb-5 p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={signUpWithGoogle}
            className="w-full h-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white flex items-center justify-center gap-3 hover:border-[#444] transition-colors"
          >
            <GoogleIcon />
            {lang === 'fr' ? "S'inscrire avec Google" : 'Sign up with Google'}
          </button>

          <p className="text-center text-sm text-[#555] mt-6">
            {lang === 'fr' ? 'Déjà un compte ? ' : 'Already have an account? '}
            <Link to="/login" className="text-[#b8f000] hover:underline font-medium">
              {lang === 'fr' ? 'Se connecter' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
