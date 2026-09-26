import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  SIGNED_IN_HINT_COOKIE,
  isEntryPath,
  onboardedFromRow,
  signedInRedirect,
} from '@/lib/core/entryRoute';
import { SIGNED_IN_HINT_OPTIONS, createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/entry?path=/login — see docs/api-contract.md
 *
 * T-525 · D-304 — `/` · `/login` · `/signup` left `proxy.ts`'s `matcher`, so the
 * CDN serves them without waking the proxy (measured 26/09: `/login` 4.26s cold,
 * all of it the proxy, with the page already in the Durable cache). The redirect a
 * signed-in learner used to get there now comes from here, and it is the SAME
 * decision: `signedInRedirect`, fed by the same `onboarded_at` read the proxy did.
 * ⛔ No second copy of the rule is written anywhere.
 *
 * Answers `{ ok: true, target }` — `target` is a path or `null` (stay). It also
 * keeps `SIGNED_IN_HINT_COOKIE` honest: set while a session exists, cleared once it
 * does not, so a stale hint costs a learner one wait and never a second one.
 */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') ?? '';
  const env = readSupabaseEnv();
  if (!env || !isEntryPath(path)) return NextResponse.json({ ok: true, target: null });

  const store = await cookies();
  const supabase = createRouteClient(env, store);
  // `getClaims()` for the same reason `proxy.ts` uses it (T-377ⓑ): the signature is
  // checked against a cached JWKS, ⛔ not a round-trip to Supabase Auth.
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsError ? undefined : claimsData?.claims?.sub;

  if (!userId) {
    const response = NextResponse.json({ ok: true, target: null });
    if (store.get(SIGNED_IN_HINT_COOKIE)) response.cookies.delete(SIGNED_IN_HINT_COOKIE);
    return response;
  }

  const { data } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', userId)
    .maybeSingle();

  const response = NextResponse.json({
    ok: true,
    target: signedInRedirect(path, onboardedFromRow(data)),
  });
  response.cookies.set(SIGNED_IN_HINT_COOKIE, '1', SIGNED_IN_HINT_OPTIONS);
  return response;
}

