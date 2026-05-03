import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight } from 'lucide-react';

// ─── Design token ─────────────────────────────────────────────────────────────
const LIME = '#b8f000';

// ─── Types ────────────────────────────────────────────────────────────────────
type Range = 'today' | '7j' | '30j' | 'all';

interface CallLog {
  id: string;
  caller_number?: string;
  status: string;
  duration?: number;
  created_at?: string;
  started_at?: string;
  reservation_booked?: boolean;
}

interface Booking {
  id: string;
  guest_name?: string;
  status: string;
  booking_time?: string;
  booking_date?: string;
  booked_for?: string;
  party_size?: number;
  covers?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function maskPhone(n?: string): string {
  if (!n) return 'Inconnu';
  const clean = n.replace(/\s/g, '');
  if (clean.length < 6) return n;
  return clean.slice(0, 4) + ' ' + clean.slice(4, 7) + ' ··· ' + clean.slice(-2);
}

function fmtDuration(s: number): string {
  if (!s) return '0s';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}min${sec}s` : `${m}min`;
}

function fmtTime(b: Booking): string {
  if (b.booked_for) {
    return new Date(b.booked_for).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return b.booking_time || '—';
}

function computePeak(calls: CallLog[]): { hour: number; count: number; pct: number } | null {
  if (!calls.length) return null;
  const buckets = new Array(24).fill(0);
  calls.forEach(c => {
    const ts = c.created_at || c.started_at;
    if (ts) buckets[new Date(ts).getHours()]++;
  });
  const max = Math.max(...buckets);
  if (max === 0) return null;
  const hour = buckets.indexOf(max);
  const total = calls.length;
  return { hour, count: max, pct: Math.round((max / total) * 100) };
}

function todayISO() { return new Date().toISOString().split('T')[0]; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivityTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
      <p className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em] mb-3">{label}</p>
      <p className="text-4xl font-bold text-white leading-none mb-1">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: LIME }}>{sub}</p>}
    </div>
  );
}

function CallRow({ call }: { call: CallLog }) {
  const dot = call.status === 'completed'
    ? LIME
    : call.status === 'missed' || call.status === 'failed'
      ? '#ef4444'
      : '#f59e0b';

  const outcome = call.reservation_booked
    ? 'Résa confirmée'
    : call.status === 'completed'
      ? 'Terminé'
      : call.status === 'missed'
        ? 'Manqué'
        : 'Échec';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
      <span className="text-sm text-white font-mono flex-1">{maskPhone(call.caller_number)}</span>
      <span className="text-xs text-[#888]">{outcome}</span>
      <span className="text-xs text-[#555] ml-2">{fmtDuration(call.duration || 0)}</span>
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const upcoming = booking.status !== 'cancelled';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
      <span className="text-sm font-bold w-12 flex-shrink-0" style={{ color: upcoming ? LIME : '#888' }}>
        {fmtTime(booking)}
      </span>
      <span className="text-sm text-white flex-1 truncate">{booking.guest_name || 'Client'}</span>
      <span className="text-xs text-[#888]">{booking.party_size || booking.covers || 0} couv.</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { restaurantSlug } = useParams();
  const slug = restaurantSlug || user?.slug || '';

  const [stats, setStats]           = useState<any>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [range, setRange]           = useState<Range>('30j');

  const fetchTodayStats = useCallback(async () => {
    try {
      const today = todayISO();
      const res = await dashboardAPI.getStats({ dateRange: 'today', startDate: today, endDate: today });
      setTodayStats(res.data);
    } catch { /* non-blocking */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date();
      const params: Record<string, string> = { dateRange: range };
      if (range === 'today') {
        params.startDate = todayISO(); params.endDate = todayISO();
      } else if (range !== 'all') {
        const days = range === '7j' ? 7 : 30;
        const start = new Date(); start.setDate(start.getDate() - days);
        params.startDate = start.toISOString().split('T')[0];
        params.endDate   = today.toISOString().split('T')[0];
      }
      const res = await dashboardAPI.getStats(params);
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchTodayStats(); }, [fetchTodayStats]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalBookings     = stats?.bookings?.total      ?? 0;
  const confirmedBookings = stats?.bookings?.confirmed  ?? 0;
  const totalCalls        = stats?.calls?.total         ?? 0;
  const successfulCalls   = stats?.calls?.successful    ?? totalCalls;
  const totalGuests       = stats?.bookings?.totalGuests ?? 0;
  const avgGuests         = totalBookings > 0 ? (totalGuests / totalBookings).toFixed(1) : '—';
  const conversionPct     = totalCalls > 0
    ? Math.round((confirmedBookings / totalCalls) * 100)
    : 0;
  const successPct        = totalCalls > 0
    ? Math.round((successfulCalls / totalCalls) * 100)
    : 0;

  const heroCallsToday    = todayStats?.calls?.total        ?? 0;
  const heroConfirmedToday = todayStats?.bookings?.confirmed ?? 0;

  const recentCalls: CallLog[]   = stats?.recent?.calls    ?? [];
  const recentBookings: Booking[] = stats?.recent?.bookings ?? [];

  const upcomingBookings = recentBookings
    .filter(b => {
      const dt = b.booked_for || b.booking_date;
      return dt && new Date(dt) >= new Date() && b.status !== 'cancelled';
    })
    .sort((a, b) => {
      const da = new Date(a.booked_for || a.booking_date || 0).getTime();
      const db = new Date(b.booked_for || b.booking_date || 0).getTime();
      return da - db;
    });

  const peak = computePeak(recentCalls);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const RANGES: { key: Range; label: string }[] = [
    { key: 'today', label: "Auj." },
    { key: '7j',    label: '7j'   },
    { key: '30j',   label: '30j'  },
    { key: 'all',   label: 'Tout' },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting()} {user?.name || user?.owner_name}
          </h1>
          <p className="text-sm text-[#888] mt-1">
            TableNow a traité{' '}
            <span className="font-semibold" style={{ color: LIME }}>{heroCallsToday} appel{heroCallsToday !== 1 ? 's' : ''}</span>
            {' '}et confirmé{' '}
            <span className="font-semibold" style={{ color: LIME }}>{heroConfirmedToday} réservation{heroConfirmedToday !== 1 ? 's' : ''}</span>
            {' '}aujourd'hui
          </p>
        </div>
        {/* Range selector */}
        <div className="flex items-center border border-[#2a2a2a] rounded-xl overflow-hidden flex-shrink-0">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className="px-4 py-2 text-xs font-semibold transition-colors"
              style={range === key
                ? { background: LIME, color: '#000' }
                : { background: 'transparent', color: '#888' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section ACTIVITÉ ────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
          <span>—</span> ACTIVITÉ
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActivityTile
            label="Réservations"
            value={totalBookings}
            sub={confirmedBookings > 0 ? `${confirmedBookings} confirmées` : undefined}
          />
          <ActivityTile
            label="Couverts"
            value={totalGuests}
            sub={totalGuests > 0 ? `${avgGuests} / résa` : undefined}
          />
          <ActivityTile
            label="Conversion"
            value={`${conversionPct}%`}
            sub="appel → résa"
          />
          <ActivityTile
            label="Appels traités"
            value={totalCalls}
            sub={successPct > 0 ? `${successPct}% par IA` : undefined}
          />
        </div>
      </div>

      {/* ── Bloc INSIGHT ────────────────────────────────────────────────────── */}
      {peak && peak.count > 0 && (
        <div className="rounded-xl border border-[#2a2a2a] p-5" style={{ background: '#0f0f0f' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: LIME }}>
              INSIGHT
            </span>
          </div>
          <p className="text-base font-bold text-white mb-1">
            Pic d'appels détecté à {peak.hour}h ({peak.pct}% du volume).
          </p>
          <p className="text-sm text-[#888]">
            {peak.count} appel{peak.count > 1 ? 's' : ''} reçu{peak.count > 1 ? 's' : ''} sur ce créneau.
            Assurez-vous que votre capacité est configurée pour cette heure.
          </p>
        </div>
      )}

      {/* ── DERNIERS APPELS + PROCHAINES RÉSAS ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Derniers appels */}
        <div className="rounded-xl bg-[#111] border border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em]">DERNIERS APPELS</p>
            <Link
              to={`/r/${slug}/calls`}
              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: LIME }}
            >
              Voir tout <ArrowUpRight size={11} />
            </Link>
          </div>
          {recentCalls.length === 0 ? (
            <p className="text-xs text-[#555] py-4 text-center">Aucun appel pour l'instant</p>
          ) : (
            recentCalls.slice(0, 5).map(c => <CallRow key={c.id} call={c} />)
          )}
        </div>

        {/* Prochaines réservations */}
        <div className="rounded-xl bg-[#111] border border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em]">PROCHAINES RÉSAS</p>
            <Link
              to={`/r/${slug}/bookings`}
              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: LIME }}
            >
              Voir tout <ArrowUpRight size={11} />
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="text-xs text-[#555] py-4 text-center">Aucune réservation à venir</p>
          ) : (
            upcomingBookings.slice(0, 5).map(b => <BookingRow key={b.id} booking={b} />)
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
