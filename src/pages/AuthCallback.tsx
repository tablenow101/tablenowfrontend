import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const handleCallback = async () => {
      try {
        console.log('=== AuthCallback START ===');
        console.log('URL:', window.location.href);

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        console.log('Code from URL:', code);

        if (!code) throw new Error('Aucun code OAuth dans l\'URL');

        console.log('Calling exchangeCodeForSession...');
        const startTime = Date.now();

        const { data: sessionData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        const elapsed = Date.now() - startTime;
        console.log(`exchangeCodeForSession returned after ${elapsed}ms`);
        console.log('Session data:', sessionData);
        console.log('Exchange error:', exchangeError);

        if (exchangeError || !sessionData.session?.access_token) {
          throw new Error(exchangeError?.message || 'Échec de l\'échange PKCE');
        }

        console.log('Exchange SUCCESS, navigating to /dashboard');
        navigate('/dashboard', { replace: true });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Auth callback error:', errorMsg);
        console.error('Full error:', err);
        setError(errorMsg || 'Authentification échouée');
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
            <p className="text-xs text-[#555]">Redirection vers la page de connexion dans 3s...</p>
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
