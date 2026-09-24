import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { classFailure } from '@/lib/server/classFailure';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** `{postId}` XOR `{replyId}` ⇒ the one target, or null. */
export function parseTarget(body: unknown): { p_post_id: string | null; p_reply_id: string | null } | null {
  const b = body as { postId?: unknown; replyId?: unknown } | null;
  const post = typeof b?.postId === 'string' && UUID.test(b.postId) ? b.postId : null;
  const reply = typeof b?.replyId === 'string' && UUID.test(b.replyId) ? b.replyId : null;
  if ((post === null) === (reply === null)) return null;
  return { p_post_id: post, p_reply_id: reply };
}

/**
 * POST /api/world/classes/wall/like — see docs/api-contract.md
 *
 * T-472 · `39 § 5` · D-288: flips the learner's like on a post or a reply and returns
 * `{liked, likes}` — the new state and the new count. Through `toggle_like()` (0034)
 * only: a like on your own content ⇒ 403 `own_content`; a target the learner cannot see
 * ⇒ 404 `post_not_found`.
 */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const target = parseTarget(await request.json().catch(() => null));
  if (target === null) return NextResponse.json({ ok: false, code: 'post_not_found' }, { status: 404 });

  const toggled = await supabase.rpc('toggle_like', target);
  if (toggled.error) return classFailure('like', toggled.error);
  const row = (Array.isArray(toggled.data) ? toggled.data[0] : toggled.data) as { liked?: unknown; likes?: unknown } | null;
  if (typeof row?.liked !== 'boolean' || typeof row?.likes !== 'number') {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }
  return NextResponse.json({ ok: true, liked: row.liked, likes: row.likes });
}
