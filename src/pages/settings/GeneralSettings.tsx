import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Informations', 'Langue & région', 'Politique annulation', 'Spécificités'];

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-wider text-[#555] mb-2">{children}</p>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors resize-vertical"
    />
  );
}

function SaveBar({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-3 mt-6">
      <button className="h-11 px-6 bg-[#b8f000] text-black font-bold rounded-xl text-sm">
        Enregistrer
      </button>
      <button
        onClick={onCancel}
        className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444] transition-colors"
      >
        Annuler
      </button>
    </div>
  );
}

const GeneralSettings: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Informations');
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState({
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

  const set = (k: keyof typeof form, v: string) => {
    setForm(s => ({ ...s, [k]: v }));
    setDirty(true);
  };

  const changeTab = (t: string) => {
    setTab(t);
    setDirty(false);
  };

  return (
    <div className="max-w-2xl">
      {/* Assistant banner */}
      <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <div>
            <p className="text-sm text-white font-medium">
              Assistant {user?.name} · VAPI
            </p>
            <p className="text-xs text-[#555] mt-0.5">
              {(user as any)?.vapi_phone_number || '—'} · ID{' '}
              {((user as any)?.vapi_assistant_id || '——').slice(0, 8)}...
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider border border-[#b8f000] text-[#b8f000] px-2.5 py-1 rounded">
          ACTIF
        </span>
      </div>

      {/* Section label */}
      <p className="text-[10px] uppercase tracking-wider text-[#555] pb-3 mb-4 border-b border-[#1a1a1a]">
        Informations du restaurant
      </p>

      <TabBar tabs={TABS} active={tab} onChange={changeTab} />

      {tab === 'Informations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Nom du restaurant</FieldLabel>
              <Input value={form.name} onChange={v => set('name', v)} placeholder="Le Bistrot" />
            </div>
            <div>
              <FieldLabel>Responsable</FieldLabel>
              <Input value={form.owner_name} onChange={v => set('owner_name', v)} placeholder="Jean Dupont" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Téléphone public</FieldLabel>
              <Input value={form.phone} onChange={v => set('phone', v)} placeholder="+33 1 42 00 00 00" type="tel" />
              <p className="text-[10px] text-[#555] mt-1">
                Affiché aux clients · différent du numéro IA
              </p>
            </div>
            <div>
              <FieldLabel>Type de cuisine</FieldLabel>
              <Input value={form.cuisine_type} onChange={v => set('cuisine_type', v)} placeholder="Française" />
            </div>
          </div>

          <div>
            <FieldLabel>Adresse</FieldLabel>
            <Input value={form.address} onChange={v => set('address', v)} placeholder="12 rue de Rivoli, Paris" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>E-mail confirmations</FieldLabel>
              <Input
                value={form.confirmation_email}
                onChange={v => set('confirmation_email', v)}
                placeholder="resa@restaurant.fr"
                type="email"
              />
            </div>
            <div>
              <FieldLabel>Site web</FieldLabel>
              <Input value={form.website} onChange={v => set('website', v)} placeholder="monrestaurant.fr" />
            </div>
          </div>

          {dirty && <SaveBar onCancel={() => setDirty(false)} />}
        </div>
      )}

      {tab === 'Politique annulation' && (
        <div>
          <FieldLabel>Politique d’annulation</FieldLabel>
          <Textarea
            value={form.cancellation_policy}
            onChange={v => set('cancellation_policy', v)}
            placeholder="Annulation gratuite jusqu’à 24h avant. Au-delà, 50 % du repas facturé."
          />
          {dirty && <SaveBar onCancel={() => setDirty(false)} />}
        </div>
      )}

      {tab === 'Spécificités' && (
        <div>
          <FieldLabel>Services &amp; particularités</FieldLabel>
          <Textarea
            value={form.special_features}
            onChange={v => set('special_features', v)}
            placeholder="Terrasse, parking, menu végétarien…"
          />
          {dirty && <SaveBar onCancel={() => setDirty(false)} />}
        </div>
      )}

      {tab === 'Langue & région' && (
        <p className="text-sm text-[#555]">À venir.</p>
      )}
    </div>
  );
};

export default GeneralSettings;
