import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';
import { ArrowUpRight } from 'lucide-react';

type Range = 'today' | '7j' | '30j' | 'all';

interface CallLog {
    id: string;
    caller_number?: string;
    guest_name?: string;
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

interface Insights {
    occupancy_rate: number;
    lowest_slot_time: string | null;
    unplaced_requests: number;
    peak_unplaced_time: string | null;
    confirmed_reservations: number;
    abandoned_calls: number;
    best_slot_time: string | null;
}

function fmtDuration(s: number): string {
    if (!s) return '0s';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec > 0 ? `${m}min${String(sec).padStart(2,'0')}s` : `${m}min`;
}

function fmtTime(b: Booking): string {
    if (b.booked_for) return new Date(b.booked_for).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return b.booking_time || '—';
}

function todayISO() { return new Date().toISOString().split('T')[0]; }

function fmtPct(rate: number): string {
    return `${Math.round(rate * 100)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatTile({ label, value, sub, subLime = false }: {
    label: string; value: string | number; sub?: string; subLime?: boolean;
}) {
    return (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">{label}</p>
            <p className="text-2xl sm:text-[40px] font-bold text-white leading-none">{value}</p>
            {sub && <p className={`text-xs mt-1.5 ${subLime ? 'text-[#b8f000]' : 'text-[#888]'}`}>{sub}</p>}
        </div>
    );
}

function InsightRow({ label, value, desc, highlight = false }: {
    label: string; value: string | number; desc?: string; highlight?: boolean;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-b border-[#1a1a1a] last:border-0">
            <span className="text-sm text-[#888] flex-1 min-w-[140px]">{label}</span>
            <span className={`text-base font-bold w-14 flex-shrink-0 ${highlight ? 'text-[#b8f000]' : 'text-white'}`}>{value}</span>
            {desc && <span className="text-xs text-[#555] flex-shrink-0 hidden sm:block">{desc}</span>}
        </div>
    );
}

function CallRow({ call }: { call: CallLog }) {
    const { t } = useLang();
    const dotColor = call.status === 'completed' ? '#b8f000'
        : call.status === 'missed' ? '#f59e0b' : '#ef4444';
    const name = call.guest_name || call.caller_number || 'Inconnu';
    const isMono = !call.guest_name;
    const dur = call.duration ? fmtDuration(call.duration) : null;

    let desc = '';
    if (call.status === 'completed' && call.reservation_booked) {
        desc = t('callResaDesc');
    } else if (call.status === 'completed') {
        desc = t('callInfoDesc');
    } else if (call.status === 'missed') {
        desc = t('statusMissed');
    } else {
        desc = t('statusFailed');
    }
    if (dur) desc += ` · ${dur}`;

    return (
        <div className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
            <span className={`text-sm flex-1 truncate ${isMono ? 'font-mono text-white' : 'font-medium text-white'}`}>{name}</span>
            <span className="text-xs text-[#555] flex-shrink-0 hidden sm:block truncate max-w-[160px]">{desc}</span>
        </div>
    );
}

function BookingRow({ booking }: { booking: Booking }) {
    const { t } = useLang();
    return (
        <div className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
            <span className="text-sm font-bold w-12 flex-shrink-0" style={{ color: '#b8f000' }}>{fmtTime(booking)}</span>
            <span className="text-sm text-white flex-1 truncate">{booking.guest_name || 'Client'}</span>
            <span className="text-xs text-[#888] flex-shrink-0">{booking.party_size || booking.covers || 0} {t('coversUnit')}</span>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
    const { restaurant, authReady } = useAuth();
    const { t } = useLang();
    const { slug: slugParam } = useParams();
    const slug = slugParam || (restaurant?.slug as string | undefined) || '';

    const [stats, setStats]       = useState<Record<string, unknown> | null>(null);
    const [todayStats, setTodayStats] = useState<Record<string, unknown> | null>(null);
    const [insights, setInsights] = useState<Insights | null>(null);
    const [loading, setLoading]   = useState(true);
    const [range, setRange]       = useState<Range>('30j');

    const fetchTodayStats = useCallback(async () => {
        try {
            const today = todayISO();
            const res = await dashboardAPI.getStats({ dateRange: 'today', startDate: today, endDate: today });
            setTodayStats(res.data);
        } catch { /* non-blocking */ }
    }, []);

    const fetchInsights = useCallback(async () => {
        try {
            const res = await dashboardAPI.getInsights(todayISO());
            setInsights(res.data);
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
                const start = new Date();
                start.setDate(start.getDate() - days);
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

    useEffect(() => {
        if (!authReady) return;
        fetchTodayStats();
        fetchInsights();
    }, [authReady, fetchTodayStats, fetchInsights]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return t('greeting_morning');
        if (h < 18) return t('greeting_afternoon');
        return t('greeting_evening');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
    );

    // Defensive, controlled state: routing already sends an incomplete profile to
    // onboarding, but if we ever render here with an incomplete restaurant we show an
    // explicit panel + CTA instead of an empty dashboard presented as ready.
    if (restaurant && restaurant.is_complete === false) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="max-w-md w-full text-center space-y-4 bg-[#111] border border-[#2a2a2a] rounded-xl p-8">
                    <h1 className="text-xl font-bold text-white">Profil incomplet</h1>
                    <p className="text-sm text-[#888]">
                        Complétez les informations de votre restaurant pour activer votre tableau de bord.
                    </p>
                    <Link
                        to={`/r/${slug}/onboarding`}
                        className="inline-flex items-center justify-center h-11 px-6 bg-[#b8f000] text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
                    >
                        Compléter mon profil
                    </Link>
                </div>
            </div>
        );
    }

    const totalBookings     = stats?.bookings?.total ?? 0;
    const confirmedBookings = stats?.bookings?.confirmed ?? 0;
    const cancelledBookings = stats?.bookings?.cancelled ?? 0;
    const totalCalls        = stats?.calls?.total ?? 0;
    const totalGuests       = stats?.bookings?.totalGuests ?? 0;
    const avgGuests         = totalBookings > 0 ? (totalGuests / totalBookings).toFixed(1) : '—';
    const conversionPct     = totalCalls > 0 ? `${Math.round((confirmedBookings / totalCalls) * 100)}%` : '—';
    const recentCalls: CallLog[]    = stats?.recent?.calls    ?? [];
    const recentBookings: Booking[] = stats?.recent?.bookings ?? [];

    const heroCallsToday     = todayStats?.calls?.total ?? 0;
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

    const RANGES: { key: Range; label: string }[] = [
        { key: 'today', label: t('today') },
        { key: '7j',    label: '7j'        },
        { key: '30j',   label: '30j'       },
        { key: 'all',   label: t('all')    },
    ];

    return (
        <div className="space-y-4 sm:space-y-7">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">{greeting()} {(restaurant?.name as string | undefined) || ''}</h1>
                    <p className="text-sm text-[#888] mt-1">
                        {t('heroSub')
                            .replace('{calls}', String(heroCallsToday))
                            .replace('{resas}', String(heroConfirmedToday))
                            .split(/(\d+)/).map((part, i) =>
                                /^\d+$/.test(part)
                                    ? <span key={i} className="font-semibold" style={{ color: '#b8f000' }}>{part}</span>
                                    : part
                            )}
                    </p>
                </div>
                <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
                    {RANGES.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setRange(key)}
                            className="px-3 py-1.5 text-xs font-bold transition-colors"
                            style={range === key ? { background: '#b8f000', color: '#000' } : { color: '#888' }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── ACTIVITÉ ───────────────────────────────────────────── */}
            <div>
                <p className="text-[10px] font-bold tracking-[.15em] uppercase text-[#555] mb-2 sm:mb-3">— {t('sectionActivity')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <StatTile
                        label={t('callsHandled')}
                        value={totalCalls}
                        sub={t('callsDesc')}
                    />
                    <StatTile
                        label={t('reservations')}
                        value={totalBookings}
                        sub={`${confirmedBookings} ${t('confirmed')} · ${cancelledBookings} ${t('cancelled')}`}
                        subLime
                    />
                    <StatTile
                        label={t('covers')}
                        value={totalGuests}
                        sub={t('coversDesc').replace('{avg}', String(avgGuests))}
                    />
                    <StatTile
                        label={t('conversion')}
                        value={conversionPct}
                        sub={t('conversionDesc')}
                    />
                </div>
            </div>

            {/* ── ANALYSE ────────────────────────────────────────────── */}
            <div>
                <p className="text-[10px] font-bold tracking-[.15em] uppercase text-[#555] mb-2 sm:mb-3">— {t('sectionAnalysis')}</p>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
                    <InsightRow
                        label={t('fillRate')}
                        value={insights ? fmtPct(insights.occupancy_rate) : '—'}
                        desc={insights?.lowest_slot_time ? t('fillRateDesc').replace('{slot}', insights.lowest_slot_time) : undefined}
                    />
                    <InsightRow
                        label={t('unplaced')}
                        value={insights?.unplaced_requests ?? '—'}
                        desc={insights?.peak_unplaced_time ? t('unplacedDesc').replace('{time}', insights.peak_unplaced_time) : undefined}
                    />
                    <InsightRow
                        label={t('abandoned')}
                        value={insights?.abandoned_calls ?? '—'}
                    />
                    <InsightRow
                        label={t('bestSlot')}
                        value={insights?.best_slot_time ?? '—'}
                        desc={insights?.best_slot_time ? t('bestSlotDesc') : undefined}
                        highlight
                    />
                </div>
            </div>

            {/* ── Bottom grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Derniers appels */}
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">{t('latestCalls')}</p>
                        <Link to={`/r/${slug}/calls`} className="text-[11px] font-bold text-[#b8f000] hover:opacity-70 flex items-center gap-1">
                            {t('seeAll')} <ArrowUpRight size={11} />
                        </Link>
                    </div>
                    {recentCalls.length === 0
                        ? <p className="text-xs text-[#555] py-4 text-center">—</p>
                        : recentCalls.slice(0, 4).map(c => <CallRow key={c.id} call={c} />)
                    }
                </div>

                {/* Prochaines réservations */}
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">{t('nextResa')}</p>
                        <Link to={`/r/${slug}/reservations`} className="text-[11px] font-bold text-[#b8f000] hover:opacity-70 flex items-center gap-1">
                            {t('seeAll')} <ArrowUpRight size={11} />
                        </Link>
                    </div>
                    {upcomingBookings.length === 0
                        ? <p className="text-xs text-[#555] py-4 text-center">—</p>
                        : upcomingBookings.slice(0, 4).map(b => <BookingRow key={b.id} booking={b} />)
                    }
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
