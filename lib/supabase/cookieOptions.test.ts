import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

/**
 * F-002 — regression test for the session cookie hardening.
 *
 * The bug was an omission, not a wrong value: neither `createServerClient` call
 * passed `cookieOptions`, so `@supabase/ssr`'s defaults applied
 * (`httpOnly: false`, no `secure`, `maxAge: 400 days`). A test that only
 * inspected the exported constant would still have passed while the calls
 * ignored it, so this captures the third argument each call actually sends.
 */

const createServerClient = vi.fn(() => ({}) as unknown);
vi.mock('@supabase/ssr', () => ({ createServerClient: (...args: unknown[]) => createServerClient(...(args as [])) }));

const ENV = { url: 'https://example.supabase.co', anonKey: 'anon' };

function optionsFromLastCall() {
  const call = createServerClient.mock.calls.at(-1) as unknown as [string, string, Record<string, unknown>];
  return call[2].cookieOptions as Record<string, unknown> | undefined;
}

describe('F-002: session cookies are not readable by scripts', () => {
  beforeEach(() => createServerClient.mockClear());

  it('createRouteClient passes httpOnly cookie options', async () => {
    const { createRouteClient } = await import('./auth');
    createRouteClient(ENV, { getAll: () => [], set: () => {} });

    const options = optionsFromLastCall();
    expect(options).toBeDefined();
    expect(options?.httpOnly).toBe(true);
    expect(options?.sameSite).toBe('lax');
    expect(options?.path).toBe('/');
  });

  it('createProxyClient passes httpOnly cookie options', async () => {
    const { createProxyClient } = await import('./auth');
    const request = { cookies: { getAll: () => [], set: () => {} } };
    const response = { cookies: { set: () => {} } };
    createProxyClient(
      ENV,
      request as never,
      response as never
    );

    const options = optionsFromLastCall();
    expect(options?.httpOnly).toBe(true);
  });
});

describe('F-002: Secure flag follows the environment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('is set in production, so the token never crosses plain http', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { SESSION_COOKIE_OPTIONS } = await import('./auth');
    expect(SESSION_COOKIE_OPTIONS.secure).toBe(true);
  });

  it('is off in development, otherwise nobody can sign in on http://localhost', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { SESSION_COOKIE_OPTIONS } = await import('./auth');
    expect(SESSION_COOKIE_OPTIONS.secure).toBe(false);
  });
});
