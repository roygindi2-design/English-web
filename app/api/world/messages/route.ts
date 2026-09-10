import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseLevel } from '@/lib/core/levelSummary';
import {
  inboxCounts,
  mergeInbox,
  toSimulations,
  type RawSimulationRow,
  type RawStateRow,
} from '@/lib/core/messages';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/** An unbounded read is how a route starts paging a bank to paint one screen. */
const MAX_SIMULATIONS = 200;
const SIMULATION_SELECT = 'id, sender_en, context, subject_en, body_en, required_words, cefr_level, created_at';

/**
 * GET /api/world/messages — see docs/api-contract.md
 *
 * ⛔ **A soft read, ⛔ never a 503 (T-190ⓓ).** `0023_message_simulations.sql` is a new
 * table; the inbox is one node of nine on the ring, and a 503 here would be a failure
 * screen for a learner who came for the arena. ⇒ every read failure is **200** with
 * `ok:false` and a code; the raw PostgREST string goes to the log, never to the body.
 * The C-0032 guard ORDER is unchanged: ENV → session → query. Only the status of the
 * read failures differs from `/api/world/story`.
 */
function soft(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/messages] ${where} read failed:`, error.message);
  // ⚠️ The two codes are spelled out, ⛔ not folded into a ternary: `route.test.ts`
  // scans this file for each literal, and a computed code is a code no scan can read.
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

  const profile = await supabase.from('profiles').select('current_level').eq('id', user.id).maybeSingle();
  if (profile.error) return soft('profile', profile.error);

  // ⛔ No silent fall back to A1 (D-037). «Has not chosen» is a real state.
  const level = parseLevel((profile.data as { current_level?: unknown } | null)?.current_level);
  if (level === null) return NextResponse.json({ ok: false, code: 'no_level' });

  const [rows, states] = await Promise.all([
    supabase
      .from('message_simulations')
      .select(SIMULATION_SELECT)
      .eq('cefr_level', level)
      .order('created_at', { ascending: false })
      .limit(MAX_SIMULATIONS),
    supabase
      .from('message_simulation_state')
      .select('simulation_id, read_at, answered_at')
      .eq('user_id', user.id)
      .limit(MAX_SIMULATIONS),
  ]);
  if (rows.error) return soft('simulations', rows.error);
  if (states.error) return soft('state', states.error);

  const sims = toSimulations((rows.data ?? []) as unknown as readonly RawSimulationRow[]);
  if (sims.length === 0) return NextResponse.json({ ok: false, code: 'no_simulations' });

  const items = mergeInbox(sims, (states.data ?? []) as unknown as readonly RawStateRow[]);
  return NextResponse.json({ ok: true, level, items, counts: inboxCounts(items) });
}
