import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  // Guard against StrictMode double-invocation in dev (which would double-exchange the code)
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) throw new Error('Aucun code OAuth dans l\'URL');

        // Use Supabase JS client to perform PKCE exchange — it reads the
        // code_verifier from localStorage (set during signInWithOAuth) and
        // sends the correct headers. Manual fetch bypasses this and fails.
        const { data: sessionData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError || !sessionData.session?.access_token) {
          throw new Error(exchangeError?.message || 'Échec de l\'échange PKCE');
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.tablenow.io';
        const response = await fetch(`${apiUrl}/api/auth/google/supabase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: sessionData.session.access_token }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Authentification échouée');

        localStorage.setItem('token', data.token);
        await refreshUser();

        if (data.is_new_user) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err: unknown) {
        console.error('Auth callback error:', err);
        setError((err instanceof Error ? err.message : String(err)) || 'Authentification échouée');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#080912] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center space-y-3">
            <AlertCircle className="text-red-400" size={36} />
            <p className="text-red-400 font-medium text-sm">{error}</p>
            <p className="text-xs text-[#555]">Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            <p className="text-white font-medium text-sm">Finalisation de la connexion...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
