import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI } from '../../lib/api';
import { useLang } from '../../context/LangContext';

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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-[#555] mb-2">{hint}</p>}
      {children}
    </div>
  );
}

const inp = "w-full h-11 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors";
const ta  = "w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors resize-vertical";

const GeneralSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useLang();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const original = useRef<FormState>(EMPTY);

  useEffect(() => {
    const fromUser: FormState = {
      name:                (user as any)?.name                ?? '',
      owner_name:          (user as any)?.owner_name          ?? '',
      phone:               (user as any)?.phone               ?? '',
      cuisine_type:        (user as any)?.cuisine_type        ?? '',
      address:             (user as any)?.address             ?? '',
      confirmation_email:  (user as any)?.confirmation_email  ?? '',
      website:             (user as any)?.website             ?? '',
      cancellation_policy: (user as any)?.cancellation_policy ?? '',
      special_features:    (user as any)?.special_features    ?? '',
    };
    settingsAPI.get()
      .then(res => {
        const d = res.data?.settings ?? res.data?.restaurant ?? res.data ?? {};
        const loaded: FormState = {
          name:                d.name                ?? fromUser.name,
          owner_name:          d.owner_name          ?? fromUser.owner_name,
          phone:               d.phone               ?? fromUser.phone,
          cuisine_type:        d.cuisine_type        ?? fromUser.cuisine_type,
          address:             d.address             ?? fromUser.address,
          confirmation_email:  d.confirmation_email  ?? fromUser.confirmation_email,
          website:             d.website             ?? fromUser.website,
          cancellation_policy: d.cancellation_policy ?? fromUser.cancellation_policy,
          special_features:    d.special_features    ?? fromUser.special_features,
        };
        original.current = loaded;
        setForm(loaded);
      })
      .catch(() => { original.current = fromUser; setForm(fromUser); });
  }, []);

  const set = (k: keyof FormState, v: string) => {
    setForm(s => ({ ...s, [k]: v }));
    setDirty(true);
    setError('');
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      await settingsAPI.update(form);
      original.current = { ...form };
      await refreshUser();
      setDirty(false);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  const cancel = () => { setForm({ ...original.current }); setDirty(false); setError(''); };

  return (
    <div className="max-w-2xl space-y-5">
      {/* Infos de base */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] pb-3 border-b border-[#1a1a1a]">
          {t('restaurantInfo')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom du restaurant">
            <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Le Bistrot"/>
          </Field>
          <Field label="Responsable">
            <input className={inp} value={form.owner_name} onChange={e => set('owner_name', e.target.value)} placeholder="Jean Dupont"/>
          </Field>
        </div>
        <Field label="Téléphone public" hint="Affiché aux clients — différent du numéro IA">
          <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+33 1 42 00 00 00" type="tel"/>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type de cuisine">
            <input className={inp} value={form.cuisine_type} onChange={e => set('cuisine_type', e.target.value)} placeholder="Française"/>
          </Field>
          <Field label="Adresse">
            <input className={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="12 rue de Rivoli, Paris"/>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="E-mail confirmations">
            <input className={inp} value={form.confirmation_email} onChange={e => set('confirmation_email', e.target.value)} placeholder="resa@restaurant.fr" type="email"/>
          </Field>
          <Field label="Site web">
            <input className={inp} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://monrestaurant.fr"/>
          </Field>
        </div>
      </div>

      {/* Politique annulation */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] pb-3 border-b border-[#1a1a1a]">{t('cancelPolicyLabel')}</p>
        {/* @ts-ignore */}
        <Field label={t('cancelPolicyField')} hint={t('cancelPolicyHint')}>
          <textarea className={ta} rows={3} value={form.cancellation_policy} onChange={e => set('cancellation_policy', e.target.value)}
            placeholder={t('cancelPolicyPlaceholder')}/>
        </Field>
      </div>

      {/* Spécificités */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] pb-3 border-b border-[#1a1a1a]">{t('specificities')}</p>
        {/* @ts-ignore */}
        <Field label={t('specificitiesField')} hint={t('specificitiesHint')}>
          <textarea className={ta} rows={3} value={form.special_features} onChange={e => set('special_features', e.target.value)}
            placeholder={t('specificitiesPlaceholder')}/>
        </Field>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {dirty && (
        <div className="flex gap-3">
          <button onClick={save} disabled={saving}
            className="h-11 px-6 bg-[#b8f000] text-black font-bold rounded-xl text-sm disabled:opacity-60 flex items-center gap-2">
            {saving && <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"/>}
            {t('save')}
          </button>
          <button onClick={cancel} disabled={saving}
            className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444] transition-colors">
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  );
};

export default GeneralSettings;
