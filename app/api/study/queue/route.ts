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
import {
  buildSentenceItems,
  type SentenceCandidate,
  type SentenceItem,
} from '@/lib/core/sentenceItem';
import { parseLevel, summarizeLevel, type ProgressFacts } from '@/lib/core/levelSummary';
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
  'word_id, attempts, correct_attempts, repetition, consecutive_correct_recognition, next_review_at, interval_days, ' +
  // `T-393` — `self_marked_known` נבחר מפני ש-`classifyProgress` (ההגדרה היחידה של
  // «לא ידעתי») קורא אותו. בלעדיו `QueueRow` ⛔ לא נשא את השדה, ⇒ הפרדיקט כאן ⛔ לא יכול
  // היה להיות אותו פרדיקט שהמונה שמעל המסך משתמש בו. ⛔ זו ⛔ אינה ספירה שנייה ב-SQL.
  'self_marked_known, ' +
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

/**
 * `T-411` · `F-277` — the level deck's own projection: `WORDS_SELECT` plus the half of the
 * ordering key the cursor has to store. ⛔ A separate constant and ⛔ not a column added to
 * `WORDS_SELECT`, because `loadNewWords` shares that one and ⛔ does not read a rank — a column
 * nothing reads reads as a filter that is missing (the same reason `SENTENCES_SELECT` gives for
 * leaving `translation_confidence` out).
 */
const LEVEL_SELECT = `ngsl_rank, ${WORDS_SELECT}`;

/**
 * T-165ⓑ ⓓ ⓔ — the sentences deck. Three `!inner` joins, and each one drops a row that
 * could ⛔ not become an item anyway: a word with no sense, a sense with no stem, a sense
 * with no distractor. An outer join here would return rows the pure layer then discards,
 * inside a 200-row ceiling — i.e. it would spend the ceiling on rows that show nothing.
 *
 * ⛔ **`translation_confidence` is ⛔ not selected and ⛔ not filtered here.** D-013 is
 * enforced in RLS (`0003a_low_confidence_is_visible.sql:38-49` — both `sense_items` and
 * `sense_distractors` are gated on `translation_confidence <> 'low'`), and a second copy of
 * that rule in this file is a second rule that can drift. ⚠️ This is a deliberate deviation
 * from the plan's quoted `SENTENCES_SELECT`, which listed the column: selecting a column
 * nothing reads reads as a filter that is missing. Recorded under `RULES § 0.22`.
 *
 * ⛔ **`senses.cefr_level` appears nowhere** — the band is `words.cefr_profile_band` (D-034),
 * the same column `deck=level` uses, and `queue/route.test.ts` scans this file for it by name.
 */
const SENTENCES_SELECT =
  'id, headword, cefr_profile_band, ' +
  // T-066 · D-156 ⓒ — the back of the card: `translation_he` and the `neutral` example ride
  // the sense the stems already come from. ⛔ No new column, ⛔ no fourth join.
  'senses!inner(sense_index, translation_he, sense_examples(kind, text_en), ' +
  'sense_items!inner(item_index, stem), ' +
  'sense_distractors!inner(distractor, relation_type))';

type ExampleRow = { kind: string | null; text_en: string | null };

type SenseItemRow = { item_index: number | null; stem: string | null };
type SenseDistractorRow = { distractor: string | null; relation_type: string | null };
type SentenceSenseRow = {
  sense_index?: number | null;
  translation_he?: string | null;
  sense_examples?: ExampleRow[] | null;
  sense_items?: SenseItemRow[] | null;
  sense_distractors?: SenseDistractorRow[] | null;
};
type SentenceWordRow = {
  id: string | null;
  headword: string | null;
  cefr_profile_band: string | null;
  senses?: SentenceSenseRow[] | null;
};

/**
 * Flattens one PostgREST row into the shape the pure layer takes. Every sense of the word
 * contributes its stems and its distractors — the deck is a word-level deck (the band lives
 * on `words`), so two senses of the same headword are two supplies of stems for the same
 * answer, ⛔ not two different answers.
 *
 * `null` ⇒ the row carried nothing usable and is dropped here, ⛔ never rendered as an
 * empty card.
 */
