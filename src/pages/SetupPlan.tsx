import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stripeAPI } from '../lib/api';
import { AlertCircle, Loader2, Check } from 'lucide-react';

interface PlanOption {
  id: string;
  name: string;
  price: string;
  features: string[];
}

const plans: PlanOption[] = [
  {
    id: 'en_cas',
    name: 'En Cas',
    price: '79€/mois',
    features: ['Jusqu\'à 50 réservations/mois', 'Assistant IA basique', 'Ligne téléphonique'],
  },
  {
    id: 'miam',
    name: 'Miam',
    price: '249€/mois',
    features: ['Jusqu\'à 500 réservations/mois', 'Assistant IA avancé', 'Ligne téléphonique + SMS', 'Intégration BCC'],
  },
  {
    id: 'fin_gourmet',
    name: 'Fin Gourmet',
    price: '399€/mois',
    features: ['Réservations illimitées', 'Assistant IA premium', 'Lignes téléphoniques multiples', 'Intégration complète', 'Support prioritaire'],
  },
];

const SetupPlan: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const pendingPlan = localStorage.getItem('pending_plan');
    if (pendingPlan && plans.some(p => p.id === pendingPlan)) {
      setSelectedPlan(pendingPlan);
    }
  }, []);

  const handleContinue = async () => {
    if (!selectedPlan) {
      setError('Veuillez sélectionner une formule');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await stripeAPI.createCheckoutSession(selectedPlan);
      const { url } = response.data;

      if (!url) {
        setError('Impossible de créer la session de paiement');
        setLoading(false);
        return;
      }

      localStorage.removeItem('pending_plan');
      window.location.href = url;
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err));
      const apiError = (err as Record<string, unknown>)?.response?.data?.error;
      setError(apiError as string || errorMsg || 'Erreur lors de la création de la session de paiement');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-3">
            Choisissez votre formule
          </h1>
          <p className="text-[#888] text-lg">
            7 jours d'essai gratuit. Résiliable à tout moment.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl flex items-start gap-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              disabled={loading}
              className={`relative rounded-2xl p-8 text-left transition-all ${
                selectedPlan === plan.id
                  ? 'bg-[#111] border-2 border-[#b8f000] shadow-lg shadow-[#b8f000]/20'
                  : 'bg-[#111] border-2 border-[#2a2a2a] hover:border-[#b8f000]/50'
              } disabled:opacity-60`}
            >
              {/* Checkmark */}
              {selectedPlan === plan.id && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#b8f000] flex items-center justify-center">
                  <Check size={16} className="text-black" />
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>

              {/* Price */}
              <div className="text-3xl font-black text-[#b8f000] mb-6">{plan.price}</div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-[#888] flex items-start gap-2">
                    <span className="text-[#b8f000] mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleContinue}
            disabled={!selectedPlan || loading}
            className="w-full sm:w-auto px-8 h-14 bg-[#b8f000] text-black font-black rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Redirection vers le paiement...
              </>
            ) : (
              'Continuer vers le paiement'
            )}
          </button>
        </div>

        {/* Back link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/setup/restaurant', { replace: true })}
            disabled={loading}
            className="text-sm text-[#888] hover:text-white transition disabled:opacity-60"
          >
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupPlan;
