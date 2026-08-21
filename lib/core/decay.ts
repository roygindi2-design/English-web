/**
 * PURE. No React, no DOM, no clock, no env, no I/O.
 *
 * T-100 · D-043 — «דעיכה חזותית: מקור אמת אחד, ⛔ ולא מנגנון מקביל».
 *
 * ⛔ **אפס עמודה, אפס מיגרציה, אפס שדה מתמיד.** הדרגה נגזרת בזמן הצגה משני
 * שדות SM-2 שכבר קיימים מאז `0005_review_state.sql`. שדה מתמיד היה מקור אמת
 * שני שיסטה, וזו בדיוק התקלה של D-034 (שתי עמודות רמה חלוקות על 125 מתוך 343).
 *
 * ⛔ **והדעיכה אינה:** ⛔ אינה עונש · ⛔ אינה מורידה מונה · ⛔ אינה משנה שום שדה
 * SM-2 · ⛔ אינה משנה את שלוש הספירות של § 4.2ז. מילה שדעכה נשארת «ידועה» —
 * היא **פגה לחזרה**, וזה מה שהמנוע כבר אומר. «ריפוי» הוא תשובה נכונה בחפיסת
 * מנת היום, ⛔ ולא פעולה חדשה.
 *
 * **⛔ ארבע דרגות ⛔ ולא ערך רציף:** אטימות רציפה בלי `style={{}}` (שאין לו ולו
 * מופע אחד בכל components/ ו-app/) הייתה דורשת מחלקת Tailwind שנבנית בזמן ריצה
 * — מחרוזת שה-JIT ⛔ אינו רואה ולכן ⛔ אינו מייצר, כלומר אטימות שלא תגיע לדפדפן.
 *
 * **⛔ והאטימות חלה על `--ink` בלבד:** `--ink-muted` על `--surface-raised` הוא
 * ~7.5:1, ובאטימות 0.6 הוא נופל מתחת ל-4.5:1 — כלומר «היחלשות» של השורה המשנית
 * הייתה שוברת רצפת ניגודיות מוצהרת (`palette.ts` CONTRAST_FLOORS). שתי הטענות
 * האלה נבדקות ב-`decay.test.ts` בחישוב, ⛔ ולא מוצהרות כאן.
 */
export type DecayLevel = 'none' | 'due' | 'late' | 'stale';

export interface DecayInput {
  readonly nowMs: number;
  readonly nextReviewAtMs: number | null;
  readonly intervalDays: number;
}

export const DECAY_LATE_RATIO = 0.5;
export const DECAY_STALE_RATIO = 1;
export const DECAY_LABEL = 'הגיע זמן לחזור';

export const DECAY_OPACITY: Readonly<Record<DecayLevel, number>> = Object.freeze({
  none: 1,
  due: 0.9,
  late: 0.75,
  stale: 0.6,
});

const DAY_MS = 86_400_000;

export function decayLevel(input: DecayInput): DecayLevel {
  const { nowMs, nextReviewAtMs, intervalDays } = input;
  if (!Number.isFinite(nowMs) || !Number.isFinite(intervalDays)) return 'none';
  // מילה שלא תוזמנה ⛔ אינה «לא בזמן» — היא פשוט לא נלמדה עדיין (התקדים הוא
  // `reviewRank` ב-deck.ts, שממיין null לסוף במקום לטפל בו כמועד באפוק 0).
  if (nextReviewAtMs === null || !Number.isFinite(nextReviewAtMs)) return 'none';
  if (intervalDays <= 0) return 'none';

  const overdueMs = nowMs - nextReviewAtMs;
  if (overdueMs <= 0) return 'none';

  const ratio = overdueMs / (intervalDays * DAY_MS);
  if (ratio >= DECAY_STALE_RATIO) return 'stale';
  if (ratio >= DECAY_LATE_RATIO) return 'late';
  return 'due';
}

export function parseReviewAt(value: string | null): number | null {
  if (typeof value !== 'string' || value === '') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * מיזוג אלפא בפשטות של sRGB — בדיוק מה שהדפדפן עושה ל-`opacity` על טקסט מעל
 * רקע אטום. ⛔ hex מקוצר נדחה ⛔ ולא «מתפרש»: הוא היה מתפרש שגוי בשקט, וזו
 * אותה הכרעה בדיוק שקיימת ב-`luminance` (palette.ts).
 */
export function blendOver(hexFg: string, hexBg: string, alpha: number): string {
  if (!HEX.test(hexFg) || !HEX.test(hexBg)) {
    throw new RangeError(`expected two 6-digit hex colours, got "${hexFg}" and "${hexBg}"`);
  }
  const mix = (offset: number): string => {
    const fg = parseInt(hexFg.slice(offset, offset + 2), 16);
    const bg = parseInt(hexBg.slice(offset, offset + 2), 16);
    return Math.round(alpha * fg + (1 - alpha) * bg)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${mix(1)}${mix(3)}${mix(5)}`;
}
