import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isWorldUnlocked, uniqueHeadwords } from '@/lib/core/world';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * HEURISTIC — POLICY, ⛔ not evidence, and it lives here for the same reason
 * PROMOTE_AFTER_CONSECUTIVE_CORRECT does in app/api/study/queue/route.ts: a constant
 * exported from /lib/core is cited later as if the pure layer had derived it. D-031 states
 * outright that 12 is a product threshold measured off our own 403 approved sentences
 * (median length 10 words), ⛔ has no pedagogical source, and ⛔ must never be written into
 * plan/10-pedagogy.md. Changing either number needs no migration.
 */
const MIN_FUNCTION_WORDS = 100;
const MIN_ACTIVE_WORDS = 12;

/**
 * HEURISTIC ceiling. `words` is `unique (headword, pos)`, so one headword can hold several
 * rows and a row count would OVERSTATE the bank (measured C-0092: 121 headwords across 139
 * senses). PostgREST cannot express `count(distinct headword)`, so the dedupe happens in the
 * pure layer and this is the ceiling on what we are willing to read to do it. ⛔ A
 * `head: true` exact count would report rows, ⛔ not headwords.
 */
const MAX_BANK_ROWS = 2000;

/**
 * Both reads fail the same way, and the shape of that failure is the requirement: the raw
 * PostgREST string goes to the log and ⛔ never into the body, because it names columns and
 * tables. A missing schema is 503 with a Hebrew sentence — ⛔ never 500, ⛔ never an empty
 * screen.
 */
function schemaAwareFailure(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/status] ${where} read failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json(
      { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

export async function GET() {
  // The C-0032 guard order, identical to app/api/study/queue/route.ts: ENV, then session,
  // then the query. An unauthenticated caller learns nothing about the shape of the endpoint.
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

  const active = await supabase
    .from('word_progress')
    .select('word_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active_this_week', true);

  if (active.error) return schemaAwareFailure('active', active.error);

  const counts = {
    functionWords: uniqueHeadwords((bank.data ?? []) as { headword: string | null }[]).length,
    activeWords: active.count ?? 0,
  };

  // ⛔ Computed on every call. A cached unlock state is a wrong unlock state: the learner
  // crosses the threshold mid-session, and the tab has to notice.
  return NextResponse.json({
    ok: true,
    unlocked: isWorldUnlocked(counts, {
      minFunctionWords: MIN_FUNCTION_WORDS,
      minActiveWords: MIN_ACTIVE_WORDS,
    }),
    ...counts,
  });
}
