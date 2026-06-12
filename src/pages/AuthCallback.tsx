import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { runPostAuth } from '../lib/postAuth';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';

// Landing page for every Supabase redirect: Google OAuth AND email-confirmation
// links. supabase-js processes the URL (detectSessionInUrl) to establish the
// session; we then run the one shared post-auth routine. No provider branching.
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'waiting' | 'verifying' | 'confirmed' | 'redirecting' | 'error'>('waiting');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const handleCallback = async () => {
      try {
        // Wait for supabase-js to process the PKCE code / token hash in the URL.
        setStatus('verifying');
        let session = null;
        for (let attempt = 0; attempt < 10 && !session; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 250));
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }
        if (!session?.access_token) {
          // No session after the redirect means the link is invalid, expired, or
          // already consumed. This is the common, explicit email-link failure.
          setStatus('error');
          setError('Lien de confirmation invalide ou expiré. Recommencez l\'inscription.');
          return;
        }

        // Session established (email confirmed OR Google OAuth succeeded). Show the
        // confirmation screen while bootstrap + app-state run; it stays visible
        // because we do not overwrite the status until navigation.
        setStatus('confirmed');

        // bootstrap → app-state → next_route (single source of routing truth).
        const next = await runPostAuth(refreshUser);

        setStatus('redirecting');
        navigate(next, { replace: true });
      } catch (err: unknown) {
        // A session existed but bootstrap / app-state failed (backend error). We do
        // not guess at Supabase message strings here — log the real error for
        // debugging and show a single generic message to the user.
        setStatus('error');
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[AuthCallback] post-session error:', msg);
        setError('Initialisation du compte impossible. Réessayez ou contactez le support.');
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {status === 'error' ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-red-500/10">
                <AlertCircle className="text-red-400" size={40} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Link
                to="/register"
                className="w-full h-12 bg-[#b8f000] text-black font-bold rounded-xl text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                Recommencer l&apos;inscription
              </Link>
              <Link
                to="/login"
                className="w-full h-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white flex items-center justify-center hover:border-[#444] transition-colors"
              >
                Aller à la connexion
              </Link>
            </div>
          </div>
        ) : status === 'confirmed' ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-[#b8f000]/10">
                <CheckCircle2 className="text-[#b8f000]" size={40} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Email confirmé !</h1>
              <p className="text-sm text-[#888]">Liaison du compte en cours...</p>
            </div>
            <div className="flex justify-center pt-4">
              <Loader className="animate-spin text-white" size={24} />
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {status === 'verifying' ? 'Vérification d\'email en cours...' : 'Finalisation de la connexion...'}
              </h1>
              <p className="text-sm text-[#888]">Un instant, veuillez patienter.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
