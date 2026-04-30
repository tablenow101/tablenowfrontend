import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Phone, Calendar, Users, Clock, Copy, Check, TrendingUp, Play } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(s: number): string {
    if (!s) return '0s';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60), r = s % 60;
    return r > 0 ? `${m}m${String(r).padStart(2, '0')}s` : `${m}m`;
}
function fmtDate(ts: string, locale: string): string {
    return new Date(ts).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtPhone(n: string): string {
    if (!n) return '—';
    const d = n.replace(/\D/g, '');
    if (d.startsWith('33') && d.length === 11)
        return `+33 ${d[2]} ${d.slice(3,5)} ${d.slice(5,7)} ${d.slice(7,9)} ${d.slice(9,11)}`;
    return n;
}

// ─── CopyButton ────────────────────────────────────────────────────────
function CopyBtn({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{
                background: 'var(--bg3)', border: '1px solid var(--line2)',
                borderRadius: 'var(--r4)', padding: '3px 8px',
                fontSize: '9px', color: copied ? 'var(--acc)' : 'var(--t3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                flexShrink: 0, whiteSpace: 'nowrap',
            }}
        >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copié' : 'Copier'}
        </button>
    );
}

// ─── MetricCard ───────────────────────────────────────────────────────
function MetricCard({ label, value, delta, href, positive }: {
    label: string; value: string | number; delta?: number; href: string; positive?: boolean;
}) {
    return (
        <Link to={href} style={{ textDecoration: 'none' }}>
            <div style={{
                position: 'relative',
                background: 'var(--bg2)',
                border: '1px solid var(--line)',
                borderTop: `2px solid ${positive ? 'var(--acc)' : 'var(--line2)'}`,
                borderRadius: 'var(--r8)',
                padding: '16px 18px 14px',
                cursor: 'pointer',
                transition: 'border-color 120ms',
            }}>
                {delta !== undefined && delta !== 0 && (
                    <span style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: delta > 0 ? 'var(--acc2)' : 'var(--red2)',
                        color: delta > 0 ? 'var(--acc)' : 'var(--red)',
                        border: `1px solid ${delta > 0 ? 'rgba(184,224,74,0.15)' : 'rgba(224,90,90,0.15)'}`,
                        borderRadius: '3px', padding: '1px 5px',
                        fontSize: '8px', fontWeight: 600,
                    }}>
                        {delta > 0 ? '+' : ''}{delta}%
                    </span>
                )}
                <p style={{
                    fontSize: '28px', fontWeight: 300, letterSpacing: '-1px',
                    color: positive ? 'var(--acc)' : 'var(--t1)',
                    margin: '0 0 6px',
                }}>
                    {value}
                </p>
                <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', margin: 0 }}>
                    {label}
                </p>
            </div>
        </Link>
    );
}