function toSentenceCandidate(row: SentenceWordRow): SentenceCandidate | null {
  const wordId = row.id;
  const headword = row.headword;
  if (typeof wordId !== 'string' || typeof headword !== 'string' || headword.trim() === '') {
    return null;
  }
  const stems: { itemIndex: number; stem: string }[] = [];
  const distractors: { text: string; relationType: string }[] = [];
  for (const sense of row.senses ?? []) {
    for (const item of sense.sense_items ?? []) {
      if (typeof item.stem !== 'string' || typeof item.item_index !== 'number') continue;
      stems.push({ itemIndex: item.item_index, stem: item.stem });
    }
    for (const d of sense.sense_distractors ?? []) {
      if (typeof d.distractor !== 'string' || typeof d.relation_type !== 'string') continue;
      distractors.push({ text: d.distractor, relationType: d.relation_type });
    }
  }
  if (stems.length === 0) return null;
  // T-066 · D-156 ⓒ — the back reads the FIRST sense (lowest `sense_index`) that carries a
  // translation, the same rule `pickSense` applies to the word decks. A word none of whose
  // senses has a translation is ⛔ no card: the back would be a sentence with no meaning.
  // ⛔ A scan, ⛔ not a second `.sort(`: `queue/route.test.ts` pins the file to ONE sort
  // (the sense pick, D-021) so that queue ORDER can never be duplicated here (D-034).
  let backSense: SentenceSenseRow | undefined;
  for (const sense of row.senses ?? []) {
    if (typeof sense.translation_he !== 'string' || sense.translation_he.trim() === '') continue;
    const index = sense.sense_index ?? Number.MAX_SAFE_INTEGER;
    if (backSense === undefined || index < (backSense.sense_index ?? Number.MAX_SAFE_INTEGER)) {
      backSense = sense;
    }
  }
  if (backSense === undefined) return null;
  const neutral = (backSense.sense_examples ?? []).find((example) => example.kind === 'neutral');
  const exampleNeutral =
    typeof neutral?.text_en === 'string' && neutral.text_en.trim() !== '' ? neutral.text_en.trim() : null;
  return {
    wordId,
    headword,
    translationHe: (backSense.translation_he ?? '').trim(),
    exampleNeutral,
    stems,
    distractors,
    cefrProfileBand: row.cefr_profile_band,
  };
}

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
  interval_days: number | null;
  self_marked_known: boolean | null;
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
    // ⛔ `?? 0` ⛔ ואינו ניחוש: העמודה `not null default 0`, ולכן null כאן פירושו
    // שהשורה הגיעה משאילתה שלא ביקשה אותה — ואפס הוא בדיוק «טרם תוזמן».
    intervalDays: row.interval_days ?? 0,
    attempts: row.attempts ?? 0,
    repetition: row.repetition ?? 0,
    // `=== true` ⛔ ולא `?? false`: העמודה `not null default false`, ⇒ null כאן פירושו
    // שהשורה הגיעה משאילתה שלא ביקשה אותה — ו«⛔ לא סומן» הוא בדיוק מה שהיא אומרת.
    selfMarkedKnown: row.self_marked_known === true,
    consecutiveCorrectRecognition: row.consecutive_correct_recognition ?? 0,
  };
}

type NewWordRow = WordRow & { id: string };

type LevelWordRow = NewWordRow & { ngsl_rank: number | null };

/**
 * `T-411` — the learner's place in one band: the ordering key of the last word SERVED to
 * them. ⛔ Both halves, ⛔ never the rank alone — see `loadLevelWords` for the measurement.
 */
type LevelCursor = { readonly lastNgslRank: number | null; readonly lastWordId: string };

/** One page of the level deck, plus the ranks the page's rows carried — the cursor has to be
 *  advanced to the ordering key of the last card ACTUALLY SENT, and `QueueRow` has no rank. */
type LevelPage = { readonly rows: QueueRow[]; readonly rankOf: ReadonlyMap<string, number | null> };

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
    intervalDays: 0,
    attempts: 0,
    repetition: 0,
    // `T-393` — ליטרל, ⛔ ולא ברירת מחדל שאולה משורה חסרה: מילה בלי שורת התקדמות
    // ⛔ לא סומנה «ידעתי» ביד, בדיוק כשם שאין לה ניסיונות ואין לה חזרות.
    selfMarkedKnown: false,
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

