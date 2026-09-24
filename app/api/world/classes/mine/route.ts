import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { classFailure, classRow } from '@/lib/server/classFailure';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/world/classes/mine — see docs/api-contract.md
 *
 * T-468: the learner's class (the newest they joined) ⇒ `{class: {code, name, members}}`,
 * or `{class: null}`. Through `my_class()` (0033) — ⛔ a class the learner is ⛔ not in is
 * never returned, and ⛔ no endpoint lists classes (`39 § 2`).
 */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const mine = await supabase.rpc('my_class');
  if (mine.error) return classFailure('mine', mine.error);
  return NextResponse.json({ ok: true, class: classRow(mine.data) });
}
