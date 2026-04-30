import React, { useState, useRef, useEffect } from 'react';
import { settingsAPI } from '../../lib/api';

const ALL_SERVICES = [
  { id: 'dejeuner',      label: 'Déjeuner',          desc: 'Service du midi' },
  { id: 'diner',         label: 'Dîner',              desc: 'Service du soir' },
  { id: 'brunch',        label: 'Brunch',             desc: 'Service brunch (week-end)' },
  { id: 'petitdej',      label: 'Petits-déjeuners',   desc: 'Service matin' },
  { id: 'takeaway',      label: 'Vente à emporter',   desc: 'Commandes à emporter' },
  { id: 'terrasse',      label: 'Terrasse',            desc: 'Service en terrasse' },
  { id: 'privatisation', label: 'Privatisation',       desc: "Réservation de l'espace entier" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        on ? 'bg-[#b8f000]' : 'bg-[#333]'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
          on ? 'left-5' : 'left-1'
        }`}
      />
    </button>
  );
}

const ServicesSettings: React.FC = () => {
  const [services, setServices] = useState<string[]>(['dejeuner', 'diner']);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalRef = useRef<string[]>(['dejeuner', 'diner']);

  useEffect(() => {
    settingsAPI.get()
      .then(res => {
        const d = res.data?.restaurant ?? res.data ?? {};
        if (Array.isArray(d.services)) {
          originalRef.current = [...d.services];
          setServices([...d.services]);
        }
      })
      .catch(() => {});
  }, []);

  const toggle = (id: string) => {
    setServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await settingsAPI.update({ services });
      originalRef.current = [...services];
      setDirty(false);
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setServices([...originalRef.current]);
    setDirty(false);
    setError(null);
  };

  return (
    <div className="max-w-2xl">
      <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">
        Services proposés
      </p>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {ALL_SERVICES.map((service, i) => (
          <div
            key={service.id}
            className={`flex items-center gap-4 px-5 py-4 ${
              i < ALL_SERVICES.length - 1 ? 'border-b border-[#1a1a1a]' : ''
            }`}
          >
            <div className="flex-1">
              <p className="text-sm text-white mb-0.5">{service.label}</p>
              <p className="text-xs text-[#555]">{service.desc}</p>
            </div>
            <Toggle
              on={services.includes(service.id)}
              onChange={() => toggle(service.id)}
            />
          </div>
        ))}
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
    </div>
  );
};

export default ServicesSettings;