/**
 * `T-411` · `F-277` · `D-266` — where this learner stopped in this band, or `null` for a
 * learner who has never opened it.
 *
 * ⛔ **Every failure path returns `null`, ⛔ never throws and ⛔ never 503s.** A bookmark that
 * could not be read is a learner who starts the level again — annoying, and recoverable in one
 * open. A learner who gets an error screen instead of cards has lost the whole deck. ⇒ the
 * cards are the point; the bookmark is not worth a 503.
 */
async function readLevelCursor(
  supabase: RouteClient,
  userId: string,
  band: string,
): Promise<LevelCursor | null> {
  const { data, error } = await supabase
    .from('study_level_cursor')
    .select('last_ngsl_rank, last_word_id')
    .eq('user_id', userId)
    .eq('band', band)
    .maybeSingle();

  if (error) {
    // 42P01 / PGRST205 — the table is not in this environment yet. ⛔ Not an error for the
    // learner: the deck behaves exactly as it did before `T-411`, from the top.
    console.error('[api/study/queue] level cursor read failed:', error.message);
    return null;
  }

  const row = data as { last_ngsl_rank?: number | null; last_word_id?: string | null } | null;
  const wordId = row?.last_word_id;
  if (typeof wordId !== 'string' || wordId === '') return null;

  const rank = row?.last_ngsl_rank;
  return {
    lastNgslRank: typeof rank === 'number' && Number.isInteger(rank) ? rank : null,
    lastWordId: wordId,
  };
}

/**
 * `T-411` · `F-277` · `D-266` — the bookmark moves when the deck is **SERVED**, ⛔ and ⛔ not
 * when the learner grades. 🔬 **That single distinction is the whole finding:** the only place
 * the product recorded "met" was `word_progress`, and `grep` over `app/api` shows a row is
 * created there in `review` · `practice` · `levels/scan` alone — i.e. on GRADING. ⇒ a learner
 * who browses and never grades never moved, forever.
 *
 * ⛔ **Fire-and-forget, ⛔ and deliberately so:** the cards are already built. A failed
 * bookmark write costs the learner one repeated page on the next open; a 503 costs them the
 * deck. The failure is logged and the answer goes out.
 */
