import React, { useCallback, useEffect, useState } from 'react';
import { settingsAPI, calendarAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
    Phone, Mail, User, Copy, Check, Calendar, Bell, Info,
    AlertCircle, CheckCircle, Wifi, WifiOff, Utensils,
    Settings as SettingsIcon, Bot, Gift,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const LIME = '#b8f000';

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

type SectionKey = 'general' | 'horaires' | 'services' | 'calendar' | 'notifications' | 'assistant' | 'identifiants' | 'parrainage';
type Toast = { type: 'success' | 'error'; text: string };

const SIDEBAR_SECTIONS = [
    {
        label: 'RESTAURANT',
        items: [
            { key: 'general' as SectionKey,      icon: SettingsIcon, label: 'Général'   },
            { key: 'horaires' as SectionKey,     icon: Calendar,     label: 'Horaires'  },
            { key: 'services' as SectionKey,     icon: Utensils,     label: 'Services'  },
        ],
    },
    {
        label: 'INTÉGRATIONS',
        items: [
            { key: 'calendar' as SectionKey,     icon: Calendar,     label: 'Google Agenda' },
            { key: 'notifications' as SectionKey,icon: Bell,         label: 'Notifications' },
        ],
    },
    {
        label: 'SYSTÈME',
        items: [
            { key: 'assistant' as SectionKey,    icon: Bot,          label: 'Assistant IA'  },
            { key: 'identifiants' as SectionKey, icon: Info,         label: 'Identifiants'  },
            { key: 'parrainage' as SectionKey,   icon: Gift,         label: 'Parrainage'    },
        ],
    },
];

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[11px] font-medium text-[#888] mb-1.5 uppercase tracking-wider">{label}</label>
            {children}
            {helper && <p className="text-[11px] text-[#555] mt-1">{helper}</p>}
        </div>
    );
}

