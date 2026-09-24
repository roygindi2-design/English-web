import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { topReplies, toWallReplies, type WallLikeRow, type WallReplyRow } from '@/lib/core/wallFeed';
import { classFailure } from '@/lib/server/classFailure';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

const NOT_FOUND = () => NextResponse.json({ ok: false, code: 'post_not_found' }, { status: 404 });

/**
 * GET /api/world/classes/[id]/wall/[postId]/replies — see docs/api-contract.md
 *
 * T-471: every reply of ONE post, most liked first (`הצג את כל N התגובות`, opened in
 * place). Under the RLS of 0034 ⇒ a post of a class the learner is ⛔ not in, or of
 * ANOTHER class than `[id]`, is 404 — ⛔ never 403.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const { id, postId } = await params;
  if (!UUID.test(id) || !UUID.test(postId)) return NOT_FOUND();

  const post = await supabase.from('class_posts').select('id').eq('id', postId).eq('class_id', id).maybeSingle();
  if (post.error) return classFailure('replies', post.error);
  if (!post.data) return NOT_FOUND();

  const replies = await supabase.from('class_replies').select('id, post_id, author_id, body_en, created_at').eq('post_id', postId);
  if (replies.error) return classFailure('replies', replies.error);
  const rows = (replies.data ?? []) as WallReplyRow[];
  const ids = rows.map((r) => r.id);
  const likes = ids.length
    ? await supabase.from('class_likes').select('user_id, post_id, reply_id').in('reply_id', ids)
    : { data: [], error: null };
  if (likes.error) return classFailure('replies', likes.error);

  return NextResponse.json({ ok: true, replies: topReplies(toWallReplies(rows, (likes.data ?? []) as WallLikeRow[], user.id)) });
}
