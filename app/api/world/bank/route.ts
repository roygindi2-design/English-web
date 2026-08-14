import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { pickTargetWord, uniqueHeadwords } from '@/lib/core/world';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';
import {
  flattenJoinedHeadwords,
  type HeadwordRow,
  type JoinedHeadwordRow,
} from '@/lib/supabase/postgrest';

export const dynamic = 'force-dynamic';

/** `words` is `unique (headword, pos)`, so one headword can hold several rows and a row
 *  count would OVERSTATE the bank (measured C-0092: 121 headwords across 139 senses).
 *  PostgREST cannot express `count(distinct headword)`, so the dedupe happens in the pure
 *  layer and this is the ceiling on what we are willing to read to do it. */
const MAX_BANK_ROWS = 2000;

/** The learner's own published posts, read only to steer the target away from words they
 *  have already produced. A ceiling, ⛔ not a product limit — the feed itself is task 5. */
const MAX_USED_ROWS = 500;

/** ⚠️ Moved to lib/supabase/postgrest.ts in C-0126: /api/world/status needed the identical
 *  flatten to fix F-040, and a second copy is how the two readers of the same join drift. */

function schemaAwareFailure(where: string, error: { message: string; code?: string }) {
  // The raw string goes to the log and ⛔ never into the body — a PostgREST message names
  // columns and tables.
  console.error(`[api/world/bank] ${where} read failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json(
      { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const bank = await supabase
    .from('words')
    .select('headword')
    .eq('is_function_word', true)
    .order('headword', { ascending: true })
    .limit(MAX_BANK_ROWS);

  if (bank.error) return schemaAwareFailure('bank', bank.error);

  // `words!inner` is deliberate, and for the same reason app/api/study/queue/route.ts gives:
  // a progress row whose word was deleted is not a bank chip, and an outer join surfaces it
  // as a chip with nothing written on it.
  const active = await supabase
    .from('word_progress')
    .select('words!inner(headword)')
    .eq('user_id', user.id)
    .eq('is_active_this_week', true)
    .limit(MAX_BANK_ROWS);

  if (active.error) return schemaAwareFailure('active', active.error);

  const activeWords = uniqueHeadwords(
    flattenJoinedHeadwords((active.data ?? []) as JoinedHeadwordRow[]),
  );

  // ⚠️ This third read steers the target and nothing else. If it fails, `usedWords` becomes
  // [] and pickTargetWord falls back to the alphabetically first active word: a learner who
  // cannot be given the IDEAL target still gets a working screen, and ⛔ a 503 here would
  // blank a screen over an optimisation.
  const used = await supabase
    .from('world_posts')
    .select('body_en')
    .eq('user_id', user.id)
    .eq('author_kind', 'learner')
    .limit(MAX_USED_ROWS);

  if (used.error) console.error('[api/world/bank] used read failed:', used.error.message);

  const usedWords = used.error
    ? []
    : ((used.data ?? []) as { body_en: string | null }[]).flatMap((row) =>
        typeof row.body_en === 'string' ? row.body_en.split(/\s+/) : [],
      );

  return NextResponse.json({
    ok: true,
    functionWords: uniqueHeadwords((bank.data ?? []) as HeadwordRow[]),
    activeWords,
    target: pickTargetWord(activeWords, usedWords),
  });
}
