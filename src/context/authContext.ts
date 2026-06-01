import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type Restaurant = {
  slug?: string;
  [key: string]: unknown;
};

export interface AuthState {
  user: User | null;
  session: Session | null;
  restaurant: Restaurant | null;
  authReady: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);
