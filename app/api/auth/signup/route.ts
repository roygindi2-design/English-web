import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  type AuthErrorCode,
  checkCredentials,
  isCredentialPayload,
  destinationAfterAuth,
  mapAuthError,
  messageFor,
  signupOutcome,
} from '@/lib/core/auth';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';
import { checkAuthRateLimit } from '@/lib/supabase/authRateLimit';
import { DEFAULT_TRACK_ID } from '@/lib/core/profile';

export const dynamic = 'force-dynamic';

/** POST /api/auth/signup — see docs/api-contract.md */
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
    'signup'
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
    { headers: request.headers, email: check.email, mode: 'signup' },
    Date.now()
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, code: 'rate_limited', message: messageFor('rate_limited') },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: check.email,
    password: check.password,
  });

  if (error) {
    const code = mapAuthError({ code: error.code, status: error.status });
    return NextResponse.json(
      { ok: false, code, message: messageFor(code), email: check.email },
      { status: code === 'email_taken' ? 409 : 400 }
    );
  }

  const outcome = signupOutcome(Boolean(data.session));

  // D-016: every learner starts on the amiram track. The migration installs a
  // trigger that does this on the database side; this upsert is the belt to its
  // braces for a project where the trigger has not been applied yet.
  if (data.session && data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id, track_id: DEFAULT_TRACK_ID }, { onConflict: 'id' });
    if (profileError) {
      // The account exists; refusing the request now would strand the learner.
      console.error('[signup] profile row not created:', profileError.message);
    }
  }

  return NextResponse.json({
    ok: true,
    outcome,
    next: destinationAfterAuth(outcome),
    email: check.email,
  });
}

function fail(code: AuthErrorCode, status: number) {
  return NextResponse.json({ ok: false, code, message: messageFor(code) }, { status });
}
