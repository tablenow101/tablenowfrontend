import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../lib/api';
import {
    Store,
    Clock,
    Users,
    Mail,
    ClipboardList,
    ChevronRight,
    ChevronLeft,
    Save,
    Copy,
    Check,
    Rocket,
} from 'lucide-react';

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
    { icon: Store,         label: 'Restaurant'   },
    { icon: Clock,         label: 'Horaires'     },
    { icon: Users,         label: 'Services'     },
    { icon: Mail,          label: 'Email'        },
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

const Onboarding: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep]     = useState(0);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Step 1 — Restaurant info
    const [info, setInfo] = useState({
        name: '',
        address: '',
        phone: '',
        cuisine_type: '',
    });

    // Step 2 — Opening hours
    const [hours, setHours] = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);

    // Step 3 — Services & capacity
    const [totalCapacity, setTotalCapacity] = useState(40);
    const [services, setServices] = useState(DEFAULT_SERVICES);

    // Step 4 — Email
    const [confirmationEmail, setConfirmationEmail] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await settingsAPI.get();
                const s = res.data.settings;
                setInfo({
                    name:         s.name         || '',
                    address:      s.address      || '',
                    phone:        s.phone        || '',
                    cuisine_type: s.cuisine_type || '',
                });
                if (s.opening_hours && Object.keys(s.opening_hours).length > 0) setHours(s.opening_hours);
                if (s.services     && Object.keys(s.services).length     > 0) setServices(s.services);
                // DB column is "capacity" (not total_capacity)
                if (s.capacity)            setTotalCapacity(s.capacity);
                if (s.confirmation_email)  setConfirmationEmail(s.confirmation_email);
                else if (s.email)          setConfirmationEmail(s.email);
            } catch {}
            setLoading(false);
        })();
    }, []);

    async function saveStep(data: Record<string, any>) {
        setSaving(true);
        setSaveError(null);
        try {
            await settingsAPI.update(data);
            await refreshUser();
        } catch (err: any) {
            console.error('Save error:', err);
            setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.');
        }
        setSaving(false);
    }

    async function nextStep() {
        if (step === 0) {
            await saveStep(info);
        } else if (step === 1) {
            await saveStep({ opening_hours: hours });
        } else if (step === 2) {
            // FIX: DB column is "capacity", not "total_capacity"
            await saveStep({ capacity: totalCapacity, services });
        } else if (step === 3) {
            await saveStep({ confirmation_email: confirmationEmail, setup_complete: true });
        }
        if (step < 4) setStep(step + 1);
    }

    function prevStep() {
        if (step > 0) setStep(step - 1);
    }

    function finish() {
        const slug = user?.slug || user?.id;
        navigate(`/r/${slug}/dashboard`);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>TableNow</h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Configuration de votre restaurant</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((s, i) => {
                        const Icon   = s.icon;
                        const active = i === step;
                        const done   = i < step;
                        return (
                            <React.Fragment key={s.label}>
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                                        style={{
                                            background: done
                                                ? '#22c55e'
                                                : active
                                                ? 'var(--btn-primary-bg)'
                                                : 'rgba(255,255,255,0.08)',
                                            color: done || active
                                                ? 'var(--btn-primary-fg)'
                                                : 'var(--text-secondary)',
                                        }}
                                    >
                                        {done ? <Check size={18} /> : <Icon size={18} />}
                                    </div>
                                    <span
                                        className="text-xs mt-1"
                                        style={{
                                            color:      active ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            fontWeight: active ? 600 : 400,
                                        }}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className="flex-1 h-0.5 mx-2"
                                        style={{ background: i < step ? '#22c55e' : 'var(--progress-track)' }}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl p-8"
                    style={{
                        background:   'var(--bg-card)',
                        border:       '1px solid var(--border-card)',
                        boxShadow:    '0 24px 48px rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Error banner */}
                    {saveError && (
                        <div
                            className="mb-6 p-4 rounded-lg flex items-center gap-2 text-sm"
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #EF4444', color: '#FCA5A5' }}
                        >
                            <span>⚠</span> {saveError}
                        </div>
                    )}

                    {/* ── Step 1 — Restaurant info ── */}
                    {step === 0 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Store size={22} /> Informations du restaurant
                            </h2>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                    Nom du restaurant *
                                </label>
                                <input
                                    className="input w-full h-11"
                                    value={info.name}
                                    onChange={(e) => setInfo({ ...info, name: e.target.value })}
                                    placeholder="Le Petit Bistrot"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                    Adresse *
                                </label>
                                <input
                                    className="input w-full h-11"
                                    value={info.address}
                                    onChange={(e) => setInfo({ ...info, address: e.target.value })}
                                    placeholder="123 Rue Principale, 75001 Paris"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                        Téléphone
                                    </label>
                                    <input
                                        className="input w-full h-11"
                                        type="tel"
                                        value={info.phone}
                                        onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                                        placeholder="+33 1 23 45 67 89"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                        Type de cuisine
                                    </label>
                                    <input
                                        className="input w-full h-11"
                                        value={info.cuisine_type}
                                        onChange={(e) => setInfo({ ...info, cuisine_type: e.target.value })}
                                        placeholder="Française, Italienne..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2 — Horaires ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Clock size={22} /> Horaires d'ouverture
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Activez les jours d'ouverture et définissez les horaires.
                            </p>
                            {DAYS.map(({ key, label }) => {
                                const day = hours[key] || { open: false, from: '12:00', to: '22:00' };
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="w-24 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                            {label}
                                        </span>
                                        {/* Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })}
                                            className="w-12 h-6 rounded-full transition-colors relative flex-shrink-0"
                                            style={{ background: day.open ? '#22c55e' : 'rgba(255,255,255,0.15)' }}
                                        >
                                            <span
                                                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                                                style={{ left: day.open ? '1.5rem' : '0.125rem' }}
                                            />
                                        </button>
                                        {day.open ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="time"
                                                    value={day.from}
                                                    onChange={(e) => setHours({ ...hours, [key]: { ...day, from: e.target.value } })}
                                                    className="input !w-32 !py-1.5 text-center"
                                                />
                                                <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                                <input
                                                    type="time"
                                                    value={day.to}
                                                    onChange={(e) => setHours({ ...hours, [key]: { ...day, to: e.target.value } })}
                                                    className="input !w-32 !py-1.5 text-center"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>Fermé</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Step 3 — Services & Capacité ── */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Users size={22} /> Services & Capacité
                            </h2>

                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                    Capacité totale (couverts)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    className="input !w-32 h-11"
                                    value={totalCapacity}
                                    onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            {/* Lunch */}
                            <ServiceCard
                                label="Déjeuner"
                                active={services.lunch.active}
                                from={services.lunch.from}
                                to={services.lunch.to}
                                capacity={services.lunch.capacity}
                                onToggle={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })}
                                onFrom={(v) => setServices({ ...services, lunch: { ...services.lunch, from: v } })}
                                onTo={(v) => setServices({ ...services, lunch: { ...services.lunch, to: v } })}
                                onCapacity={(v) => setServices({ ...services, lunch: { ...services.lunch, capacity: v } })}
                            />

                            {/* Dinner */}
                            <ServiceCard
                                label="Dîner"
                                active={services.dinner.active}
                                from={services.dinner.from}
                                to={services.dinner.to}
                                capacity={services.dinner.capacity}
                                onToggle={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })}
                                onFrom={(v) => setServices({ ...services, dinner: { ...services.dinner, from: v } })}
                                onTo={(v) => setServices({ ...services, dinner: { ...services.dinner, to: v } })}
                                onCapacity={(v) => setServices({ ...services, dinner: { ...services.dinner, capacity: v } })}
                            />
                        </div>
                    )}

                    {/* ── Step 4 — Email ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Mail size={22} /> Email de confirmation
                            </h2>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                    Email pour recevoir les réservations *
                                </label>
                                <input
                                    type="email"
                                    className="input w-full h-11"
                                    value={confirmationEmail}
                                    onChange={(e) => setConfirmationEmail(e.target.value)}
                                    placeholder="reservations@votre-restaurant.fr"
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    Les confirmations et notifications de réservation seront envoyées à cette adresse.
                                </p>
                            </div>

                            {user?.bcc_email && (
                                <div
                                    className="p-4 rounded-xl space-y-2"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-card)' }}
                                >
                                    <label className="block text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                        Adresse BCC (lecture seule)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="input flex-1 h-10 font-mono text-sm"
                                            value={user.bcc_email}
                                            readOnly
                                            style={{ opacity: 0.7 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={copyBcc}
                                            className="flex-shrink-0 p-2.5 rounded-lg transition-colors"
                                            style={{ border: '1px solid var(--border-card)', background: 'transparent', color: 'var(--text-primary)' }}
                                        >
                                            {copied ? <Check size={18} style={{ color: '#22c55e' }} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Ajoutez cette adresse en BCC dans Zenchef / SevenRooms pour synchroniser les réservations.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 5 — Récapitulatif ── */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <ClipboardList size={22} /> Récapitulatif
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Vérifiez vos informations. Tout a été sauvegardé — modifiez à tout moment dans les réglages.
                            </p>

                            <RecapBlock title="Restaurant">
                                <RecapRow label="Nom"       value={info.name         || '—'} />
                                <RecapRow label="Adresse"   value={info.address      || '—'} />
                                <RecapRow label="Téléphone" value={info.phone        || '—'} />
                                <RecapRow label="Cuisine"   value={info.cuisine_type || '—'} />
                            </RecapBlock>

                            <RecapBlock title="Horaires">
                                {DAYS.map(({ key, label }) => {
                                    const day = hours[key];
                                    return (
                                        <RecapRow
                                            key={key}
                                            label={label}
                                            value={day?.open
                                                ? `${day.from} → ${day.to}`
                                                : <span className="italic" style={{ color: 'var(--text-secondary)' }}>Fermé</span>
                                            }
                                        />
                                    );
                                })}
                            </RecapBlock>

                            <RecapBlock title="Services & Capacité">
                                <RecapRow label="Capacité totale" value={`${totalCapacity} couverts`} />
                                <RecapRow
                                    label="Déjeuner"
                                    value={services.lunch.active
                                        ? `${services.lunch.from} → ${services.lunch.to} (${services.lunch.capacity} couverts)`
                                        : <span className="italic" style={{ color: 'var(--text-secondary)' }}>Désactivé</span>
                                    }
                                />
                                <RecapRow
                                    label="Dîner"
                                    value={services.dinner.active
                                        ? `${services.dinner.from} → ${services.dinner.to} (${services.dinner.capacity} couverts)`
                                        : <span className="italic" style={{ color: 'var(--text-secondary)' }}>Désactivé</span>
                                    }
                                />
                            </RecapBlock>

                            <RecapBlock title="Notifications">
                                <RecapRow label="Email de confirmation" value={confirmationEmail || '—'} />
                                {user?.bcc_email && (
                                    <RecapRow label="Adresse BCC" value={<span className="font-mono text-sm">{user.bcc_email}</span>} />
                                )}
                            </RecapBlock>

                            <div className="text-center pt-4">
                                <button
                                    onClick={finish}
                                    className="btn-primary px-12 inline-flex items-center justify-center gap-2"
                                    style={{ width: 'auto' }}
                                >
                                    <Rocket size={20} /> Lancer mon assistant
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    {step < 4 && (
                        <div
                            className="flex justify-between mt-8 pt-6"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={step === 0}
                                className={`btn-secondary flex items-center gap-1 !w-auto px-5 ${step === 0 ? 'invisible' : ''}`}
                            >
                                <ChevronLeft size={18} /> Précédent
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={saving}
                                className="btn-primary flex items-center gap-1 !w-auto px-8"
                            >
                                {saving ? (
                                    <><span className="loading mr-1" /> Sauvegarde...</>
                                ) : step === 3 ? (
                                    <><Save size={18} /> Terminer</>
                                ) : (
                                    <>Suivant <ChevronRight size={18} /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Sub-components ──────────────────────────────────────────────────────────

interface ServiceCardProps {
    label:      string;
    active:     boolean;
    from:       string;
    to:         string;
    capacity:   number;
    onToggle:   () => void;
    onFrom:     (v: string) => void;
    onTo:       (v: string) => void;
    onCapacity: (v: number) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ label, active, from, to, capacity, onToggle, onFrom, onTo, onCapacity }) => (
    <div
        className="p-4 rounded-xl space-y-3"
        style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' }}
    >
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={onToggle}
                className="w-12 h-6 rounded-full transition-colors relative flex-shrink-0"
                style={{ background: active ? '#22c55e' : 'rgba(255,255,255,0.15)' }}
            >
                <span
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                    style={{ left: active ? '1.5rem' : '0.125rem' }}
                />
            </button>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
        </div>
        {active && (
            <div className="flex flex-wrap items-end gap-4 pt-1">
                <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>De</label>
                    <input type="time" className="input !w-28 !py-1.5 text-center" value={from}     onChange={(e) => onFrom(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>À</label>
                    <input type="time" className="input !w-28 !py-1.5 text-center" value={to}       onChange={(e) => onTo(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Couverts max</label>
                    <input type="number" min={1} className="input !w-24 !py-1.5 text-center" value={capacity} onChange={(e) => onCapacity(parseInt(e.target.value) || 0)} />
                </div>
            </div>
        )}
    </div>
);

interface RecapBlockProps { title: string; children: React.ReactNode; }
const RecapBlock: React.FC<RecapBlockProps> = ({ title, children }) => (
    <div className="p-4 rounded-xl space-y-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
        {children}
    </div>
);

interface RecapRowProps { label: string; value: React.ReactNode; }
const RecapRow: React.FC<RecapRowProps> = ({ label, value }) => (
    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{label} : </span>
        {value}
    </p>
);

export default Onboarding;
