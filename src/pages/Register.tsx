import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { AlertCircle, Eye, EyeOff, Search, Loader2 } from 'lucide-react';

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

const fieldCls = (hasError: boolean) =>
  `w-full h-14 px-5 bg-[#1a1a1a] border rounded-xl text-sm text-white placeholder-[#555] focus:outline-none transition-colors ${
    hasError ? 'border-red-500 focus:border-red-500' : 'border-[#2a2a2a] focus:border-[#b8f000]'
  }`;

const labelCls = 'text-[10px] uppercase tracking-wider text-[#555] mb-2 block';

const Register: React.FC = () => {
  const { lang } = useLang();
  const navigate = useNavigate();

  const sessionToken = useRef(crypto.randomUUID());
  const [selectedPlan] = useState(() => new URLSearchParams(window.location.search).get('plan') || '');

  // Places search
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [openingHoursGoogle, setOpeningHoursGoogle] = useState<any>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchInput.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/prefill/autocomplete?input=${encodeURIComponent(searchInput)}&sessiontoken=${sessionToken.current}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSelectPlace = async (placeId: string, description: string) => {
    setSearchInput(description);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/prefill/details?placeId=${placeId}&sessiontoken=${sessionToken.current}`);
      const data = await res.json();
      setName(data.name || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setWebsite(data.website || '');
      setCuisineType(data.cuisineType || '');
      setLat(data.lat ?? null);
      setLng(data.lng ?? null);
      setGooglePlaceId(placeId);
      setGoogleMapsUrl(data.mapsUrl || '');
      setOpeningHoursGoogle(data.openingHours || null);
    } catch (e) {
      console.error('Places details error:', e);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = lang === 'fr' ? 'Champ requis' : 'Required';
    if (!ownerName.trim()) errs.ownerName = lang === 'fr' ? 'Champ requis' : 'Required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = lang === 'fr' ? 'Email invalide' : 'Invalid email';
    if (password.length < 8)
      errs.password = lang === 'fr' ? '8 caractères minimum' : 'Min 8 characters';
    if (password !== confirmPassword)
      errs.confirmPassword = lang === 'fr' ? 'Mots de passe différents' : 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          restaurantName: name,
          ownerName,
          phone,
          address,
          cuisineType,
          website,
          language: lang,
          lat,
          lng,
          google_place_id: googlePlaceId || undefined,
          google_maps_url: googleMapsUrl || undefined,
          opening_hours_google: openingHoursGoogle || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || (lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.'));
        return;
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (selectedPlan) {
          const stripeRes = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({ plan: selectedPlan }),
          });
          const stripeData = await stripeRes.json();
          if (stripeData.url) {
            window.location.href = stripeData.url;
            return;
          }
        }
        navigate('/pricing');
      }
    } catch {
      setGlobalError(lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4">
      <div
        className="w-full max-w-2xl mx-auto mt-12 mb-12 bg-[#111] border border-[#2a2a2a] rounded-2xl p-12"
        style={{ borderTop: '4px solid #b8f000' }}
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white mb-2">
            {lang === 'fr' ? 'Créer votre compte' : 'Create your account'}
          </h1>
          <p className="text-[#555] text-sm">
            {lang === 'fr'
              ? '7 jours gratuits · Sans carte bancaire · Sans engagement'
              : '7 days free · No credit card · No commitment'}
          </p>
          {selectedPlan && (
            <div className="flex items-center gap-2 mt-4 bg-[#1a1a1a] border border-[#b8f000]/30 rounded-xl px-4 py-3">
              <div className="w-2 h-2 bg-[#b8f000] rounded-full flex-shrink-0" />
              <span className="text-sm text-white">
                {lang === 'fr' ? 'Plan sélectionné :' : 'Selected plan:'}{' '}
                <span className="text-[#b8f000] font-bold uppercase">{selectedPlan.replace('_', ' ')}</span>
              </span>
              <span className="text-xs text-[#555] ml-auto">7 jours gratuits</span>
            </div>
          )}
        </div>

        {globalError && (
          <div className="mb-6 p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Google Places search */}
          <div className="mb-8">
            <label className={labelCls}>
              {lang === 'fr' ? 'Votre restaurant' : 'Your restaurant'}
            </label>
            <p className="text-xs text-[#555] mb-3">
              {lang === 'fr'
                ? 'Tapez le nom — nous remplissons tout automatiquement'
                : 'Type the name — we auto-fill everything'}
            </p>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder={lang === 'fr' ? 'Ex: ANDIA, Le Cinq, Septime...' : 'Ex: The Fat Duck, Nobu...'}
                  autoComplete="off"
                  className="w-full bg-[#1a1a1a] border border-[#b8f000]/40 rounded-xl h-14 pl-11 pr-4 text-white text-sm focus:border-[#b8f000] outline-none transition"
                />
                {searching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] animate-spin" size={16} />
                )}
              </div>

              {suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                  {suggestions.map(s => (
                    <button
                      key={s.placeId}
                      type="button"
                      onClick={() => handleSelectPlace(s.placeId, s.description)}
                      className="w-full text-left px-4 py-3.5 hover:bg-[#1a1a1a] transition border-b border-[#1a1a1a] last:border-0"
                    >
                      <div className="text-white text-sm font-medium">{s.mainText}</div>
                      <div className="text-[#555] text-xs mt-0.5">{s.secondaryText}</div>
                    </button>
                  ))}
                </div>
              )}

              {googlePlaceId && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 bg-[#b8f000] rounded-full" />
                  <span className="text-xs text-[#b8f000]">
                    {lang === 'fr' ? 'Informations récupérées automatiquement ✓' : 'Information auto-filled ✓'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">
              {lang === 'fr' ? 'Vos informations' : 'Your information'}
            </span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          <div className="space-y-6">
            {/* Row 1: Restaurant name + Owner */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>
                  {lang === 'fr' ? 'NOM DU RESTAURANT' : 'RESTAURANT NAME'} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={lang === 'fr' ? 'Le Petit Bistro' : 'The Little Bistro'}
                  className={fieldCls(!!errors.name)}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className={labelCls}>
                  {lang === 'fr' ? 'RESPONSABLE' : 'OWNER NAME'} *
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder={lang === 'fr' ? 'Jean Dupont' : 'John Smith'}
                  className={fieldCls(!!errors.ownerName)}
                />
                {errors.ownerName && <p className="text-red-400 text-xs mt-1">{errors.ownerName}</p>}
              </div>
            </div>

            {/* Row 2: Email */}
            <div>
              <label className={labelCls}>E-MAIL *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={lang === 'fr' ? 'vous@restaurant.fr' : 'you@restaurant.com'}
                className={fieldCls(!!errors.email)}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Row 3: Password + Confirm */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>
                  {lang === 'fr' ? 'MOT DE PASSE' : 'PASSWORD'} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${fieldCls(!!errors.password)} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className={labelCls}>
                  {lang === 'fr' ? 'CONFIRMER' : 'CONFIRM'} *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${fieldCls(!!errors.confirmPassword)} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Row 4: Phone + Cuisine */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>
                  {lang === 'fr' ? 'TÉLÉPHONE' : 'PHONE'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={lang === 'fr' ? '+33 1 23 45 67 89' : '+44 20 1234 5678'}
                  className={fieldCls(false)}
                />
              </div>
              <div>
                <label className={labelCls}>
                  {lang === 'fr' ? 'TYPE DE CUISINE' : 'CUISINE TYPE'}
                </label>
                <input
                  type="text"
                  value={cuisineType}
                  onChange={e => setCuisineType(e.target.value)}
                  placeholder={lang === 'fr' ? 'Française, Italienne…' : 'French, Italian…'}
                  className={fieldCls(false)}
                />
              </div>
            </div>

            {/* Row 5: Address */}
            <div>
              <label className={labelCls}>
                {lang === 'fr' ? 'ADRESSE' : 'ADDRESS'}
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={lang === 'fr' ? '12 Rue de la Paix, Paris' : '12 Main Street, London'}
                className={fieldCls(false)}
              />
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#b8f000] text-black font-black text-base rounded-xl hover:opacity-90 transition mt-8 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <Loader2 className="animate-spin" size={20} />
                : (lang === 'fr' ? 'Créer mon compte →' : 'Create my account →')
              }
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-[#555] mt-6">
          {lang === 'fr' ? 'Déjà un compte ? ' : 'Already have an account? '}
          <Link to="/login" className="text-[#b8f000] hover:underline font-medium">
            {lang === 'fr' ? 'Se connecter' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
