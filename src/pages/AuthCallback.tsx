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
                // Supabase PKCE : exchangeCodeForSession avec l'URL complète
                // Le SDK lit le ?code= et le code_verifier depuis localStorage
                const { data, error } = await supabase.auth.exchangeCodeForSession(
                    window.location.href
                );

                if (error || !data.session) {
                    console.error('exchangeCodeForSession error:', error);
                    setStatus('Échec. Redirection...');
                    setTimeout(() => navigate('/login'), 2000);
                    return;
                }

                await exchangeWithBackend(data.session.access_token);

            } catch (e) {
                console.error('AuthCallback error:', e);
                setStatus('Erreur. Redirection...');
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
            if (!res.ok) throw new Error('Backend error ' + res.status);
            const json = await res.json();
            if (!json.token) throw new Error('No token in response');
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
