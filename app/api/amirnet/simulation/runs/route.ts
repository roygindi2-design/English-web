import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * ⚠️ Bounded, and deliberately far above four: a learner may re-run a level any number of times,
 * and `T-312` will count those rows. ⛔ Still a cap — an unbounded read is how a route starts
 * paging a history to paint one screen.
 */
const MAX_RUNS = 200;

/** `41 § 4` — four levels, and the route refuses a fifth before the DB's `check` has to. */
const LEVELS = new Set([1, 2, 3, 4]);

/**
 * `GET` · `POST` `/api/amirnet/simulation/runs` — see `docs/api-contract.md`.
 *
 * `T-309`ⓐⓑ — the one impure edge of the unlock. It reads and writes
 * `public.amirnet_simulation_runs` (`0025_amirnet_simulation_runs.sql`) **for the caller alone**,
 * and hands the screen the rows, ⛔ nothing more. ⛔ **It decides ⛔ nothing:** what those rows
 * open is the pure layer's question (`lib/core/amirnetLevels.ts`, with its own test), and a
 * second copy of that rule inside a route is how two answers start disagreeing.
 *
 * ⛔ **A soft read, ⛔ never a 503** — the `T-190`ⓓ pattern, for the same reason the two routes
 * beside it carry it: אמירנט is one node of nine on the ring, and a 503 here is a failure screen
 * for a learner who came for something else. Every failure is **200** with `ok:false` and a code
 * (the two auth-shaped ones excepted), and the raw PostgREST string goes to the log, ⛔ never
 * into the body (`T-053`).
 *
 * 🔴 **`unavailable` on the READ means «⛔ we cannot tell what you finished», ⛔ not «you finished
 * nothing».** The screen falls back to level 1 — `41 § 7`'s own starting state — and says so;
 * ⛔ it ⛔ never reports a locked level as a fact it measured.
 *
 * ⛔ **`user_id` is the session's, ⛔ never the body's.** The `with check (auth.uid() = user_id)`
 * policy in `0025` refuses anything else anyway; this is the first of the two fences, and the
 * reason a learner ⛔ cannot unlock a level on someone else's account.
 *
 * ⛔ **אפס ציון, אפס אומדן, אפס דירוג** (`41 § 9.2` הוא של רוי), ו⛔ אפס נגיעה בטבלת ההתקדמות
 * של הלומד ובזירה (`R-020` · `37 § 13.1`) — ריצת אמירנט היא חומר מבחן, ⛔ ולא מצב אוצר המילים
 * שלו. הגבול נאכף כאן ב**היעדר**.
 */
function soft(where: string, error: { message: string; code?: string }) {
  console.error(`[api/amirnet/simulation/runs] ${where} failed:`, error.message);
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
    .from('amirnet_simulation_runs')
    .select('level, completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(MAX_RUNS);
  if (rows.error) return soft('read', rows.error);

  const runs = (rows.data ?? []).map((row) => ({
    level: row.level as number,
    completedAtMs: Date.parse(row.completed_at as string),
  }));
  return NextResponse.json({ ok: true, runs });
}

export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  let level: unknown;
  try {
    ({ level } = (await request.json()) as { level?: unknown });
  } catch {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }
  if (typeof level !== 'number' || !LEVELS.has(level)) {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }

  // ⛔ An INSERT, ⛔ never an upsert: every completed run is its own row, because «how many runs
  // did I finish here» (`T-312`) is a fact about the history, and an upsert would erase it.
  const written = await supabase.from('amirnet_simulation_runs').insert({ user_id: user.id, level });
  if (written.error) return soft('write', written.error);

  return NextResponse.json({ ok: true });
}
