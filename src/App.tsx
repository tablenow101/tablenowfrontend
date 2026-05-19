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
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import CallLogs from './pages/CallLogs';
import Settings from './pages/Settings';
import NotLinked from './pages/NotLinked';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

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

// Canonical private routes + guards
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { restaurant, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  // Restaurant linked: show content
  if (restaurant?.id) {
    return <>{children}</>;
  }

  // No restaurant linked: show 403 page
  return <NotLinked />;
};

// Guard for authenticated users
const AuthenticatedGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  return session ? <>{children}</> : <Navigate to="/login" replace />;
};

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
          <AuthenticatedGuard>
            <SetupSuccess />
          </AuthenticatedGuard>
        }
      />

      {/* Canonical private routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <PrivateRoute>
            <Layout>
              <Bookings />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/calls"
        element={
          <PrivateRoute>
            <Layout>
              <CallLogs />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
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
