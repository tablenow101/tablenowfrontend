import React, { useState, useRef, useEffect } from 'react';
import { settingsAPI } from '../../lib/api';

const TABS = ['Jours & heures', 'Capacité', 'Jours fermés'];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

type DaySchedule = { enabled: boolean; start: string; end: string };

const DEFAULT_HOURS: DaySchedule[] = [
  { enabled: true,  start: '12:00', end: '22:30' },
  { enabled: true,  start: '12:00', end: '22:30' },
  { enabled: true,  start: '12:00', end: '22:30' },
  { enabled: true,  start: '12:00', end: '22:30' },
  { enabled: true,  start: '12:00', end: '23:00' },
  { enabled: true,  start: '12:00', end: '23:00' },
  { enabled: false, start: '12:00', end: '22:00' },
];

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex border-b border-[#2a2a2a] mb-6">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
            active === tab
              ? 'text-white border-[#b8f000] font-medium'
              : 'text-[#888] border-transparent hover:text-white'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

const HoraireSettings: React.FC = () => {
  const [tab, setTab] = useState('Jours & heures');
  const [hours, setHours] = useState<DaySchedule[]>(DEFAULT_HOURS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalRef = useRef<DaySchedule[]>(DEFAULT_HOURS.map(h => ({ ...h })));

  useEffect(() => {
    settingsAPI.get()
      .then(res => {
        const d = res.data?.restaurant ?? res.data ?? {};
        const loaded: DaySchedule[] =
          Array.isArray(d.opening_hours) && d.opening_hours.length === 7
            ? d.opening_hours
            : DEFAULT_HOURS;
        originalRef.current = loaded.map(h => ({ ...h }));
        setHours(loaded);
      })
      .catch(() => {});
  }, []);

  const toggle = (i: number) => {
    setHours(h => h.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled } : d));
    setDirty(true);
  };

  const setTime = (i: number, field: 'start' | 'end', value: string) => {
    setHours(h => h.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await settingsAPI.update({ opening_hours: hours });
      originalRef.current = hours.map(h => ({ ...h }));
      setDirty(false);
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setHours(originalRef.current.map(h => ({ ...h })));
    setDirty(false);
    setError(null);
  };

  return (
    <div className="max-w-2xl">
      <TabBar tabs={TABS} active={tab} onChange={t => { setTab(t); setDirty(false); }} />

      {tab === 'Jours & heures' && (
        <>
          <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">
            Jours d'ouverture
          </p>

          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden">
            {DAYS.map((day, i) => {
              const d = hours[i];
              return (
                <div
                  key={day}
                  className={`flex items-center gap-4 px-4 py-3.5 ${
                    i < DAYS.length - 1 ? 'border-b border-[#1a1a1a]' : ''
                  }`}
                >
                  <button
                    onClick={() => toggle(i)}
                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                      d.enabled ? 'bg-[#b8f000]' : 'bg-[#333]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        d.enabled ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>

                  <span
                    className={`text-sm w-24 ${
                      d.enabled ? 'text-white' : 'text-[#555]'
                    }`}
                  >
                    {day}
                  </span>

                  {d.enabled ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="time"
                        value={d.start}
                        onChange={e => setTime(i, 'start', e.target.value)}
                        className="h-9 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#444] transition-colors"
                      />
                      <span className="text-[#555] text-sm">→</span>
                      <input
                        type="time"
                        value={d.end}
                        onChange={e => setTime(i, 'end', e.target.value)}
                        className="h-9 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#444] transition-colors"
                      />
                    </div>
                  ) : (
                    <span className="ml-auto text-sm text-[#555]">Fermé</span>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          {dirty && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={save}
                disabled={saving}
                className="h-11 px-6 bg-[#b8f000] text-black font-bold rounded-xl text-sm disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                onClick={cancel}
                className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444] transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'Capacité' && (
        <p className="text-sm text-[#555]">Configuration de la capacité à venir.</p>
      )}

      {tab === 'Jours fermés' && (
        <p className="text-sm text-[#555]">Gestion des jours fermés à venir.</p>
      )}
    </div>
  );
};

export default HoraireSettings;
