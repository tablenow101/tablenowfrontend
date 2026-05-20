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

        // Get PKCE code verifier from localStorage (saved during OAuth initiation)
        const codeVerifier = localStorage.getItem('supabase.pkce.code_verifier');
        console.log('[AuthCallback] Code verifier stored:', !!codeVerifier);

        if (!codeVerifier) {
          throw new Error('PKCE code verifier not found - try restarting login');
        }

        // Exchange code for session directly via Supabase token endpoint
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        console.log('[AuthCallback] Exchanging code for session via:',
          `${supabaseUrl}/auth/v1/token`);

        const tokenResponse = await fetch(
          `${supabaseUrl}/auth/v1/token?grant_type=authorization_code`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
            },
            body: JSON.stringify({
              code,
              code_verifier: codeVerifier,
              grant_type: 'authorization_code',
            }),
          }
        );

        console.log('[AuthCallback] Token response status:', tokenResponse.status);
        const tokenData = await tokenResponse.json();
        console.log('[AuthCallback] Token data:', tokenData.access_token ? 'success' : 'error');

        if (!tokenResponse.ok || !tokenData.access_token) {
          throw new Error(
            tokenData.error_description ||
            tokenData.error ||
            'Token exchange failed'
          );
        }

        // Call backend to validate/create restaurant
        console.log('[AuthCallback] Calling backend /auth/google/supabase...');
        const response = await authAPI.googleCallback(tokenData.access_token);
        const token = response.data.access_token || response.data.token;
        console.log('[AuthCallback] Backend response:', response.status);

        if (!token) throw new Error('Pas de token reçu du backend');

        setAccessToken(token);
        localStorage.setItem('backend_token', token);

        // Persist Supabase session in SDK before refreshUser() calls getSession()
        // This ensures refreshUser() finds a valid session and doesn't overwrite our backend token
        await supabase.auth.setSession({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || '',
        });

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
