import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { calendarAPI } from '../lib/api';
import { Calendar, Loader2, CheckCircle } from 'lucide-react';

const SetupCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState('');

  const isConnected = user?.calendar_status === 'connected';

  // Get safe next path (prevent external redirects)
  const getNextPath = () => {
    const next = searchParams.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      return next;
    }
    return '/setup/restaurant';
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const response = await calendarAPI.getAuthUrl();
      const authUrl = response.data?.authUrl ?? response.data?.url ?? response.data?.auth_url;

      if (typeof authUrl === 'string') {
        window.location.href = authUrl;
      } else {
        setError('Impossible de générer le lien de connexion Google');
        setConnecting(false);
      }
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err));
      setError(errorMsg || 'Erreur lors de la connexion à Google Calendar');
      setConnecting(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    setError('');
    try {
      await calendarAPI.skip();
      navigate(getNextPath(), { replace: true });
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err));
      setError(errorMsg || 'Erreur lors de la sauvegarde');
      setSkipping(false);
    }
  };

  const handleContinue = () => {
    navigate(getNextPath(), { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full" style={{ background: '#b8f000' }}>
              <Calendar size={40} className="text-black" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Connecter Google Calendar
          </h1>
          <p className="text-[#888] text-lg">
            Synchronisez automatiquement vos réservations TableNow avec Google Agenda.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Main content card */}
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-12 text-center">
          {isConnected ? (
            // Connected state
            <>
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-[#b8f000]/10">
                  <CheckCircle size={40} className="text-[#b8f000]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Google Calendar connecté
              </h2>
              <p className="text-[#888] text-sm mb-8">
                Vos réservations seront synchronisées automatiquement.
              </p>
              <button
                onClick={handleContinue}
                className="w-full px-6 h-12 bg-[#b8f000] text-black font-bold rounded-xl hover:opacity-90 transition"
              >
                Continuer →
              </button>
            </>
          ) : (
            // Not connected state
            <>
              <div className="space-y-6">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full px-6 h-12 bg-[#b8f000] text-black font-bold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Redirection en cours…
                    </>
                  ) : (
                    'Connecter Google Agenda'
                  )}
                </button>

                <button
                  onClick={handleSkip}
                  disabled={skipping}
                  className="w-full px-6 h-12 text-[#888] hover:text-white transition disabled:opacity-60 text-sm"
                >
                  {skipping ? (
                    <>
                      <Loader2 size={14} className="inline animate-spin mr-2" />
                      Traitement...
                    </>
                  ) : (
                    'Continuer sans Google Calendar'
                  )}
                </button>
              </div>

              {/* Info box */}
              <div className="mt-10 pt-10 border-t border-[#2a2a2a]">
                <p className="text-xs text-[#555] mb-4">POURQUOI GOOGLE CALENDAR ?</p>
                <ul className="space-y-2 text-left">
                  <li className="text-sm text-[#888] flex items-start gap-2">
                    <span className="text-[#b8f000] mt-1">✓</span>
                    <span>Synchronisation automatique de vos réservations</span>
                  </li>
                  <li className="text-sm text-[#888] flex items-start gap-2">
                    <span className="text-[#b8f000] mt-1">✓</span>
                    <span>Éviter les surréservations avec un seul agenda</span>
                  </li>
                  <li className="text-sm text-[#888] flex items-start gap-2">
                    <span className="text-[#b8f000] mt-1">✓</span>
                    <span>Vous pouvez vous connecter plus tard dans les paramètres</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#555] mt-8">
          Vos données sont sécurisées. Nous n'accédons qu'à votre Google Calendar.
        </p>
      </div>
    </div>
  );
};

export default SetupCalendar;
