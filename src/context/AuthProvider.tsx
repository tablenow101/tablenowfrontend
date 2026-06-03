import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { settingsAPI, api } from '../lib/api';
import { AuthContext, type AuthState, type AppState, type Restaurant } from './authContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Unified app state from /auth/app-state — single source of truth for route
  // guards (subscription / onboarding / assistant / restaurant completeness).
  // Falls back to settingsAPI so the restaurant stays populated if app-state fails.
  const fetchAppState = useCallback(async (hasSession: boolean): Promise<void> => {
    if (!hasSession) {
      setAppState(null);
      setRestaurant(null);
      return;
    }

    try {
      const res = await api.get('/auth/app-state');
      const state = res.data as AppState;
      setAppState(state);
      setRestaurant(state.restaurant || null);
    } catch {
      console.error('Failed to fetch app state');
      // Fallback to settings API for backward compatibility
      try {
        const res = await settingsAPI.get();
        const restaurantData = res.data.settings || res.data;
        setRestaurant(restaurantData);
      } catch {
        console.error('Failed to fetch restaurant');
        setRestaurant(null);
      }
      setAppState(null);
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

      await fetchAppState(hasSession);
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
      await fetchAppState(hasSession);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [fetchAppState]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);

      await fetchAppState(hasSession);
    } catch {
      console.error('Failed to refresh user');
    }
  }, [fetchAppState]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRestaurant(null);
    setAppState(null);
  }, []);

  const value = useMemo(
    () => ({ user, session, restaurant, appState, authReady, refreshUser, login, logout } as AuthState),
    [user, session, restaurant, appState, authReady, refreshUser, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
