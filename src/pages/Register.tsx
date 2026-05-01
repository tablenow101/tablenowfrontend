import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Search, Loader2 } from 'lucide-react';

const T = {
  fr: {
    title: 'Créer votre compte',
    subtitle: 'Commencez votre essai gratuit de 14 jours',
    restaurantLabel: 'VOTRE RESTAURANT',
    restaurantSubtitle: 'Tapez le nom pour remplir automatiquement',
    restaurantPlaceholder: 'Ex : ANDIA, Le Cinq, Septime…',
    autoFilled: 'Informations récupérées automatiquement',
    divider: 'Vos informations',
    nameLabel: 'NOM DU RESTAURANT',
    ownerLabel: 'RESPONSABLE',
    emailLabel: 'E-MAIL',
    passwordLabel: 'MOT DE PASSE',
    confirmLabel: 'CONFIRMER',
    phoneLabel: 'TÉLÉPHONE',
    cuisineLabel: 'TYPE DE CUISINE',
    addressLabel: 'ADRESSE',
    websiteLabel: 'SITE WEB',
    websiteOptional: '(optionnel)',
    namePlaceholder: 'Le Petit Bistro',
    ownerPlaceholder: 'Jean Dupont',
    emailPlaceholder: 'vous@restaurant.fr',
    passwordPlaceholder: '••••••••',
    phonePlaceholder: '+33 1 23 45 67 89',
    cuisinePlaceholder: 'Française, Italienne…',
    addressPlaceholder: '12 Rue de la Paix, Paris',
    websitePlaceholder: 'https://monrestaurant.fr',
    submit: 'Créer mon compte →',
    hasAccount: 'Déjà un compte ?',
    signIn: 'Se connecter',
    errorRequired: 'Ce champ est obligatoire.',
    errorEmail: 'Email invalide.',
    errorPasswordShort: 'Minimum 8 caractères.',
    errorPasswordMatch: 'Les mots de passe ne correspondent pas.',
    errorDefault: 'Une erreur est survenue.',
    successTitle: 'Compte créé !',
    successText: 'Vérifiez votre boîte mail pour activer votre compte.',
    successRedirect: 'Redirection vers la connexion…',
  },
  en: {
    title: 'Create your account',
    subtitle: 'Start your 14-day free trial',
    restaurantLabel: 'YOUR RESTAURANT',
    restaurantSubtitle: 'Type the name to auto-fill',
    restaurantPlaceholder: 'Ex: The Fat Duck, Nobu…',
    autoFilled: 'Information auto-filled',
    divider: 'Your information',
    nameLabel: 'RESTAURANT NAME',
    ownerLabel: 'OWNER NAME',
    emailLabel: 'E-MAIL',
    passwordLabel: 'PASSWORD',
    confirmLabel: 'CONFIRM PASSWORD',
    phoneLabel: 'PHONE',
    cuisineLabel: 'CUISINE TYPE',
    addressLabel: 'ADDRESS',
    websiteLabel: 'WEBSITE',
    websiteOptional: '(optional)',
    namePlaceholder: 'The Little Bistro',
    ownerPlaceholder: 'John Smith',
    emailPlaceholder: 'you@restaurant.com',
    passwordPlaceholder: '••••••••',
    phonePlaceholder: '+44 20 1234 5678',
    cuisinePlaceholder: 'French, Italian…',
    addressPlaceholder: '12 Main Street, London',
    websitePlaceholder: 'https://myrestaurant.com',
    submit: 'Create my account →',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
    errorRequired: 'This field is required.',
    errorEmail: 'Invalid email.',
    errorPasswordShort: 'Minimum 8 characters.',
    errorPasswordMatch: 'Passwords do not match.',
    errorDefault: 'Something went wrong.',
    successTitle: 'Account created!',
    successText: 'Check your email to activate your account.',
    successRedirect: 'Redirecting to login…',
  },
};

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

const field = (hasError: boolean) =>
  `w-full h-14 px-4 bg-[#1a1a1a] border rounded-xl text-sm text-white placeholder-[#555] focus:outline-none transition-colors ${
    hasError ? 'border-red-500 focus:border-red-500' : 'border-[#2a2a2a] focus:border-[#b8f000]'
  }`;

