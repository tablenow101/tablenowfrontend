import React, { useCallback, useEffect, useState } from 'react';
import { dashboardAPI } from '../lib/api';
import { useLang } from '../context/LangContext';
import { X } from 'lucide-react';

interface CallLog {
    id: string;
    caller_number?: string;
    guest_name?: string;
    status: string;
    duration?: number;
    transcript?: string;
    recording_url?: string;
    reservation_booked?: boolean;
    created_at?: string;
    started_at?: string;
}

function fmtDuration(s?: number): string {
    if (!s) return '0s';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec > 0 ? `${m}min${String(sec).padStart(2,'0')}s` : `${m}min`;
}

function fmtTimestamp(ts?: string): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' }) +
        ' · ' + new Date(ts).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

function downloadText(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function CallDrawer({ call, onClose, t }: { call: CallLog; onClose: () => void; t: (k: string) => string }) {
    const dotColor = call.status === 'completed' ? '#b8f000'
        : call.status === 'missed' ? '#f59e0b' : '#ef4444';
    const statusLabel = call.status === 'completed' ? t('statusCompleted')
        : call.status === 'missed' ? t('statusMissed') : t('statusFailed');
    const name = call.guest_name || call.caller_number || '—';

    const handleDownloadTranscript = () => {
        if (!call.transcript) return;
        const filename = `transcript-${call.id}-${(call.created_at || '').slice(0,10)}.txt`;
        downloadText(call.transcript, filename);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-end" onClick={onClose}>
            <div
                className="w-[500px] bg-[#111] border-l border-[#2a2a2a] h-full overflow-y-auto p-7"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">{t('callDetails')}</h2>
                    <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Meta */}
                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 mb-5">
                    <p className={`text-base font-bold mb-3 ${call.guest_name ? 'text-white' : 'text-white font-mono'}`}>{name}</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">{t('status')}</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                                <span className="text-sm font-semibold" style={{ color: dotColor }}>{statusLabel}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">{t('duration')}</p>
                            <p className="text-sm text-white">{fmtDuration(call.duration)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">DATE</p>
                            <p className="text-sm text-white">{fmtTimestamp(call.created_at || call.started_at)}</p>
                        </div>
                    </div>
                    {call.reservation_booked && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                            <span className="text-xs px-2 py-0.5 rounded border bg-[#b8f00015] text-[#b8f000] border-[#b8f00040]">
                                {t('resaCreated')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Audio */}
                <div className="mb-5">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-3">{t('audioRecording')}</p>
                    {call.recording_url ? (
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4">
                            <audio controls className="w-full" style={{ accentColor: '#b8f000' }}>
                                <source src={call.recording_url} />
                            </audio>
                            <a
                                href={call.recording_url}
                                download={`appel-${call.id}.mp3`}
                                className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-[#888] hover:text-white hover:border-[#b8f000] transition-colors"
                            >
                                {t('downloadAudio')}
                            </a>
                        </div>
                    ) : (
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#555] flex-shrink-0">▶</div>
                            <div className="flex-1 h-1 bg-[#2a2a2a] rounded" />
                            <span className="text-xs text-[#555]">—</span>
                        </div>
                    )}
                </div>

                {/* Transcript */}
                <div>
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-3">{t('transcript')}</p>
                    {call.transcript ? (
                        <>
                            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 max-h-[220px] overflow-y-auto mb-3">
                                <p className="text-xs text-[#ccc] leading-[1.9] whitespace-pre-wrap">{call.transcript}</p>
                            </div>
                            <button
                                onClick={handleDownloadTranscript}
                                className="w-full py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-[#888] hover:text-white hover:border-[#b8f000] transition-colors"
                            >
                                {t('downloadTranscript')}
                            </button>
                        </>
                    ) : (
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4">
                            <p className="text-xs text-[#555] text-center">{t('noTranscript')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const CallLogs: React.FC = () => {
    const { t } = useLang();
    const [calls, setCalls]       = useState<CallLog[]>([]);
    const [total, setTotal]       = useState(0);
    const [loading, setLoading]   = useState(true);
    const [selected, setSelected] = useState<CallLog | null>(null);

    const fetchCalls = useCallback(async () => {
        try {
            const res = await dashboardAPI.getCalls({ limit: 100 });
            setCalls(res.data.calls || []);
            setTotal(res.data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCalls(); }, [fetchCalls]);

    const completedCalls = calls.filter(c => c.status === 'completed').length;
    const totalDuration  = calls.reduce((s, c) => s + (c.duration || 0), 0);
    const avgDuration    = calls.length ? Math.round(totalDuration / calls.length) : 0;

    function fmtTotalDuration(s: number): string {
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}min`;
        const h = Math.floor(m / 60);
        const rem = m % 60;
        return rem > 0 ? `${h}h${String(rem).padStart(2,'0')}` : `${h}h`;
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            {selected && <CallDrawer call={selected} onClose={() => setSelected(null)} t={t} />}

            <div>
                <h1 className="text-2xl font-bold text-white">{t('callsTitle')}</h1>
                <p className="text-sm text-[#888] mt-1">{t('callsSub')}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">{t('total')}</p>
                    <p className="text-[40px] font-bold text-white leading-none">{total}</p>
                    <p className="text-xs mt-1.5 text-[#888]">{t('callsReceived')}</p>
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">{t('completed')}</p>
                    <p className="text-[40px] font-bold leading-none" style={{ color: '#b8f000' }}>{completedCalls}</p>
                    <p className="text-xs mt-1.5 text-[#888]">{t('successfulDesc')}</p>
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">{t('avgDuration')}</p>
                    <p className="text-[40px] font-bold text-white leading-none">{fmtDuration(avgDuration)}</p>
                    <p className="text-xs mt-1.5 text-[#888]">{t('perCall')}</p>
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2">{t('totalDuration')}</p>
                    <p className="text-[40px] font-bold text-white leading-none">{fmtTotalDuration(totalDuration)}</p>
                    <p className="text-xs mt-1.5 text-[#888]">{t('conversations')}</p>
                </div>
            </div>

            {/* List */}
            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1a1a1a]">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">{t('history')}</p>
                </div>
                {calls.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#555]">—</div>
                ) : (
                    calls.map(call => {
                        const dotColor = call.status === 'completed' ? '#b8f000'
                            : call.status === 'missed' ? '#f59e0b' : '#ef4444';
                        const statusLabel = call.status === 'completed' ? t('statusCompleted')
                            : call.status === 'missed' ? t('statusMissed') : t('statusFailed');
                        const name = call.guest_name || call.caller_number || '—';
                        const isMono = !call.guest_name;

                        return (
                            <div
                                key={call.id}
                                className="flex items-center px-5 py-3.5 border-b border-[#1a1a1a] last:border-0 cursor-pointer hover:bg-[#0f0f0f] transition-colors"
                                onClick={() => setSelected(call)}
                            >
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-4" style={{ background: dotColor }} />
                                {/* Name — fixed width */}
                                <span className={`text-sm flex-shrink-0 w-[150px] ${isMono ? 'font-mono text-white' : 'font-medium text-white'}`}>{name}</span>
                                {/* Status badge — fixed width */}
                                <span className={`text-[11px] px-2 py-0.5 rounded border flex-shrink-0 w-[90px] text-center ${
                                    call.status === 'completed' ? 'bg-[#b8f00015] text-[#b8f000] border-[#b8f00040]'
                                    : call.status === 'missed' ? 'bg-[#f59e0b15] text-[#f59e0b] border-[#f59e0b40]'
                                    : 'bg-[#ef444415] text-[#ef4444] border-[#ef444440]'
                                }`}>
                                    {statusLabel}
                                </span>
                                {/* Date — fixed width */}
                                <span className="text-xs text-[#888] flex-shrink-0 w-[110px] text-right">{fmtTimestamp(call.created_at || call.started_at)}</span>
                                {/* Duration — fixed width */}
                                <span className="text-xs text-[#555] flex-shrink-0 w-[52px] text-right">{fmtDuration(call.duration)}</span>
                                {/* Resa badge */}
                                <span className="flex-shrink-0 w-[130px] text-right">
                                    {call.reservation_booked && (
                                        <span className="text-[11px] px-2 py-0.5 rounded border bg-[#b8f00010] text-[#b8f000] border-[#b8f00030]">
                                            {t('resaCreated')}
                                        </span>
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

export default CallLogs;
