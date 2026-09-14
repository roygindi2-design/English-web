import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LEARNER_TIME_ZONE, checkOnboarding, toIsoDateInZone } from '@/lib/core/onboarding';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * ⚠️ `42703` (undefined column) is the EXPECTED state until a migration has run in
 * production, exactly as `GET /api/levels/summary` documents: the tables exist and
 * the columns do not. A generic 503 "try again" would describe that as temporary,
 * which it is not and no retry will fix.
 *
 * ⛔ A local copy, like every other route's — `git grep isSchemaMissing` shows nine
 * of them. Sharing them is `T-284`'s class of work (one definition for a helper
 * copied per file), ⛔ not this row's, and inventing a tenth shape here would make
 * that row harder rather than easier.
 */
function isSchemaMissing(code: string | undefined): boolean {
  return code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204';
}

/**
 * GET /api/profile — see docs/api-contract.md
 *
 * 🔴 **T-334 — this endpoint is `app/(tabs)/me/page.tsx`'s former body.** The אני tab
 * was the last of the five still rendered on the server on every navigation
 * (`ƒ /me` in `npm run build`, against `○` for the other four), and this read is
 * why: three goal columns and a count of mastered words, both awaited before a
 * pixel of content was drawn. Moving it here makes the tab static and puts the read
 * exactly where `<StudiesScreen>` and `<LevelMapScreen>` already get theirs.
 *
 * ⛔ **And the session gate did ⛔ not move with it.** The page's `getUser()` was
 * never the second lock of F-003 — it was a THIRD lock on the same door `proxy.ts`
 * already holds (measured in T-328 for `/studies`: 307 ⇒ `/login?expired=1` with the
 * page read removed). The second lock, on a genuinely different door, is the session
 * check below — the one a client fetch cannot skip.
 */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // ⚠️ **In parallel, ⛔ not one after the other.** Both reads need only `user.id`,
  // and this row exists because of latency: two sequential awaits would hand back
  // most of what moving the read off the page just won.
  //
  // § 4.2ד. ⛔ `maybeSingle` and not `single`: `0001`'s trigger creates the row, but
  // a screen that throws because a row is missing tells the learner nothing and
  // costs them the whole tab.
  //
  // "Learned" is mastery, not exposure: `mastered_at` is written once, at the moment
  // gate 7.7 is satisfied (`lib/core/progress.ts` · D-010). Counting every
  // `word_progress` row instead would report a word seen once as a word learned.
  // `head: true` — the count is the whole answer, so ⛔ no rows cross the wire.
  const [{ data: profile, error: profileError }, { count, error: countError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('institution, target_score, exam_date')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('word_progress')
      .select('word_id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('mastered_at', 'is', null),
  ]);

  // ⛔ The missing-schema branch is the profile read's alone, and that asymmetry is
  // deliberate: a failed COUNT already has an honest, learner-visible answer
  // (`wordsLearned: null` ⇒ `<MeWordsLearned>`'s Hebrew failure sentence and a
  // retry), while a failed profile read renders as **no goal block at all** — which
  // is honest silence for a transient failure and a LIE when the column does not
  // exist. ⇒ only the second one is promoted to a code the screen can act on.
  if (profileError && isSchemaMissing((profileError as { code?: string }).code)) {
    console.error('[api/profile] profile read failed:', profileError.message);
    return NextResponse.json(
      { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
      { status: 503 },
    );
  }

  // 🔴 `null` on a failed count and ⛔ never `0`: a read that failed and a learner who
  // has learned nothing look identical once the failure is flattened, and only one of
  // them is true (T-301). `count ?? 0` applies ⛔ ONLY on the success branch.
  return NextResponse.json({
    ok: true,
    goal: {
      institution: profile?.institution ?? null,
      targetScore: profile?.target_score ?? null,
      examDate: profile?.exam_date ?? null,
    },
    wordsLearned: countError ? null : (count ?? 0),
  });
}

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
  // ⛔ `institution` ⛔ אינו נכתב עוד — D-056 · T-111 (רוי, 19/08). העמודה
  // `profiles.institution` **נשארת** (`0009`, nullable) ומוסיפה להיקרא ב-`/me`
  // עבור לומדים שכבר ענו. ⛔ אל תציע `drop column` — מחיקת עמודה הרסנית ואינה
  // סמכות סוכן, וההחלטה נוקבת בכך במפורש. מתועד כחוב ב-`plan/30-architecture.md`.
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

  // § 4.2ב flow 1: onboarding ends on the לימודים tab, ⛔ not on `/study` —
  // that is a flow screen with no tab bar, and a learner who landed there had
  // no way to reach the other three. `components/OnboardingForm.tsx` navigates
  // to whatever arrives here, so this string is the whole decision.
  return NextResponse.json({ ok: true, next: '/studies' });
}
