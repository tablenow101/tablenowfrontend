import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPostAuth } from '../postAuth';
import { supabase } from '../supabase';
import { authAPI } from '../api';
import type { AppState } from '../../context/authContext';

// Mock the two side-effectful modules so the shared post-auth routine can be
// tested in isolation (no real Supabase client, no HTTP).
vi.mock('../supabase', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));
vi.mock('../api', () => ({
  authAPI: { bootstrap: vi.fn() },
}));

const getSession = supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>;
const bootstrap = authAPI.bootstrap as unknown as ReturnType<typeof vi.fn>;

const appState = (next: string | null): AppState => ({
  user: { id: 'u1', email: 'a@b.com' },
  restaurant: null,
  subscription: { status: 'none' },
  calendar: { status: 'not_connected' },
  provisioning: { status: 'not_started' },
  onboarding: { status: 'not_started' },
  assistant: { status: 'inactive' },
  next_route: next,
});

describe('runPostAuth (single shared post-authentication routine)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bootstraps with the Supabase token and returns the backend next_route', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } });
    bootstrap.mockResolvedValue({});
    const refreshUser = vi.fn().mockResolvedValue(appState('/r/chez-moi/dashboard'));

    const next = await runPostAuth(refreshUser);

    expect(bootstrap).toHaveBeenCalledWith('tok-123');
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(next).toBe('/r/chez-moi/dashboard');
  });

  it('throws when there is no Supabase session (never silently routes)', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const refreshUser = vi.fn();

    await expect(runPostAuth(refreshUser)).rejects.toThrow('No Supabase session');
    expect(bootstrap).not.toHaveBeenCalled();
    expect(refreshUser).not.toHaveBeenCalled();
  });

  it('falls back to /login when app-state yields no next_route', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    bootstrap.mockResolvedValue({});
    const refreshUser = vi.fn().mockResolvedValue(appState(null));

    expect(await runPostAuth(refreshUser)).toBe('/login');
  });

  it('falls back to /login when refreshUser returns null', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    bootstrap.mockResolvedValue({});
    const refreshUser = vi.fn().mockResolvedValue(null);

    expect(await runPostAuth(refreshUser)).toBe('/login');
  });
});
