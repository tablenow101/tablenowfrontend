import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { setAccessToken } from '../lib/authToken';
import { settingsAPI } from '../lib/api';

type AuthState = {
  user: any | null;
  session: any | null;
  restaurant: any | null;
  authReady: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: any }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Fetch restaurant data from /api/auth/me
  const fetchRestaurant = async (hasSession: boolean) => {
    if (!hasSession) {
      setRestaurant(null);
      return;
    }

    try {
      const res = await settingsAPI.get();
      const restaurantData = res.data.settings || res.data;
      setRestaurant(restaurantData);
    } catch (err) {
      console.error('Failed to fetch restaurant:', err);
      setRestaurant(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const hasSession = !!data.session;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);

      // Fetch restaurant data if session exists
      await fetchRestaurant(hasSession);

      setAuthReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const hasSession = !!newSession;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setAccessToken(newSession?.access_token ?? null);

      // Fetch restaurant data if session exists
      await fetchRestaurant(hasSession);

      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);

      // Refresh restaurant data
      await fetchRestaurant(hasSession);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const value = useMemo(
    () => ({ user, session, restaurant, authReady, refreshUser, login }),
    [user, session, restaurant, authReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