// ─── StatusBadge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        completed:   { label: 'Terminé',    cls: 'badge-acc'   },
        confirmed:   { label: 'Confirmé',   cls: 'badge-acc'   },
        in_progress: { label: 'En cours',   cls: 'badge-blue'  },
        failed:      { label: 'Échoué',     cls: 'badge-red'   },
        missed:      { label: 'Manqué',     cls: 'badge-amber' },
        cancelled:   { label: 'Annulé',    cls: 'badge-red'   },
        pending:     { label: 'En attente', cls: 'badge-blue'  },
    };
    const s = map[status] || { label: status, cls: 'badge-blue' };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'fr-FR';
    const { restaurantSlug } = useParams();
    const slug = restaurantSlug || user?.slug || '';

    const [stats, setStats]       = useState<any>(null);
    const [loading, setLoading]   = useState(true);
    const [dateRange, setDateRange] = useState<'today'|'7d'|'30d'|'all'>('all');

    useEffect(() => { fetchStats(); }, [dateRange]); // eslint-disable-line

    const fetchStats = async () => {
        try {
            const today = new Date();
            const params: any = { dateRange };
            if (dateRange === 'today') {
                params.startDate = params.endDate = today.toISOString().split('T')[0];
            } else if (dateRange !== 'all') {
                const days = dateRange === '7d' ? 7 : 30;
                const start = new Date(); start.setDate(start.getDate() - days);
                params.startDate = start.toISOString().split('T')[0];
                params.endDate = today.toISOString().split('T')[0];
            }
            const r = await dashboardAPI.getStats(params);
            setStats(r.data);
        } catch (e) {
            console.error('Failed to fetch stats:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <span className="loading" />
            </div>
        );
    }

    const totalBookings   = stats?.bookings?.total      || 0;
    const confirmed       = stats?.bookings?.confirmed  || 0;
    const cancelled       = stats?.bookings?.cancelled  || 0;
    const totalCalls      = stats?.calls?.total         || 0;
    const totalGuests     = stats?.bookings?.totalGuests || 0;
    const avgDuration     = stats?.calls?.avgDuration   || 0;
    const successRate     = totalBookings > 0 ? Math.round((confirmed / totalBookings) * 100) : 0;
    const recentBookings  = stats?.recent?.bookings     || [];
    const recentCalls     = stats?.recent?.calls        || [];

    const rangeLabels: Record<string, string> = { today: 'Auj.', '7d': '7j', '30d': '30j', all: 'Tout' };

    return (
        <div style={{ background: 'var(--bg0)', minHeight: 'calc(100vh - 46px)', padding: '28px 24px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                {/* ── Header row ──────────────────────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--t1)', margin: 0 }}>
                            {t('dashboard.title')}
                        </h1>
                        <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>
                            {t('dashboard.welcome')} {user?.owner_name || user?.name}
                        </p>
                    </div>
                    {/* Period selector */}
                    <div style={{
                        display: 'flex', gap: '2px',
                        background: 'var(--bg2)', border: '1px solid var(--line2)',
                        borderRadius: 'var(--r6)', padding: '3px',
                    }}>
                        {(['today','7d','30d','all'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setDateRange(r)}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: '10px',
                                    fontWeight: dateRange === r ? 600 : 400,
                                    color: dateRange === r ? 'var(--t1)' : 'var(--t3)',
                                    background: dateRange === r ? 'var(--bg4)' : 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--r4)',
                                    cursor: 'pointer',
                                    transition: 'all 120ms',
                                }}
                            >
                                {rangeLabels[r]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Info band: Numéro IA + BCC ────────────────────── */}
                {(user?.vapi_phone_number || user?.bcc_email) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                        {user?.vapi_phone_number && (
                            <div style={{
                                background: 'var(--bg2)', border: '1px solid var(--line)',
                                borderRadius: 'var(--r8)', padding: '14px 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <Phone size={14} style={{ color: 'var(--acc)', flexShrink: 0 }} />
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '9px', color: 'var(--t3)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Numéro IA</p>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', fontFamily: 'monospace', margin: 0 }}>{user.vapi_phone_number}</p>
                                    </div>
                                </div>
                                <CopyBtn value={user.vapi_phone_number} />
                            </div>
                        )}
                        {user?.bcc_email && (
                            <div style={{
                                background: 'var(--bg2)', border: '1px solid var(--line)',
                                borderRadius: 'var(--r8)', padding: '14px 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <Calendar size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '9px', color: 'var(--t3)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Adresse BCC</p>
                                        <p style={{ fontSize: '11px', color: 'var(--t1)', fontFamily: 'monospace', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.bcc_email}</p>
                                    </div>
                                </div>
                                <CopyBtn value={user.bcc_email} />
                            </div>
                        )}
                    </div>
                )}

                {/* ── 4 Metrics ──────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <MetricCard
                        label={t('dashboard.stats.bookings')}
                        value={totalBookings}
                        delta={stats?.bookings?.change}
                        href={`/r/${slug}/bookings`}
                        positive={totalBookings > 0}
                    />
                    <MetricCard
                        label={t('dashboard.stats.calls')}
                        value={totalCalls}
                        delta={stats?.calls?.change}
                        href={`/r/${slug}/calls`}
                        positive={totalCalls > 0}
                    />
                    <MetricCard
                        label={t('dashboard.stats.guests')}
                        value={totalGuests}
                        delta={stats?.bookings?.guestsChange}
                        href={`/r/${slug}/bookings`}
                        positive={totalGuests > 0}
                    />
                    <MetricCard
                        label={t('dashboard.stats.avgDuration')}
                        value={fmt(avgDuration)}
                        delta={stats?.calls?.durationChange}
                        href={`/r/${slug}/calls`}
                        positive={avgDuration > 0}
                    />
                </div>

                {/* ── 2-column grid ───────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                    {/* Booking status */}
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r8)', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t1)', margin: 0 }}>
                                {t('dashboard.bookingStatus')}
                            </h2>
                            <Link to={`/r/${slug}/bookings`} style={{ fontSize: '10px', color: 'var(--acc)', textDecoration: 'none' }}>
                                Voir tout →
                            </Link>
                        </div>

                        {totalBookings === 0 ? (
                            <p style={{ fontSize: '11px', color: 'var(--t3)', fontStyle: 'italic' }}>Données à venir</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[{ label: t('dashboard.confirmed'), value: confirmed, color: 'var(--acc)' },
                                  { label: t('dashboard.cancelled'), value: cancelled, color: 'var(--red)'  }]
                                  .map(({ label, value, color }) => (
                                    <div key={label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--t2)' }}>{label}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--t1)', fontWeight: 500 }}>{value}</span>
                                        </div>
                                        <div style={{ height: '3px', background: 'var(--bg4)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '2px',
                                                background: color,
                                                width: `${Math.round((value / Math.max(totalBookings, 1)) * 100)}%`,
                                                transition: 'width 600ms ease',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--t3)' }}>{t('dashboard.successRate')}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <TrendingUp size={11} style={{ color: 'var(--acc)' }} />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--acc)' }}>{successRate}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent bookings */}
                        {recentBookings.length > 0 && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                                <p style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                    {t('dashboard.recentBookings')}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {recentBookings.slice(0, 3).map((b: any) => (
                                        <div key={b.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '8px 10px', background: 'var(--bg1)',
                                            border: '1px solid var(--line)', borderRadius: 'var(--r6)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                <Users size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.guest_name || 'Client'}</p>
                                                    <p style={{ fontSize: '10px', color: 'var(--t3)', margin: 0 }}>{b.booking_time} · {b.party_size || b.covers || 0} cvts</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={b.status} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent calls */}
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r8)', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t1)', margin: 0 }}>
                                {t('dashboard.recentCalls')}
                            </h2>
                            <Link to={`/r/${slug}/calls`} style={{ fontSize: '10px', color: 'var(--acc)', textDecoration: 'none' }}>
                                Voir tout →
                            </Link>
                        </div>

                        {recentCalls.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
                                <Phone size={22} style={{ color: 'var(--bg5)', marginBottom: '8px' }} />
                                <p style={{ fontSize: '11px', color: 'var(--t3)', textAlign: 'center' }}>{t('dashboard.noCalls1')}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {recentCalls.slice(0, 5).map((c: any) => (
                                    <div
                                        key={c.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '9px 10px',
                                            background: 'var(--bg1)', border: '1px solid var(--line)',
                                            borderRadius: 'var(--r6)', cursor: 'default',
                                            transition: 'background 120ms',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg1)')}
                                    >
                                        {/* Green dot */}
                                        <span style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: 'var(--acc)', flexShrink: 0,
                                        }} />
                                        {/* Number + date */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--t1)', margin: 0, fontFamily: 'monospace' }}>
                                                {fmtPhone(c.caller_number || '')}
                                            </p>
                                            <p style={{ fontSize: '10px', color: 'var(--t3)', margin: 0 }}>
                                                {fmtDate(c.created_at || c.started_at, locale)} · {fmt(c.duration || 0)}
                                            </p>
                                        </div>
                                        <StatusBadge status={c.status || 'completed'} />
                                        {/* Play button */}
                                        {c.recording_url && (
                                            <a
                                                href={c.recording_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    background: 'var(--acc2)', color: 'var(--acc)',
                                                    border: '1px solid rgba(184,224,74,0.15)',
                                                    borderRadius: '3px', padding: '2px 7px',
                                                    fontSize: '9px', fontWeight: 600,
                                                    textDecoration: 'none', flexShrink: 0,
                                                }}
                                            >
                                                <Play size={9} />
                                                Écouter
                                            </a>
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
