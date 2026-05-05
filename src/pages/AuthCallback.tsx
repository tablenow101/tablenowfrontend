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
                // Supabase gère automatiquement le hash/code dans l'URL
                const { data, error: authError } = await supabase.auth.getSession();
                if (authError || !data.session) {
                    setError('Authentification échouée. Veuillez réessayer.');
                    setTimeout(() => navigate('/login'), 3000);
                    return;
                }
                // Échanger le token Supabase contre un token backend TableNow
                const res = await fetch('https://api.tablenow.io/api/auth/google/supabase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: data.session.access_token }),
                });
                if (!res.ok) throw new Error('Backend exchange failed');
                const json = await res.json();
                if (json.token) {
                    await loginWithToken(json.token);
                } else {
                    throw new Error('No token returned');
                }
            } catch (err) {
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
