import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// runPostAuth uses a module-level inflight guard, so we need a fresh module
// for each test to avoid cross-test pollution.
async function freshRunPostAuth() {
  const mod = await import('../postAuth');
  return mod.runPostAuth;
}

describe('runPostAuth (single shared post-authentication routine)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls bootstrap BEFORE refreshUser (sequential: bootstrap → app-state)', async () => {
    const runPostAuth = await freshRunPostAuth();
    const order: string[] = [];
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } });
    bootstrap.mockImplementation(async () => { order.push('bootstrap'); return {}; });
    const refreshUser = vi.fn().mockImplementation(async () => { order.push('app-state'); return appState('/r/chez-moi/dashboard'); });

    await runPostAuth(refreshUser);

    expect(order).toEqual(['bootstrap', 'app-state']);
  });

  it('bootstraps with the Supabase token and returns the backend next_route', async () => {
    const runPostAuth = await freshRunPostAuth();
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } });
    bootstrap.mockResolvedValue({});
    const refreshUser = vi.fn().mockResolvedValue(appState('/r/chez-moi/dashboard'));

    const next = await runPostAuth(refreshUser);

    expect(bootstrap).toHaveBeenCalledWith('tok-123');
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(next).toBe('/r/chez-moi/dashboard');
  });

  it('throws when there is no Supabase session (never silently routes)', async () => {
    const runPostAuth = await freshRunPostAuth();
    getSession.mockResolvedValue({ data: { session: null } });
    const refreshUser = vi.fn();

    await expect(runPostAuth(refreshUser)).rejects.toThrow('No Supabase session');
    expect(bootstrap).not.toHaveBeenCalled();
    expect(refreshUser).not.toHaveBeenCalled();
  });

  it('routes an authenticated session with no next_route to "/" (contained error, never /login)', async () => {
    const runPostAuth = await freshRunPostAuth();
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    bootstrap.mockResolvedValue({});
    const refreshUser = vi.fn().mockResolvedValue(appState(null));

    expect(await runPostAuth(refreshUser)).toBe('/');
  });

  it('routes to "/" when refreshUser returns null (RootRedirect arbitrates, no login loop)', async () => {
    const runPostAuth = await freshRunPostAuth();
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    bootstrap.mockResolvedValue({});
    const refreshUser = vi.fn().mockResolvedValue(null);

    expect(await runPostAuth(refreshUser)).toBe('/');
  });

  it('concurrent calls reuse the same inflight promise (single-flight guard)', async () => {
    const runPostAuth = await freshRunPostAuth();
    let resolveBootstrap: () => void;
    const bootstrapPromise = new Promise<void>(r => { resolveBootstrap = r; });
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    bootstrap.mockImplementation(() => bootstrapPromise);
    const refreshUser = vi.fn().mockResolvedValue(appState('/r/test/dashboard'));

    const call1 = runPostAuth(refreshUser);
    const call2 = runPostAuth(refreshUser);

    resolveBootstrap!();
    const [r1, r2] = await Promise.all([call1, call2]);

    expect(r1).toBe('/r/test/dashboard');
    expect(r2).toBe('/r/test/dashboard');
    expect(bootstrap).toHaveBeenCalledTimes(1);
  });

  it('bootstrap error is visible (propagates, never silently absorbed)', async () => {
    const runPostAuth = await freshRunPostAuth();
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    bootstrap.mockRejectedValue(new Error('Bootstrap failed: 500'));
    const refreshUser = vi.fn();

    await expect(runPostAuth(refreshUser)).rejects.toThrow('Bootstrap failed: 500');
    expect(refreshUser).not.toHaveBeenCalled();
  });

  it('redirect matches backend next_route verbatim (no local reconstruction)', async () => {
    const runPostAuth = await freshRunPostAuth();
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    bootstrap.mockResolvedValue({});
    const refreshUser = vi.fn().mockResolvedValue(appState('/r/la-trattoria/onboarding'));

    const route = await runPostAuth(refreshUser);
    expect(route).toBe('/r/la-trattoria/onboarding');
  });
});
