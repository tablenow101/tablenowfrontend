import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useLang } from '../../context/LangContext';

const CalendarSettings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = !!(user as any)?.google_calendar_connected;

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await calendarAPI.getAuthUrl();
      const url = res.data?.authUrl ?? res.data?.url ?? res.data?.auth_url ?? res.data;
      if (typeof url === 'string') window.location.href = url;
    } catch { setConnecting(false); }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try { await calendarAPI.disconnect(); window.location.reload(); }
    catch { setDisconnecting(false); }
  };

  const inp = "w-full h-11 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-[#444] transition-colors";

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
