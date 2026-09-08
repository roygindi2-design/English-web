/**
 * PURE. No React, no DOM, no clock, no env, no I/O. The deck layer: it decides which rows
 * become cards, in what order, and in what shape they travel to the client.
 *
 * **Why the order is `words.cefr_profile_band` and ⛔ never `senses.cefr_level` (D-034):**
 * the two disagree on 125 of 343 measured senses. `cefr_profile_band` is the column the
 * ingest pipeline writes from the licensed profiles (CEFR-J / Octanove) with
 * `cefr_profile_source` beside it as provenance; `senses.cefr_level` has no such source and
 * is not maintained. A queue sorted by the unmaintained column would teach the wrong level
 * to more than a third of the learners who reach those senses — so this module never reads
 * it, and neither does the route above it.
 *
 * A row whose band is NULL or unrecognised is not guessed into a level: it sinks to the end
 * of the queue (`bandRank`), where an unlevelled word is a tail item rather than an A1 one.
 */

import { BINARY_GRADES, directionFor, type CardDirection, type CardGrade } from './flashcard';
import type { SentenceItem } from './sentenceItem';

/**
 * T-155 · D-089 — `'level'` is ADDITIVE and the two names above it ⛔ do not move.
 *
 * «סינון מילים» is the whole level, in band-then-rank order, and it exists because the
 * only other supply of new words is the five-a-day brake in `app/api/study/queue/route.ts`
 * — measured 26/08 as **61 days** to see A1's 305 authored words. ⛔ It is ⛔ not a third
 * scheduling mode: grading from it writes `attempts` / `correct_attempts` and ⛔ nothing
 * else (D-032 · D-033), exactly as `unknown` does. Looking at a word ⛔ is not an exposure
 * that was answered.
 */
export type DeckName = 'due' | 'unknown' | 'level' | 'sentences';
export const DECK_NAMES: readonly DeckName[] = ['due', 'unknown', 'level', 'sentences'];

/**
 * T-165ⓐ · C-0321 — **שני שמות, שני שערים, ⛔ ולא שם אחד לשניהם.**
 *
 * `DeckName` הוא מה ש**המסלול** מקבל. `FlashcardDeckName` הוא מה ש**המסך** מקבל, וההפרש
 * ביניהם הוא `'sentences'` בלבד.
 *
 * ⚠️ הסיבה נמדדה, ⛔ ואינה טעם: `app/study/page.tsx` מוסר את שם החפיסה ל-`<StudyDeckScreen>`
 * ומשם ל-`buildCard`, שבונה **כרטיס דו-כפתורי של דירוג עצמי**. פריט השלמה ⛔ אינו כרטיס
 * כזה — הוא גזע וארבע אפשרויות. בלי ההפרדה, לומד שמגיע ל-`/study?deck=sentences` מכתובת
 * מקבל מסך שבור מ-URL, וזו בדיוק מחלקת F-027.
 *
 * ⇒ `Exclude` הופך את מסירת פריט השלמה ל-`<Flashcard>` ל**שגיאת הידור**, ⛔ ולא לכלל
 * בהערה. ⚠️ נרשם תחת `RULES § 0.22` כהכרעה הפיכה (גבול מודול / שמות פונקציות): קומיט אחד
 * מבטל אותה.
 */
