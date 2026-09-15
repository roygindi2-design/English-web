import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { toTypeStats, type AmirnetAttemptRow } from '@/lib/core/amirnetAttempts';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * ⚠️ Bounded, and deliberately far above a session's worth: the dashboard sums the learner's
 * history, ⛔ not the last screenful. ⛔ Still a cap — an unbounded read is how a route starts
 * paging a history to paint three cards.
 */
const MAX_ATTEMPTS = 1000;

/**
 * `41 § 6.2` — three types and four levels, and the route refuses a fourth/fifth before the DB's
 * `check` has to. Spelled as sets, ⛔ not derived, exactly as the two routes beside it do.
 */
const TYPES = new Set(['sc', 'rs', 'rc']);
const LEVELS = new Set([1, 2, 3, 4]);

/**
 * `GET` · `POST` `/api/amirnet/practice/result` — see `docs/api-contract.md`.
 *
 * `T-372`ⓑ — the one impure edge of the practice RESULT. It reads and writes
 * `public.amirnet_practice_attempts` (`0027_amirnet_practice_attempts.sql`) **for the caller
 * alone**, and hands the dashboard the three stats, ⛔ nothing more. ⛔ **It decides ⛔ nothing:**
 * what those rows mean is the pure layer's question (`lib/core/amirnetAttempts.ts` `toTypeStats()`
 * and then `toTypeCards()`/`weakestCard()`, each with its own test), and a second copy of that
 * arithmetic inside a route is how two answers start disagreeing.
 *
 * ⛔ **A soft read, ⛔ never a 503** — the `T-190`ⓓ pattern, for the same reason the three routes
 * beside it carry it: אמירנט is one node of nine on the ring, and a 503 here is a failure screen
 * for a learner who came for something else. Every failure is **200** with `ok:false` and a code
 * (the two auth-shaped ones excepted), and the raw PostgREST string goes to the log, ⛔ never
 * into the body (`T-053`).
 *
 * 🔴 **`unavailable` on the READ means «⛔ we cannot tell what you answered», ⛔ not «you answered
 * nothing».** The dashboard says exactly that and draws ⛔ no card — it ⛔ never reports a zero it
 * did not measure, which is the same refusal `T-291`ⓓ built the empty state for.
 *
 * ⛔ **`user_id` is the session's, ⛔ never the body's.** The `with check (auth.uid() = user_id)`
 * policy in `0027` refuses anything else anyway; this is the first of the two fences.
 *
 * ⛔ **אפס ציון, אפס אומדן, אפס דירוג** (`41 § 9.2` הוא של רוי) · ⛔ אפס אדפטיביות (`41 § 7`:
 * ⛔ שום דבר כאן ⛔ אינו נקרא כדי לבחור רמה או פריט) · ו⛔ אפס נגיעה בטבלת ההתקדמות של הלומד
 * ובזירה (`R-020` · `37 § 13.1`) — תרגול אמירנט הוא חומר מבחן, ⛔ ולא מצב אוצר המילים שלו.
 * ⚠️ ההיעדר נמדד בשם ב-`route.test.ts`, ⇒ המזהה עצמו ⛔ אינו מופיע בקובץ הזה, גם ⛔ לא בהערה.
 */
function soft(where: string, error: { message: string; code?: string }) {
  console.error(`[api/amirnet/practice/result] ${where} failed:`, error.message);
  // ⚠️ Both codes spelled out, ⛔ not folded into a ternary: `route.test.ts` scans this file for
  // each literal, and a computed code is a code no scan can read.
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json({ ok: false, code: 'schema_missing' });
  }
  return NextResponse.json({ ok: false, code: 'unavailable' });
}

export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // ⛔ No `.eq('user_id', …)` is needed for correctness — the RLS policy is the boundary — but it
  // is written anyway: a route that states its own scope ⛔ cannot be widened by a policy edit
  // nobody reviewed (the 0007 reasoning, applied from the other side).
  const rows = await supabase
    .from('amirnet_practice_attempts')
    .select('type, correct')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(MAX_ATTEMPTS);
  if (rows.error) return soft('read', rows.error);

  // ⛔ The fold is the pure layer's, ⛔ never a `reduce` written here.
  const stats = toTypeStats((rows.data ?? []) as unknown as readonly AmirnetAttemptRow[]);
  return NextResponse.json({ ok: true, stats });
}

export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  let itemId: unknown;
  let type: unknown;
  let level: unknown;
  let correct: unknown;
  try {
    ({ itemId, type, level, correct } = (await request.json()) as {
      itemId?: unknown;
      type?: unknown;
      level?: unknown;
      correct?: unknown;
    });
  } catch {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }
  // ⛔ Four checks and ⛔ no default on any of them. A result with a filled-in half is a result
  // about a question the learner did not answer.
  if (typeof itemId !== 'string' || itemId === '') {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }
  if (typeof type !== 'string' || !TYPES.has(type)) {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }
  if (typeof level !== 'number' || !LEVELS.has(level)) {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }
  if (typeof correct !== 'boolean') {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }

  // ⛔ An INSERT, ⛔ never an upsert: every answer is its own row, because «how many questions did
  // I answer in this type» is a fact about the history, and an upsert would erase it. A learner
  // who answers the same item twice answered twice.
  const written = await supabase
    .from('amirnet_practice_attempts')
    .insert({ user_id: user.id, item_id: itemId, type, level, correct });
  if (written.error) return soft('write', written.error);

  return NextResponse.json({ ok: true });
}
