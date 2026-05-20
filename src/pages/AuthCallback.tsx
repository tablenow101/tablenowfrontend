import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getPostAuthRedirect } from '../lib/postAuthRedirect';
import { setAccessToken } from '../lib/authToken';
import { authAPI } from '../lib/api';
import { AlertCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        console.log('[AuthCallback] Code in URL:', code ? code.slice(0, 20) + '...' : 'MISSING');
        if (!code) throw new Error('Aucun code OAuth dans l\'URL');

        // Wait briefly for Supabase SDK to detect and exchange the code
        console.log('[AuthCallback] Waiting for PKCE exchange...');
        await new Promise(r => setTimeout(r, 500));

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthCallback] Session check:', {
          hasSession: !!sessionData.session,
          hasToken: !!sessionData.session?.access_token,
          email: sessionData.session?.user?.email,
          error: sessionError?.message
        });

        if (!sessionData.session?.access_token) {
          throw new Error('PKCE exchange failed - no access token');
        }

        // Send token to backend for restaurant lookup/creation
        console.log('[AuthCallback] Calling backend /auth/google/supabase...');
        const response = await authAPI.googleCallback(sessionData.session.access_token);
        const token = response.data.access_token || response.data.token;

        if (!token) throw new Error('Pas de token reçu du backend');

        setAccessToken(token);
        localStorage.setItem('backend_token', token);
        await refreshUser();

        navigate(getPostAuthRedirect(response.data.restaurant || null), { replace: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[AuthCallback] Error:', msg);
        setError(msg || 'Authentification échouée');
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
