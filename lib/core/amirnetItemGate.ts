/**
 * שער פריטי אמירנט — T-223, פותח את הזמנת התוכן K-006 (`plan/41-amirnet-spec.md § 6`).
 *
 * ⛔ טהור, על תבנית `storyQuestionGate`/`messageGate`: אפס React · DOM · רשת · שעון · env.
 *
 * ⚠️ **מה שהשער הזה ⛔ אינו בודק, במפורש (`docs/content-amirnet-items-brief.md § 6`):**
 *   · שהפריט **באמת** ברמה שהוא מצהיר — קריטריון מבני, לא מדיד.
 *   · שהפריט ⛔ אינו הד של שאלה קיימת ממאגר מסחרי — זו הצהרת הכותב, לא בדיקת קוד.
 *   · נושא רגיש בקטעי `rc` — עין אנושית בלבד.
 * אלה נשארים שיפוט של ה-Critic ו/או סוכן התוכן, ⛔ ולא נטענים כאן כמכוסים.
 *
 * ⚠️ **סף אורך התשובה הנכונה הוא החלטת DEV הפיכה (RULES § 0.22), ⛔ לא מספר מהמפרט:**
 * `41 § 6.4` כלל 3 אומר "אורך דומה, לא הארוכה ביותר באופן שיטתי" ⛔ ובלי סף מספרי.
 * `1.4` (40% ארוכה מהחציון) נבחר כאן כערך שמרני וסביר לכתיבת פריטים; שינוי בעתיד
 * דורש עדכון של שורה אחת ותיעוד ב-`50-tasks.md`/`60-findings.md`, ⛔ לא הכרעת רוי מחדש.
 */

import type { AmirnetServedItem } from './amirnetQuestion';

export type AmirnetItemType = 'sc' | 'rs' | 'rc';

export type AmirnetVocabBand = 1000 | 2000 | 3000;

/** `41 § 6.5` · `0024_amirnet_items.sql:88-90`. ⛔ Widening it here widens ⛔ nothing in the table. */
export const AMIRNET_VOCAB_BANDS: ReadonlySet<number> = new Set<number>([1000, 2000, 3000]);

export interface AmirnetOption {
  /** Distractor's error-reason; at correctIndex, why THIS option is correct. Never empty. */
  readonly textEn: string;
  readonly reason: string;
}

export interface AmirnetItemRecord {
  readonly type: AmirnetItemType;
  readonly level: number;
  /** sc: the sentence with a blank. rs: the source sentence. rc: the question text. */
  readonly stemEn: string;
  /** rc only — the passage the question is grounded in. sc/rs: pass ''. */
  readonly passageEn: string;
  readonly options: readonly AmirnetOption[];
  readonly correctIndex: number;
  readonly levelRationale: string;
  readonly source: string;
  /**
   * `41 § 6.5` — a closed set, ⛔ and the same one `0024_amirnet_items.sql` writes as
   * `vocab_band smallint not null` + `amirnet_items_vocab_band_check`. ⛔ It is ⛔ never
   * inferred: the band is derived from the Tier of the hardest word in the item
   * (`docs/content-amirnet-items-brief.md § 6`), which is a statement about the item's
   * author, ⛔ not a number this code may pick (`R-010`). Snake-case deliberately — it is
   * the name the delivery files and the column already carry, and renaming it here would
   * have made the gate's field a third spelling of the same thing.
   */
  readonly vocab_band: AmirnetVocabBand;
}

export type AmirnetGateReason =
  | 'wrong_option_count'
  | 'bad_correct_index'
  | 'duplicate_options'
  | 'missing_distractor_reason'
  | 'bad_level'
  | 'missing_level_rationale'
  | 'bad_source'
  | 'bad_vocab_band'
  | 'all_or_none_option'
  | 'correct_length_outlier'
  | 'vocab_above_tier'
  | 'passage_length_out_of_range';

export interface AmirnetGateResult {
  readonly ok: boolean;
  readonly reasons: readonly AmirnetGateReason[];
  readonly aboveTierWords: readonly string[];
}

export interface AmirnetGateOptions {
  /** lower-cased CEFR headword -> tier (1-4). Absence is NOT flagged — see header. */
  readonly vocabTierByWord: ReadonlyMap<string, 1 | 2 | 3 | 4>;
}

export const AMIRNET_OPTIONS_PER_ITEM = 4;

/** `41 § 6.2` word-count ranges by level, `rc` only. */
export const RC_PASSAGE_WORD_RANGE: Readonly<Record<1 | 2 | 3 | 4, readonly [number, number]>> = {
  1: [90, 120],
  2: [130, 170],
  3: [180, 230],
  4: [240, 300],
};

/** See header note: reasoned default, ⛔ not a measured constant. */
const CORRECT_LENGTH_RATIO_CEILING = 1.4;

