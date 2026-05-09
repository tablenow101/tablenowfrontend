import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle, XCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { useLang } from '../../context/LangContext';

const CalendarSettings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const [connecting, setConnecting]       = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // localStatus overrides the context value immediately after the OAuth redirect
  // so the UI updates without waiting for a full page reload / context refresh.
  const [localStatus, setLocalStatus]     = useState<'connected' | 'error' | null>(null);
  const [errorReason, setErrorReason]     = useState<string | null>(null);

  const isConnected = localStatus === 'connected'
    ? true
    : localStatus === null
      ? !!(user as any)?.google_calendar_connected
      : false;

  // Detect ?calendar=connected|error set by the backend after the server-side
  // OAuth token exchange and PKCE verification.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cal    = params.get('calendar');
    const reason = params.get('reason');

    if (cal === 'connected') {
      setLocalStatus('connected');
      // Clean the URL without triggering a page reload
      window.history.replaceState({}, '', '/settings');
    } else if (cal === 'error') {
      setLocalStatus('error');
      setErrorReason(reason);
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await calendarAPI.getAuthUrl();
      const url = res.data?.authUrl ?? res.data?.url ?? res.data?.auth_url ?? res.data;
      if (typeof url === 'string') window.location.href = url;
      else setConnecting(false);
    } catch {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await calendarAPI.disconnect();
      setLocalStatus('error'); // treated as "not connected"
      setDisconnecting(false);
    } catch {
      setDisconnecting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">

      {/* Success banner */}
      {localStatus === 'connected' && (
        <div className="flex items-center gap-3 bg-[#b8f00015] border border-[#b8f00040] rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-[#b8f000] flex-shrink-0" />
          <span className="text-sm text-[#b8f000] font-medium">Google Calendar connecté avec succès !</span>
        </div>
      )}

      {/* Error banner */}
      {localStatus === 'error' && errorReason && (
        <div className="flex items-center gap-3 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">
            Échec de la connexion Google Calendar
            {errorReason ? ` (${errorReason})` : ''}.
            Veuillez réessayer.
          </span>
        </div>
      )}

      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-[#b8f000]" />
            <span className="font-semibold text-white">Google Calendar</span>
          </div>
          {isConnected
            ? <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#b8f000] border border-[#b8f00040] bg-[#b8f00010] px-2 py-1 rounded"><CheckCircle size={12}/> CONNECTED</span>
            : <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#555] border border-[#2a2a2a] px-2 py-1 rounded"><XCircle size={12}/> {t('notConnected').toUpperCase()}</span>
          }
        </div>
        <p className="text-sm text-[#888] mb-5">{t('calConnectDesc')}</p>
        {isConnected
          ? <button onClick={disconnect} disabled={disconnecting}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-red-400 rounded-xl hover:border-red-400/40 transition-colors">
              {disconnecting ? '…' : 'Disconnect'}
            </button>
          : <button onClick={connect} disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#b8f000] text-black text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
              <ExternalLink size={14}/> {connecting ? '…' : t('connectCal')}
            </button>
        }
      </div>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6">
        <p className="text-[10px] font-bold tracking-[.15em] text-[#555] mb-4">{t('calHowItWorks')}</p>
        <div className="space-y-3">
          {[t('calStep1'), t('calStep2'), t('calStep3'), t('calStep4')].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border border-[#b8f000] text-[#b8f000] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</div>
              <span className="text-sm text-[#888]">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarSettings;
