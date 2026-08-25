import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkContextTapPayload } from '@/lib/core/contextTapRequest';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/review/context — T-187ⓕ · D-084 · closes T-149ⓐ. See docs/api-contract.md
 *
 * ⛔ **A tap in a story raises `attempts` and ⛔ NOTHING else.** § 4.2יג sentence 3:
 * «⛔ אין טעות בקריאה, ולכן ⛔ אין ציון». The six SM-2 columns are ⛔ never named in this
 * file, and `route.test.ts` scans the source BY NAME for each of them — a conditional
 * write inside `POST /api/review` could not have been proven absent that way, which is the
 * whole reason this is a separate route and ⛔ not a flag (a reversible call under
 * `RULES § 0.16`, logged in the tick summary).
 *
 * ⛔ **One row per pair, ⛔ not one row per event (W4).** `word_progress` is
 * `primary key (user_id, word_id, track_id)` and `0003b_provenance_telemetry.sql` states
 * outright that an event log on a spaced-repetition app grows without a ceiling. The write
 * is therefore an upsert on that key.
 *
 * ⛔ **It ⛔ never touches the arena's decoupled table (D-052 · D-053)** — the boundary is
 * enforced here by absence, ⛔ not only by review.
 *
 * ⚠️ **Coupling is PRESERVED, and that is the point (D-054):** after the tap a
 * `word_progress` row exists, so the word leaves «טרם נראה» and «נשארו לך N מילים ברמה»
 * moves. That is exactly the gamification § 4.2יג promised, and it costs ⛔ zero columns.
 */

/** ⛔ Two columns on the read, and one on the write. The narrowness IS the guard. */
const READ_COLUMNS = 'attempts';
const CONFLICT_KEY = 'user_id,word_id,track_id';

export interface ContextTapClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: { attempts: number | null } | null;
            error: { message: string; code?: string } | null;
          }>;
        };
      };
    };
    upsert: (
      row: Record<string, unknown>,
      options: { onConflict: string },
    ) => Promise<{ error: { message: string; code?: string } | null }>;
  };
}

export type ContextTapResult =
  | { readonly ok: true; readonly attempts: number }
  | { readonly ok: false; readonly code: 'schema_missing' | 'unavailable' };

/**
 * Exported so the behaviour can be proven against a stubbed client, ⛔ not only asserted
 * as source text: the source scan proves the file does not NAME the forbidden columns,
 * and this proves the row it actually writes carries three keys and no more.
 */
export async function handleContextTap(
  supabase: ContextTapClient,
  userId: string,
  wordId: string,
): Promise<ContextTapResult> {
  const existing = await supabase
    .from('word_progress')
    .select(READ_COLUMNS)
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .maybeSingle();

  if (existing.error) return failureFor(existing.error);

  const attempts = (existing.data?.attempts ?? 0) + 1;
  const written = await supabase
    .from('word_progress')
    .upsert({ user_id: userId, word_id: wordId, attempts }, { onConflict: CONFLICT_KEY });

  if (written.error) return failureFor(written.error);
  return { ok: true, attempts };
}

function failureFor(error: { message: string; code?: string }): ContextTapResult {
  console.error('[api/review/context] write failed:', error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') return { ok: false, code: 'schema_missing' };
  return { ok: false, code: 'unavailable' };
}

export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }

  const checked = checkContextTapPayload(body);
  if (!checked.ok) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });

  const result = await handleContextTap(
    supabase as unknown as ContextTapClient,
    user.id,
    checked.payload.wordId,
  );
  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.code }, { status: 503 });
  }
  return NextResponse.json({ ok: true, attempts: result.attempts });
}
