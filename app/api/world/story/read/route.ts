import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/world/story/read — see docs/api-contract.md  (T-493 · `D-293`ⓐ)
 *
 * «סיימתי לקרוא» writes ONE row to `story_reads` (0038), and `GET /api/world/story` reads
 * those rows as the skip list of `pickStory` (T-209). ⛔ The row is the whole write: no
 * `word_progress`, no review, no score, no timing (D-053).
 *
 * The C-0032 guard order: ENV, then session, then the body. Reading the same story twice is
 * an upsert with `ignoreDuplicates` ⇒ `on conflict do nothing` ⇒ ⛔ never an error, and the
 * first `read_at` is kept.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readStoryId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const value = (body as { storyId?: unknown }).storyId;
  return typeof value === 'string' && UUID_RE.test(value) ? value : null;
}

export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const storyId = readStoryId(body);
  if (storyId === null) {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }

  const written = await supabase
    .from('story_reads')
    .upsert({ user_id: user.id, story_id: storyId }, { onConflict: 'user_id,story_id', ignoreDuplicates: true });
  if (written.error) {
    const code = (written.error as { code?: string }).code;
    // 23503 = the foreign key to `stories` ⇒ a well-formed id that is ⛔ not a story.
    if (code === '23503') {
      return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
    }
    console.error('[api/world/story/read] write failed:', written.error.message);
    if (code === '42P01' || code === 'PGRST205') {
      return NextResponse.json(
        { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
