import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isSendable, MAX_SENTENCE_WORDS, type ContinuationLevel } from '@/lib/core/continuations';
import { MESSAGE_LEVELS } from '@/lib/core/messages';
import { continuationsTree } from '@/lib/server/continuationsTree';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORD = /^[a-z']+$/i;

/**
 * POST /api/world/messages/[id]/answer — see docs/api-contract.md
 *
 * T-462 · `39 § 7` · D-207 · D-283: the learner sends a reply composed on the block
 * keyboard ⇒ `answered_at` on their own `message_simulation_state` row (column from
 * `0023`, RLS `auth.uid() = user_id` ⇒ ⛔ no migration).
 *
 * ⛔ **The reply TEXT is ⛔ not stored** — there is ⛔ no column for it, and one is ⛔ not
 * added without a row. The words travel only so the server can check them.
 * ⛔ **An unfinished reply is ⛔ not an answer:** the words must end where an observed
 * sentence ended, at the simulation's level (`isSendable`, the same tree the keyboard
 * reads). A client that skips the keyboard cannot write «answered».
 * ⚠️ Answering implies opening: `read_at` is kept if set, else stamped with the answer.
 * The FIRST answer counts — a second send returns the stamp already there.
 * ⚠️ A write is a HARD call (503), exactly like `PATCH …/state`.
 */
function failure(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/messages/answer] ${where} failed:`, error.message);
  // ⚠️ Spelled out, ⛔ not folded into a ternary: `route.test.ts` scans for each literal.
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json({ ok: false, code: 'schema_missing' }, { status: 503 });
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

export function parseWords(body: unknown): string[] | null {
  const words = (body as { words?: unknown } | null)?.words;
  if (!Array.isArray(words) || words.length === 0 || words.length > MAX_SENTENCE_WORDS) return null;
  if (!words.every((w): w is string => typeof w === 'string' && WORD.test(w))) return null;
  return words;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const { id } = await params;
  const words = parseWords(await request.json().catch(() => null));
  if (!UUID.test(id) || words === null) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }

  const sim = await supabase.from('message_simulations').select('cefr_level').eq('id', id).maybeSingle();
  if (sim.error) return failure('simulation', sim.error);
  const level = (sim.data as { cefr_level?: unknown } | null)?.cefr_level;
  if (!(MESSAGE_LEVELS as readonly unknown[]).includes(level)) {
    return NextResponse.json({ ok: false, code: 'not_found' }, { status: 404 });
  }
  if (!isSendable(continuationsTree(), words, level as ContinuationLevel)) {
    return NextResponse.json({ ok: false, code: 'not_sendable' }, { status: 400 });
  }

  const existing = await supabase
    .from('message_simulation_state')
    .select('read_at, answered_at')
    .eq('user_id', user.id)
    .eq('simulation_id', id)
    .maybeSingle();
  if (existing.error) return failure('read', existing.error);

  const prev = existing.data as { read_at?: string | null; answered_at?: string | null } | null;
  if (prev?.answered_at) return NextResponse.json({ ok: true, answeredAt: prev.answered_at });

  const answeredAt = new Date().toISOString();
  const written = await supabase
    .from('message_simulation_state')
    .upsert(
      { user_id: user.id, simulation_id: id, read_at: prev?.read_at ?? answeredAt, answered_at: answeredAt },
      { onConflict: 'user_id,simulation_id' },
    );
  if (written.error) return failure('upsert', written.error);
  return NextResponse.json({ ok: true, answeredAt });
}
