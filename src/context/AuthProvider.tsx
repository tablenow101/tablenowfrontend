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

  // Fetch the unified app state from /auth/app-state. Only called AFTER bootstrap
  // has completed (via refreshUser → fetchAppState), never independently from
  // onAuthStateChange. This prevents the 403 NO_RESTAURANT race where the session
  // exists but bootstrap hasn't created the restaurant yet.
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
      console.error('Failed to fetch app state:', error);
      setAppState(null);
      setRestaurant(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // On mount: check for an existing Supabase session. If one exists, the user
    // is reconnecting (bootstrap already ran) so we can safely fetch app-state.
    // For brand-new sign-ins, onAuthStateChange fires but we do NOT call
    // fetchAppState — runPostAuth (called from Login/Register/AuthCallback)
    // handles the bootstrap → app-state sequence.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      const hasSession = !!data.session;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);

      if (hasSession) {
        await fetchAppState(true);
      }
    }).catch((err) => {
      console.error('Failed to get session:', err);
    }).finally(() => {
      if (mounted) {
        setAuthReady(true);
      }
    });

    // Auth state changes (sign-in, sign-out, token refresh): update session/user
    // only. Do NOT call fetchAppState here — for new sign-ins, bootstrap hasn't
    // run yet (403 NO_RESTAURANT). For sign-outs, clear state. For token refresh
    // on an existing session, the caller (runPostAuth → refreshUser) will fetch
    // app-state after bootstrap completes.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (!newSession) {
        setAppState(null);
        setRestaurant(null);
      }

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
