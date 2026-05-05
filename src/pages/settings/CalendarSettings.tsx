import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { calendarAPI } from '../../lib/api';
import { Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useLang } from '../../context/LangContext';

const CalendarSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useLang();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!(user?.google_calendar_connected || user?.google_calendar_id);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await calendarAPI.getAuthUrl();
      const url = res.data?.url ?? res.data?.auth_url ?? res.data;
      if (typeof url === 'string') {
        window.location.href = url;
      } else {
        setError("URL d'autorisation introuvable.");
        setConnecting(false);
      }
    } catch {
      setError('Erreur lors de la connexion à Google Agenda.');
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await calendarAPI.disconnect();
      await refreshUser();
    } catch {
      setError('Erreur lors de la déconnexion.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Status card */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-[#888]" />
            <span className="text-sm font-medium text-white">Google Agenda</span>
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#b8f000] border border-[#b8f000]/40 rounded px-2 py-1">
              <CheckCircle size={11} /> Connecté
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#555] border border-[#333] rounded px-2 py-1">
              <XCircle size={11} /> Non connecté
            </span>
          )}
        </div>

        {isConnected ? (
          <>
            <p className="text-sm text-[#888] mb-5">
              Votre Google Agenda est connecté. Les nouvelles réservations sont automatiquement synchronisées.
            </p>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Déconnexion…' : 'Déconnecter Google Agenda'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#888] mb-5">
              Connectez votre Google Agenda pour synchroniser automatiquement vos réservations.
            </p>
            <button
              onClick={connect}
              disabled={connecting}
              className="flex items-center gap-2 h-11 px-6 bg-[#b8f000] text-black font-bold rounded-xl text-sm disabled:opacity-50"
            >
              <ExternalLink size={14} />
              {connecting ? '…' : t('connectCal')}
            </button>
          </>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      {/* How it works */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
        <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">
          Comment ça marche
        </p>
        <div className="space-y-3">
          {[
            t('connectCal'),
            'Autorisez Tablenow à accéder à votre calendrier',
            'Chaque nouvelle réservation crée automatiquement un événement',
            "Les annulations suppriment l'événement correspondant",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border border-[#b8f000]/40 text-[#b8f000] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-sm text-[#888]">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarSettings;
