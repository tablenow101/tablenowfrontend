import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const [status, setStatus] = useState('Connexion en cours...');

    useEffect(() => {
        let done = false;

        const finish = async (accessToken: string) => {
            if (done) return;
            done = true;
            setStatus('Finalisation...');
            try {
                console.log('[Auth] calling backend...');
                const res = await fetch('https://api.tablenow.io/api/auth/google/supabase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: accessToken }),
                });
                console.log('[Auth] status:', res.status);
                const json = await res.json();
                console.log('[Auth] json:', JSON.stringify(json).slice(0, 100));
                if (json.token) {
                    await loginWithToken(json.token);
                } else {
                    throw new Error('No token: ' + JSON.stringify(json));
                }
            } catch (e) {
                console.error('[Auth] error:', e);
                setStatus('Erreur. Redirection...');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        // Implicit flow : token dans le hash #access_token=...
        const hash = window.location.hash;
        console.log('[Auth] hash:', hash.slice(0, 50));

        if (hash && hash.includes('access_token')) {
            // Parser le hash manuellement
            const params = new URLSearchParams(hash.slice(1));
            const accessToken = params.get('access_token');
            if (accessToken) {
                console.log('[Auth] token from hash:', accessToken.slice(0, 20));
                finish(accessToken);
                return;
            }
        }

        // Fallback : attendre que Supabase parse le hash via detectSessionInUrl
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[Auth] onAuthStateChange:', event, !!session);
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                subscription.unsubscribe();
                finish(session.access_token);
            }
        });

        // Vérifier si session déjà dispo
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[Auth] getSession:', !!session);
            if (session) finish(session.access_token);
        });

        const t = setTimeout(() => {
            if (!done) {
                subscription.unsubscribe();
                setStatus('Délai dépassé. Redirection...');
                setTimeout(() => navigate('/login'), 1000);
            }
        }, 15000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(t);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-[#b8f000] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#555]">{status}</p>
        </div>
    );
};

export default AuthCallback;
