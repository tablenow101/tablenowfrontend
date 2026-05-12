import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { settingsAPI } from '../lib/api';
import {
    Store, Clock, Mail, ClipboardList,
    ChevronRight, ChevronLeft, Save, Copy, Check, Rocket,
    Search, Loader2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
    { key: 'monday',    label: 'Lundi'    },
    { key: 'tuesday',   label: 'Mardi'    },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday',  label: 'Jeudi'    },
    { key: 'friday',    label: 'Vendredi' },
    { key: 'saturday',  label: 'Samedi'   },
    { key: 'sunday',    label: 'Dimanche' },
] as const;

const STEPS = [
    { icon: Search,        label: 'Prefill'       },
    { icon: Store,         label: 'Restaurant'    },
    { icon: Clock,         label: 'Horaires'      },
    { icon: Mail,          label: 'Email'         },
    { icon: ClipboardList, label: 'Récapitulatif' },
];

const DEFAULT_HOURS: Record<string, { open: boolean; from: string; to: string }> = {
    monday:    { open: true,  from: '12:00', to: '22:30' },
    tuesday:   { open: true,  from: '12:00', to: '22:30' },
    wednesday: { open: true,  from: '12:00', to: '22:30' },
    thursday:  { open: true,  from: '12:00', to: '22:30' },
    friday:    { open: true,  from: '12:00', to: '23:00' },
    saturday:  { open: true,  from: '12:00', to: '23:00' },
    sunday:    { open: false, from: '12:00', to: '22:00' },
};

const DEFAULT_SERVICES = {
    lunch:  { active: true,  from: '12:00', to: '14:30', capacity: 20 },
    dinner: { active: true,  from: '19:00', to: '22:30', capacity: 20 },
};

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Primitives ───────────────────────────────────────────────────────────────

