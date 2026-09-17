/**
 * T-360 · `36 § 13.1` חותמת ⓒ — **מה הקרב הקודם השאיר אחריו, ⛔ ולא מה קורה עכשיו.**
 * טהור: ⛔ אפס React, DOM, רשת, `Date.now`, `setTimeout`.
 *
 * 🔬 **מה שנמדד לפני שנכתבה כאן שורה:** הקרב **כבר נשמר**. `planArcadeWrites`
 * (`lib/core/arcadeResult.ts`) כותב ל-`arcade_runs` את `finished_at` · `words_seen` ·
 * `words_correct` · `enemy_defeated` בכל קרב, ו-`0014_arcade.sql:79-80` אפילו בנה את
 * האינדקס `(user_id, finished_at desc)` לקריאה הזאת בדיוק. ⇒ **הפער של חותמת ⓒ ⛔ אינו
 * בשמירה — הוא בקריאה:** מסך הבית הראה `wins` בלבד, ומסלול הבוס ⛔ אינו אומר ללומד
 * **מה קרה לו** בקרב האחרון. ⇒ ⛔ אין כאן מיגרציה, ⛔ אין עמודה חדשה ו⛔ אין כתיבה.
 *
 * ⛔ **ו⛔ אין כאן שעון.** «לפני יומיים» היה דורש `Date.now` — גם טומאה בשכבה הטהורה
 * וגם אי-התאמת הידרציה — ולכן התאריך נגזר מ**קידומת מחרוזת ה-ISO** ומוצג כ-`17.09`.
 * ⛔ דטרמיניסטי, ⛔ ואינו תלוי באזור זמן של הדפדפן.
 *
 * ⛔ **הזירה ⛔ אינה שופטת** (‏`37 § 9` ח4 · R-016): אין כאן «ניצחת» ו⛔ אין «הפסדת» —
 * אותן שתי **עובדות** בדיוק ש-`ArenaSummary` כבר אומר, מילה במילה.
 */

export interface ArenaLastRound {
  /** `arcade_runs.finished_at`, כפי שהוא. ⛔ ⛔ אינו מפורמט כאן — `lastRoundDateHe` עושה זאת. */
  readonly finishedAt: string;
  readonly wordsSeen: number;
  readonly wordsCorrect: number;
  readonly enemyDefeated: boolean;
}

/** `ArenaSummary` `WON_HE`, מילה במילה — ⛔ שתי מחרוזות לאותה עובדה הן שתי אמיתות. */
export const LAST_ROUND_WON_HE = 'היריב נוצח';
/** `ArenaSummary` `SURVIVED_HE`, מילה במילה. ⛔ ⛔ אין כאן מילת הפסד. */
export const LAST_ROUND_SURVIVED_HE = 'היריב החזיק מעמד';
export const LAST_ROUND_HEADING_HE = 'הקרב האחרון';

function isFiniteCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** ‏`YYYY-MM-DD…` — ⛔ הקידומת בלבד, ⛔ ולא `new Date` (אזור זמן ⛔ אינו נתון של השורה). */
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * שורה גולמית מ-`arcade_runs` ⇒ מודל תצוגה, או `null`.
 *
 * ⛔ **`null` ⛔ אינו כישלון:** לומד שטרם קרב ⛔ אין לו שורה, וזו **עובדה נכונה** עליו —
 * בדיוק כמו ברירות המחדל של `0014_arcade.sql` בגוף מסך הבית. ⇒ המסך ⛔ אינו מצייר
 * את הלוח, ⛔ ואינו מצייר לוח ריק.
 *
 * ⛔ **ולידציה מלאה ⛔ ולא cast:** השורה מגיעה מהמאגר, אבל `words_correct > words_seen`
 * או `finished_at` שאינו ISO היו מגיעים ללומד כמספר שקרי — ⛔ ולא כשגיאה שמישהו רואה.
 */
export function lastRoundFromRow(row: unknown): ArenaLastRound | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  if (typeof r.finished_at !== 'string' || !ISO_DATE_RE.test(r.finished_at)) return null;
  if (!isFiniteCount(r.words_seen) || !isFiniteCount(r.words_correct)) return null;
  if (typeof r.enemy_defeated !== 'boolean') return null;
  const wordsSeen = Math.floor(r.words_seen);
  const wordsCorrect = Math.floor(r.words_correct);
  // ‏`arcade_runs_counts_check` אומר את אותו הדבר בסכמה; כאן זה נמדד שוב, כי הנתיב
  // ⛔ אינו רשאי להאמין לשורה שקיבל יותר משהוא מאמין לגוף מלקוח.
  if (wordsCorrect > wordsSeen) return null;
  return { finishedAt: r.finished_at, wordsSeen, wordsCorrect, enemyDefeated: r.enemy_defeated };
}

/** העובדה, ⛔ לא המשפט. */
export function lastRoundOutcomeHe(round: ArenaLastRound): string {
  return round.enemyDefeated ? LAST_ROUND_WON_HE : LAST_ROUND_SURVIVED_HE;
}

/** «14 / 16» — אותה צורה בדיוק של שורת `נכונות` ב-`ArenaSummary`. */
export function lastRoundScoreHe(round: ArenaLastRound): string {
  return `${round.wordsCorrect} / ${round.wordsSeen}`;
}

/** «17.09» — יום.חודש מקידומת ה-ISO. ⛔ ⛔ אינו יחסי ו⛔ אינו קורא שעון. */
export function lastRoundDateHe(round: ArenaLastRound): string {
  const m = ISO_DATE_RE.exec(round.finishedAt);
  // ⛔ ⛔ לא ייתכן: `lastRoundFromRow` כבר דחה מחרוזת שאינה תואמת. השומר קיים כדי
  // שהטיפוס יישאר `string` ⛔ בלי `!` וללא זריקה.
  return m === null ? '' : `${m[3]}.${m[2]}`;
}
