import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isClassCode, normalizeClassCode } from '@/lib/core/classCode';
import { classFailure, classRow } from '@/lib/server/classFailure';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/world/classes/join — see docs/api-contract.md
 *
 * T-468 · `39 § 2`: `{code}` ⇒ `{name, members}`, or `404 class_not_found`. The code is
 * normalised exactly as `join_class()` does (`lib/core/classCode.ts`), and a string that
 * ⛔ cannot be a code is refused here without a database round-trip.
 */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const raw = ((await request.json().catch(() => null)) as { code?: unknown } | null)?.code;
  const code = typeof raw === 'string' ? normalizeClassCode(raw) : '';
  if (!isClassCode(code)) return NextResponse.json({ ok: false, code: 'class_not_found' }, { status: 404 });

  const joined = await supabase.rpc('join_class', { p_code: code });
  if (joined.error) return classFailure('join', joined.error);
  const row = classRow(joined.data);
  if (!row) return NextResponse.json({ ok: false, code: 'class_not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, code: row.code, name: row.name, members: row.members });
}
