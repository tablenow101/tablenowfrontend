import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI } from '../../lib/api';

const TABS = ['Informations', 'Langue & région', 'Politique annulation', 'Spécificités'];

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex border-b border-[#2a2a2a] mb-6">
      {tabs.map(tab => (
        <button key={tab} onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
            active === tab ? 'text-white border-[#b8f000] font-medium' : 'text-[#888] border-transparent hover:text-white'
          }`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-wider text-[#555] mb-2">{children}</p>;
}

function Input({ value, onChange, placeholder, type = 'text', helper }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; helper?: string;
}) {
  return (
    <>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-11 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors" />
      {helper && <p className="text-[10px] text-[#555] mt-1">{helper}</p>}
    </>
  );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={5}
      className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors resize-vertical" />
  );
}

function SaveBar({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={onSave} disabled={saving}
        className="h-11 px-6 bg-[#b8f000] text-black font-bold rounded-xl text-sm disabled:opacity-60 flex items-center gap-2">
        {saving && <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
        Enregistrer
      </button>
      <button onClick={onCancel} disabled={saving}
        className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444] transition-colors">
        Annuler
      </button>
    </div>
  );
}

type FormState = {
  name: string; owner_name: string; phone: string; cuisine_type: string;
  address: string; confirmation_email: string; website: string;
  cancellation_policy: string; special_features: string;
};

const EMPTY: FormState = {
  name: '', owner_name: '', phone: '', cuisine_type: '',
  address: '', confirmation_email: '', website: '',
  cancellation_policy: '', special_features: '',
};

const GeneralSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab]     = useState('Informations');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fromUser = (): FormState => ({
    name:                (user as any)?.name               ?? '',
    owner_name:          (user as any)?.owner_name         ?? '',
    phone:               (user as any)?.phone              ?? '',
    cuisine_type:        (user as any)?.cuisine_type       ?? '',
    address:             (user as any)?.address            ?? '',
    confirmation_email:  (user as any)?.confirmation_email ?? '',
    website:             (user as any)?.website            ?? '',
    cancellation_policy: (user as any)?.cancellation_policy ?? '',
    special_features:    (user as any)?.special_features   ?? '',
  });

  const originalRef = useRef<FormState>(fromUser());
  const [form, setForm] = useState<FormState>(fromUser());

  useEffect(() => {
    settingsAPI.get()
      .then(res => {
        const d = res.data?.restaurant ?? res.data ?? {};
        const loaded: FormState = {
          name:                d.name               ?? form.name,
          owner_name:          d.owner_name         ?? form.owner_name,
          phone:               d.phone              ?? form.phone,
          cuisine_type:        d.cuisine_type       ?? form.cuisine_type,
          address:             d.address            ?? form.address,
          confirmation_email:  d.confirmation_email ?? form.confirmation_email,
          website:             d.website            ?? form.website,
          cancellation_policy: d.cancellation_policy ?? form.cancellation_policy,
          special_features:    d.special_features   ?? form.special_features,
        };
        originalRef.current = loaded;
        setForm(loaded);
      })
      .catch(() => {/* keep user-context values */});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof FormState, v: string) => {
    setForm(s => ({ ...s, [k]: v }));
    setDirty(true);
    setError('');
  };

  const changeTab = (t: string) => { setTab(t); setDirty(false); setError(''); };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await settingsAPI.update(form);
      originalRef.current = { ...form };
      await refreshUser();
      setDirty(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setForm({ ...originalRef.current }); setDirty(false); setError(''); };

  return (
    <div className="max-w-2xl">
      {/* Assistant banner */}
      <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <div>
            <p className="text-sm text-white font-medium">Assistant {user?.name} · VAPI</p>
            <p className="text-xs text-[#555] mt-0.5">
              {(user as any)?.vapi_phone_number || '—'} · ID 
              {((user as any)?.vapi_assistant_id || '——').slice(0, 8)}...
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider border border-[#b8f000] text-[#b8f000] px-2.5 py-1 rounded">
          ACTIF
        </span>
      </div>

      <p className="text-[10px] uppercase tracking-wider text-[#555] pb-3 mb-4 border-b border-[#1a1a1a]">
        Informations du restaurant
      </p>

      <TabBar tabs={TABS} active={tab} onChange={changeTab} />

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>
      )}

      {tab === 'Informations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel>Nom du restaurant</FieldLabel>
              <Input value={form.name} onChange={v => set('name', v)} placeholder="Le Bistrot" /></div>
            <div><FieldLabel>Responsable</FieldLabel>
              <Input value={form.owner_name} onChange={v => set('owner_name', v)} placeholder="Jean Dupont" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel>Téléphone public</FieldLabel>
              <Input value={form.phone} onChange={v => set('phone', v)} placeholder="+33 1 42 00 00 00" type="tel"
                helper="Affiché aux clients · différent du numéro IA" /></div>
            <div><FieldLabel>Type de cuisine</FieldLabel>
              <Input value={form.cuisine_type} onChange={v => set('cuisine_type', v)} placeholder="Française" /></div>
          </div>
          <div><FieldLabel>Adresse</FieldLabel>
            <Input value={form.address} onChange={v => set('address', v)} placeholder="12 rue de Rivoli, Paris" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel>E-mail confirmations</FieldLabel>
              <Input value={form.confirmation_email} onChange={v => set('confirmation_email', v)}
                placeholder="resa@restaurant.fr" type="email" /></div>
            <div><FieldLabel>Site web</FieldLabel>
              <Input value={form.website} onChange={v => set('website', v)} placeholder="monrestaurant.fr" /></div>
          </div>
          {dirty && <SaveBar onSave={save} onCancel={cancel} saving={saving} />}
        </div>
      )}

      {tab === 'Politique annulation' && (
        <div>
          <FieldLabel>Politique d’annulation</FieldLabel>
          <Textarea value={form.cancellation_policy} onChange={v => set('cancellation_policy', v)}
            placeholder="Annulation gratuite jusqu’à 24h avant. Au-delà, 50 % du repas facturé." />
          {dirty && <SaveBar onSave={save} onCancel={cancel} saving={saving} />}
        </div>
      )}

      {tab === 'Spécificités' && (
        <div>
          <FieldLabel>Services &amp; particularités</FieldLabel>
          <Textarea value={form.special_features} onChange={v => set('special_features', v)}
            placeholder="Terrasse, parking, menu végétarien…" />
          {dirty && <SaveBar onSave={save} onCancel={cancel} saving={saving} />}
        </div>
      )}

      {tab === 'Langue & région' && (
        <p className="text-sm text-[#555]">À venir.</p>
      )}
    </div>
  );
};

export default GeneralSettings;
