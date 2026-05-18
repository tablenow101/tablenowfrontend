import { useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setAccessToken } from '../lib/authToken';
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

    (async () => {
      try {
        console.log('[AuthProvider] Getting session...');
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        console.log('[AuthProvider] Session retrieved:', !!data.session);
        const hasSession = !!data.session;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setAccessToken(data.session?.access_token ?? null);

        // Fetch restaurant data if session exists
        await fetchRestaurant(hasSession);

        if (mounted) {
          setAuthReady(true);
          console.log('[AuthProvider] authReady = true');
        }
      } catch (err) {
        console.error('[AuthProvider] Init error:', err);
        if (mounted) {
          setAuthReady(true);
        }
      }
    })();

    // Safety timeout: if authReady doesn't become true in 5s, force it
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('[AuthProvider] Timeout: forcing authReady = true');
        setAuthReady(true);
      }
    }, 5000);

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
      clearTimeout(timeoutId);
      sub?.subscription?.unsubscribe();
    };
  }, [fetchRestaurant]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);

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
