import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import CallLogs from './pages/CallLogs';
import Settings from './pages/Settings';
import Layout from './components/Layout';
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

/** Redirects authenticated user to their restaurant's dashboard */
const RedirectToDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Redirect legacy routes */}
      <Route path="/" element={<RedirectToDashboard />} />
      <Route path="/dashboard" element={<RedirectToDashboard />} />
      <Route path="/bookings" element={<RedirectToDashboard />} />
      <Route path="/calls" element={<RedirectToDashboard />} />
      <Route path="/settings" element={<RedirectToDashboard />} />

      {/* Restaurant-scoped routes */}
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
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
