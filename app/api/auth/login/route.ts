import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  type AuthErrorCode,
  checkCredentials,
  isCredentialPayload,
  mapAuthError,
  messageFor,
} from '@/lib/core/auth';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';
import { checkAuthRateLimit } from '@/lib/supabase/authRateLimit';

export const dynamic = 'force-dynamic';

/** POST /api/auth/login — see docs/api-contract.md */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail('unavailable', 400);
  }
  // F-004: `null`, an array or a bare primitive parses fine and would crash the
  // next line with a 500 instead of returning the documented contract.
  if (!isCredentialPayload(payload)) return fail('unavailable', 400);

  const check = checkCredentials(
    { email: String(payload.email ?? ''), password: String(payload.password ?? '') },
    'login'
  );
  if (!check.ok) {
    return NextResponse.json({ ok: false, fieldErrors: check.fieldErrors }, { status: 422 });
  }

  const env = readSupabaseEnv();
  if (!env) return fail('unavailable', 503);

  const supabase = createRouteClient(env, await cookies());

  // F-008ⓑ — the volume half. Runs AFTER the shape and credential guards (a junk
  // body must not cost a database call) and BEFORE the provider is asked anything:
  // a status oracle answered late is still an oracle.
  const rate = await checkAuthRateLimit(
    supabase,
    { headers: request.headers, email: check.email, mode: 'login' },
    Date.now()
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, code: 'rate_limited', message: messageFor('rate_limited') },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: check.email,
    password: check.password,
  });

  if (error) {
    // Every credential failure collapses to one message on purpose: telling the
    // caller "no such user" turns this endpoint into a user-enumeration oracle.
    const code = mapAuthError({ code: error.code, status: error.status });
    return NextResponse.json(
      { ok: false, code, message: messageFor(code) },
      { status: code === 'rate_limited' ? 429 : 401 }
    );
  }

  return NextResponse.json({ ok: true, next: '/onboarding' });
}

function fail(code: AuthErrorCode, status: number) {
  return NextResponse.json({ ok: false, code, message: messageFor(code) }, { status });
}
