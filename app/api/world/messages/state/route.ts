import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/world/messages/state — see docs/api-contract.md
 *
 * Opening a message turns the blue dot off (T-192ⓔ): the learner's own
 * `message_simulation_state` row gets `read_at` if it has none yet. ⛔ The «answered»
 * column is ⛔ never written here — only `POST …/[id]/answer` (T-462) writes it, after
 * checking the reply against the continuation tree.
 *
 * ⚠️ **A write is a HARD call, ⛔ unlike the soft GET beside it:** a missing ENV or a
 * failed write answers 503. The GET is soft because a failed READ still leaves the ring
 * usable; a write that silently reports success would leave the dot lit on the next
 * visit with ⛔ nothing anywhere saying why.
 *
 * ⛔ The row is keyed on the SESSION user, ⛔ never on a body field — the body carries the
 * simulation id and ⛔ nothing else that reaches the database.
 */
function failure(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/messages/state] ${where} failed:`, error.message);
  // ⚠️ Spelled out, ⛔ not folded into a ternary: `route.test.ts` scans for each literal.
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json({ ok: false, code: 'schema_missing' }, { status: 503 });
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

export async function PATCH(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { simulationId?: unknown; read?: unknown } | null;
  const simulationId = typeof body?.simulationId === 'string' ? body.simulationId : '';
  if (!UUID.test(simulationId) || body?.read !== true) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }

  const existing = await supabase
    .from('message_simulation_state')
    .select('read_at')
    .eq('user_id', user.id)
    .eq('simulation_id', simulationId)
    .maybeSingle();
  if (existing.error) return failure('read', existing.error);

  // ⛔ The FIRST open is the one that counts: a second open ⛔ does not move the stamp.
  const already = (existing.data as { read_at?: string | null } | null)?.read_at ?? null;
  if (already !== null) return NextResponse.json({ ok: true, readAt: already });

  const readAt = new Date().toISOString();
  const written = await supabase
    .from('message_simulation_state')
    .upsert({ user_id: user.id, simulation_id: simulationId, read_at: readAt }, { onConflict: 'user_id,simulation_id' });
  if (written.error) return failure('upsert', written.error);
  return NextResponse.json({ ok: true, readAt });
}
