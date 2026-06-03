import { supabase } from './supabase';
import { authAPI } from './api';
import type { AppState } from '../context/authContext';

// The single post-authentication routine, shared by every entry point (email/
// password login, sign-up, Google OAuth callback). There is NO provider-specific
// behaviour once a Supabase session exists:
//
//   valid Supabase session → POST /auth/bootstrap → GET /auth/app-state → next_route
//
// Returns the backend-provided next_route. The caller navigates to it verbatim and
// never reconstructs a destination locally.
export async function runPostAuth(
  refreshUser: () => Promise<AppState | null>,
): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('No Supabase session');

  // Ensure the restaurant exists / is linked for this session (idempotent).
  await authAPI.bootstrap(token);

  // Pull the unified app state; the backend decides where to go.
  const state = await refreshUser();
  return state?.next_route || '/login';
}
