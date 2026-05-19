import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Manual PKCE exchange via fetch, bypassing SDK
async function exchangePKCEManually(code: string) {
  // Find code_verifier from localStorage (Supabase stores it with project-prefixed key)
  let codeVerifier: string | null = null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('code-verifier')) {
      codeVerifier = localStorage.getItem(key);
      break;
    }
  }

  if (!codeVerifier) {
    throw new Error('PKCE code_verifier not found in localStorage');
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'PKCE exchange failed');
  }
  return data;
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) throw new Error('Aucun code OAuth dans l\'URL');

        // Try SDK first
        let session = null;
        try {
          const { data, error: sdkError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (!sdkError && data.session?.access_token) {
            session = data.session;
          } else if (sdkError) {
            throw new Error(sdkError.message);
          }
        } catch (sdkErr) {
          console.warn('SDK exchange failed, trying manual fetch:', sdkErr);
          // Fallback: manual PKCE exchange
          const tokenData = await exchangePKCEManually(code);
          // Set session in SDK so AuthProvider picks it up
          await supabase.auth.setSession({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
          });
          session = tokenData;
        }

        if (!session) throw new Error('Session non créée');

        navigate('/dashboard', { replace: true });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Auth callback error:', errorMsg);
        setError(errorMsg);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#080912] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center space-y-3">
            <AlertCircle className="text-red-400" size={36} />
            <p className="text-red-400 font-medium text-sm">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-2 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20"
            >
              Retour au login
            </button>
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
