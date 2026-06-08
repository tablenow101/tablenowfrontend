import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { LangProvider } from './context/LangProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Logout from './pages/Logout';
import AuthCallback from './pages/AuthCallback';
import Debug from './pages/Debug';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import CallLogs from './pages/CallLogs';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import NotLinked from './pages/NotLinked';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

function isDomainMarketingSite() {
  return window.location.hostname === 'tablenow.io' || window.location.hostname === 'www.tablenow.io';
}

function CenteredSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loading w-12 h-12"></div>
    </div>
  );
}

// Public routes - always accessible
const PublicRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// Does the backend want this user on the onboarding screen? This is the ONLY
// business decision the frontend reads, and it is fully owned by the backend
// (resolveNextRoute → app-state.next_route). The frontend never recomputes
// completeness from slug / is_complete / heuristics.
function wantsOnboarding(nextRoute: string | null | undefined): boolean {
  return !!nextRoute && nextRoute.endsWith('/onboarding');
}

// Slug-scoped app pages (/r/:slug/dashboard, /settings, …). Responsibilities limited
// to: auth protection, canonical slug control, and following next_route. An authenticated
// user with no linked restaurant gets a contained error (NotLinked), never a login loop.
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { restaurant, session, appState, authReady } = useAuth();
  const { slug } = useParams();

  if (!authReady) return <CenteredSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!restaurant?.id || !restaurant?.slug) return <NotLinked />;

  const mySlug = restaurant.slug as string;
  if (slug && slug !== mySlug) {
    return <Navigate to={`/r/${mySlug}/dashboard`} replace />;
  }
  // Backend says the profile is incomplete → follow next_route to onboarding.
  if (wantsOnboarding(appState?.next_route)) {
    return <Navigate to={appState!.next_route as string} replace />;
  }
  return <>{children}</>;
};

// Onboarding screen guard. Same protections, but the inverse next_route gate: if the
// backend no longer wants onboarding (profile complete), follow next_route forward.
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { restaurant, session, appState, authReady } = useAuth();
  const { slug } = useParams();

  if (!authReady) return <CenteredSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!restaurant?.id || !restaurant?.slug) return <NotLinked />;

  const mySlug = restaurant.slug as string;
  if (slug && slug !== mySlug) {
    return <Navigate to={`/r/${mySlug}/onboarding`} replace />;
  }
  const next = appState?.next_route;
  if (next && !wantsOnboarding(next)) {
    return <Navigate to={next} replace />;
  }
  return <>{children}</>;
};

// Redirect a legacy flat path to its canonical /r/:slug/* equivalent. The slug
// comes only from app-state (restaurant.slug) — never reconstructed locally.
const CanonicalRedirect: React.FC<{ to: string }> = ({ to }) => {
  const { session, restaurant, authReady } = useAuth();

  if (!authReady) return <CenteredSpinner />;
  if (!session) return <Navigate to="/login" replace />;

  const slug = restaurant?.slug as string | undefined;
  if (!slug) return <NotLinked />;
  return <Navigate to={`/r/${slug}${to}`} replace />;
};

// Root + unknown paths. The destination is whatever the backend decided
// (app-state.next_route): onboarding or dashboard. An authenticated user with no
// usable route gets a contained error — never a silent bounce to /login.
const RootRedirect: React.FC = () => {
  const { session, appState, authReady } = useAuth();

  if (!authReady) return <CenteredSpinner />;
  if (!session) return <Navigate to="/login" replace />;

  const next = appState?.next_route;
  if (next) return <Navigate to={next} replace />;
  return <NotLinked />;
};

// App routes for authenticated users
const AppRoutes = () => {
  if (isDomainMarketingSite()) {
    return <PublicRoutes />;
  }

  return (
    <Routes>
      {/* Public auth routes — all Supabase-backed */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/debug" element={<Debug />} />

      {/* Guided onboarding — slug-scoped, standalone (no app chrome). Gated by next_route. */}
      <Route path="/r/:slug/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Canonical private routes — slug-scoped, auth + linked restaurant only */}
      <Route path="/r/:slug/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/r/:slug/reservations" element={<PrivateRoute><Layout><Bookings /></Layout></PrivateRoute>} />
      <Route path="/r/:slug/calls" element={<PrivateRoute><Layout><CallLogs /></Layout></PrivateRoute>} />
      <Route path="/r/:slug/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
      <Route path="/r/:slug/billing" element={<PrivateRoute><Layout><Billing /></Layout></PrivateRoute>} />

      {/* Legacy flat paths → canonical (spec §11). No business logic of their own. */}
      <Route path="/dashboard" element={<CanonicalRedirect to="/dashboard" />} />
      <Route path="/bookings" element={<CanonicalRedirect to="/reservations" />} />
      <Route path="/reservations" element={<CanonicalRedirect to="/reservations" />} />
      <Route path="/calls" element={<CanonicalRedirect to="/calls" />} />
      <Route path="/settings" element={<CanonicalRedirect to="/settings" />} />
      <Route path="/billing" element={<CanonicalRedirect to="/billing" />} />

      {/* Legacy slug subpath kept until /reservations fully replaces /bookings */}
      <Route path="/r/:slug/bookings" element={<CanonicalRedirect to="/reservations" />} />

      {/* Legacy entry points → canonical app or login */}
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/setup" element={<CanonicalRedirect to="/onboarding" />} />
      <Route path="/setup/*" element={<CanonicalRedirect to="/onboarding" />} />
      <Route path="/onboarding" element={<CanonicalRedirect to="/onboarding" />} />
      <Route path="/start" element={<CanonicalRedirect to="/dashboard" />} />

      {/* Root + unknown paths */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LangProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LangProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
