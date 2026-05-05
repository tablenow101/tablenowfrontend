import React, { useState, useRef, useEffect } from 'react';
import { settingsAPI } from '../../lib/api';
import { useLang } from '../../context/LangContext';

type NotifPrefs = {
  new_booking: boolean;
  cancellation: boolean;
  reminder_24h: boolean;
};

const DEFAULT_PREFS: NotifPrefs = {
  new_booking: true,
  cancellation: true,
  reminder_24h: false,
};

const ITEMS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
  {
    key: 'new_booking',
    label: 'Nouvelle réservation',
    desc: 'Recevoir une notification à chaque nouvelle réservation confirmée',
  },
  {
    key: 'cancellation',
    label: 'Annulation',
    desc: "Recevoir une notification lorsqu'un client annule sa réservation",
  },
  {
    key: 'reminder_24h',
    label: 'Rappel 24h avant',
    desc: 'Recevoir un rappel 24 heures avant chaque réservation',
  },
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

const NotificationsSettings: React.FC = () => {
  const { t } = useLang();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalRef = useRef<NotifPrefs>({ ...DEFAULT_PREFS });

  useEffect(() => {
    settingsAPI.get()
      .then(res => {
        const d = res.data?.restaurant ?? res.data ?? {};
        const loaded: NotifPrefs = {
          new_booking:  d.notifications?.new_booking  ?? DEFAULT_PREFS.new_booking,
          cancellation: d.notifications?.cancellation ?? DEFAULT_PREFS.cancellation,
          reminder_24h: d.notifications?.reminder_24h ?? DEFAULT_PREFS.reminder_24h,
        };
        originalRef.current = { ...loaded };
        setPrefs(loaded);
      })
      .catch(() => {});
  }, []);

  const toggle = (key: keyof NotifPrefs) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await settingsAPI.update({ notifications: prefs });
      originalRef.current = { ...prefs };
      setDirty(false);
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setPrefs({ ...originalRef.current });
    setDirty(false);
    setError(null);
  };

  return (
    <div className="max-w-2xl">
      <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">
        Préférences de notification
      </p>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {ITEMS.map((item, i) => (
          <div
            key={item.key}
            className={`flex items-center gap-4 px-5 py-4 ${
              i < ITEMS.length - 1 ? 'border-b border-[#1a1a1a]' : ''
            }`}
          >
            <div className="flex-1">
              <p className="text-sm text-white mb-0.5">{item.label}</p>
              <p className="text-xs text-[#555]">{item.desc}</p>
            </div>
            <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
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
            {saving ? '…' : t('save')}
          </button>
          <button
            onClick={cancel}
            className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444] transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsSettings;
