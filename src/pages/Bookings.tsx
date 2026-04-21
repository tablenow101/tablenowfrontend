import React, { useEffect, useState } from 'react';
import { bookingsAPI } from '../lib/api';
import { Calendar, Users, Clock, Mail, Phone, Search, Filter, Plus, XCircle } from 'lucide-react';

const Bookings: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    const fetchBookings = async () => {
        try {
            const params: any = {};
            if (filter !== 'all') params.status = filter;
            const response = await bookingsAPI.getAll(params);
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Erreur lors du chargement des réservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBookingName = (booking: any) => booking.guest_name || 'Client';

    const getBookingDate = (booking: any) => {
        if (booking.booked_for) {
            return new Date(booking.booked_for).toLocaleDateString('fr-FR');
        }
        return booking.booking_date || '—';
    };

    const getBookingTime = (booking: any) => {
        if (booking.booked_for) {
            return new Date(booking.booked_for).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        return booking.booking_time || '—';
    };

    const getGuestCount = (booking: any) => booking.covers || booking.party_size || 0;

    const filteredBookings = bookings.filter(b =>
        getBookingName(b).toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.confirmation_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusConfig: Record<string, { label: string; cls: string }> = {
        confirmed: { label: 'Confirmé',   cls: 'bg-green-500/10 text-green-400 border-green-500/20'  },
        cancelled: { label: 'Annulé',     cls: 'bg-red-500/10 text-red-400 border-red-500/20'        },
        completed: { label: 'Terminé',    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'     },
        no_show:   { label: 'No-show',    cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20'     },
    };

    const sourceLabel: Record<string, string> = {
        vapi:   '📞 Téléphone',
        phone:  '📞 Téléphone',
        manual: '✍️ Manuel',
        web:    '🌐 Web',
    };

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

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Réservations</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gérez l'ensemble de vos réservations</p>
            </div>

            {/* Search & Filter */}
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou numéro de confirmation..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[#0f0f0f] border border-[#1f1f1f] text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-500 flex-shrink-0" />
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl text-sm bg-[#0f0f0f] border border-[#1f1f1f] text-white focus:outline-none focus:border-green-500/50 transition-colors"
                        >
                            <option value="all">Toutes</option>
                            <option value="confirmed">Confirmées</option>
                            <option value="cancelled">Annulées</option>
                            <option value="completed">Terminées</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total',      value: bookings.length, color: 'text-white'      },
                    { label: 'Confirmées', value: confirmedCount,  color: 'text-green-400'  },
                    { label: 'Annulées',   value: cancelledCount,  color: 'text-red-400'    },
                    { label: 'Couverts',   value: totalGuests,     color: 'text-white'      },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
                <h2 className="text-sm font-semibold text-white mb-4">
                    {filteredBookings.length} réservation{filteredBookings.length !== 1 ? 's' : ''}
                </h2>

                {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar size={32} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500">Aucune réservation trouvée</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredBookings.map((booking) => {
                            const st = statusConfig[booking.status] || statusConfig.confirmed;
                            return (
                                <div key={booking.id} className="rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] p-4 hover:border-[#2a2a2a] transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <h3 className="text-sm font-semibold text-white">{getBookingName(booking)}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>
                                                    {st.label}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {sourceLabel[booking.source] || booking.source}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1.5"><Calendar size={13} />{getBookingDate(booking)}</span>
                                                <span className="flex items-center gap-1.5"><Clock size={13} />{getBookingTime(booking)}</span>
                                                <span className="flex items-center gap-1.5"><Users size={13} />{getGuestCount(booking)} couvert{getGuestCount(booking) > 1 ? 's' : ''}</span>
                                                {booking.guest_email && <span className="flex items-center gap-1.5"><Mail size={13} /><span className="truncate max-w-[200px]">{booking.guest_email}</span></span>}
                                                {booking.guest_phone && <span className="flex items-center gap-1.5"><Phone size={13} />{booking.guest_phone}</span>}
                                            </div>
                                            {booking.special_requests && (
                                                <div className="mt-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-400/80">
                                                    <strong>Demandes spéciales :</strong> {booking.special_requests}
                                                </div>
                                            )}
                                            {booking.confirmation_number && (
                                                <p className="mt-1 text-xs text-gray-600">
                                                    Confirmation : <span className="font-mono font-medium text-gray-400">{booking.confirmation_number}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Annuler cette réservation ?')) {
                                                            bookingsAPI.cancel(booking.id).then(() => fetchBookings());
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                                                >
                                                    <XCircle size={13} /> Annuler
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookings;
