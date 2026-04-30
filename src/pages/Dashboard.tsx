import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Phone, Mail, ArrowUpRight, Zap, TrendingUp } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m${s.toString().padStart(2, '0')}s` : `${m}m`;
}

function formatTs(ts: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatPhone(raw: string): string {
  if (!raw) return raw;
  if (raw.startsWith('+33')) {
    const num = raw.slice(3);
    return '+33 ' + (num.match(/.{1,2}/g)?.join(' ') ?? num);
  }
  if (raw.startsWith('+1')) {
    const num = raw.slice(2);
    return `+1 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  }
  return raw;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DateRange = 'today' | '7d' | '30d' | 'all';
type TileId   = 'bookings' | 'calls' | 'covers' | 'duration';

interface Tile {
  id: TileId;
  label: string;
  value: string | number;
  valueClass: string;
  badge?: string;
  sub: string;
}

// ─── Setup banner ─────────────────────────────────────────────────────────────

function SetupBanner({ slug }: { slug: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
      <div className="p-2 rounded-lg bg-yellow-500/10 flex-shrink-0">
        <Zap size={16} className="text-yellow-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-yellow-300">Configuration en cours</p>
        <p className="text-xs text-yellow-500/80">Finalisez la configuration de votre assistant IA pour activer la prise de réservations.</p>
      </div>
      <Link
        to={`/r/${slug}/settings`}
        className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 whitespace-nowrap"
      >
        Configurer <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { label: string; cls: string }> = {
    completed:   { label: 'TERMINÉ',    cls: 'border-[#b8f000] text-[#b8f000]'      },
    in_progress: { label: 'EN COURS',   cls: 'border-blue-400 text-blue-400'         },
    failed:      { label: 'ÉCHOUÉ',      cls: 'border-red-400 text-red-400'           },
    missed:      { label: 'MANQUÉ',     cls: 'border-yellow-400 text-yellow-400'    },
    confirmed:   { label: 'CONFIRMÉ',   cls: 'border-green-400 text-green-400'      },
    cancelled:   { label: 'ANNULÉ',     cls: 'border-red-400 text-red-400'           },
    pending:     { label: 'EN ATTENTE', cls: 'border-yellow-400 text-yellow-400'    },
  };
  const { label, cls } = MAP[status] ?? MAP['completed'];
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 ${cls}`}>
      {label}
    </span>
  );
}

// ─── Drill-down panels ───────────────────────────────────────────────────────

function BookingsPanel({ bookings }: { bookings: any[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-white">Détail des réservations</h3>
        <span className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-[10px] px-2 py-0.5 rounded-full">
          {bookings.length}
        </span>
      </div>
      {bookings.length === 0 ? (
        <p className="text-sm text-[#555]">Aucune réservation sur cette période</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Client', 'Date', 'Heure', 'Couverts', 'Statut'].map(h => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-wider text-[#555] pb-2 pr-4 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => {
                const dateStr = b.booking_date || b.created_at
                  ? new Date(b.booking_date || b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : '—';
                const timeStr = b.booking_time
                  || (b.booking_date ? new Date(b.booking_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—');
                return (
                  <tr key={b.id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="py-2.5 pr-4 text-white font-medium">{b.guest_name || '—'}</td>
                    <td className="py-2.5 pr-4 text-[#888]">{dateStr}</td>
                    <td className="py-2.5 pr-4 text-[#888]">{timeStr}</td>
                    <td className="py-2.5 pr-4 text-[#888]">{b.party_size ?? '—'}</td>
                    <td className="py-2.5"><StatusBadge status={b.status || 'confirmed'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CallsPanel({ calls }: { calls: any[] }) {
  const [openAudio, setOpenAudio]           = useState<string | null>(null);
  const [openTranscript, setOpenTranscript] = useState<Record<string, boolean>>({});

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-white">Détail des appels</h3>
        <span className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-[10px] px-2 py-0.5 rounded-full">
          {calls.length}
        </span>
      </div>
      {calls.length === 0 ? (
        <p className="text-sm text-[#555]">Aucun appel sur cette période</p>
      ) : (
        <div className="space-y-2">
          {calls.map((c: any) => (
            <div key={c.id} className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {formatPhone(c.caller_number || '') || '—'}
                  </p>
                  <p className="text-xs text-[#555]">
                    {formatTs(c.created_at || c.started_at)} · {formatDuration(c.duration || 0)}
                  </p>
                </div>
                <StatusBadge status={c.status || 'completed'} />
                {c.recording_url && (
                  <button
                    onClick={() => setOpenAudio(openAudio === c.id ? null : c.id)}
                    className="flex items-center gap-1 text-xs border border-[#b8f000] text-[#b8f000] px-2.5 py-1 rounded hover:bg-[#b8f000] hover:text-black transition-colors flex-shrink-0"
                  >
                    {openAudio === c.id ? '▮ Stop' : '▶ Écouter'}
                  </button>
                )}
              </div>
              {openAudio === c.id && c.recording_url && (
                <audio
                  src={c.recording_url}
                  controls
                  autoPlay
                  className="w-full mt-2"
                  style={{ colorScheme: 'dark', height: '32px' }}
                />
              )}
              {c.transcript && (
                <div className="mt-2 pl-5">
                  <p className="text-xs text-[#555]">
                    {openTranscript[c.id]
                      ? c.transcript
                      : c.transcript.slice(0, 100) + (c.transcript.length > 100 ? '…' : '')}
                  </p>
                  {c.transcript.length > 100 && (
                    <button
                      onClick={() => setOpenTranscript(p => ({ ...p, [c.id]: !p[c.id] }))}
                      className="text-[10px] text-[#b8f000] hover:underline mt-0.5"
                    >
                      {openTranscript[c.id] ? 'Voir moins' : 'Voir plus'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CoversPanel({ bookings }: { bookings: any[] }) {
  const byDate: Record<string, { bookings: number; covers: number }> = {};
  for (const b of bookings) {
    const raw = b.booking_date || b.created_at;
    const key = raw
      ? new Date(raw).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      : 'Inconnu';
    if (!byDate[key]) byDate[key] = { bookings: 0, covers: 0 };
    byDate[key].bookings++;
    byDate[key].covers += b.party_size || 0;
  }
  const rows = Object.entries(byDate).slice(0, 10);
  const maxCovers = Math.max(...rows.map(([, v]) => v.covers), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-4">Couverts par jour</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-[#555]">Aucune donnée sur cette période</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map(([date, v]) => (
            <div key={date} className="flex items-center gap-3">
              <span className="text-xs text-[#555] w-12 flex-shrink-0">{date}</span>
              <div className="flex-1 h-5 bg-[#1a1a1a] rounded overflow-hidden">
                <div
                  className="h-full bg-[#b8f000] rounded transition-all duration-500"
                  style={{ width: `${(v.covers / maxCovers) * 100}%` }}
                />
              </div>
              <span className="text-xs text-white w-20 text-right flex-shrink-0">
                {v.covers} cvts · {v.bookings} rés.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DurationPanel({ calls }: { calls: any[] }) {
  const withDur = calls.filter(c => (c.duration ?? 0) > 0);
  const durations = withDur.map(c => c.duration as number);
  const minD = durations.length ? Math.min(...durations) : 0;
  const maxD = durations.length ? Math.max(...durations) : 0;
  const avgD = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-4">Durée des appels</h3>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'MINIMUM', value: formatDuration(minD) },
          { label: 'MOYENNE', value: formatDuration(avgD) },
          { label: 'MAXIMUM', value: formatDuration(maxD) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 text-center">
            <p className="text-base font-bold text-[#b8f000]">{value}</p>
            <p className="text-[10px] text-[#555] uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {withDur.length === 0 ? (
        <p className="text-sm text-[#555]">Aucune donnée de durée disponible</p>
      ) : (
        <div className="space-y-2">
          {withDur.slice(0, 10).map((c: any) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="text-xs text-[#555] w-28 truncate flex-shrink-0">
                {formatPhone(c.caller_number || '') || '—'}
              </span>
              <div className="flex-1 h-4 bg-[#1a1a1a] rounded overflow-hidden">
                <div
                  className="h-full bg-[#b8f000]/60 rounded transition-all duration-500"
                  style={{ width: `${maxD > 0 ? (c.duration / maxD) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-[#888] w-12 text-right flex-shrink-0">
                {formatDuration(c.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const DATE_RANGES: DateRange[] = ['today', '7d', '30d', 'all'];
const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Auj.',
  '7d':  '7j',
  '30d': '30j',
  all:   'Tout',
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { restaurantSlug } = useParams();
  const slug = restaurantSlug || (user as any)?.slug || '';

  // ── Existing state (untouched) ──
  const [stats, setStats]             = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [dateRange, setDateRange]     = useState<DateRange>('30d');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // ── New UI state ──
  const [activeTile, setActiveTile] = useState<TileId | null>(null);
  const [openAudio, setOpenAudio]   = useState<string | null>(null);

  useEffect(() => { fetchStats(); }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Existing fetch (untouched) ──
  const fetchStats = async () => {
    try {
      const today = new Date();
      const params: any = { dateRange };
      if (dateRange === 'today') {
        params.startDate = params.endDate = today.toISOString().split('T')[0];
      } else if (dateRange !== 'all') {
        const start = new Date();
        start.setDate(start.getDate() - (dateRange === '7d' ? 7 : 30));
        params.startDate = start.toISOString().split('T')[0];
        params.endDate   = today.toISOString().split('T')[0];
      }
      const res = await dashboardAPI.getStats(params);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyPhone = () => {
    if (user?.vapi_phone_number) {
      navigator.clipboard.writeText(user.vapi_phone_number);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const copyEmail = () => {
    if (user?.bcc_email) {
      navigator.clipboard.writeText(user.bcc_email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const toggleTile = (tile: TileId) => {
    setActiveTile(prev => prev === tile ? null : tile);
    setOpenAudio(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading w-12 h-12" />
      </div>
    );
  }

  // ── Derived data (same as before) ──
  const totalBookings  = stats?.bookings?.total       || 0;
  const confirmedCount = stats?.bookings?.confirmed   || 0;
  const cancelledCount = stats?.bookings?.cancelled   || 0;
  const totalCalls     = stats?.calls?.total          || 0;
  const totalGuests    = stats?.bookings?.totalGuests || 0;
  const avgDuration    = stats?.calls?.avgDuration    || 0;
  const successRate    = totalBookings > 0 ? Math.round((confirmedCount / totalBookings) * 100) : 0;
  const recentBookings = stats?.recent?.bookings      || [];
  const recentCalls    = stats?.recent?.calls         || [];
  const todayCallCount = (stats?.calls?.todayCount ?? 0) as number;
  const isSetupIncomplete = !user?.vapi_assistant_id;

  const TILES: Tile[] = [
    {
      id: 'bookings',
      label: 'RÉSERVATIONS',
      value: totalBookings,
      valueClass: 'text-white',
      sub: `${confirmedCount} confirmées`,
    },
    {
      id: 'calls',
      label: 'APPELS TRAITÉS',
      value: totalCalls,
      valueClass: totalCalls > 0 ? 'text-[#b8f000]' : 'text-white',
      badge: todayCallCount > 0 ? `+${todayCallCount}` : undefined,
      sub: 'derniers 30j',
    },
    {
      id: 'covers',
      label: 'COUVERTS',
      value: totalGuests,
      valueClass: 'text-white',
      sub: 'total couverts',
    },
    {
      id: 'duration',
      label: 'DURÉE MOYENNE',
      value: formatDuration(avgDuration),
      valueClass: 'text-[#b8f000]',
      sub: 'par appel',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* 1. Date filter */}
        <div className="flex justify-end">
          <div className="flex gap-1">
            {DATE_RANGES.map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  dateRange === r
                    ? 'bg-[#b8f000] text-black font-bold'
                    : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {isSetupIncomplete && <SetupBanner slug={slug} />}

        {/* 2. Identity cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-[#1a1a1a] flex-shrink-0">
              <Phone size={20} className="text-[#555]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-[#555]">NUMÉRO IA</p>
              <p className="text-sm font-medium text-white mt-0.5 font-mono">
                {formatPhone(user?.vapi_phone_number || '') || '—'}
              </p>
            </div>
            {user?.vapi_phone_number && (
              <button
                onClick={copyPhone}
                className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-xs px-3 py-1.5 rounded-lg hover:text-white transition-colors flex-shrink-0"
              >
                {copiedPhone ? 'Copié ✓' : 'Copier'}
              </button>
            )}
          </div>

          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-[#1a1a1a] flex-shrink-0">
              <Mail size={20} className="text-[#555]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-[#555]">BCC EMAIL</p>
              <p className="text-sm font-medium text-white mt-0.5 font-mono truncate">
                {user?.bcc_email
                  ? user.bcc_email.length > 20
                    ? `${user.bcc_email.slice(0, 20)}…@tablenow.io`
                    : user.bcc_email
                  : '—'}
              </p>
            </div>
            {user?.bcc_email && (
              <button
                onClick={copyEmail}
                className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-xs px-3 py-1.5 rounded-lg hover:text-white transition-colors flex-shrink-0"
              >
                {copiedEmail ? 'Copié ✓' : 'Copier'}
              </button>
            )}
          </div>
        </div>

        {/* 3. Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TILES.map(tile => (
            <button
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              className={`bg-[#111] border rounded-xl p-5 cursor-pointer hover:border-[#444] transition text-left ${
                activeTile === tile.id ? 'border-[#b8f000]' : 'border-[#2a2a2a]'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-[#555]">{tile.label}</p>
              <div className="flex items-center gap-2 my-2">
                <p className={`text-3xl font-bold ${tile.valueClass}`}>{tile.value}</p>
                {tile.badge && (
                  <span className="bg-[#b8f000] text-black text-xs rounded px-1.5 py-0.5 font-bold">
                    {tile.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#555]">{tile.sub}</p>
            </button>
          ))}
        </div>

        {/* 4. Drill-down panel */}
        <div className={`overflow-hidden transition-all duration-300 ${
          activeTile ? 'max-h-[500px]' : 'max-h-0'
        }`}>
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-5 mb-6 overflow-y-auto max-h-[500px]">
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setActiveTile(null)}
                className="text-[#555] hover:text-white text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            {activeTile === 'bookings' && <BookingsPanel bookings={recentBookings} />}
            {activeTile === 'calls'    && <CallsPanel calls={recentCalls} />}
            {activeTile === 'covers'   && <CoversPanel bookings={recentBookings} />}
            {activeTile === 'duration' && <DurationPanel calls={recentCalls} />}
          </div>
        </div>

        {/* 5. Bottom 2-col section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* STATUT RÉSERVATIONS */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] uppercase tracking-wider text-[#555] font-semibold">
                STATUT RÉSERVATIONS
              </h2>
              <Link to={`/r/${slug}/bookings`} className="text-sm text-[#b8f000] hover:underline">
                Voir tout →
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#888]">Confirmées</span>
                  <span className="text-white font-medium">{confirmedCount}</span>
                </div>
                <div className="h-1 rounded-full bg-[#1a1a1a]">
                  <div
                    className="h-full rounded-full bg-[#b8f000] transition-all duration-700"
                    style={{ width: `${totalBookings > 0 ? (confirmedCount / totalBookings) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#888]">Annulées</span>
                  <span className="text-white font-medium">{cancelledCount}</span>
                </div>
                <div className="h-1 rounded-full bg-[#1a1a1a]">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-700"
                    style={{ width: `${totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
                <span className="text-xs text-[#888]">Taux de succès</span>
                {totalBookings > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-[#b8f000]" />
                    <span className="text-sm font-bold text-[#b8f000]">{successRate}%</span>
                  </div>
                ) : (
                  <span className="text-xs text-[#555]">Données à venir</span>
                )}
              </div>
            </div>
          </div>

          {/* APPELS RÉCENTS */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] uppercase tracking-wider text-[#555] font-semibold">
                APPELS RÉCENTS
              </h2>
              <Link to={`/r/${slug}/calls`} className="text-sm text-[#b8f000] hover:underline">
                Voir tout →
              </Link>
            </div>

            {recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-28 text-center">
                <Phone size={24} className="text-[#333] mb-2" />
                <p className="text-xs text-[#555]">Aucun appel pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCalls.slice(0, 3).map((c: any) => (
                  <div key={c.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {formatPhone(c.caller_number || '') || '—'}
                        </p>
                        <p className="text-xs text-[#555]">
                          {formatTs(c.created_at || c.started_at)} · {formatDuration(c.duration || 0)}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase border border-[#b8f000] text-[#b8f000] px-2 py-0.5 rounded flex-shrink-0">
                        TERMINÉ
                      </span>
                      {c.recording_url && (
                        <button
                          onClick={() => setOpenAudio(openAudio === c.id ? null : c.id)}
                          className="border border-[#b8f000] text-[#b8f000] text-xs px-3 py-1 rounded hover:bg-[#b8f000] hover:text-black transition-colors flex-shrink-0"
                        >
                          ▶ Écouter
                        </button>
                      )}
                    </div>
                    {openAudio === c.id && c.recording_url && (
                      <audio
                        src={c.recording_url}
                        controls
                        autoPlay
                        className="w-full mt-2"
                        style={{ colorScheme: 'dark', height: '32px' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
