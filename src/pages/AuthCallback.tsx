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
                // PKCE : Supabase échange le code automatiquement via exchangeCodeForSession
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                const errorParam = params.get('error');

                if (errorParam) {
                    setStatus('Erreur Google. Redirection...');
                    setTimeout(() => navigate('/login?error=' + errorParam), 2000);
                    return;
                }

                if (code) {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error || !data.session) {
                        setStatus('Échec de connexion. Redirection...');
                        setTimeout(() => navigate('/login'), 2000);
                        return;
                    }
                    await exchangeWithBackend(data.session.access_token);
                    return;
                }

                // Pas de code — essayer getSession (fallback implicit flow)
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await exchangeWithBackend(session.access_token);
                    return;
                }

                setStatus('Aucune session trouvée. Redirection...');
                setTimeout(() => navigate('/login'), 2000);

            } catch (e) {
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
