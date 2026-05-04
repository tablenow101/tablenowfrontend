import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Configuration', 'Prompt & instructions', 'Historique appels', 'Voix & langue'];

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

const AssistantSettings: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Configuration');

  const vapiPhone = (user as any)?.vapi_phone_number || '—';
  const vapiId    = (user as any)?.vapi_assistant_id || '—';
  const shortId   = vapiId.length > 14 ? vapiId.slice(0, 14) + '…' : vapiId;

  return (
    <div className="max-w-3xl">
      {/* Header card */}
      <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <div>
            <p className="text-sm font-semibold text-white">Assistant {user?.name}</p>
            <p className="text-xs text-[#555]">
              Actif 24h/24 · VAPI · Deepgram nova-2 fr · GPT-4o mini
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-4 bg-transparent border border-[#2a2a2a] text-white text-sm rounded-lg hover:border-[#444] transition-colors">
            Mettre en pause
          </button>
          <button className="h-9 px-4 bg-[#b8f000] text-black text-sm font-bold rounded-lg">
            Modifier
          </button>
        </div>
      </div>

      {/* 4 stat tiles */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {([
          { label: 'APPELS TOTAL',    value: '—' },
          { label: 'RÉSERVATIONS',    value: '0'  },
          { label: 'DURÉE MOY.',      value: '—' },
          { label: 'TAUX COMPLÉTÉS', value: '—' },
        ] as const).map(({ label, value }) => (
          <div key={label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#b8f000]">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#555] mt-1">{label}</p>
          </div>
        ))}
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Configuration' && (
        <div className="grid grid-cols-2 gap-4">
          {/* VAPI config — read-only */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[#555]">Configuration VAPI</p>
              <span className="text-[10px] text-[#555]">Lecture seule</span>
            </div>
            <div className="space-y-3">
              {([
                { label: 'Numéro TableNow',    value: vapiPhone, accent: true  },
                { label: 'Assistant ID',  value: shortId,   accent: false },
                { label: 'Modèle voix',  value: 'OpenAI shimmer',     accent: false },
                { label: 'STT',           value: 'Deepgram nova-2 fr', accent: false },
                { label: 'LLM',           value: 'GPT-4o mini',        accent: false },
              ] as const).map(({ label, value, accent }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-[#888]">{label}</span>
                  <span className={`text-sm font-mono ${
                    accent ? 'text-[#b8f000]' : 'text-white'
                  }`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comportement */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[#555]">Comportement</p>
              <button className="text-[10px] text-[#b8f000] font-semibold uppercase tracking-wider">
                Modifier →
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Langue principale', value: 'Français' },
                { label: 'Langue secondaire', value: 'Anglais'  },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-[#888]">{label}</span>
                  <span className="text-sm text-white">{value}</span>
                </div>
              ))}
              {['Accueil bilingue', 'Prise de résa', 'FAQ automatique'].map(label => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-[#888]">{label}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[#b8f000]/40 text-[#b8f000] bg-[#b8f000]/10">
                    Activé
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt d’accueil — full width */}
          <div className="col-span-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider text-[#555]">Prompt d’accueil</p>
              <button className="text-[10px] text-[#b8f000] font-semibold uppercase tracking-wider">
                Modifier →
              </button>
            </div>
            <p className="text-sm text-[#888] italic leading-relaxed">
              Bonjour, vous êtes bien chez {user?.name}. Je suis votre assistant, comment
              puis-je vous aider ? — Hello, you’ve reached {user?.name}. I’m your AI
              assistant, how can I help you?
            </p>
            <p className="text-[10px] text-[#555] mt-3">
              Ce message est lu à chaque début d’appel. Modifiable depuis l’onglet
              « Prompt & instructions ».
            </p>
          </div>
        </div>
      )}

      {tab !== 'Configuration' && (
        <p className="text-sm text-[#555]">À venir.</p>
      )}
    </div>
  );
};

export default AssistantSettings;
