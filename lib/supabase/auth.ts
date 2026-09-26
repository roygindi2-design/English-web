import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-side auth layer — T-002.
 *
 * The anon key is the only Supabase key that appears anywhere near a request
 * path a learner can reach. `SUPABASE_SERVICE_ROLE_KEY` is not imported here and
 * must never be (UX plan T-002). Row Level Security on `profiles` is what makes
 * the anon key safe; see supabase/migrations/0001_profiles.sql.
 *
 * No UI component imports this file — screens talk to /api/auth/* only (AR-1).
 */

export type SupabaseEnv = { url: string; anonKey: string };

/**
 * F-002 — the session cookie hardening, in one place.
 *
 * `@supabase/ssr` ships `DEFAULT_COOKIE_OPTIONS` with `httpOnly: false` and no
 * `secure`, so omitting this argument hands the access token *and* a 400-day
 * refresh token to any script that can read `document.cookie`. Every
 * `createServerClient` call in this file must pass it.
 *
 * `secure` is off outside production only because `http://localhost` would
 * otherwise drop the cookie and no one could sign in locally.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} as const satisfies CookieOptions;

/**
 * T-525 — `SIGNED_IN_HINT_COOKIE` (`lib/core/entryRoute.ts`). Readable by script on
 * purpose: it carries `1` and nothing else, and it only tells an entry screen to hold
 * its primary action back until `GET /api/auth/entry` answers. Every other option is
 * the session cookie's own.
 */
export const SIGNED_IN_HINT_OPTIONS = {
  ...SESSION_COOKIE_OPTIONS,
  httpOnly: false,
  maxAge: 60 * 60 * 24 * 400,
} as const satisfies CookieOptions;

/** Reads env at request time, never at module load: a missing key must produce a
 *  Hebrew "we could not connect" at runtime, not a failed production build. */
export function readSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

type CookieStore = {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

/**
 * Client bound to a Route Handler's cookie store. Session tokens live in
 * httpOnly cookies written by this client — never in localStorage, which is
 * readable by any injected script.
 */
export function createRouteClient(env: SupabaseEnv, cookieStore: CookieStore) {
  return createServerClient(env.url, env.anonKey, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options as Record<string, unknown>);
          } catch {
            // A Server Component render cannot set cookies. The proxy refreshes
            // the session instead, so swallowing here is correct and not a hole.
          }
        }
      },
    },
  });
}

/**
 * Client for proxy.ts: reads the incoming request's cookies and writes any
 * refreshed tokens onto the outgoing response.
 */
export function createProxyClient(
  env: SupabaseEnv,
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(env.url, env.anonKey, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}
