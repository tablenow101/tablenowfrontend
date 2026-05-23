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
import NotLinked from './pages/NotLinked';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute } from './components/RouteGuards';

function isDomainMarketingSite() {
  return window.location.hostname === 'tablenow.io' || window.location.hostname === 'www.tablenow.io';
}

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

      {/* Legacy alias routes - redirect to canonical routes */}
      <Route path="/setup" element={<LegacyRedirect />} />
      <Route path="/setup/restaurant" element={<LegacyRedirect />} />
      <Route path="/start" element={<LegacyRedirect />} />
      <Route path="/signup" element={<LegacyRedirect />} />
      <Route path="/onboarding" element={<LegacyRedirect />} />

      {/* Optional setup success page */}
      <Route
        path="/setup/success"
        element={
          <ProtectedRoute>
            <SetupSuccess />
          </ProtectedRoute>
        }
      />

      {/* Canonical private routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Layout>
              <Bookings />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calls"
        element={
          <ProtectedRoute>
            <Layout>
              <CallLogs />
            </Layout>
          </ProtectedRoute>
        }
      />

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

      {/* Legacy /r/:slug/... routes - redirect to canonical */}
      <Route path="/r/:restaurantSlug" element={<LegacySlugRedirect />} />
      <Route path="/r/:restaurantSlug/dashboard" element={<LegacySlugRedirect />} />
      <Route path="/r/:restaurantSlug/bookings" element={<LegacySlugRedirect />} />
      <Route path="/r/:restaurantSlug/calls" element={<LegacySlugRedirect />} />
      <Route path="/r/:restaurantSlug/settings" element={<LegacySlugRedirect />} />

      {/* Catch-all: redirect to canonical dashboard */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

// Redirect legacy /setup, /start, /signup to canonical route
const LegacyRedirect: React.FC = () => {
  const { session } = useAuth();
  return <Navigate to={session ? '/dashboard' : '/login'} replace />;
};

// Redirect legacy /r/:slug/ routes to canonical
const LegacySlugRedirect: React.FC = () => {
  const { session } = useAuth();
  return <Navigate to={session ? '/dashboard' : '/login'} replace />;
};

// Root redirect - immediate, no wait
const RootRedirect: React.FC = () => {
  const { session } = useAuth();
  return <Navigate to={session ? '/dashboard' : '/login'} replace />;
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
