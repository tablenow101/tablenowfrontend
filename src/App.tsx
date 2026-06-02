import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { LangProvider } from './context/LangProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import SetupSuccess from './pages/SetupSuccess';
import SetupRestaurant from './pages/setup/SetupRestaurant';
import SetupHours from './pages/setup/SetupHours';
import SetupCalendar from './pages/setup/SetupCalendar';
import SetupAssistant from './pages/setup/SetupAssistant';
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

function CenteredSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loading w-12 h-12"></div>
    </div>
  );
}

// Entry-point resolver ONLY. Allowed for "/", /setup, and legacy URLs — it sends
// the user to the backend-resolved appState.next_route (a real onboarding page or
// /dashboard). It must NEVER stand in for a real business/onboarding page.
const NextRouteRedirect: React.FC = () => {
  const { session, appState, authReady } = useAuth();

  if (!authReady) {
    return <CenteredSpinner />;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
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

      {/* ── Real onboarding pages — each is a genuine, actionable screen.
          Gated by auth + restaurant linkage only (ProtectedRoute), NOT by the
          onboarding guard, so they are terminal and never redirect away. The
          backend's next_route drives forward navigation between them. ── */}
      <Route path="/setup/restaurant" element={<ProtectedRoute><SetupRestaurant /></ProtectedRoute>} />
      <Route path="/setup/hours" element={<ProtectedRoute><SetupHours /></ProtectedRoute>} />
      <Route path="/setup/calendar" element={<ProtectedRoute><SetupCalendar /></ProtectedRoute>} />
      <Route path="/setup/assistant" element={<ProtectedRoute><SetupAssistant /></ProtectedRoute>} />
      <Route path="/setup/success" element={<ProtectedRoute><SetupSuccess /></ProtectedRoute>} />

      {/* Legacy / generic entry points → resolve to the real next step. These do
          NOT replace onboarding steps; they only forward to one. */}
      <Route path="/setup" element={<NextRouteRedirect />} />
      <Route path="/setup/vapi" element={<NextRouteRedirect />} />
      <Route path="/onboarding" element={<NextRouteRedirect />} />
      <Route path="/start" element={<NextRouteRedirect />} />
      <Route path="/signup" element={<NextRouteRedirect />} />

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

      {/* /calls: dashboard gating + assistant must be active */}
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

      {/* Terminal pages — auth + restaurant linked only (reachable during setup) */}
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

      {/* Legacy /r/:slug/... → resolve to the real next step */}
      <Route path="/r/:restaurantSlug" element={<NextRouteRedirect />} />
      <Route path="/r/:restaurantSlug/dashboard" element={<NextRouteRedirect />} />
      <Route path="/r/:restaurantSlug/bookings" element={<NextRouteRedirect />} />
      <Route path="/r/:restaurantSlug/calls" element={<NextRouteRedirect />} />
      <Route path="/r/:restaurantSlug/settings" element={<NextRouteRedirect />} />

      {/* Root + unknown paths → entry-point resolver */}
      <Route path="/" element={<NextRouteRedirect />} />
      <Route path="*" element={<NextRouteRedirect />} />
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
