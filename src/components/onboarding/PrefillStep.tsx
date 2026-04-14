'use client';
// components/onboarding/PrefillStep.tsx
// Step 1 of restaurant onboarding — auto-fill from Google Maps + website

import { useState } from 'react';
import { Loader2, Search, Globe, MapPin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface PrefillResult {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  hours?: Record<string, string>;
  cuisine_type?: string;
  services?: string[];
  sources: string[];
  errors?: Record<string, string>;
}

interface PrefillStepProps {
  onComplete: (data: PrefillResult) => void;
}

export default function PrefillStep({ onComplete }: PrefillStepProps) {
  const [googleUrl, setGoogleUrl]   = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handlePrefill() {
    if (!googleUrl && !websiteUrl) {
      setError('Entrez au moins un lien Google Maps ou votre site web.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/restaurants/prefill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_maps_url: googleUrl  || undefined,
          website_url:     websiteUrl || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la récupération des données');
      }

      const data: PrefillResult = await res.json();
      onComplete(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="prefill-step">
      <div className="prefill-header">
        <h1>Your Restaurant Hostess 24/7</h1>
        <p className="prefill-subtitle">
          Gagnez du temps — on récupère les informations de votre établissement automatiquement.
        </p>
      </div>

      <div className="prefill-fields">

        {/* Google Maps */}
        <div className="prefill-field">
          <label htmlFor="google-url">
            <MapPin size={16} />
            Lien Google Maps <span className="optional">(recommandé)</span>
          </label>
          <input
            id="google-url"
            type="url"
            placeholder="https://maps.google.com/..."
            value={googleUrl}
            onChange={(e) => setGoogleUrl(e.target.value)}
            disabled={loading}
          />
          <span className="field-hint">
            Ouvrez votre fiche Google Business → cliquez "Partager" → copiez le lien
          </span>
        </div>

        {/* Website */}
        <div className="prefill-field">
          <label htmlFor="website-url">
            <Globe size={16} />
            Site web <span className="optional">(optionnel)</span>
          </label>
          <input
            id="website-url"
            type="url"
            placeholder="https://votre-restaurant.fr"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && <p className="prefill-error">{error}</p>}

        <button
          className="prefill-btn"
          onClick={handlePrefill}
          disabled={loading || (!googleUrl && !websiteUrl)}
        >
          {loading ? (
            <><Loader2 size={16} className="spin" /> Récupération en cours...</>
          ) : (
            <><Search size={16} /> Récupérer mes informations</>
          )}
        </button>

        <button
          className="prefill-skip"
          onClick={() => onComplete({ sources: [] })}
          disabled={loading}
        >
          Remplir manuellement
        </button>
      </div>
    </div>
  );
}
