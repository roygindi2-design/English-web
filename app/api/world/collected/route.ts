import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/world/collected — see docs/api-contract.md  (T-495 · `D-293`ⓒ)
 *
 * A word the learner TAPPED in a story (one they did ⛔ not already know) enters the
 * collection with `source = 'story'` — the story's counterpart of «a word that knocked you
 * down in battle». ⛔ One row, ⛔ nothing else: no progress, no review, no counters (D-052 ·
 * D-053). A word already in the collection keeps its row AND its first source ⇒ the write is
 * an upsert with `ignoreDuplicates` ⇒ `on conflict do nothing`.
 *
 * The C-0032 guard order: ENV, then session, then the body.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readWordId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const value = (body as { wordId?: unknown }).wordId;
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
  const wordId = readWordId(body);
  if (wordId === null) {
    return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  }

  const written = await supabase
    .from('arcade_collected_words')
    .upsert(
      { user_id: user.id, word_id: wordId, source: 'story' },
      { onConflict: 'user_id,word_id', ignoreDuplicates: true },
    );
  if (written.error) {
    const code = (written.error as { code?: string }).code;
    // 23503 = the foreign key to `words` ⇒ a well-formed id that is ⛔ not a word.
    if (code === '23503') {
      return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
    }
    console.error('[api/world/collected] write failed:', written.error.message);
    if (code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204') {
      return NextResponse.json(
        { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
