import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../lib/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const verifyEmail = useCallback(async (): Promise<void> => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Lien de vérification invalide');
            return;
        }

        try {
            await authAPI.verifyEmail(token);

            setStatus('success');
            setMessage('Email vérifié avec succès !');

            // Refresh auth state and follow the backend's next_route verbatim.
            const state = await refreshUser();
            const next = state?.next_route || '/login';

            setTimeout(() => {
                navigate(next, { replace: true });
            }, 1500);
        } catch (error: unknown) {
            setStatus('error');
            let errorMessage = 'La vérification a échoué';
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { data?: { error?: string } } };
              errorMessage = axiosError.response?.data?.error || errorMessage;
            }
            setMessage(errorMessage);
        }
    }, [searchParams, navigate, refreshUser]) as () => Promise<void>;

    useEffect(() => {
        verifyEmail();
    }, [verifyEmail]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--bg-page, #0a0a0a)' }}>
            <div className="max-w-md w-full text-center">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary, #fff)' }}>
                        TableNow
                    </h1>
                </div>

                <div className="rounded-3xl p-8"
                    style={{
                        background: 'var(--bg-card, #111)',
                        border: '1px solid var(--border-card, #1a1a1a)',
                    }}>
                    <div className="flex justify-center mb-5">
                        {status === 'loading' && (
                            <div className="p-4 rounded-full" style={{ background: '#1a1a1a' }}>
                                <Loader size={40} className="animate-spin text-white" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="p-4 rounded-full bg-[#b8f000]/10">
                                <CheckCircle size={40} className="text-[#b8f000]" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="p-4 rounded-full bg-red-500/10">
                                <XCircle size={40} className="text-red-400" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary, #fff)' }}>
                        {status === 'loading' && 'Vérification en cours…'}
                        {status === 'success' && 'Email vérifié !'}
                        {status === 'error' && 'Échec de la vérification'}
                    </h2>

                    <p className="text-sm" style={{ color: 'var(--text-secondary, #888)' }}>
                        {status === 'loading' && 'Un instant…'}
                        {status === 'success' && 'Redirection vers votre tableau de bord…'}
                        {status === 'error' && message}
                    </p>

                    {status === 'error' && (
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-6 w-full h-12 rounded-xl font-semibold text-sm"
                            style={{ background: '#b8f000', color: '#000' }}
                        >
                            Retour à la connexion
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
