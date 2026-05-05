import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../lib/api';
import { useLang } from '../../context/LangContext';

interface NotifPrefs { new_reservation: boolean; cancellation: boolean; reminder_24h: boolean; }
const DEFAULT: NotifPrefs = { new_reservation: true, cancellation: true, reminder_24h: false };

const NotificationsSettings: React.FC = () => {
  const { t } = useLang();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    settingsAPI.get().then(r => {
      const d = r.data?.settings ?? r.data?.restaurant ?? r.data ?? {};
      if (d.notification_prefs) setPrefs({ ...DEFAULT, ...d.notification_prefs });
    }).catch(() => {});
  }, []);

  const toggle = (k: keyof NotifPrefs) => { setPrefs(p => ({ ...p, [k]: !p[k] })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try { await settingsAPI.update({ notification_prefs: prefs }); setDirty(false); }
    catch {}
    finally { setSaving(false); }
  };

  const rows = [
    { key: 'new_reservation' as const, label: t('notif1Label'), desc: t('notif1Desc') },
    { key: 'cancellation'    as const, label: t('notif2Label'), desc: t('notif2Desc') },
    { key: 'reminder_24h'    as const, label: t('notif3Label'), desc: t('notif3Desc') },
  ];

  return (
    <div className="max-w-2xl">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-[#1a1a1a]">
          <p className="text-[10px] font-bold tracking-[.15em] text-[#555]">{t('notifPrefs')}</p>
        </div>
        {rows.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] last:border-0">
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-[#555] mt-0.5">{desc}</p>
            </div>
            <button onClick={() => toggle(key)}
              className="w-11 h-6 rounded-full relative flex-shrink-0 ml-4 transition-colors"
              style={{ background: prefs[key] ? '#b8f000' : '#2a2a2a' }}>
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                style={{ left: prefs[key] ? '22px' : '2px' }}/>
            </button>
          </div>
        ))}
      </div>
      {dirty && (
        <div className="flex justify-end gap-3">
          <button onClick={() => { setPrefs(DEFAULT); setDirty(false); }}
            className="h-10 px-5 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444]">
            {t('cancel')}
          </button>
          <button onClick={save} disabled={saving}
            className="h-10 px-5 bg-[#b8f000] text-black font-bold rounded-xl text-sm">
            {saving ? '…' : t('save')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsSettings;
