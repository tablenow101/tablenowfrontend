import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { LangProvider } from './context/LangProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
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
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// Requires the Supabase user to resolve to a linked restaurant. No onboarding
// gating — login goes straight to the dashboard; restaurant details are edited
// in /settings.
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { restaurant, authReady } = useAuth();
  if (!authReady) return <CenteredSpinner />;
  if (restaurant?.id) return <>{children}</>;
  return <NotLinked />;
};

// Legacy / onboarding entry points → canonical app. The onboarding flow was
// removed; any old /setup, /onboarding, /start, /signup, /r/:slug link lands
// on the dashboard (or login when signed out).
const LegacyRedirect: React.FC = () => {
  const { session } = useAuth();
  return <Navigate to={session ? '/dashboard' : '/login'} replace />;
};

// App routes for authenticated users
const AppRoutes = () => {
  if (isDomainMarketingSite()) {
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

      {/* Legacy onboarding routes → canonical app (onboarding removed) */}
      <Route path="/setup" element={<LegacyRedirect />} />
      <Route path="/setup/*" element={<LegacyRedirect />} />
      <Route path="/onboarding" element={<LegacyRedirect />} />
      <Route path="/start" element={<LegacyRedirect />} />
      <Route path="/signup" element={<LegacyRedirect />} />

      {/* Canonical private routes — auth + linked restaurant only */}
      <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/bookings" element={<PrivateRoute><Layout><Bookings /></Layout></PrivateRoute>} />
      <Route path="/calls" element={<PrivateRoute><Layout><CallLogs /></Layout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
      <Route path="/billing" element={<PrivateRoute><Layout><Billing /></Layout></PrivateRoute>} />

      {/* Legacy /r/:slug/... → canonical */}
      <Route path="/r/:restaurantSlug/*" element={<LegacyRedirect />} />
      <Route path="/r/:restaurantSlug" element={<LegacyRedirect />} />

      {/* Root + unknown paths → dashboard (or login) */}
      <Route path="/" element={<LegacyRedirect />} />
      <Route path="*" element={<LegacyRedirect />} />
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
