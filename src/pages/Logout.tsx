import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Dedicated /logout route: clears the Supabase session, then returns to /login.
const Logout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      await logout();
      navigate('/login', { replace: true });
    })();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  );
};

export default Logout;
