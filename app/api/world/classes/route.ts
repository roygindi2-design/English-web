import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { classFailure, classRow } from '@/lib/server/classFailure';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/world/classes — see docs/api-contract.md
 *
 * T-468 · `39 § 2` · D-287: the learner opens a closed class ⇒ `{code, name}`. Through
 * `create_class()` (0032, `security definer`) ONLY — ⛔ no insert policy exists, so the
 * route ⛔ cannot write the table directly even by mistake.
 */
export function parseName(body: unknown): string | null {
  const name = (body as { name?: unknown } | null)?.name;
  if (typeof name !== 'string') return null;
  const t = name.trim();
  return t.length >= 1 && t.length <= 60 ? t : null;
}

export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const name = parseName(await request.json().catch(() => null));
  if (name === null) return NextResponse.json({ ok: false, code: 'invalid_name' }, { status: 400 });

  const created = await supabase.rpc('create_class', { p_name: name });
  if (created.error) return classFailure('create', created.error);
  const row = classRow(created.data);
  if (!row) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true, code: row.code, name: row.name });
}
