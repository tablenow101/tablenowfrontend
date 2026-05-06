import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        const handle = async () => {
            try {
                // Avec PKCE, Supabase échange le code automatiquement
                // On écoute le changement d'état auth
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        subscription.unsubscribe();
                        await exchangeToken(session.access_token);
                    } else if (event === 'SIGNED_OUT') {
                        subscription.unsubscribe();
                        setError('Connexion annulée. Redirection...');
                        setTimeout(() => navigate('/login'), 2000);
                    }
                });

                // Timeout si rien ne se passe après 8 secondes
                setTimeout(() => {
                    subscription.unsubscribe();
                    if (!error) {
                        setError('Délai dépassé. Redirection...');
                        setTimeout(() => navigate('/login'), 2000);
                    }
                }, 8000);

            } catch {
                setError('Erreur inattendue. Redirection...');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        const exchangeToken = async (accessToken: string) => {
            try {
                const res = await fetch('https://api.tablenow.io/api/auth/google/supabase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: accessToken }),
                });
                if (!res.ok) throw new Error('Backend exchange failed');
                const json = await res.json();
                if (json.token) {
                    await loginWithToken(json.token);
                } else {
                    throw new Error('No token');
                }
            } catch {
                setError('Connexion impossible. Redirection...');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handle();
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
            {error ? (
                <p className="text-red-400 text-sm">{error}</p>
            ) : (
                <>
                    <div className="w-8 h-8 border-2 border-[#b8f000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[#555]">Connexion en cours...</p>
                </>
            )}
        </div>
    );
};

export default AuthCallback;
