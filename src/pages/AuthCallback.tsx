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
                // Vérifier d'abord les query params (PKCE)
                const params = new URLSearchParams(window.location.search);
                const errorParam = params.get('error');
                if (errorParam) {
                    setStatus('Erreur. Redirection...');
                    setTimeout(() => navigate('/login'), 2000);
                    return;
                }

                // Implicit flow : token dans le hash
                // PKCE : code dans les query params
                // Dans les deux cas, getSession() fonctionne après que Supabase ait parsé l'URL
                let attempts = 0;
                const tryGetSession = async (): Promise<void> => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        await exchangeWithBackend(session.access_token);
                        return;
                    }
                    if (attempts < 10) {
                        attempts++;
                        await new Promise(r => setTimeout(r, 300));
                        return tryGetSession();
                    }
                    setStatus('Session introuvable. Redirection...');
                    setTimeout(() => navigate('/login'), 2000);
                };

                await tryGetSession();

            } catch {
                setStatus('Erreur inattendue. Redirection...');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        const exchangeWithBackend = async (accessToken: string) => {
            setStatus('Finalisation...');
            const res = await fetch('https://api.tablenow.io/api/auth/google/supabase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: accessToken }),
            });
            if (!res.ok) throw new Error('Backend error');
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
