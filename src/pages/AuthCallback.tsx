import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const [status, setStatus] = useState('Connexion en cours...');

    useEffect(() => {
        // Supabase detectSessionInUrl gère automatiquement l'échange du code PKCE
        // On écoute onAuthStateChange qui se déclenche quand la session est prête
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    subscription.unsubscribe();
                    try {
                        setStatus('Finalisation...');
                        const res = await fetch('https://api.tablenow.io/api/auth/google/supabase', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ access_token: session.access_token }),
                        });
                        const json = await res.json();
                        if (json.token) {
                            await loginWithToken(json.token);
                        } else {
                            throw new Error('No token');
                        }
                    } catch (e) {
                        console.error(e);
                        setStatus('Erreur backend. Redirection...');
                        setTimeout(() => navigate('/login'), 2000);
                    }
                } else if (event === 'SIGNED_OUT') {
                    subscription.unsubscribe();
                    navigate('/login');
                }
            }
        );

        // Timeout 15s
        const timeout = setTimeout(() => {
            subscription.unsubscribe();
            setStatus('Délai dépassé. Redirection...');
            setTimeout(() => navigate('/login'), 1000);
        }, 15000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
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