const Register: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const { register } = useAuth();
  const navigate = useNavigate();

  // Places search
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sessionToken] = useState(() => crypto.randomUUID());
  const [searching, setSearching] = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [openingHoursGoogle, setOpeningHoursGoogle] = useState<any>(null);
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();

  // Form fields
  const [name, setName]                   = useState('');
  const [ownerName, setOwnerName]         = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone]                 = useState('');
  const [cuisineType, setCuisineType]     = useState('');
  const [address, setAddress]             = useState('');
  const [website, setWebsite]             = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  // State
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  // Debounced Places autocomplete
  useEffect(() => {
    if (searchInput.length < 2) { setSuggestions([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/prefill/autocomplete?input=${encodeURIComponent(searchInput)}&sessiontoken=${sessionToken}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, sessionToken]);

  const handleSelectPlace = async (placeId: string, description: string) => {
    setSearchInput(description);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/prefill/details?placeId=${placeId}&sessiontoken=${sessionToken}`);
      const data = await res.json();
      setName(data.name || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setWebsite(data.website || '');
      setCuisineType(data.cuisineType || '');
      setLat(data.lat);
      setLng(data.lng);
      setGooglePlaceId(placeId);
      setGoogleMapsUrl(data.mapsUrl || '');
      setOpeningHoursGoogle(data.openingHours || null);
    } catch { /* silent — user can fill manually */ }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())           e.name            = t.errorRequired;
    if (!ownerName.trim())      e.ownerName        = t.errorRequired;
    if (!email.trim())          e.email            = t.errorRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t.errorEmail;
    if (!password)              e.password         = t.errorRequired;
    else if (password.length < 8) e.password       = t.errorPasswordShort;
    if (!confirmPassword)       e.confirmPassword   = t.errorRequired;
    else if (password !== confirmPassword) e.confirmPassword = t.errorPasswordMatch;
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      await register({
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
        google_place_id:      googlePlaceId || undefined,
        google_maps_url:      googleMapsUrl || undefined,
        opening_hours_google: openingHoursGoogle || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || t.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-10" style={{ borderTop: '4px solid #b8f000' }}>
            <CheckCircle2 size={48} className="text-[#b8f000] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t.successTitle}</h2>
            <p className="text-[#888] text-sm mb-2">{t.successText}</p>
            <p className="text-xs text-[#555]">{t.successRedirect}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Logo + tagline */}
        <div className="flex flex-col items-center mb-10 gap-3">
          <span className="text-4xl font-black tracking-tight text-white">
            Table<span className="text-[#b8f000]">Now</span>
          </span>
          <span className="text-sm text-[#555] tracking-wide">
            Your Restaurant Host(ess) 24/7
          </span>
        </div>

        <div
          className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-10"
          style={{ borderTop: '4px solid #b8f000' }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">{t.title}</h1>
          <p className="text-sm text-[#888] mb-8">{t.subtitle}</p>

          {globalError && (
            <div className="mb-6 p-3 rounded-xl flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Google Places search */}
            <div className="mb-2">
              <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1">
                {t.restaurantLabel}
              </label>
              <p className="text-xs text-[#555] mb-2">{t.restaurantSubtitle}</p>
            </div>
            <div className="relative mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder={t.restaurantPlaceholder}
                  autoComplete="off"
                  className="w-full bg-[#1a1a1a] border border-[#b8f000]/40 rounded-xl h-14 pl-10 pr-4 text-white text-sm focus:border-[#b8f000] outline-none transition"
                />
                {searching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] animate-spin" size={16} />
                )}
              </div>

              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.map(s => (
                    <button
                      key={s.placeId}
                      type="button"
                      onClick={() => handleSelectPlace(s.placeId, s.description)}
                      className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] transition border-b border-[#1a1a1a] last:border-0"
                    >
                      <div className="text-white text-sm font-medium">{s.mainText}</div>
                      <div className="text-[#555] text-xs mt-0.5">{s.secondaryText}</div>
                    </button>
                  ))}
                </div>
              )}

              {googlePlaceId && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-[#b8f000] rounded-full" />
                  <span className="text-xs text-[#b8f000]">{t.autoFilled}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#2a2a2a]" />
              <span className="text-[10px] uppercase tracking-wider text-[#555]">{t.divider}</span>
              <div className="flex-1 h-px bg-[#2a2a2a]" />
            </div>

            <div className="space-y-5">
              {/* Row 1: Restaurant name + Owner */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.nameLabel} *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className={field(!!errors.name)} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.ownerLabel} *</label>
                  <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
                    placeholder={t.ownerPlaceholder}
                    className={field(!!errors.ownerName)} />
                  {errors.ownerName && <p className="text-red-400 text-xs mt-1">{errors.ownerName}</p>}
                </div>
              </div>

              {/* Row 2: Email */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.emailLabel} *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className={field(!!errors.email)} />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Row 3: Password + Confirm */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.passwordLabel} *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className={`${field(!!errors.password)} pr-12`} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.confirmLabel} *</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className={`${field(!!errors.confirmPassword)} pr-12`} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Row 4: Phone + Cuisine */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.phoneLabel}</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder} className={field(false)} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.cuisineLabel}</label>
                  <input type="text" value={cuisineType} onChange={e => setCuisineType(e.target.value)}
                    placeholder={t.cuisinePlaceholder} className={field(false)} />
                </div>
              </div>

              {/* Row 5: Address */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">{t.addressLabel}</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder={t.addressPlaceholder} className={field(false)} />
              </div>

              {/* Row 6: Website */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1.5">
                  {t.websiteLabel}{' '}
                  <span className="text-[#555] normal-case tracking-normal">{t.websiteOptional}</span>
                </label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder={t.websitePlaceholder} className={field(false)} />
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#b8f000] text-black font-bold rounded-xl text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                {t.submit}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-[#555]">
            {t.hasAccount}{' '}
            <Link to="/login" className="text-[#b8f000] hover:underline">{t.signIn}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
