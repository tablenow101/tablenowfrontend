import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle } from 'lucide-react';

const DashboardRedirect: React.FC = () => {
  const { user, authReady } = useAuth();
  const navigate = useNavigate();

  // Not ready yet
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  // User is authenticated with slug
  if (user.slug) {
    navigate(`/r/${user.slug}/dashboard`, { replace: true });
    return null;
  }

  // User is authenticated but no slug (restaurant not linked)
  return (
    <div className="min-h-screen bg-[#080912] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center space-y-3">
          <AlertCircle className="text-red-400" size={36} />
          <p className="text-red-400 font-medium text-sm">Restaurant not linked to account</p>
          <p className="text-xs text-[#555]">Please contact support to link your restaurant.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardRedirect;
