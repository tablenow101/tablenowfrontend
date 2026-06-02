import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { LangProvider } from './context/LangProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import SetupSuccess from './pages/SetupSuccess';
import AuthCallback from './pages/AuthCallback';
import Debug from './pages/Debug';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import CallLogs from './pages/CallLogs';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import {
  ProtectedRoute,
  OnboardingGuard,
  SubscriptionGuard,
  RestaurantCompleteGuard,
  AssistantGuard,
} from './components/RouteGuards';

function isDomainMarketingSite() {
  return window.location.hostname === 'tablenow.io' || window.location.hostname === 'www.tablenow.io';
}

// ──────────────────────────────────────────────────────────────────────────────
// Routing model (loop-free by construction)
//
//   • There is exactly ONE redirect resolver — <SmartLanding/>. Every ambiguous
//     entry point (root, legacy aliases, unknown paths) funnels through it.
//   • SmartLanding sends an authenticated user to appState.next_route, which the
//     backend guarantees to be a REAL, TERMINAL route (/dashboard, /settings,
//     /billing). It never invents /setup/* paths.
//   • Business guards (Onboarding / Subscription / RestaurantComplete / Assistant)
//     only ever redirect to TERMINAL pages (/settings, /billing) that are NOT
//     wrapped by those same guards — so a redirect can never bounce back.
//
// Because every redirect target is terminal, no sequence of guards can form a
// cycle. That is the whole reason this routing is stable.
// ──────────────────────────────────────────────────────────────────────────────

function CenteredSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loading w-12 h-12"></div>
    </div>
  );
}

// Single source of truth for "where should this visitor go?".
// Used for "/", the catch-all, and every legacy alias.
const SmartLanding: React.FC = () => {
  const { session, appState, authReady } = useAuth();

  if (!authReady) {
    return <CenteredSpinner />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // next_route is resolved server-side and is always a real terminal route.
  // Fallback to /dashboard, whose guard stack will route precisely if needed.
  return <Navigate to={appState?.next_route ?? '/dashboard'} replace />;
};

// Public routes - always accessible
const PublicRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// App routes for authenticated users
const AppRoutes = () => {
  const isMarketing = isDomainMarketingSite();

  if (isMarketing) {
    return <PublicRoutes />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/debug" element={<Debug />} />

      {/* Setup success confirmation (auth + restaurant linked only) */}
      <Route
        path="/setup/success"
        element={
          <ProtectedRoute>
            <SetupSuccess />
          </ProtectedRoute>
        }
      />

      {/* /dashboard: auth + restaurant linked + onboarded + subscribed + profile complete */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <SubscriptionGuard>
                <RestaurantCompleteGuard>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </RestaurantCompleteGuard>
              </SubscriptionGuard>
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />

      {/* /bookings: same gating as dashboard */}
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <SubscriptionGuard>
                <RestaurantCompleteGuard>
                  <Layout>
                    <Bookings />
                  </Layout>
                </RestaurantCompleteGuard>
              </SubscriptionGuard>
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />

      {/* /calls: dashboard gating + voice assistant must be active */}
      <Route
        path="/calls"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <SubscriptionGuard>
                <RestaurantCompleteGuard>
                  <AssistantGuard>
                    <Layout>
                      <CallLogs />
                    </Layout>
                  </AssistantGuard>
                </RestaurantCompleteGuard>
              </SubscriptionGuard>
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />

      {/* TERMINAL pages — auth + restaurant linked only. These must stay reachable
          during setup, otherwise a partially-onboarded user would be locked out.
          They are the redirect targets of the business guards above. */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <Layout>
              <Billing />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Everything else — root, legacy aliases (/setup, /onboarding, /start,
          /signup, /r/:slug/...), and unknown paths — funnels through the single
          smart resolver. No dedicated redirect components, no ghost routes. */}
      <Route path="*" element={<SmartLanding />} />
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
