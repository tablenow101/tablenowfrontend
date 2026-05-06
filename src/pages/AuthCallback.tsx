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
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                const error = params.get('error');

                if (error) {
                    navigate('/login?error=' + error);
                    return;
                }

                if (!code) {
                    // Pas de code — peut-être déjà une session active
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        await finish(session.access_token);
                        return;
                    }
                    navigate('/login');
                    return;
                }

                // Échanger le code PKCE — Supabase lit le code_verifier depuis localStorage
                const { data, error: exchError } = await supabase.auth.exchangeCodeForSession(code);

                if (exchError || !data?.session) {
                    console.error('PKCE exchange error:', exchError);
                    // Fallback : attendre que onAuthStateChange se déclenche
                    await new Promise<void>((resolve, reject) => {
                        const t = setTimeout(() => reject(new Error('timeout')), 8000);
                        const { data: { subscription } } = supabase.auth.onAuthStateChange(
                            async (event, session) => {
                                if (event === 'SIGNED_IN' && session) {
                                    subscription.unsubscribe();
                                    clearTimeout(t);
                                    await finish(session.access_token);
                                    resolve();
                                }
                            }
                        );
                    });
                    return;
                }

                await finish(data.session.access_token);

            } catch (e) {
                console.error('AuthCallback fatal:', e);
                setStatus('Erreur. Redirection...');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        const finish = async (accessToken: string) => {
            setStatus('Finalisation...');
            const res = await fetch('https://api.tablenow.io/api/auth/google/supabase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: accessToken }),
            });
            if (!res.ok) throw new Error('Backend ' + res.status);
            const json = await res.json();
            if (!json.token) throw new Error('No token');
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
