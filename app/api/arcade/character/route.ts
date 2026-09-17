import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isArenaCharacter, withCharacter } from '@/lib/core/arenaCharacter';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * `PATCH /api/arcade/character` — T-217 · `37 § 7` · D-152. **One jsonb key, one table.**
 *
 * The route applies a write plan and ⛔ does not decide: validity is `isArenaCharacter`
 * and the merged object is `withCharacter`, both in `lib/core/arenaCharacter.ts`.
 *
 * ⛔ **The upsert carries `user_id` and `avatar_parts` — and nothing else.** That is how
 * `§ 7`'s «בלי לאבד רמה או ציוד» holds **by construction**: the level, the
 * wins and the unlocked items are ⛔ not in the statement, so a character change ⛔ cannot
 * touch them. `route.test.ts` asserts it on the source.
 * ⛔ `37 § 13.1`: the arena never writes the review engine — this file touches
 * `arcade_progress` alone. The guard order is C-0032: ENV ⇒ session ⇒ query, and the
 * three failure bodies are those of `PATCH /api/arcade/collected` word for word.
 */

function isSchemaMissing(code: string | undefined): boolean {
  return code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204';
}
function schemaMissing() {
  return NextResponse.json(
    { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
    { status: 503 },
  );
}
function unavailable() {
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}
function sessionExpired() {
  return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });
}

/** PATCH /api/arcade/character — see docs/api-contract.md */
export async function PATCH(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  const candidate =
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).character
      : undefined;
  if (!isArenaCharacter(candidate)) {
    return NextResponse.json(
      { ok: false, fieldErrors: { character: 'לא הצלחנו לשמור את הבחירה. נסה שוב.' } },
      { status: 422 },
    );
  }
  const character = candidate;

  // Read the blob first so every key already in it survives the merge (D-152).
  const { data, error: readError } = await supabase
    .from('arcade_progress')
    .select('avatar_parts')
    .eq('user_id', user.id)
    .maybeSingle();
  if (readError) {
    console.error('[api/arcade/character] read failed:', readError.message);
    return isSchemaMissing(readError.code) ? schemaMissing() : unavailable();
  }

  const { error } = await supabase
    .from('arcade_progress')
    .upsert({ user_id: user.id, avatar_parts: withCharacter(data?.avatar_parts, character) }, { onConflict: 'user_id' });
  if (error) {
    console.error('[api/arcade/character] write failed:', error.message);
    return isSchemaMissing(error.code) ? schemaMissing() : unavailable();
  }

  return NextResponse.json({ ok: true, character });
}
