import React, { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
import { AlertCircle, Mail, Eye, EyeOff, Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const fieldCls = (hasError: boolean) =>
  `w-full h-14 px-5 bg-[#1a1a1a] border rounded-xl text-sm text-white placeholder-[#555] focus:outline-none transition-colors ${
    hasError ? 'border-red-500 focus:border-red-500' : 'border-[#2a2a2a] focus:border-[#b8f000]'
  }`;

const labelCls = 'text-[10px] uppercase tracking-wider text-[#555] mb-2 block';

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

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

const T = {
  fr: {
    title: 'Créer votre compte',
    subtitle: 'Essai 7 jours gratuits · Résiliable à tout moment',
    restaurantLabel: 'RESTAURANT *',
    restaurantHint: 'Tapez le nom — sélectionnez dans la liste pour un remplissage automatique, ou continuez en saisie libre',
    restaurantPlaceholder: 'Ex: ANDIA, Le Cinq, Septime...',
    ownerLabel: 'RESPONSABLE *',
    ownerPlaceholder: 'Jean Dupont',
    emailLabel: 'E-MAIL *',
    emailPlaceholder: 'vous@restaurant.fr',
    passwordLabel: 'MOT DE PASSE *',
    confirmLabel: 'CONFIRMER *',
    phoneLabel: 'TÉLÉPHONE *',
    phonePlaceholder: '+33 1 23 45 67 89',
    cuisineLabel: 'TYPE DE CUISINE',
    cuisinePlaceholder: 'Française, Italienne...',
    addressLabel: 'ADRESSE *',
    addressPlaceholder: '12 Rue de la Paix, Paris',
    websiteLabel: 'SITE WEB',
    websiteHint: "Nous l'analysons pour mieux configurer votre assistant IA",
    websitePlaceholder: 'https://www.votre-restaurant.fr',
    submit: 'Créer mon compte',
    or: 'OU',
    google: "S'inscrire avec Google",
    hasAccount: 'Déjà un compte ?',
    signIn: 'Se connecter',
    yourInfo: 'Vos informations',
    autoFilled: 'Informations récupérées automatiquement',
    checkEmailTitle: 'Vérifiez votre email',
    checkEmailSent: 'Un lien de vérification a été envoyé à',
    onceActive: 'UNE FOIS ACTIVÉ',
    bullets: [
      'Votre assistant IA est configuré selon les standards de votre établissement',
      'Une ligne téléphonique dédiée vous est attribuée',
      'Une adresse BCC privée est créée pour centraliser vos réservations (Zenchef, SevenRooms...)',
    ],
    verifiedCta: "J'ai vérifié mon email →",
    notReceived: 'Pas reçu ? Vérifiez vos spams ou',
    resendLink: "renvoyez l'email",
    errorDefault: 'Une erreur est survenue.',
    errRequired: 'Champ requis',
    errEmail: 'Email invalide',
    errPassword: '8 caractères minimum',
    errConfirm: 'Mots de passe différents',
    errRestaurant: 'Veuillez saisir le nom de votre restaurant',
  },
  en: {
    title: 'Create your account',
    subtitle: '7-day free trial · Cancel anytime',
    restaurantLabel: 'RESTAURANT *',
    restaurantHint: 'Type the name — pick from the list to auto-fill, or continue with free text',
    restaurantPlaceholder: 'Ex: The Fat Duck, Nobu...',
    ownerLabel: 'OWNER NAME *',
    ownerPlaceholder: 'John Smith',
    emailLabel: 'E-MAIL *',
    emailPlaceholder: 'you@restaurant.com',
    passwordLabel: 'PASSWORD *',
    confirmLabel: 'CONFIRM *',
    phoneLabel: 'PHONE *',
    phonePlaceholder: '+44 20 1234 5678',
    cuisineLabel: 'CUISINE TYPE',
    cuisinePlaceholder: 'French, Italian...',
    addressLabel: 'ADDRESS *',
    addressPlaceholder: '12 Main Street, London',
    websiteLabel: 'WEBSITE',
    websiteHint: 'We analyse it to better configure your AI assistant',
    websitePlaceholder: 'https://www.your-restaurant.com',
    submit: 'Create my account',
    or: 'OR',
    google: 'Sign up with Google',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
    yourInfo: 'Your information',
    autoFilled: 'Information auto-filled',
    checkEmailTitle: 'Check your email',
    checkEmailSent: 'A verification link was sent to',
    onceActive: 'ONCE ACTIVATED',
    bullets: [
      'Your AI assistant is configured to your establishment standards',
      'A dedicated phone line is assigned to you',
      'A private BCC address is created to centralize your bookings (Zenchef, SevenRooms...)',
    ],
    verifiedCta: "I've verified my email →",
    notReceived: "Didn't get it? Check your spam or",
    resendLink: 'resend the email',
    errorDefault: 'Something went wrong.',
    errRequired: 'Required',
    errEmail: 'Invalid email',
    errPassword: 'Min 8 characters',
    errConfirm: 'Passwords do not match',
    errRestaurant: 'Please enter your restaurant name',
  },
};

const Register: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const [searchParams] = useSearchParams();
  void searchParams; // plan param reserved for Stripe integration
  const sessionToken = useRef(crypto.randomUUID());

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
  const [checkEmail, setCheckEmail] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Debounced place search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (val.length < 2) { setSuggestions([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/prefill/autocomplete?input=${encodeURIComponent(val)}&sessiontoken=${sessionToken.current}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    setSearchInput(description);
    setSuggestions([]);
    setGooglePlaceId(placeId);
    try {
      const res = await fetch(`/api/prefill/details?placeId=${placeId}&sessiontoken=${sessionToken.current}`);
      if (!res.ok) { setName(description.split(',')[0]?.trim() || ''); return; }
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
    } catch { setName(description.split(',')[0]?.trim() || ''); }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const restaurantName = (name || searchInput).trim();
    if (!restaurantName) {
      errs.place = t.errRestaurant;
      setTimeout(() => placeFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
    if (!ownerName.trim()) errs.ownerName = t.errRequired;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t.errEmail;
    if (password.length < 8) errs.password = t.errPassword;
    if (password !== confirmPassword) errs.confirmPassword = t.errConfirm;
    if (!phone.trim()) errs.phone = t.errRequired;
    if (!address.trim()) errs.address = t.errRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        confirmPassword,
        restaurantName: (name || searchInput).trim(),
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
      });
      if (res.status === 201) {
        setCheckEmail(true);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setGlobalError(e.response?.data?.error || t.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
    } catch { /* silent */ }
    finally {
      setResendLoading(false);
    }
  };

  // ── Check email screen (matches mockup) ──────────────────────────────────────
  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <span className="text-4xl font-black tracking-tight text-white">
              Table<span className="text-[#b8f000]">Now</span>
            </span>
          </div>

          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-10" style={{ borderTop: '4px solid #b8f000' }}>
            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full border-2 border-[#b8f000] bg-[#0a0a0a] flex items-center justify-center">
                <Mail size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t.checkEmailTitle}</h1>
                <p className="text-sm text-[#888] mt-2">
                  {t.checkEmailSent}<br />
                  <strong className="text-white break-all">{email}</strong>
                </p>
              </div>

              <div className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-5 text-left">
                <p className="text-[10px] font-bold tracking-[.18em] uppercase text-[#555] mb-3">{t.onceActive}</p>
                <ul className="space-y-2.5">
                  {t.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-[#b8f000] leading-5 flex-shrink-0">&#x25CF;</span>
                      <span className="text-[13px] text-[#ccc] leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/login"
                className="w-full h-12 bg-[#b8f000] text-black font-bold rounded-xl text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                {t.verifiedCta}
              </Link>

              <p className="text-xs text-[#555]">
                {t.notReceived}{' '}
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-[#b8f000] hover:underline disabled:opacity-60"
                >
                  {t.resendLink}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4">
      <div className="flex flex-col items-center mb-6 sm:mb-10 gap-3 pt-8 sm:pt-12">
        <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Table<span className="text-[#b8f000]">Now</span>
        </span>
        <span className="text-sm text-[#555] tracking-wide">Your Restaurant Host(ess) 24/7</span>
      </div>

      <div
        className="w-full max-w-2xl mx-auto mb-8 sm:mb-12 bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-12"
        style={{ borderTop: '4px solid #b8f000' }}
      >
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{t.title}</h1>
          <p className="text-[#555] text-sm">{t.subtitle}</p>
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
            <label className={labelCls}>{t.restaurantLabel}</label>
            <p className="text-xs text-[#555] mb-3">{t.restaurantHint}</p>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => handleSearchInput(e.target.value)}
                  placeholder={t.restaurantPlaceholder}
                  autoComplete="off"
                  className={`w-full bg-[#1a1a1a] border rounded-xl h-14 pl-11 pr-4 text-white text-sm focus:outline-none transition ${
                    errors.place ? 'border-red-500 focus:border-red-500' : 'border-[#b8f000]/40 focus:border-[#b8f000]'
                  }`}
                />
                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] animate-spin" size={16} />}
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
                  <span className="text-xs text-[#b8f000]">{t.autoFilled} &#x2713;</span>
                </div>
              )}
            </div>
            {errors.place && <p className="text-red-400 text-xs mt-2">{errors.place}</p>}
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">{t.yourInfo}</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          <div className="space-y-6">
            <div>
              <label className={labelCls}>{t.ownerLabel}</label>
              <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder={t.ownerPlaceholder} className={fieldCls(!!errors.ownerName)} />
              {errors.ownerName && <p className="text-red-400 text-xs mt-1">{errors.ownerName}</p>}
            </div>

            <div>
              <label className={labelCls}>{t.emailLabel}</label>
              <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className={fieldCls(!!errors.email)} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>{t.passwordLabel}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;" className={`${fieldCls(!!errors.password)} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className={labelCls}>{t.confirmLabel}</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;" className={`${fieldCls(!!errors.confirmPassword)} pr-12`} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>{t.phoneLabel}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t.phonePlaceholder} className={fieldCls(!!errors.phone)} />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className={labelCls}>{t.cuisineLabel}</label>
                <input type="text" value={cuisineType} onChange={e => setCuisineType(e.target.value)} placeholder={t.cuisinePlaceholder} className={fieldCls(false)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>{t.addressLabel}</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={t.addressPlaceholder} className={fieldCls(!!errors.address)} />
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className={labelCls}>{t.websiteLabel}</label>
              <p className="text-xs text-[#555] mb-2">{t.websiteHint}</p>
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder={t.websitePlaceholder} className={fieldCls(false)} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#b8f000] text-black font-black text-base rounded-xl hover:opacity-90 transition mt-8 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : t.submit}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#2a2a2a]" />
          <span className="text-xs text-[#555]">{t.or}</span>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>

        <button
          type="button"
          onClick={async () => {
            setGlobalError('');
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback` },
              });
              if (error) throw error;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              setGlobalError(msg || 'OAuth failed');
            }
          }}
          className="w-full h-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white flex items-center justify-center gap-3 hover:border-[#444] transition-colors"
        >
          <GoogleIcon />
          {t.google}
        </button>

        <p className="text-center text-sm text-[#555] mt-6">
          {t.hasAccount}{' '}
          <Link to="/login" className="text-[#b8f000] hover:underline font-medium">{t.signIn}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
