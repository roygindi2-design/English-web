import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseLevel } from '@/lib/core/levelSummary';
import { LEARNER_TIME_ZONE, toIsoDateInZone } from '@/lib/core/onboarding';
import { STORY_LIBRARY_LEVELS, storyLibrary, type StoryLibraryStory } from '@/lib/core/storyLibrary';
import { dayIndexFromIsoDate, pickStory } from '@/lib/core/storyPick';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';
import { MAX_LEVEL_STORIES, toStoryCandidates, type StoryRowShape } from '@/lib/supabase/stories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/world/story/library — see docs/api-contract.md  (T-510 · `D-297`ⓒ)
 *
 * Every story in the four library levels, with «read / today / new» for this learner. The
 * C-0032 guard order: ENV, then session, then the queries.
 *
 * ⛔ «today» is the SAME pick `GET /api/world/story` makes — `pickStory` over the learner's
 * own level, the day index in `LEARNER_TIME_ZONE` and the learner's `story_reads` — so the
 * card marked «הסיפור של היום» is the story the reading screen opens.
 * ⚠️ `story_reads` is a soft read here too: a history that failed to load shows every story
 * as unread, ⛔ it does not blank the library with a 503.
 */

function failure(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/story/library] ${where} read failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json(
      { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

export async function GET() {
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
  if (profile.error) return failure('profile', profile.error);
  // ⛔ No level is ⛔ not an error here: the library is still browsable, and the screen
  // opens on the first level. It only means ⛔ no story is «today».
  const level = parseLevel((profile.data as { current_level?: unknown } | null)?.current_level);

  const [rows, reads] = await Promise.all([
    supabase
      .from('stories')
      .select('id, title_en, body_en, created_at, cefr_level')
      .in('cefr_level', [...STORY_LIBRARY_LEVELS])
      .order('created_at', { ascending: true })
      .limit(MAX_LEVEL_STORIES * STORY_LIBRARY_LEVELS.length),
    supabase
      .from('story_reads')
      .select('story_id')
      .eq('user_id', user.id)
      .limit(MAX_LEVEL_STORIES * 8),
  ]);
  if (rows.error) return failure('stories', rows.error);
  if (reads.error) console.error('[api/world/story/library] reads read failed:', reads.error.message);

  const raw = (rows.data ?? []) as unknown as readonly (StoryRowShape & { cefr_level?: unknown })[];
  const stories: StoryLibraryStory[] = [];
  const candidates = toStoryCandidates(raw);
  raw.forEach((row, i) => {
    const storyLevel = parseLevel(row.cefr_level);
    const candidate = candidates[i];
    if (storyLevel !== null && candidate !== undefined) stories.push({ ...candidate, level: storyLevel });
  });

  const readStoryIds = new Set(
    ((reads.error === null ? reads.data : null) ?? [])
      .map((row) => (row as { story_id?: unknown }).story_id)
      .filter((id): id is string => typeof id === 'string'),
  );

  const dayIndex = dayIndexFromIsoDate(toIsoDateInZone(new Date(), LEARNER_TIME_ZONE));
  const today =
    level === null
      ? null
      : pickStory({ stories: stories.filter((s) => s.level === level), dayIndex, readStoryIds });

  const levels = storyLibrary({ stories, readStoryIds, todayId: today?.story.id ?? null });
  const all = levels.flatMap((l) => l.items);
  return NextResponse.json({
    ok: true,
    level,
    totals: { stories: all.length, read: all.filter((s) => s.status === 'read').length },
    levels,
  });
}
