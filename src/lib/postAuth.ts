import { supabase } from './supabase';
import { authAPI } from './api';
import type { AppState } from '../context/authContext';

// Single-flight guard: if runPostAuth is already in progress, subsequent calls
// reuse the same promise instead of firing duplicate bootstrap requests.
let inflight: Promise<string> | null = null;

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
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('No Supabase session');

      await authAPI.bootstrap(token);

      const state = await refreshUser();
      return state?.next_route || '/';
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
