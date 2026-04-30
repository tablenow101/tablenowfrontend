Parfait — déjà absent.Le revert est effectif.Settings.tsx maintenant:

```bash
cat > src/pages/Settings.tsx << 'ENDOFFILE'
import React, { useState } from 'react';
import { User, Clock, Utensils, Calendar, Bell, Phone, Key, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type SectionId = 'general' | 'hours' | 'services' | 'calendar' | 'notifications' | 'assistant' | 'identifiers' | 'referral';

const SIDEBAR_ITEMS: { id: SectionId; label: string; icon: React.ElementType; group: string }[] = [
  { id: 'general',       label: 'Général',        icon: User,     group: 'Restaurant'   },
  { id: 'hours',         label: 'Horaires',        icon: Clock,    group: 'Restaurant'   },
  { id: 'services',      label: 'Services',        icon: Utensils, group: 'Restaurant'   },
  { id: 'calendar',      label: 'Google Agenda',   icon: Calendar, group: 'Intégrations' },
  { id: 'notifications', label: 'Notifications',   icon: Bell,     group: 'Intégrations' },
  { id: 'assistant',     label: 'Assistant vocal', icon: Phone,    group: 'Intégrations' },
  { id: 'identifiers',   label: 'Identifiants',    icon: Key,      group: 'Système'      },
  { id: 'referral',      label: 'Parrainage',      icon: Gift,     group: 'Système'      },
];

const GROUPS = ['Restaurant', 'Intégrations', 'Système'] as const;
const NO_SAVE = new Set<SectionId>(['calendar', 'assistant', 'identifiers', 'referral']);
const GENERAL_TABS = ['Informations', 'Langue & région', 'Politique annulation', 'Spécificités'];

function F({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--t2)', marginBottom: '6px' }}>{label}</label>
      {children}
      {helper && <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '4px' }}>{helper}</p>}
    </div>
  );
}

function TnIn({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', fontSize: '13px', background: 'var(--bg3)', border: '1px solid var(--line2)', color: 'var(--t1)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />;
}

function TnArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4}
    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', fontSize: '13px', background: 'var(--bg3)', border: '1px solid var(--line2)', color: 'var(--t1)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const }} />;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const [activeTab, setActiveTab]         = useState<string>('Informations');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [gen, setGen] = useState({
    name:                user?.name                ?? '',
    owner_name:          user?.owner_name          ?? '',
    phone:               user?.phone               ?? '',
    cuisine_type:        user?.cuisine_type        ?? '',
    address:             user?.address             ?? '',
    confirmation_email:  user?.confirmation_email  ?? '',
    cancellation_policy: user?.cancellation_policy ?? '',
    special_features:    user?.special_features    ?? '',
  });

  const dirty = () => setHasUnsavedChanges(true);
  const cg = (k: keyof typeof gen, v: string) => { setGen(s => ({ ...s, [k]: v })); dirty(); };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 46px)', background: 'var(--bg0)' }}>
      <nav style={{ width: '172px', flexShrink: 0, background: 'var(--bg1)', borderRight: '1px solid var(--line)', padding: '20px 0', position: 'sticky', top: '46px', height: 'calc(100vh - 46px)', overflowY: 'auto' }}>
        {GROUPS.map(group => (
          <div key={group} style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 16px', marginBottom: '4px' }}>{group}</p>
            {SIDEBAR_ITEMS.filter(i => i.group === group).map(item => {
              const Icon = item.icon; const active = activeSection === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveSection(item.id); setActiveTab(item.id === 'general' ? 'Informations' : ''); setHasUnsavedChanges(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', background: active ? 'var(--acc3)' : 'transparent', borderWidth: '0 0 0 2px', borderStyle: 'solid', borderColor: active ? 'var(--acc)' : 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: active ? 500 : 400, color: active ? 'var(--acc)' : 'var(--t2)', fontFamily: 'inherit', textAlign: 'left' }}>
                  <Icon size={13} style={{ flexShrink: 0 }} />{item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <main style={{ flex: 1, padding: '28px 32px', paddingBottom: hasUnsavedChanges && !NO_SAVE.has(activeSection) ? '80px' : '28px' }}>
        {activeSection === 'general' && (
          <div style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r8)', padding: '11px 14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--acc)' }} />
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--t1)' }}>Assistant {user?.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '1px' }}>Actif 24h/24 · Répond en français et en anglais</div>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', background: 'var(--acc2)', color: 'var(--acc)', border: '1px solid rgba(184,224,74,0.2)', padding: '3px 8px', borderRadius: '3px' }}>Actif</span>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: '20px' }}>
              {GENERAL_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: '8px 14px', fontSize: '12px', fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? 'var(--t1)' : 'var(--t3)', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--acc)' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px' }}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Informations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <F label="Nom du restaurant"><TnIn value={gen.name} onChange={v => cg('name', v)} placeholder="Le Bistrot" /></F>
                  <F label="Responsable"><TnIn value={gen.owner_name} onChange={v => cg('owner_name', v)} placeholder="Jean Dupont" /></F>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <F label="Téléphone public" helper="Affiché aux clients — différent du numéro IA"><TnIn value={gen.phone} onChange={v => cg('phone', v)} placeholder="+33 1 42 00 00 00" type="tel" /></F>
                  <F label="Type de cuisine"><TnIn value={gen.cuisine_type} onChange={v => cg('cuisine_type', v)} placeholder="Française" /></F>
                </div>
                <F label="Adresse"><TnIn value={gen.address} onChange={v => cg('address', v)} placeholder="12 rue de Rivoli, Paris" /></F>
                <F label="E-mail de confirmation" helper="Reçoit chaque nouvelle réservation"><TnIn value={gen.confirmation_email} onChange={v => cg('confirmation_email', v)} placeholder="resa@monrestaurant.fr" type="email" /></F>
              </div>
            )}

            {activeTab === 'Politique annulation' && (
              <F label="Politique d'annulation" helper="Communiquée aux clients lors de la prise de réservation">
                <TnArea value={gen.cancellation_policy} onChange={v => cg('cancellation_policy', v)} placeholder="Annulation gratuite jusqu'à 24h avant. Au-delà, 50% du repas facturé." />
              </F>
            )}

            {activeTab === 'Spécificités' && (
              <F label="Services & particularités" helper="Informations transmises à l'assistant vocal">
                <TnArea value={gen.special_features} onChange={v => cg('special_features', v)} placeholder="Terrasse, parking, menu végétarien..." />
              </F>
            )}

            {activeTab === 'Langue & région' && <p style={{ fontSize: '13px', color: 'var(--t3)' }}>À venir.</p>}
          </div>
        )}
      </main>

      {hasUnsavedChanges && !NO_SAVE.has(activeSection) && (
        <div style={{ position: 'fixed', bottom: 0, left: '172px', right: 0, height: '60px', background: 'var(--bg1)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', padding: '0 32px', zIndex: 100 }}>
          <button onClick={() => setHasUnsavedChanges(false)} style={{ height: '36px', padding: '0 18px', borderRadius: '6px', border: '1px solid var(--line2)', background: 'transparent', color: 'var(--t2)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <button style={{ height: '36px', padding: '0 20px', borderRadius: '6px', background: 'var(--acc)', color: '#0c0c0c', border: 'none', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>Enregistrer</button>
        </div>
      )}
    </div>
  );
};

export default Settings;
ENDOFFILE
```