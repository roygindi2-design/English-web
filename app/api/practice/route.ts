import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { applyPractice, checkPracticePayload } from '@/lib/core/deck';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/practice — see docs/api-contract.md.
 *
 * D-033, and the whole reason this route exists next to /api/review rather than as a
 * flag on it: practising a word the learner just failed must count as practice and must
 * NOT move the word's review date. If practice went through the review route, a learner
 * drilling one hard word five times would hand SM-2 five graded answers, inflate the
 * interval, and push exactly the word they are struggling with weeks into the future —
 * the precise opposite of what «לא ידעתי» is for.
 *
 * So this route writes TWO columns and no others. The four scheduling columns and the
 * recognition streak are not "left alone by convention" — they are absent from the code,
 * and app/api/practice/route.test.ts reads this file as text to keep them absent.
 */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Session BEFORE the body is read or validated — the C-0032 pattern, kept identical to
  // /api/review: an unauthenticated caller learns nothing about which fields we accept.
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const check = checkPracticePayload(await request.json().catch(() => null));
  if (!check.ok) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  const payload = check.payload;

  const { data, error } = await supabase
    .from('word_progress')
    .select('attempts, correct_attempts')
    .eq('user_id', user.id)
    .eq('word_id', payload.wordId)
    .maybeSingle();

  if (error) {
    // The raw PostgREST string names columns and tables, so it goes to the server log and
    // ⛔ never into the response body — the same requirement enforced in T-053 and in
    // /api/study/queue.
    console.error('[api/practice] progress read failed:', error.message);
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  const row = data as { attempts: number | null; correct_attempts: number | null } | null;

  if (row === null) {
    // T-225ⓐⓑ · D-142 — the 404 NARROWS, it is ⛔ not deleted. The reason written here
    // before («a word that was never answered cannot be in a practice deck») is true of
    // every deck and false of exactly two: `deck=level` IS the collection of words that
    // were never answered, and `deck=sentences` (T-199ⓐ · D-156 ⓑ) is the SAME band query
    // (`words.cefr_profile_band = profiles.current_level`, queue/route.ts) — the same
    // «never met» class, word for word (plan `2026-09-08-sentences-deck-and-gate.md`
    // § 0.22 line 4). ⛔ `due` and `unknown` still get the 404.
    if (payload.deck !== 'level' && payload.deck !== 'sentences') {
      return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const known = payload.grade === 'good';
    // ⛔ `insert` ולא `upsert` — הנימוק ב-`app/api/levels/scan/route.ts:92-94`.
    // ⛔ אפס SM-2: `next_review_at: null` נכתב מפורשות ⛔ ואינו «מועד עכשיו» —
    // `deck=due` מסנן `next_review_at <= now`, ו-NULL ⛔ לעולם אינו עומד בתנאי.
    const { error: insertError } = await supabase.from('word_progress').insert({
      user_id: user.id,
      word_id: payload.wordId,
      first_seen_at: nowIso,
      self_marked_known: known,
      // ⛔ סימון עצמי אינו חשיפה שנענתה (scan/route.ts:22) ⇒ «ידעתי» פותחת ב-0.
      attempts: known ? 0 : 1,
      correct_attempts: 0,
      next_review_at: null,
      ...(known ? { self_marked_at: nowIso } : {}),
      updated_at: nowIso,
    });

    if (insertError) {
      console.error('[api/practice] progress insert failed:', insertError.message);
      return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      attempts: known ? 0 : 1,
      correct_attempts: 0,
    });
  }

  // Nullable columns are the database saying "unknown"; for two counters, unknown is 0.
  const next = applyPractice(
    { attempts: row.attempts ?? 0, correctAttempts: row.correct_attempts ?? 0 },
    payload.grade,
  );

  const { error: updateError } = await supabase
    .from('word_progress')
    .update({
      attempts: next.attempts,
      correct_attempts: next.correctAttempts,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('word_id', payload.wordId);

  if (updateError) {
    console.error('[api/practice] progress update failed:', updateError.message);
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  // The two counters travel back so the client can render "3/7" without a second read.
  // ⛔ Nothing about scheduling is returned, because nothing about scheduling changed.
  return NextResponse.json({
    ok: true,
    attempts: next.attempts,
    correct_attempts: next.correctAttempts,
  });
}
