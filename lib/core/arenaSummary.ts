/**
 * T-180 · `37-arena-spec § 10` — **מה קרה ב-90 השניות.** טהור: ⛔ אפס React, DOM, רשת,
 * `Date.now`, `setTimeout` ו-`requestAnimationFrame`.
 *
 * ⚠️ הקובץ עונה על שאלה **אחת** — *מה קרה* — וקורא אך ורק `BattleState.casts`, ש-`battle.ts`
 * כבר ממלא בכל הטלה (`lib/core/battle.ts:55-60` · `:142-161`). ⛔ הוא ⛔ אינו שואל *מה צריך
 * לקרות עכשיו*: אינווריאנט `37 § 13.1` קובע שהזירה ⛔ אינה כותבת ל-`word_progress` ו⛔ אינה
 * מזיזה SM-2, ולכן כאן ⛔ אין ולו כתיבה אחת. המשתמש לוחץ, ⛔ לא המשחק (אינווריאנט 13.4).
 *
 * ⛔ **«איטית» ⛔ אינו סף שהומצא כאן.** `37 § 5` כבר הכריע: `critical` הוא נכונה מתחת
 * ל-`CRITICAL_MS`, ⇒ «נכונה איטית» היא בדיוק `correct && !critical`. סף שני היה חוק שני,
 * והשני תמיד סוטה.
 */
import type { BattleCast } from './battle';

export interface ArenaSummary {
  /** כמה מילים הוטלו. ⛔ לא גודל הסבב: מילה שלא נענתה ⛔ אינה הטלה. */
  readonly total: number;
  readonly correct: number;
  /** מעוגל למילישניות שלמות. ⛔ 0 כאשר `total === 0` — ⛔ לעולם לא NaN ו⛔ לא חלוקה באפס. */
  readonly meanResponseMs: number;
  /** הרצף הרצוף הארוך ביותר של הטלות נכונות. `37 § 10` שורה 3 («רצף מרבי»). */
  readonly bestStreak: number;
  /** `37 § 5`: נכונה שאינה קריטית — «נכונה איטית» של המפרט עצמו. */
  readonly slow: readonly BattleCast[];
}

export function summarize(casts: readonly BattleCast[]): ArenaSummary {
  let correct = 0;
  let totalMs = 0;
  let bestStreak = 0;
  let run = 0;
  const slow: BattleCast[] = [];

  for (const c of casts) {
    totalMs += c.responseMs;
    if (c.correct) {
      correct += 1;
      run += 1;
      if (run > bestStreak) bestStreak = run;
      if (!c.critical) slow.push(c);
    } else {
      run = 0;
    }
  }

  const total = casts.length;
  return {
    total,
    correct,
    meanResponseMs: total === 0 ? 0 : Math.round(totalMs / total),
    bestStreak,
    slow,
  };
}

/** «1.8 ש׳» — ספרה אחת אחרי הנקודה, יחידה עברית. ⛔ הרכיב ⛔ אינו מפרמט בעצמו. */
export function meanSecondsHe(meanResponseMs: number): string {
  return `${(meanResponseMs / 1000).toFixed(1)} ש׳`;
}
