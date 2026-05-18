import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useLang } from '../../hooks/useLang';

const CalendarSettings: React.FC = () => {
  const { user, authReady, refreshUser } = useAuth();
  const { t } = useLang();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = (user as unknown as Record<string, unknown>)?.calendar_status === 'connected' || !!(user as unknown as Record<string, unknown>)?.google_calendar_connected;

  // Handle OAuth callback: exchange code for tokens
  useEffect(() => {
    if (!authReady) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('Calendar OAuth error:', error);
      params.delete('error');
      window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
      return;
    }

    if (!code) return;

    (async () => {
      try {
        await calendarAPI.callback(code);
        if (typeof refreshUser === 'function') {
          await refreshUser();
        } else {
          window.location.reload();
        }
      } catch (err) {
        console.error('Calendar callback failed:', err);
        params.delete('code');
        window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
      }
    })();
  }, [authReady, refreshUser]);

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await calendarAPI.getAuthUrl({ returnTo: '/settings' });
      const url = res.data?.authUrl ?? res.data?.url ?? res.data?.auth_url ?? res.data;
      if (typeof url === 'string') window.location.href = url;
    } catch (error) {
      console.error('Failed to get calendar auth URL:', error);
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await calendarAPI.disconnect();
      if (typeof refreshUser === 'function') {
        await refreshUser();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Disconnect failed:', err);
      setDisconnecting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
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
          : <button onClick={connect} disabled={connecting || !authReady}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#b8f000] text-black text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              <ExternalLink size={14}/> {connecting ? '…' : authReady ? t('connectCal') : 'Loading…'}
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