const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0d0d1a] border border-[#252535] ' +
    'text-white placeholder-[#444] focus:outline-none focus:border-[#b8f000]/60 transition-colors';

const timeCls =
    'h-10 px-3 text-center rounded-xl text-sm bg-[#0d0d1a] border border-[#252535] ' +
    'text-white focus:outline-none focus:border-[#b8f000]/60 transition-colors';

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[10px] font-semibold text-[#666] uppercase tracking-wider mb-1.5">{children}</p>;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-150 focus:outline-none ${on ? 'bg-[#b8f000]' : 'bg-[#2a2a3a]'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 ${on ? 'bg-black' : 'bg-white'} rounded-full shadow transition-transform duration-150 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

// ─── Main ────────────────────────────────────────────────────────────────────

const Onboarding: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate   = useNavigate();
    const [step, setStep]       = useState(0);
    const [saving, setSaving]   = useState(false);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied]   = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Step 0 — Google Places prefill
    const [suggestions, setSuggestions]         = useState<Record<string, unknown>[]>([]);
    const [showDropdown, setShowDropdown]       = useState(false);
    const [loadingSuggest, setLoadingSuggest]   = useState(false);
    const [prefillLoading, setPrefillLoading]   = useState(false);
    const [prefillQuery, setPrefillQuery]       = useState('');
    const [prefillDone, setPrefillDone]         = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Step 1 — Restaurant info
    const [info, setInfo] = useState({ name: '', address: '', phone: '', cuisine_type: '' });

    // Step 2 — Horaires
    const [hours, setHours] = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);
    const [totalCapacity, setTotalCapacity] = useState(50);
    const [services, setServices] = useState(DEFAULT_SERVICES);

    // Step 3 — Email
    const [confirmationEmail, setConfirmationEmail] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await settingsAPI.get();
                const s = res.data.settings;
                setInfo({ name: s.name || '', address: s.address || '', phone: s.phone || '', cuisine_type: s.cuisine_type || '' });
                if (s.opening_hours && Object.keys(s.opening_hours).length > 0) setHours(s.opening_hours);
                if (s.services     && Object.keys(s.services).length     > 0) setServices(s.services);
                if (s.capacity)           setTotalCapacity(s.capacity);
                if (s.confirmation_email) setConfirmationEmail(s.confirmation_email);
                else if (s.email)         setConfirmationEmail(s.email);
                if (s.name) { setPrefillDone(true); setPrefillQuery(s.name); }
            } catch (error) {
                void error;
            }
            setLoading(false);
        })();
    }, []);

    // ── Google Places autocomplete ──────────────────────────────────────────
    async function handlePrefillQueryChange(value: string) {
        setPrefillQuery(value);
        setShowDropdown(false);
        if (value.length < 2) { setSuggestions([]); return; }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoadingSuggest(true);
            try {
                const res = await fetch(`${API_URL}/api/restaurants/autocomplete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: value }),
                });
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setShowDropdown(true);
            } catch { setSuggestions([]); }
            finally { setLoadingSuggest(false); }
        }, 300);
    }

    async function handleSelectPlace(placeId: string, name: string) {
        setShowDropdown(false);
        setSuggestions([]);
        setPrefillQuery(name);
        setPrefillLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/restaurants/prefill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_id: placeId }),
            });
            const data = await res.json();
            setInfo({
                name:         data.name         || name,
                phone:        data.phone        || '',
                address:      data.address      || '',
                cuisine_type: data.cuisine_type || '',
            });
            setPrefillDone(true);
        } catch {
            // silent — user fills manually in next step
        } finally {
            setPrefillLoading(false);
        }
    }

    // ── Save & navigation ───────────────────────────────────────────────────
    async function saveStep(data: Record<string, unknown>) {
        setSaving(true);
        setSaveError(null);
        try {
            await settingsAPI.update(data);
            await refreshUser();
        } catch {
            setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.');
        }
        setSaving(false);
    }

    async function nextStep() {
        if (step === 0) { setStep(1); return; }
        if (step === 1) await saveStep(info);
        if (step === 2) await saveStep({ opening_hours: hours, capacity: totalCapacity, services });
        if (step === 3) await saveStep({ confirmation_email: confirmationEmail });
        setStep(s => Math.min(s + 1, 4));
    }

    function copyBcc() {
        if (user?.bcc_email) {
            navigator.clipboard.writeText(user.bcc_email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080912] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080912] flex flex-col items-center justify-center py-8 px-4">
            <div className="w-full max-w-xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">TableNow</h1>
                    <p className="text-sm text-[#555] mt-1">Configuration de votre restaurant</p>
                </div>

                {/* Stepper */}
                <div className="flex items-start mb-8 px-2">
                    {STEPS.map((s, i) => {
                        const Icon   = s.icon;
                        const active = i === step;
                        const done   = i < step;
                        return (
                            <React.Fragment key={s.label}>
                                <div className="flex flex-col items-center gap-1.5 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-[#b8f000] text-black' : active ? 'bg-white text-black' : 'bg-[#151525] text-[#444]'}`}>
                                        {done ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
                                    </div>
                                    <span className={`text-[10px] font-medium text-center leading-tight max-w-[60px] ${active ? 'text-white' : 'text-[#555]'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mt-5 mx-2 ${i < step ? 'bg-[#b8f000]' : 'bg-[#1a1a2a]'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-[#0d0d1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                    {saveError && (
                        <div className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
                            ⚠ {saveError}
                        </div>
                    )}

                    <div className="px-6 py-7">

                        {/* ── Step 0: Google Places Prefill ── */}
                        {step === 0 && (
                            <div className="space-y-5">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-1">
                                    <Search size={18} className="text-[#b8f000] flex-shrink-0" />
                                    Trouvez votre restaurant
                                </h2>
                                <p className="text-sm text-[#666]">
                                    Cherchez votre établissement — on pré-remplit vos informations automatiquement.
                                </p>

                                <div className="relative">
                                    <FieldLabel>Nom du restaurant</FieldLabel>
                                    <div className="relative">
                                        <input
                                            className={inputCls}
                                            value={prefillQuery}
                                            onChange={e => handlePrefillQueryChange(e.target.value)}
                                            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                            placeholder="Le Petit Bistrot, Paris..."
                                            autoComplete="off"
                                        />
                                        {loadingSuggest && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 size={14} className="animate-spin text-[#444]" />
                                            </div>
                                        )}
                                    </div>

                                    {showDropdown && suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full mt-1 bg-[#111] border border-[#252535] rounded-xl shadow-2xl overflow-hidden">
                                            {suggestions.map((sg) => (
                                                <li
                                                    key={sg.placeId}
                                                    onMouseDown={() => handleSelectPlace(sg.placeId, sg.name)}
                                                    className="px-4 py-3 hover:bg-[#1a1a2a] cursor-pointer border-b border-[#1a1a2a] last:border-0 transition-colors"
                                                >
                                                    <p className="text-sm font-medium text-white">{sg.name}</p>
                                                    <p className="text-xs text-[#555] mt-0.5">{sg.address}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {prefillLoading && (
                                    <div className="flex items-center gap-2 text-sm text-[#666] py-2">
                                        <Loader2 size={14} className="animate-spin" />
                                        Récupération des informations…
                                    </div>
                                )}

                                {prefillDone && !prefillLoading && (
                                    <div className="flex items-center gap-2 text-sm text-[#b8f000] py-1">
                                        <Check size={14} />
                                        Informations récupérées — vérifiez à l'étape suivante.
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => { setStep(1); }}
                                    className="w-full text-center text-sm text-[#555] hover:text-white underline py-1 transition-colors"
                                >
                                    Remplir manuellement
                                </button>
                            </div>
                        )}

                        {/* ── Step 1: Restaurant info ── */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-5">
                                    <Store size={18} className="text-[#b8f000] flex-shrink-0" />
                                    Informations du restaurant
                                </h2>
                                <div>
                                    <FieldLabel>Nom du restaurant *</FieldLabel>
                                    <input className={inputCls} value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder="Le Petit Bistrot" />
                                </div>
                                <div>
                                    <FieldLabel>Adresse</FieldLabel>
                                    <input className={inputCls} value={info.address} onChange={e => setInfo({ ...info, address: e.target.value })} placeholder="123 Rue Principale, 75001 Paris" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <FieldLabel>Téléphone</FieldLabel>
                                        <input className={inputCls} type="tel" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })} placeholder="+33 1 23 45 67 89" />
                                    </div>
                                    <div>
                                        <FieldLabel>Type de cuisine</FieldLabel>
                                        <input className={inputCls} value={info.cuisine_type} onChange={e => setInfo({ ...info, cuisine_type: e.target.value })} placeholder="Française..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Horaires & Services ── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                                        <Clock size={18} className="text-[#b8f000] flex-shrink-0" />
                                        Horaires & Services
                                    </h2>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-[#666] text-xs">Capacité totale</span>
                                        <input type="number" min={1} className={`${timeCls} w-20`} value={totalCapacity}
                                            onChange={e => setTotalCapacity(parseInt(e.target.value) || 0)} />
                                        <span className="text-[#555] text-xs">cvts</span>
                                    </div>
                                </div>

                                {/* Days */}
                                <div className="space-y-2">
                                    {DAYS.map(({ key, label }) => {
                                        const day = hours[key] || { open: false, from: '12:00', to: '22:00' };
                                        return (
                                            <div key={key} className="flex items-center gap-3 py-1">
                                                <Toggle on={day.open} onToggle={() => setHours(h => ({ ...h, [key]: { ...day, open: !day.open } }))} />
                                                <span className={`text-sm w-24 flex-shrink-0 ${day.open ? 'text-white' : 'text-[#444]'}`}>{label}</span>
                                                {day.open ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <input type="time" className={timeCls} value={day.from}
                                                            onChange={e => setHours(h => ({ ...h, [key]: { ...day, from: e.target.value } }))} />
                                                        <span className="text-[#444] text-xs">→</span>
                                                        <input type="time" className={timeCls} value={day.to}
                                                            onChange={e => setHours(h => ({ ...h, [key]: { ...day, to: e.target.value } }))} />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[#333] italic">Fermé</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Services */}
                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <p className="text-xs font-bold text-[#555] uppercase tracking-widest">Services</p>

                                    {/* Déjeuner */}
                                    <div className="rounded-xl bg-[#0a0a16] border border-white/5 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-white">Déjeuner</span>
                                            <Toggle on={services.lunch.active}
                                                onToggle={() => setServices(sv => ({ ...sv, lunch: { ...sv.lunch, active: !sv.lunch.active } }))} />
                                        </div>
                                        {services.lunch.active && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <div><FieldLabel>Début</FieldLabel>
                                                    <input type="time" className={`${timeCls} w-full`} value={services.lunch.from}
                                                        onChange={e => setServices(sv => ({ ...sv, lunch: { ...sv.lunch, from: e.target.value } }))} /></div>
                                                <div><FieldLabel>Fin</FieldLabel>
                                                    <input type="time" className={`${timeCls} w-full`} value={services.lunch.to}
                                                        onChange={e => setServices(sv => ({ ...sv, lunch: { ...sv.lunch, to: e.target.value } }))} /></div>
                                                <div><FieldLabel>Couverts max</FieldLabel>
                                                    <input type="number" min={1} className={`${timeCls} w-full text-center`} value={services.lunch.capacity}
                                                        onChange={e => setServices(sv => ({ ...sv, lunch: { ...sv.lunch, capacity: parseInt(e.target.value) || 0 } }))} /></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dîner */}
                                    <div className="rounded-xl bg-[#0a0a16] border border-white/5 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-white">Dîner</span>
                                            <Toggle on={services.dinner.active}
                                                onToggle={() => setServices(sv => ({ ...sv, dinner: { ...sv.dinner, active: !sv.dinner.active } }))} />
                                        </div>
                                        {services.dinner.active && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <div><FieldLabel>Début</FieldLabel>
                                                    <input type="time" className={`${timeCls} w-full`} value={services.dinner.from}
                                                        onChange={e => setServices(sv => ({ ...sv, dinner: { ...sv.dinner, from: e.target.value } }))} /></div>
                                                <div><FieldLabel>Fin</FieldLabel>
                                                    <input type="time" className={`${timeCls} w-full`} value={services.dinner.to}
                                                        onChange={e => setServices(sv => ({ ...sv, dinner: { ...sv.dinner, to: e.target.value } }))} /></div>
                                                <div><FieldLabel>Couverts max</FieldLabel>
                                                    <input type="number" min={1} className={`${timeCls} w-full text-center`} value={services.dinner.capacity}
                                                        onChange={e => setServices(sv => ({ ...sv, dinner: { ...sv.dinner, capacity: parseInt(e.target.value) || 0 } }))} /></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Email ── */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-5">
                                    <Mail size={18} className="text-[#b8f000] flex-shrink-0" />
                                    Email de confirmation
                                </h2>
                                <div>
                                    <FieldLabel>Email pour recevoir les réservations *</FieldLabel>
                                    <input type="email" className={inputCls} value={confirmationEmail}
                                        onChange={e => setConfirmationEmail(e.target.value)}
                                        placeholder="reservations@votre-restaurant.fr" />
                                    <p className="text-xs text-[#555] mt-1.5">Les confirmations seront envoyées à cette adresse.</p>
                                </div>
                                {user?.bcc_email && (
                                    <div className="rounded-xl bg-[#0a0a16] border border-white/8 p-4 space-y-2">
                                        <FieldLabel>Adresse BCC (lecture seule)</FieldLabel>
                                        <div className="flex items-center gap-2">
                                            <input type="text" readOnly value={user.bcc_email}
                                                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl text-xs bg-[#080912] border border-[#1a1a2a] text-[#888] font-mono focus:outline-none truncate" />
                                            <button type="button" onClick={copyBcc}
                                                className="flex-shrink-0 p-2.5 rounded-xl bg-[#151525] hover:bg-[#1a1a2a] border border-[#252535] transition-colors">
                                                {copied ? <Check size={15} className="text-[#b8f000]" /> : <Copy size={15} className="text-[#888]" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-[#555]">Ajoutez cette adresse en BCC dans Zenchef / SevenRooms.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 4: Récapitulatif ── */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-1">
                                    <ClipboardList size={18} className="text-[#b8f000] flex-shrink-0" />
                                    Récapitulatif
                                </h2>
                                <p className="text-sm text-[#666]">Tout a été sauvegardé — modifiez à tout moment dans les réglages.</p>

                                <div className="space-y-2">
                                    <RecapBlock title="Restaurant">
                                        <RecapRow label="Nom"       value={info.name         || '—'} />
                                        <RecapRow label="Adresse"   value={info.address      || '—'} />
                                        <RecapRow label="Téléphone" value={info.phone        || '—'} />
                                        <RecapRow label="Cuisine"   value={info.cuisine_type || '—'} />
                                    </RecapBlock>

                                    <RecapBlock title={`Horaires — ${totalCapacity} couverts total`}>
                                        {DAYS.map(({ key, label }) => {
                                            const day = hours[key];
                                            return (
                                                <RecapRow key={key} label={label}
                                                    value={day?.open
                                                        ? `${day.from} → ${day.to}`
                                                        : <span className="italic text-[#555]">Fermé</span>}
                                                />
                                            );
                                        })}
                                    </RecapBlock>

                                    <RecapBlock title="Services">
                                        <RecapRow label="Déjeuner" value={services.lunch.active
                                            ? `${services.lunch.from} → ${services.lunch.to} · ${services.lunch.capacity} cvts`
                                            : <span className="italic text-[#555]">Désactivé</span>}
                                        />
                                        <RecapRow label="Dîner" value={services.dinner.active
                                            ? `${services.dinner.from} → ${services.dinner.to} · ${services.dinner.capacity} cvts`
                                            : <span className="italic text-[#555]">Désactivé</span>}
                                        />
                                    </RecapBlock>

                                    <RecapBlock title="Notifications">
                                        <RecapRow label="Email" value={confirmationEmail || '—'} />
                                        {user?.bcc_email && <RecapRow label="BCC" value={<span className="font-mono text-xs break-all">{user.bcc_email}</span>} />}
                                    </RecapBlock>
                                </div>

                                <button
                                    onClick={() => navigate(`/r/${user?.slug || user?.id}/dashboard`)}
                                    className="w-full h-14 mt-2 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors"
                                    style={{ background: '#b8f000', color: '#000' }}
                                >
                                    <Rocket size={20} /> Lancer mon assistant
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    {step < 4 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setStep(s => s - 1)}
                                className={`h-11 px-5 rounded-xl border border-white/10 text-sm font-medium text-white flex items-center gap-1.5 hover:bg-white/5 transition-colors ${step === 0 ? 'invisible pointer-events-none' : ''}`}
                            >
                                <ChevronLeft size={16} /> Précédent
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={saving || prefillLoading}
                                className="h-11 px-8 rounded-xl text-black text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
                                style={{ background: '#b8f000' }}
                            >
                                {saving ? (
                                    <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" /> Sauvegarde...</>
                                ) : step === 3 ? (
                                    <><Save size={15} /> Terminer</>
                                ) : (
                                    <>Suivant <ChevronRight size={16} /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RecapBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl bg-[#0a0a16] border border-white/8 px-4 py-3.5 space-y-1.5">
        <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">{title}</p>
        {children}
    </div>
);

const RecapRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <p className="text-sm text-[#aaa]">
        <span className="font-medium text-white">{label} : </span>{value}
    </p>
);

export default Onboarding;
