import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
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
        console.log('[AuthCallback] Code:', code ? code.slice(0, 20) + '...' : 'MISSING');
        if (!code) throw new Error('Aucun code OAuth dans l\'URL');

        // Exchange code for session using Supabase SDK PKCE flow
        console.log('[AuthCallback] Exchanging code via Supabase SDK...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session?.access_token) {
          throw new Error(
            error?.message ||
            'Failed to exchange code for session'
          );
        }

        const supabaseAccessToken = data.session.access_token;
        console.log('[AuthCallback] Session exchanged successfully');

        // Call backend to validate/create restaurant using Supabase token
        console.log('[AuthCallback] Calling backend /auth/google/supabase...');
        const response = await authAPI.googleCallback(supabaseAccessToken);
        const backendToken = response.data.access_token || response.data.token;
        console.log('[AuthCallback] Backend response:', response.status);

        if (!backendToken) throw new Error('Pas de token reçu du backend');

        // Store backend JWT for all TableNow API calls
        setAccessToken(backendToken);
        localStorage.setItem('backend_token', backendToken);

        // Supabase session is already persisted by exchangeCodeForSession()
        // No manual setSession() call needed

        await refreshUser();

        // Get next_route from backend (backend-driven routing)
        console.log('[AuthCallback] Fetching next_route from /api/me...');
        const meResponse = await authAPI.getMe();
        const nextRoute = meResponse.data.next_route || '/dashboard';
        console.log('[AuthCallback] Next route resolved:', nextRoute);
        navigate(nextRoute, { replace: true });
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
