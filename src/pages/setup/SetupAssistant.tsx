import React, { useEffect, useState } from 'react';
import SetupShell from './SetupShell';
import { useAuth } from '../../hooks/useAuth';
import { settingsAPI } from '../../lib/api';
import { Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Step 4 — voice assistant. The assistant is provisioned automatically by the
// backend (VAPI). This page surfaces the real status, polls until it becomes
// active, and offers a retry if provisioning failed. No manual configuration.
const SetupAssistant: React.FC = () => {
  const { appState, refreshUser } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');

  const assistantStatus = appState?.assistant?.status ?? 'inactive';
  const provisioningStatus = appState?.provisioning?.status ?? 'not_started';
  const phoneNumber = appState?.provisioning?.phone_number;

  const isActive = assistantStatus === 'active';
  const isWorking = provisioningStatus === 'provisioning' || provisioningStatus === 'in_progress';
  const isError = assistantStatus === 'error' || provisioningStatus === 'error';

  // Poll while provisioning is in flight so the UI (and next_route) updates.
  useEffect(() => {
    if (isActive || isError) return;
    const id = setInterval(() => { refreshUser(); }, 5000);
    return () => clearInterval(id);
  }, [isActive, isError, refreshUser]);

  const retry = async () => {
    setRetrying(true);
    setError('');
    try {
      await settingsAPI.retryVapi();
      await refreshUser();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Échec de la configuration. Réessayez ou contactez le support.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <SetupShell
      step="/setup/assistant"
      title="Votre assistant vocal"
      subtitle="Nous configurons automatiquement votre standardiste IA et votre numéro dédié."
      footer={
        (isError || (!isActive && !isWorking)) ? (
          <button
            onClick={retry}
            disabled={retrying}
            className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444] transition-colors disabled:opacity-60"
          >
            {retrying ? '…' : 'Relancer la configuration'}
          </button>
        ) : undefined
      }
    >
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
        {isActive ? (
          <div className="flex items-start gap-3">
            <CheckCircle className="text-[#b8f000] mt-0.5" size={20} />
            <div>
              <p className="text-white font-semibold">Assistant actif</p>
              {phoneNumber && (
                <p className="text-sm text-[#888] flex items-center gap-1.5 mt-1">
                  <Phone size={14} /> {phoneNumber}
                </p>
              )}
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-400 mt-0.5" size={20} />
            <div>
              <p className="text-white font-semibold">La configuration a échoué</p>
              <p className="text-sm text-[#888] mt-1">Relancez la configuration ci-dessous.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Loader2 className="text-[#b8f000] mt-0.5 animate-spin" size={20} />
            <div>
              <p className="text-white font-semibold">Configuration en cours…</p>
              <p className="text-sm text-[#888] mt-1">Cela prend généralement moins d'une minute. Cette page se met à jour automatiquement.</p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </SetupShell>
  );
};

export default SetupAssistant;
