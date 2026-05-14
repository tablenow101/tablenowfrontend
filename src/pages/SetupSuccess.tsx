import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';
import { Phone, Copy, Check, ArrowRight } from 'lucide-react';

const T = {
  fr: {
    title: 'Votre assistant TableNow est prêt',
    subtitle: 'Bienvenue dans l\'équipe TableNow',
    testCall: 'Appeler pour tester',
    copyNumber: 'Copier le numéro',
    copied: 'Copié !',
    forwardingSection: 'Rediriger vos appels vers TableNow',
    forwardingDesc: 'Voici comment configurer le transfert d\'appels depuis votre numéro vers votre assistant IA :',
    iPhoneSteps: 'iPhone (mode renvoi d\'appel)',
    iPhoneStep1: 'Ouvrez Réglages > Téléphone',
    iPhoneStep2: 'Allez dans « Renvoi d\'appel »',
    iPhoneStep3: 'Activez le renvoi d\'appel',
    iPhoneStep4: 'Entrez le numéro TableNow',
    androidSteps: 'Android (configuration)',
    androidStep1: 'Ouvrez Téléphone > Paramètres',
    androidStep2: 'Accédez aux « Numéros d\'accès »',
    androidStep3: 'Sélectionnez « Renvoi d\'appel »',
    androidStep4: 'Entrez le numéro TableNow',
    activating: 'Votre numéro TableNow est en cours d\'activation.',
    activatingDesc: 'Il sera opérationnel dans quelques minutes.',
    toDashboard: 'Accéder au dashboard',
    goToDashboard: 'Aller au dashboard',
  },
  en: {
    title: 'Your TableNow assistant is ready',
    subtitle: 'Welcome to the TableNow team',
    testCall: 'Test the call',
    copyNumber: 'Copy number',
    copied: 'Copied!',
    forwardingSection: 'Forward your calls to TableNow',
    forwardingDesc: 'Here\'s how to set up call forwarding from your number to your AI assistant:',
    iPhoneSteps: 'iPhone (call forwarding mode)',
    iPhoneStep1: 'Open Settings > Phone',
    iPhoneStep2: 'Go to "Call Forwarding"',
    iPhoneStep3: 'Enable call forwarding',
    iPhoneStep4: 'Enter TableNow number',
    androidSteps: 'Android (configuration)',
    androidStep1: 'Open Phone > Settings',
    androidStep2: 'Access "Access Numbers"',
    androidStep3: 'Select "Call Forwarding"',
    androidStep4: 'Enter TableNow number',
    activating: 'Your TableNow number is being activated.',
    activatingDesc: 'It will be operational in a few minutes.',
    toDashboard: 'Go to dashboard',
    goToDashboard: 'Go to dashboard',
  },
};

const SetupSuccess: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = T[lang];
  const navigate = useNavigate();

  const vapiPhoneNumber = (user as unknown)?.vapi_phone_number as string | undefined;
  const [copied, setCopied] = useState(false);

  const copyNumber = () => {
    if (vapiPhoneNumber) {
      navigator.clipboard.writeText(vapiPhoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestCall = () => {
    if (vapiPhoneNumber) {
      window.location.href = `tel:${vapiPhoneNumber}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8 sm:mb-12 text-center">
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#b8f000' }}>
            <Check className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-[#888] text-base mb-4 sm:mb-6">{t.subtitle}</p>
        {user?.name && (
          <p className="text-white font-semibold text-lg">{user.name}</p>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto space-y-8 sm:space-y-12">
        {/* AI Phone Number Section */}
        {vapiPhoneNumber ? (
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <Phone className="w-6 h-6 text-[#b8f000]" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {vapiPhoneNumber}
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleTestCall}
                className="flex-1 h-14 bg-[#b8f000] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Phone size={18} />
                {t.testCall}
              </button>
              <button
                onClick={copyNumber}
                className="flex-1 h-14 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-semibold rounded-xl hover:border-[#b8f000]/50 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check size={18} className="text-[#b8f000]" />
                    <span className="text-[#b8f000]">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    {t.copyNumber}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#b8f000' }}>
              <Phone className="w-6 h-6 text-black" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">{t.activating}</p>
            <p className="text-[#888] text-sm">{t.activatingDesc}</p>
          </div>
        )}

        {/* Call Forwarding Instructions */}
        {vapiPhoneNumber && (
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t.forwardingSection}</h2>
            <p className="text-[#888] mb-6 sm:mb-8">{t.forwardingDesc}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* iPhone */}
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  {t.iPhoneSteps}
                </h3>
                <ol className="space-y-2 sm:space-y-3">
                  {[t.iPhoneStep1, t.iPhoneStep2, t.iPhoneStep3, t.iPhoneStep4].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#b8f000] text-black text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-[#888] text-sm pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Android */}
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  {t.androidSteps}
                </h3>
                <ol className="space-y-2 sm:space-y-3">
                  {[t.androidStep1, t.androidStep2, t.androidStep3, t.androidStep4].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#b8f000] text-black text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-[#888] text-sm pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={() => navigate(`/r/${user?.slug}/dashboard`)}
            className="inline-flex items-center gap-2 h-14 px-8 bg-[#b8f000] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            {t.goToDashboard}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupSuccess;
