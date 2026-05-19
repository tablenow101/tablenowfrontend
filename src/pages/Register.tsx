import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
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

const planPrices: Record<string, string> = {
  en_cas: '79€/mois',
  miam: '249€/mois',
  fin_gourmet: '399€/mois',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2045c0-.638-.0573-1.252-.164-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087C16.6564 13.8209 17.64 11.6136 17.64 9.2045z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.806.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5836-5.036-3.7109H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1023-1.17.2827-1.71V4.9582H.9573C.3477 6.1732 0 7.548 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}



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
  const placeFieldRef = useRef<HTMLDivElement>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [openingHoursGoogle, setOpeningHoursGoogle] = useState<Record<string, unknown> | null>(null);
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
  const [emailSent, setEmailSent] = useState(false);

  const subtitle = selectedPlan
    ? `Essai 7 jours gratuits · Puis ${planPrices[selectedPlan] ?? selectedPlan} · Résiliable à tout moment`
    : 'Essai 7 jours gratuits · Résiliable à tout moment';

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
    // Always lock placeId — user picked from Google list.
    setGooglePlaceId(placeId);
    try {
      const res = await fetch(`/api/prefill/details?placeId=${placeId}&sessiontoken=${sessionToken.current}`);
      if (!res.ok) {
        // Graceful degradation: keep placeId but let user fill the rest manually.
        setName(description.split(',')[0]?.trim() || '');
        return;
      }
      const data = await res.json();
      setName(data.name || description.split(',')[0]?.trim() || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setWebsite(data.website || '');
      setCuisineType(data.cuisineType || '');
      setLat(data.lat ?? null);
      setLng(data.lng ?? null);
      setGoogleMapsUrl(data.mapsUrl || '');
      setOpeningHoursGoogle(data.openingHours || null);
    } catch {
      // Network failure — never block the user.
      setName(description.split(',')[0]?.trim() || '');
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!googlePlaceId) {
      errs.place = lang === 'fr'
        ? 'Tapez le nom de votre restaurant et sélectionnez-le dans la liste'
        : 'Type your restaurant name and select it from the list';
      setTimeout(() => placeFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
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
        localStorage.setItem('restaurant_slug', data.slug);
        if (selectedPlan) {
          localStorage.setItem('pending_plan', selectedPlan);
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
        // No plan or Stripe failed → go to dashboard
        navigate(`/r/${data.slug}/dashboard`);
      } else {
        // Email verification required — show success screen
        setEmailSent(true);
      }
    } catch {
      setGlobalError(lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8 sm:py-0">
      <div className="w-full max-w-md text-center">
          <div className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-10">
            Table<span style={{ color: '#b8f000' }}>Now</span>
          </div>
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-black mx-auto mb-4 sm:mb-6" style={{ background: '#b8f000' }}>✓</div>
            <h2 className="text-xl font-bold text-white mb-3">
              {lang === 'fr' ? 'Vérifiez votre email' : 'Check your email'}
            </h2>
            <p className="text-sm text-[#888] mb-4 sm:mb-6 leading-relaxed">
              {lang === 'fr' ? 'Un lien de vérification a été envoyé à' : 'A verification link was sent to'}{' '}
              <span className="text-white font-semibold">{email}</span>
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 text-left mb-4 sm:mb-6 space-y-2 sm:space-y-3">
              <p className="text-[10px] font-bold tracking-[.12em] uppercase text-[#555] mb-2 sm:mb-3">
                {lang === 'fr' ? 'UNE FOIS ACTIVÉ' : 'ONCE ACTIVATED'}
              </p>
              {[
                lang === 'fr' ? 'Votre assistant IA est configuré selon les standards de votre établissement' : 'Your AI assistant is configured to your establishment standards',
                lang === 'fr' ? 'Une ligne téléphonique dédiée vous est attribuée' : 'A dedicated phone line is assigned to you',
                lang === 'fr' ? 'Votre adresse BCC est créée pour centraliser vos réservations (Zenchef, SevenRooms…)' : 'Your BCC address is created to centralise your reservations',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-black" style={{ background: '#b8f000' }}>✓</div>
                  <span className="text-sm text-[#888]">{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full py-2 sm:py-3 rounded-xl text-sm font-bold text-black mb-3 sm:mb-4"
              style={{ background: '#b8f000' }}
            >
              {lang === 'fr' ? "J'ai vérifié mon email →" : 'I verified my email →'}
            </button>
            <p className="text-xs text-[#555]">
              {lang === 'fr' ? 'Pas reçu ? Vérifiez vos spams.' : "Didn't receive it? Check your spam folder."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6 sm:mb-10 gap-3 pt-8 sm:pt-12">
        <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Table<span className="text-[#b8f000]">Now</span>
        </span>
        <span className="text-sm text-[#555] tracking-wide">
          Your Restaurant Host(ess) 24/7
        </span>
      </div>

      <div
        className="w-full max-w-2xl mx-auto mb-8 sm:mb-12 bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-12"
        style={{ borderTop: '4px solid #b8f000' }}
      >
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {lang === 'fr' ? 'Créer votre compte' : 'Create your account'}
          </h1>
          <p className="text-[#555] text-sm">{subtitle}</p>
          {selectedPlan && (
            <div className="flex items-center gap-2 mt-3 sm:mt-4 bg-[#1a1a1a] border border-[#b8f000]/30 rounded-xl px-3 sm:px-4 py-2 sm:py-3">
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
          <div className="mb-8" ref={placeFieldRef}>
            <label className={labelCls}>RESTAURANT *</label>
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
                  className={`w-full bg-[#1a1a1a] border rounded-xl h-14 pl-11 pr-4 text-white text-sm focus:outline-none outline-none transition ${
                    errors.place ? 'border-red-500 focus:border-red-500' : 'border-[#b8f000]/40 focus:border-[#b8f000]'
                  }`}
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
            {errors.place && <p className="text-red-400 text-xs mt-2">{errors.place}</p>}
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
            {/* Row 1: Owner name */}
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

            {/* Row 2: Email */}
            <div>
              <label className={labelCls}>E-MAIL *</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={lang === 'fr' ? 'vous@restaurant.fr' : 'you@restaurant.com'}
                className={fieldCls(!!errors.email)}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Row 3: Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>
                  {lang === 'fr' ? 'MOT DE PASSE' : 'PASSWORD'} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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
                    autoComplete="new-password"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

            {/* Row 6: Website */}
            <div>
              <label className={labelCls}>
                {lang === 'fr' ? 'SITE WEB' : 'WEBSITE'}
              </label>
              <p className="text-xs text-[#555] mb-2">
                {lang === 'fr'
                  ? "Nous l'analysons pour mieux configurer votre assistant IA"
                  : 'We analyse it to better configure your AI assistant'}
              </p>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder={lang === 'fr' ? 'https://www.votre-restaurant.fr' : 'https://www.your-restaurant.com'}
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

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#2a2a2a]" />
          <span className="text-xs text-[#555]">{lang === 'fr' ? 'OU' : 'OR'}</span>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_API_URL || 'https://api.tablenow.io'}/api/auth/google`;
          }}
          className="w-full h-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white flex items-center justify-center gap-3 hover:border-[#444] transition-colors"
        >
          <GoogleIcon />
          {lang === 'fr' ? "S'inscrire avec Google" : 'Sign up with Google'}
        </button>

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
