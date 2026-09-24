import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildWallFeed, toWallPictureKey, wallSentence, type WallLikeRow, type WallPostRow, type WallReplyRow } from '@/lib/core/wallFeed';
import { classFailure } from '@/lib/server/classFailure';
import { fromKeyboard, parseWords } from '@/lib/server/keyboardSentence';
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
    .select('id, author_id, body_en, created_at, picture_key')
    .eq('class_id', id)
    .order('created_at', { ascending: false })
    .limit(WALL_POSTS_MAX);
  if (posts.error) return classFailure('wall', posts.error);
  const postRows = (posts.data ?? []) as WallPostRow[];
  const postIds = postRows.map((p) => p.id);
  const amOpener = openerId === user.id;
  if (postIds.length === 0) return NextResponse.json({ ok: true, amOpener, posts: [] });

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
  return NextResponse.json({ ok: true, amOpener, posts: buildWallFeed(postRows, replyRows, likes, user.id, openerId) });
}

/**
 * The keyboard's reach on the wall. A class carries ⛔ no level, so the whole tree
 * (A1–B2) is the fence: what matters here is that the sentence came FROM the keyboard.
 */
const WALL_LEVEL = 'B2' as const;

/**
 * POST /api/world/classes/[id]/wall — see docs/api-contract.md
 *
 * T-472 · `39 § 1` · D-288: the class opener posts a question. 🔴 The body is ⛔ not free
 * text: `{words}` must be a path the block keyboard can compose that ends where an
 * observed sentence ended ⇒ otherwise 422 `not_from_keyboard`. The same parser and tree
 * as `…/messages/[id]/answer` (`lib/server/keyboardSentence.ts`).
 * Written only through `post_question()` (0034): a member who did not open the class ⇒
 * 403 `only_class_opener`.
 * T-485 · D-291: an optional `pictureKey` from the closed gallery (`WALL_PICTURE_KEYS`) —
 * a key outside it ⇒ 400 `invalid_picture` ⛔ BEFORE the question is written; a valid one is
 * set through `set_post_picture()` (0039) right after. That second call failing ⛔ does not
 * unwrite the question ⇒ the answer is still `ok`, with `pictureKey: null`, so the client
 * ⛔ never retries a question that already landed.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NOT_FOUND();
  const raw = (await request.json().catch(() => null)) as { pictureKey?: unknown } | null;
  const words = parseWords(raw);
  if (words === null || !fromKeyboard(words, WALL_LEVEL)) {
    return NextResponse.json({ ok: false, code: 'not_from_keyboard' }, { status: 422 });
  }
  const askedPicture = raw?.pictureKey ?? null;
  const pictureKey = toWallPictureKey(askedPicture);
  if (askedPicture !== null && !pictureKey) {
    return NextResponse.json({ ok: false, code: 'invalid_picture' }, { status: 400 });
  }

  const posted = await supabase.rpc('post_question', { p_class_id: id, p_body: wallSentence(words, 'question') });
  if (posted.error) return classFailure('post', posted.error);
  const row = (Array.isArray(posted.data) ? posted.data[0] : posted.data) as { id?: string; created_at?: string } | null;
  let pictured: string | null = null;
  if (pictureKey && row?.id) {
    const set = await supabase.rpc('set_post_picture', { p_post_id: row.id, p_key: pictureKey });
    if (set.error) console.error('[api/world/classes] picture failed:', set.error.message);
    else pictured = pictureKey;
  }
  return NextResponse.json({ ok: true, id: row?.id ?? null, createdAt: row?.created_at ?? null, bodyEn: wallSentence(words, 'question'), pictureKey: pictured });
}
