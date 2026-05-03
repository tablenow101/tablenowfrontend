import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CallLog {
    id: string;
    caller_number?: string;
    caller_name?: string;
    status: 'completed' | 'missed' | 'failed' | 'in_progress';
    duration?: number;
    created_at?: string;
    started_at?: string;
    reservation_booked?: boolean;
    transcript?: string;
}

interface Booking {
    id: string;
    guest_name?: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    booking_time?: string;
    booking_date?: string;
    booked_for?: string;
    party_size?: number;
    covers?: number;
}

interface Insights {
    occupancy_rate: number;
    lowest_slot_time: string | null;
    unplaced_requests: number;
    peak_unplaced_time: string | null;
    confirmed_reservations: number;
    abandoned_calls: number;
    best_slot_time: string | null;
}

type Range = 'today' | '7j' | '30j' | 'all';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
}

function maskPhone(n?: string): string {
    if (!n) return 'Inconnu';
    const clean = n.replace(/\s/g, '');
    if (clean.length < 8) return n;
    return clean.slice(0, 4) + ' ' + clean.slice(4, 6) + ' ··· ' + clean.slice(-2);
}

function fmtDuration(s: number): string {
    if (!s) return '—';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec > 0 ? `${m}min${sec}s` : `${m}min`;
}

function fmtTime(b: Booking): string {
    if (b.booked_for) return new Date(b.booked_for).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return b.booking_time || '—';
}

function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const LIME = '#b8f000';

function StatTile({ label, value, sub, subLime = false }: {
    label: string; value: string | number; sub?: string; subLime?: boolean;
}) {
    return (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">{label}</p>
            <p className="text-[40px] font-bold text-white leading-none">{value}</p>
            {sub && <p className={`text-xs mt-1.5 ${subLime ? 'text-[#b8f000]' : 'text-[#888]'}`}>{sub}</p>}
        </div>
    );
}

function CallRow({ call }: { call: CallLog }) {
    const dot = call.status === 'completed' ? LIME
        : call.status === 'missed' ? '#f59e0b'
        : '#ef4444';
    const name = call.caller_name || maskPhone(call.caller_number);
    const isNamed = !!call.caller_name;
    return (
        <div className="flex items-center gap-0 py-2.5 border-b border-[#1a1a1a] last:border-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0 mr-3" style={{ background: dot }} />
            <span className={`text-sm flex-shrink-0 w-36 ${isNamed ? 'text-white font-medium' : 'text-white font-mono'}`}>
                {name}
            </span>
            <span className="text-xs text-[#888] flex-1 truncate">
                {call.reservation_booked ? 'Réservation confirmée' : call.status === 'completed' ? 'Terminé' : call.status === 'missed' ? 'Manqué' : 'Non abouti'}
            </span>
            <span className="text-xs text-[#555] flex-shrink-0">{fmtDuration(call.duration || 0)}</span>
        </div>
    );
}

