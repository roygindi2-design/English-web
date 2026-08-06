import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import proxy, { isProtectedPath } from './proxy';

/**
 * F-003 — the session guard must fail closed.
 *
 * The bug: `if (!env) return response;`. A missing or misspelled
 * NEXT_PUBLIC_SUPABASE_* variable (a Netlify typo, or a Deploy Preview that
 * does not inherit env vars) disabled the guard entirely and served every
 * protected screen to an anonymous request with HTTP 200.
 */

function get(pathname: string) {
  return new NextRequest(new Request(`https://example.com${pathname}`));
}

describe('F-003: proxy with no Supabase configuration', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('redirects a protected screen to /login instead of rendering it', async () => {
    const response = await proxy(get('/onboarding'));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location') as string);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('expired')).toBe('1');
  });

  it('redirects nested protected paths too, not just the exact match', async () => {
    const response = await proxy(get('/onboarding/step-2'));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location') as string).pathname).toBe('/login');
  });

  it('still lets public screens render, so the site is not dead', async () => {
    for (const path of ['/', '/login', '/signup']) {
      const response = await proxy(get(path));
      expect(response.headers.get('location')).toBeNull();
    }
  });
});

describe('protected path matching', () => {
  it('matches the screen and everything under it', () => {
    expect(isProtectedPath('/onboarding')).toBe(true);
    expect(isProtectedPath('/onboarding/goal')).toBe(true);
  });

  it('does not match a lookalike prefix', () => {
    expect(isProtectedPath('/onboarding-preview')).toBe(false);
    expect(isProtectedPath('/login')).toBe(false);
  });
});
