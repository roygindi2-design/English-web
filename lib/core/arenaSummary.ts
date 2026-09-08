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
import { outcomeAt, wordsFromBoss, type BattleCast, type BattleOutcome, type BattleState } from './battle';

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
  /**
   * T-282 · `37 § 10` («פגשת 4 מילים חדשות») · `36 § 12.3` — the casts on `unfiltered`
   * words, first cast per `wordId`, right or wrong: a word the battle put in front of
   * the learner for the first time. ⛔ Read-only: this is what the screen NAMES, ⛔ not
   * what it writes anywhere. The requeued copy of a missed spell is `base` (`battle.ts:216`),
   * so it never counts twice; the `seen` set is the guard for any other duplicate.
   */
  readonly firstMet: readonly BattleCast[];
}

export function summarize(casts: readonly BattleCast[]): ArenaSummary {
  let correct = 0;
  let totalMs = 0;
  let bestStreak = 0;
  let run = 0;
  const slow: BattleCast[] = [];
  const firstMet: BattleCast[] = [];
  const seen = new Set<string>();

  for (const c of casts) {
    totalMs += c.responseMs;
    if (c.kind === 'unfiltered' && !seen.has(c.wordId)) {
      seen.add(c.wordId);
      firstMet.push(c);
    }
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
    firstMet,
  };
}

/** «פגשת 4 מילים חדשות» — the render's own title (`render_video_B.py:637`). ⛔ The component ⛔ does not build the string. ⛔ Never called with 0 — the board is not drawn. */
export function firstMetHe(n: number): string {
  return n === 1 ? 'פגשת מילה אחת חדשה' : `פגשת ${n} מילים חדשות`;
}

/** «1.8 ש׳» — ספרה אחת אחרי הנקודה, יחידה עברית. ⛔ הרכיב ⛔ אינו מפרמט בעצמו. */
export function meanSecondsHe(meanResponseMs: number): string {
  return `${(meanResponseMs / 1000).toFixed(1)} ש׳`;
}

/**
 * T-283 · `37 § 9` ח4 · D-202 § ה׳ — **the ending is three states, ⛔ not a boolean.**
 * `battle.ts:104` already knows `victory` · `survived` · `outlasted`; until T-283 the screen
 * folded the last two into one string. ⛔ `running` is not an ending: `endingOf` returns
 * `null` and the screen never draws a summary for it.
 */
export type ArenaEndingKind = Exclude<BattleOutcome, 'running'>;

export interface ArenaEnding {
  readonly kind: ArenaEndingKind;
  /** `wordsFromBoss(state)` at the end — the number the heading names. `0` on `victory`. */
  readonly wordsFromBoss: number;
}

export function endingOf(state: BattleState, elapsedMs: number): ArenaEnding | null {
  const outcome = outcomeAt(state, elapsedMs);
  if (outcome === 'running') return null;
  return { kind: outcome, wordsFromBoss: wordsFromBoss(state) };
}

/** `37 § 9` ח4, verbatim shape: «היית 2 מילים מהבוס». ⛔ The screen never names a loss as a verdict — only as this number. */
export function wordsFromBossHe(n: number): string {
  return n === 1 ? 'היית מילה אחת מהבוס' : `היית ${n} מילים מהבוס`;
}
