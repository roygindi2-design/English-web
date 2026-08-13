import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  clampQueueLimit,
  excludeSeen,
  isUnknownRow,
  parseDeckName,
  selectDeck,
  toQueueCardInput,
  type QueueRow,
} from '@/lib/core/deck';
import { planDailyQueue } from '@/lib/core/queue';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * HEURISTIC — a product parameter, not evidence. It lives HERE and not in /lib/core for
 * the same reason MASTERY_CONSECUTIVE_CORRECT does in app/api/review/route.ts: no source
 * we hold fixes the number, and a constant exported from the pure layer would later be
 * cited as if that layer had derived it. `directionFor` takes it as a policy argument,
 * and this route is the caller that owns the policy.
 */
const PROMOTE_AFTER_CONSECUTIVE_CORRECT = 3;

/**
 * HEURISTIC, both of them, for exactly the same reason as the constant above: no source we
 * hold fixes either number. `NEW_CARDS_PER_DAY` is the introduction rate the brake in
 * `planDailyQueue` is allowed to spend; `SECONDS_PER_CARD` turns the learner's minutes goal
 * into a card count. ⛔ They are product parameters, ⛔ they are not evidence, and ⛔ they do
 * not move to /lib/core, where a later reader would cite them as if the pure layer had
 * derived them. `DEFAULT_DAILY_MINUTES` is the goal of a learner who never answered the
 * onboarding question — `daily_minutes` is NULL there (0004), and NULL is "did not say",
 * ⛔ never "zero minutes", which would hand `planDailyQueue` a capacity of one card.
 */
const NEW_CARDS_PER_DAY = 5;
const SECONDS_PER_CARD = 20;
const DEFAULT_DAILY_MINUTES = 10;

/**
 * The ceiling on the learner's *seen* set, and the reason it exists: new words are chosen by
 * excluding what the learner has already met, and that exclusion is only correct if the seen
 * list is complete. A truncated list would re-introduce a word the learner already knows as
 * if it were new. So above this many progress rows the route stops introducing new words
 * rather than introducing a wrong one — reviews still flow, and the skip is logged.
 * ⚠️ Known limitation, recorded as tech debt in plan/30-architecture.md: the honest fix is a
 * server-side anti-join, which PostgREST cannot express from here.
 */
const MAX_SEEN_ROWS = 1000;

/**
 * A hard ceiling on rows read, ⛔ not the learner's `limit`. `limit` decides how many cards
 * travel; this decides how much we are willing to pull before the pure layer orders them.
 * Without it a learner with thousands of progress rows would pay for the whole history on
 * every queue open, to show at most 50 cards.
 */
const MAX_QUEUE_ROWS = 200;

/**
 * One query for the whole deck. `words!inner` is deliberate: a progress row whose word was
 * deleted is not a card, and an outer join would surface it as a row with nothing to show.
 * RLS on `senses` (0002/0003) already drops `translation_confidence = 'low'` server-side —
 * D-013 is enforced there, ⛔ and is not restated here as a second, divergent rule.
 */
const PROGRESS_SELECT =
  'word_id, attempts, correct_attempts, repetition, consecutive_correct_recognition, next_review_at, ' +
  'words!inner(headword, cefr_profile_band, ' +
  'senses(sense_index, translation_he, needs_human_review, sense_examples(kind, text_en)))';

/**
 * The new-word side of the same shape. `senses!inner` here and not on `words`: a headword
 * with no sense cannot become a card, and an outer join would spend one of the day's five
 * introduction slots on a row that `toNewQueueRow` then drops.
 */
const WORDS_SELECT =
  'id, headword, cefr_profile_band, ' +
  'senses!inner(sense_index, translation_he, needs_human_review, sense_examples(kind, text_en))';

type ExampleRow = { kind: string | null; text_en: string | null };

type SenseRow = {
  sense_index: number | null;
  translation_he: string | null;
  needs_human_review: boolean | null;
  sense_examples: ExampleRow[] | null;
};

