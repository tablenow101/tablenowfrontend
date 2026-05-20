import { useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { settingsAPI } from '../lib/api';
import { AuthContext, type AuthState } from './authContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Fetch restaurant data from /api/auth/me
  const fetchRestaurant = useCallback(async (hasSession: boolean): Promise<void> => {
    if (!hasSession) {
      setRestaurant(null);
      return;
    }

    try {
      const res = await settingsAPI.get();
      const restaurantData = res.data.settings || res.data;
      setRestaurant(restaurantData);
    } catch {
      console.error('Failed to fetch restaurant');
      setRestaurant(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Start getSession in background, don't block render
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      const hasSession = !!data.session;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      // Note: backend_token is managed by AuthCallback only, not here

      // Fetch restaurant data if session exists
      await fetchRestaurant(hasSession);
    }).catch((err) => {
      console.error('Failed to get session:', err);
    }).finally(() => {
      if (mounted) {
        setAuthReady(true);
      }
    });

    // Listen for auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const hasSession = !!newSession;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Note: backend_token is managed by AuthCallback only, not here
      await fetchRestaurant(hasSession);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [fetchRestaurant]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      // Note: backend_token is managed by AuthCallback only, not here

      // Refresh restaurant data
      await fetchRestaurant(hasSession);
    } catch {
      console.error('Failed to refresh user');
    }
  }, [fetchRestaurant]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({ user, session, restaurant, authReady, refreshUser, login } as AuthState),
    [user, session, restaurant, authReady, refreshUser, login]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
