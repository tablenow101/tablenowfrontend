import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Copy, Check } from 'lucide-react';

const TABS = ['Mon programme', 'Historique'];

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

const ParrainageSettings: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Mon programme');
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const referralCode =
    (user as any)?.referral_code ??
    `${((user?.name ?? 'REST').toUpperCase().replace(/\s+/g, '').slice(0, 8))}-RAD`;

  const copy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    navigator.clipboard.writeText(`https://app.tablenow.io/register?ref=${referralCode}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Mon programme' && (
        <div className="space-y-4">
          {/* Hero card */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 relative overflow-hidden">
            {/* Bubble */}
            <div className="absolute right-6 top-6 w-20 h-20 rounded-full bg-[#b8f000]/20 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#b8f000] leading-none">+100</span>
              <span className="text-[9px] text-[#b8f000] uppercase text-center leading-tight mt-0.5">
                MIN. PAR<br />PARRAINAGE
              </span>
            </div>

            <span className="inline-block border border-[#b8f000]/40 text-[#b8f000] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded mb-4">
              Programme Parrainage
            </span>

            <h2 className="text-xl font-bold text-white pr-28 mb-1">
              Parrainez un restaurant,<br />
              gagnez <span className="text-[#b8f000]">100 minutes</span> offertes
            </h2>
            <p className="text-sm text-[#555] mb-5">
              Valables sur votre forfait · cumulables · sans limite
            </p>

            <div className="flex gap-3">
              {/* Code box */}
              <div className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#555] mb-1">
                    Votre code parrain
                  </p>
                  <p className="text-base font-bold text-[#b8f000] font-mono">{referralCode}</p>
                </div>
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 text-xs text-[#888] border border-[#2a2a2a] rounded-lg px-3 py-1.5 hover:border-[#444] transition-colors"
                >
                  {copied
                    ? <Check size={12} className="text-[#b8f000]" />
                    : <Copy size={12} />}
                  Copier
                </button>
              </div>

              {/* Share button */}
              <button
                onClick={shareLink}
                className="px-5 bg-[#b8f000] text-black font-bold rounded-xl text-sm whitespace-nowrap"
              >
                {copiedShare ? 'Lien copié ✓' : 'Partager le lien →'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'FILLEULS ACTIFS',  value: '0'     },
              { label: 'EN ATTENTE',        value: '0'     },
              { label: 'MINUTES GAGNÉES',  value: '0 min' },
            ] as const).map(({ label, value }) => (
              <div key={label} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-2xl font-bold text-[#b8f000]">{value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#555] mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">
              Comment ça marche
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Step n={1} />
                <span className="text-sm text-white">
                  Partagez votre code{' '}
                  <span className="text-[#b8f000] font-mono font-bold">{referralCode}</span>{' '}
                  à un restaurateur de votre réseau
                </span>
                <span className="text-[#555] flex-shrink-0">—</span>
              </div>
              <div className="flex items-center gap-4">
                <Step n={2} />
                <span className="text-sm text-white flex-1">
                  Il s'inscrit et active son essai gratuit avec votre code
                </span>
                <span className="text-[#555] flex-shrink-0">—</span>
              </div>
              <div className="flex items-center gap-4">
                <Step n={3} />
                <span className="text-sm text-white flex-1">
                  Il souscrit à un abonnement payant
                </span>
                <span className="text-sm font-bold text-[#b8f000] flex-shrink-0">+100 min</span>
              </div>
            </div>
          </div>

          {/* Sponsored list */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[#555]">Filleuls parrainés</p>
              <span className="text-[10px] text-[#555]">0 au total</span>
            </div>
            <p className="text-sm text-[#555] text-center py-4">
              Aucun parrainage pour le moment — partagez votre code pour commencer
            </p>
          </div>
        </div>
      )}

      {tab === 'Historique' && (
        <p className="text-sm text-[#555]">Historique des parrainages à venir.</p>
      )}
    </div>
  );
};

function Step({ n }: { n: number }) {
  return (
    <div className="w-7 h-7 rounded-full border-2 border-[#b8f000] text-[#b8f000] text-xs font-bold flex items-center justify-center flex-shrink-0">
      {n}
    </div>
  );
}

export default ParrainageSettings;