function BookingRow({ booking }: { booking: Booking }) {
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
            <span className="text-sm font-bold w-12 flex-shrink-0" style={{ color: LIME }}>{fmtTime(booking)}</span>
            <span className="text-sm text-white flex-1 truncate">{booking.guest_name || 'Client'}</span>
            <span className="text-xs text-[#888]">{(booking.party_size || booking.covers || 0)} couv.</span>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { restaurantSlug } = useParams();
    const slug = restaurantSlug || user?.slug || '';

    const [stats, setStats]         = useState<any>(null);
    const [todayStats, setTodayStats] = useState<any>(null);
    const [insights, setInsights]   = useState<Insights | null>(null);
    const [loading, setLoading]     = useState(true);
    const [range, setRange]         = useState<Range>('30j');

    const fetchTodayStats = useCallback(async () => {
        try {
            const today = todayISO();
            const res = await dashboardAPI.getStats({ dateRange: 'today', startDate: today, endDate: today });
            setTodayStats(res.data);
        } catch { /* non-blocking */ }
    }, []);

    const fetchInsights = useCallback(async () => {
        try {
            const res = await dashboardAPI.getInsights();
            setInsights(res.data);
        } catch { /* non-blocking — insights stay null if no data yet */ }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const today = new Date();
            const params: Record<string, string> = { dateRange: range };
            if (range === 'today') {
                params.startDate = todayISO();
                params.endDate   = todayISO();
            } else if (range !== 'all') {
                const days = range === '7j' ? 7 : 30;
                const start = new Date();
                start.setDate(start.getDate() - days);
                params.startDate = start.toISOString().split('T')[0];
                params.endDate   = today.toISOString().split('T')[0];
            }
            const res = await dashboardAPI.getStats(params);
            setStats(res.data);
        } catch (e) {
            console.error('Dashboard stats error:', e);
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { fetchTodayStats(); fetchInsights(); }, [fetchTodayStats, fetchInsights]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    const totalCalls        = stats?.calls?.total         ?? 0;
    const totalBookings     = stats?.bookings?.total      ?? 0;
    const confirmedBookings = stats?.bookings?.confirmed  ?? 0;
    const cancelledBookings = stats?.bookings?.cancelled  ?? 0;
    const totalGuests       = stats?.bookings?.totalGuests ?? 0;
    const conversionPct     = totalCalls > 0 ? Math.round((confirmedBookings / totalCalls) * 100) : 0;
    const recentCalls: CallLog[]    = stats?.recent?.calls    ?? [];
    const recentBookings: Booking[] = stats?.recent?.bookings ?? [];

    const heroCallsToday     = todayStats?.calls?.total        ?? 0;
    const heroConfirmedToday = todayStats?.bookings?.confirmed ?? 0;

    const now = new Date();
    const upcomingBookings = recentBookings
        .filter(b => {
            const dt = b.booked_for || b.booking_date;
            return dt && new Date(dt) >= now && b.status !== 'cancelled';
        })
        .sort((a, b) =>
            new Date(a.booked_for || a.booking_date || 0).getTime() -
            new Date(b.booked_for || b.booking_date || 0).getTime()
        );

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

    const showInsights = insights && (
        insights.confirmed_reservations > 0 ||
        insights.abandoned_calls > 0 ||
        insights.unplaced_requests > 0
    );

    return (
        <div className="space-y-6">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {greeting()} {user?.name || user?.owner_name}
                    </h1>
                    <p className="text-sm text-[#888] mt-1">
                        {heroCallsToday > 0 || heroConfirmedToday > 0 ? (
                            <>Votre assistant a traité{' '}
                            <span className="font-semibold" style={{ color: LIME }}>{heroCallsToday} appel{heroCallsToday !== 1 ? 's' : ''}</span>
                            {' '}et confirmé{' '}
                            <span className="font-semibold" style={{ color: LIME }}>{heroConfirmedToday} réservation{heroConfirmedToday !== 1 ? 's' : ''}</span>
                            {' '}aujourd'hui</>
                        ) : (
                            <>Aucun appel enregistré aujourd'hui pour l'instant</>
                        )}
                    </p>
                </div>
                <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
                    {RANGES.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setRange(key)}
                            className="px-3 py-1.5 text-xs font-bold transition-colors"
                            style={range === key ? { background: LIME, color: '#000' } : { color: '#888' }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── ACTIVITÉ ────────────────────────────────────────────── */}
            <div>
                <p className="text-[10px] font-bold tracking-[.15em] uppercase text-[#555] mb-3">— ACTIVITÉ</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <StatTile
                        label="Appels traités"
                        value={totalCalls}
                        sub="Appels reçus et gérés par l'assistant"
                    />
                    <StatTile
                        label="Réservations"
                        value={totalBookings}
                        sub={`${confirmedBookings} confirmées · ${cancelledBookings} annulées`}
                        subLime={confirmedBookings > 0}
                    />
                    <StatTile
                        label="Couverts"
                        value={totalGuests}
                        sub={totalGuests > 0 ? `Moyenne ${(totalGuests / Math.max(totalBookings, 1)).toFixed(1)} par réservation` : 'Aucun couvert pour la période'}
                    />
                    <StatTile
                        label="Conversion"
                        value={`${conversionPct}%`}
                        sub="Appels transformés en réservations"
                    />
                </div>
            </div>

            {/* ── ANALYSE ─────────────────────────────────────────────── */}
            {showInsights && (
                <div>
                    <p className="text-[10px] font-bold tracking-[.15em] uppercase text-[#555] mb-3">— ANALYSE</p>
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1a1a1a]">
                            <span className="text-sm text-[#888] w-52 flex-shrink-0">Remplissage</span>
                            <span className="text-sm font-bold text-white w-16">{insights!.occupancy_rate}%</span>
                            <span className="text-xs text-[#555]">{insights!.lowest_slot_time ? `Créneau le plus faible : ${insights!.lowest_slot_time}` : '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1a1a1a]">
                            <span className="text-sm text-[#888] w-52 flex-shrink-0">Demandes non placées</span>
                            <span className="text-sm font-bold text-white w-16">{insights!.unplaced_requests}</span>
                            <span className="text-xs text-[#555]">{insights!.peak_unplaced_time ? `Pic à ${insights!.peak_unplaced_time}` : '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1a1a1a]">
                            <span className="text-sm text-[#888] w-52 flex-shrink-0">Demandes abandonnées</span>
                            <span className="text-sm font-bold text-white w-16">{insights!.abandoned_calls}</span>
                            <span className="text-xs text-[#555]"></span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3.5">
                            <span className="text-sm text-[#888] w-52 flex-shrink-0">Créneau à valoriser</span>
                            <span className="text-sm font-bold w-16" style={{ color: LIME }}>{insights!.best_slot_time || '—'}</span>
                            <span className="text-xs text-[#555]">{insights!.best_slot_time ? 'Disponibilités ouvertes' : ''}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DERNIERS APPELS + PROCHAINES RÉSAS ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">DERNIERS APPELS</p>
                        <Link to={`/r/${slug}/calls`} className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: LIME }}>
                            Voir tout <ArrowUpRight size={11} />
                        </Link>
                    </div>
                    {recentCalls.length === 0 ? (
                        <p className="text-xs text-[#555] py-6 text-center">Aucun appel pour l'instant</p>
                    ) : (
                        recentCalls.slice(0, 4).map(c => <CallRow key={c.id} call={c} />)
                    )}
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">PROCHAINES RÉSERVATIONS</p>
                        <Link to={`/r/${slug}/bookings`} className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: LIME }}>
                            Voir tout <ArrowUpRight size={11} />
                        </Link>
                    </div>
                    {upcomingBookings.length === 0 ? (
                        <p className="text-xs text-[#555] py-6 text-center">Aucune réservation à venir</p>
                    ) : (
                        upcomingBookings.slice(0, 4).map(b => <BookingRow key={b.id} booking={b} />)
                    )}
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
