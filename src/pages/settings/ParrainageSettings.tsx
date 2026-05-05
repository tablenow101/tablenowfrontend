import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { referralAPI } from '../../lib/api';
import { useLang } from '../../context/LangContext';
import { Copy, Check } from 'lucide-react';

const ParrainageSettings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ active: 0, pending: 0, minutes: 0, referrals: [] as any[] });

  const code = (user as any)?.referral_code
    || `${((user as any)?.name || 'RESTO').toUpperCase().replace(/\s+/g, '-')}-RAD`;
  const link = `https://app.tablenow.io/register?ref=${code}`;

  useEffect(() => {
    referralAPI.getStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] font-bold tracking-[.12em] uppercase border border-[#2a2a2a] rounded px-2 py-1 text-[#888]">
            {t('referralProgram')}
          </span>
          <span className="text-[#b8f000] font-bold text-sm">{t('minPerReferral')}</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">
          {t('referralHeadline')}<br/>
          {t('referralMinutes')}
        </h2>
        <p className="text-sm text-[#555] mb-5">{t('referralSub2')}</p>

        <div className="flex gap-3">
          <div className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-1">{t('yourCode')}</p>
            <p className="text-base font-bold tracking-wider" style={{ color: '#b8f000' }}>{code}</p>
          </div>
          <button onClick={() => copy(code)}
            className="flex items-center gap-2 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-[#888] hover:border-[#444] transition-colors">
            {copied ? <Check size={14} className="text-[#b8f000]" /> : <Copy size={14} />}
            {t('copy')}
          </button>
          <button onClick={() => copy(link)}
            className="px-5 bg-[#b8f000] rounded-xl text-sm font-bold text-black hover:opacity-90 transition-opacity">
            {t('shareLink')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: t('activeReferrals'), value: stats.active,  color: 'text-[#b8f000]' },
          { label: t('pending'),         value: stats.pending, color: 'text-[#888]'     },
          { label: `${t('earned')} (min)`, value: stats.minutes, color: 'text-[#b8f000]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-[.12em] text-[#555] mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* Comment ça marche */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
        <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-4">{t('calHowItWorks')}</p>
        <div className="space-y-0">
          {[
            { n: 1, text: t('referralStep1').replace('{code}', code), extra: '' },
            { n: 2, text: t('referralStep2'), extra: '' },
            { n: 3, text: t('referralStep3'), extra: '+100 min' },
          ].map(({ n, text, extra }, i) => (
            <div key={n} className={`flex items-center gap-3 py-3 ${i < 2 ? 'border-b border-[#1a1a1a]' : ''}`}>
              <div className="w-6 h-6 rounded-full border border-[#b8f000] text-[#b8f000] text-xs font-bold flex items-center justify-center flex-shrink-0">
                {n}
              </div>
              <span className="text-sm text-[#888] flex-1">{text}</span>
              {extra && <span className="text-sm font-bold" style={{ color: '#b8f000' }}>{extra}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Filleuls */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555]">{t('referredRestaurants')}</p>
          <span className="text-xs text-[#555]">{stats.referrals?.length ?? 0} {t('totalReferrals')}</span>
        </div>
        {stats.referrals?.length > 0 ? (
          stats.referrals.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
              <span className="text-sm text-white">{r.name || r.email}</span>
              <span className="text-xs text-[#b8f000]">{r.status}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#555] text-center py-4">
            {t('referralEmpty')}
          </p>
        )}
      </div>
    </div>
  );
};

export default ParrainageSettings;
