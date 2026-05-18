import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { LangProvider } from './context/LangProvider';
import { getPostAuthRedirect } from './lib/postAuthRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import SetupRestaurant from './pages/SetupRestaurant';
import SetupSuccess from './pages/SetupSuccess';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import CallLogs from './pages/CallLogs';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Layout from './components/Layout';

function isDomainMarketingSite() {
  return window.location.hostname === 'tablenow.io' || window.location.hostname === 'www.tablenow.io';
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authReady } = useAuth();
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const RedirectToDashboard: React.FC = () => {
  const { user, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return <Navigate to={getPostAuthRedirect(user)} replace />;
};

const AppRoutes = () => {
  const isMarketing = isDomainMarketingSite();

  if (isMarketing) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/setup/restaurant" element={
        <PrivateRoute>
          <SetupRestaurant />
        </PrivateRoute>
      } />

      <Route path="/setup/success" element={
        <PrivateRoute>
          <SetupSuccess />
        </PrivateRoute>
      } />

      <Route path="/start" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/onboarding" element={<Navigate to="/login" replace />} />

      <Route path="/" element={<RedirectToDashboard />} />
      <Route path="/dashboard" element={<RedirectToDashboard />} />
      <Route path="/bookings" element={<RedirectToDashboard />} />
      <Route path="/calls" element={<RedirectToDashboard />} />
      <Route path="/settings" element={<RedirectToDashboard />} />

      <Route path="/r/:restaurantSlug" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="calls" element={<CallLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}

export default App;
