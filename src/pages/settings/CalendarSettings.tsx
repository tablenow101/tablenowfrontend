import React, { useState, useEffect, useCallback } from 'react';
import { calendarAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, CheckCircle, XCircle, ExternalLink, Copy, Check, RefreshCw, Link2, Trash2 } from 'lucide-react';
import { useLang } from '../../hooks/useLang';

interface CalendarSettingsProps {
  /** Where Google should redirect back after OAuth. Defaults to /settings. */
  returnTo?: string;
}

interface Connection {
  id: string;
  provider: string;
  account_email: string | null;
  status: string;
  last_error: string | null;
  created_at: string;
}

const CalendarSettings: React.FC<CalendarSettingsProps> = ({ returnTo = '/settings' }) => {
  const { authReady, refreshUser } = useAuth();
  const { t } = useLang();
  const [connecting, setConnecting] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [feedUrl, setFeedUrl] = useState<string>('');
  const [webcalUrl, setWebcalUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  const hasGoogle = connections.some((c) => c.provider === 'google' && c.status === 'active');

  const loadState = useCallback(async () => {
    try {
      const [conns, feed] = await Promise.all([
        calendarAPI.connections(),
        calendarAPI.feedUrl(),
      ]);
      setConnections(conns.data?.connections ?? []);
      setFeedUrl(feed.data?.feedUrl ?? '');
      setWebcalUrl(feed.data?.webcalUrl ?? '');
    } catch (err) {
      console.error('Failed to load calendar state:', err);
    }
  }, []);

  // Handle Google OAuth callback (exchange code), then load state.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('Calendar OAuth error:', error);
      params.delete('error');
      window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
      loadState();
      return;
    }

    if (!code) {
      loadState();
      return;
    }

    (async () => {
      try {
        await calendarAPI.callback(code);
        if (typeof refreshUser === 'function') await refreshUser();
      } catch (err) {
        console.error('Calendar callback failed:', err);
      } finally {
        params.delete('code');
        window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
        loadState();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectGoogle = async () => {
    setConnecting(true);
    try {
      const res = await calendarAPI.getAuthUrl({ returnTo });
      const url = res.data?.authUrl ?? res.data?.url ?? res.data?.auth_url ?? res.data;
      if (typeof url === 'string') window.location.href = url;
    } catch (error) {
      console.error('Failed to get calendar auth URL:', error);
      setConnecting(false);
    }
  };

  const removeConnection = async (id: string) => {
    try {
      await calendarAPI.removeConnection(id);
      await loadState();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const copyFeed = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const rotateFeed = async () => {
    if (!window.confirm('Régénérer le lien désactivera l’abonnement actuel sur tous les calendriers. Continuer ?')) return;
    setRotating(true);
    try {
      const res = await calendarAPI.rotateFeed();
      setFeedUrl(res.data?.feedUrl ?? '');
      setWebcalUrl(res.data?.webcalUrl ?? '');
    } catch (err) {
      console.error('Rotate failed:', err);
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Source of truth explainer */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={20} className="text-[#b8f000]" />
          <span className="font-semibold text-white">Calendrier TableNow</span>
        </div>
        <p className="text-sm text-[#888]">
          Vos réservations sont enregistrées dans TableNow et synchronisées automatiquement vers
          tous les calendriers que vous connectez ci-dessous — sans limite.
        </p>
      </div>

      {/* Google push connection */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-[#b8f000]" />
            <span className="font-semibold text-white">Google Calendar</span>
          </div>
          {hasGoogle
            ? <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#b8f000] border border-[#b8f00040] bg-[#b8f00010] px-2 py-1 rounded"><CheckCircle size={12}/> CONNECTÉ</span>
            : <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#555] border border-[#2a2a2a] px-2 py-1 rounded"><XCircle size={12}/> {t('notConnected').toUpperCase()}</span>
          }
        </div>
        <p className="text-sm text-[#888] mb-5">
          Connexion directe : les réservations sont créées, modifiées et annulées en temps réel sur votre Google Calendar.
        </p>

        {connections.filter((c) => c.provider === 'google').map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg px-3 py-2 mb-3">
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{c.account_email || 'Compte Google'}</div>
              {c.last_error && <div className="text-[11px] text-red-400 truncate">Erreur : {c.last_error}</div>}
            </div>
            <button onClick={() => removeConnection(c.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 border border-[#2a2a2a] rounded-lg hover:border-red-400/40 transition-colors flex-shrink-0">
              <Trash2 size={13}/> Déconnecter
            </button>
          </div>
        ))}

        {!hasGoogle && (
          <button onClick={connectGoogle} disabled={connecting || !authReady}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#b8f000] text-black text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            <ExternalLink size={14}/> {connecting ? '…' : authReady ? t('connectCal') : 'Chargement…'}
          </button>
        )}
      </div>

      {/* Universal subscribe feed — works with ANY calendar app */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Link2 size={20} className="text-[#b8f000]" />
          <span className="font-semibold text-white">N’importe quel calendrier</span>
        </div>
        <p className="text-sm text-[#888] mb-4">
          Abonnez Apple Calendar, Outlook, Google ou tout autre agenda à ce lien sécurisé.
          Les réservations apparaissent automatiquement, en lecture seule.
        </p>

        <div className="flex items-center gap-2 mb-3">
          <input
            readOnly
            value={feedUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#aaa] font-mono"
          />
          <button onClick={copyFeed}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-white rounded-lg hover:border-[#b8f00040] transition-colors flex-shrink-0">
            {copied ? <Check size={13} className="text-[#b8f000]"/> : <Copy size={13}/>}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {webcalUrl && (
            <a href={webcalUrl}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#b8f000] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
              <ExternalLink size={13}/> S’abonner en un clic
            </a>
          )}
          <button onClick={rotateFeed} disabled={rotating}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#888] border border-[#2a2a2a] rounded-lg hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={rotating ? 'animate-spin' : ''}/> Régénérer le lien
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarSettings;
