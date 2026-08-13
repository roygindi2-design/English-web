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
  // A missing row is 404 and ⛔ never an insert. A word with no progress row was never
  // answered, and a word that was never answered cannot be in a practice deck — so a
  // missing row means the caller sent a word_id that does not belong to this deck, not
  // that a row is owed. Inserting here would fabricate a learning history from a stray
  // POST, and would do it with the scheduling columns at their defaults, i.e. due now.
  if (row === null) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 404 });

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
