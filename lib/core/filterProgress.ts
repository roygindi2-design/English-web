/**
 * PURE. ⛔ אפס React, DOM, רשת, env ושעון.
 *
 * T-210 · `36 § 5` · D-123 · D-124 — הפס והמונים של מסך הבית של הכרטיסיות.
 *
 * ⚠️ **הקובץ הזה ⛔ אינו סופר דבר.** שלוש הספירות — `known` · `inReviewList` · `unseen` —
 * מוגדרות ב-`lib/core/levelSummary.ts` ו⛔ **אין להן הגדרה שנייה** (§ 4.2ז: «⛔ אין הגדרה
 * שנייה»). מה שכאן הוא **הצגה**: אחוזים לרוחב שלושת מקטעי הפס, התווית שמעליו, ושלושת
 * התאים מתחתיו — כולל הכלל ש-`null` ⛔ אינו `0`.
 *
 * ⛔ **וסדר התאים מוצהר כאן ⛔ ולא ב-JSX.** ‏`36 § 5` קובע «שלושה מונים, RTL ידעתי בימין»,
 * וסדר שמוטבע בסדר האלמנטים במסך הוא סדר שאי-אפשר לבדוק בלי דפדפן. כאן הוא מערך.
 */

export interface LevelSummaryLike {
  readonly totalInLevel: number;
  readonly known: number;
  readonly inReviewList: number;
  readonly unseen: number;
}

export interface FilterProgress {
  readonly knownPct: number;
  readonly unknownPct: number;
  readonly restPct: number;
  readonly filtered: number;
  readonly total: number;
  readonly labelHe: string;
}

export function filterProgress(summary: LevelSummaryLike): FilterProgress {
  const total = summary.totalInLevel;
  const filtered = summary.known + summary.inReviewList;
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`filterProgress: totalInLevel must be a non-negative integer, got ${total}`);
  }
  // אותה שמירה בדיוק ש-`levelSummary.ts` כבר עושה, ומאותה סיבה: פס רחב מהמסילה שלו
  // נראה כמו באג רינדור, וחריגה כאן אומרת את האמת במקום להציג אותה.
  if (filtered > total) {
    throw new RangeError(`filterProgress: filtered ${filtered} exceeds total ${total}`);
  }
  const pct = (n: number): number => (total === 0 ? 0 : (n / total) * 100);
  return {
    knownPct: pct(summary.known),
    unknownPct: pct(summary.inReviewList),
    restPct: pct(summary.unseen),
    filtered,
    total,
    labelHe: `${filtered} / ${total} סוננו`,
  };
}

export type CounterKey = 'known' | 'unknown' | 'unfiltered';

export interface CounterCell {
  readonly key: CounterKey;
  readonly labelHe: string;
  /**
   * ⛔ `null` ⛔ אינו `0`. קריאה שנכשלה ורמה ריקה נראות זהות על המסך ורק אחת מהן נכונה —
   * אותו כלל בדיוק ש-`<DeckSelector>` ו-`<MeScreen>` כבר מקיימים.
   */
  readonly value: number | null;
}

/** סדר RTL, ⛔ מוצהר כאן ו⛔ לא ב-JSX: `36 § 5` קובע «ידעתי» בימין. */
export function counterCells(summary: LevelSummaryLike | null): readonly CounterCell[] {
  return [
    { key: 'known', labelHe: 'ידעתי', value: summary === null ? null : summary.known },
    { key: 'unknown', labelHe: 'לא ידעתי', value: summary === null ? null : summary.inReviewList },
    { key: 'unfiltered', labelHe: 'לא סוננו', value: summary === null ? null : summary.unseen },
  ];
}
