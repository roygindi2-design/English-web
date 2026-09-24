import { NextResponse } from 'next/server';

/**
 * T-468ⓑ — a Supabase error on a class route ⇒ a NAMED answer, ⛔ never a bare 500.
 *
 *   42P01 · PGRST205 · PGRST202   the table or the function is missing (0032/0033 not
 *                                  applied on this database) ⇒ 503 `classes_unavailable`
 *   P0002  `class_not_found`       ⇒ 404 — the code the learner typed opens nothing
 *   P0002  `post_not_found` · `reply_not_found` ⇒ 404 `post_not_found` (0034 — ⛔ never
 *          403: a non-member is ⛔ not told that the post exists)
 *   42501  `only_class_opener` · `own_content` ⇒ 403 by that name (0034 · D-288)
 *   22023  `invalid_body` · `invalid_target` ⇒ 400 `invalid_body` (0034)
 *   22023  `invalid_name`          ⇒ 400
 *   28000  `not_authenticated`     ⇒ 401 `session_expired`
 *   anything else                  ⇒ 503 `unavailable`
 */
export function classFailure(where: string, error: { message: string; code?: string }): NextResponse {
  console.error(`[api/world/classes] ${where} failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST202') {
    return NextResponse.json({ ok: false, code: 'classes_unavailable' }, { status: 503 });
  }
  const named = (c: string) => error.message.includes(c);
  if (error.code === 'P0002') {
    const code = named('post_not_found') || named('reply_not_found') ? 'post_not_found' : 'class_not_found';
    return NextResponse.json({ ok: false, code }, { status: 404 });
  }
  if (error.code === '42501' && (named('only_class_opener') || named('own_content'))) {
    return NextResponse.json({ ok: false, code: named('own_content') ? 'own_content' : 'only_class_opener' }, { status: 403 });
  }
  if (error.code === '22023' && (named('invalid_body') || named('invalid_target'))) {
    return NextResponse.json({ ok: false, code: 'invalid_body' }, { status: 400 });
  }
  if (error.code === '22023') return NextResponse.json({ ok: false, code: 'invalid_name' }, { status: 400 });
  if (error.code === '28000') return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

/**
 * The one row a class function returns, or null. ⛔ Only id · code · name · members ever
 * leave. `id` comes from `my_class()` (0035) — the wall routes are addressed by it; the
 * create/join functions do not return it, and the client re-reads `…/mine` after either.
 */
export function classRow(data: unknown): { id: string | null; code: string; name: string; members: number | null } | null {
  const row = (Array.isArray(data) ? data[0] : data) as { id?: unknown; code?: unknown; name?: unknown; members?: unknown } | null;
  if (!row || typeof row.code !== 'string' || typeof row.name !== 'string') return null;
  return {
    id: typeof row.id === 'string' ? row.id : null,
    code: row.code.trim(),
    name: row.name,
    members: typeof row.members === 'number' ? row.members : null,
  };
}
