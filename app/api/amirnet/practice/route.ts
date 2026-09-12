import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { toServedItems, type AmirnetItemRow } from '@/lib/core/amirnetItemGate';
import { servableItems } from '@/lib/core/amirnetQuestion';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/** An unbounded read is how a route starts paging a bank to paint one screen. */
const MAX_ITEMS = 40;
const ITEM_SELECT =
  'id, type, level, stem_en, passage_en, options_en, correct_index, distractor_reasons, explanation_he, level_rationale, vocab_band, source';

const TYPES = new Set(['sc', 'rs', 'rc']);
const LEVELS = new Set([1, 2, 3, 4]);

/**
 * GET /api/amirnet/practice?type=sc&level=3 — see docs/api-contract.md.
 *
 * T-297ⓒ. The one impure edge of the amirnet practice slice: it reads
 * `public.amirnet_items` (`0024_amirnet_items.sql`) and hands the screen a queue that is
 * ALREADY gated. The component decides nothing and validates nothing.
 *
 * ⛔ **A soft read, ⛔ never a 503 — the T-190ⓓ pattern, for the same reason.** אמירנט is
 * one node of nine on the ring; a 503 here is a failure screen for a learner who came for
 * something else. ⇒ every read failure is **200** with `ok:false` and a code, and the raw
 * PostgREST string goes to the log, ⛔ never into the body (T-053).
 *
 * ⛔ **אין אדפטיביות בתרגול** (`41 § 7`, verbatim: «הרמה נבחרת ידנית»). `type` and `level`
 * arrive from the learner's own two taps in the menu; ⛔ nothing here reads an answer, a
 * history or a level to choose them, and there is ⛔ no fall-back that picks a level for a
 * caller who named none — that would be adaptivity wearing a default's clothes.
 *
 * ⛔ **The bank is read-only from a client** (`0024` grants `select` alone). Items are
 * written by the content commission `K-006`, ⛔ never by a client action.
 *
 * ⛔ **And ⛔ nothing here touches the learner's progress table or the arena** (`R-020` ·
 * `37 § 13.1`): an amirnet item is exam material, ⛔ not the learner's vocabulary state.
 * ⚠️ The absence is measured by name in `route.test.ts`, so the identifier itself appears
 * ⛔ nowhere in this file — including in a comment that swears it is not used.
 */
function soft(where: string, error: { message: string; code?: string }) {
  console.error(`[api/amirnet/practice] ${where} read failed:`, error.message);
  // ⚠️ The two codes are spelled out, ⛔ not folded into a ternary: `route.test.ts` scans
  // this file for each literal, and a computed code is a code no scan can read.
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

  const params = new URL(request.url).searchParams;
  const type = params.get('type');
  const level = Number(params.get('level'));
  // ⛔ No default on either half. `practiceReady()` (`lib/core/amirnetPractice.ts`) already
  // says the question ⛔ does not open until the learner chose both; a route that filled in
  // the missing half would serve a question nobody asked for.
  if (type === null || !TYPES.has(type) || !LEVELS.has(level)) {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }

  const rows = await supabase
    .from('amirnet_items')
    .select(ITEM_SELECT)
    .eq('type', type)
    .eq('level', level)
    .order('created_at', { ascending: false })
    .limit(MAX_ITEMS);
  if (rows.error) return soft('items', rows.error);

  // ⛔ Two steps, ⛔ and neither of them repairs: `toServedItems` maps the row, and
  // `servableItems` REFUSES an item that is missing a level, an explanation, four options or
  // a correct index. An empty result is «אין עוד פריטים ברמה הזאת» (`NO_MORE_ITEMS_HE`),
  // ⛔ never an item assembled from defaults.
  const items = servableItems(toServedItems((rows.data ?? []) as unknown as readonly AmirnetItemRow[]));
  if (items.length === 0) return NextResponse.json({ ok: false, code: 'no_items' });

  return NextResponse.json({ ok: true, type, level, items });
}
