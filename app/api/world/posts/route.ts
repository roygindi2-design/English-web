import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkPostPayload, normaliseToken, renderDraft } from '@/lib/core/world';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * HEURISTIC ceiling on the feed read, ⛔ not a product limit and ⛔ never shown: § 4.2ה
 * says the feed is "הפוסטים של הלומד, החדש למעלה" with no paging in M1. This exists so a
 * learner with a long history cannot make one request read an unbounded table. When paging
 * lands (T-062 ⓐ) this constant becomes the page size and the response grows a cursor.
 */
const MAX_FEED_ROWS = 100;

/** The columns the feed shows, and ⛔ nothing else — a select of `*` would ship
 *  generation_run_id and needs_human_review to a screen that has no business with them. */
const FEED_COLUMNS = 'id, body_en, created_at';

/**
 * Identical in shape to app/api/world/status and app/api/world/bank, and for the same
 * reason: the raw PostgREST string goes to the log and ⛔ never into the body, because it
 * names columns and tables. A missing schema is 503 with a Hebrew sentence — ⛔ never 500,
 * ⛔ never an empty screen.
 */
function schemaAwareFailure(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/posts] ${where} failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json(
      { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

/**
 * GET — the learner's own feed, newest first.
 *
 * An empty feed is 200 with an empty array. "עוד לא כתבת" is a STATE the screen paints
 * (§ 4.2ה: מצב ריק בעל פעולה אחת), ⛔ not a 404: a 404 would tell the client the resource
 * does not exist, and the resource is the learner's own feed, which always exists.
 */
export async function GET() {
  // The C-0032 guard order, identical to tasks 3–4: ENV, then session, then the query.
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // ⛔ author_kind='learner' is not decoration: 0007 designed this table for generated rows
  // too, and the private feed shows what the LEARNER wrote (D-030). Filtering on
  // `character_id is null` instead is exactly the implicit rule 0010 exists to replace.
  const feed = await supabase
    .from('world_posts')
    .select(FEED_COLUMNS)
    .eq('user_id', user.id)
    .eq('author_kind', 'learner')
    .order('created_at', { ascending: false })
    .limit(MAX_FEED_ROWS);

  if (feed.error) return schemaAwareFailure('feed read', feed.error);

  const posts = (feed.data ?? []) as { id: string; body_en: string; created_at: string }[];

  // `total` is the size of THIS response, ⛔ not a table count: the screen's «מילים שהפקת»
  // counter is derived from the posts it holds, and a second count query here would be a
  // number the feed cannot explain.
  return NextResponse.json({ ok: true, posts, total: posts.length });
}

/**
 * POST — publish one sentence.
 *
 * The whole rule set is `checkPostPayload` in the pure layer: shape first, then the target
 * word. ⛔ There is no grammatical judgement here and there never will be (R-016) — the one
 * refusal this route can produce is "the target word is not in the draft", and it is
 * phrased as guidance.
 */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // A body that is not JSON at all is the same class of failure as a body of the wrong
  // shape, and both are answered by the pure check below — so parse defensively and hand
  // the checker `null` rather than throwing a 500 at a hand-rolled request.
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const checked = checkPostPayload(body);
  if (!checked.ok) {
    if (checked.reason === 'target_missing') {
      // The target survived the shape check before this branch can be reached, so reading it
      // back off the body is safe. The sentence is § 4.2ה verbatim — it names the next
      // action and ⛔ says nothing about the draft the learner wrote.
      const target = normaliseToken(String((body as { target: string }).target));
      return NextResponse.json(
        { ok: false, code: 'target_missing', message: `הוסף את ${target} כדי לפרסם` },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }

  // ⛔ Every column this route writes is on this object, and there is no second write
  // anywhere in the file. author_kind marks the row as the learner's forever (0010);
  // generation_run_id stays null because a learner row is never revoked and never
  // AQL-sampled; needs_human_review stays false for the same reason (R-014 governs
  // generated rows, and this is not one).
  const inserted = await supabase
    .from('world_posts')
    .insert({
      user_id: user.id,
      body_en: renderDraft(checked.payload.tokens),
      author_kind: 'learner',
      generation_run_id: null,
      character_id: null,
      needs_human_review: false,
    })
    .select(FEED_COLUMNS)
    .single();

  if (inserted.error) return schemaAwareFailure('publish', inserted.error);

  // `usedWord` is a FACT about the post — the screen renders «השתמשת ב-<usedWord>» from it.
  // ⛔ The server sends no praise and no verdict (R-016).
  return NextResponse.json(
    { ok: true, post: inserted.data, usedWord: checked.payload.target },
    { status: 201 },
  );
}
