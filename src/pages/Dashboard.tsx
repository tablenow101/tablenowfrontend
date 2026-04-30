import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Phone, Copy, ArrowUpRight, Zap, TrendingUp } from 'lucide-react';

function formatDuration(seconds: number): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m${s.toString().padStart(2, '0')}s` : `${m}m`;
}

function formatTs(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatBox({
  label, value, sub,
}: {
  label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5">
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[#b8f000] font-medium mt-0.5">{sub}</p>}
      <p className="text-[10px] text-[#555] uppercase tracking-wider mt-3">{label}</p>
    </div>
  );
}

function CallRow({ call }: { call: any }) {
  const STATUS: Record<string, { label: string; cls: string }> = {
    completed:   { label: 'TERMINÉ',   cls: 'border-[#b8f000] text-[#b8f000]' },
    in_progress: { label: 'EN COURS',  cls: 'border-blue-400 text-blue-400'   },
    failed:      { label: 'ÉCHOUÉ',    cls: 'border-red-400 text-red-400'     },
    missed:      { label: 'MANQUÉ',    cls: 'border-yellow-400 text-yellow-400' },
  };
  const key = Object.keys(STATUS).includes(call.status) ? call.status : 'completed';
  const { label, cls } = STATUS[key];

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
      <div className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {call.caller_number || '—'}
        </p>
        <p className="text-[11px] text-[#555]">
          {formatTs(call.created_at || call.started_at)} · {formatDuration(call.duration || 0)}
        </p>
      </div>
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 ${cls}`}>
        {label}
      </span>
      {call.recording_url && (
        <a
          href={call.recording_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium border border-[#b8f000] text-[#b8f000] px-2.5 py-1 rounded hover:bg-[#b8f000]/10 transition-colors flex-shrink-0"
        >
          ▶ Écouter
        </a>
      )}
    </div>
  );
}

function SetupBanner({ slug }: { slug: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 mb-6">
      <div className="p-2 rounded-xl bg-yellow-500/10">
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

// ─── Main ─────────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { restaurantSlug } = useParams();
  const slug = restaurantSlug || user?.slug || '';

  const [stats, setStats]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [dateRange, setDateRange]   = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [copiedPhone, setCopiedPhone]   = useState(false);
  const [copiedEmail, setCopiedEmail]   = useState(false);

  useEffect(() => { fetchStats(); }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading w-12 h-12" />
      </div>
    );
  }

  const totalBookings    = stats?.bookings?.total     || 0;
  const confirmedCount   = stats?.bookings?.confirmed || 0;
  const cancelledCount   = stats?.bookings?.cancelled || 0;
  const totalCalls       = stats?.calls?.total        || 0;
  const totalGuests      = stats?.bookings?.totalGuests || 0;
  const avgDuration      = stats?.calls?.avgDuration  || 0;
  const successRate      = totalBookings > 0 ? Math.round((confirmedCount / totalBookings) * 100) : 0;
  const recentBookings   = stats?.recent?.bookings    || [];
  const recentCalls      = stats?.recent?.calls       || [];
  const isSetupIncomplete = !user?.vapi_assistant_id;

  const RANGE_LABELS: Record<string, string> = {
    today: 'Auj.',
    '7d': '7j',
    '30d': '30j',
    all: 'Tout',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Date range */}
        <div className="flex justify-end">
          <div className="flex gap-1 p-1 rounded-xl bg-[#111] border border-[#2a2a2a]">
            {(['today', '7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === r
                    ? 'bg-[#b8f000] text-black'
                    : 'text-[#555] hover:text-white'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {isSetupIncomplete && <SetupBanner slug={slug} />}

        {/* Identity cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* NUMÉRO IA */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#111] border border-[#2a2a2a]">
            <div className="p-2.5 rounded-xl bg-[#1a1a1a] flex-shrink-0">
              <Phone size={18} className="text-[#888]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-[#555] mb-1">Numéro IA</p>
              <p className="text-base font-bold text-white font-mono">
                {user?.vapi_phone_number || '—'}
              </p>
            </div>
            {user?.vapi_phone_number && (
              <button
                onClick={copyPhone}
                className="text-xs border border-[#2a2a2a] text-[#888] px-3 py-1.5 rounded-lg hover:border-[#444] hover:text-white transition-colors flex-shrink-0"
              >
                {copiedPhone ? 'Copié !' : 'Copier'}
              </button>
            )}
          </div>

          {/* BCC EMAIL */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#111] border border-[#2a2a2a]">
            <div className="p-2.5 rounded-xl bg-[#1a1a1a] flex-shrink-0">
              <Copy size={18} className="text-[#888]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-[#555] mb-1">BCC Email</p>
              <p className="text-xs text-white font-mono truncate">
                {user?.bcc_email || '—'}
              </p>
            </div>
            {user?.bcc_email && (
              <button
                onClick={copyEmail}
                className="text-xs border border-[#2a2a2a] text-[#888] px-3 py-1.5 rounded-lg hover:border-[#444] hover:text-white transition-colors flex-shrink-0"
              >
                {copiedEmail ? 'Copié !' : 'Copier'}
              </button>
            )}
          </div>
        </div>

        {/* Stat boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Réservations" value={totalBookings} />
          <StatBox
            label="Appels traités"
            value={totalCalls}
            sub={stats?.calls?.change ? `+${stats.calls.change}` : undefined}
          />
          <StatBox label="Couverts" value={totalGuests} />
          <StatBox label="Durée moyenne" value={formatDuration(avgDuration)} />
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Statut réservations */}
          <div className="rounded-2xl bg-[#111] border border-[#2a2a2a] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold text-white uppercase tracking-wider">
                Statut Réservations
              </h2>
              <Link
                to={`/r/${slug}/bookings`}
                className="text-xs text-[#b8f000] hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowUpRight size={11} />
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Confirmées', value: confirmedCount },
                { label: 'Annulées',  value: cancelledCount },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#888]">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2a2a2a] transition-all duration-700"
                      style={{
                        width: `${totalBookings > 0 ? Math.round((value / totalBookings) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
                <span className="text-xs text-[#555]">Taux de succès</span>
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

            {recentBookings.length > 0 && (
              <div className="pt-2 space-y-2">
                {recentBookings.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      b.status === 'confirmed' ? 'bg-[#22c55e]'
                      : b.status === 'cancelled' ? 'bg-red-400'
                      : 'bg-yellow-400'
                    }`} />
                    <span className="text-white truncate flex-1">{b.guest_name || 'Client'}</span>
                    <span className="text-[#555] text-xs">{b.booking_time || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appels récents */}
          <div className="rounded-2xl bg-[#111] border border-[#2a2a2a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold text-white uppercase tracking-wider">
                Appels Récents
              </h2>
              <Link
                to={`/r/${slug}/calls`}
                className="text-xs text-[#b8f000] hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowUpRight size={11} />
              </Link>
            </div>

            {recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Phone size={24} className="text-[#333] mb-3" />
                <p className="text-xs text-[#555]">Aucun appel pour le moment</p>
                <p className="text-xs text-[#333] mt-1">Les appels de votre IA apparaîtront ici</p>
              </div>
            ) : (
              <div>
                {recentCalls.slice(0, 4).map((c: any) => (
                  <CallRow key={c.id} call={c} />
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
