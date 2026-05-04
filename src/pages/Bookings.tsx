import React, { useCallback, useEffect, useState } from 'react';
import { bookingsAPI } from '../lib/api';
import { Calendar, Users, Clock, Mail, Phone, Search, Filter, XCircle, AlertTriangle, X } from 'lucide-react';

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
    if (b.booked_for) return new Date(b.booked_for).toLocaleDateString('fr-FR');
    return b.booking_date || '—';
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

const statusConfig: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Confirmé',  cls: 'bg-[#b8f000]/10 text-[#b8f000] border-[#b8f000]/20' },
    cancelled: { label: 'Annulé',    cls: 'bg-red-500/10 text-red-400 border-red-500/20'       },
    completed: { label: 'Terminé',   cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'    },
    no_show:   { label: 'No-show',   cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20'    },
};

const sourceLabel: Record<string, string> = {
    vapi:   '📞 Téléphone',
    phone:  '📞 Téléphone',
    manual: '✍️ Manuel',
    web:    '🌐 Web',
};


// ─── Booking detail drawer ────────────────────────────────────────────────────
function BookingDetailDrawer({ booking, onClose }: { booking: Booking; onClose: () => void }) {
    const downloadTranscript = (text: string) => {
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `transcript-${booking.id}.txt`;
        a.click();
    };
    const statusCfg: Record<string, { label: string; color: string }> = {
        confirmed: { label: 'Confirmé',   color: '#b8f000' },
        pending:   { label: 'En attente', color: '#f59e0b' },
        cancelled: { label: 'Annulé',     color: '#ef4444' },
    };
    const st = statusCfg[booking.status] || statusCfg.pending;
    const time = booking.booked_for
        ? new Date(booking.booked_for).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : booking.booking_time || '—';
    const date = booking.booked_for
        ? new Date(booking.booked_for).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : booking.booking_date || '—';

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-end" onClick={onClose}>
            <div className="w-[480px] bg-[#111] border-l border-[#2a2a2a] h-full overflow-y-auto p-7" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Détails réservation</h2>
                    <button onClick={onClose} className="text-[#555] hover:text-white p-1"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 mb-5">
                    <p className="text-lg font-bold text-white mb-3">{booking.guest_name || 'Client'}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">DATE</p><p className="text-white capitalize">{date}</p></div>
                        <div><p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">HEURE</p><p className="text-[15px] font-bold" style={{ color: '#b8f000' }}>{time}</p></div>
                        <div><p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">COUVERTS</p><p className="text-white">{booking.party_size || booking.covers || 0} personnes</p></div>
                        <div><p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">STATUT</p><span className="text-sm font-semibold" style={{ color: st.color }}>{st.label}</span></div>
                    </div>
                    {booking.special_requests && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a]"><p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">DEMANDES SPÉCIALES</p><p className="text-xs text-[#888]">{booking.special_requests}</p></div>
                    )}
                    {booking.confirmation_number && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a]"><p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">N° CONFIRMATION</p><p className="text-xs font-mono text-[#888]">{booking.confirmation_number}</p></div>
                    )}
                </div>
                <div>
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-3">APPEL ASSOCIÉ</p>
                    <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 text-xs text-[#555] italic text-center">
                        Transcripts disponibles dans le journal des appels
                    </div>
                </div>
            </div>
        </div>
    );
}

const Bookings: React.FC = () => {
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
            {selectedBooking && <BookingDetailDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}

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
                    <h1 className="text-2xl font-bold text-white">Réservations</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Cliquez sur une ligne pour les détails et le transcript</p>
                </div>
                <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
                    {[
                        { key: 'all',       label: 'Toutes'     },
                        { key: 'confirmed', label: 'Confirmées' },
                        { key: 'cancelled', label: 'Annulées'   },
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total',      value: bookings.length, color: 'text-white'     },
                    { label: 'Confirmées', value: confirmedCount,  color: 'text-[#b8f000]' },
                    { label: 'Annulées',   value: cancelledCount,  color: 'text-red-400'   },
                    { label: 'Couverts',   value: totalGuests,     color: 'text-white'     },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
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
                {/* Table header */}
                <div className="grid items-center px-5 py-3 border-b border-[#1f1f1f]"
                    style={{ gridTemplateColumns: '1.8fr 1fr 90px 70px 130px 110px 90px' }}>
                    {['CLIENT','DATE','HEURE','COUV.','SOURCE','STATUT',''].map(h => (
                        <span key={h} className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">{h}</span>
                    ))}
                </div>

                {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar size={32} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500">Aucune réservation trouvée</p>
                    </div>
                ) : (
                    filteredBookings.map((booking) => {
                        const st = statusConfig[booking.status] || statusConfig.confirmed;
                        return (
                            <div
                                key={booking.id}
                                className="grid items-center px-5 py-3.5 border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors cursor-pointer"
                                style={{ gridTemplateColumns: '1.8fr 1fr 90px 70px 130px 110px 90px' }}
                                onClick={() => setSelectedBooking(booking)}
                            >
                                <span className="text-sm font-medium text-white truncate pr-3">{getBookingName(booking)}</span>
                                <span className="text-sm text-[#888]">{getBookingDate(booking)}</span>
                                <span className="text-sm font-bold" style={{ color: '#b8f000' }}>{getBookingTime(booking)}</span>
                                <span className="text-sm text-white">{getGuestCount(booking)}</span>
                                <span className="text-xs text-[#888]">{sourceLabel[booking.source || ''] || booking.source || '—'}</span>
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
                    })
                )}
            </div>
        </div>
    );
};

export default Bookings;
