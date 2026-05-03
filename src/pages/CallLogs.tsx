import React, { useCallback, useEffect, useState } from 'react';
import { dashboardAPI } from '../lib/api';
import { Phone, Download, X, ArrowUpRight } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LIME = '#b8f000';

function fmtDuration(s: number): string {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}min${sec > 0 ? sec + 's' : ''}` : `${s}s`;
}

function fmtDateTime(ts: string): string {
    const d = new Date(ts);
    return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function maskPhone(n?: string): string {
    if (!n) return 'Inconnu';
    const clean = n.replace(/\s/g, '');
    if (clean.length < 8) return n;
    return clean.slice(0, 4) + ' ' + clean.slice(4, 6) + ' ··· ' + clean.slice(-2);
}

function getDisplayName(call: any): { name: string; isNamed: boolean } {
    if (call.caller_name) return { name: call.caller_name, isNamed: true };
    return { name: maskPhone(call.caller_number), isNamed: false };
}

function downloadTranscript(call: any) {
    if (!call.transcript) return;
    const content = [
        'TRANSCRIPTION D\'APPEL',
        '='.repeat(40),
        '',
        `Appelant : ${call.caller_name || call.caller_number || 'Inconnu'}`,
        `Date     : ${new Date(call.created_at).toLocaleString('fr-FR')}`,
        `Durée    : ${fmtDuration(call.duration || 0)}`,
        `Statut   : ${call.status}`,
        '',
        'TRANSCRIPTION :',
        '-'.repeat(40),
        '',
        call.transcript,
    ].join('\n');

    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    a.download = `transcription_${call.caller_number || 'inconnu'}_${new Date(call.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; dotColor: string; badgeCls: string }> = {
    completed:   { label: 'Terminé',   dotColor: LIME,      badgeCls: 'bg-[#b8f00015] text-[#b8f000] border-[#b8f00040]' },
    missed:      { label: 'Manqué',    dotColor: '#f59e0b', badgeCls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' },
    failed:      { label: 'Non abouti', dotColor: '#ef4444', badgeCls: 'bg-red-500/10 text-red-400 border-red-500/25'       },
    in_progress: { label: 'En cours',  dotColor: '#3b82f6', badgeCls: 'bg-blue-500/10 text-blue-400 border-blue-500/25'    },
};

// ─── Drawer ───────────────────────────────────────────────────────────────────

function CallDrawer({ call, onClose }: { call: any; onClose: () => void }) {
    const { name, isNamed } = getDisplayName(call);
    const st = STATUS[call.status] || STATUS.completed;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-end" onClick={onClose}>
            <div
                className="w-[500px] bg-[#111] border-l border-[#2a2a2a] h-full overflow-y-auto p-7"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-lg font-bold text-white">Détails de l'appel</p>
                    <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Meta */}
                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 mb-5">
                    <p className={`text-base font-bold mb-3 ${isNamed ? 'text-white' : 'text-white font-mono'}`}>{name}</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">STATUT</p>
                            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${st.badgeCls}`}>{st.label}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">DURÉE</p>
                            <p className="text-sm font-semibold text-white">{fmtDuration(call.duration || 0)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">DATE</p>
                            <p className="text-sm font-semibold text-white">{fmtDateTime(call.created_at)}</p>
                        </div>
                    </div>
                    {call.reservation_booked && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-black" style={{ background: LIME }}>✓</div>
                            <span className="text-xs font-medium" style={{ color: LIME }}>Réservation créée</span>
                        </div>
                    )}
                </div>

                {/* Audio */}
                {call.recording_url && (
                    <div className="mb-5">
                        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-3">ENREGISTREMENT AUDIO</p>
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4">
                            <audio controls className="w-full" style={{ filter: 'invert(0)' }}>
                                <source src={call.recording_url} type="audio/mpeg" />
                            </audio>
                        </div>
                    </div>
                )}

                {/* Transcript */}
                {call.transcript ? (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">TRANSCRIPT</p>
                            <button
                                onClick={() => downloadTranscript(call)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                                style={{ color: LIME, borderColor: `${LIME}40` }}
                            >
                                <Download size={13} /> Télécharger .txt
                            </button>
                        </div>
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 max-h-64 overflow-y-auto">
                            <p className="text-sm text-[#ccc] whitespace-pre-wrap leading-relaxed">{call.transcript}</p>
                        </div>
                        {call.call_summary && (
                            <div className="mt-4">
                                <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">RÉSUMÉ</p>
                                <p className="text-sm text-[#888] leading-relaxed">{call.call_summary}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-6 text-center">
                        <p className="text-sm text-[#555]">Aucun transcript disponible pour cet appel</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const CallLogs: React.FC = () => {
    const [calls, setCalls]               = useState<any[]>([]);
    const [loading, setLoading]           = useState(true);
    const [selectedCall, setSelectedCall] = useState<any>(null);

    const fetchCalls = useCallback(async () => {
        try {
            const res = await dashboardAPI.getCalls();
            setCalls(res.data.calls || []);
        } catch (err) {
            console.error('Erreur chargement appels:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCalls(); }, [fetchCalls]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const completedCount = calls.filter(c => c.status === 'completed').length;
    const avgDuration    = calls.length > 0
        ? Math.floor(calls.reduce((s, c) => s + (c.duration || 0), 0) / calls.length)
        : 0;
    const totalDuration  = calls.reduce((s, c) => s + (c.duration || 0), 0);

    return (
        <div className="space-y-6">
            {selectedCall && <CallDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Journal des appels</h1>
                <p className="text-sm text-[#555] mt-0.5">Cliquez sur un appel pour écouter l'enregistrement et télécharger le transcript</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total',         value: calls.length,               sub: 'appels reçus'             },
                    { label: 'Terminés',      value: completedCount,             sub: 'traités avec succès', lime: true },
                    { label: 'Durée moyenne', value: fmtDuration(avgDuration),   sub: 'par appel'                },
                    { label: 'Durée totale',  value: fmtDuration(totalDuration), sub: 'de conversations'         },
                ].map(({ label, value, sub, lime }) => (
                    <div key={label} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">{label}</p>
                        <p className="text-[36px] font-bold leading-none" style={{ color: lime ? LIME : '#fff' }}>{value}</p>
                        <p className="text-xs text-[#888] mt-1.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#1a1a1a]">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">HISTORIQUE — Cliquez pour transcript et audio</p>
                </div>

                {calls.length === 0 ? (
                    <div className="text-center py-16">
                        <Phone size={28} className="mx-auto text-[#333] mb-3" />
                        <p className="text-sm text-[#555]">Aucun appel pour l'instant</p>
                        <p className="text-xs text-[#333] mt-1">Les appels apparaîtront ici une fois votre assistant configuré</p>
                    </div>
                ) : (
                    calls.map((call) => {
                        const { name, isNamed } = getDisplayName(call);
                        const st = STATUS[call.status] || STATUS.completed;
                        return (
                            <div
                                key={call.id}
                                onClick={() => setSelectedCall(call)}
                                className="flex items-center gap-0 px-5 py-3.5 border-b border-[#1a1a1a] last:border-0 hover:bg-[#0f0f0f] cursor-pointer transition-colors"
                            >
                                {/* Status dot */}
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-4" style={{ background: st.dotColor }} />

                                {/* Name / number — fixed width */}
                                <span className={`text-sm flex-shrink-0 w-40 ${isNamed ? 'text-white font-medium' : 'text-white font-mono'}`}>
                                    {name}
                                </span>

                                {/* Status badge — fixed width */}
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 w-28 text-center ${st.badgeCls}`}>
                                    {st.label}
                                </span>

                                {/* Resa badge */}
                                {call.reservation_booked ? (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 bg-[#b8f00010] border-[#b8f00030] ml-2" style={{ color: LIME }}>
                                        ✓ Résa
                                    </span>
                                ) : (
                                    <span className="w-16 flex-shrink-0 ml-2" />
                                )}

                                {/* Spacer */}
                                <span className="flex-1" />

                                {/* Date — fixed width, right-aligned */}
                                <span className="text-xs text-[#888] flex-shrink-0 w-28 text-right">
                                    {fmtDateTime(call.created_at || '')}
                                </span>

                                {/* Duration — fixed width, right-aligned */}
                                <span className="text-xs text-[#555] flex-shrink-0 w-12 text-right ml-3">
                                    {fmtDuration(call.duration || 0)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CallLogs;
