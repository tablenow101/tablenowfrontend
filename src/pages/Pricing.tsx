import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const plans = [
  {
    id: 'en_cas',
    name: 'EN CAS',
    price: 79,
    popular: false,
    description: 'Pour démarrer et ne plus manquer un seul appel.',
    features: [
      'Numéro IA dédié — répond 24h/24, 7j/7',
      'Prise, modification et annulation de réservations',
      'Dashboard réservations + historique des appels',
      'Email de confirmation automatique au client',
      'Intégration BCC Zenchef / SevenRooms',
    ],
    inherited: false,
    inheritedLabel: '',
    cta: 'Commencer EN CAS',
  },
  {
    id: 'miam',
    name: 'MIAM',
    price: 249,
    popular: true,
    description: 'Pour les restaurants qui veulent automatiser leur accueil.',
    features: [
      'Rappels SMS automatiques avant chaque réservation',
      'Gestion des no-shows — relance automatique',
      'Fiche client — historique et préférences',
      'Insights — remplissage et créneaux à optimiser',
    ],
    inherited: true,
    inheritedLabel: 'Tout EN CAS inclus',
    cta: 'Commencer MIAM',
  },
  {
    id: 'fin_gourmet',
    name: 'FIN GOURMET',
    price: 399,
    popular: false,
    description: 'Pour les établissements à fort volume ou multi-sites.',
    features: [
      'Multi-établissements depuis un seul compte',
      'Responsable de compte dédié (CSM)',
      'Support 7j/7 — réponse en moins de 2h',
      'Intégrations et configurations sur mesure',
    ],
    inherited: true,
    inheritedLabel: 'Tout MIAM inclus',
    cta: 'Commencer FIN GOURMET',
  },
];

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Créez votre compte et accédez à toutes les fonctionnalités pendant 7 jours. À l'issue de l'essai, renseignez vos informations de paiement pour continuer.",
  },
  {
    q: 'Puis-je changer de plan ?',
    a: 'Oui, à tout moment depuis votre dashboard. Le changement est immédiat, la facturation au prorata.',
  },
  {
    q: "Comment fonctionne l'agent vocal ?",
    a: "Un numéro IA est attribué à votre restaurant. Redirigez vos appels vers ce numéro — votre assistant répond 24h/24 et prend les réservations automatiquement.",
  },
  {
    q: "Qu'est-ce que l'intégration BCC ?",
    a: "Une adresse email unique vous est attribuée. Ajoutez-la en copie cachée (BCC) dans Zenchef ou SevenRooms — TableNow reçoit automatiquement vos réservations.",
  },
];

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #1a1a1a', padding: '18px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{question}</span>
        <span style={{ color: '#b8f000', fontSize: 20, lineHeight: 1, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .15s', flexShrink: 0, marginLeft: 12 }}>+</span>
      </button>
      {open && <p style={{ color: '#555', fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>{answer}</p>}
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
      const res = await api.post('/stripe/create-checkout-session', { plan: planId });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      console.error('Stripe error:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '64px 24px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Choisissez votre plan</h1>
        <p style={{ fontSize: 16, color: '#555' }}>7 jours gratuits · Sans engagement</p>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 960, margin: '0 auto 64px' }}>
        {plans.map(plan => (
          <div
            key={plan.id}
            style={{
              background: '#111',
              border: `1px solid ${plan.popular ? '#b8f000' : '#1a1a1a'}`,
              borderRadius: 12,
              padding: '28px 22px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Badge row */}
            <div style={{ height: 26, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {plan.popular && (
                <span style={{ background: '#b8f000', color: '#000', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '2px 10px', borderRadius: 3 }}>
                  Le plus populaire
                </span>
              )}
            </div>

            {/* Name */}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#555', height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              {plan.name}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, height: 52, marginBottom: 6, justifyContent: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', alignSelf: 'flex-start', paddingTop: 10 }}>€</span>
              <span style={{ fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: '#555', alignSelf: 'flex-end', paddingBottom: 4, marginLeft: 2 }}>/mois</span>
            </div>

            {/* Trial */}
            <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 12, color: '#b8f000' }}>
              7 jours gratuits inclus
            </div>

            {/* Description */}
            <div style={{ height: 38, fontSize: 13, color: '#888', lineHeight: 1.5, overflow: 'hidden', marginBottom: 20, textAlign: 'center' }}>
              {plan.description}
            </div>

            <div style={{ borderTop: '1px solid #1a1a1a', marginBottom: 20 }} />

            {/* Features */}
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {plan.inherited && (
                <li style={{ fontSize: 13, color: '#444', display: 'flex', alignItems: 'flex-start', gap: 9, lineHeight: 1.4 }}>
                  <span style={{ width: 16, height: 16, minWidth: 16, borderRadius: '50%', border: '1px solid #252525', background: '#181818', color: '#333', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>✓</span>
                  {plan.inheritedLabel}
                </li>
              )}
              {plan.features.map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'flex-start', gap: 9, lineHeight: 1.4 }}>
                  <span style={{ width: 16, height: 16, minWidth: 16, borderRadius: '50%', border: '1px solid rgba(184,240,0,0.3)', background: 'rgba(184,240,0,0.08)', color: '#b8f000', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => handlePlanSelect(plan.id)}
              style={{ width: '100%', height: 48, background: '#b8f000', color: '#000', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {plan.cta}
            </button>
            <p style={{ fontSize: 11, color: '#2a2a2a', textAlign: 'center', marginTop: 10 }}>Résiliable à tout moment</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 32 }}>Questions fréquentes</h2>
        {faqs.map((item, i) => <FAQItem key={i} question={item.q} answer={item.a} />)}
      </div>

    </div>
  );
};

export default Pricing;
