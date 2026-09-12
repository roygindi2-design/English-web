import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { toServedItems, type AmirnetItemRow } from '@/lib/core/amirnetItemGate';
import { servableItems } from '@/lib/core/amirnetQuestion';
import { simulationQueue } from '@/lib/core/amirnetSimulation';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * ⚠️ Deliberately wider than the practice route's 40: a run needs 23 items spread over three
 * types, and a cap that cannot hold them would report «⛔ אין מספיק» about a bank that has enough.
 * ⛔ Still bounded — an unbounded read is how a route starts paging a bank to paint one screen.
 */
const MAX_ITEMS = 200;
const ITEM_SELECT =
  'id, type, level, stem_en, passage_en, options_en, correct_index, distractor_reasons, explanation_he, level_rationale, vocab_band, source';

const LEVELS = new Set([1, 2, 3, 4]);

/**
 * GET /api/amirnet/simulation?level=3 — see docs/api-contract.md.
 *
 * `T-308`ⓒ — the one impure edge of the simulation entry. It reads `public.amirnet_items`
 * (`0024_amirnet_items.sql`) at the level the learner pressed and hands the screen a queue that
 * is **already gated and already laid out in `41 § 2`'s chapter order**. The component decides
 * ⛔ nothing, validates ⛔ nothing and assembles ⛔ nothing.
 *
 * ⛔ **A soft read, ⛔ never a 503** — the `T-190`ⓓ pattern, for the same reason the practice
 * route carries it: אמירנט is one node of nine on the ring, and a 503 here is a failure screen
 * for a learner who came for something else. Every read failure is **200** with `ok:false` and a
 * code, and the raw PostgREST string goes to the log, ⛔ never into the body (`T-053`).
 *
 * ⛔ **`level` is the learner's own tap and there is ⛔ no default** — `41 § 7` puts the simulation
 * level behind the unlock, ⛔ not behind a guess. A route that filled in a missing level would be
 * choosing a level for a learner who named none, which is adaptivity wearing a default's clothes
 * (`41 § 3`).
 *
 * ⛔ **The bank is read-only from a client** (`0024` grants `select` alone), and ⛔ nothing here
 * reaches the learner's progress table or the arena (`R-020` · `37 § 13.1`): an amirnet item is
 * exam material, ⛔ not the learner's vocabulary state.
 *
 * 🔴 **`no_items` here means «⛔ cannot fill all six chapters», ⛔ not «the bank is empty»** —
 * `simulationQueue()` returns `null` rather than a short run, because a four-chapter «full
 * simulation» is exactly the `41 § 2` failure the engine was written against.
 */
function soft(where: string, error: { message: string; code?: string }) {
  console.error(`[api/amirnet/simulation] ${where} read failed:`, error.message);
  // ⚠️ Both codes spelled out, ⛔ not folded into a ternary: `route.test.ts` scans this file for
  // each literal, and a computed code is a code no scan can read.
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json({ ok: false, code: 'schema_missing' });
  }
  return NextResponse.json({ ok: false, code: 'unavailable' });
}

export async function GET(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const level = Number(new URL(request.url).searchParams.get('level'));
  if (!LEVELS.has(level)) {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }

  const rows = await supabase
    .from('amirnet_items')
    .select(ITEM_SELECT)
    .eq('level', level)
    .order('created_at', { ascending: false })
    .limit(MAX_ITEMS);
  if (rows.error) return soft('items', rows.error);

  // ⛔ Three steps, ⛔ and not one of them repairs: the row maps, the gate REFUSES an item missing
  // a level, an explanation, four options or a correct index, and only then are the six chapters
  // laid end to end. A chapter that cannot be filled ends the whole run, ⛔ never shortens it.
  const items = simulationQueue(
    servableItems(toServedItems((rows.data ?? []) as unknown as readonly AmirnetItemRow[])),
  );
  if (items === null) return NextResponse.json({ ok: false, code: 'no_items' });

  return NextResponse.json({ ok: true, level, items });
}