export type FlashcardDeckName = Exclude<DeckName, 'sentences'>;
export const FLASHCARD_DECK_NAMES: readonly FlashcardDeckName[] = ['due', 'unknown', 'level'];
export const DEFAULT_QUEUE_LIMIT = 20;
export const MAX_QUEUE_LIMIT = 50;
/** סדר הרמות. ⛔ המקור הוא words.cefr_profile_band בלבד (D-034). */
export const CEFR_BAND_ORDER: readonly string[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** שורה אחת אחרי שהמסלול שיטח אותה. ⛔ אין כאן צורת PostgREST מקוננת. */
export interface QueueRow {
  readonly wordId: string;
  readonly headword: string;
  readonly translationHe: string;
  readonly examples: { readonly supportive: string; readonly neutral: string };
  readonly needsHumanReview: boolean;
  readonly cefrProfileBand: string | null;
  /** epoch ms. null = מילה חדשה שטרם נענתה — ⛔ ולא "לא בזמן". */
  readonly nextReviewAtMs: number | null;
  /** `0` = SM-2 טרם תזמן. העמודה היא `not null default 0` (0005_review_state.sql:29). */
  readonly intervalDays: number;
  readonly attempts: number;
  readonly repetition: number;
  readonly consecutiveCorrectRecognition: number;
}

/**
 * T-100 · D-043 — מצב התזמון של המילה, ⛔ ולא פן של הכרטיס.
 * ⛔ אפס עמודה חדשה: שני השדות קיימים מאז 0005_review_state.sql.
 */
export interface QueueCardReview {
  readonly next_review_at: string | null;
  readonly interval_days: number;
}

/** צורת החוט. ⛔ המסלול לא בונה Card — buildCard רץ בלקוח, שם חי גם מצב החשיפה. */
export interface QueueCardInput {
  readonly word_id: string;
  readonly direction: CardDirection;
  readonly is_first_encounter: boolean;
  readonly sense: {
    readonly headword: string;
    readonly translation_he: string;
    readonly examples: { readonly supportive: string; readonly neutral: string };
    readonly needs_human_review: boolean;
  };
  /** ⛔ תוספת בלבד — ארבעת השדות שמעליה ⛔ לא זזו (התקדים הוא T-102). */
  readonly review: QueueCardReview;
}

/**
 * T-066 · D-169 — what `<CardDeck>` scrolls: a word card OR a sentence item, on the SAME
 * card component. ⛔ Not a second deck component (D-169 forbids one); the union is what lets
 * one `<CardDeck>` key, remove and scroll both shapes with one list.
 */
export type DeckCard = QueueCardInput | SentenceItem;

/** `'stem' in card` — the one field a word card never carries. */
export function isSentenceCard(card: DeckCard): card is SentenceItem {
  return 'stem' in card;
}

/**
 * The key `<CardDeck>` removes and scrolls by. A word is one card ⇒ `word_id`; a word can
 * carry up to three stems (`sentenceItem.ts` flattens BEFORE the shuffle, T-165) ⇒ two stems
 * of one word are TWO cards, keyed `wordId#itemIndex`. ⛔ Keying a sentence item by `wordId`
 * alone would remove both when the learner answers one.
 */
export function deckCardKey(card: DeckCard): string {
  return isSentenceCard(card) ? `${card.wordId}#${card.itemIndex}` : card.word_id;
}

export function parseDeckName(value: string | null): DeckName | null {
  // No argument at all is the daily dose — the learner who taps «כרטיסיות» without a query
  // string is asking for today's queue. An argument we do not know is a 400 at the route,
  // never a silent fallback to a deck the learner did not ask for.
  if (value === null) return 'due';
  return DECK_NAMES.includes(value as DeckName) ? (value as DeckName) : null;
}

/**
 * שער ה**מסך**. ⛔ `'sentences'` מחזיר `null` כאן ⛔ ולא כי הוא שם פסול — הוא שם חוקי
 * לגמרי במסלול — אלא כי `<StudyDeckScreen>` ⛔ אינו יודע לצייר פריט השלמה (F-143: ⛔ אין
 * רנדר למסך הזה). ⇒ הכתובת נופלת ל«מנת היום», ⛔ ולא למסך שבור.
 */
export function parseFlashcardDeckName(value: string | null): FlashcardDeckName | null {
  if (value === null) return 'due';
  return FLASHCARD_DECK_NAMES.includes(value as FlashcardDeckName)
    ? (value as FlashcardDeckName)
    : null;
}

export function clampQueueLimit(value: string | null): number {
  if (value === null) return DEFAULT_QUEUE_LIMIT;
  // `Number()` on '' is 0 and on ' 7 ' is 7; only a bare run of digits is a limit, so a
  // fractional or signed string never reaches the query as NaN or as a negative range.
  if (!/^\d+$/.test(value)) return DEFAULT_QUEUE_LIMIT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_QUEUE_LIMIT;
  return Math.min(parsed, MAX_QUEUE_LIMIT);
}

/** NULL ורמה לא מוכרת ⇒ CEFR_BAND_ORDER.length — סוף התור, ⛔ לא רמה מנוחשת. */
export function bandRank(band: string | null): number {
  if (band === null) return CEFR_BAND_ORDER.length;
  const index = CEFR_BAND_ORDER.indexOf(band);
  return index === -1 ? CEFR_BAND_ORDER.length : index;
}

/**
 * «לא ידעתי» — D-032/D-033, ⛔ ואפס מיגרציה: the deck is a query over columns that already
 * exist. `attempts > 0` means the learner has met the word; `repetition === 0` means SM-2
 * has not yet recorded a correct answer for it, and a correct answer is exactly what takes
 * the word out of this deck.
 */
export function isUnknownRow(row: QueueRow): boolean {
  return row.attempts > 0 && row.repetition === 0;
}

/** null בסוף: מילה שאין לה מועד חזרה אינה "מועדה עכשיו" — היא פשוט לא תוזמנה. */
function reviewRank(at: number | null): number {
  return at === null ? Number.POSITIVE_INFINITY : at;
}

export function sortQueue(rows: readonly QueueRow[]): QueueRow[] {
  // A copy, always: the caller's array is its own, and an in-place sort here would reorder
  // the route's `total` list under it.
  return [...rows].sort((a, b) => {
    const byBand = bandRank(a.cefrProfileBand) - bandRank(b.cefrProfileBand);
    if (byBand !== 0) return byBand;
    // Compared as values, ⛔ never subtracted: `Infinity - Infinity` is NaN, and a NaN
    // comparator silently leaves the array in whatever order the engine happened to have.
    const dueA = reviewRank(a.nextReviewAtMs);
    const dueB = reviewRank(b.nextReviewAtMs);
    if (dueA !== dueB) return dueA < dueB ? -1 : 1;
    // Full tie-break, so two rows never swap between one request and the next: engines are
    // allowed to order equal elements however they like, and a queue that reshuffles itself
    // on refresh looks like lost progress to the learner.
    if (a.headword !== b.headword) return a.headword < b.headword ? -1 : 1;
    return a.wordId < b.wordId ? -1 : a.wordId > b.wordId ? 1 : 0;
  });
}

export function selectDeck(
  rows: readonly QueueRow[],
  deck: DeckName,
  limit: number,
): QueueRow[] {
  // `due` is filtered by the query (`next_review_at <= now`), so filtering it again here
  // would be a second, divergent definition of the same deck. `level` is filtered by the
  // query too — the band predicate is `words.cefr_profile_band = profiles.current_level` —
  // and re-filtering it here would be the same duplicated definition one deck over. ⛔ Only
  // `unknown` filters, because only `unknown` is defined by counters this layer can read.
  const filtered = deck === 'unknown' ? rows.filter(isUnknownRow) : rows;
  return sortQueue(filtered).slice(0, limit);
}

/**
 * ⛔ לא `not.in` בשאילתה: רשימת המזהים גדלה עם ההיסטוריה של הלומד עד שכתובת ה-URL נשברת
 * בשקט. הסינון נעשה כאן, על מועמדים שכבר נמשכו.
 */
export function excludeSeen(
  rows: readonly QueueRow[],
  seenWordIds: readonly string[],
): QueueRow[] {
  const seen = new Set(seenWordIds);
  return rows.filter((row) => !seen.has(row.wordId));
}

export function toQueueCardInput(
  row: QueueRow,
  promoteAfterConsecutiveCorrect: number,
): QueueCardInput {
  return {
    word_id: row.wordId,
    direction: directionFor(
      { consecutiveCorrectRecognition: row.consecutiveCorrectRecognition },
      { promoteAfterConsecutiveCorrect },
    ),
    // The supportive sentence is chosen by `buildCard` from this flag alone — a word the
    // learner has never answered is being introduced, whatever its scheduling state is.
    is_first_encounter: row.attempts === 0,
    sense: {
      headword: row.headword,
      translation_he: row.translationHe,
      examples: { supportive: row.examples.supportive, neutral: row.examples.neutral },
      // D-024: travels as measured. A sense nobody verified must reach the card marked.
      needs_human_review: row.needsHumanReview === true,
    },
    review: {
      // ⛔ אין שדה ISO שני ב-QueueRow: שתי הצגות של אותו נתון הן הסחיפה של
      // D-034. ההמרה נאמנה למילישנייה ונבדקת ב-deck.test.ts.
      next_review_at:
        row.nextReviewAtMs === null ? null : new Date(row.nextReviewAtMs).toISOString(),
      interval_days: row.intervalDays,
    },
  };
}

/** D-033: זה כל מה שתרגול עושה. ⛔ אין כאן easiness/interval/repetition/next_review. */
export interface PracticeCounters {
  readonly attempts: number;
  readonly correctAttempts: number;
}

/**
 * D-033, and the reason this function returns a two-field object rather than a patch:
 * practising a word the learner already failed must not move its review date. If this
 * returned the whole progress row, an immediate re-practice would inflate `interval_days`
 * and push the word weeks away — the opposite of what «לא ידעתי» is for.
 */
export function applyPractice(current: PracticeCounters, grade: CardGrade): PracticeCounters {
  return {
    attempts: current.attempts + 1,
    correctAttempts: current.correctAttempts + (grade === 'good' ? 1 : 0),
  };
}

export type PracticePayload = {
  readonly wordId: string;
  readonly grade: CardGrade;
  /**
   * ⛔ NOT decoration. The route's 404 for a missing `word_progress` row is correct for
   * every deck except this one: `level` is BY DEFINITION the words that have no row yet.
   * The discriminator is what lets the route narrow that 404 instead of deleting it.
   * ⛔ `'sentences'` is absent — `FlashcardDeckName` excludes it (`deck.ts:47`).
   */
  readonly deck: FlashcardDeckName;
};
export type PracticeCheck =
  | { readonly ok: true; readonly payload: PracticePayload }
  | { readonly ok: false; readonly code: 'unavailable' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REJECT: PracticeCheck = { ok: false, code: 'unavailable' };

/**
 * F-004 at this boundary: an array is an object and `null` is an object, so the shape is
 * checked before any property is read, and both fields are validated as values rather than
 * as truthiness.
 *
 * ⚠️ Absent `deck` is `'due'`, ⛔ not a rejection. `parseDeckName(null)` already means
 * «today's dose» (`:99`), and `'due'` is the deck whose 404 stays. An old client that sends
 * no `deck` therefore keeps exactly today's behaviour — ⛔ it does not silently gain the
 * insert path.
 */
export function checkPracticePayload(body: unknown): PracticeCheck {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return REJECT;
  const { word_id: wordId, grade, deck } = body as {
    word_id?: unknown;
    grade?: unknown;
    deck?: unknown;
  };
  if (typeof wordId !== 'string' || !UUID_RE.test(wordId)) return REJECT;
  if (typeof grade !== 'string' || !BINARY_GRADES.includes(grade as CardGrade)) return REJECT;
  // ⛔ `undefined` בלבד נופל ל-`'due'`. `null`, `''` ומחרוזת לא מוכרת נדחים — ברירת
  // מחדל שבולעת קלט פסול היא בדיוק המחלקה של F-004.
  if (deck !== undefined && (typeof deck !== 'string' || !FLASHCARD_DECK_NAMES.includes(deck as FlashcardDeckName))) {
    return REJECT;
  }
  const deckName: FlashcardDeckName = deck === undefined ? 'due' : (deck as FlashcardDeckName);
  return { ok: true, payload: { wordId, grade: grade as CardGrade, deck: deckName } };
}
