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
                const res = await fetch('https://api.tablenow.io/api/auth/google/supabase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: accessToken }),
                });
                const json = await res.json();
                if (json.token) await loginWithToken(json.token);
                else throw new Error('no token');
            } catch (e) {
                console.error(e);
                navigate('/login');
            }
        };

        // 1. Vérifier si session déjà disponible (detectSessionInUrl l'a déjà échangé)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) finish(session.access_token);
        });

        // 2. Écouter si l'échange se fait en async
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                finish(session.access_token);
            }
        });

        // Timeout 15s
        const t = setTimeout(() => {
            if (!done) {
                done = true;
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
