import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { config } from '../config/env';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        // Debug: log the full callback URL and verify code presence
        console.log('🔵 Auth callback received:', {
          url: window.location.href,
          code: code?.slice(0, 20) + '...',
          codeVerifierInStorage: !!window.localStorage.getItem('sb-code-verifier') || !!window.localStorage.getItem('sb-pkce-verifier'),
          allStorageKeys: Object.keys(window.localStorage),
        });

        if (!code) throw new Error('Aucun code OAuth dans l\'URL');

        // SDK reads code_verifier from localStorage automatically and sends it with the code
        console.log('🔵 Exchanging code for session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        console.log('🔵 Exchange response:', {
          error: sessionError?.message,
          errorStatus: (sessionError as any)?.status,
          hasAccessToken: !!sessionData?.session?.access_token,
          accessTokenSlice: sessionData?.session?.access_token?.slice(0, 20) + '...',
        });

        if (sessionError || !sessionData.session?.access_token) {
          console.error('❌ PKCE exchange failed:', sessionError);
          throw new Error(sessionError?.message || 'Échec de l\'échange PKCE');
        }

        const response = await fetch(`${config.apiUrl}/api/auth/google/supabase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: sessionData.session.access_token }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Authentification échouée');

        const rememberMe = sessionStorage.getItem('oauth_remember_me') === 'true';
        if (rememberMe) {
          localStorage.setItem('token', data.token);
          sessionStorage.removeItem('token');
        } else {
          sessionStorage.setItem('token', data.token);
          localStorage.removeItem('token');
        }
        sessionStorage.removeItem('oauth_remember_me');

        if (data.google_profile) {
          sessionStorage.setItem('google_profile', JSON.stringify(data.google_profile));
        }

        await refreshUser();

        if (data.is_new_user) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/r/' + (data.restaurant?.slug || data.restaurant?.id) + '/dashboard', { replace: true });
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentification échouée');
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
