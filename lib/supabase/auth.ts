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