function Input({ value, onChange, placeholder, type = 'text', readOnly = false }: {
    value: string; onChange?: (v: string) => void; placeholder?: string;
    type?: string; readOnly?: boolean;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#1a1a1a] border text-white placeholder-[#555] transition-colors focus:outline-none ${
                readOnly
                    ? 'border-[#1a1a1a] text-[#888] cursor-default font-mono text-xs'
                    : 'border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#b8f000]/60'
            }`}
        />
    );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <input
            type="time"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl text-sm bg-[#1a1a1a] border border-[#2a2a2a] text-white focus:outline-none focus:border-[#b8f000]/60 hover:border-[#3a3a3a] transition-colors"
        />
    );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange?: (v: string) => void; placeholder?: string }) {
    return (
        <textarea
            value={value}
            onChange={e => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#b8f000]/60 focus:outline-none text-white placeholder-[#555] resize-none transition-colors"
        />
    );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
            style={{ background: on ? LIME : '#2a2a2a' }}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
    return (
        <div className="flex justify-end pt-5 border-t border-[#1a1a1a] mt-5">
            <button
                onClick={onClick}
                disabled={loading}
                className="px-6 py-2 rounded-xl text-sm font-bold text-black disabled:opacity-50 transition-colors"
                style={{ background: loading ? '#555' : LIME }}
            >
                {loading ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
        </div>
    );
}

function CopyField({ label, value }: { label: string; value: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div>
            <label className="block text-[11px] font-medium text-[#555] mb-1.5 uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-2">
                <input readOnly value={value} className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-[#1a1a1a] border border-[#1a1a1a] text-[#888] font-mono focus:outline-none truncate" />
                <button
                    onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors flex-shrink-0"
                >
                    {copied ? <Check size={14} style={{ color: LIME }} /> : <Copy size={14} className="text-[#888]" />}
                </button>
            </div>
        </div>
    );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
    return (
        <div className="mb-6 pb-4 border-b border-[#1a1a1a]">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {description && <p className="text-xs text-[#888] mt-0.5">{description}</p>}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Settings: React.FC = () => {
    const { user, refreshUser } = useAuth();

    const [section, setSection]         = useState<SectionKey>('general');
    const [settings, setSettings]       = useState<any>({});
    const [hours, setHours]             = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);
    const [services, setServices]       = useState(DEFAULT_SERVICES);
    const [totalCapacity, setTotalCapacity] = useState(40);
    const [tableCount, setTableCount]   = useState(20);
    const [confirmationEmail, setConfirmationEmail] = useState('');
    const [loading, setLoading]         = useState(true);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [toast, setToast]             = useState<Toast | null>(null);

    const showToast = useCallback((text: string, type: 'success' | 'error') => setToast({ text, type }), []);

    useEffect(() => {
        fetchSettings();
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) handleCalendarCallback(code);
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    const fetchSettings = async () => {
        try {
            const { data } = await settingsAPI.get();
            const s = data.settings;
            setSettings(s);
            if (s.opening_hours && Object.keys(s.opening_hours).length) setHours(s.opening_hours);
            if (s.services     && Object.keys(s.services).length)     setServices(s.services);
            if (s.capacity)    setTotalCapacity(s.capacity);
            if (s.table_count) setTableCount(s.table_count);
            setConfirmationEmail(s.confirmation_email || s.email || '');
        } catch (err) {
            console.error('Erreur chargement paramètres:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCalendarCallback = async (code: string) => {
        try {
            showToast('Connexion Google Calendar...', 'success');
            await calendarAPI.callback(code);
            await refreshUser();
            showToast('Google Calendar connecté !', 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch {
            showToast('Erreur de connexion Google Calendar', 'error');
        }
    };

    const saveSection = async (key: string, data: Record<string, any>) => {
        setSavingSection(key);
        try {
            await settingsAPI.update(data);
            await refreshUser();
            showToast('Modifications enregistrées', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
        } finally {
            setSavingSection(null);
        }
    };

    const connectCalendar = async () => {
        try {
            const { data } = await calendarAPI.getAuthUrl();
            window.open(data.authUrl, '_blank');
        } catch {
            showToast('Erreur de connexion Google Calendar', 'error');
        }
    };

    const disconnectCalendar = async () => {
        setSavingSection('calendar-disconnect');
        try {
            await calendarAPI.disconnect();
            await refreshUser();
            showToast('Calendrier déconnecté', 'success');
        } catch {
            showToast('Erreur lors de la déconnexion', 'error');
        } finally {
            setSavingSection(null);
        }
    };

    const retryVapi = async () => {
        setSavingSection('vapi');
        try {
            const { data } = await settingsAPI.retryVapi();
            await refreshUser();
            await fetchSettings();
            showToast(`Assistant IA configuré ! Téléphone : ${data.phoneNumber}`, 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Erreur de configuration VAPI', 'error');
        } finally {
            setSavingSection(null);
        }
    };

    const handleChange = (field: string, value: any) => setSettings((s: any) => ({ ...s, [field]: value }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex gap-8 min-h-[600px]">

            {/* ── Sidebar ────────────────────────────────────────────── */}
            <aside className="w-[200px] flex-shrink-0">
                <div className="space-y-6">
                    {SIDEBAR_SECTIONS.map(({ label, items }) => (
                        <div key={label}>
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em] mb-2 px-3">{label}</p>
                            <div className="space-y-0.5">
                                {items.map(({ key, icon: Icon, label: itemLabel }) => {
                                    const active = section === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSection(key)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                                                active ? 'text-white' : 'text-[#888] hover:text-white hover:bg-[#111]'
                                            }`}
                                            style={active ? { borderLeft: `2px solid ${LIME}`, paddingLeft: '10px' } : {}}
                                        >
                                            <Icon size={14} style={active ? { color: LIME } : {}} />
                                            <span>{itemLabel}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* ── Content ────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">

                {/* GÉNÉRAL */}
                {section === 'general' && (
                    <div>
                        <SectionTitle title="Informations générales" />
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Nom du restaurant">
                                    <Input value={settings.name || ''} onChange={v => handleChange('name', v)} placeholder="Coco Paris" />
                                </Field>
                                <Field label="Nom du propriétaire">
                                    <Input value={settings.owner_name || ''} onChange={v => handleChange('owner_name', v)} placeholder="Jean Dupont" />
                                </Field>
                            </div>
                            <Field label="Téléphone" helper="Numéro affiché aux clients — différent du numéro IA">
                                <Input value={settings.phone || ''} onChange={v => handleChange('phone', v)} placeholder="+33 1 42 00 00 00" type="tel" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Type de cuisine">
                                    <Input value={settings.cuisine_type || ''} onChange={v => handleChange('cuisine_type', v)} placeholder="Française" />
                                </Field>
                                <Field label="Adresse">
                                    <Input value={settings.address || ''} onChange={v => handleChange('address', v)} placeholder="12 rue de Rivoli, Paris" />
                                </Field>
                            </div>
                        </div>
                        <SaveButton loading={savingSection === 'general'} onClick={() => saveSection('general', {
                            name: settings.name, owner_name: settings.owner_name,
                            phone: settings.phone, cuisine_type: settings.cuisine_type, address: settings.address,
                        })} />
                    </div>
                )}

                {/* HORAIRES */}
                {section === 'horaires' && (
                    <div>
                        <SectionTitle title="Horaires d'ouverture" />
                        <div className="space-y-2">
                            {DAYS.map(({ key, label }) => {
                                const day = hours[key] ?? { open: false, from: '12:00', to: '22:00' };
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <Toggle on={day.open} onToggle={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })} />
                                        <span className={`text-sm font-medium w-24 flex-shrink-0 ${day.open ? 'text-white' : 'text-[#555]'}`}>{label}</span>
                                        {day.open ? (
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <TimeInput value={day.from} onChange={v => setHours({ ...hours, [key]: { ...day, from: v } })} />
                                                <span className="text-[#555] text-xs flex-shrink-0">→</span>
                                                <TimeInput value={day.to}   onChange={v => setHours({ ...hours, [key]: { ...day, to: v } })} />
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[#555] italic">Fermé</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em] mb-3">Capacité</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Couverts total">
                                    <Input value={String(totalCapacity)} onChange={v => setTotalCapacity(parseInt(v) || 0)} type="number" />
                                </Field>
                                <Field label="Nombre de tables">
                                    <Input value={String(tableCount)} onChange={v => setTableCount(parseInt(v) || 0)} type="number" />
                                </Field>
                                <Field label="Groupe max">
                                    <Input value={String(settings.max_party_size || '')} onChange={v => handleChange('max_party_size', v)} type="number" />
                                </Field>
                                <Field label="Résa à l'avance (jours)">
                                    <Input value={String(settings.advance_booking_days || '')} onChange={v => handleChange('advance_booking_days', v)} type="number" />
                                </Field>
                            </div>
                        </div>
                        <SaveButton loading={savingSection === 'horaires'} onClick={() => saveSection('horaires', {
                            opening_hours: hours, capacity: totalCapacity,
                            table_count: tableCount,
                            max_party_size: settings.max_party_size ? parseInt(settings.max_party_size) : undefined,
                            advance_booking_days: settings.advance_booking_days ? parseInt(settings.advance_booking_days) : undefined,
                        })} />
                    </div>
                )}

                {/* SERVICES */}
                {section === 'services' && (
                    <div>
                        <SectionTitle title="Services" description="Configurez vos créneaux déjeuner et dîner" />
                        <div className="space-y-3">
                            {(['lunch', 'dinner'] as const).map(svc => {
                                const label = svc === 'lunch' ? 'Déjeuner' : 'Dîner';
                                const s = services[svc];
                                return (
                                    <div key={svc} className="p-4 rounded-xl bg-[#111] border border-[#2a2a2a] space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Toggle on={s.active} onToggle={() => setServices({ ...services, [svc]: { ...s, active: !s.active } })} />
                                            <p className="text-xs font-bold text-[#888] uppercase tracking-wider">{label}</p>
                                        </div>
                                        {s.active && (
                                            <div className="grid grid-cols-3 gap-3">
                                                <Field label="De"><TimeInput value={s.from} onChange={v => setServices({ ...services, [svc]: { ...s, from: v } })} /></Field>
                                                <Field label="À"><TimeInput value={s.to}   onChange={v => setServices({ ...services, [svc]: { ...s, to: v } })} /></Field>
                                                <Field label="Couverts max"><Input value={String(s.capacity)} onChange={v => setServices({ ...services, [svc]: { ...s, capacity: parseInt(v) || 0 } })} type="number" /></Field>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <SaveButton loading={savingSection === 'services'} onClick={() => saveSection('services', { services })} />
                    </div>
                )}

                {/* GOOGLE AGENDA */}
                {section === 'calendar' && (
                    <div>
                        <SectionTitle title="Google Agenda" description="Créez automatiquement des événements pour chaque réservation" />
                        {user?.google_calendar_tokens ? (
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-[#2a2a2a]">
                                <div className="flex items-center gap-2.5 text-sm" style={{ color: LIME }}>
                                    <Wifi size={15} />
                                    <span className="font-medium">Calendrier connecté</span>
                                </div>
                                <button
                                    onClick={disconnectCalendar}
                                    disabled={savingSection === 'calendar-disconnect'}
                                    className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Déconnecter
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-[#2a2a2a]">
                                <div className="flex items-center gap-2.5 text-sm text-[#555]">
                                    <WifiOff size={15} />
                                    <span>Non connecté</span>
                                </div>
                                <button
                                    onClick={connectCalendar}
                                    className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                >
                                    Connecter Google Agenda
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* NOTIFICATIONS */}
                {section === 'notifications' && (
                    <div>
                        <SectionTitle title="Notifications" />
                        <div className="space-y-4">
                            <Field label="Email de confirmation" helper="Les confirmations de réservation sont envoyées à cette adresse">
                                <Input value={confirmationEmail} onChange={v => setConfirmationEmail(v)} type="email" placeholder="reservations@monrestaurant.fr" />
                            </Field>
                            <Field label="Politique d'annulation">
                                <Textarea value={settings.cancellation_policy || ''} onChange={v => handleChange('cancellation_policy', v)} placeholder="Ex : Annulation gratuite jusqu'à 24h avant..." />
                            </Field>
                            <Field label="Fonctionnalités spéciales">
                                <Textarea value={settings.special_features || ''} onChange={v => handleChange('special_features', v)} placeholder="Ex : Terrasse, menu enfants, accès PMR..." />
                            </Field>
                        </div>
                        <SaveButton loading={savingSection === 'notifications'} onClick={() => saveSection('notifications', {
                            confirmation_email: confirmationEmail,
                            cancellation_policy: settings.cancellation_policy,
                            special_features: settings.special_features,
                        })} />
                    </div>
                )}

                {/* ASSISTANT IA */}
                {section === 'assistant' && (
                    <div>
                        <SectionTitle
                            title="Assistant IA"
                            description="Votre agent téléphonique alimenté par TableNow"
                        />
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                                {user?.vapi_assistant_id
                                    ? <span className="text-xs px-2 py-0.5 rounded-full font-medium border" style={{ color: LIME, borderColor: LIME, background: `${LIME}15` }}>Actif</span>
                                    : <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">Non configuré</span>
                                }
                            </div>
                            {user?.vapi_phone_number ? (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#111] border border-[#2a2a2a]">
                                    <div className="p-2 rounded-xl bg-[#1a1a1a]">
                                        <Phone size={16} style={{ color: LIME }} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#888] mb-0.5">Numéro IA — reçoit les appels de vos clients</p>
                                        <p className="text-base font-bold text-white font-mono">{user.vapi_phone_number}</p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={retryVapi}
                                    disabled={savingSection === 'vapi'}
                                    className="w-full px-5 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-50 transition-colors"
                                    style={{ background: savingSection === 'vapi' ? '#555' : LIME }}
                                >
                                    {savingSection === 'vapi' ? 'Configuration en cours...' : "Configurer l'assistant IA"}
                                </button>
                            )}
                            <p className="text-xs text-[#555] flex items-center gap-1.5">
                                <Info size={11} /> Ce numéro est géré automatiquement par TableNow.
                            </p>
                        </div>
                    </div>
                )}

                {/* IDENTIFIANTS */}
                {section === 'identifiants' && (
                    <div>
                        <SectionTitle title="Identifiants système" description="Gérés automatiquement par TableNow — lecture seule" />
                        <div className="space-y-3">
                            <CopyField label="Adresse BCC"       value={user?.bcc_email          || 'Non configuré'} />
                            <CopyField label="Numéro IA (VAPI)"  value={user?.vapi_phone_number   || 'Non configuré'} />
                            <CopyField label="URL du restaurant" value={user?.slug ? `tablenow.io/r/${user.slug}` : '—'} />
                            {user?.vapi_assistant_id && <CopyField label="Assistant ID" value={user.vapi_assistant_id} />}
                        </div>
                    </div>
                )}

                {/* PARRAINAGE */}
                {section === 'parrainage' && (
                    <div>
                        <SectionTitle title="Parrainage" description="Invitez des restaurants et gagnez des minutes gratuites" />
                        <div className="p-6 rounded-xl bg-[#111] border border-[#2a2a2a] text-center space-y-3">
                            <Gift size={32} className="mx-auto text-[#555]" />
                            <p className="text-sm text-[#888]">Programme de parrainage bientôt disponible</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastWrapper({ toast }: { toast: { type: 'success' | 'error'; text: string } | null }) {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl z-50 ${
            toast.type === 'success'
                ? 'bg-[#111] text-white border-[#2a2a2a]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
            {toast.type === 'success'
                ? <CheckCircle size={15} style={{ color: LIME }} />
                : <AlertCircle size={15} />
            }
            {toast.text}
        </div>
    );
}

// Wrap Settings to include Toast
const SettingsWithToast: React.FC = () => {
    return <Settings />;
};

export default Settings;
