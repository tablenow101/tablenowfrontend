import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const [status, setStatus] = useState('Connexion en cours...');

    useEffect(() => {
        const run = async () => {
            try {
                console.log('[Auth] URL:', window.location.href);
                console.log('[Auth] hash:', window.location.hash.slice(0,80));
                console.log('[Auth] search:', window.location.search.slice(0,80));

                const params = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.slice(1));
                const code = params.get('code');
                const accessTokenFromHash = hashParams.get('access_token');
                const errorParam = params.get('error') || hashParams.get('error');

                if (errorParam) {
                    navigate('/login?error=' + errorParam);
                    return;
                }

                // Cas 1 : implicit flow — token dans le hash
                if (accessTokenFromHash) {
                    console.log('[Auth] implicit token found');
                    await finish(accessTokenFromHash);
                    return;
                }

                // Cas 2 : PKCE — code dans query params
                if (code) {
                    console.log('[Auth] PKCE code found, exchanging...');
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    console.log('[Auth] exchange result:', !!data?.session, error?.message);
                    if (data?.session) {
                        await finish(data.session.access_token);
                        return;
                    }
                }

                // Cas 3 : session déjà active
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[Auth] existing session:', !!session);
                if (session) {
                    await finish(session.access_token);
                    return;
                }

                // Cas 4 : attendre onAuthStateChange
                console.log('[Auth] waiting for SIGNED_IN event...');
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    console.log('[Auth] event:', event, !!session);
                    if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                        subscription.unsubscribe();
                        await finish(session.access_token);
                    }
                });

                setTimeout(() => {
                    subscription.unsubscribe();
                    setStatus('Délai dépassé. Redirection...');
                    setTimeout(() => navigate('/login'), 1000);
                }, 10000);

            } catch (e) {
                console.error('[Auth] fatal:', e);
                setStatus('Erreur. Redirection...');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        const finish = async (accessToken: string) => {
            setStatus('Finalisation...');
            console.log('[Auth] finish, token:', accessToken.slice(0, 20));
            const res = await fetch('https://api.tablenow.io/api/auth/google/supabase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: accessToken }),
            });
            console.log('[Auth] backend:', res.status);
            const json = await res.json();
            console.log('[Auth] backend json:', JSON.stringify(json).slice(0,80));
            if (!json.token) throw new Error('No token: ' + JSON.stringify(json));
            await loginWithToken(json.token);
        };

        run();
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-[#b8f000] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#555]">{status}</p>
        </div>
    );
};

export default AuthCallback;
