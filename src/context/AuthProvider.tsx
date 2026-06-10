import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
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

  // Unified app state from /auth/app-state — single source of truth for routing
  // and authentication context. Returns the freshly-fetched state so callers
  // (e.g. AuthCallback) can navigate to next_route without reading stale context.
  const fetchAppState = useCallback(async (hasSession: boolean): Promise<AppState | null> => {
    if (!hasSession) {
      setAppState(null);
      setRestaurant(null);
      return null;
    }

    try {
      const res = await api.get('/auth/app-state');
      const state = res.data as AppState;
      setAppState(state);
      setRestaurant(state.restaurant || null);
      return state;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number; data?: { code?: string } } };
      const code = axiosErr?.response?.data?.code;
      if (axiosErr?.response?.status === 403 && code === 'NO_RESTAURANT') {
        // Expected during the bootstrap window: the user signed in but bootstrap
        // hasn't created the restaurant yet. Don't blank the state — runPostAuth
        // will call bootstrap then refreshUser, which will succeed.
        return null;
      }
      console.error('Failed to fetch app state:', error);
      setAppState(null);
      setRestaurant(null);
      return null;
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

  const refreshUser = useCallback(async (): Promise<AppState | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);

      return await fetchAppState(hasSession);
    } catch {
      console.error('Failed to refresh user');
      return null;
    }
  }, [fetchAppState]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRestaurant(null);
    setAppState(null);
  }, []);

  const value = useMemo(
    () => ({ user, session, restaurant, appState, authReady, refreshUser, logout } as AuthState),
    [user, session, restaurant, appState, authReady, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
