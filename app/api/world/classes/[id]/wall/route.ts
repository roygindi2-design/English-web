import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildWallFeed, type WallLikeRow, type WallPostRow, type WallReplyRow } from '@/lib/core/wallFeed';
import { classFailure } from '@/lib/server/classFailure';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** `39 § 5` — a feed, ⛔ not an archive: the newest posts, and ⛔ no infinite loading. */
export const WALL_POSTS_MAX = 20;

const NOT_FOUND = () => NextResponse.json({ ok: false, code: 'class_not_found' }, { status: 404 });

/**
 * GET /api/world/classes/[id]/wall — see docs/api-contract.md
 *
 * T-471 · `39 § 5` · D-288: the class's posts, newest first, each with `likes` ·
 * `replyCount` · `likedByMe` · `top` (the two most-liked replies) — ⛔ never every reply.
 * Read under the RLS of 0034: a learner sees only a class they are in.
 * ⛔ A non-member gets 404, ⛔ not 403 — the route ⛔ does not confirm the class exists.
 * ⛔ No author id leaves: `byOpener` (D-288 «המורה») and `mine` are all the client needs.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NOT_FOUND();

  // RLS `classes_select_member` (0032): a class the learner is ⛔ not in reads as ⛔ no row.
  const cls = await supabase.from('classes').select('created_by').eq('id', id).maybeSingle();
  if (cls.error) return classFailure('wall', cls.error);
  const openerId = (cls.data as { created_by?: unknown } | null)?.created_by;
  if (typeof openerId !== 'string') return NOT_FOUND();

  const posts = await supabase
    .from('class_posts')
    .select('id, author_id, body_en, created_at')
    .eq('class_id', id)
    .order('created_at', { ascending: false })
    .limit(WALL_POSTS_MAX);
  if (posts.error) return classFailure('wall', posts.error);
  const postRows = (posts.data ?? []) as WallPostRow[];
  const postIds = postRows.map((p) => p.id);
  if (postIds.length === 0) return NextResponse.json({ ok: true, posts: [] });

  const replies = await supabase.from('class_replies').select('id, post_id, author_id, body_en, created_at').in('post_id', postIds);
  if (replies.error) return classFailure('wall', replies.error);
  const replyRows = (replies.data ?? []) as WallReplyRow[];

  const postLikes = await supabase.from('class_likes').select('user_id, post_id, reply_id').in('post_id', postIds);
  if (postLikes.error) return classFailure('wall', postLikes.error);
  const replyIds = replyRows.map((r) => r.id);
  const replyLikes = replyIds.length
    ? await supabase.from('class_likes').select('user_id, post_id, reply_id').in('reply_id', replyIds)
    : { data: [], error: null };
  if (replyLikes.error) return classFailure('wall', replyLikes.error);

  const likes = [...(postLikes.data ?? []), ...(replyLikes.data ?? [])] as WallLikeRow[];
  return NextResponse.json({ ok: true, posts: buildWallFeed(postRows, replyRows, likes, user.id, openerId) });
}
