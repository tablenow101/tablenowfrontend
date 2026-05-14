import React, { useCallback, useEffect, useState } from 'react';
import { bookingsAPI } from '../lib/api';
import { Calendar, Search, AlertTriangle, X } from 'lucide-react';
import { useLang } from '../hooks/useLang';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
    id: string;
    status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    source?: string;
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    booked_for?: string;
    booking_date?: string;
    booking_time?: string;
    covers?: number;
    party_size?: number;
    special_requests?: string;
    confirmation_number?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBookingName(b: Booking) { return b.guest_name || 'Client'; }

function getBookingDate(b: Booking) {
    const dateStr = b.booked_for || b.booking_date;
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    const date = d.toLocaleDateString('fr-FR');
    return `${day.charAt(0).toUpperCase() + day.slice(1, 3)}. ${date}`;
}

function getBookingTime(b: Booking) {
    if (b.booked_for) return new Date(b.booked_for).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return b.booking_time || '—';
}

function getGuestCount(b: Booking) { return b.covers || b.party_size || 0; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function CancelModal({ booking, onConfirm, onClose }: {
    booking: Booking;
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div
                className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-red-500/10">
                        <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Annuler la réservation ?</h3>
                    <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <p className="text-xs text-gray-400 mb-1">
                    <span className="text-white font-medium">{getBookingName(booking)}</span>
                    {' '}— {getBookingDate(booking)} à {getBookingTime(booking)}
                </p>
                <p className="text-xs text-gray-500 mb-5">Cette action est irréversible.</p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-xl text-xs font-medium text-gray-400 border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors"
                    >
                        Retour
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-500/80 hover:bg-red-500 transition-colors"
                    >
                        Confirmer l'annulation
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

// statusConfig built dynamically below
// statusConfig est maintenant une fonction qui utilise t()
const getStatusConfig = (t: (k: string) => string): Record<string, { label: string; cls: string }> => ({
    confirmed: { label: t('statusConfirmed'),  cls: 'bg-[#b8f000]/10 text-[#b8f000] border-[#b8f000]/20' },
    cancelled: { label: t('statusCancelled2'), cls: 'bg-red-500/10 text-red-400 border-red-500/20'       },
    completed: { label: t('statusCompleted2'), cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'    },
    no_show:   { label: t('statusNoShow'),     cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20'    },
    pending:   { label: t('pending'),          cls: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20' },
});



// ─── Booking detail drawer ────────────────────────────────────────────────────
function BookingDetailDrawer({ booking, onClose, onCancel }: { booking: Booking; onClose: () => void; onCancel: () => void }) {
    const { t } = useLang();
    const statusCfg: Record<string, { label: string; bg: string; color: string }> = {
        confirmed: { label: t('statusConfirmed'),  bg: '#1a2a00', color: '#b8f000' },
        cancelled: { label: t('statusCancelled2'), bg: '#2a0000', color: '#ef4444' },
        completed: { label: t('statusCompleted2'), bg: '#0a1a2a', color: '#60a5fa' },
        no_show:   { label: t('statusNoShow'),     bg: '#1a1a1a', color: '#888'    },
    };
    const st = statusCfg[booking.status] || statusCfg.confirmed;
    const time = booking.booked_for
        ? new Date(booking.booked_for).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : booking.booking_time || '—';
    const date = booking.booked_for
        ? new Date(booking.booked_for).toLocaleDateString('fr-FR')
        : booking.booking_date || '—';

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-sm bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
                    <h2 className="text-base font-bold text-white">Détails réservation</h2>
                    <button onClick={onClose} className="text-[#555] hover:text-white">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Infos résa */}
                    <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4">
                        <p className="text-base font-bold text-white mb-3">{booking.guest_name || 'Client'}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">DATE</p>
                                <p className="text-sm text-white">{date}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">HEURE</p>
                                <p className="text-base font-bold" style={{ color: '#b8f000' }}>{time}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">COUVERTS</p>
                                <p className="text-sm text-white">{booking.party_size || booking.covers || 0} personnes</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">STATUT</p>
                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* Appel associé */}
                    <div>
                        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-3">APPEL ASSOCIÉ</p>
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
                            {/* Audio player */}
                            <div className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3">
                                <button className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#b8f000' }}>
                                    <svg width="14" height="14" fill="#000" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </button>
                                <div className="flex-1 h-1 bg-[#2a2a2a] rounded-full">
                                    <div className="w-1/3 h-full rounded-full" style={{ background: '#b8f000' }} />
                                </div>
                                <span className="text-xs text-[#555] flex-shrink-0">—</span>
                            </div>
                            {/* Transcript */}
                            <div>
                                <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">TRANSCRIPT</p>
                                <p className="text-xs text-[#888] leading-relaxed">Transcript disponible dans le journal des appels</p>
                            </div>
                            {/* Download buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button className="px-3 py-2 rounded-xl text-xs text-[#888] bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444] transition-colors">
                                    {t('downloadTranscriptBtn')}
                                </button>
                                <button className="px-3 py-2 rounded-xl text-xs text-[#888] bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444] transition-colors">
                                    {t('downloadAudioBtn')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bouton annuler */}
                    {booking.status === 'confirmed' && (
                        <button
                            onClick={onCancel}
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
                            style={{ background: '#2a0000', color: '#ef4444' }}
                        >
                            Annuler la réservation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const Bookings: React.FC = () => {
    const { t } = useLang();
    const [bookings, setBookings]         = useState<Booking[]>([]);
    const [loading, setLoading]           = useState(true);
    const [filter, setFilter]             = useState('all');
    const [searchTerm, setSearchTerm]     = useState('');
    const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
    const [cancelling, setCancelling]     = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const fetchBookings = useCallback(async () => {
        try {
            const params: Record<string, string> = {};
            if (filter !== 'all') params.status = filter;
            const response = await bookingsAPI.getAll(params);
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Erreur lors du chargement des réservations:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const handleCancelConfirm = useCallback(async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await bookingsAPI.cancel(cancelTarget.id);
            await fetchBookings();
        } catch (err) {
            console.error('Erreur annulation:', err);
        } finally {
            setCancelling(false);
            setCancelTarget(null);
        }
    }, [cancelTarget, fetchBookings]);

    const filteredBookings = bookings.filter(b =>
        getBookingName(b).toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.confirmation_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loading w-12 h-12" />
            </div>
        );
    }

    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const totalGuests    = bookings.reduce((sum, b) => sum + getGuestCount(b), 0);

    return (
        <div className="space-y-6">

            {/* Cancel modal */}
            {selectedBooking && <BookingDetailDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} onCancel={() => { setCancelTarget(selectedBooking); setSelectedBooking(null); }} />}

            {cancelTarget && (
                <CancelModal
                    booking={cancelTarget}
                    onConfirm={handleCancelConfirm}
                    onClose={() => !cancelling && setCancelTarget(null)}
                />
            )}

            {/* Header + filter pills */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('resaPageTitle')}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{t('resaPageSub')}</p>
                </div>
                <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
                    {[
                        { key: 'all',       label: t('all2')      },
                        { key: 'confirmed', label: t('confirmed') },
                        { key: 'cancelled', label: t('cancelled') },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className="px-3 py-1.5 text-xs font-bold transition-colors"
                            style={filter === key ? { background: '#b8f000', color: '#000' } : { color: '#888' }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: t('total').toUpperCase(),      value: bookings.length, color: 'text-white',      sub: t('resasDesc') },
                    { label: t('confirmed').toUpperCase(), value: confirmedCount,  color: 'text-[#b8f000]',  sub: t('tablesSecured')             },
                    { label: t('cancelled').toUpperCase(),   value: cancelledCount,  color: 'text-red-400',    sub: t('slotsFreed')             },
                    { label: t('covers').toUpperCase(),   value: totalGuests,     color: 'text-white',      sub: t('expected')         },
                ].map(({ label, value, color, sub }) => (
                    <div key={label} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 flex flex-col gap-2">
                        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">{label}</p>
                        <p className={`text-4xl font-bold leading-none ${color}`}>{value}</p>
                        <p className="text-xs text-[#555]">{sub}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
                <input
                    type="text"
                    placeholder="Rechercher par nom, email, confirmation..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-[#111] border border-[#2a2a2a] text-white placeholder-[#555] focus:outline-none focus:border-[#b8f000]/50 transition-colors"
                />
            </div>

            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] overflow-hidden">
                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                    <div className="grid items-center px-5 py-3 border-b border-[#1f1f1f]"
                        style={{ gridTemplateColumns: "1.8fr 1.2fr 90px 70px 110px 90px", minWidth: "580px" }}>
                        {[t('client'), t('date'), t('time'), 'COUV.', t('status'), ''].map(h => (
                            <span key={h} className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">{h}</span>
                        ))}
                    </div>
                    {filteredBookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar size={32} className="mx-auto text-gray-700 mb-3" />
                            <p className="text-sm text-gray-500">{t('noResas')}</p>
                        </div>
                    ) : (() => {
                        const statusConfig = getStatusConfig(t);
                        return filteredBookings.map((booking) => {
                            const st = statusConfig[booking.status] || statusConfig.confirmed;
                            return (
                                <div
                                    key={booking.id}
                                    className="grid items-center px-5 py-3.5 border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors cursor-pointer"
                                    style={{ gridTemplateColumns: "1.8fr 1.2fr 90px 70px 110px 90px", minWidth: "580px" }}
                                    onClick={() => setSelectedBooking(booking)}
                                >
                                    <span className="text-sm font-medium text-white truncate pr-3">{getBookingName(booking)}</span>
                                    <span className="text-sm text-[#888]">{getBookingDate(booking)}</span>
                                    <span className="text-sm font-bold" style={{ color: '#b8f000' }}>{getBookingTime(booking)}</span>
                                    <span className="text-sm text-white">{getGuestCount(booking)}</span>
                                    <span>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${st.cls}`}>{st.label}</span>
                                    </span>
                                    <span>
                                        {booking.status === 'confirmed' && (
                                            <button
                                                onClick={e => { e.stopPropagation(); setCancelTarget(booking); }}
                                                className="px-2.5 py-1 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                                            >
                                                Annuler
                                            </button>
                                        )}
                                    </span>
                                </div>
                            );
                        });
                    })()}
                </div>

                {/* Mobile card view */}
                <div className="sm:hidden">
                    {filteredBookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar size={32} className="mx-auto text-gray-700 mb-3" />
                            <p className="text-sm text-gray-500">{t('noResas')}</p>
                        </div>
                    ) : (() => {
                        const statusConfig = getStatusConfig(t);
                        return filteredBookings.map((booking) => {
                            const st = statusConfig[booking.status] || statusConfig.confirmed;
                            return (
                                <div
                                    key={booking.id}
                                    className="border-b border-[#1a1a1a] last:border-0 p-4 cursor-pointer active:bg-[#161616] transition-colors"
                                    onClick={() => setSelectedBooking(booking)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-sm font-bold text-white">{getBookingName(booking)}</span>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border flex-shrink-0 ml-2 ${st.cls}`}>{st.label}</span>
                                    </div>
                                    <div className="space-y-2 text-xs text-[#888]">
                                        <div className="flex justify-between">
                                            <span>{t('date')}:</span>
                                            <span className="text-white">{getBookingDate(booking)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('time')}:</span>
                                            <span className="text-[#b8f000] font-bold">{getBookingTime(booking)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>COUV.:</span>
                                            <span className="text-white">{getGuestCount(booking)}</span>
                                        </div>
                                    </div>
                                    {booking.status === 'confirmed' && (
                                        <button
                                            onClick={e => { e.stopPropagation(); setCancelTarget(booking); }}
                                            className="mt-3 w-full px-2.5 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>
        </div>
    );
};

export default Bookings;
