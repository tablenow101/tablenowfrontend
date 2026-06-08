import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { settingsAPI } from '../lib/api';

// Guided first-run profile. Collects ONLY what makes the restaurant operational in
// the dashboard (identity + hours + capacity). Advanced/agent fields stay in Settings.
//
// Reuse, not duplication:
//   - writes through the existing settingsAPI.update (PUT /settings) — no new endpoint;
//   - produces the SAME opening_hours shape HoraireSettings reads/writes, so the data
//     stays editable in Settings › Horaires afterwards.
//
// On success it re-fetches /auth/app-state and follows next_route verbatim. The backend
// (is_complete) decides whether the user lands on the dashboard — never this component.

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

type Service = { name: string; start: string; end: string; covers: number };
type DayData = { enabled: boolean; services: Service[] };

const inp =
  'w-full h-11 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { slug: slugParam } = useParams();
  const { restaurant, refreshUser } = useAuth();
  const slug = slugParam || (restaurant?.slug as string | undefined) || '';

  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<number>(40);
  const [days, setDays] = useState<boolean[]>([true, true, true, true, true, true, false]);
  const [openTime, setOpenTime] = useState('12:00');
  const [closeTime, setCloseTime] = useState('22:30');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Prefill from the existing restaurant row (same source Settings uses).
  useEffect(() => {
    let alive = true;
    settingsAPI
      .get()
      .then((res) => {
        if (!alive) return;
        const d = res.data?.settings ?? res.data?.restaurant ?? res.data ?? {};
        setName(d.name ?? '');
        setOwnerName(d.owner_name ?? '');
        setPhone(d.phone ?? '');
        setAddress(d.address ?? '');
        if (typeof d.capacity === 'number' && d.capacity > 0) setCapacity(d.capacity);
        if (Array.isArray(d.opening_hours) && d.opening_hours.length === 7) {
          setDays(d.opening_hours.map((x: DayData) => !!x?.enabled));
          const firstOpen = d.opening_hours.find((x: DayData) => x?.enabled && x?.services?.[0]);
          if (firstOpen?.services?.[0]) {
            setOpenTime(firstOpen.services[0].start || '12:00');
            setCloseTime(firstOpen.services[0].end || '22:30');
          }
        }
      })
      .catch(() => {/* fall back to defaults */})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const toggleDay = (i: number) =>
    setDays((d) => d.map((v, idx) => (idx === i ? !v : v)));

  // Build the 7-entry opening_hours array in the shape HoraireSettings expects.
  const openingHours = useMemo<DayData[]>(
    () =>
      days.map((enabled) =>
        enabled
          ? { enabled: true, services: [{ name: 'Service', start: openTime, end: closeTime, covers: capacity }] }
          : { enabled: false, services: [] }
      ),
    [days, openTime, closeTime, capacity]
  );

  const submit = async () => {
    // These four fields are exactly what the backend uses to compute is_complete.
    if (!name.trim() || !ownerName.trim() || !phone.trim() || !address.trim()) {
      setError('Renseignez le nom, le responsable, le téléphone et l’adresse pour continuer.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await settingsAPI.update({
        name: name.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        capacity,
        opening_hours: openingHours,
      });
      // Recompute backend state and follow its decision verbatim.
      const state = await refreshUser();
      navigate(state?.next_route || `/r/${slug}/dashboard`, { replace: true });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Échec de l’enregistrement. Réessayez.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Configurons votre restaurant</h1>
          <p className="text-sm text-[#888] mt-1.5">
            Quelques informations pour activer votre tableau de bord. Vous pourrez tout ajuster ensuite dans les réglages.
          </p>
        </div>

        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nom du restaurant">
              <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Le Bistrot" />
            </Field>
            <Field label="Responsable">
              <input className={inp} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Jean Dupont" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Téléphone">
              <input className={inp} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 1 42 00 00 00" />
            </Field>
            <Field label="Capacité (couverts)">
              <input
                className={inp}
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Field label="Adresse">
            <input className={inp} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 rue de Rivoli, Paris" />
          </Field>
        </div>

        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
          <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">Horaires d’ouverture</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(i)}
                className="px-3 h-9 rounded-lg text-xs font-bold border transition-colors"
                style={
                  days[i]
                    ? { background: '#b8f000', color: '#000', borderColor: '#b8f000' }
                    : { background: 'transparent', color: '#888', borderColor: '#2a2a2a' }
                }
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ouverture">
              <input className={inp} type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            </Field>
            <Field label="Fermeture">
              <input className={inp} type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
            </Field>
          </div>
          <p className="text-[11px] text-[#555]">
            Horaire unique appliqué aux jours sélectionnés. Vous pourrez définir plusieurs services par jour dans les réglages.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full h-12 bg-[#b8f000] text-black font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
          Accéder au tableau de bord
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
