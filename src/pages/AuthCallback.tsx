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
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) throw new Error('Aucun code OAuth dans l\'URL');

        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) throw new Error(exchangeError.message);
        if (!data.session?.access_token) throw new Error('Session non créée');

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
