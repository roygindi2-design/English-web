import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * T-377ⓑ — the proxy verifies the session locally, ⛔ not with a round-trip.
 *
 * Measured on production 26/09 13:11Z (curl, n=7, interleaved on a warm
 * function): a signed-in `/cards` answered in 0.33–0.48s against 0.12–0.18s
 * for the anonymous one, and the first signed-in request after the anonymous
 * ones had warmed the proxy took 5.04s. `getUser()` is an HTTP call to
 * Supabase Auth on every navigation of every signed-in learner; the project
 * signs its tokens with ES256 (JWKS published), so `getClaims()` verifies the
 * signature locally against a cached key and only falls back to the network
 * for a symmetric token.
 */

const getClaims = vi.fn();
const getUser = vi.fn();
const eq = vi.fn();

vi.mock('@/lib/supabase/auth', () => ({
  readSupabaseEnv: () => ({ url: 'https://x.supabase.co', anonKey: 'k' }),
  createProxyClient: () => ({
    auth: { getClaims, getUser },
    from: () => ({ select: () => ({ eq: (...args: unknown[]) => { eq(...args); return { maybeSingle: async () => ({ data: { onboarded_at: '2026-09-01T00:00:00Z' } }) }; } }) }),
  }),
}));

const { default: proxy } = await import('./proxy');

function get(pathname: string) {
  return new NextRequest(new Request(`https://example.com${pathname}`));
}

describe('T-377ⓑ: the proxy reads the session with getClaims, ⛔ not getUser', () => {
  beforeEach(() => {
    getClaims.mockReset();
    getUser.mockReset();
    eq.mockReset();
  });

  it('lets a signed-in learner through to a protected screen without calling getUser', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u-1' } }, error: null });
    const response = await proxy(get('/cards'));
    expect(response.headers.get('location')).toBeNull();
    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('sends a request with no verified claims to /login', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    const response = await proxy(get('/cards'));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location') as string);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('expired')).toBe('1');
  });

  it('fails closed when verification errors — a bad signature is not a learner', async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error('invalid JWT signature') });
    const response = await proxy(get('/me'));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location') as string).pathname).toBe('/login');
  });

  it('reads the onboarding row by the verified subject (claims.sub)', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u-42' } }, error: null });
    await proxy(get('/'));
    expect(eq).toHaveBeenCalledWith('id', 'u-42');
  });
});
