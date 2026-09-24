import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildStoryChain, type StoryLineRow } from '@/lib/core/storyChain';
import { wallSentence } from '@/lib/core/wallFeed';
import { classFailure } from '@/lib/server/classFailure';
import { fromKeyboard, parseWords } from '@/lib/server/keyboardSentence';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** The newest lines of a long chain; read back oldest-first. The LAST line decides the turn, so ⛔ never the oldest N. */
export const STORY_LINES_MAX = 200;
/** A class carries ⛔ no level ⇒ the whole tree is the fence, as on the wall. */
const STORY_LEVEL = 'B2' as const;

const NOT_FOUND = () => NextResponse.json({ ok: false, code: 'class_not_found' }, { status: 404 });

type Session =
  | { readonly fail: NextResponse }
  | { readonly supabase: ReturnType<typeof createRouteClient>; readonly user: { readonly id: string } };

async function session(): Promise<Session> {
  const env = readSupabaseEnv();
  if (!env) return { fail: NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 }) };
  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { fail: NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 }) };
  return { supabase, user };
}

/**
 * GET /api/world/classes/[id]/story — see docs/api-contract.md
 *
 * T-478 · `39 § 6` · D-290: the class's story chain, OLDEST first (a story is read from
 * its beginning — ⛔ the reverse of the wall), and `myTurn`: the last line is ⛔ not the
 * learner's. Read under RLS (0038): ⛔ a non-member gets 404, ⛔ not 403. ⛔ No author id leaves.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const s = await session();
  if ('fail' in s) return s.fail;
  const { supabase, user } = s;

  const { id } = await params;
  if (!UUID.test(id)) return NOT_FOUND();

  const cls = await supabase.from('classes').select('created_by').eq('id', id).maybeSingle();
  if (cls.error) return classFailure('story', cls.error);
  const openerId = (cls.data as { created_by?: unknown } | null)?.created_by;
  if (typeof openerId !== 'string') return NOT_FOUND();

  const rows = await supabase
    .from('class_story_lines')
    .select('id, author_id, body_en, created_at')
    .eq('class_id', id)
    .order('created_at', { ascending: false })
    .limit(STORY_LINES_MAX);
  if (rows.error) return classFailure('story', rows.error);

  const chain = buildStoryChain((rows.data ?? []) as StoryLineRow[], user.id, openerId);
  return NextResponse.json({ ok: true, amOpener: openerId === user.id, lines: chain.lines, myTurn: chain.myTurn });
}

/**
 * POST /api/world/classes/[id]/story — see docs/api-contract.md
 *
 * T-478 · `39 § 1` · D-290: the learner adds ONE sentence, composed on the block keyboard
 * — `{words}`, the same parser and tree as the wall (`lib/server/keyboardSentence.ts`,
 * ⛔ no second parser). Written only through `add_story_line()` (0038), which holds the
 * turn rule: the last line already theirs ⇒ 409 `not_your_turn`.
 * 🔴 `myTurn: false` in the answer is ⛔ not a guess: the line just saved IS the last line,
 * so the turn has passed — ⛔ never computed from a read taken before the insert.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const s = await session();
  if ('fail' in s) return s.fail;
  const { supabase } = s;

  const { id } = await params;
  if (!UUID.test(id)) return NOT_FOUND();
  const words = parseWords(await request.json().catch(() => null));
  if (words === null || !fromKeyboard(words, STORY_LEVEL)) {
    return NextResponse.json({ ok: false, code: 'not_from_keyboard' }, { status: 422 });
  }

  const bodyEn = wallSentence(words, 'reply');
  const added = await supabase.rpc('add_story_line', { p_class_id: id, p_body: bodyEn });
  if (added.error) return classFailure('story', added.error);
  const row = (Array.isArray(added.data) ? added.data[0] : added.data) as { id?: string; created_at?: string } | null;
  return NextResponse.json({ ok: true, id: row?.id ?? null, createdAt: row?.created_at ?? null, bodyEn, myTurn: false });
}
