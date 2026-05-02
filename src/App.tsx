import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { LangProvider } from './context/LangContext';
import LanguageToggle from './components/LanguageToggle';
import ChatWidget from './components/ChatWidget';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import CallLogs from './pages/CallLogs';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import { isDomainMarketingSite } from './lib/domain';
import './index.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const RedirectToDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const [checkingStripe, setCheckingStripe] = useState(false);

  useEffect(() => {
    if (!user) return;
    const pendingPlan = localStorage.getItem('pending_plan');
    if (!pendingPlan) return;
    localStorage.removeItem('pending_plan');
    setCheckingStripe(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { setCheckingStripe(false); return; }
    fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: pendingPlan }),
    })
      .then(r => r.json())
      .then(data => { if (data.url) { window.location.href = data.url; } else { setCheckingStripe(false); } })
      .catch(() => setCheckingStripe(false));
  }, [user]);

  if (loading || checkingStripe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const slug = user.slug || user.id;
  return <Navigate to={`/r/${slug}/dashboard`} replace />;
};

const DashboardWithSubscribeCheck: React.FC = () => {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscribed') === 'true') {
      localStorage.removeItem('pending_plan');
      setShowToast(true);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setShowToast(false), 4000);
    }
  }, []);

  return (
    <>
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#b8f000] text-black text-sm font-bold px-5 py-3 rounded-xl shadow-xl animate-fade-in">
          Abonnement activé ✓
        </div>
      )}
      <Dashboard />
    </>
  );
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pricing" element={<Pricing />} />

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
        <Route path="dashboard" element={<DashboardWithSubscribeCheck />} />
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
          <SidebarProvider>
            <AppRoutes />
          </SidebarProvider>
        </AuthProvider>
        <LanguageToggle />
        <ChatWidget />
      </LangProvider>
    </BrowserRouter>
  );
}

export default App;
