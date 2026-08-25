import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseLevel } from '@/lib/core/levelSummary';
import { LEARNER_TIME_ZONE, toIsoDateInZone } from '@/lib/core/onboarding';
import { STORIES_PER_LEVEL, storyLemma } from '@/lib/core/storyGate';
import { dayIndexFromIsoDate, pickStory } from '@/lib/core/storyPick';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';
import {
  MAX_GLOSS_ROWS,
  MAX_LEVEL_STORIES,
  toGlossRows,
  toStoryCandidates,
  type GlossRow,
  type RawGlossRow,
  type StoryRowShape,
} from '@/lib/supabase/stories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/world/story — see docs/api-contract.md
 *
 * The C-0032 guard order, identical to app/api/world/status/route.ts: ENV, then session,
 * then the query. An unauthenticated caller learns nothing about the shape of the endpoint.
 *
 * ⛔ **Nothing in this file is random, and that is deliberate (T-185ⓐ):** the pick is the
 * pure layer's job (`lib/core/storyPick.ts`), and a refresh mid-read must return the SAME
 * story. The only clock reading is `new Date()` here, handed straight down as an ISO date.
 * ⚠️ A source scan in route.test.ts fails this file if a randomiser is ever added.
 */

/**
 * ⚠️ Level filtering for the gloss bank is `words.cefr_profile_band` (D-034) — ⛔ never the
 * per-sense level column, which is a different axis entirely. `stories.cefr_level` is a
 * THIRD, unrelated column — `0018_stories.sql` says so in its own comment — and it is the
 * story's own level, ⛔ not the word's profile band.
 */
const GLOSS_SELECT =
  'id, headword, pos, senses(sense_index, translation_he, translation_confidence)';

function schemaAwareFailure(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/story] ${where} read failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json(
      { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

export async function GET(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const profile = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', user.id)
    .maybeSingle();
  if (profile.error) return schemaAwareFailure('profile', profile.error);

  // ⛔ No silent fall back to A1 (D-037). «Has not chosen» is a real state and the
  // screen sends the learner to the level scan, ⛔ not to a blank page.
  const level = parseLevel((profile.data as { current_level?: unknown } | null)?.current_level);
  if (level === null) return NextResponse.json({ ok: false, code: 'no_level' });

  const rows = await supabase
    .from('stories')
    .select('id, title_en, body_en, created_at')
    .eq('cefr_level', level)
    .order('created_at', { ascending: true })
    .limit(MAX_LEVEL_STORIES);
  if (rows.error) return schemaAwareFailure('stories', rows.error);

  const stories = toStoryCandidates((rows.data ?? []) as unknown as readonly StoryRowShape[]);
  const readStoryIds = new Set(
    (new URL(request.url).searchParams.get('read') ?? '').split(',').filter(Boolean),
  );
  const dayIndex = dayIndexFromIsoDate(toIsoDateInZone(new Date(), LEARNER_TIME_ZONE));
  const picked = pickStory({ stories, dayIndex, readStoryIds });

  // ⛔ 200, ⛔ not 503 — F-040 / C-0255. An empty level is a screen state, ⛔ not an outage:
  // `<TabBar>` locks the world tab on any answer that is not ok:true, and a 503 here would
  // blank the tab for every learner until Roy ran a seed.
  if (!picked) {
    return NextResponse.json({
      ok: false,
      code: 'no_stories',
      stories: { atLevel: stories.length, required: STORIES_PER_LEVEL },
    });
  }

  const [glossResult, progressResult] = await Promise.all([
    supabase.from('words').select(GLOSS_SELECT).eq('cefr_profile_band', level).limit(MAX_GLOSS_ROWS),
    supabase
      .from('word_progress')
      .select('words!inner(headword)')
      .eq('user_id', user.id)
      .limit(MAX_GLOSS_ROWS),
  ]);
  if (glossResult.error) return schemaAwareFailure('glosses', glossResult.error);
  if (progressResult.error) return schemaAwareFailure('progress', progressResult.error);

  const glossRows = toGlossRows((glossResult.data ?? []) as unknown as readonly RawGlossRow[]);
  const byHeadword = new Map<string, GlossRow>();
  for (const g of glossRows) if (!byHeadword.has(g.headword)) byHeadword.set(g.headword, g);

  const knownLemmas = knownHeadwords(progressResult.data, byHeadword);

  // ⛔ The gloss map is keyed on the LEMMA the paragraph will resolve to, so the pure
  // segment builder in Task 4 needs ⛔ no second lemmatiser and ⛔ no second vocabulary.
  const allowed = new Set(byHeadword.keys());
  const glosses: Record<string, { translationHe: string; posHe: string; wordId: string }> = {};
  let newWords = 0;
  let alreadyKnown = 0;
  const seen = new Set<string>();
  for (const token of picked.story.bodyEn.split(/\s+/)) {
    const lemma = storyLemma(token, allowed);
    if (lemma === null || seen.has(lemma)) continue;
    seen.add(lemma);
    const gloss = byHeadword.get(lemma);
    if (gloss === undefined) continue;
    glosses[lemma] = {
      translationHe: gloss.translationHe,
      posHe: gloss.posHe,
      wordId: gloss.wordId,
    };
    if (knownLemmas.has(lemma)) alreadyKnown += 1;
    else newWords += 1;
  }

  return NextResponse.json({
    ok: true,
    story: { id: picked.story.id, titleEn: picked.story.titleEn, bodyEn: picked.story.bodyEn },
    index: picked.index,
    total: picked.total,
    level,
    glosses,
    knownLemmas: [...knownLemmas].sort(),
    counts: { newWords, alreadyKnown },
    stories: { atLevel: stories.length, required: STORIES_PER_LEVEL },
  });
}

/**
 * A progress row whose word was deleted is ⛔ not a word the learner knows — the same
 * `words!inner` reasoning as app/api/world/status/route.ts. Only headwords that actually
 * carry a gloss count, so «ידעתי» can ⛔ never mark a word the screen cannot explain.
 */
function knownHeadwords(
  data: unknown,
  byHeadword: ReadonlyMap<string, GlossRow>,
): ReadonlySet<string> {
  const out = new Set<string>();
  const rows = Array.isArray(data) ? data : [];
  for (const row of rows as readonly { words?: unknown }[]) {
    const joined = row.words;
    const list = Array.isArray(joined) ? joined : joined === null || joined === undefined ? [] : [joined];
    for (const w of list as readonly { headword?: unknown }[]) {
      if (typeof w.headword !== 'string') continue;
      const headword = w.headword.trim().toLowerCase();
      if (headword !== '' && byHeadword.has(headword)) out.add(headword);
    }
  }
  return out;
}
