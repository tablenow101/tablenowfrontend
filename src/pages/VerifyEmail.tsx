import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!token) {
      setStatus('error');
      setErrorMsg('Lien de vérification invalide.');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Le lien est invalide ou a expiré.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="text-4xl font-black tracking-tight text-white">
            Table<span className="text-[#b8f000]">Now</span>
          </span>
        </div>

        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-8" style={{ borderTop: '4px solid #b8f000' }}>
          {status === 'verifying' && (
            <div className="space-y-4">
              <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-white font-medium">Vérification en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#b8f000]/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-[#b8f000]" size={36} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Email confirmé !</h1>
                <p className="text-sm text-[#888]">Votre compte est activé. Connectez-vous pour accéder à votre tableau de bord.</p>
              </div>
              <Link
                to="/login?verified=1"
                className="block w-full h-12 bg-[#b8f000] text-black font-bold rounded-xl text-sm leading-[48px] hover:opacity-90 transition-opacity"
              >
                Se connecter
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="text-red-400" size={36} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
                <p className="text-sm text-red-400">{errorMsg}</p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  to="/register"
                  className="block w-full h-12 bg-[#b8f000] text-black font-bold rounded-xl text-sm leading-[48px] hover:opacity-90 transition-opacity"
                >
                  Recommencer l'inscription
                </Link>
                <Link
                  to="/login"
                  className="block w-full h-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white leading-[48px] hover:border-[#444] transition-colors"
                >
                  Aller à la connexion
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
