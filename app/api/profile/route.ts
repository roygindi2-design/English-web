import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LEARNER_TIME_ZONE, checkOnboarding, toIsoDateInZone } from '@/lib/core/onboarding';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/** POST /api/profile — see docs/api-contract.md */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  // F-004's lesson: `null`, an array and a bare primitive all parse fine and
  // would crash the property reads below with a 500 instead of the contract.
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;

  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Validate AFTER the session check: an unauthenticated caller learns nothing
  // about which fields we accept.
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // The learner's calendar day, not the server's — see LEARNER_TIME_ZONE. The
  // clock is read here, at the edge, so lib/core stays a pure function of its
  // arguments.
  const today = toIsoDateInZone(new Date(), LEARNER_TIME_ZONE);
  const check = checkOnboarding(
    {
      // OnboardingRaw takes `unknown` by design, so nothing is cast on the way
      // in — a cast here would only be a promise about a request body we do not
      // control, and checkOnboarding is the thing that decides what is true.
      dailyMinutes: body.dailyMinutes,
      examDate: body.examDate,
      targetScore: body.targetScore,
    },
    today
  );
  if (!check.ok) {
    return NextResponse.json({ ok: false, fieldErrors: check.fieldErrors }, { status: 422 });
  }

  // update, not upsert: 0001's on_auth_user_created trigger already created the
  // row, and an upsert here would need to restate track_id — a second place
  // where the default lives is a second place for it to be wrong (D-016).
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({
      daily_minutes: check.answers.dailyMinutes,
      exam_date: check.answers.examDate,
      target_score: check.answers.targetScore,
      onboarded_at: now,
      updated_at: now,
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, next: '/study' });
}
