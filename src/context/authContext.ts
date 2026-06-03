import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type Restaurant = {
  id?: string;
  name?: string;
  slug?: string;
  status?: string;
  is_complete?: boolean;
  phone?: string;
  email?: string;
  [key: string]: unknown;
};

export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'expired' | 'canceled';
export type OnboardingStatus = 'not_started' | 'in_progress' | 'complete';
export type AssistantStatus = 'inactive' | 'provisioning' | 'active' | 'error';
export type ProvisioningStatus = 'not_started' | 'in_progress' | 'complete' | 'error';
export type CalendarStatus = 'not_connected' | 'pending' | 'connected' | 'error';

// Mirror of the backend GET /auth/app-state contract (src/routes/auth.ts
// getUserContextWithNextRoute). Single source of truth for route guards.
export interface AppState {
  version?: number;
  user: { id: string; email: string } | null;
  restaurant: Restaurant | null;
  subscription: { status: SubscriptionStatus };
  calendar: { status: CalendarStatus; skipped?: boolean };
  provisioning: { status: ProvisioningStatus; phone_number?: string | null };
  onboarding: { status: OnboardingStatus };
  assistant: { status: AssistantStatus };
  next_route: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  restaurant: Restaurant | null;
  appState: AppState | null;
  authReady: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);