type WordRow = {
  headword: string | null;
  cefr_profile_band: string | null;
  senses: SenseRow[] | null;
};

type ProgressJoinRow = {
  word_id: string;
  attempts: number | null;
  correct_attempts: number | null;
  repetition: number | null;
  consecutive_correct_recognition: number | null;
  next_review_at: string | null;
  words: WordRow | WordRow[] | null;
};

/** PostgREST returns an embedded many-to-one as an object on some paths and as a
 *  single-element array on others. Normalising here keeps the shape question out of
 *  the flattening logic below. */
function firstOf(value: WordRow | WordRow[] | null): WordRow | null {
  if (value === null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** `null` = never scheduled, ⛔ which is not the same as "not due". The pure layer sorts
 *  those to the end of their band rather than treating them as due at epoch 0. */
function epochMs(value: string | null): number | null {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * D-021 — the row is a SENSE, not a word, so a word with three senses still yields one
 * card. The chosen one is the lowest `sense_index` that a card can actually be built
 * from: `buildCard` throws on empty `translationHe`, and a 500 on a malformed card is a
 * bug, ⛔ not a guard. A sense with no usable translation is skipped, and a word with no
 * usable sense at all drops out of the queue entirely.
 */
function pickSense(word: WordRow): SenseRow | null {
  const usable = (word.senses ?? []).filter((sense) => text(sense.translation_he) !== '');
  if (usable.length === 0) return null;
  const ordered = [...usable].sort(
    (a, b) => (a.sense_index ?? Number.MAX_SAFE_INTEGER) - (b.sense_index ?? Number.MAX_SAFE_INTEGER),
  );
  return ordered[0] ?? null;
}

function exampleOf(sense: SenseRow, kind: 'supportive' | 'neutral'): string {
  const hit = (sense.sense_examples ?? []).find((example) => example.kind === kind);
  return text(hit?.text_en);
}

/** The join shape → the pure layer's shape. `null` means "this row cannot become a card",
 *  and the caller drops it silently: a missing sentence is a degraded card, but a missing
 *  headword or translation is no card at all. */
function toQueueRow(row: ProgressJoinRow): QueueRow | null {
  const word = firstOf(row.words);
  if (word === null) return null;

  const headword = text(word.headword);
  if (headword === '') return null;

  const sense = pickSense(word);
  if (sense === null) return null;

  return {
    wordId: row.word_id,
    headword,
    translationHe: text(sense.translation_he),
    examples: {
      supportive: exampleOf(sense, 'supportive'),
      neutral: exampleOf(sense, 'neutral'),
    },
    needsHumanReview: sense.needs_human_review === true,
    cefrProfileBand: word.cefr_profile_band ?? null,
    nextReviewAtMs: epochMs(row.next_review_at),
    attempts: row.attempts ?? 0,
    repetition: row.repetition ?? 0,
    consecutiveCorrectRecognition: row.consecutive_correct_recognition ?? 0,
  };
}

type NewWordRow = WordRow & { id: string };

/**
 * A word the learner has never met, in the same `QueueRow` shape the progress rows arrive in
 * — so the pure layer sorts, cuts and serialises both through one path. The four progress
 * fields are literals and ⛔ not defaults borrowed from a missing row: a word with no
 * progress row HAS no attempts, no repetition, no streak and no review date, and
 * `attempts: 0` is exactly what makes `toQueueCardInput` mark it a first encounter.
 */
function toNewQueueRow(row: NewWordRow): QueueRow | null {
  const headword = text(row.headword);
  if (headword === '') return null;

  const sense = pickSense(row);
  if (sense === null) return null;

  return {
    wordId: row.id,
    headword,
    translationHe: text(sense.translation_he),
    examples: {
      supportive: exampleOf(sense, 'supportive'),
      neutral: exampleOf(sense, 'neutral'),
    },
    needsHumanReview: sense.needs_human_review === true,
    cefrProfileBand: row.cefr_profile_band ?? null,
    nextReviewAtMs: null,
    attempts: 0,
    repetition: 0,
    consecutiveCorrectRecognition: 0,
  };
}

type RouteClient = ReturnType<typeof createRouteClient>;

/**
 * The learner's daily goal, or the default when they never answered. A failed read is ⛔ not
 * an error the learner should see: the goal only sizes today's dose, and a queue sized by
 * the default is a working queue, while a 503 here would blank a screen over a missing
 * preference.
 */
async function readDailyMinutes(supabase: RouteClient, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('daily_minutes')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[api/study/queue] profile read failed:', error.message);
    return DEFAULT_DAILY_MINUTES;
  }

  const minutes = (data as { daily_minutes?: number | null } | null)?.daily_minutes;
  return typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0
    ? minutes
    : DEFAULT_DAILY_MINUTES;
}

/**
 * Today's introductions. Every failure path returns an EMPTY LIST and ⛔ never throws: a
 * learner who cannot be given new words still has reviews, and half a queue beats an error
 * screen. The exclusion runs in the pure layer on candidates already fetched — ⛔ never as a
 * `not.in` list in the query, whose URL grows with the learner's history until it breaks
 * silently mid-year.
 */
async function loadNewWords(
  supabase: RouteClient,
  userId: string,
  wanted: number,
): Promise<QueueRow[]> {
  const { data: seenData, error: seenError } = await supabase
    .from('word_progress')
    .select('word_id')
    .eq('user_id', userId)
    .limit(MAX_SEEN_ROWS);

  if (seenError) {
    console.error('[api/study/queue] seen-word read failed:', seenError.message);
    return [];
  }

  const seenIds = ((seenData ?? []) as { word_id: string }[]).map((row) => row.word_id);
  if (seenIds.length >= MAX_SEEN_ROWS) {
    // The list is at the ceiling, so it may be incomplete, so exclusion may be wrong. Skip
    // rather than risk re-introducing a known word as new.
    console.error('[api/study/queue] seen-word ceiling reached; new words skipped this call');
    return [];
  }

  const { data, error: newWordsError } = await supabase
    .from('words')
    .select(WORDS_SELECT)
    .order('cefr_profile_band', { ascending: true, nullsFirst: false })
    .order('ngsl_rank', { ascending: true, nullsFirst: false })
    .limit(wanted + seenIds.length);

  if (newWordsError) {
    console.error('[api/study/queue] new-word read failed:', newWordsError.message);
    return [];
  }

  const candidates = ((data ?? []) as unknown as NewWordRow[])
    .map(toNewQueueRow)
    .filter((row): row is QueueRow => row !== null);

  // ⛔ Not re-sorted here: the query already ordered them by band and then by NGSL rank, and
  // frequency is the introduction order. Re-running the queue sort would replace rank with
  // the alphabetical tie-break, which is not a teaching order.
  return excludeSeen(candidates, seenIds).slice(0, wanted);
}

/** GET /api/study/queue — see docs/api-contract.md */
export async function GET(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Session BEFORE any query parameter is read (the C-0032 pattern): an unauthenticated
  // caller learns nothing about which decks or limits this endpoint accepts.
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const deck = parseDeckName(params.get('deck'));
  // An unknown deck name is a 400, ⛔ never a silent fallback to a deck the learner did
  // not ask for — `sentences` is blocked by D-035 and must read as blocked, not as empty.
  if (deck === null) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  const limit = clampQueueLimit(params.get('limit'));

  // F-034: the order comes BEFORE the ceiling, because Postgres does not promise row order
  // without one — a `limit(200)` with no `order` returns an arbitrary 200 of the learner's
  // rows, and everything the pure layer does afterwards would be a correct sort of a wrong
  // population. Most-overdue-first is the honest cut: above 200 rows the learner sees the
  // words that have waited longest, and `word_id` makes two identical requests cut the same
  // rows instead of reshuffling between refreshes.
  let query = supabase
    .from('word_progress')
    .select(PROGRESS_SELECT)
    .eq('user_id', user.id)
    .order('next_review_at', { ascending: true, nullsFirst: false })
    .order('word_id', { ascending: true })
    .limit(MAX_QUEUE_ROWS);

  // The ONLY clock reading in this flow, and it applies to one deck. «לא ידעתי» is a
  // count predicate (`attempts > 0 AND repetition = 0`), ⛔ not a date one — filtering it
  // by `next_review_at` would hide exactly the words the learner just failed.
  if (deck === 'due') {
    query = query.lte('next_review_at', new Date().toISOString());
  }

  // F-034, the other half: the same predicate `isUnknownRow` defines, pushed into SQL so the
  // 200-row ceiling cuts the «לא ידעתי» population and ⛔ not the whole history, of which the
  // failed words might be rows 400-430. The pure filter below stays as the single definition
  // of the deck; this is the same rule stated to the database.
  if (deck === 'unknown') {
    query = query.gt('attempts', 0).eq('repetition', 0);
  }

  const { data, error } = await query;

  if (error) {
    // The raw string goes to the server log and ⛔ never into the response body — same
    // requirement as T-053: a PostgREST message names columns and tables.
    console.error('[api/study/queue] query failed:', error.message);
    const code = (error as { code?: string }).code;
    if (code === '42P01' || code === 'PGRST205') {
      return NextResponse.json(
        { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  const rows = ((data ?? []) as unknown as ProgressJoinRow[])
    .map(toQueueRow)
    .filter((row): row is QueueRow => row !== null);

  // `total` is counted AFTER the deck predicate and BEFORE the cut, so the tab counter can
  // say "12 waiting" while the screen holds 20 cards at a time.
  const filtered = deck === 'unknown' ? rows.filter(isUnknownRow) : rows;

  // «לא ידעתי» is a deck of words the learner has already met, so no introduction happens
  // here — and an empty queue is a 200 with zero cards, ⛔ not a 404 and ⛔ not a 503. "You
  // are done for today" is a state of the product; an error status would make the finished
  // learner look like a broken server.
  if (deck === 'unknown') {
    const practiceCards = selectDeck(filtered, deck, limit).map((row) =>
      toQueueCardInput(row, PROMOTE_AFTER_CONSECUTIVE_CORRECT),
    );
    return NextResponse.json({ ok: true, deck, total: filtered.length, cards: practiceCards });
  }

  // deck === 'due'. ⚠️ Without what follows, `deck=due` is empty forever for every new
  // learner: `word_progress` has no row until a first answer, so nothing can be "due", and
  // the queue would tell a learner with 0 cards answered that they are done for today.
  const plan = planDailyQueue({
    dueReviewCount: filtered.length,
    newCardsPerDay: NEW_CARDS_PER_DAY,
    dailyMinutesGoal: await readDailyMinutes(supabase, user.id),
    secondsPerCard: SECONDS_PER_CARD,
  });

  const reviews = selectDeck(filtered, deck, plan.reviewsToShow);
  const introductions =
    plan.newCardsToShow > 0 ? await loadNewWords(supabase, user.id, plan.newCardsToShow) : [];

  // Reviews first, introductions after: a word already owed is worth more than a word never
  // met, and the brake in `planDailyQueue` has already decided how many of each the day
  // holds. ⛔ The two lists are ⛔ not re-sorted together — that would let an A1 introduction
  // jump ahead of a B2 review the learner is late on.
  const today = [...reviews, ...introductions];
  const cards = today
    .slice(0, limit)
    .map((row) => toQueueCardInput(row, PROMOTE_AFTER_CONSECUTIVE_CORRECT));

  // `total` is today's queue — reviews the day's capacity can absorb plus the introductions
  // — counted before the `limit` cut. Reviews deferred past capacity are ⛔ not counted: they
  // are tomorrow's, and counting them would tell the learner they are behind on work the
  // brake deliberately withheld.
  return NextResponse.json({ ok: true, deck, total: today.length, cards });
}