async function advanceLevelCursor(
  supabase: RouteClient,
  userId: string,
  band: string,
  cursor: LevelCursor,
): Promise<void> {
  const { error } = await supabase.from('study_level_cursor').upsert(
    {
      user_id: userId,
      band,
      last_ngsl_rank: cursor.lastNgslRank,
      last_word_id: cursor.lastWordId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,band' },
  );

  if (error) console.error('[api/study/queue] level cursor write failed:', error.message);
}

/**
 * T-155 · D-089 — «סינון מילים»: the learner's whole level, in the order the ingest
 * pipeline ranked it, **continuing from where the learner stopped** (`T-411` · `F-277`).
 *
 * ⛔ **It reads `words`, ⛔ not `word_progress`,** and that is the point: the other two
 * decks can only ever show what the learner has already met, so a word nobody introduced
 * is unreachable until the five-a-day brake gets around to it. Measured 26/08: A1 holds
 * **305** authored words and `NEW_CARDS_PER_DAY` is **5** ⇒ **61 days** to see the level.
 *
 * ⛔ **The band comes from `profiles.current_level` compared to `words.cefr_profile_band`,
 * ⛔ and never to `senses.cefr_level`** (D-034: the two disagree on 125 of 343 measured
 * senses, and the second column has no provenance and is not maintained).
 *
 * ⛔ **Nothing is excluded BY PROGRESS.** `unknown` and `due` are defined by the learner's
 * counters; this deck is defined by the level, so a word already known is still IN the level
 * and still shown. Filtering by progress here would make «סינון מילים» a second, silent
 * spaced-repetition queue — which is exactly what D-032/D-033 keep it from being. ⚠️ The
 * cursor is ⛔ not that filter: it says which PAGE of the level was last served, ⛔ never what
 * the learner knows, and `T-412`'s one action puts it back to the top of the same level.
 *
 * 🔬 **Keyset, ⛔ and ⛔ not `offset`, and ⛔ not `not.in`.** `deck.ts:196` already measured why
 * a `not.in` URL breaks as the history grows; an `offset` would silently skip words whenever
 * the bank changes underneath the learner. The predicate below is exactly the inverse of the
 * ORDER BY two lines under it, which is what makes "the next page" mean the same thing twice.
 *
 * ⚠️ **The key is the PAIR `(ngsl_rank nulls last, id)`, and that is a MEASUREMENT.** Taken on
 * the live database 2026-09-17: `select count(*), count(ngsl_rank) from words` ⇒ **476 rows, 0
 * with a rank** (A1 315 · A2 116 · B1 37 · B2 8, all NULL). ⇒ a cursor on `ngsl_rank` alone —
 * which is what `T-411`ⓐ asks for in words — would select **nothing** on the second open.
 * `id` is the tie-break the ordering already needed, and the pair keeps working unchanged the
 * day `T-007` fills the rank column. Recorded as `F-281`.
 */
async function loadLevelWords(
  supabase: RouteClient,
  band: string,
  cursor: LevelCursor | null,
): Promise<LevelPage> {
  // ⚠️ The cursor predicate is applied BEFORE the band, and the band · order · ceiling stay one
  // unbroken chain on purpose: `route.test.ts` (F-034) measures "there is an `order` before the
  // `limit`" inside the statement that starts at `.eq('cefr_profile_band', band)`, and a chain
  // split across statements would make that measurement read an empty region and pass on
  // nothing. ⛔ A gate that stops measuring is worse than a gate that fails.
  let scoped = supabase.from('words').select(LEVEL_SELECT);
  if (cursor !== null) {
    if (cursor.lastNgslRank === null) {
      // The learner is already inside the unranked tail, so every ranked row is behind them.
      scoped = scoped.is('ngsl_rank', null).gt('id', cursor.lastWordId);
    } else {
      // Still inside the ranked head ⇒ the whole unranked tail is still ahead (`nulls last`).
      scoped = scoped.or(
        `ngsl_rank.gt.${cursor.lastNgslRank},` +
          `and(ngsl_rank.eq.${cursor.lastNgslRank},id.gt.${cursor.lastWordId}),` +
          `ngsl_rank.is.null`,
      );
    }
  }

  const { data, error } = await scoped
    .eq('cefr_profile_band', band)
    // ⛔ The order is the contract, ⛔ not a preference: band first (a single band here, but
    // stated so the two decks that share this projection cannot drift), then `ngsl_rank`,
    // which is frequency — the teaching order the ingest pipeline already computed — and then
    // `id`, which is ⛔ not decoration: without a unique tie-break "the next page" is undefined
    // whenever two rows share a rank, and TODAY every row shares one (all NULL).
    .order('cefr_profile_band', { ascending: true, nullsFirst: false })
    .order('ngsl_rank', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(MAX_QUEUE_ROWS);

  if (error) {
    console.error('[api/study/queue] level read failed:', error.message);
    throw error;
  }

  const raw = (data ?? []) as unknown as LevelWordRow[];
  // ⛔ A map and ⛔ not a parallel index: `toNewQueueRow` DROPS a row with no usable sense, so
  // the two lists are a subsequence of each other, ⛔ not the same length.
  const rankOf = new Map<string, number | null>();
  for (const row of raw) {
    const rank = row.ngsl_rank;
    rankOf.set(row.id, typeof rank === 'number' && Number.isInteger(rank) ? rank : null);
  }

  return {
    rows: raw.map(toNewQueueRow).filter((row): row is QueueRow => row !== null),
    rankOf,
  };
}

/**
 * `T-400` · `F-272` · `D-260` — «נשארו N מילים ברמה», the SECOND number
 * `docs/design/kol-A-03-card.png` draws under the grade buttons
 * (`render_video_A.py:391` — «5 מתוך 20 · נשארו 314 מילים ברמה»).
 *
 * 🔬 **Measured `C-0663`/`C-0664`, ⛔ not assumed:** `<StudyDeckScreen>` holds ⛔ no such
 * number — `grep -n 'summary|unseen|levels/summary' components/StudyDeckScreen.tsx` ⇒ **0**
 * — and both direct routes to it are closed: a second `GET /api/levels/summary` from the
 * deck screen contradicts `§ 4.2ז`, and lifting state to `<LevelMapScreen>` crosses into a
 * DIFFERENT screen. ⇒ the number rides the answer the deck ALREADY asks for.
 *
 * ⛔ **⛔ No second definition.** The arithmetic stays in `lib/core/levelSummary.ts`
 * (`totalInLevel − known − inReviewList`); this function hands it rows and reads `unseen`
 * off the result. A count written in SQL here would be the parallel definition `§ 4.2ז`
 * forbids by name, and `/api/levels/summary` would drift away from it word by word.
 *
 * ⛔ **And it returns `null` on every doubt, ⛔ never a smaller number.** A ceiling that cut
 * the progress list, a band the schema does not carry, a read that failed — each produces a
 * count that LOOKS right and is wrong, and the learner would build a decision on it. `null`
 * omits the field, and the deck simply does not print the line. ⛔ The cards are the point;
 * the footer is not worth a 503.
 *
 * ⚠️ **`totalInLevel` is a head count and ⛔ not `levelRows.length`:** `loadLevelWords` cuts
 * at `MAX_QUEUE_ROWS` (200) and A1 holds 315 authored words, so the rows in hand are ⛔ not
 * the level. Same `count: 'exact', head: true` shape `/api/levels/summary` already uses.
 */
async function readLevelUnseen(
  supabase: RouteClient,
  userId: string,
  band: string,
): Promise<number | null> {
  const level = parseLevel(band);
  // ⛔ Not one of the six bands ⇒ ⛔ no claim. `summarizeLevel` types on `CefrBand`, and
  // guessing one here is exactly the invented level `D-034` closed.
  if (level === null) return null;

  const [total, progress] = await Promise.all([
    supabase.from('words').select('id', { count: 'exact', head: true }).eq('cefr_profile_band', band),
    supabase
      .from('word_progress')
      // ⛔ `words!inner` — a progress row whose word was deleted belongs to ⛔ no level, and
      // an outer join would count it into this one. The predicate is `cefr_profile_band`
      // and ⛔ never `senses.cefr_level` (`D-034`: the two disagree on 125 of 343 senses).
      .select('attempts, repetition, self_marked_known, words!inner(cefr_profile_band)')
      .eq('user_id', userId)
      .eq('words.cefr_profile_band', band)
      .limit(MAX_SEEN_ROWS),
  ]);

  if (total.error || progress.error) {
    console.error(
      '[api/study/queue] level unseen read failed:',
      (total.error ?? progress.error)?.message,
    );
    return null;
  }

  const rows = (progress.data ?? []) as unknown as readonly {
    attempts: number | null;
    repetition: number | null;
    self_marked_known: boolean | null;
  }[];
  // A truncated list under-counts `known` and therefore OVER-counts «נשארו» — the one
  // direction that flatters the product. ⇒ ⛔ no number rather than a kind one.
  if (rows.length >= MAX_SEEN_ROWS) return null;

  const facts: ProgressFacts[] = rows.map((row) => ({
    attempts: row.attempts ?? 0,
    repetition: row.repetition ?? 0,
    selfMarkedKnown: row.self_marked_known === true,
  }));

  try {
    return summarizeLevel({ level, totalInLevel: total.count ?? 0, rows: facts }).unseen;
  } catch (rangeError) {
    // `summarizeLevel` throws when the two reads disagree about the band's population.
    // That is a real inconsistency, ⛔ and the deck is ⛔ not the screen that reports it.
    console.error('[api/study/queue] impossible level counts:', (rangeError as Error).message);
    return null;
  }
}

/**
 * T-165ⓓ — the same band predicate `loadLevelWords` uses, on the same column. The order is
 * `ngsl_rank` for the same reason: frequency is the teaching order the ingest pipeline
 * already computed, and the 200-row ceiling must cut the rare tail, ⛔ not the common core.
 */
async function loadSentenceCandidates(
  supabase: RouteClient,
  band: string,
): Promise<SentenceCandidate[]> {
  const { data, error } = await supabase
    .from('words')
    .select(SENTENCES_SELECT)
    .eq('cefr_profile_band', band)
    .order('ngsl_rank', { ascending: true, nullsFirst: false })
    .limit(MAX_QUEUE_ROWS);

  if (error) {
    console.error('[api/study/queue] sentences read failed:', error.message);
    throw error;
  }

  return ((data ?? []) as unknown as SentenceWordRow[])
    .map(toSentenceCandidate)
    .filter((row): row is SentenceCandidate => row !== null);
}

/**
 * `profiles.current_level`, read as a value and ⛔ never defaulted. A learner who has not
 * chosen a level has ⛔ no level — `?? 'A1'` here would silently teach the wrong band to
 * every one of them, and the screen already has a state for "no level yet" (`kind: 'choose'`).
 */
async function readCurrentLevel(
  supabase: RouteClient,
  userId: string,
): Promise<{ readonly ok: true; readonly level: string | null } | { readonly ok: false }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[api/study/queue] current_level read failed:', error.message);
    return { ok: false };
  }

  const level = (data as { current_level?: string | null } | null)?.current_level;
  return { ok: true, level: typeof level === 'string' && level !== '' ? level : null };
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
  // not ask for. ⚠️ `sentences` is ⛔ no longer among the unknown: D-097 measured both of
  // D-035's release conditions met on 23/08, and T-165 opened it here (C-0321).
  if (deck === null) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  const limit = clampQueueLimit(params.get('limit'));

  // T-165 · D-097 — «משפטים». Like `level`, it answers from `words` and therefore ⛔ never
  // touches the `word_progress` query below; it returns FIRST so that query is not paid for.
  //
  // ⛔ **Read side only.** The response carries items; ⛔ nothing here writes, and
  // ⛔ `/api/review` is ⛔ not reachable from this deck (T-165ⓒ · D-032 · D-033). Grading a
  // sentences item is F-140 in a second deck — most band words have no `word_progress` row
  // and `app/api/practice/route.ts:59` answers 404 to exactly those — and that is a PM
  // decision, ⛔ not something this route mints.
  if (deck === 'sentences') {
    const profile = await readCurrentLevel(supabase, user.id);
    if (!profile.ok) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
    // ⛔ 409, ⛔ and never a fall-back to A1 — the same three codes `level` uses, ⛔ not new ones.
    if (profile.level === null) {
      return NextResponse.json({ ok: false, code: 'no_level' }, { status: 409 });
    }

    let candidates: SentenceCandidate[];
    try {
      candidates = await loadSentenceCandidates(supabase, profile.level);
    } catch (sentencesError) {
      const code = (sentencesError as { code?: string }).code;
      if (code === '42P01' || code === 'PGRST205') {
        return NextResponse.json(
          { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
          { status: 503 },
        );
      }
      return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
    }

    // ⛔ The seed is read from the clock exactly as `app/api/arcade/round/route.ts:97` does,
    // and it travels in the response — the round is reproducible from the answer itself.
    const seed = Date.now() >>> 0;
    // ⚠️ Built ONCE at the ceiling and then cut, ⛔ not built twice: `buildSentenceItems`
    // shuffles and *then* slices, so the first `limit` of the full build are exactly the
    // items a build at `limit` would have produced — and `total` is therefore counted
    // BEFORE the cut, which is the only reason `<DeckSelector>` may read a count with
    // `limit=1` (docs/api-contract.md).
    const allItems: readonly SentenceItem[] = buildSentenceItems(candidates, seed, MAX_QUEUE_ROWS);
    return NextResponse.json({
      ok: true,
      deck,
      total: allItems.length,
      seed,
      items: allItems.slice(0, limit),
    });
  }

  // T-155 · D-089 — «סינון מילים» answers from `words` and therefore ⛔ never touches the
  // `word_progress` query below. It returns FIRST so that query is not paid for at all.
  if (deck === 'level') {
    // `T-408` — **`?band=` היא הרמה שהמודול הצהיר, ⛔ ולא העדפה.** עד היום החפיסה
    // הזאת נגזרה מ-`profiles.current_level` בלבד, ⵒ כרטיס מודול שכתוב עליו «רמה B1»
    // היה פותח את הרמה של הלומד — **שקר מדיד על המסך**, ⛔ ולא אי-דיוק.
    //
    // ⛔ **וזו ⛔ אינה נעילה ו⛔ אינה שער** (`R-017` · `D-037`): כל רמה שיש בה מילים
    // נפתחת לכל לומד. מה שהפרמטר קובע הוא **מה נסנן**, ⛔ ולא מי רשאי.
    //
    // ⛔ **וערך שאינו רמה הוא 400, ⛔ ולא נפילה שקטה לרמת הלומד** — אותה הכרעה
    // בדיוק ש-`deck` עצמה עושה שורות ספורות מעל: חפיסה שהלומד ⛔ לא ביקש היא הכשל.
    const rawBand = params.get('band');
    const requestedBand = rawBand === null ? null : parseLevel(rawBand);
    if (rawBand !== null && requestedBand === null) {
      return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
    }

    // ⛔ הפרופיל נקרא אך ורק כשאין רמה בכתובת — קריאה שהתשובה ⛔ אינה
    // תלויה בה היא קריאה שהלומד משלם עליה בהמתנה.
    let band: string | null = requestedBand;
    if (band === null) {
      const profile = await readCurrentLevel(supabase, user.id);
      if (!profile.ok)
        return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
      // ⛔ 409 and ⛔ not 503: the request is well-formed and the server is healthy — the
      // learner simply has no level yet. ⛔ And ⛔ not a silent fall-back to A1, which would
      // teach a band nobody chose. `<LevelMapScreen>` already renders this as `kind: 'choose'`.
      if (profile.level === null) {
        return NextResponse.json({ ok: false, code: 'no_level' }, { status: 409 });
      }
      band = profile.level;
    }

    // `T-411` · `F-277` — the bookmark is read BEFORE the page, because it IS the page's
    // predicate. ⛔ A failed read is `null` and ⛔ not a 503: see `readLevelCursor`.
    const cursor = await readLevelCursor(supabase, user.id, band);

    let levelPage: LevelPage;
    try {
      levelPage = await loadLevelWords(supabase, band, cursor);
    } catch (levelError) {
      const code = (levelError as { code?: string }).code;
      if (code === '42P01' || code === 'PGRST205') {
        return NextResponse.json(
          { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
          { status: 503 },
        );
      }
      return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
    }

    // `total` before the cut, exactly as the contract fixes it for the other two decks —
    // it is the only reason `<DeckSelector>` can read a count with `limit=1`.
    //
    // ⛔ **`slice` and ⛔ not `selectDeck`,** for the same measured reason `loadNewWords`
    // gives four functions up: the query already ordered these rows by band and then by
    // `ngsl_rank`, and `sortQueue` has no rank to sort by — every row here is unscheduled,
    // so its tie-break would replace FREQUENCY with the alphabet. «anchor before apple» is
    // a dictionary, ⛔ not a teaching order. The pure layer still owns the deck's shape
    // (`selectDeck(rows, 'level', …)` keeps every row, and `deck.test.ts` pins that).
    const served = levelPage.rows.slice(0, limit);
    const levelCards = served.map((row) => toQueueCardInput(row, PROMOTE_AFTER_CONSECUTIVE_CORRECT));

    // `T-411`ⓒ — **the bookmark moves because the deck was SERVED**, ⛔ not because anything was
    // graded, and that is the entire difference between this and `word_progress`. ⛔ To the last
    // card ACTUALLY SENT and ⛔ not to the last row READ: the rows past `limit` were never shown,
    // and skipping them here is precisely the twenty words `F-277` says the learner never sees.
    // ⚠️ Awaited on purpose — a learner who double-taps «עוד» must ⛔ not race the write and get
    // the same page twice, which is the very symptom being fixed.
    const lastServed = served[served.length - 1];
    if (lastServed !== undefined) {
      await advanceLevelCursor(supabase, user.id, band, {
        lastNgslRank: levelPage.rankOf.get(lastServed.wordId) ?? null,
        lastWordId: lastServed.wordId,
      });
    }

    // `T-400` — the second number of `kol-A-03-card.png`, in THIS answer. ⛔ The deck screen
    // asks for nothing extra: `<StudyDeckScreen>` already awaits this response, so the whole
    // change on the wire is one optional field. ⛔ `null` ⇒ the field is absent, ⛔ and ⛔ not
    // `unseen: null` — the contract's other optional fields (`cards`/`items`) are absent
    // rather than null, and a consumer that reads `body.unseen` gets `undefined` either way.
    const unseen = await readLevelUnseen(supabase, user.id, band);

    // `T-412` · `F-277` — **the end of the level is a DECLARED state, ⛔ not an empty list.**
    // ⛔ The distinction is the whole row: a learner who filtered the whole band and one whose
    // bank failed to load both saw «אין כרטיסיות» before today, and the first of the two had
    // ⛔ no way forward at all. ⇒ the answer says which of the two happened, and ⛔ never asks
    // the screen to guess it from `cards.length === 0`.
    // ⛔ **And ⛔ no automatic spill into the next level** (`R-017` · `D-266`): jumping a
    // learner to B1 because A1 ran out is a readiness claim ⛔ nobody measured.
    const atEnd = cursor !== null && levelPage.rows.length === 0;

    return NextResponse.json({
      ok: true,
      deck,
      // `T-411` — `total` is still "counted before the cut", ⛔ but the population it counts is
      // now **what is left from the learner's place**, ⛔ not the whole band. That is the number
      // `<DeckSelector>` needs in order to stop promising a level it has already served.
      total: levelPage.rows.length,
      cards: levelCards,
      ...(unseen === null ? {} : { unseen }),
      ...(atEnd ? { atEnd: true } : {}),
    });
  }

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
    // `T-393` — השלישי נוסף מפני שהפרדיקט הטהור גדל בו: `classifyProgress` מוציא מילה
    // שהלומד סימן «ידעתי» ביד מהחפיסה, ⇒ תקרת 200 השורות חייבת לחתוך את **אותה**
    // אוכלוסייה. ⛔ ⛔ אין כאן הגדרה שנייה: `isUnknownRow` למטה נשאר ההגדרה, וזו אותה
    // כלל בדיוק שנאמר לדאטהבייס — בדיוק כפי ש-`F-034` כבר קבע לשני הראשונים.
    query = query.gt('attempts', 0).eq('repetition', 0).eq('self_marked_known', false);
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

/**
 * POST /api/study/queue — «להתחיל את הרמה מחדש». See docs/api-contract.md.
 *
 * `T-412` · `F-277` · `D-266` — the ONE action the end-of-level state offers, and it is
 * exactly one (`taste-skill § 4.5`: ⛔ no two CTA intents on one screen). It removes this
 * learner's bookmark for this band, ⛔ and nothing else.
 *
 * 🔴 ⛔ **It deletes a BOOKMARK, ⛔ never progress.** `word_progress` is a different table and
 * is ⛔ not touched here — what the learner knows survives starting the level again, and the
 * two concepts were never the same one (`D-032` · `D-033`).
 *
 * ⛔ **POST on the deck's own route, ⛔ not a new endpoint and ⛔ not a DELETE verb:** the
 * client layer (`lib/api/client.ts`) carries `apiGet`/`apiPost`/`apiPatch` and ⛔ no delete,
 * and a fourth verb added for one button is a wider surface than the button is worth.
 */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Session BEFORE the body is read — the same C-0032 order the GET above uses.
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  let body: { deck?: unknown; band?: unknown };
  try {
    body = (await request.json()) as { deck?: unknown; band?: unknown };
  } catch {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }

  // ⛔ `level` alone. The other three decks have ⛔ no bookmark, so «restart» is meaningless
  // there — and a silent success on a deck that has nothing to restart is a lie to the caller.
  if (typeof body.deck !== 'string' || parseDeckName(body.deck) !== 'level') {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }

  // ⛔ The band is REQUIRED here and optional on the GET, and that is deliberate: the GET may
  // fall back to `profiles.current_level` because it is only choosing what to show, while this
  // DELETES a row — and a fall-back would silently reset a band the learner never named.
  const band = typeof body.band === 'string' ? parseLevel(body.band) : null;
  if (band === null) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });

  const { error } = await supabase
    .from('study_level_cursor')
    .delete()
    .eq('user_id', user.id)
    .eq('band', band);

  if (error) {
    console.error('[api/study/queue] level cursor reset failed:', error.message);
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, deck: 'level', band });
}
