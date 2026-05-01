import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    id: 'en_cas',
    name: 'EN CAS',
    price: 79,
    popular: false,
    description: 'Pour démarrer sans risque',
    features: [
      'WhatsApp + Instagram automation',
      'Dashboard réservations + messages',
      'Widget réservation intégrable',
      "Jusqu'à 500 conversations/mois",
      'Onboarding self-serve',
      '0,06€ / conversation supplémentaire',
    ],
    cta: 'Commencer EN CAS',
  },
  {
    id: 'miam',
    name: 'MIAM',
    price: 249,
    popular: true,
    description: 'Le plan préféré des restaurants',
    features: [
      'Tout EN CAS inclus',
      'Agent voix 24h/24 (appels entrants)',
      'Confirmations + rappels SMS/email',
      'Gestion no-show automatique',
      'Historique client complet',
      "Jusqu'à 1 500 conversations + 200 min voix/mois",
      '0,05€ / conv · 0,18€ / min voix suppl.',
    ],
    cta: 'Commencer MIAM',
  },
  {
    id: 'fin_gourmet',
    name: 'FIN GOURMET',
    price: 399,
    popular: false,
    description: 'Pour les établissements ambitieux',
    features: [
      'Tout MIAM inclus',
      'Suivi personnalisé (CSM dédié)',
      'Analytics + recommandations remplissage',
      'Automations avancées + segmentation',
      'Support prioritaire 7j/7',
      'Multi-établissements',
      "Jusqu'à 3 000 conversations + 400 min voix/mois",
    ],
    cta: 'Commencer FIN GOURMET',
  },
];

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Créez votre compte, choisissez un plan — 7 jours offerts, sans carte bancaire. À l'issue de l'essai, vous recevez un email pour activer votre abonnement.",
  },
  {
    q: 'Puis-je changer de plan ?',
    a: 'Oui, à tout moment depuis votre dashboard. Le changement est immédiat, la facturation au prorata.',
  },
  {
    q: 'Que se passe-t-il si je dépasse mes quotas ?',
    a: "Vous êtes facturé automatiquement pour les conversations ou minutes supplémentaires au tarif overage de votre plan.",
  },
  {
    q: "Comment fonctionne l'agent voix ?",
    a: "Un numéro IA est attribué à votre restaurant. Redirigez vos appels vers ce numéro — Clara répond 24h/24 et prend les réservations automatiquement.",
  },
];

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#2a2a2a] py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="text-white font-medium text-sm">{question}</span>
        <span className={`text-[#b8f000] text-xl leading-none transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <p className="text-[#555] text-sm mt-3 leading-relaxed">{answer}</p>
      )}
    </div>
  );
};

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const handlePlanSelect = async (planId: string) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      navigate(`/register?plan=${planId}`);
      return;
    }

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Stripe error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-6">
      {/* Logo + tagline */}
      <div className="flex flex-col items-center mb-16 gap-3">
        <span className="text-4xl font-black tracking-tight text-white">
          Table<span className="text-[#b8f000]">Now</span>
        </span>
        <span className="text-sm text-[#555] tracking-wide">
          Your Restaurant Host(ess) 24/7
        </span>
      </div>

      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-3">
          Choisissez votre plan
        </h1>
        <p className="text-[#555] text-lg">
          7 jours gratuits · Sans engagement · Sans carte bancaire
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative bg-[#111] border rounded-2xl p-8 flex flex-col ${
              plan.popular
                ? 'border-[#b8f000]'
                : 'border-[#2a2a2a] hover:border-[#444] transition-colors'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[#b8f000] text-black text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                  Populaire
                </span>
              </div>
            )}

            <div className="text-[10px] uppercase tracking-[0.2em] text-[#555] mb-2 font-medium">
              {plan.name}
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className={`text-5xl font-black ${plan.popular ? 'text-[#b8f000]' : 'text-white'}`}>
                {plan.price}€
              </span>
              <span className="text-[#555] text-base">/mois</span>
            </div>

            <div className="text-[#b8f000] text-xs font-medium mb-2">
              7 jours gratuits inclus
            </div>

            <div className="text-[#555] text-sm mb-6">{plan.description}</div>

            <div className="h-px bg-[#2a2a2a] mb-6" />

            <ul className="flex flex-col gap-3 flex-1 mb-8">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    className="w-4 h-4 text-[#b8f000] mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-[#888]">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanSelect(plan.id)}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition ${
                plan.popular
                  ? 'bg-[#b8f000] text-black hover:opacity-90'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:border-[#b8f000] hover:text-[#b8f000]'
              }`}
            >
              {plan.cta} →
            </button>

            <p className="text-[#555] text-xs text-center mt-3">
              Sans carte bancaire · Annulation à tout moment
            </p>
          </div>
        ))}
      </div>

      {/* On Demand */}
      <div className="max-w-2xl mx-auto mt-12 bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#555] mb-2">ON DEMAND</div>
        <h3 className="text-xl font-bold text-white mb-2">Pas d'abonnement</h3>
        <p className="text-[#555] text-sm mb-4">
          Payez uniquement à l'usage · Toujours plus avantageux avec un plan
        </p>
        <div className="flex justify-center gap-8 text-sm text-[#888]">
          <span>0,08€ / conversation</span>
          <span>·</span>
          <span>0,20€ / minute voix</span>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Questions fréquentes</h2>
        {faqs.map((item, i) => (
          <FAQItem key={i} question={item.q} answer={item.a} />
        ))}
      </div>
    </div>
  );
};

export default Pricing;