const BANNED_OPTION_PHRASES = new Set(['all of the above', 'none of the above']);
const TOKEN = /[a-z']+/g;

const tokensOf = (text: string): string[] => text.toLowerCase().match(TOKEN) ?? [];

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export function amirnetItemGate(
  record: AmirnetItemRecord,
  opts: AmirnetGateOptions,
): AmirnetGateResult {
  const reasons: AmirnetGateReason[] = [];
  const options = record.options;

  if (options.length !== AMIRNET_OPTIONS_PER_ITEM) reasons.push('wrong_option_count');

  const correctIndexValid =
    Number.isInteger(record.correctIndex) &&
    record.correctIndex >= 0 &&
    record.correctIndex < options.length;
  if (!correctIndexValid) reasons.push('bad_correct_index');

  const trimmedTexts = options.map((o) => o.textEn.trim());
  if (new Set(trimmedTexts).size !== trimmedTexts.length) reasons.push('duplicate_options');

  if (options.some((o) => o.reason.trim() === '')) reasons.push('missing_distractor_reason');

  const levelValid = Number.isInteger(record.level) && record.level >= 1 && record.level <= 4;
  if (!levelValid) reasons.push('bad_level');

  if (record.levelRationale.trim() === '') reasons.push('missing_level_rationale');

  if (record.source !== 'original') reasons.push('bad_source');

  // ⛔ `F-235` — the gate must refuse exactly what `0024`'s check constraint refuses.
  // Until this line the field was ⛔ absent from `AmirnetItemRecord` entirely, so
  // `measure:amirnet-gate` reported 26/26 passing on a bank whose 10 `rc` questions
  // ⛔ cannot be inserted at all. ⛔ A gate that cannot see a `not null` column is
  // ⛔ not measuring the thing the table will.
  if (!AMIRNET_VOCAB_BANDS.has(record.vocab_band)) reasons.push('bad_vocab_band');

  if (trimmedTexts.some((t) => BANNED_OPTION_PHRASES.has(t.toLowerCase()))) {
    reasons.push('all_or_none_option');
  }

  // ── correct answer must not be a length outlier vs. the distractor median ──
  if (correctIndexValid && options.length > 1) {
    const correctLen = trimmedTexts[record.correctIndex]!.length;
    const distractorLens = trimmedTexts.filter((_, i) => i !== record.correctIndex).map((t) => t.length);
    const medianDistractorLen = median(distractorLens);
    if (medianDistractorLen > 0 && correctLen / medianDistractorLen > CORRECT_LENGTH_RATIO_CEILING) {
      reasons.push('correct_length_outlier');
    }
  }

  // ── vocabulary ceiling: no content word above the item's level tier ──
  const aboveTierWords = new Set<string>();
  if (levelValid) {
    const textsToScan = [record.stemEn, record.passageEn, ...options.map((o) => o.textEn)];
    for (const text of textsToScan) {
      for (const token of tokensOf(text)) {
        const tier = opts.vocabTierByWord.get(token);
        if (tier !== undefined && tier > record.level) aboveTierWords.add(token);
      }
    }
  }
  if (aboveTierWords.size > 0) reasons.push('vocab_above_tier');

  // ── rc passage length, by level. sc/rs pass '' and are never checked. ──
  if (record.type === 'rc' && levelValid) {
    const wordCount = record.passageEn.split(/\s+/).filter((w) => w.length > 0).length;
    const [min, max] = RC_PASSAGE_WORD_RANGE[record.level as 1 | 2 | 3 | 4];
    if (wordCount < min || wordCount > max) reasons.push('passage_length_out_of_range');
  }

  return {
    ok: reasons.length === 0,
    reasons,
    aboveTierWords: [...aboveTierWords].sort(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// T-297ⓓ — `public.amirnet_items` ⇢ the shape the screen already consumes.
//
// ⛔ THIS FUNCTION MAPS. IT ⛔ NEVER REPAIRS, and that is the whole point of putting
// it here rather than inside the route. Every column of `0024_amirnet_items.sql` is
// `not null`, so in a healthy bank none of the nulls below can occur — but PostgREST
// returns whatever the table holds, and a row written before a constraint, or through
// a future nullable column, would arrive half-formed. The honest answer to a missing
// field is an EMPTY one that `isServable()` then refuses (`amirnetQuestion.ts`), ⛔ not
// a default that turns «we do not have this item» into «here is an item».
// ⇒ `explanation_he: null` becomes `''` and the item is dropped; it ⛔ does not become
//   «אין הסבר», which is exactly the `?? 'אין הסבר'` fallback `T-287` already banned.
// ═══════════════════════════════════════════════════════════════════════════════


/**
 * One row of `public.amirnet_items` as PostgREST hands it over. Columns are `41 § 6.5`
 * word for word (`D-212`), plus the two the product cannot serve an item without:
 * `passage_en` (the `rc` passage `AmirnetItemRecord` already carries) and
 * `explanation_he` (`41 § 7` — «משוב מיידי עם הסבר בעברית»; `T-297`ⓓ refuses to serve
 * an item without one).
 */
export interface AmirnetItemRow {
  readonly id: string;
  readonly type: string | null;
  readonly level: number | null;
  readonly stem_en: string | null;
  readonly passage_en: string | null;
  readonly options_en: readonly string[] | null;
  readonly correct_index: number | null;
  readonly distractor_reasons: readonly string[] | null;
  readonly explanation_he: string | null;
  readonly level_rationale: string | null;
  readonly vocab_band: number | null;
  readonly source: string | null;
}

export function toServedItems(rows: readonly AmirnetItemRow[]): readonly AmirnetServedItem[] {
  return rows.map((row) => ({
    id: row.id,
    // ⛔ The cast is the schema's promise (`amirnet_items_type_check`), ⛔ not a guess:
    // a type outside the closed set cannot be written, and a row that somehow carried one
    // would fail `isServable` on its other fields rather than be silently re-typed here.
    type: row.type as AmirnetServedItem['type'],
    level: row.level as AmirnetServedItem['level'],
    stemEn: row.stem_en ?? '',
    passageEn: row.passage_en ?? '',
    optionsEn: row.options_en ?? [],
    // ⛔ `-1` and ⛔ not `0`: a fall-back to 0 marks a learner wrong on a correct answer
    // (`isServable` ⓒ). `-1` is out of range for every options array, so the item is dropped.
    correctIndex: row.correct_index ?? -1,
    explanationHe: row.explanation_he ?? '',
  }));
}
