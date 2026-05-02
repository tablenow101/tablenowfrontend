import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { referralAPI } from '../../lib/api';
import { Copy, Check } from 'lucide-react';

const TABS = ['Mon programme', 'Historique'];

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex border-b border-[#2a2a2a] mb-6">
      {tabs.map(tab => (
        <button key={tab} onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${active === tab ? 'text-white border-[#b8f000] font-medium' : 'text-[#888] border-transparent hover:text-white'}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <div className="w-7 h-7 rounded-full border-2 border-[#b8f000] text-[#b8f000] text-xs font-bold flex items-center justify-center flex-shrink-0">
      {n}
    </div>
  );
}

const ParrainageSettings: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Mon programme');
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const referralCode =
    stats?.referral_code ??
    (user as any)?.referral_code ??
    `${((user?.name ?? 'REST').toUpperCase().replace(/\s+/g, '').slice(0, 8))}-RAD`;

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          referralAPI.getStats(),
          referralAPI.getList(),
        ]);
        setStats(statsRes.data);
        setReferrals(listRes.data?.referrals || []);
      } catch (err) {
        console.error('Referral load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  const statusLabel: Record<string, { label: string; color: string }> = {
    active:    { label: 'Actif',      color: '#b8f000' },
    trial:     { label: 'Essai',      color: '#f59e0b' },
    pending:   { label: 'En attente', color: '#6b7280' },
    cancelled: { label: 'Annulé',     color: '#ef4444' },
  };

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="loading w-8 h-8" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Mon programme' && (
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute right-6 top-6 w-20 h-20 rounded-full bg-[#b8f000]/20 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#b8f000] leading-none">+100</span>
              <span className="text-[9px] text-[#b8f000] uppercase text-center leading-tight mt-0.5">MIN. PAR<br />PARRAINAGE</span>
            </div>
            <span className="inline-block border border-[#b8f000]/40 text-[#b8f000] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded mb-4">
              Programme Parrainage
            </span>
            <h2 className="text-xl font-bold text-white pr-28 mb-1">
              Parrainez un restaurant,<br />gagnez <span className="text-[#b8f000]">100 minutes</span> offertes
            </h2>
            <p className="text-sm text-[#555] mb-5">Valables sur votre forfait · cumulables · sans limite</p>
            <div className="flex gap-3">
              <div className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#555] mb-1">Votre code parrain</p>
                  <p className="text-base font-bold text-[#b8f000] font-mono">{referralCode}</p>
                </div>
                <button onClick={copy} className="flex items-center gap-1.5 text-xs text-[#888] border border-[#2a2a2a] rounded-lg px-3 py-1.5 hover:border-[#444] transition-colors">
                  {copied ? <Check size={12} className="text-[#b8f000]" /> : <Copy size={12} />}
                  Copier
                </button>
              </div>
              <button onClick={shareLink} className="px-5 bg-[#b8f000] text-black font-bold rounded-xl text-sm whitespace-nowrap">
                {copiedShare ? 'Lien copié ✓' : 'Partager le lien →'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'FILLEULS ACTIFS', value: stats?.active_referrals ?? 0 },
              { label: 'EN ATTENTE',      value: stats?.trial_referrals  ?? 0 },
              { label: 'MINUTES GAGNÉES', value: `${stats?.referral_minutes_earned ?? 0} min` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-2xl font-bold text-[#b8f000]">{value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#555] mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">Comment ça marche</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Step n={1} />
                <span className="text-sm text-white">Partagez votre code <span className="text-[#b8f000] font-mono font-bold">{referralCode}</span> à un restaurateur</span>
                <span className="text-[#555] flex-shrink-0">—</span>
              </div>
              <div className="flex items-center gap-4">
                <Step n={2} />
                <span className="text-sm text-white flex-1">Il s'inscrit et active son essai gratuit avec votre code</span>
                <span className="text-[#555] flex-shrink-0">—</span>
              </div>
              <div className="flex items-center gap-4">
                <Step n={3} />
                <span className="text-sm text-white flex-1">Il souscrit à un abonnement payant</span>
                <span className="text-sm font-bold text-[#b8f000] flex-shrink-0">+100 min</span>
              </div>
            </div>
          </div>
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[#555]">Filleuls parrainés</p>
              <span className="text-[10px] text-[#555]">{referrals.length} au total</span>
            </div>
            {referrals.length === 0 ? (
              <p className="text-sm text-[#555] text-center py-4">Aucun parrainage pour le moment — partagez votre code pour commencer</p>
            ) : (
              <div className="space-y-3">
                {referrals.slice(0, 5).map((r: any) => {
                  const s = statusLabel[r.status] || { label: r.status, color: '#6b7280' };
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-white">{r.referred?.name || r.referred_email || 'En attente'}</p>
                        <p className="text-xs text-[#555]">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded border" style={{ borderColor: s.color, color: s.color }}>{s.label}</span>
                      {r.minutes_awarded > 0 && <span className="text-sm font-bold text-[#b8f000]">+{r.minutes_awarded} min</span>}
                    </div>
                  );
                })}
                {referrals.length > 5 && (
                  <button onClick={() => setTab('Historique')} className="text-xs text-[#b8f000] hover:underline pt-1">
                    Voir les {referrals.length - 5} autres →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {tab === 'Historique' && (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">Historique complet</p>
          {referrals.length === 0 ? (
            <p className="text-sm text-[#555] text-center py-6">Aucun parrainage pour le moment</p>
          ) : (
            <div>
              <div className="grid grid-cols-4 gap-2 pb-2 mb-2 border-b border-[#2a2a2a] text-[10px] uppercase tracking-wider text-[#555]">
                <span>Restaurant</span><span>Date</span><span>Statut</span><span>Minutes</span>
              </div>
              {referrals.map((r: any) => {
                const s = statusLabel[r.status] || { label: r.status, color: '#6b7280' };
                return (
                  <div key={r.id} className="grid grid-cols-4 gap-2 py-2.5 border-b border-[#1a1a1a] last:border-0 text-sm">
                    <span className="text-white truncate">{r.referred?.name || r.referred_email || '—'}</span>
                    <span className="text-[#555]">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    <span style={{ color: s.color }}>{s.label}</span>
                    <span className={r.minutes_awarded > 0 ? 'text-[#b8f000] font-bold' : 'text-[#333]'}>
                      {r.minutes_awarded > 0 ? `+${r.minutes_awarded}` : '—'}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-end pt-3 mt-1 border-t border-[#2a2a2a]">
                <div className="text-right">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Total gagné</p>
                  <p className="text-xl font-bold text-[#b8f000]">{stats?.referral_minutes_earned ?? 0} min</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParrainageSettings;
