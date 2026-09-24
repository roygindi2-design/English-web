import { NextResponse } from 'next/server';

/**
 * T-468ⓑ — a Supabase error on a class route ⇒ a NAMED answer, ⛔ never a bare 500.
 *
 *   42P01 · PGRST205 · PGRST202   the table or the function is missing (0032/0033 not
 *                                  applied on this database) ⇒ 503 `classes_unavailable`
 *   P0002  `class_not_found`       ⇒ 404 — the code the learner typed opens nothing
 *   22023  `invalid_name`          ⇒ 400
 *   28000  `not_authenticated`     ⇒ 401 `session_expired`
 *   anything else                  ⇒ 503 `unavailable`
 */
export function classFailure(where: string, error: { message: string; code?: string }): NextResponse {
  console.error(`[api/world/classes] ${where} failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST202') {
    return NextResponse.json({ ok: false, code: 'classes_unavailable' }, { status: 503 });
  }
  if (error.code === 'P0002') return NextResponse.json({ ok: false, code: 'class_not_found' }, { status: 404 });
  if (error.code === '22023') return NextResponse.json({ ok: false, code: 'invalid_name' }, { status: 400 });
  if (error.code === '28000') return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

/** The one row a class function returns, or null. ⛔ Only code · name · members ever leave. */
export function classRow(data: unknown): { code: string; name: string; members: number | null } | null {
  const row = (Array.isArray(data) ? data[0] : data) as { code?: unknown; name?: unknown; members?: unknown } | null;
  if (!row || typeof row.code !== 'string' || typeof row.name !== 'string') return null;
  return { code: row.code.trim(), name: row.name, members: typeof row.members === 'number' ? row.members : null };
}
