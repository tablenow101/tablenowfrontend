import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { runPostAuth } from '../lib/postAuth';
import { AlertCircle } from 'lucide-react';

// Landing page for every Supabase redirect: Google OAuth AND email-confirmation
// links. supabase-js processes the URL (detectSessionInUrl) to establish the
// session; we then run the one shared post-auth routine. No provider branching.
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
        // Wait for supabase-js to process the PKCE code / token hash in the URL.
        let session = null;
        for (let attempt = 0; attempt < 10 && !session; attempt++) {
          await new Promise(r => setTimeout(r, 250));
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }
        if (!session?.access_token) throw new Error('No session after redirect');

        // bootstrap → app-state → next_route (single source of routing truth).
        const next = await runPostAuth(refreshUser);
        navigate(next, { replace: true });
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
