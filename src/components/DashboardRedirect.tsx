import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { settingsAPI } from '../lib/api';
import { AlertCircle } from 'lucide-react';

const DashboardRedirect: React.FC = () => {
  const { user, authReady } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // Fetch latest restaurant data from /api/auth/me (source of truth)
    (async () => {
      try {
        const res = await settingsAPI.get();
        const restaurant = res.data.settings || res.data;

        if (!restaurant?.slug) {
          setError('Restaurant not linked or incomplete');
          return;
        }

        navigate(`/r/${restaurant.slug}/dashboard`, { replace: true });
      } catch (err: any) {
        console.error('Failed to fetch restaurant:', err);
        setError('Failed to load restaurant. Please try again.');
      }
    })();
  }, [authReady, user, navigate]);

  // Not ready yet
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) return null;

  // Loading restaurant data
  if (!error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-[#080912] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center space-y-3">
          <AlertCircle className="text-red-400" size={36} />
          <p className="text-red-400 font-medium text-sm">{error}</p>
          <p className="text-xs text-[#555]">Please contact support or try logging in again.</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 px-4 py-2 bg-[#b8f000] text-black font-semibold rounded-xl hover:opacity-90"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardRedirect;

