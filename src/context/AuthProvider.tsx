import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { setAccessToken } from '../lib/authToken';

type AuthState = {
  user: any | null;
  session: any | null;
  authReady: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: any }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);
      setAuthReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setAccessToken(newSession?.access_token ?? null);
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
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);
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
    () => ({ user, session, authReady, refreshUser, login }),
    [user, session, authReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
